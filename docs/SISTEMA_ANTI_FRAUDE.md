# 🛡️ SISTEMA ANTI-FRAUDE - DETECCIÓN DE FOTOS DUPLICADAS

## 📋 CONTEXTO DEL PROBLEMA

### Problemática Actual
Los repartidores pueden **reutilizar fotos de días anteriores** para cobrar múltiples veces el mismo viaje, generando:
- **Pérdidas económicas significativas**: Millones de pesos mensuales
- **Duplicación de pagos**: El mismo paquete se paga 2 o más veces
- **Falta de trazabilidad**: No se puede verificar qué paquetes son reales
- **Pérdida de confianza**: Imposibilidad de validar entregas

### Caso Real
```
Día 1 (15/01/2025):
  Repartidor entrega paquete #12345
  Toma foto de la etiqueta → Foto A
  Cobra $500

Día 2 (16/01/2025):
  Repartidor envía MISMA Foto A por WhatsApp
  Dice que es paquete #12346
  Cobra $500 adicional → FRAUDE

Pérdida: $500 x N intentos no detectados
```

### Solución Propuesta
**Sistema inteligente de detección de duplicados** mediante:
1. **Hash criptográfico** (SHA-256) de cada imagen
2. **Base de datos histórica** (6 meses)
3. **Validación en tiempo real** (antes de aceptar el escaneo)
4. **Alertas inmediatas** al repartidor y administrador
5. **Log de auditoría** de todos los intentos

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────────┐
│                    REPARTIDOR (App Android)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Tomar foto de etiqueta                                   │
│     ↓                                                         │
│  2. Generar SHA-256 hash de la imagen                        │
│     ↓                                                         │
│  3. Buscar hash en BD local (últimos 7 días)                 │
│     ├─ ✅ NO encontrado → Continuar paso 4                   │
│     └─ 🚨 ENCONTRADO → BLOQUEAR + mostrar alerta            │
│     ↓                                                         │
│  4. Enviar hash al servidor                                  │
│     ↓                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    AZURE BACKEND (Cloud)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  5. Buscar hash en Cosmos DB (últimos 6 meses)              │
│     ├─ ✅ NO encontrado → Aceptar escaneo                   │
│     │    └─ Guardar foto + hash en BD                       │
│     │    └─ Procesar OCR                                    │
│     │    └─ Crear registro de paquete                       │
│     │                                                         │
│     └─ 🚨 ENCONTRADO → FRAUDE DETECTADO                     │
│          ├─ Registrar intento en log de auditoría           │
│          ├─ Enviar alerta a app                             │
│          ├─ Notificar a dashboard                           │
│          └─ BLOQUEAR escaneo                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  DASHBOARD WEB (Admin)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Ver intentos de fraude en tiempo real                     │
│  • Filtrar por repartidor, fecha, tipo                       │
│  • Ver foto original vs foto duplicada                       │
│  • Exportar reporte de fraudes                              │
│  • Tomar acciones (advertencia, suspensión)                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 MODELO DE DATOS

### 1. Campo Anti-Fraude en Tabla `scans` (SQLite - Android Local)

```sql
-- Agregar a tabla existente
ALTER TABLE scans ADD COLUMN image_hash TEXT;
ALTER TABLE scans ADD COLUMN is_duplicate INTEGER DEFAULT 0;
ALTER TABLE scans ADD COLUMN duplicate_of_scan_id TEXT;
ALTER TABLE scans ADD COLUMN duplicate_check_timestamp TEXT;
ALTER TABLE scans ADD COLUMN fraud_alert_shown INTEGER DEFAULT 0;

-- Índice para búsquedas rápidas
CREATE INDEX idx_scans_hash ON scans(image_hash);
CREATE INDEX idx_scans_duplicate ON scans(is_duplicate, duplicate_check_timestamp);
```

**Ejemplo de registro:**
```json
{
  "scan_id": "scn_local_20251027_001",
  "package_id": "pkg_20251027_0123",
  "scan_type": "label_capture",
  "scan_timestamp": "2025-10-27T13:15:00Z",
  "local_image_path": "/storage/scans/20251027_001.jpg",
  "image_hash": "sha256:a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  "is_duplicate": 0,
  "duplicate_of_scan_id": null,
  "duplicate_check_timestamp": "2025-10-27T13:15:02Z",
  "fraud_alert_shown": 0,
  "image_uploaded": 0,
  "is_synced": 0
}
```

### 2. Objeto Anti-Fraude en Contenedor `SCANS` (Cosmos DB)

```json
{
  "id": "scn_20251027_001",
  "scanId": "scn_20251027_001",
  "packageId": "pkg_20251027_0123",
  "type": "scan",
  "scanType": "label_capture",

  // NUEVO: Objeto Anti-Fraude
  "antiFraud": {
    "imageHash": "sha256:a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    "hashAlgorithm": "SHA-256",
    "isDuplicate": false,
    "duplicateOf": null,
    "validationTimestamp": "2025-10-27T13:15:02Z",
    "validationMethod": "hash_comparison",
    "historicalMatches": [],
    "riskScore": 0,  // 0-100
    "flags": []
  },

  // Datos del escaneo
  "scanTimestamp": "2025-10-27T13:15:00Z",
  "location": {
    "type": "Point",
    "coordinates": [-58.4707, -34.6158],
    "accuracy": 10
  },

  // Imagen
  "image": {
    "originalUrl": "https://storage.blob.core.windows.net/scans/original/scn_20251027_001.jpg",
    "thumbnailUrl": "https://storage.blob.core.windows.net/scans/thumbnails/scn_20251027_001_thumb.jpg",
    "sizeBytes": 2457600,
    "format": "image/jpeg",
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  },

  // OCR data
  "ocrData": {
    "processed": true,
    "confidence": 0.92,
    "extractedFields": {...}
  },

  // Assignment
  "assignment": {
    "driverId": "drv_12345",
    "driverName": "Juan Carlos Rodríguez",
    "organizationId": "org_001"
  },

  // Metadata
  "metadata": {
    "createdAt": "2025-10-27T13:15:00Z",
    "updatedAt": "2025-10-27T13:15:02Z",
    "source": "android_app",
    "appVersion": "2.3.1"
  }
}
```

### 3. Contenedor `FRAUD_ATTEMPTS` (Cosmos DB - Nuevo)

```json
{
  "id": "fraud_20251027_001",
  "fraudAttemptId": "fraud_20251027_001",
  "type": "fraud_attempt",
  "partitionKey": "drv_12345",  // Por repartidor para consultas eficientes

  // Información del intento
  "attemptType": "PHOTO_DUPLICATE",
  "attemptTimestamp": "2025-10-27T14:30:00Z",
  "blocked": true,

  // Repartidor
  "driver": {
    "driverId": "drv_12345",
    "driverName": "Juan Carlos Rodríguez",
    "organizationId": "org_001"
  },

  // Foto duplicada
  "duplicateImage": {
    "attemptedHash": "sha256:a3f5b8c9d2e1f4a7...",
    "attemptedImageUrl": null,  // No se subió
    "attemptedTimestamp": "2025-10-27T14:30:00Z"
  },

  // Foto original
  "originalScan": {
    "scanId": "scn_20251015_089",
    "scanTimestamp": "2025-10-15T16:20:00Z",
    "packageId": "pkg_20251015_0234",
    "imageUrl": "https://storage.blob.core.windows.net/scans/original/scn_20251015_089.jpg",
    "originalDriverId": "drv_12345",  // Mismo repartidor
    "daysSinceOriginal": 12
  },

  // Contexto
  "context": {
    "location": {
      "type": "Point",
      "coordinates": [-58.4707, -34.6158]
    },
    "deviceInfo": {
      "model": "Samsung Galaxy A54",
      "os": "Android 14",
      "appVersion": "2.3.1"
    },
    "attemptedPackageId": null  // No llegó a crear paquete
  },

  // Acciones tomadas
  "actions": {
    "alertShownToDriver": true,
    "alertMessage": "⚠️ Esta foto ya fue usada el 15/10/2025",
    "scanBlocked": true,
    "adminNotified": true,
    "notificationSent": "2025-10-27T14:30:01Z"
  },

  // Severidad
  "severity": "HIGH",  // LOW, MEDIUM, HIGH, CRITICAL
  "riskScore": 85,     // 0-100

  // Metadata
  "metadata": {
    "createdAt": "2025-10-27T14:30:00Z",
    "investigationStatus": "pending",  // pending, reviewed, resolved
    "investigatedBy": null,
    "investigatedAt": null,
    "resolution": null,
    "notes": null
  }
}
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### 1. Generación de Hash en App Android

```kotlin
// File: src/main/kotlin/com/logistics/app/services/ImageHashService.kt

import java.io.File
import java.security.MessageDigest

class ImageHashService {

    /**
     * Genera hash SHA-256 de una imagen
     * @param imagePath Ruta local de la imagen
     * @return Hash en formato "sha256:hexadecimal"
     */
    fun generateImageHash(imagePath: String): String {
        val file = File(imagePath)

        if (!file.exists()) {
            throw FileNotFoundException("Image file not found: $imagePath")
        }

        val bytes = file.readBytes()
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(bytes)

        val hexString = hashBytes.joinToString("") { "%02x".format(it) }

        return "sha256:$hexString"
    }

    /**
     * Valida formato de hash
     */
    fun isValidHash(hash: String): Boolean {
        val pattern = Regex("^sha256:[a-f0-9]{64}$")
        return pattern.matches(hash)
    }

    /**
     * Compara dos hashes
     */
    fun hashesMatch(hash1: String, hash2: String): Boolean {
        return hash1.equals(hash2, ignoreCase = true)
    }
}
```

### 2. Servicio Anti-Fraude en App Android

```kotlin
// File: src/main/kotlin/com/logistics/app/services/AntiFraudService.kt

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Date

class AntiFraudService(
    private val scanDao: ScanDao,
    private val apiService: ApiService,
    private val imageHashService: ImageHashService
) {

    sealed class ValidationResult {
        data class Valid(val imageHash: String) : ValidationResult()
        data class Duplicate(
            val originalScanId: String,
            val originalDate: Date,
            val daysSince: Int,
            val alertMessage: String
        ) : ValidationResult()
        data class Error(val message: String) : ValidationResult()
    }

    /**
     * Valida si una imagen es duplicada
     * 1. Genera hash
     * 2. Busca en BD local (7 días)
     * 3. Busca en servidor (6 meses)
     */
    suspend fun validateScanImage(
        imagePath: String,
        driverId: String
    ): ValidationResult = withContext(Dispatchers.IO) {

        try {
            // 1. Generar hash de la imagen
            val imageHash = imageHashService.generateImageHash(imagePath)

            // 2. Buscar en base de datos local (últimos 7 días)
            val localDuplicate = scanDao.findByHashInLastDays(imageHash, days = 7)

            if (localDuplicate != null) {
                val daysSince = calculateDaysBetween(
                    localDuplicate.scanTimestamp,
                    Date()
                )

                // Marcar como duplicado en BD local
                scanDao.markAsDuplicate(
                    scanId = localDuplicate.scanId,
                    duplicateCheckTimestamp = Date().toIsoString()
                )

                return@withContext ValidationResult.Duplicate(
                    originalScanId = localDuplicate.scanId,
                    originalDate = Date(localDuplicate.scanTimestamp),
                    daysSince = daysSince,
                    alertMessage = "⚠️ Esta foto ya fue usada el ${formatShortDate(localDuplicate.scanTimestamp)}"
                )
            }

            // 3. Buscar en servidor (últimos 6 meses)
            val serverCheck = try {
                apiService.checkDuplicateImage(
                    imageHash = imageHash,
                    driverId = driverId
                )
            } catch (e: Exception) {
                // Si no hay conexión, permitir continuar
                // La validación se hará en la sincronización
                Log.w("AntiFraud", "No se pudo validar en servidor: ${e.message}")
                null
            }

            if (serverCheck?.isDuplicate == true) {
                val daysSince = calculateDaysBetween(
                    serverCheck.originalScanDate.toDate(),
                    Date()
                )

                return@withContext ValidationResult.Duplicate(
                    originalScanId = serverCheck.originalScanId,
                    originalDate = serverCheck.originalScanDate.toDate(),
                    daysSince = daysSince,
                    alertMessage = "⚠️ Esta foto ya fue usada el ${formatShortDate(serverCheck.originalScanDate)}"
                )
            }

            // 4. Foto válida
            ValidationResult.Valid(imageHash)

        } catch (e: Exception) {
            Log.e("AntiFraud", "Error validating image", e)
            ValidationResult.Error("Error al validar imagen: ${e.message}")
        }
    }

    /**
     * Registra intento de fraude localmente
     */
    suspend fun logFraudAttemptLocally(
        driverId: String,
        imageHash: String,
        originalScanId: String,
        alertMessage: String
    ) {
        val fraudLog = FraudAttemptLocal(
            id = "fraud_local_${System.currentTimeMillis()}",
            driverId = driverId,
            imageHash = imageHash,
            originalScanId = originalScanId,
            attemptTimestamp = Date().toIsoString(),
            alertMessage = alertMessage,
            synced = false
        )

        fraudAttemptDao.insert(fraudLog)
    }

    private fun calculateDaysBetween(timestamp1: String, date2: Date): Int {
        val date1 = parseIsoDate(timestamp1)
        val diffMs = date2.time - date1.time
        return (diffMs / (1000 * 60 * 60 * 24)).toInt()
    }
}
```

### 3. Integración en el Flujo de Escaneo

```kotlin
// File: src/main/kotlin/com/logistics/app/ui/scan/ScanViewModel.kt

class ScanViewModel(
    private val antiFraudService: AntiFraudService,
    private val ocrService: OcrService,
    private val scanRepository: ScanRepository
) : ViewModel() {

    private val _scanState = MutableStateFlow<ScanState>(ScanState.Idle)
    val scanState: StateFlow<ScanState> = _scanState.asStateFlow()

    sealed class ScanState {
        object Idle : ScanState()
        object ValidatingPhoto : ScanState()
        object ProcessingOCR : ScanState()
        data class Success(val scan: Scan) : ScanState()
        data class DuplicateDetected(
            val originalScanId: String,
            val originalDate: Date,
            val alertMessage: String
        ) : ScanState()
        data class Error(val message: String) : ScanState()
    }

    fun onPhotoTaken(imagePath: String, driverId: String) {
        viewModelScope.launch {
            try {
                _scanState.value = ScanState.ValidatingPhoto

                // 1. VALIDACIÓN ANTI-FRAUDE
                when (val result = antiFraudService.validateScanImage(imagePath, driverId)) {

                    is AntiFraudService.ValidationResult.Valid -> {
                        // Foto válida, continuar con OCR
                        val imageHash = result.imageHash
                        processOCR(imagePath, imageHash, driverId)
                    }

                    is AntiFraudService.ValidationResult.Duplicate -> {
                        // FRAUDE DETECTADO
                        _scanState.value = ScanState.DuplicateDetected(
                            originalScanId = result.originalScanId,
                            originalDate = result.originalDate,
                            alertMessage = result.alertMessage
                        )

                        // Registrar intento
                        antiFraudService.logFraudAttemptLocally(
                            driverId = driverId,
                            imageHash = "", // Ya se tiene en el servicio
                            originalScanId = result.originalScanId,
                            alertMessage = result.alertMessage
                        )
                    }

                    is AntiFraudService.ValidationResult.Error -> {
                        _scanState.value = ScanState.Error(result.message)
                    }
                }

            } catch (e: Exception) {
                _scanState.value = ScanState.Error("Error: ${e.message}")
            }
        }
    }

    private suspend fun processOCR(
        imagePath: String,
        imageHash: String,
        driverId: String
    ) {
        _scanState.value = ScanState.ProcessingOCR

        // Procesar OCR con Azure Document Intelligence
        val ocrResult = ocrService.processImage(imagePath)

        if (ocrResult.isSuccess) {
            // Crear registro de escaneo
            val scan = Scan(
                scanId = "scn_local_${System.currentTimeMillis()}",
                localImagePath = imagePath,
                imageHash = imageHash,
                ocrData = ocrResult.data,
                driverId = driverId,
                scanTimestamp = Date().toIsoString()
            )

            scanRepository.saveScan(scan)
            _scanState.value = ScanState.Success(scan)
        } else {
            _scanState.value = ScanState.Error("Error en OCR: ${ocrResult.error}")
        }
    }
}
```

### 4. UI de Alerta de Fraude

```kotlin
// File: src/main/kotlin/com/logistics/app/ui/scan/FraudAlertDialog.kt

@Composable
fun FraudAlertDialog(
    originalScanId: String,
    originalDate: Date,
    alertMessage: String,
    onDismiss: () -> Unit,
    onRetakePhoto: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Alerta",
                tint = Color.Red,
                modifier = Modifier.size(48.dp)
            )
        },
        title = {
            Text(
                text = "Foto Duplicada Detectada",
                style = MaterialTheme.typography.headlineSmall,
                color = Color.Red,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = alertMessage,
                    style = MaterialTheme.typography.bodyLarge
                )

                Divider()

                Text(
                    text = "Detalles:",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = "• Fecha original: ${formatFullDate(originalDate)}",
                    style = MaterialTheme.typography.bodyMedium
                )

                Text(
                    text = "• ID escaneo: $originalScanId",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(8.dp))

                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFFFEF2F2)  // red-50
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = Color.Red,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Este intento ha sido registrado y notificado al supervisor.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF991B1B)  // red-800
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onRetakePhoto,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(
                    imageVector = Icons.Default.CameraAlt,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Tomar Nueva Foto")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}
```

---

## 🌐 API ENDPOINTS

### 1. Verificar Imagen Duplicada

```typescript
// File: src/app/api/anti-fraud/check-duplicate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-client';
import { getServerSession } from 'next-auth';

interface CheckDuplicateRequest {
  imageHash: string;
  driverId: string;
}

interface CheckDuplicateResponse {
  isDuplicate: boolean;
  originalScanId?: string;
  originalScanDate?: string;
  originalDriverId?: string;
  originalPackageId?: string;
  daysSinceOriginal?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CheckDuplicateRequest = await request.json();
    const { imageHash, driverId } = body;

    // Validar hash
    if (!imageHash || !imageHash.startsWith('sha256:')) {
      return NextResponse.json(
        { error: 'Invalid image hash format' },
        { status: 400 }
      );
    }

    // Buscar en histórico de SCANS (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const querySpec = {
      query: `
        SELECT TOP 1
          c.scanId,
          c.scanTimestamp,
          c.packageId,
          c.assignment.driverId as driverId,
          c.image.originalUrl
        FROM c
        WHERE c.antiFraud.imageHash = @imageHash
          AND c.scanTimestamp >= @sixMonthsAgo
        ORDER BY c.scanTimestamp DESC
      `,
      parameters: [
        { name: '@imageHash', value: imageHash },
        { name: '@sixMonthsAgo', value: sixMonthsAgo.toISOString() }
      ]
    };

    const { resources: existingScans } = await containers.scans.items
      .query(querySpec)
      .fetchAll();

    if (existingScans.length > 0) {
      const originalScan = existingScans[0];
      const originalDate = new Date(originalScan.scanTimestamp);
      const now = new Date();
      const daysSince = Math.floor(
        (now.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Registrar intento de fraude
      await logFraudAttempt({
        driverId,
        imageHash,
        originalScanId: originalScan.scanId,
        originalScanDate: originalScan.scanTimestamp,
        originalDriverId: originalScan.driverId,
        originalPackageId: originalScan.packageId,
        daysSinceOriginal: daysSince
      });

      const response: CheckDuplicateResponse = {
        isDuplicate: true,
        originalScanId: originalScan.scanId,
        originalScanDate: originalScan.scanTimestamp,
        originalDriverId: originalScan.driverId,
        originalPackageId: originalScan.packageId,
        daysSinceOriginal: daysSince
      };

      return NextResponse.json(response);
    }

    // No es duplicado
    return NextResponse.json({ isDuplicate: false });

  } catch (error) {
    console.error('Error checking duplicate image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function logFraudAttempt(data: {
  driverId: string;
  imageHash: string;
  originalScanId: string;
  originalScanDate: string;
  originalDriverId: string;
  originalPackageId: string;
  daysSinceOriginal: number;
}) {
  const fraudAttemptId = `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Obtener información del repartidor
  const { resource: driver } = await containers.drivers.items
    .read(data.driverId, data.driverId);

  // Obtener información del escaneo original
  const { resource: originalScan } = await containers.scans.items
    .read(data.originalScanId, data.originalScanId);

  const fraudAttempt = {
    id: fraudAttemptId,
    fraudAttemptId: fraudAttemptId,
    type: 'fraud_attempt',
    partitionKey: data.driverId,

    attemptType: 'PHOTO_DUPLICATE',
    attemptTimestamp: new Date().toISOString(),
    blocked: true,

    driver: {
      driverId: data.driverId,
      driverName: `${driver.personalInfo.firstName} ${driver.personalInfo.lastName}`,
      organizationId: driver.subLogisticsId
    },

    duplicateImage: {
      attemptedHash: data.imageHash,
      attemptedImageUrl: null,
      attemptedTimestamp: new Date().toISOString()
    },

    originalScan: {
      scanId: data.originalScanId,
      scanTimestamp: data.originalScanDate,
      packageId: data.originalPackageId,
      imageUrl: originalScan.image.originalUrl,
      originalDriverId: data.originalDriverId,
      daysSinceOriginal: data.daysSinceOriginal
    },

    actions: {
      alertShownToDriver: true,
      alertMessage: `⚠️ Esta foto ya fue usada el ${formatShortDate(data.originalScanDate)}`,
      scanBlocked: true,
      adminNotified: true,
      notificationSent: new Date().toISOString()
    },

    severity: data.daysSinceOriginal <= 7 ? 'CRITICAL' :
              data.daysSinceOriginal <= 30 ? 'HIGH' : 'MEDIUM',
    riskScore: Math.max(0, 100 - data.daysSinceOriginal * 2),

    metadata: {
      createdAt: new Date().toISOString(),
      investigationStatus: 'pending',
      investigatedBy: null,
      investigatedAt: null,
      resolution: null,
      notes: null
    }
  };

  await containers.fraudAttempts.items.create(fraudAttempt);

  // TODO: Enviar notificación a dashboard en tiempo real (WebSocket/SignalR)
}

function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
```

### 2. Obtener Intentos de Fraude

```typescript
// File: src/app/api/anti-fraud/attempts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const driverId = searchParams.get('driverId');
    const severity = searchParams.get('severity');

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    let query = `
      SELECT *
      FROM c
      WHERE c.type = 'fraud_attempt'
        AND c.attemptTimestamp >= @sinceDate
    `;

    const parameters: any[] = [
      { name: '@sinceDate', value: sinceDate.toISOString() }
    ];

    if (driverId) {
      query += ` AND c.driver.driverId = @driverId`;
      parameters.push({ name: '@driverId', value: driverId });
    }

    if (severity) {
      query += ` AND c.severity = @severity`;
      parameters.push({ name: '@severity', value: severity });
    }

    query += ` ORDER BY c.attemptTimestamp DESC`;

    const { resources: attempts } = await containers.fraudAttempts.items
      .query({ query, parameters })
      .fetchAll();

    return NextResponse.json({
      attempts,
      total: attempts.length,
      period: { days, since: sinceDate.toISOString() }
    });

  } catch (error) {
    console.error('Error fetching fraud attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 📊 DASHBOARD DE FRAUDES

### Vista de Intentos de Fraude

```typescript
// File: src/app/fraudes/page.tsx

'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { IconAlertTriangle, IconFilter, IconDownload } from '@tabler/icons-react';

interface FraudAttempt {
  fraudAttemptId: string;
  attemptTimestamp: string;
  driver: {
    driverId: string;
    driverName: string;
  };
  originalScan: {
    scanId: string;
    scanTimestamp: string;
    packageId: string;
    imageUrl: string;
    daysSinceOriginal: number;
  };
  severity: string;
  riskScore: number;
  metadata: {
    investigationStatus: string;
  };
}

export default function FraudesPage() {
  const [fraudAttempts, setFraudAttempts] = useState<FraudAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    fetchFraudAttempts();
  }, [daysFilter, severityFilter]);

  const fetchFraudAttempts = async () => {
    try {
      const params = new URLSearchParams({
        days: daysFilter.toString()
      });

      if (severityFilter !== 'ALL') {
        params.append('severity', severityFilter);
      }

      const res = await fetch(`/api/anti-fraud/attempts?${params}`);
      const data = await res.json();
      setFraudAttempts(data.attempts || []);
    } catch (error) {
      console.error('Error fetching fraud attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      CRITICAL: 'bg-danger',
      HIGH: 'bg-warning',
      MEDIUM: 'bg-info',
      LOW: 'bg-secondary'
    };
    return colors[severity as keyof typeof colors] || 'bg-secondary';
  };

  return (
    <DashboardLayout>
      <div className="container-fluid p-6">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <IconAlertTriangle size={32} className="inline mr-2 text-danger" />
              Intentos de Fraude Detectados
            </h1>
            <p className="text-gray-600">
              Sistema anti-fraude de detección de fotos duplicadas
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-6">
          <div className="col-md-3">
            <div className="card border-danger">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-fill">
                    <h3 className="h1 mb-0">{fraudAttempts.length}</h3>
                    <div className="text-muted">Intentos Bloqueados</div>
                  </div>
                  <div className="ms-auto">
                    <span className="badge bg-danger badge-pill fs-3">
                      {fraudAttempts.filter(a => a.severity === 'CRITICAL').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h3 className="h1 mb-0">
                  {new Set(fraudAttempts.map(a => a.driver.driverId)).size}
                </h3>
                <div className="text-muted">Repartidores Involucrados</div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h3 className="h1 mb-0">
                  {fraudAttempts.filter(a => a.metadata.investigationStatus === 'pending').length}
                </h3>
                <div className="text-muted">Pendientes de Revisión</div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h3 className="h1 mb-0">
                  {Math.round(fraudAttempts.reduce((sum, a) => sum + a.riskScore, 0) / fraudAttempts.length) || 0}%
                </h3>
                <div className="text-muted">Riesgo Promedio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Período</label>
                <select
                  className="form-select"
                  value={daysFilter}
                  onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                >
                  <option value={7}>Últimos 7 días</option>
                  <option value={15}>Últimos 15 días</option>
                  <option value={30}>Últimos 30 días</option>
                  <option value={90}>Últimos 90 días</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Severidad</label>
                <select
                  className="form-select"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                >
                  <option value="ALL">Todas</option>
                  <option value="CRITICAL">Crítica</option>
                  <option value="HIGH">Alta</option>
                  <option value="MEDIUM">Media</option>
                  <option value="LOW">Baja</option>
                </select>
              </div>

              <div className="col-md-4 d-flex align-items-end">
                <button className="btn btn-primary w-100">
                  <IconDownload size={20} className="me-2" />
                  Exportar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Fraud Attempts Table */}
        <div className="card">
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th>Fecha/Hora Intento</th>
                  <th>Repartidor</th>
                  <th>Foto Original</th>
                  <th>Fecha Original</th>
                  <th>Días Transcurridos</th>
                  <th>Severidad</th>
                  <th>Riesgo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status" />
                    </td>
                  </tr>
                ) : fraudAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No se detectaron intentos de fraude en el período seleccionado
                    </td>
                  </tr>
                ) : (
                  fraudAttempts.map((attempt) => (
                    <tr key={attempt.fraudAttemptId}>
                      <td>
                        <div className="text-muted">
                          {new Date(attempt.attemptTimestamp).toLocaleString('es-AR')}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="font-weight-medium">
                            {attempt.driver.driverName}
                          </span>
                          <span className="text-muted text-sm">
                            ID: {attempt.driver.driverId}
                          </span>
                        </div>
                      </td>
                      <td>
                        <a
                          href={attempt.originalScan.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          Ver Foto
                        </a>
                      </td>
                      <td className="text-muted">
                        {new Date(attempt.originalScan.scanTimestamp).toLocaleDateString('es-AR')}
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {attempt.originalScan.daysSinceOriginal} días
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getSeverityBadge(attempt.severity)}`}>
                          {attempt.severity}
                        </span>
                      </td>
                      <td>
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className={`progress-bar ${attempt.riskScore > 80 ? 'bg-danger' : attempt.riskScore > 60 ? 'bg-warning' : 'bg-info'}`}
                            style={{ width: `${attempt.riskScore}%` }}
                          />
                        </div>
                        <small className="text-muted">{attempt.riskScore}%</small>
                      </td>
                      <td>
                        <span className="badge bg-warning">
                          {attempt.metadata.investigationStatus === 'pending' ? 'Pendiente' : 'Revisado'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary">
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

## 📈 MÉTRICAS Y KPIs

### KPIs del Sistema Anti-Fraude

1. **Intentos Bloqueados**
   - Total de fraudes detectados en período
   - Tendencia semanal/mensual
   - Ahorro estimado

2. **Repartidores con Intentos**
   - Número de repartidores únicos
   - Ranking por número de intentos
   - Acciones tomadas (advertencias, suspensiones)

3. **Tasa de Detección**
   - % de fotos validadas
   - % de duplicados encontrados
   - Tiempo promedio de validación

4. **Severidad de Intentos**
   - Distribución por severidad (Critical/High/Medium/Low)
   - Días promedio desde foto original
   - Score de riesgo promedio

5. **Impacto Económico**
   - Pérdidas evitadas (en pesos)
   - ROI del sistema anti-fraude
   - Comparativa antes/después

---

## ⚙️ CONFIGURACIÓN Y AJUSTES

### Parámetros Configurables

```typescript
// File: src/config/anti-fraud.config.ts

export const AntiFraudConfig = {
  // Período de retención de hashes
  HISTORICAL_RETENTION_MONTHS: 6,

  // Período de búsqueda local (app Android)
  LOCAL_SEARCH_DAYS: 7,

  // Umbral de riesgo
  RISK_THRESHOLDS: {
    CRITICAL: 80,  // >= 80% riesgo
    HIGH: 60,      // >= 60% riesgo
    MEDIUM: 40,    // >= 40% riesgo
    LOW: 0         // < 40% riesgo
  },

  // Cálculo de score de riesgo
  RISK_CALCULATION: {
    // Score disminuye con el tiempo
    MAX_SCORE: 100,
    DECAY_PER_DAY: 2,  // Reduce 2 puntos por día transcurrido

    // Penalizaciones adicionales
    SAME_DRIVER_PENALTY: 20,  // +20 si es el mismo repartidor
    MULTIPLE_ATTEMPTS_PENALTY: 10  // +10 por cada intento adicional
  },

  // Acciones automáticas
  AUTO_ACTIONS: {
    // Suspender repartidor automáticamente
    AUTO_SUSPEND_AFTER_ATTEMPTS: 5,  // >= 5 intentos
    AUTO_SUSPEND_DURATION_DAYS: 7,

    // Notificaciones
    NOTIFY_ADMIN_ON_CRITICAL: true,
    NOTIFY_ADMIN_ON_MULTIPLE: 3  // >= 3 intentos
  }
};
```

### Personalización de Mensajes de Alerta

```typescript
// File: src/config/alert-messages.ts

export const AlertMessages = {
  PHOTO_DUPLICATE: {
    es: "⚠️ Esta foto ya fue usada el {originalDate}",
    en: "⚠️ This photo was already used on {originalDate}"
  },

  BLOCKED_SCAN: {
    es: "Escaneo bloqueado por duplicado. Por favor, toma una nueva foto actual.",
    en: "Scan blocked due to duplicate. Please take a new current photo."
  },

  FRAUD_LOGGED: {
    es: "Este intento ha sido registrado y notificado al supervisor.",
    en: "This attempt has been logged and reported to the supervisor."
  }
};
```

---

## 🧪 TESTING

### Casos de Prueba

#### Test 1: Detectar Duplicado Local (< 7 días)
```kotlin
@Test
fun `should detect duplicate from local database`() = runBlocking {
    // Arrange
    val imagePath = "/test/image1.jpg"
    val imageHash = "sha256:abc123..."

    val existingScan = Scan(
        scanId = "scn_001",
        imageHash = imageHash,
        scanTimestamp = "2025-10-20T10:00:00Z"
    )
    scanDao.insert(existingScan)

    // Act
    val result = antiFraudService.validateScanImage(imagePath, "drv_001")

    // Assert
    assertTrue(result is ValidationResult.Duplicate)
    assertEquals("scn_001", (result as ValidationResult.Duplicate).originalScanId)
}
```

#### Test 2: Detectar Duplicado Servidor (> 7 días, < 6 meses)
```kotlin
@Test
fun `should detect duplicate from server`() = runBlocking {
    // Arrange
    val imagePath = "/test/image2.jpg"
    val imageHash = "sha256:def456..."

    // Simular respuesta del servidor
    coEvery {
        apiService.checkDuplicateImage(imageHash, "drv_001")
    } returns CheckDuplicateResponse(
        isDuplicate = true,
        originalScanId = "scn_002",
        originalScanDate = "2025-09-15T14:00:00Z"
    )

    // Act
    val result = antiFraudService.validateScanImage(imagePath, "drv_001")

    // Assert
    assertTrue(result is ValidationResult.Duplicate)
}
```

#### Test 3: Foto Válida (No Duplicado)
```kotlin
@Test
fun `should accept valid unique photo`() = runBlocking {
    // Arrange
    val imagePath = "/test/image_unique.jpg"
    val imageHash = "sha256:xyz789..."

    // BD local vacía
    // Servidor responde no duplicado
    coEvery {
        apiService.checkDuplicateImage(imageHash, "drv_001")
    } returns CheckDuplicateResponse(isDuplicate = false)

    // Act
    val result = antiFraudService.validateScanImage(imagePath, "drv_001")

    // Assert
    assertTrue(result is ValidationResult.Valid)
    assertEquals(imageHash, (result as ValidationResult.Valid).imageHash)
}
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

### Flujos de Usuario

#### Flujo Feliz (Foto Válida)
```
1. Repartidor abre app
2. Presiona botón "Escanear Paquete"
3. Toma foto de etiqueta
4. Sistema genera hash
5. Busca en BD local → No encontrado
6. Busca en servidor → No encontrado
7. ✅ Foto aceptada
8. Procesa OCR
9. Muestra datos extraídos
10. Repartidor confirma
11. Paquete registrado exitosamente
```

#### Flujo de Fraude Detectado
```
1. Repartidor abre app
2. Presiona botón "Escanear Paquete"
3. Toma foto de etiqueta (FOTO YA USADA)
4. Sistema genera hash
5. Busca en BD local → ⚠️ ENCONTRADO
6. 🚨 ALERTA: "Esta foto ya fue usada el 15/10/2025"
7. Bloquea escaneo
8. Muestra botón "Tomar Nueva Foto"
9. Registra intento en log local
10. Sincroniza log con servidor
11. Notifica a dashboard
```

---

## 🔒 SEGURIDAD Y PRIVACIDAD

### Consideraciones de Seguridad

1. **Hash Criptográfico**
   - Usar SHA-256 (no MD5 ni SHA-1)
   - Imposible de revertir
   - Colisiones extremadamente improbables

2. **Almacenamiento de Imágenes**
   - Fotos almacenadas en Azure Blob Storage (encriptado)
   - URLs con SAS Tokens con expiración
   - Solo hash almacenado en BD (no la imagen completa)

3. **Privacidad de Datos**
   - Hashes anónimos (no contienen información personal)
   - Log de fraudes con acceso restringido (solo admins)
   - Datos de repartidores protegidos con RBAC

4. **Auditoría**
   - Todos los intentos registrados con timestamp
   - Trazabilidad completa (quién, cuándo, dónde)
   - Retención de logs por requisitos legales

---

## 📊 REPORTES Y ANALYTICS

### Reporte Mensual de Fraudes

```typescript
// Generar reporte PDF con métricas del mes

interface MonthlyFraudReport {
  period: { month: number; year: number };
  summary: {
    totalAttempts: number;
    uniqueDrivers: number;
    estimatedSavings: number;  // En pesos
    topOffenders: Array<{
      driverId: string;
      driverName: string;
      attempts: number;
      actionTaken: string;
    }>;
  };
  charts: {
    attemptsByDay: Array<{ date: string; count: number }>;
    severityDistribution: Array<{ severity: string; count: number }>;
    topDrivers: Array<{ name: string; attempts: number }>;
  };
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend (Azure)
- [ ] Agregar campo `antiFraud` a contenedor SCANS
- [ ] Crear contenedor FRAUD_ATTEMPTS
- [ ] Implementar endpoint POST /api/anti-fraud/check-duplicate
- [ ] Implementar endpoint GET /api/anti-fraud/attempts
- [ ] Configurar índices en Cosmos DB para búsquedas por hash
- [ ] Implementar log de auditoría
- [ ] Configurar notificaciones en tiempo real (SignalR)

### App Android
- [ ] Implementar ImageHashService (SHA-256)
- [ ] Implementar AntiFraudService con validación
- [ ] Agregar campo image_hash a tabla scans (SQLite)
- [ ] Crear tabla fraud_attempts_local (SQLite)
- [ ] Integrar validación en flujo de escaneo
- [ ] Implementar UI de alerta de fraude (Dialog)
- [ ] Testing unitario e integración

### Dashboard Web
- [ ] Crear página /fraudes
- [ ] Implementar tabla de intentos con filtros
- [ ] Crear cards de métricas (total, pendientes, etc.)
- [ ] Implementar vista de detalle de intento
- [ ] Agregar exportación de reportes
- [ ] Implementar notificaciones en tiempo real

### Testing
- [ ] Test unitario: Generación de hash
- [ ] Test unitario: Detección de duplicado local
- [ ] Test integración: Detección de duplicado servidor
- [ ] Test E2E: Flujo completo de fraude detectado
- [ ] Test performance: Validación < 2 segundos
- [ ] Test carga: 1000 validaciones simultáneas

### Documentación
- [ ] Manual de usuario (repartidor)
- [ ] Manual de administración (dashboard)
- [ ] Documentación técnica de APIs
- [ ] Guía de troubleshooting

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs Post-Implementación

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Reducción de fraudes** | 95%+ detectados | Intentos bloqueados / Total scans |
| **Tiempo de validación** | < 2 segundos | Promedio de validación hash |
| **Ahorro económico** | ROI 10x en 6 meses | Pérdidas evitadas / Costo sistema |
| **Adopción repartidores** | 100% uso app | Scans por app / Total scans |
| **Falsos positivos** | < 1% | Duplicados incorrectos / Total duplicados |

---

## 📞 SOPORTE Y MANTENIMIENTO

### Procedimiento de Escalación

1. **Falso Positivo Reportado**
   - Repartidor reporta foto bloqueada incorrectamente
   - Admin revisa en dashboard
   - Verifica hashes y fotos originales
   - Si es falso positivo: Marcar excepción y permitir
   - Investigar causa raíz (bug en hash, corrupción imagen, etc.)

2. **Intento de Fraude Confirmado**
   - Sistema bloquea y alerta
   - Supervisor revisa en dashboard
   - Verifica foto original vs intento
   - Acción según política (advertencia, suspensión)
   - Registrar en expediente del repartidor

3. **Problema Técnico**
   - Servicio de validación caído
   - Permitir escaneos temporalmente (sin validación)
   - Validar retroactivamente cuando se recupere
   - Alerta a equipo técnico

---

**FIN DEL DOCUMENTO - SISTEMA ANTI-FRAUDE**

**Versión**: 1.0
**Fecha**: 27 de Octubre 2025
**Autor**: Sistema de Documentación Técnica
**Confidencialidad**: Interno - No Distribuir

**Próximos Documentos Relacionados**:
- VALIDACION_CALIDAD_FOTO.md
- ACTUALIZACION_ANDROID_SYNC_ARCHITECTURE.md (Sección Anti-Fraude)
- ACTUALIZACION_COSMOS_DB_MODEL.md (Campo antiFraud)
