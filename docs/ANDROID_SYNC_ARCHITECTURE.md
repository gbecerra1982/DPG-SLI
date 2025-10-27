# 📱 ARQUITECTURA DE SINCRONIZACIÓN ANDROID - COSMOS DB

## 🎯 OBJETIVO

Diseñar una arquitectura **offline-first** para app Android que permita a cada repartidor:
- ✅ Trabajar completamente sin conexión
- ✅ Sincronizar solo SUS datos relevantes (no toda la base de datos)
- ✅ Subir scans, fotos y actualizaciones de estado
- ✅ Resolver conflictos automáticamente
- ✅ Minimizar uso de datos móviles

---

## 🏗️ ARQUITECTURA GENERAL

```
┌────────────────────────────────────────────────────────┐
│              ANDROID APP (Por Repartidor)              │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   UI Layer   │────────▶│  ViewModel   │            │
│  └──────────────┘         └──────────────┘            │
│                                  │                      │
│                                  ▼                      │
│         ┌───────────────────────────────────┐          │
│         │   Repository (Single Source)      │          │
│         └───────────────────────────────────┘          │
│                   │                │                    │
│          ┌────────┴────────┐      │                    │
│          ▼                 ▼       ▼                    │
│  ┌─────────────┐  ┌─────────────┐ ┌──────────────┐   │
│  │   SQLite    │  │ Sync Queue  │ │ Media Cache  │   │
│  │  Local DB   │  │  Manager    │ │  (Images)    │   │
│  └─────────────┘  └─────────────┘ └──────────────┘   │
│          │                 │              │            │
└──────────┼─────────────────┼──────────────┼───────────┘
           │                 │              │
           │    ┌────────────┴──────┐       │
           │    │                   │       │
           ▼    ▼                   ▼       ▼
    ┌──────────────────────────────────────────────┐
    │         SYNC SERVICE (Background)            │
    │  ┌────────────┐  ┌───────────┐             │
    │  │ WorkManager│  │  Retrofit │             │
    │  └────────────┘  └───────────┘             │
    └──────────────────────────────────────────────┘
                      │
                      ▼
         ═══════════════════════════
              INTERNET (3G/4G/5G)
         ═══════════════════════════
                      │
                      ▼
    ┌──────────────────────────────────────────────┐
    │          AZURE CLOUD BACKEND                  │
    │  ┌──────────────┐  ┌──────────────┐         │
    │  │    Azure     │  │ Blob Storage │         │
    │  │  Functions   │  │   (Images)   │         │
    │  └──────────────┘  └──────────────┘         │
    │         │                  │                  │
    │         ▼                  │                  │
    │  ┌──────────────┐          │                 │
    │  │  Cosmos DB   │◀─────────┘                 │
    │  │   (Global)   │                            │
    │  └──────────────┘                            │
    └──────────────────────────────────────────────┘
```

---

## 💾 BASE DE DATOS LOCAL (SQLite)

### Schema SQLite para Android

#### Tabla: driver_profile
```sql
CREATE TABLE driver_profile (
    driver_id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    sub_logistics_id TEXT NOT NULL,
    sub_logistics_name TEXT,
    assigned_zones TEXT, -- JSON array
    vehicle_type TEXT,
    license_plate TEXT,
    status TEXT DEFAULT 'active',
    profile_photo_local_path TEXT,
    profile_photo_url TEXT,
    last_sync_timestamp TEXT,
    updated_at TEXT NOT NULL,
    _version INTEGER DEFAULT 1
);
```

#### Tabla: packages
```sql
CREATE TABLE packages (
    package_id TEXT PRIMARY KEY,
    tracking_number TEXT NOT NULL,
    zone_id TEXT NOT NULL,

    -- Destination
    recipient_name TEXT,
    recipient_phone TEXT,
    recipient_dni TEXT,
    address_street TEXT NOT NULL,
    address_floor TEXT,
    address_apartment TEXT,
    address_city TEXT,
    address_neighborhood TEXT,
    address_coordinates_lat REAL,
    address_coordinates_lng REAL,
    delivery_instructions TEXT,

    -- Package details
    description TEXT,
    declared_value REAL,
    weight REAL,
    requires_signature INTEGER DEFAULT 0, -- Boolean
    priority TEXT DEFAULT 'standard',

    -- Status
    current_status TEXT NOT NULL,
    status_timestamp TEXT NOT NULL,
    estimated_delivery_time TEXT,

    -- Assignment
    route_id TEXT,
    sequence_number INTEGER,

    -- Financials
    driver_commission REAL DEFAULT 0.0,
    zone_bonus REAL DEFAULT 0.0,

    -- Sync metadata
    is_synced INTEGER DEFAULT 0,
    needs_upload INTEGER DEFAULT 0,
    last_modified_local TEXT NOT NULL,
    last_sync_timestamp TEXT,
    _version INTEGER DEFAULT 1,

    -- Full JSON backup (para datos no críticos)
    full_data_json TEXT,

    FOREIGN KEY (route_id) REFERENCES routes(route_id)
);

CREATE INDEX idx_packages_status ON packages(current_status);
CREATE INDEX idx_packages_route ON packages(route_id, sequence_number);
CREATE INDEX idx_packages_sync ON packages(is_synced, needs_upload);
CREATE INDEX idx_packages_zone ON packages(zone_id);
```

#### Tabla: routes
```sql
CREATE TABLE routes (
    route_id TEXT PRIMARY KEY,
    route_date TEXT NOT NULL,
    route_name TEXT,
    zone_id TEXT NOT NULL,
    shift TEXT, -- 'morning', 'afternoon', 'evening'
    status TEXT DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed'

    -- Timing
    start_time TEXT,
    end_time TEXT,
    estimated_duration INTEGER, -- minutes

    -- Performance
    total_packages INTEGER DEFAULT 0,
    delivered_packages INTEGER DEFAULT 0,
    failed_packages INTEGER DEFAULT 0,

    -- Sync
    is_synced INTEGER DEFAULT 0,
    needs_upload INTEGER DEFAULT 0,
    last_modified_local TEXT NOT NULL,
    last_sync_timestamp TEXT,
    _version INTEGER DEFAULT 1,

    full_data_json TEXT
);

CREATE INDEX idx_routes_date ON routes(route_date, status);
CREATE INDEX idx_routes_sync ON routes(is_synced, needs_upload);
```

#### Tabla: scans
```sql
CREATE TABLE scans (
    scan_id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    scan_type TEXT DEFAULT 'label_capture', -- 'label_capture', 'proof_of_delivery'

    -- Scan info
    scan_timestamp TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    accuracy REAL,

    -- Image data
    local_image_path TEXT NOT NULL, -- Ruta local temporal
    image_uploaded INTEGER DEFAULT 0, -- Boolean
    blob_url TEXT, -- URL en Blob Storage una vez subido
    thumbnail_local_path TEXT,
    image_size_bytes INTEGER,

    -- OCR data (si se procesó localmente)
    ocr_processed INTEGER DEFAULT 0,
    ocr_confidence REAL,
    extracted_data_json TEXT, -- JSON con campos extraídos

    -- Sync
    is_synced INTEGER DEFAULT 0,
    upload_attempts INTEGER DEFAULT 0,
    last_upload_attempt TEXT,
    error_message TEXT,
    last_sync_timestamp TEXT,

    FOREIGN KEY (package_id) REFERENCES packages(package_id)
);

CREATE INDEX idx_scans_package ON scans(package_id);
CREATE INDEX idx_scans_upload ON scans(image_uploaded, is_synced);
CREATE INDEX idx_scans_timestamp ON scans(scan_timestamp DESC);
```

#### Tabla: status_history
```sql
CREATE TABLE status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    notes TEXT,

    -- Proof of delivery specific
    proof_signature_local_path TEXT,
    proof_photo_local_path TEXT,
    proof_recipient_name TEXT,
    proof_recipient_dni TEXT,
    proof_recipient_relation TEXT, -- 'destinatario', 'familiar', 'vecino', 'portero', 'otro'
    proof_recipient_custom TEXT, -- Texto libre si selecciona 'otro'

    -- Foto del receptor con el paquete
    proof_receiver_photo_local_path TEXT,
    proof_receiver_photo_uploaded INTEGER DEFAULT 0,
    proof_receiver_photo_blob_url TEXT,

    -- Sync
    is_synced INTEGER DEFAULT 0,
    needs_upload INTEGER DEFAULT 0,
    last_sync_timestamp TEXT,

    FOREIGN KEY (package_id) REFERENCES packages(package_id)
);

CREATE INDEX idx_status_package ON status_history(package_id, timestamp DESC);
CREATE INDEX idx_status_sync ON status_history(is_synced, needs_upload);
```

#### Tabla: gps_tracking
```sql
CREATE TABLE gps_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL,
    speed REAL, -- km/h
    bearing REAL, -- degrees
    event_type TEXT, -- 'location_update', 'arrived', 'departed'

    -- Batch upload
    is_synced INTEGER DEFAULT 0,
    batch_id TEXT,

    FOREIGN KEY (route_id) REFERENCES routes(route_id)
);

CREATE INDEX idx_gps_route ON gps_tracking(route_id, timestamp);
CREATE INDEX idx_gps_sync ON gps_tracking(is_synced);
```

#### Tabla: sync_queue
```sql
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL, -- 'upload_scan', 'update_package_status', 'upload_pod', 'upload_gps'
    entity_type TEXT NOT NULL, -- 'package', 'scan', 'status', 'gps'
    entity_id TEXT NOT NULL,
    payload_json TEXT NOT NULL, -- JSON con los datos a sincronizar

    -- Priority
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)

    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    last_attempt_timestamp TEXT,
    error_message TEXT,

    -- Timestamps
    created_at TEXT NOT NULL,
    completed_at TEXT
);

CREATE INDEX idx_sync_queue_status ON sync_queue(status, priority, created_at);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
```

#### Tabla: sync_metadata
```sql
CREATE TABLE sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Keys importantes:
-- 'last_full_sync_timestamp'
-- 'last_packages_sync_timestamp'
-- 'last_routes_sync_timestamp'
-- 'last_successful_upload_timestamp'
-- 'pending_uploads_count'
-- 'driver_id'
-- 'sync_enabled'
```

---

## 🔄 ESTRATEGIA DE SINCRONIZACIÓN

### 1. SINCRONIZACIÓN DESCENDENTE (Download/Pull)

**Objetivo**: Obtener datos actualizados desde Cosmos DB hacia el dispositivo del repartidor.

#### API Endpoint: GET /api/sync/driver/{driverId}/download

**Request:**
```http
GET /api/sync/driver/drv_12345/download?since=2025-10-27T10:00:00Z
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `since`: Timestamp de última sincronización (ISO 8601)
- `include`: Tipos de datos a incluir (packages, routes, config) - opcional

**Response:**
```json
{
  "success": true,
  "syncTimestamp": "2025-10-27T15:30:00Z",
  "driverInfo": {
    "driverId": "drv_12345",
    "firstName": "Juan Carlos",
    "lastName": "Rodríguez",
    "subLogisticsId": "org_001",
    "assignedZones": ["caba", "belgrano", "palermo"],
    "currentStatus": {
      "status": "active",
      "lastLocation": {
        "lat": -34.5875,
        "lng": -58.3974,
        "timestamp": "2025-10-27T15:25:00Z"
      }
    }
  },
  "packages": {
    "new": [
      {
        "packageId": "pkg_20251027_0123",
        "trackingNumber": "CAN-20251027-0123",
        "zoneId": "caba",
        "destination": {
          "recipient": {
            "name": "Carlos López",
            "phone": "+54 9 11 5555-6789"
          },
          "address": {
            "street": "Av. Corrientes 1234",
            "floor": "5",
            "apartment": "A",
            "city": "CABA",
            "coordinates": {
              "lat": -34.6037,
              "lng": -58.3816
            },
            "instructions": "Portero eléctrico 5A"
          }
        },
        "packageDetails": {
          "description": "Electrónica",
          "declaredValue": 125000.00,
          "weight": 1.5,
          "requiresSignature": true,
          "priority": "standard"
        },
        "status": {
          "current": "assigned_to_driver",
          "timestamp": "2025-10-27T14:00:00Z"
        },
        "assignment": {
          "routeId": "route_20251027_003",
          "sequenceNumber": 5,
          "estimatedDeliveryTime": "2025-10-27T16:30:00Z"
        },
        "financials": {
          "driverCommission": 150.00,
          "zoneBonus": 50.00
        }
      }
    ],
    "updated": [
      {
        "packageId": "pkg_20251027_0089",
        "changes": {
          "destination.address.instructions": "ACTUALIZADO: Dejar en recepción si no hay nadie",
          "assignment.estimatedDeliveryTime": "2025-10-27T17:00:00Z"
        },
        "version": 2
      }
    ],
    "removed": [
      {
        "packageId": "pkg_20251027_0045",
        "reason": "cancelled_by_sender"
      }
    ]
  },
  "routes": {
    "active": [
      {
        "routeId": "route_20251027_003",
        "routeDate": "2025-10-27",
        "routeName": "CABA Centro - Tarde",
        "zoneId": "caba",
        "shift": "afternoon",
        "status": "assigned",
        "estimatedDuration": 180,
        "totalPackages": 12,
        "packages": [
          {
            "sequenceNumber": 1,
            "packageId": "pkg_20251027_0101",
            "address": "Belgrano 2958",
            "estimatedArrival": "2025-10-27T14:30:00Z"
          },
          {
            "sequenceNumber": 2,
            "packageId": "pkg_20251027_0105",
            "address": "Santa Fe 1955",
            "estimatedArrival": "2025-10-27T15:00:00Z"
          }
        ]
      }
    ]
  },
  "config": {
    "commissionRules": {
      "perPackage": 150.00,
      "perKm": 25.00,
      "zoneBonuses": {
        "caba": 50.00,
        "belgrano": 50.00,
        "palermo": 50.00
      }
    },
    "syncInterval": 300, // seconds
    "gpsTrackingInterval": 60 // seconds
  },
  "serverInstructions": {
    "forceFullSync": false,
    "clearLocalCache": false,
    "minAppVersion": "2.3.0"
  }
}
```

**Lógica de Procesamiento en Android:**
```kotlin
suspend fun processSyncDownload(response: SyncDownloadResponse) {
    database.withTransaction {
        // 1. Actualizar driver info
        driverDao.upsert(response.driverInfo)

        // 2. Insertar paquetes nuevos
        response.packages.new.forEach { pkg ->
            packageDao.insert(pkg.toLocalEntity())
        }

        // 3. Actualizar paquetes modificados
        response.packages.updated.forEach { update ->
            packageDao.updateFields(update.packageId, update.changes)
        }

        // 4. Marcar paquetes eliminados
        response.packages.removed.forEach { removed ->
            packageDao.markAsRemoved(removed.packageId, removed.reason)
        }

        // 5. Actualizar rutas
        response.routes.active.forEach { route ->
            routeDao.upsert(route.toLocalEntity())
        }

        // 6. Guardar timestamp de sincronización
        syncMetadataDao.update("last_packages_sync_timestamp", response.syncTimestamp)
    }
}
```

---

### 2. SINCRONIZACIÓN ASCENDENTE (Upload/Push)

**Objetivo**: Enviar cambios locales desde el dispositivo hacia Cosmos DB.

#### API Endpoint: POST /api/sync/driver/{driverId}/upload

**Request:**
```http
POST /api/sync/driver/drv_12345/upload
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceInfo": {
    "deviceId": "device_android_005",
    "model": "Samsung Galaxy A54",
    "os": "Android 14",
    "appVersion": "2.3.1"
  },
  "syncTimestamp": "2025-10-27T15:35:00Z",

  "packageStatusUpdates": [
    {
      "packageId": "pkg_20251027_0089",
      "newStatus": "delivered",
      "timestamp": "2025-10-27T15:20:00Z",
      "location": {
        "lat": -34.6037,
        "lng": -58.3816,
        "accuracy": 10
      },
      "notes": "Entregado en mano a destinatario",
      "proofOfDelivery": {
        "recipientName": "Carlos López",
        "recipientDni": "32123456",
        "recipientRelation": "destinatario", // 'destinatario', 'familiar', 'vecino', 'portero', 'otro'
        "recipientCustom": null, // Solo si relation = 'otro'
        "signatureBlobName": "pod/sig_pkg_20251027_0089.jpg",
        "receiverPhotoBlobName": "pod/receiver_pkg_20251027_0089.jpg", // NUEVO: Foto del receptor con paquete
        "packagePhotoBlobName": "pod/photo_pkg_20251027_0089.jpg" // Foto del paquete entregado
      },
      "localVersion": 3,
      "lastModifiedLocal": "2025-10-27T15:20:05Z"
    },
    {
      "packageId": "pkg_20251027_0101",
      "newStatus": "failed",
      "timestamp": "2025-10-27T14:45:00Z",
      "location": {
        "lat": -34.5614,
        "lng": -58.4565,
        "accuracy": 15
      },
      "notes": "Destinatario ausente, portero no acepta paquete",
      "failureReason": "recipient_unavailable",
      "attemptNumber": 1,
      "rescheduleRequested": true,
      "incidentPhotoBlobName": "incidents/inc_pkg_20251027_0101_01.jpg"
    }
  ],

  "scans": [
    {
      "scanId": "scn_20251027_local_001",
      "packageId": "pkg_20251027_0123",
      "scanType": "label_capture",
      "scanTimestamp": "2025-10-27T13:15:00Z",
      "location": {
        "lat": -34.6158,
        "lng": -58.4707,
        "accuracy": 8
      },
      "imageBlobName": "scans/original/scn_20251027_local_001_original.jpg",
      "imageSize": 2457600,
      "thumbnailBlobName": "scans/thumbnails/scn_20251027_local_001_thumb.jpg",
      "ocrData": {
        "processed": true,
        "confidence": 0.92,
        "extractedFields": {
          "recipient": "Carlos López",
          "phone": "11-5555-6789",
          "address": "Av. Corrientes 1234, 5°A",
          "declaredValue": "125000"
        }
      }
    }
  ],

  "gpsTracking": [
    {
      "routeId": "route_20251027_003",
      "timestamp": "2025-10-27T13:00:00Z",
      "lat": -34.6158,
      "lng": -58.4707,
      "accuracy": 10,
      "speed": 0,
      "eventType": "route_started"
    },
    {
      "routeId": "route_20251027_003",
      "timestamp": "2025-10-27T13:15:00Z",
      "lat": -34.6125,
      "lng": -58.4680,
      "accuracy": 8,
      "speed": 25,
      "eventType": "location_update"
    },
    {
      "routeId": "route_20251027_003",
      "timestamp": "2025-10-27T13:18:00Z",
      "lat": -34.6037,
      "lng": -58.3816,
      "accuracy": 5,
      "speed": 0,
      "eventType": "arrived_at_stop"
    }
  ],

  "routeUpdates": [
    {
      "routeId": "route_20251027_003",
      "status": "in_progress",
      "startTime": "2025-10-27T13:00:00Z",
      "deliveredPackages": 3,
      "failedPackages": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "syncTimestamp": "2025-10-27T15:35:10Z",
  "processedItems": {
    "packageStatusUpdates": {
      "success": 2,
      "failed": 0,
      "conflicts": 0
    },
    "scans": {
      "success": 1,
      "failed": 0
    },
    "gpsTracking": {
      "success": 3,
      "failed": 0
    },
    "routeUpdates": {
      "success": 1,
      "failed": 0
    }
  },
  "conflicts": [],
  "errors": [],
  "instructions": {
    "resyncRequired": false,
    "packagesToUpdate": []
  }
}
```

**Respuesta con Conflictos:**
```json
{
  "success": true,
  "syncTimestamp": "2025-10-27T15:35:10Z",
  "processedItems": {
    "packageStatusUpdates": {
      "success": 1,
      "failed": 0,
      "conflicts": 1
    }
  },
  "conflicts": [
    {
      "entityType": "package",
      "entityId": "pkg_20251027_0089",
      "conflictReason": "version_mismatch",
      "localVersion": 3,
      "serverVersion": 5,
      "resolution": "server_wins",
      "message": "El paquete fue actualizado desde otro dispositivo. Se utilizó la versión del servidor.",
      "serverData": {
        "packageId": "pkg_20251027_0089",
        "status": {
          "current": "cancelled",
          "timestamp": "2025-10-27T15:10:00Z",
          "reason": "cancelled_by_sender"
        },
        "version": 5
      },
      "action": "update_local"
    }
  ],
  "errors": [],
  "instructions": {
    "resyncRequired": false,
    "packagesToUpdate": ["pkg_20251027_0089"]
  }
}
```

---

### 3. UPLOAD DE IMÁGENES A BLOB STORAGE

**Flujo:**
1. Repartidor captura foto (etiqueta, prueba de entrega)
2. Foto se guarda localmente en SQLite con path local
3. Background worker solicita SAS Token temporal a backend
4. Sube foto directamente a Azure Blob Storage con SAS Token
5. Una vez subida, actualiza registro en SQLite con URL de blob
6. En próxima sincronización, envía metadata (sin imagen) a Cosmos DB

#### API Endpoint: POST /api/sync/driver/{driverId}/request-upload-token

**Request:**
```http
POST /api/sync/driver/drv_12345/request-upload-token
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "files": [
    {
      "fileId": "scn_20251027_local_001_original",
      "fileType": "scan_original",
      "contentType": "image/jpeg",
      "sizeBytes": 2457600,
      "relatedEntityType": "scan",
      "relatedEntityId": "scn_20251027_local_001"
    },
    {
      "fileId": "scn_20251027_local_001_thumb",
      "fileType": "scan_thumbnail",
      "contentType": "image/jpeg",
      "sizeBytes": 45678,
      "relatedEntityType": "scan",
      "relatedEntityId": "scn_20251027_local_001"
    },
    {
      "fileId": "pod_sig_pkg_20251027_0089",
      "fileType": "proof_signature",
      "contentType": "image/jpeg",
      "sizeBytes": 156789,
      "relatedEntityType": "package",
      "relatedEntityId": "pkg_20251027_0089"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "uploadTokens": [
    {
      "fileId": "scn_20251027_local_001_original",
      "uploadUrl": "https://storagelpg.blob.core.windows.net/scans/original/scn_20251027_local_001_original.jpg?sv=2023-11-03&ss=b&srt=o&sp=w&se=2025-10-27T16:35:00Z&sig=...",
      "method": "PUT",
      "headers": {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": "image/jpeg"
      },
      "expiresAt": "2025-10-27T16:35:00Z",
      "blobName": "scans/original/scn_20251027_local_001_original.jpg",
      "finalUrl": "https://storagelpg.blob.core.windows.net/scans/original/scn_20251027_local_001_original.jpg"
    },
    {
      "fileId": "scn_20251027_local_001_thumb",
      "uploadUrl": "https://storagelpg.blob.core.windows.net/scans/thumbnails/scn_20251027_local_001_thumb.jpg?sv=2023-11-03&ss=b&srt=o&sp=w&se=2025-10-27T16:35:00Z&sig=...",
      "method": "PUT",
      "headers": {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": "image/jpeg"
      },
      "expiresAt": "2025-10-27T16:35:00Z",
      "blobName": "scans/thumbnails/scn_20251027_local_001_thumb.jpg",
      "finalUrl": "https://storagelpg.blob.core.windows.net/scans/thumbnails/scn_20251027_local_001_thumb.jpg"
    }
  ]
}
```

**Código Android para Upload:**
```kotlin
suspend fun uploadImageToBlob(
    localFilePath: String,
    uploadUrl: String,
    contentType: String
): Result<String> {
    return try {
        val file = File(localFilePath)
        val requestBody = file.asRequestBody(contentType.toMediaType())

        val request = Request.Builder()
            .url(uploadUrl)
            .put(requestBody)
            .addHeader("x-ms-blob-type", "BlockBlob")
            .addHeader("Content-Type", contentType)
            .build()

        val response = httpClient.newCall(request).execute()

        if (response.isSuccessful) {
            // Extraer URL final del blob (sin SAS token)
            val finalUrl = uploadUrl.substringBefore("?")
            Result.success(finalUrl)
        } else {
            Result.failure(Exception("Upload failed: ${response.code}"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }
}
```

---

## ⚙️ LÓGICA DE SINCRONIZACIÓN EN ANDROID

### WorkManager Configuration

```kotlin
class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            // 1. Check network connectivity
            if (!isNetworkAvailable()) {
                return Result.retry()
            }

            // 2. Perform upload (priority)
            val uploadResult = performUploadSync()

            // 3. Perform download
            val downloadResult = performDownloadSync()

            // 4. Upload pending images
            val imageUploadResult = uploadPendingImages()

            if (uploadResult && downloadResult && imageUploadResult) {
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }

    private suspend fun performUploadSync(): Boolean {
        // Get all pending items from sync_queue
        val pendingItems = database.syncQueueDao.getPendingItems()

        if (pendingItems.isEmpty()) return true

        // Build upload payload
        val uploadPayload = buildUploadPayload(pendingItems)

        // Send to server
        val response = apiService.uploadSync(driverId, uploadPayload)

        if (response.isSuccessful) {
            val body = response.body()!!

            // Mark items as synced
            database.withTransaction {
                pendingItems.forEach { item ->
                    syncQueueDao.markAsCompleted(item.id)
                }

                // Handle conflicts
                body.conflicts.forEach { conflict ->
                    resolveConflict(conflict)
                }
            }

            return true
        }

        return false
    }

    private suspend fun performDownloadSync(): Boolean {
        val lastSyncTimestamp = syncMetadataDao.get("last_packages_sync_timestamp")

        val response = apiService.downloadSync(
            driverId = driverId,
            since = lastSyncTimestamp
        )

        if (response.isSuccessful) {
            val body = response.body()!!
            processSyncDownload(body)
            return true
        }

        return false
    }

    private suspend fun uploadPendingImages(): Boolean {
        // Get scans with images not uploaded
        val pendingScans = database.scanDao.getPendingUploads()

        if (pendingScans.isEmpty()) return true

        // Request upload tokens
        val tokenRequest = buildUploadTokenRequest(pendingScans)
        val tokenResponse = apiService.requestUploadTokens(driverId, tokenRequest)

        if (!tokenResponse.isSuccessful) return false

        val tokens = tokenResponse.body()!!.uploadTokens

        // Upload each image
        var allSuccess = true
        tokens.forEach { token ->
            val scan = pendingScans.find { it.scanId == token.fileId.substringBefore("_") }
            if (scan != null) {
                val uploadResult = uploadImageToBlob(
                    scan.localImagePath,
                    token.uploadUrl,
                    "image/jpeg"
                )

                if (uploadResult.isSuccess) {
                    database.scanDao.markAsUploaded(scan.scanId, token.finalUrl)
                } else {
                    allSuccess = false
                }
            }
        }

        return allSuccess
    }

    private fun resolveConflict(conflict: SyncConflict) {
        when (conflict.resolution) {
            "server_wins" -> {
                // Update local data with server version
                when (conflict.entityType) {
                    "package" -> {
                        packageDao.updateWithServerData(
                            conflict.entityId,
                            conflict.serverData
                        )
                    }
                }
            }
            "client_wins" -> {
                // Keep local version, server accepted it
                // No action needed
            }
            "manual_review" -> {
                // Flag for user review
                conflictDao.insert(conflict)
            }
        }
    }
}
```

### Scheduling Sync Work

```kotlin
fun scheduleSyncWork(context: Context) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    // Periodic sync every 15 minutes
    val periodicSyncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
        repeatInterval = 15,
        repeatIntervalTimeUnit = TimeUnit.MINUTES
    )
        .setConstraints(constraints)
        .setBackoffCriteria(
            BackoffPolicy.EXPONENTIAL,
            WorkRequest.MIN_BACKOFF_MILLIS,
            TimeUnit.MILLISECONDS
        )
        .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "periodic_sync",
        ExistingPeriodicWorkPolicy.KEEP,
        periodicSyncRequest
    )
}

fun triggerImmediateSync(context: Context) {
    val immediateSyncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
        .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
        .build()

    WorkManager.getInstance(context).enqueueUniqueWork(
        "immediate_sync",
        ExistingWorkPolicy.REPLACE,
        immediateSyncRequest
    )
}
```

---

## 🔧 RESOLUCIÓN DE CONFLICTOS

### Estrategias de Resolución

#### 1. Last-Write-Wins (Default)
```kotlin
fun resolveConflictLastWriteWins(
    localData: Package,
    serverData: Package
): Package {
    return if (localData.lastModifiedLocal > serverData.updatedAt) {
        // Local is newer, keep local and flag for upload
        localData.copy(needsUpload = true)
    } else {
        // Server is newer, accept server version
        serverData.copy(
            issynced = true,
            lastSyncTimestamp = Clock.System.now().toString()
        )
    }
}
```

#### 2. Server-Wins (Para Estados Críticos)
```kotlin
fun resolveConflictServerWins(
    localData: Package,
    serverData: Package
): Package {
    // Para estados críticos (cancelled, returned), servidor siempre gana
    if (serverData.currentStatus in listOf("cancelled", "returned", "lost")) {
        return serverData.copy(
            isSynced = true,
            lastSyncTimestamp = Clock.System.now().toString()
        )
    }

    return resolveConflictLastWriteWins(localData, serverData)
}
```

#### 3. Merge (Para Campos Independientes)
```kotlin
fun resolveConflictMerge(
    localData: Package,
    serverData: Package
): Package {
    // Merge: Tomar lo mejor de ambos
    return Package(
        packageId = serverData.packageId,

        // Status: Usar el más reciente
        currentStatus = if (localData.statusTimestamp > serverData.statusTimestamp)
            localData.currentStatus else serverData.currentStatus,
        statusTimestamp = maxOf(localData.statusTimestamp, serverData.statusTimestamp),

        // Destination: Preferir servidor (puede haber sido actualizado)
        destination = serverData.destination,

        // Notes: Concatenar si ambos tienen
        notes = "${localData.notes}\n${serverData.notes}".trim(),

        // Version: Incrementar
        version = maxOf(localData.version, serverData.version) + 1,

        // Sync metadata
        isSynced = true,
        needsUpload = false,
        lastSyncTimestamp = Clock.System.now().toString()
    )
}
```

---

## 📊 DATOS QUE COSMOS DB DEBE PREPARAR POR REPARTIDOR

### Consulta Optimizada para Sincronización

```sql
-- Query para obtener paquetes de un repartidor (últimos 7 días + activos)
SELECT *
FROM packages p
WHERE p.assignment.driverId = @driverId
  AND (
    p.status.current IN ('assigned', 'out_for_delivery', 'delivery_attempted')
    OR p.status.timestamp >= @since
    OR p.metadata.createdAt >= DateTimeAdd('day', -7, GetCurrentDateTime())
  )
ORDER BY p.assignment.routeId, p.assignment.sequenceNumber

-- Query para obtener rutas activas del repartidor
SELECT *
FROM routes r
WHERE r.assignment.driverId = @driverId
  AND r.routeInfo.routeDate >= DateTimeAdd('day', -1, GetCurrentDateTime())
  AND r.routeInfo.routeDate <= DateTimeAdd('day', 2, GetCurrentDateTime())
  AND r.routeInfo.status IN ('assigned', 'in_progress')

-- Query para configuración del repartidor
SELECT *
FROM drivers d
WHERE d.driverId = @driverId
```

### Datos Mínimos por Repartidor (Optimización)

**Filtros Aplicados:**
1. ✅ Solo paquetes asignados a ese repartidor
2. ✅ Solo rutas del día actual ± 1 día
3. ✅ Solo paquetes de últimos 7 días o estados activos
4. ✅ Sin incluir analytics ni settlements (no necesarios offline)

**Estimación de Tamaño:**
- Repartidor promedio: 15-30 paquetes/día
- Payload por paquete: ~2-3 KB (sin imágenes)
- Payload total sincronización: ~50-100 KB
- Imágenes: Subidas separadamente con SAS tokens

---

## 🚀 FLUJO COMPLETO DE TRABAJO OFFLINE-FIRST

### Scenario: Repartidor en Campo

```
08:00 AM - Inicio de Jornada
├─ App abre → Verifica conectividad
├─ Si hay conexión → Sincronización automática (Pull)
│  └─ Descarga: Paquetes del día + Rutas asignadas
├─ Si NO hay conexión → Usa datos locales del día anterior
└─ Muestra dashboard con ruta del día

09:00 AM - Primera Entrega
├─ Repartidor navega a primera dirección (GPS offline con mapa cache)
├─ Llega a destino → Escanea etiqueta con cámara
│  ├─ Foto guardada localmente (SQLite + File System)
│  ├─ OCR procesado localmente con TensorFlow Lite
│  └─ Datos extraídos guardados en pending_scans
├─ Intenta sincronizar → Sin conexión
│  └─ Item agregado a sync_queue (priority: 3)

09:15 AM - Entrega Exitosa
├─ App muestra pantalla de confirmación de entrega
├─ PASO 1: Seleccionar quién recibe
│  ├─ Opciones en dropdown/radio buttons:
│  │  • Destinatario (nombre pre-cargado del paquete)
│  │  • Familiar
│  │  • Vecino
│  │  • Portero
│  │  • Otro (habilita campo de texto libre)
│  └─ Repartidor selecciona "Familiar"
├─ PASO 2: Ingresar datos del receptor
│  ├─ Nombre: [Campo texto] → "Juan Pérez (hermano)"
│  ├─ DNI: [Campo numérico] → "28123456"
│  └─ Validación básica antes de continuar
├─ PASO 3: Capturar firma
│  ├─ Canvas táctil para firma digital
│  └─ Firma guardada localmente como PNG
├─ PASO 4: Tomar foto del receptor con el paquete
│  ├─ Cámara se abre automáticamente
│  ├─ Instrucción en pantalla: "Foto del receptor con el paquete"
│  ├─ Preview con opción de rehacer
│  └─ Foto guardada localmente (comprimida 70% calidad)
├─ PASO 5: Foto opcional del paquete entregado
│  ├─ Botón "Tomar foto adicional" (opcional)
│  └─ Foto guardada localmente
├─ PASO 6: Confirmar entrega
│  ├─ Resumen en pantalla:
│  │  • Receptor: Juan Pérez (hermano) - DNI 28123456
│  │  • Firma: ✓
│  │  • Foto receptor: ✓
│  │  • Foto paquete: ✓
│  ├─ Botón "Confirmar Entrega"
│  └─ Al confirmar:
│     ├─ Estado del paquete → "delivered" en SQLite
│     ├─ Registro completo en status_history con todos los datos
│     ├─ 3 fotos en cola de upload (firma, receptor, paquete)
│     └─ Item agregado a sync_queue (priority: 1 - HIGH)
├─ Notificación: "Entrega confirmada ✓ Sincronizando..."
├─ App intenta sincronizar → Sin conexión
│  └─ Badge muestra "3 fotos pendientes"
└─ Repartidor continúa con siguiente paquete

12:00 PM - Almuerzo (Zona con WiFi)
├─ Dispositivo detecta conexión WiFi
├─ WorkManager activa SyncWorker automáticamente
├─ Sincronización ascendente (Upload):
│  ├─ 1. Solicita tokens para subir imágenes (8 fotos pendientes)
│  ├─ 2. Sube imágenes a Blob Storage en paralelo
│  ├─ 3. Envía actualizaciones de estados (4 entregas, 1 fallo)
│  ├─ 4. Envía tracking GPS acumulado (120 puntos)
│  └─ ✅ Server confirma recepción
├─ Sincronización descendente (Download):
│  ├─ Recibe 2 nuevos paquetes para la tarde
│  ├─ Recibe actualización de dirección de un paquete
│  └─ ✅ Local DB actualizado
└─ Badge de "sincronizado" se pone verde

14:30 PM - Entrega Fallida
├─ Destinatario ausente
├─ Repartidor toma foto de la puerta cerrada
├─ Marca paquete como "failed" con razón "recipient_unavailable"
├─ Crea incidente con foto adjunta
├─ Todo guardado localmente
└─ Intenta sincronizar → Conexión 3G lenta
   ├─ Upload de foto se encola con priority: 5 (MEDIUM)
   └─ Upload de estado se encola con priority: 2 (HIGH)
   └─ Estado se sincroniza primero, foto queda pendiente

18:00 PM - Fin de Jornada
├─ Repartidor marca ruta como "completed"
├─ Llega a casa con WiFi
├─ Sincronización final automática
│  ├─ Sube últimas fotos pendientes
│  ├─ Sube tracking GPS completo del día
│  ├─ Confirma todas las entregas sincronizadas
│  └─ ✅ sync_queue vacío
└─ Dashboard muestra: "18 entregas, 2 fallos, 100% sincronizado"
```

---

## 📈 MÉTRICAS Y MONITOREO DE SINCRONIZACIÓN

### KPIs de Sincronización

```kotlin
data class SyncMetrics(
    val totalSyncAttempts: Int,
    val successfulSyncs: Int,
    val failedSyncs: Int,
    val averageSyncDuration: Duration,
    val pendingUploads: Int,
    val pendingDownloads: Int,
    val lastSuccessfulSync: Instant?,
    val dataTransferred: Long, // bytes
    val conflictsResolved: Int,
    val syncHealthScore: Float // 0.0 to 1.0
)
```

### Dashboard de Sincronización (Admin)

```sql
-- Repartidores con problemas de sincronización
SELECT
    d.driverId,
    d.driverName,
    d.currentStatus.lastLocation.timestamp as lastSeen,
    DateTimeDiff('minute', d.currentStatus.lastLocation.timestamp, GetCurrentDateTime()) as minutesSinceLastSync,
    d.metadata.lastActiveAt,
    d.metadata.deviceInfo.model,
    d.metadata.appVersion
FROM drivers d
WHERE DateTimeDiff('minute', d.currentStatus.lastLocation.timestamp, GetCurrentDateTime()) > 60
  AND d.employment.status = 'active'
ORDER BY minutesSinceLastSync DESC
```

### Alertas Automáticas

```yaml
Alerts:
  - name: "Driver Offline Too Long"
    condition: "minutesSinceLastSync > 120"
    severity: "warning"
    action: "notify_dispatcher"

  - name: "High Sync Failure Rate"
    condition: "failedSyncs / totalSyncAttempts > 0.2"
    severity: "critical"
    action: "notify_admin"

  - name: "Large Sync Queue"
    condition: "pendingUploads > 50"
    severity: "warning"
    action: "suggest_manual_sync"
```

---

## 🔒 SEGURIDAD Y AUTENTICACIÓN

### JWT Token Management

```kotlin
class AuthManager(private val context: Context) {

    private val secureStorage = EncryptedSharedPreferences.create(
        "auth_prefs",
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveTokens(accessToken: String, refreshToken: String) {
        secureStorage.edit {
            putString("access_token", accessToken)
            putString("refresh_token", refreshToken)
            putLong("token_timestamp", System.currentTimeMillis())
        }
    }

    suspend fun getValidAccessToken(): String? {
        val accessToken = secureStorage.getString("access_token", null)
        val tokenTimestamp = secureStorage.getLong("token_timestamp", 0)

        // Check if token is expired (assuming 1 hour validity)
        val isExpired = System.currentTimeMillis() - tokenTimestamp > 3600_000

        return if (isExpired) {
            refreshAccessToken()
        } else {
            accessToken
        }
    }

    private suspend fun refreshAccessToken(): String? {
        val refreshToken = secureStorage.getString("refresh_token", null) ?: return null

        return try {
            val response = authApiService.refreshToken(refreshToken)
            if (response.isSuccessful) {
                val newAccessToken = response.body()!!.accessToken
                val newRefreshToken = response.body()!!.refreshToken
                saveTokens(newAccessToken, newRefreshToken)
                newAccessToken
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}
```

### Request Interceptor

```kotlin
class AuthInterceptor(private val authManager: AuthManager) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        val accessToken = runBlocking { authManager.getValidAccessToken() }

        val authenticatedRequest = if (accessToken != null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $accessToken")
                .build()
        } else {
            originalRequest
        }

        return chain.proceed(authenticatedRequest)
    }
}
```

---

## 📱 UI FLOW DETALLADO: CONFIRMACIÓN DE ENTREGA EN ANDROID

### Pantalla 1: Resumen del Paquete
```
┌─────────────────────────────────────┐
│  ← Paquete CAN-20251027-0089        │
├─────────────────────────────────────┤
│                                     │
│  📦 Información del Paquete         │
│  ─────────────────────────────      │
│  Destinatario: Carlos López         │
│  Dirección: Av. Corrientes 1234, 5A │
│  DNI esperado: 32123456             │
│  Valor: $125,000                    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   CONFIRMAR ENTREGA           │ │
│  └───────────────────────────────┘ │
│                                     │
│  [  REPORTAR PROBLEMA  ]            │
└─────────────────────────────────────┘
```

### Pantalla 2: Datos del Receptor
```
┌─────────────────────────────────────┐
│  ← Confirmar Entrega      [1/5]     │
├─────────────────────────────────────┤
│                                     │
│  ¿Quién recibe el paquete?          │
│                                     │
│  ◉ Destinatario                     │
│     (Carlos López - DNI 32123456)   │
│                                     │
│  ○ Familiar                         │
│  ○ Vecino                           │
│  ○ Portero/Encargado                │
│  ○ Otro                             │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Nombre completo:                   │
│  ┌───────────────────────────────┐ │
│  │ Carlos López                  │ │
│  └───────────────────────────────┘ │
│                                     │
│  DNI: (opcional)                    │
│  ┌───────────────────────────────┐ │
│  │ 32123456                      │ │
│  └───────────────────────────────┘ │
│                                     │
│          [  SIGUIENTE  ]            │
└─────────────────────────────────────┘
```

Si selecciona "Otro":
```
┌─────────────────────────────────────┐
│  ○ Otro                             │
│                                     │
│  Especificar:                       │
│  ┌───────────────────────────────┐ │
│  │ Empresa de seguridad          │ │
│  └───────────────────────────────┘ │
│                                     │
│  Nombre completo:                   │
│  ┌───────────────────────────────┐ │
│  │ Juan Ramírez                  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Pantalla 3: Captura de Firma
```
┌─────────────────────────────────────┐
│  ← Confirmar Entrega      [2/5]     │
├─────────────────────────────────────┤
│                                     │
│  Firma del receptor                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │      [Área de firma táctil]   │ │
│  │                               │ │
│  │         ___                   │ │
│  │        /   \___               │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  Receptor: Carlos López             │
│  DNI: 32123456                      │
│                                     │
│  [ LIMPIAR ]      [  SIGUIENTE  ]   │
└─────────────────────────────────────┘
```

### Pantalla 4: Foto del Receptor con Paquete
```
┌─────────────────────────────────────┐
│  ← Confirmar Entrega      [3/5]     │
├─────────────────────────────────────┤
│                                     │
│  📸 Foto del receptor con paquete   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │     [Vista de cámara]         │ │
│  │                               │ │
│  │        📷                     │ │
│  │                               │ │
│  │  Asegúrate de que se vean:    │ │
│  │  • El rostro del receptor     │ │
│  │  • El paquete en sus manos    │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│       [  TOMAR FOTO  ]              │
│                                     │
│  💡 La foto es obligatoria          │
└─────────────────────────────────────┘
```

Después de capturar:
```
┌─────────────────────────────────────┐
│  ← Confirmar Entrega      [3/5]     │
├─────────────────────────────────────┤
│                                     │
│  ✓ Foto capturada                   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │    [Preview de la foto]       │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  Carlos López recibiendo paquete    │
│                                     │
│  [ REHACER ]        [  SIGUIENTE  ] │
└─────────────────────────────────────┘
```

### Pantalla 5: Foto del Paquete (Opcional)
```
┌─────────────────────────────────────┐
│  ← Confirmar Entrega      [4/5]     │
├─────────────────────────────────────┤
│                                     │
│  📸 Foto del paquete entregado      │
│  (Opcional)                         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │     [Vista de cámara]         │ │
│  │                               │ │
│  │        📷                     │ │
│  │                               │ │
│  │  Foto del estado del paquete  │ │
│  │  en su ubicación final        │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [ TOMAR FOTO ]    [ OMITIR ]       │
└─────────────────────────────────────┘
```

### Pantalla 6: Confirmación Final
```
┌─────────────────────────────────────┐
│  ← Confirmar Entrega      [5/5]     │
├─────────────────────────────────────┤
│                                     │
│  Resumen de la entrega              │
│                                     │
│  ✓ Receptor: Carlos López           │
│    (Destinatario - DNI 32123456)    │
│                                     │
│  ✓ Firma capturada                  │
│    [Mini preview firma]             │
│                                     │
│  ✓ Foto del receptor con paquete    │
│    [Mini preview foto]              │
│                                     │
│  ✓ Foto del paquete entregado       │
│    [Mini preview foto]              │
│                                     │
│  Notas adicionales: (opcional)      │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   ✓  CONFIRMAR ENTREGA        │ │
│  └───────────────────────────────┘ │
│                                     │
│  [ ← Volver ]                       │
└─────────────────────────────────────┘
```

### Pantalla 7: Confirmación Exitosa
```
┌─────────────────────────────────────┐
│                                     │
│         ✓                           │
│                                     │
│    Entrega Confirmada               │
│                                     │
│  Paquete CAN-20251027-0089          │
│  entregado a Carlos López           │
│                                     │
│  🔄 Sincronizando...                │
│  ━━━━━━━━━━━━━━━━━━━  75%          │
│                                     │
│  • Firma subida ✓                   │
│  • Foto receptor subida ✓           │
│  • Foto paquete: pendiente...       │
│                                     │
│  (Se sincronizará automáticamente   │
│   cuando haya conexión)             │
│                                     │
│     [  CONTINUAR  ]                 │
└─────────────────────────────────────┘
```

### Consideraciones de UX

1. **Validaciones:**
   - Nombre: Mínimo 3 caracteres
   - DNI: 7-8 dígitos (si se completa)
   - Firma: Debe tener trazos mínimos
   - Foto receptor: Obligatoria, detección de rostro opcional
   - Foto paquete: Opcional

2. **Flujo Alternativo - Sin Conexión:**
   ```
   ┌─────────────────────────────────────┐
   │  🔴 Sin conexión                    │
   │                                     │
   │  Entrega guardada localmente        │
   │  Se sincronizará automáticamente    │
   │  cuando tengas conexión             │
   │                                     │
   │  Fotos pendientes: 3                │
   │  Paquetes por sincronizar: 1        │
   │                                     │
   │     [  ENTENDIDO  ]                 │
   └─────────────────────────────────────┘
   ```

3. **Campos Pre-llenados:**
   - Si el receptor es "Destinatario", nombre y DNI se pre-llenan
   - Repartidor puede editar si hay error en los datos
   - Datos se autocompletan con historial (si entregó antes ahí)

4. **Compresión de Imágenes:**
   - Firma: PNG, max 200KB
   - Foto receptor: JPEG 70% calidad, max 800KB
   - Foto paquete: JPEG 70% calidad, max 800KB
   - Thumbnails: 320x180px, max 50KB

5. **Accesibilidad:**
   - Botones grandes (min 48dp)
   - Alto contraste
   - Feedback háptico en acciones importantes
   - Soporte para modo oscuro

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Android App
- [ ] Configurar Room Database con schema SQLite
- [ ] Implementar DAOs para todas las entidades
- [ ] Crear Repository pattern con sincronización
- [ ] Implementar WorkManager para sync automático
- [ ] Configurar Retrofit para APIs de sincronización
- [ ] Implementar upload de imágenes con SAS tokens
- [ ] Crear UI para mostrar estado de sincronización
- [ ] Implementar resolución de conflictos
- [ ] Agregar logs y analytics de sincronización
- [ ] Testing offline completo

### Backend (Azure Functions)
- [ ] Crear endpoint GET /sync/driver/{id}/download
- [ ] Crear endpoint POST /sync/driver/{id}/upload
- [ ] Crear endpoint POST /sync/driver/{id}/request-upload-token
- [ ] Implementar lógica de filtrado por repartidor
- [ ] Implementar detección y resolución de conflictos
- [ ] Configurar SAS tokens para Blob Storage
- [ ] Agregar logging y monitoring
- [ ] Implementar rate limiting por repartidor
- [ ] Testing de carga con múltiples repartidores
- [ ] Documentar APIs en README

### Cosmos DB
- [ ] Crear índices optimizados para queries de sincronización
- [ ] Configurar TTL para datos antiguos (opcional)
- [ ] Implementar stored procedures para operaciones batch
- [ ] Configurar change feed para notificaciones push
- [ ] Monitorear RU consumption durante sincronización
- [ ] Optimizar partition keys para queries de repartidor

---

## 🎯 RESUMEN EJECUTIVO

### Datos que Cosmos DB Prepara por Repartidor:

**DOWNLOAD (Pull) - Lo que baja cada repartidor:**
1. ✅ Sus paquetes asignados (últimos 7 días + activos)
2. ✅ Sus rutas (día actual ± 1 día)
3. ✅ Su configuración personal (comisiones, zonas)
4. ✅ Actualizaciones de paquetes que ya tiene localmente
5. ✅ Notificaciones de cancelaciones o cambios

**UPLOAD (Push) - Lo que sube cada repartidor:**
1. ✅ Scans de etiquetas con fotos (Blob) + metadata (Cosmos)
2. ✅ Cambios de estado de paquetes (delivered, failed, etc.)
3. ✅ Pruebas de entrega (firmas + fotos)
4. ✅ Tracking GPS de rutas activas
5. ✅ Incidentes reportados
6. ✅ Actualizaciones de progreso de ruta

### Tamaño Estimado de Datos:
- **Download inicial**: ~100-200 KB (sin imágenes)
- **Upload por día**: ~500 KB - 2 MB (con imágenes comprimidas)
- **Sincronización incremental**: ~10-50 KB cada 15 min

### Beneficios de esta Arquitectura:
✅ Trabajo offline completo (0% dependencia de conexión)
✅ Sincronización inteligente (solo datos relevantes)
✅ Resolución automática de conflictos
✅ Escalabilidad (1000+ repartidores simultáneos)
✅ Bajo consumo de datos móviles
✅ Resiliencia ante fallas de red
✅ Auditoría completa de sincronizaciones

---

**FIN DEL DOCUMENTO - ARQUITECTURA DE SINCRONIZACIÓN ANDROID**

**Versión**: 1.0
**Fecha**: Octubre 2025
**Autor**: AI Architect
**Confidencialidad**: Interno - No Distribuir
