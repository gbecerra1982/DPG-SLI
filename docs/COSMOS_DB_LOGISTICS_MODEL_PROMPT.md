# 🚚 PROMPT COMPLETO: MODELO DE DATOS COSMOS DB PARA SISTEMA DE LOGÍSTICA MULTI-NIVEL

## 📊 CONTEXTO DEL NEGOCIO

### Descripción General
Sistema de logística escalable para empresa matriz con múltiples sublogísticas (internas y tercerizadas) que gestiona:
- Distribución de paquetes en múltiples zonas geográficas (CABA, GBA, Interior)
- Repartidores asignados a sublogísticas específicas
- Captura de datos mediante app Android con OCR/LLM (Phi4 Multimodal)
- Liquidación automática con descuentos por incidencias
- Dashboard en tiempo real para gestión operativa

### Requisitos Funcionales
1. **Multi-tenancy**: Soporte para múltiples sublogísticas independientes
2. **Trazabilidad completa**: Historial de estados de cada paquete
3. **OCR Inteligente**: Extracción automática de datos desde etiquetas manuscritas
4. **Liquidaciones flexibles**: Cálculo automático de pagos con reglas de descuento
5. **Geolocalización**: Tracking en tiempo real de repartidores
6. **Analytics**: Métricas y KPIs para toma de decisiones
7. **Tercerización**: Integración con logísticas externas que proveen datos

### Datos de Ejemplo (Semana 20-25 Oct)
```
Dirección          | Monto      | Zona         | Fecha   | Cliente
nazca 3733        | $237,465   | caba         | 20-oct  | cangallo
belgrano 2958     | $73,000    | caba         | 22-oct  | defilippi
mendoza 1678      | $144,109   | caba         | 22-oct  | cangallo
argentina 97      | $117,500   | ramos mejia  | 22-oct  | defilippi
alverar 2637      | $60,600    | benavidez    | 24-oct  | defilippi
TOTAL SEMANAL: $952,953.00
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                    AZURE CLOUD PLATFORM                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Android    │───▶│  Azure       │───▶│   Cosmos DB  │   │
│  │  App (OCR)  │    │  Functions   │    │   (NoSQL)    │   │
│  └─────────────┘    └──────────────┘    └──────────────┘   │
│        │                    │                     │          │
│        │                    │                     │          │
│        ▼                    ▼                     ▼          │
│  ┌─────────────┐                         ┌──────────────┐   │
│  │  Blob       │                         │  Power BI /  │   │
│  │  Storage    │                         │  Dashboard   │   │
│  └─────────────┘                         └──────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Azure AI Services: Phi4 Vision (OCR + LLM)         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Componentes Clave:**
- **Mobile**: Android (Kotlin) + CameraX + ML Kit
- **Backend**: Azure Functions (Node.js/Python) para APIs RESTful
- **Database**: Cosmos DB SQL API con 8 contenedores especializados
- **Storage**: Azure Blob Storage para imágenes de paquetes
- **AI/ML**: Azure AI Vision + Phi4 Multimodal para OCR
- **Frontend**: React/Next.js con Azure Static Web Apps
- **Analytics**: Power BI + Azure Synapse para reportes

---

## 🗄️ MODELO DE DATOS COSMOS DB

### Estrategia General de Diseño

**Principios Aplicados:**
1. **Partition Key Strategy**: Optimizado para distribución geográfica y multi-tenancy
2. **Denormalization**: Datos frecuentemente consultados juntos se almacenan juntos
3. **Event Sourcing**: Historial completo de cambios en paquetes
4. **CQRS Pattern**: Contenedor Analytics separado para lecturas optimizadas
5. **Referential Integrity**: IDs relacionales entre contenedores

**Consistencia:**
- Session Consistency para operaciones de escritura
- Eventual Consistency para analytics y reportes

---

## 📦 CONTENEDOR 1: ORGANIZATIONS

### Descripción
Almacena información de la empresa matriz y todas las sublogísticas (internas y tercerizadas).

### Partition Key
```
/organizationId
```

### Schema JSON
```json
{
  "id": "org_001",
  "organizationId": "org_001",
  "type": "organization",
  "name": "Logística Cangallo",
  "businessName": "Cangallo Transportes S.A.",
  "cuit": "30-71234567-8",
  "organizationType": "sublogistics",
  "parentOrganizationId": "org_root",
  "status": "active",
  "contact": {
    "email": "contacto@cangallo.com",
    "phone": "+54 11 4567-8900",
    "address": {
      "street": "Av. Cangallo 1234",
      "city": "CABA",
      "state": "Buenos Aires",
      "zipCode": "C1234ABC",
      "country": "Argentina",
      "coordinates": {
        "lat": -34.6037,
        "lng": -58.3816
      }
    }
  },
  "configuration": {
    "coverageZones": ["caba", "zona_norte", "zona_sur"],
    "commissionRules": {
      "perPackage": 150.00,
      "perKm": 25.00,
      "zoneBonuses": {
        "caba": 50.00,
        "ramos_mejia": 75.00,
        "benavidez": 100.00
      }
    },
    "settlementPeriod": "weekly",
    "settlementDay": "monday",
    "currency": "ARS"
  },
  "stats": {
    "totalDrivers": 45,
    "totalPackagesDelivered": 15234,
    "averageRating": 4.7,
    "activePackages": 123
  },
  "billing": {
    "bankAccount": {
      "bank": "Banco Nación",
      "accountNumber": "1234567890",
      "cbu": "0110123456789012345678",
      "alias": "CANGALLO.PAGOS"
    }
  },
  "metadata": {
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2025-10-20T14:30:00Z",
    "createdBy": "admin_user_001",
    "tags": ["high_volume", "caba", "premium"]
  }
}
```

### Casos de Uso
- Listar todas las sublogísticas activas
- Obtener configuración de comisiones por organización
- Dashboard: métricas por sublogística
- Administración de permisos y accesos

### Índices Recomendados
```sql
-- Composite index para búsquedas comunes
/parentOrganizationId ASC, /status ASC, /organizationType ASC
/status ASC, /configuration/coverageZones/*
```

---

## 👤 CONTENEDOR 2: DRIVERS

### Descripción
Información de todos los repartidores del sistema, vinculados a sublogísticas.

### Partition Key
```
/subLogisticsId
```
*Permite aislamiento por organización y escalabilidad horizontal.*

### Schema JSON
```json
{
  "id": "drv_12345",
  "driverId": "drv_12345",
  "subLogisticsId": "org_001",
  "type": "driver",
  "personalInfo": {
    "firstName": "Juan Carlos",
    "lastName": "Rodríguez",
    "dni": "35123456",
    "birthDate": "1990-05-15",
    "email": "jcrodriguez@email.com",
    "phone": "+54 11 5678-1234",
    "address": {
      "street": "Belgrano 2958",
      "city": "CABA",
      "state": "Buenos Aires",
      "zipCode": "C1094AAO"
    },
    "profilePhoto": "https://storage.blob.core.windows.net/drivers/drv_12345.jpg"
  },
  "employment": {
    "status": "active",
    "employmentType": "contractor",
    "startDate": "2024-03-01",
    "endDate": null,
    "assignedZones": ["caba", "palermo", "belgrano"],
    "vehicleType": "motorcycle",
    "vehicleInfo": {
      "licensePlate": "ABC123",
      "brand": "Honda",
      "model": "Wave 110",
      "year": 2022,
      "insurance": {
        "company": "La Caja",
        "policyNumber": "POL-987654",
        "expiryDate": "2026-03-01"
      }
    }
  },
  "performance": {
    "totalPackagesDelivered": 1523,
    "successRate": 0.94,
    "averageDeliveryTime": 35,
    "rating": 4.6,
    "onTimeDeliveryRate": 0.89,
    "currentStreak": 47,
    "bestStreak": 102,
    "failedDeliveries": 98,
    "returnedPackages": 23
  },
  "currentStatus": {
    "status": "active",
    "lastLocation": {
      "lat": -34.5875,
      "lng": -58.3974,
      "timestamp": "2025-10-27T15:45:00Z",
      "accuracy": 10
    },
    "currentRoute": "route_20251027_001",
    "packagesInTransit": 8,
    "estimatedCompletionTime": "2025-10-27T18:30:00Z"
  },
  "financials": {
    "bankAccount": {
      "bank": "Banco Provincia",
      "cbu": "0140987654321098765432",
      "alias": "JCROD.COBROS"
    },
    "lastSettlement": {
      "settlementId": "stl_20251020_001",
      "amount": 45230.00,
      "period": "2025-W42",
      "paidAt": "2025-10-21T10:00:00Z"
    },
    "pendingAmount": 12450.00
  },
  "metadata": {
    "createdAt": "2024-03-01T09:00:00Z",
    "updatedAt": "2025-10-27T15:45:00Z",
    "lastActiveAt": "2025-10-27T15:45:00Z",
    "appVersion": "2.3.1",
    "deviceInfo": {
      "model": "Samsung Galaxy A54",
      "os": "Android 14",
      "appBuild": "202510151"
    }
  }
}
```

### Casos de Uso
- Buscar repartidores disponibles por zona
- Dashboard de performance individual
- Asignación automática de rutas
- Cálculo de liquidaciones

### Índices Recomendados
```sql
/employment/status ASC, /employment/assignedZones/* ASC
/currentStatus/status ASC, /currentStatus/lastLocation/timestamp DESC
/performance/successRate DESC
```

---

## 📦 CONTENEDOR 3: PACKAGES

### Descripción
Núcleo del sistema. Almacena información completa de cada paquete con historial de estados.

### Partition Key
```
/zoneId
```
*Distribución geográfica para optimizar queries por zona y balancear carga.*

### Schema JSON
```json
{
  "id": "pkg_20251020_0001",
  "packageId": "pkg_20251020_0001",
  "trackingNumber": "CAN-20251020-0001",
  "zoneId": "caba",
  "type": "package",

  "origin": {
    "organizationId": "org_001",
    "organizationName": "Logística Cangallo",
    "sender": {
      "name": "E-Commerce MercadoLibre",
      "phone": "+54 11 4000-0000",
      "address": "Av. Nazca 3733, CABA"
    },
    "warehouseLocation": {
      "lat": -34.6158,
      "lng": -58.4707
    }
  },

  "destination": {
    "recipient": {
      "name": "María González",
      "phone": "+54 9 11 5555-1234",
      "alternativePhone": "+54 11 4444-5678",
      "dni": "28987654"
    },
    "address": {
      "street": "Nazca 3733",
      "floor": "3",
      "apartment": "B",
      "neighborhood": "Versalles",
      "city": "CABA",
      "state": "Buenos Aires",
      "zipCode": "C1417",
      "zone": "caba",
      "coordinates": {
        "lat": -34.6158,
        "lng": -58.4707
      },
      "instructions": "Portero eléctrico funciona, timbrar 3B"
    }
  },

  "packageDetails": {
    "description": "Ropa y accesorios",
    "weight": 2.5,
    "dimensions": {
      "length": 40,
      "width": 30,
      "height": 15,
      "unit": "cm"
    },
    "declaredValue": 237465.00,
    "currency": "ARS",
    "paymentType": "prepaid",
    "requiresSignature": true,
    "isFragile": false,
    "priority": "standard"
  },

  "status": {
    "current": "delivered",
    "timestamp": "2025-10-20T16:45:00Z",
    "history": [
      {
        "status": "created",
        "timestamp": "2025-10-20T09:00:00Z",
        "location": "Warehouse",
        "notes": "Paquete ingresado al sistema",
        "userId": "sys_scanner_001"
      },
      {
        "status": "scanned",
        "timestamp": "2025-10-20T09:15:00Z",
        "location": "Warehouse",
        "scanId": "scn_20251020_0001",
        "notes": "Etiqueta escaneada y validada por OCR",
        "userId": "usr_warehouse_003"
      },
      {
        "status": "assigned_to_driver",
        "timestamp": "2025-10-20T10:30:00Z",
        "driverId": "drv_12345",
        "driverName": "Juan Carlos Rodríguez",
        "routeId": "route_20251020_001",
        "notes": "Asignado a ruta matutina",
        "userId": "usr_dispatcher_001"
      },
      {
        "status": "out_for_delivery",
        "timestamp": "2025-10-20T11:00:00Z",
        "location": {
          "lat": -34.6158,
          "lng": -58.4707
        },
        "estimatedDeliveryTime": "2025-10-20T16:00:00Z",
        "notes": "Repartidor inició ruta",
        "userId": "drv_12345"
      },
      {
        "status": "delivered",
        "timestamp": "2025-10-20T16:45:00Z",
        "location": {
          "lat": -34.6158,
          "lng": -58.4709
        },
        "proofOfDelivery": {
          "signature": "https://storage.blob.core.windows.net/pod/sig_pkg_20251020_0001.jpg",
          "photo": "https://storage.blob.core.windows.net/pod/photo_pkg_20251020_0001.jpg",
          "recipientName": "María González",
          "recipientDni": "28987654",
          "notes": "Entregado en mano"
        },
        "userId": "drv_12345"
      }
    ]
  },

  "assignment": {
    "driverId": "drv_12345",
    "driverName": "Juan Carlos Rodríguez",
    "routeId": "route_20251020_001",
    "assignedAt": "2025-10-20T10:30:00Z",
    "sequenceNumber": 3,
    "estimatedDeliveryTime": "2025-10-20T16:00:00Z",
    "actualDeliveryTime": "2025-10-20T16:45:00Z"
  },

  "financials": {
    "deliveryFee": 237465.00,
    "driverCommission": 150.00,
    "zonBonus": 50.00,
    "totalCost": 200.00,
    "revenue": 237265.00,
    "paymentStatus": "collected",
    "settlementId": "stl_20251020_001",
    "invoiceNumber": "FC-2025-10-00123"
  },

  "scans": [
    "scn_20251020_0001",
    "scn_20251020_0002"
  ],

  "incidents": [],

  "metadata": {
    "createdAt": "2025-10-20T09:00:00Z",
    "updatedAt": "2025-10-20T16:45:00Z",
    "createdBy": "sys_scanner_001",
    "source": "android_app",
    "tags": ["high_value", "signature_required"],
    "version": 5
  }
}
```

### Ejemplo de Paquete con Incidente
```json
{
  "id": "pkg_20251022_0089",
  "packageId": "pkg_20251022_0089",
  "trackingNumber": "DEF-20251022-0089",
  "zoneId": "ramos_mejia",
  "type": "package",

  "destination": {
    "recipient": {
      "name": "Carlos Pérez",
      "phone": "+54 9 11 6666-7890"
    },
    "address": {
      "street": "Argentina 97",
      "city": "Ramos Mejía",
      "state": "Buenos Aires",
      "zone": "ramos_mejia",
      "coordinates": {
        "lat": -34.6427,
        "lng": -58.5632
      }
    }
  },

  "packageDetails": {
    "description": "Electrónica",
    "declaredValue": 117500.00,
    "currency": "ARS"
  },

  "status": {
    "current": "failed",
    "timestamp": "2025-10-22T18:30:00Z",
    "history": [
      {
        "status": "created",
        "timestamp": "2025-10-22T08:00:00Z"
      },
      {
        "status": "out_for_delivery",
        "timestamp": "2025-10-22T14:00:00Z",
        "driverId": "drv_98765"
      },
      {
        "status": "delivery_attempted",
        "timestamp": "2025-10-22T17:45:00Z",
        "notes": "Dirección cerrada, nadie atiende",
        "attemptNumber": 1
      },
      {
        "status": "failed",
        "timestamp": "2025-10-22T18:30:00Z",
        "reason": "recipient_unavailable",
        "notes": "Retorna a depósito para reprogramar"
      }
    ]
  },

  "assignment": {
    "driverId": "drv_98765",
    "driverName": "Roberto Fernández",
    "routeId": "route_20251022_005",
    "assignedAt": "2025-10-22T13:30:00Z",
    "deliveryAttempts": 1
  },

  "financials": {
    "deliveryFee": 117500.00,
    "driverCommission": 0.00,
    "deduction": 50.00,
    "deductionReason": "failed_delivery_penalty",
    "paymentStatus": "pending"
  },

  "incidents": [
    {
      "incidentId": "inc_20251022_003",
      "type": "delivery_failure",
      "severity": "medium",
      "description": "Destinatario ausente, dirección cerrada",
      "reportedBy": "drv_98765",
      "reportedAt": "2025-10-22T17:45:00Z",
      "photos": [
        "https://storage.blob.core.windows.net/incidents/inc_20251022_003_01.jpg"
      ],
      "resolution": "reschedule",
      "newDeliveryDate": "2025-10-23T14:00:00Z",
      "resolvedAt": null
    }
  ],

  "metadata": {
    "createdAt": "2025-10-22T08:00:00Z",
    "updatedAt": "2025-10-22T18:30:00Z",
    "requiresFollowUp": true,
    "tags": ["failed", "reschedule_required"]
  }
}
```

### Casos de Uso Críticos
```sql
-- 1. Buscar paquetes por zona y estado
SELECT * FROM packages p
WHERE p.zoneId = 'caba'
AND p.status.current = 'out_for_delivery'
ORDER BY p.assignment.estimatedDeliveryTime ASC

-- 2. Paquetes de un repartidor específico
SELECT * FROM packages p
WHERE p.assignment.driverId = 'drv_12345'
AND p.status.current IN ('assigned', 'out_for_delivery')

-- 3. Paquetes pendientes de liquidación
SELECT * FROM packages p
WHERE p.financials.paymentStatus = 'collected'
AND p.financials.settlementId IS NULL
AND p.createdAt >= '2025-10-20T00:00:00Z'

-- 4. Historial de entregas por dirección
SELECT * FROM packages p
WHERE p.destination.address.street = 'Nazca 3733'
ORDER BY p.status.timestamp DESC

-- 5. Paquetes con incidentes no resueltos
SELECT * FROM packages p
JOIN incident IN p.incidents
WHERE incident.resolvedAt IS NULL
AND incident.severity IN ('high', 'critical')
```

### Índices Recomendados
```sql
/zoneId ASC, /status/current ASC, /status/timestamp DESC
/assignment/driverId ASC, /status/current ASC
/financials/paymentStatus ASC, /financials/settlementId ASC
/destination/address/street ASC, /status/timestamp DESC
/status/current ASC, /packageDetails/priority DESC
```

---

## 📸 CONTENEDOR 4: SCANS

### Descripción
Almacena información de escaneos de etiquetas con datos extraídos por OCR/LLM (Phi4).

### Partition Key
```
/packageId
```
*Agrupa todos los scans de un paquete para consultas eficientes.*

### Schema JSON
```json
{
  "id": "scn_20251020_0001",
  "scanId": "scn_20251020_0001",
  "packageId": "pkg_20251020_0001",
  "type": "scan",

  "scanInfo": {
    "scanType": "label_capture",
    "scanTimestamp": "2025-10-20T09:15:00Z",
    "scannedBy": "usr_warehouse_003",
    "scannedByName": "Pedro Martínez",
    "deviceInfo": {
      "deviceId": "device_android_005",
      "model": "Samsung Galaxy A54",
      "os": "Android 14",
      "appVersion": "2.3.1",
      "gpsEnabled": true
    },
    "location": {
      "lat": -34.6158,
      "lng": -58.4707,
      "accuracy": 5,
      "locationName": "Warehouse CABA Central"
    }
  },

  "imageData": {
    "originalImage": {
      "url": "https://storage.blob.core.windows.net/scans/original/scn_20251020_0001_original.jpg",
      "blobName": "scans/original/scn_20251020_0001_original.jpg",
      "contentType": "image/jpeg",
      "sizeBytes": 2457600,
      "width": 1920,
      "height": 1080,
      "capturedAt": "2025-10-20T09:15:00Z"
    },
    "processedImage": {
      "url": "https://storage.blob.core.windows.net/scans/processed/scn_20251020_0001_processed.jpg",
      "blobName": "scans/processed/scn_20251020_0001_processed.jpg",
      "contentType": "image/jpeg",
      "sizeBytes": 876543,
      "width": 1280,
      "height": 720,
      "enhancedContrast": true,
      "croppedToBounds": true
    },
    "thumbnailImage": {
      "url": "https://storage.blob.core.windows.net/scans/thumbnails/scn_20251020_0001_thumb.jpg",
      "blobName": "scans/thumbnails/scn_20251020_0001_thumb.jpg",
      "contentType": "image/jpeg",
      "sizeBytes": 45678,
      "width": 320,
      "height": 180
    }
  },

  "ocrData": {
    "provider": "azure_ai_vision_phi4",
    "modelVersion": "phi-4-multimodal-v1",
    "processedAt": "2025-10-20T09:15:30Z",
    "processingTimeMs": 1234,
    "confidence": 0.94,
    "rawText": "Destinatario: María González\nDNI: 28987654\nDirección: Nazca 3733, 3°B\nCiudad: CABA\nTeléfono: 11-5555-1234\nMonto: $237.465\nRemitente: MercadoLibre\nFecha: 20/10/2025",

    "extractedFields": {
      "recipient": {
        "value": "María González",
        "confidence": 0.97,
        "boundingBox": [120, 45, 380, 85]
      },
      "recipientDni": {
        "value": "28987654",
        "confidence": 0.95,
        "boundingBox": [120, 95, 280, 125]
      },
      "address": {
        "street": {
          "value": "Nazca 3733",
          "confidence": 0.96,
          "boundingBox": [120, 145, 320, 175]
        },
        "floor": {
          "value": "3",
          "confidence": 0.89,
          "boundingBox": [325, 145, 350, 175]
        },
        "apartment": {
          "value": "B",
          "confidence": 0.92,
          "boundingBox": [355, 145, 380, 175]
        },
        "city": {
          "value": "CABA",
          "confidence": 0.98,
          "boundingBox": [120, 185, 220, 215]
        }
      },
      "phone": {
        "value": "+54 9 11 5555-1234",
        "confidence": 0.88,
        "normalizedValue": "+5491155551234",
        "boundingBox": [120, 225, 380, 255]
      },
      "declaredValue": {
        "value": "237465.00",
        "currency": "ARS",
        "confidence": 0.93,
        "boundingBox": [120, 265, 320, 295]
      },
      "sender": {
        "value": "MercadoLibre",
        "confidence": 0.91,
        "boundingBox": [120, 305, 320, 335]
      },
      "date": {
        "value": "20/10/2025",
        "normalizedValue": "2025-10-20",
        "confidence": 0.94,
        "boundingBox": [120, 345, 280, 375]
      }
    },

    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": [
        {
          "field": "phone",
          "message": "Phone confidence below 90%, manual review recommended",
          "severity": "low"
        }
      ]
    },

    "llmEnhancement": {
      "provider": "phi4_multimodal",
      "enhancementApplied": true,
      "corrections": [
        {
          "field": "address.street",
          "originalValue": "Nazca 37З3",
          "correctedValue": "Nazca 3733",
          "reason": "Cyrillic character detected and corrected"
        }
      ],
      "contextualInsights": {
        "handwritingQuality": "good",
        "labelCondition": "slightly worn",
        "suggestedZone": "caba",
        "estimatedDeliveryDifficulty": "easy"
      }
    }
  },

  "qualityMetrics": {
    "imageQuality": {
      "sharpness": 0.92,
      "brightness": 0.87,
      "contrast": 0.89,
      "blur": 0.08,
      "overall": "good"
    },
    "ocrQuality": {
      "overallConfidence": 0.94,
      "fieldsExtracted": 9,
      "fieldsValidated": 9,
      "requiresManualReview": false
    }
  },

  "metadata": {
    "createdAt": "2025-10-20T09:15:00Z",
    "updatedAt": "2025-10-20T09:15:30Z",
    "processingStatus": "completed",
    "retryCount": 0,
    "tags": ["warehouse_scan", "auto_validated"]
  }
}
```

### Ejemplo de Scan con Baja Confianza
```json
{
  "id": "scn_20251023_0045",
  "scanId": "scn_20251023_0045",
  "packageId": "pkg_20251023_0045",
  "type": "scan",

  "scanInfo": {
    "scanType": "label_capture",
    "scanTimestamp": "2025-10-23T14:22:00Z",
    "scannedBy": "drv_45678",
    "scannedByName": "Laura Sánchez",
    "deviceInfo": {
      "deviceId": "device_android_012",
      "model": "Motorola Moto G32",
      "os": "Android 13"
    },
    "location": {
      "lat": -34.6427,
      "lng": -58.5632,
      "locationName": "En ruta - Ramos Mejía"
    }
  },

  "imageData": {
    "originalImage": {
      "url": "https://storage.blob.core.windows.net/scans/original/scn_20251023_0045_original.jpg",
      "sizeBytes": 1456789,
      "width": 1280,
      "height": 720
    }
  },

  "ocrData": {
    "provider": "azure_ai_vision_phi4",
    "modelVersion": "phi-4-multimodal-v1",
    "processedAt": "2025-10-23T14:22:45Z",
    "processingTimeMs": 2145,
    "confidence": 0.67,
    "rawText": "Dest: Carlos P... [ilegible]\nDir: Argent... 97?\nRamos M...\nTel: 11-6666-...\nMonto: $117500",

    "extractedFields": {
      "recipient": {
        "value": "Carlos P",
        "confidence": 0.54,
        "partialExtraction": true
      },
      "address": {
        "street": {
          "value": "Argentina 97",
          "confidence": 0.72,
          "uncertain": true
        },
        "city": {
          "value": "Ramos Mejía",
          "confidence": 0.68
        }
      },
      "phone": {
        "value": "11-6666-",
        "confidence": 0.45,
        "incomplete": true
      },
      "declaredValue": {
        "value": "117500.00",
        "currency": "ARS",
        "confidence": 0.89
      }
    },

    "validation": {
      "isValid": false,
      "errors": [
        {
          "field": "recipient",
          "message": "Recipient name incomplete or illegible",
          "severity": "high"
        },
        {
          "field": "phone",
          "message": "Phone number incomplete",
          "severity": "high"
        }
      ],
      "warnings": [
        {
          "field": "address",
          "message": "Address confidence below threshold",
          "severity": "medium"
        }
      ]
    },

    "llmEnhancement": {
      "provider": "phi4_multimodal",
      "enhancementApplied": true,
      "corrections": [],
      "contextualInsights": {
        "handwritingQuality": "poor",
        "labelCondition": "damaged",
        "suggestedZone": "ramos_mejia",
        "estimatedDeliveryDifficulty": "difficult",
        "recommendations": [
          "Request new label or contact sender",
          "Manual verification required",
          "Contact recipient via alternative means"
        ]
      }
    }
  },

  "qualityMetrics": {
    "imageQuality": {
      "sharpness": 0.65,
      "brightness": 0.54,
      "contrast": 0.61,
      "blur": 0.32,
      "overall": "poor"
    },
    "ocrQuality": {
      "overallConfidence": 0.67,
      "fieldsExtracted": 5,
      "fieldsValidated": 2,
      "requiresManualReview": true
    }
  },

  "manualReview": {
    "status": "pending",
    "assignedTo": "usr_quality_001",
    "assignedAt": "2025-10-23T14:23:00Z",
    "priority": "high",
    "notes": "Etiqueta dañada, requiere contacto con remitente"
  },

  "metadata": {
    "createdAt": "2025-10-23T14:22:00Z",
    "updatedAt": "2025-10-23T14:23:00Z",
    "processingStatus": "requires_review",
    "retryCount": 2,
    "tags": ["poor_quality", "manual_review", "damaged_label"]
  }
}
```

### Casos de Uso
```sql
-- 1. Scans que requieren revisión manual
SELECT * FROM scans s
WHERE s.ocrData.validation.isValid = false
OR s.qualityMetrics.ocrQuality.requiresManualReview = true
ORDER BY s.scanInfo.scanTimestamp DESC

-- 2. Estadísticas de calidad de OCR por usuario
SELECT
  s.scanInfo.scannedBy,
  AVG(s.ocrData.confidence) as avgConfidence,
  COUNT(1) as totalScans
FROM scans s
GROUP BY s.scanInfo.scannedBy

-- 3. Scans de un paquete específico
SELECT * FROM scans s
WHERE s.packageId = 'pkg_20251020_0001'
ORDER BY s.scanInfo.scanTimestamp ASC
```

### Índices Recomendados
```sql
/packageId ASC, /scanInfo/scanTimestamp ASC
/ocrData/validation/isValid ASC, /scanInfo/scanTimestamp DESC
/scanInfo/scannedBy ASC, /scanInfo/scanTimestamp DESC
```

---

## 🗺️ CONTENEDOR 5: ROUTES

### Descripción
Rutas planificadas y optimizadas para repartidores con secuencia de paquetes.

### Partition Key
```
/routeDate-zoneId
```
*Combina fecha y zona para aislamiento temporal y geográfico.*

### Schema JSON
```json
{
  "id": "route_20251020_001",
  "routeId": "route_20251020_001",
  "routeDate-zoneId": "2025-10-20-caba",
  "type": "route",

  "routeInfo": {
    "routeDate": "2025-10-20",
    "routeName": "CABA Centro - Mañana",
    "zoneId": "caba",
    "subZones": ["palermo", "recoleta", "belgrano", "versalles"],
    "shift": "morning",
    "estimatedDuration": 240,
    "estimatedDistance": 45.5,
    "status": "completed"
  },

  "assignment": {
    "driverId": "drv_12345",
    "driverName": "Juan Carlos Rodríguez",
    "vehicleType": "motorcycle",
    "assignedAt": "2025-10-20T08:00:00Z",
    "assignedBy": "usr_dispatcher_001",
    "acceptedAt": "2025-10-20T08:05:00Z"
  },

  "packages": [
    {
      "sequenceNumber": 1,
      "packageId": "pkg_20251020_0001",
      "trackingNumber": "CAN-20251020-0001",
      "address": {
        "street": "Nazca 3733, 3°B",
        "city": "CABA",
        "zone": "versalles",
        "coordinates": {
          "lat": -34.6158,
          "lng": -58.4707
        }
      },
      "estimatedArrival": "2025-10-20T09:30:00Z",
      "actualArrival": "2025-10-20T09:25:00Z",
      "estimatedDeliveryTime": "2025-10-20T09:45:00Z",
      "actualDeliveryTime": "2025-10-20T09:38:00Z",
      "status": "delivered",
      "declaredValue": 237465.00,
      "requiresSignature": true,
      "deliveryNotes": "Entrega exitosa en tiempo"
    },
    {
      "sequenceNumber": 2,
      "packageId": "pkg_20251020_0002",
      "trackingNumber": "CAN-20251020-0002",
      "address": {
        "street": "Av. Santa Fe 1955",
        "city": "CABA",
        "zone": "recoleta",
        "coordinates": {
          "lat": -34.5964,
          "lng": -58.3876
        }
      },
      "estimatedArrival": "2025-10-20T10:15:00Z",
      "actualArrival": "2025-10-20T10:22:00Z",
      "estimatedDeliveryTime": "2025-10-20T10:30:00Z",
      "actualDeliveryTime": "2025-10-20T10:35:00Z",
      "status": "delivered",
      "declaredValue": 72491.00,
      "requiresSignature": true,
      "deliveryNotes": "Entrega con 5 min de retraso por tráfico"
    },
    {
      "sequenceNumber": 3,
      "packageId": "pkg_20251020_0003",
      "trackingNumber": "CAN-20251020-0003",
      "address": {
        "street": "Belgrano 2958, PB",
        "city": "CABA",
        "zone": "belgrano",
        "coordinates": {
          "lat": -34.5614,
          "lng": -58.4565
        }
      },
      "estimatedArrival": "2025-10-20T11:00:00Z",
      "actualArrival": "2025-10-20T11:05:00Z",
      "estimatedDeliveryTime": "2025-10-20T11:15:00Z",
      "actualDeliveryTime": "2025-10-20T11:12:00Z",
      "status": "delivered",
      "declaredValue": 73000.00,
      "requiresSignature": false,
      "deliveryNotes": "Dejado en recepción del edificio"
    }
  ],

  "optimization": {
    "algorithm": "genetic_tsp_solver",
    "optimizationGoal": "minimize_distance",
    "alternativeRoutes": 3,
    "selectedRouteRank": 1,
    "estimatedSavings": {
      "distanceKm": 8.3,
      "timeMinutes": 25
    },
    "computedAt": "2025-10-20T07:45:00Z"
  },

  "timeline": {
    "startTime": "2025-10-20T09:00:00Z",
    "firstDeliveryTime": "2025-10-20T09:38:00Z",
    "lastDeliveryTime": "2025-10-20T15:22:00Z",
    "endTime": "2025-10-20T16:00:00Z",
    "totalDurationMinutes": 420,
    "activeDurationMinutes": 344,
    "idleTimeMinutes": 76
  },

  "performance": {
    "totalPackages": 18,
    "delivered": 16,
    "failed": 1,
    "returned": 1,
    "successRate": 0.89,
    "onTimeDeliveries": 14,
    "onTimeRate": 0.78,
    "totalDistance": 42.3,
    "averageTimePerDelivery": 19.1
  },

  "tracking": {
    "gpsEnabled": true,
    "trackingPoints": [
      {
        "timestamp": "2025-10-20T09:00:00Z",
        "lat": -34.6158,
        "lng": -58.4707,
        "speed": 0,
        "event": "route_started"
      },
      {
        "timestamp": "2025-10-20T09:25:00Z",
        "lat": -34.6158,
        "lng": -58.4709,
        "speed": 15,
        "event": "arrived_at_stop"
      },
      {
        "timestamp": "2025-10-20T09:38:00Z",
        "lat": -34.6158,
        "lng": -58.4709,
        "speed": 0,
        "event": "package_delivered"
      }
    ],
    "routePolyline": "encrypted_polyline_string_here"
  },

  "metadata": {
    "createdAt": "2025-10-20T07:45:00Z",
    "updatedAt": "2025-10-20T16:00:00Z",
    "createdBy": "sys_route_optimizer",
    "version": 2,
    "tags": ["morning_shift", "high_performance", "completed"]
  }
}
```

### Casos de Uso
```sql
-- 1. Rutas activas de hoy por zona
SELECT * FROM routes r
WHERE r["routeDate-zoneId"] >= '2025-10-27-'
AND r.routeInfo.status IN ('assigned', 'in_progress')

-- 2. Performance de repartidor en período
SELECT * FROM routes r
WHERE r.assignment.driverId = 'drv_12345'
AND r.routeInfo.routeDate >= '2025-10-01'
ORDER BY r.routeInfo.routeDate DESC

-- 3. Rutas con bajo rendimiento
SELECT * FROM routes r
WHERE r.performance.successRate < 0.85
AND r.routeInfo.status = 'completed'
```

### Índices Recomendados
```sql
/routeDate-zoneId ASC, /routeInfo/status ASC
/assignment/driverId ASC, /routeInfo/routeDate DESC
/performance/successRate ASC
```

---

## 💰 CONTENEDOR 6: SETTLEMENTS

### Descripción
Liquidaciones periódicas de repartidores con cálculo de comisiones y descuentos.

### Partition Key
```
/period-organizationId
```
*Aísla liquidaciones por período y organización para procesamiento paralelo.*

### Schema JSON
```json
{
  "id": "stl_20251020_001",
  "settlementId": "stl_20251020_001",
  "period-organizationId": "2025-W42-org_001",
  "type": "settlement",

  "settlementInfo": {
    "periodType": "weekly",
    "period": "2025-W42",
    "startDate": "2025-10-14",
    "endDate": "2025-10-20",
    "organizationId": "org_001",
    "organizationName": "Logística Cangallo",
    "status": "approved",
    "createdAt": "2025-10-21T08:00:00Z",
    "approvedAt": "2025-10-21T10:30:00Z",
    "approvedBy": "usr_admin_001",
    "paidAt": "2025-10-21T15:00:00Z",
    "paymentMethod": "bank_transfer"
  },

  "driverInfo": {
    "driverId": "drv_12345",
    "driverName": "Juan Carlos Rodríguez",
    "driverCbu": "0140987654321098765432",
    "subLogisticsId": "org_001"
  },

  "packagesSummary": {
    "totalPackages": 87,
    "delivered": 82,
    "failed": 3,
    "returned": 2,
    "successRate": 0.94,
    "onTimeDeliveries": 73,
    "onTimeRate": 0.89
  },

  "earnings": {
    "baseEarnings": {
      "deliveryCommission": {
        "packagesDelivered": 82,
        "ratePerPackage": 150.00,
        "subtotal": 12300.00
      },
      "distanceCommission": {
        "totalKm": 456.7,
        "ratePerKm": 25.00,
        "subtotal": 11417.50
      },
      "zoneBonuses": [
        {
          "zone": "caba",
          "packages": 45,
          "bonusPerPackage": 50.00,
          "subtotal": 2250.00
        },
        {
          "zone": "ramos_mejia",
          "packages": 23,
          "bonusPerPackage": 75.00,
          "subtotal": 1725.00
        },
        {
          "zone": "benavidez",
          "packages": 14,
          "bonusPerPackage": 100.00,
          "subtotal": 1400.00
        }
      ],
      "performanceBonuses": [
        {
          "type": "high_success_rate",
          "condition": ">= 90%",
          "actualRate": 0.94,
          "amount": 2000.00
        },
        {
          "type": "weekly_streak",
          "condition": "No failed deliveries in 3 consecutive days",
          "daysAchieved": 5,
          "amount": 1500.00
        }
      ],
      "totalBase": 32592.50
    },

    "deductions": {
      "failedDeliveries": {
        "count": 3,
        "penaltyPerFailure": 50.00,
        "subtotal": -150.00,
        "packages": [
          {
            "packageId": "pkg_20251018_0045",
            "reason": "recipient_unavailable",
            "penaltyAmount": 50.00
          },
          {
            "packageId": "pkg_20251019_0078",
            "reason": "address_not_found",
            "penaltyAmount": 50.00
          },
          {
            "packageId": "pkg_20251020_0023",
            "reason": "refused_by_recipient",
            "penaltyAmount": 50.00
          }
        ]
      },
      "returnedPackages": {
        "count": 2,
        "penaltyPerReturn": 75.00,
        "subtotal": -150.00,
        "packages": [
          {
            "packageId": "pkg_20251017_0089",
            "reason": "damaged_package",
            "penaltyAmount": 75.00
          },
          {
            "packageId": "pkg_20251019_0102",
            "reason": "incorrect_address",
            "penaltyAmount": 75.00
          }
        ]
      },
      "lateFees": {
        "count": 9,
        "penaltyPerLate": 20.00,
        "subtotal": -180.00,
        "threshold": "15 minutes"
      },
      "fuelAdvance": {
        "advanceDate": "2025-10-15",
        "amount": -2000.00,
        "notes": "Adelanto de combustible solicitado"
      },
      "equipmentDeduction": {
        "item": "Casco de repuesto",
        "amount": -850.00,
        "installment": "2 of 3"
      },
      "totalDeductions": -3330.00
    },

    "netEarnings": 29262.50,
    "currency": "ARS"
  },

  "packagesList": [
    "pkg_20251020_0001",
    "pkg_20251020_0002",
    "pkg_20251020_0003"
  ],

  "routesList": [
    "route_20251020_001",
    "route_20251021_004",
    "route_20251022_007"
  ],

  "paymentDetails": {
    "paymentId": "pay_20251021_0045",
    "bankTransferReference": "TRF-1021-987654",
    "paymentDate": "2025-10-21T15:00:00Z",
    "confirmedAt": "2025-10-21T16:30:00Z",
    "receiptUrl": "https://storage.blob.core.windows.net/receipts/stl_20251020_001_receipt.pdf"
  },

  "notes": [
    {
      "addedBy": "usr_admin_001",
      "addedAt": "2025-10-21T10:15:00Z",
      "note": "Excelente rendimiento esta semana, bonificación adicional aplicada"
    }
  ],

  "metadata": {
    "createdAt": "2025-10-21T08:00:00Z",
    "updatedAt": "2025-10-21T16:30:00Z",
    "createdBy": "sys_settlement_processor",
    "version": 3,
    "tags": ["paid", "high_performance", "weekly"]
  }
}
```

### Ejemplo de Settlement con Conflicto
```json
{
  "id": "stl_20251020_089",
  "settlementId": "stl_20251020_089",
  "period-organizationId": "2025-W42-org_002",
  "type": "settlement",

  "settlementInfo": {
    "periodType": "weekly",
    "period": "2025-W42",
    "startDate": "2025-10-14",
    "endDate": "2025-10-20",
    "organizationId": "org_002",
    "organizationName": "Defilippi Logística",
    "status": "disputed",
    "createdAt": "2025-10-21T08:00:00Z",
    "disputedAt": "2025-10-21T11:45:00Z",
    "disputedBy": "drv_98765"
  },

  "driverInfo": {
    "driverId": "drv_98765",
    "driverName": "Roberto Fernández",
    "driverCbu": "0170123456789012345678",
    "subLogisticsId": "org_002"
  },

  "packagesSummary": {
    "totalPackages": 65,
    "delivered": 52,
    "failed": 8,
    "returned": 5,
    "successRate": 0.80,
    "onTimeDeliveries": 45,
    "onTimeRate": 0.87
  },

  "earnings": {
    "baseEarnings": {
      "deliveryCommission": {
        "packagesDelivered": 52,
        "ratePerPackage": 150.00,
        "subtotal": 7800.00
      },
      "totalBase": 15420.00
    },

    "deductions": {
      "failedDeliveries": {
        "count": 8,
        "penaltyPerFailure": 50.00,
        "subtotal": -400.00
      },
      "returnedPackages": {
        "count": 5,
        "penaltyPerReturn": 75.00,
        "subtotal": -375.00
      },
      "damagedPackages": {
        "count": 2,
        "penaltyPerDamage": 200.00,
        "subtotal": -400.00,
        "packages": [
          {
            "packageId": "pkg_20251018_0234",
            "reason": "package_wet_damaged",
            "penaltyAmount": 200.00,
            "declaredValue": 85000.00
          },
          {
            "packageId": "pkg_20251019_0456",
            "reason": "package_crushed",
            "penaltyAmount": 200.00,
            "declaredValue": 120000.00
          }
        ]
      },
      "totalDeductions": -1175.00
    },

    "netEarnings": 14245.00,
    "currency": "ARS"
  },

  "dispute": {
    "disputeId": "disp_20251021_003",
    "status": "under_review",
    "raisedBy": "drv_98765",
    "raisedAt": "2025-10-21T11:45:00Z",
    "reason": "incorrect_damaged_package_penalty",
    "description": "Los 2 paquetes dañados llegaron en mal estado desde el depósito. Tengo fotos al recibirlos que lo demuestran.",
    "evidence": [
      "https://storage.blob.core.windows.net/disputes/disp_20251021_003_evidence_01.jpg",
      "https://storage.blob.core.windows.net/disputes/disp_20251021_003_evidence_02.jpg"
    ],
    "requestedAdjustment": {
      "removeDeductions": ["pkg_20251018_0234", "pkg_20251019_0456"],
      "adjustmentAmount": 400.00,
      "newNetEarnings": 14645.00
    },
    "assignedTo": "usr_disputes_002",
    "reviewNotes": [
      {
        "addedBy": "usr_disputes_002",
        "addedAt": "2025-10-21T14:00:00Z",
        "note": "Evidencia recibida, verificando con warehouse. Paquetes efectivamente tenían daños previos."
      }
    ],
    "resolvedAt": null,
    "resolution": null
  },

  "metadata": {
    "createdAt": "2025-10-21T08:00:00Z",
    "updatedAt": "2025-10-21T14:00:00Z",
    "createdBy": "sys_settlement_processor",
    "version": 4,
    "tags": ["disputed", "under_review", "weekly"]
  }
}
```

### Casos de Uso Críticos
```sql
-- 1. Liquidaciones pendientes de pago
SELECT * FROM settlements s
WHERE s.settlementInfo.status = 'approved'
AND s.settlementInfo.paidAt IS NULL

-- 2. Liquidaciones en disputa
SELECT * FROM settlements s
WHERE s.settlementInfo.status = 'disputed'
AND s.dispute.status = 'under_review'

-- 3. Total a pagar por período y organización
SELECT
  s["period-organizationId"],
  SUM(s.earnings.netEarnings) as totalToPay,
  COUNT(1) as totalSettlements
FROM settlements s
WHERE s.settlementInfo.status = 'approved'
GROUP BY s["period-organizationId"]

-- 4. Repartidores con bajas tasas de éxito
SELECT * FROM settlements s
WHERE s.packagesSummary.successRate < 0.85
AND s.settlementInfo.period = '2025-W42'
ORDER BY s.packagesSummary.successRate ASC

-- 5. Historial de liquidaciones de repartidor
SELECT * FROM settlements s
WHERE s.driverInfo.driverId = 'drv_12345'
ORDER BY s.settlementInfo.startDate DESC
```

### Índices Recomendados
```sql
/period-organizationId ASC, /settlementInfo/status ASC
/driverInfo/driverId ASC, /settlementInfo/startDate DESC
/settlementInfo/status ASC, /settlementInfo/paidAt ASC
/packagesSummary/successRate ASC
```

---

## 💳 CONTENEDOR 7: TRANSACTIONS

### Descripción
Registro de todas las transacciones financieras (cobros, pagos, ajustes).

### Partition Key
```
/transactionDate-organizationId
```
*Particiona por fecha y organización para optimizar consultas temporales.*

### Schema JSON
```json
{
  "id": "txn_20251020_000123",
  "transactionId": "txn_20251020_000123",
  "transactionDate-organizationId": "2025-10-20-org_001",
  "type": "transaction",

  "transactionInfo": {
    "transactionType": "package_collection",
    "timestamp": "2025-10-20T16:45:00Z",
    "status": "completed",
    "organizationId": "org_001",
    "organizationName": "Logística Cangallo"
  },

  "relatedEntities": {
    "packageId": "pkg_20251020_0001",
    "trackingNumber": "CAN-20251020-0001",
    "driverId": "drv_12345",
    "driverName": "Juan Carlos Rodríguez",
    "routeId": "route_20251020_001"
  },

  "amount": {
    "gross": 237465.00,
    "net": 237265.00,
    "currency": "ARS",
    "breakdown": {
      "packageValue": 237465.00,
      "deliveryFee": 0.00,
      "driverCommission": 150.00,
      "zoneBonus": 50.00,
      "organizationRevenue": 237265.00
    }
  },

  "paymentDetails": {
    "paymentMethod": "cash",
    "paymentStatus": "collected",
    "collectedBy": "drv_12345",
    "collectedAt": "2025-10-20T16:45:00Z",
    "receiptNumber": "RCP-20251020-000123",
    "verifiedAt": "2025-10-20T18:00:00Z",
    "verifiedBy": "usr_finance_001"
  },

  "reconciliation": {
    "status": "reconciled",
    "reconciledAt": "2025-10-21T09:00:00Z",
    "reconciledBy": "usr_finance_001",
    "settlementId": "stl_20251020_001",
    "notes": "Cobro verificado, incluido en liquidación semanal"
  },

  "metadata": {
    "createdAt": "2025-10-20T16:45:00Z",
    "updatedAt": "2025-10-21T09:00:00Z",
    "source": "android_app",
    "tags": ["high_value", "cash_collection"]
  }
}
```

### Ejemplo de Transacción de Pago a Repartidor
```json
{
  "id": "txn_20251021_999456",
  "transactionId": "txn_20251021_999456",
  "transactionDate-organizationId": "2025-10-21-org_001",
  "type": "transaction",

  "transactionInfo": {
    "transactionType": "driver_payment",
    "timestamp": "2025-10-21T15:00:00Z",
    "status": "completed",
    "organizationId": "org_001",
    "organizationName": "Logística Cangallo"
  },

  "relatedEntities": {
    "settlementId": "stl_20251020_001",
    "driverId": "drv_12345",
    "driverName": "Juan Carlos Rodríguez"
  },

  "amount": {
    "gross": 29262.50,
    "net": 29262.50,
    "currency": "ARS",
    "breakdown": {
      "baseEarnings": 32592.50,
      "deductions": -3330.00,
      "netPayment": 29262.50
    }
  },

  "paymentDetails": {
    "paymentMethod": "bank_transfer",
    "paymentStatus": "paid",
    "bankAccount": {
      "bank": "Banco Provincia",
      "cbu": "0140987654321098765432",
      "accountHolder": "Juan Carlos Rodríguez"
    },
    "transferReference": "TRF-1021-987654",
    "initiatedAt": "2025-10-21T15:00:00Z",
    "confirmedAt": "2025-10-21T16:30:00Z",
    "receiptUrl": "https://storage.blob.core.windows.net/receipts/txn_20251021_999456.pdf"
  },

  "reconciliation": {
    "status": "reconciled",
    "reconciledAt": "2025-10-21T16:30:00Z",
    "reconciledBy": "sys_banking_integration",
    "notes": "Pago confirmado por banco"
  },

  "metadata": {
    "createdAt": "2025-10-21T15:00:00Z",
    "updatedAt": "2025-10-21T16:30:00Z",
    "source": "settlement_processor",
    "tags": ["driver_payment", "weekly_settlement", "completed"]
  }
}
```

### Casos de Uso
```sql
-- 1. Transacciones del día por organización
SELECT * FROM transactions t
WHERE t["transactionDate-organizationId"] >= '2025-10-27-org_001'
AND t["transactionDate-organizationId"] < '2025-10-28-org_001'

-- 2. Cobros pendientes de reconciliación
SELECT * FROM transactions t
WHERE t.transactionInfo.transactionType = 'package_collection'
AND t.reconciliation.status = 'pending'

-- 3. Total cobrado por repartidor en período
SELECT
  t.relatedEntities.driverId,
  SUM(t.amount.gross) as totalCollected
FROM transactions t
WHERE t["transactionDate-organizationId"] >= '2025-10-20-'
AND t.transactionInfo.transactionType = 'package_collection'
AND t.paymentDetails.paymentStatus = 'collected'
GROUP BY t.relatedEntities.driverId
```

### Índices Recomendados
```sql
/transactionDate-organizationId ASC, /transactionInfo/transactionType ASC
/relatedEntities/driverId ASC, /transactionInfo/timestamp DESC
/paymentDetails/paymentStatus ASC, /reconciliation/status ASC
```

---

## 📊 CONTENEDOR 8: ANALYTICS

### Descripción
Datos pre-agregados para dashboard y reportes. Se actualiza mediante triggers o batch jobs.

### Partition Key
```
/aggregationKey
```
*Formato: `{type}_{period}_{entityId}` (ej: "daily_2025-10-20_org_001")*

### Schema JSON - Analytics Diarios por Organización
```json
{
  "id": "analytics_daily_20251020_org_001",
  "analyticsId": "analytics_daily_20251020_org_001",
  "aggregationKey": "daily_2025-10-20_org_001",
  "type": "analytics",

  "aggregationInfo": {
    "aggregationType": "daily_organization",
    "period": "2025-10-20",
    "periodType": "day",
    "organizationId": "org_001",
    "organizationName": "Logística Cangallo",
    "lastUpdated": "2025-10-20T23:59:59Z",
    "dataCompleteness": 1.0
  },

  "packageMetrics": {
    "total": 123,
    "delivered": 116,
    "failed": 5,
    "returned": 2,
    "inTransit": 0,
    "pending": 0,
    "successRate": 0.94,
    "deliveryRate": 0.96,
    "byZone": {
      "caba": {
        "total": 67,
        "delivered": 65,
        "failed": 2,
        "successRate": 0.97
      },
      "ramos_mejia": {
        "total": 34,
        "delivered": 31,
        "failed": 2,
        "returned": 1,
        "successRate": 0.91
      },
      "benavidez": {
        "total": 22,
        "delivered": 20,
        "failed": 1,
        "returned": 1,
        "successRate": 0.91
      }
    },
    "byPriority": {
      "urgent": {
        "total": 15,
        "delivered": 15,
        "averageDeliveryTime": 125
      },
      "standard": {
        "total": 108,
        "delivered": 101,
        "averageDeliveryTime": 245
      }
    }
  },

  "financialMetrics": {
    "totalRevenue": 8765432.00,
    "totalCost": 456789.00,
    "netProfit": 8308643.00,
    "averagePackageValue": 71254.34,
    "totalCollected": 8765432.00,
    "pendingCollection": 0.00,
    "driverPayments": 456789.00,
    "currency": "ARS"
  },

  "driverMetrics": {
    "activeDrivers": 45,
    "totalRoutes": 52,
    "averagePackagesPerDriver": 2.73,
    "averageSuccessRate": 0.94,
    "topPerformers": [
      {
        "driverId": "drv_12345",
        "driverName": "Juan Carlos Rodríguez",
        "packagesDelivered": 18,
        "successRate": 0.95,
        "revenue": 1245678.00
      },
      {
        "driverId": "drv_23456",
        "driverName": "María Fernández",
        "packagesDelivered": 16,
        "successRate": 0.94,
        "revenue": 987654.00
      }
    ],
    "needsAttention": [
      {
        "driverId": "drv_98765",
        "driverName": "Roberto Gómez",
        "packagesDelivered": 12,
        "successRate": 0.75,
        "issues": ["high_failure_rate", "multiple_returns"]
      }
    ]
  },

  "operationalMetrics": {
    "averageDeliveryTime": 234,
    "onTimeDeliveryRate": 0.89,
    "totalDistance": 2345.6,
    "averageDistancePerPackage": 19.1,
    "scanQuality": {
      "totalScans": 145,
      "autoValidated": 132,
      "manualReview": 13,
      "averageOcrConfidence": 0.91
    },
    "incidents": {
      "total": 7,
      "resolved": 5,
      "pending": 2,
      "byType": {
        "address_not_found": 3,
        "recipient_unavailable": 2,
        "damaged_package": 1,
        "other": 1
      }
    }
  },

  "timeSeriesData": {
    "hourlyDeliveries": [
      {"hour": "09:00", "count": 8, "successRate": 1.0},
      {"hour": "10:00", "count": 12, "successRate": 0.92},
      {"hour": "11:00", "count": 15, "successRate": 0.93},
      {"hour": "12:00", "count": 11, "successRate": 0.91},
      {"hour": "13:00", "count": 9, "successRate": 0.89},
      {"hour": "14:00", "count": 14, "successRate": 0.93},
      {"hour": "15:00", "count": 18, "successRate": 0.94},
      {"hour": "16:00", "count": 16, "successRate": 0.94},
      {"hour": "17:00", "count": 13, "successRate": 0.92}
    ]
  },

  "comparisons": {
    "vsYesterday": {
      "packagesChange": "+12%",
      "revenueChange": "+8.5%",
      "successRateChange": "+1.2%"
    },
    "vsLastWeek": {
      "packagesChange": "+5%",
      "revenueChange": "+6.8%",
      "successRateChange": "+0.5%"
    }
  },

  "metadata": {
    "createdAt": "2025-10-20T23:59:59Z",
    "updatedAt": "2025-10-20T23:59:59Z",
    "computedBy": "sys_analytics_processor",
    "computationTimeMs": 3456,
    "tags": ["daily", "organization", "complete"]
  }
}
```

### Schema JSON - Analytics Semanales Global
```json
{
  "id": "analytics_weekly_2025_W42_global",
  "analyticsId": "analytics_weekly_2025_W42_global",
  "aggregationKey": "weekly_2025-W42_global",
  "type": "analytics",

  "aggregationInfo": {
    "aggregationType": "weekly_global",
    "period": "2025-W42",
    "periodType": "week",
    "startDate": "2025-10-14",
    "endDate": "2025-10-20",
    "lastUpdated": "2025-10-21T00:30:00Z",
    "dataCompleteness": 1.0
  },

  "packageMetrics": {
    "total": 1523,
    "delivered": 1432,
    "failed": 67,
    "returned": 24,
    "successRate": 0.94,
    "byOrganization": {
      "org_001": {
        "name": "Logística Cangallo",
        "total": 876,
        "delivered": 829,
        "successRate": 0.95,
        "revenue": 52341234.00
      },
      "org_002": {
        "name": "Defilippi Logística",
        "total": 647,
        "delivered": 603,
        "successRate": 0.93,
        "revenue": 38765432.00
      }
    },
    "growthRate": 0.15
  },

  "financialMetrics": {
    "totalRevenue": 91106666.00,
    "totalCost": 5678901.00,
    "netProfit": 85427765.00,
    "profitMargin": 0.94,
    "currency": "ARS",
    "byOrganization": {
      "org_001": {
        "revenue": 52341234.00,
        "cost": 3234567.00,
        "profit": 49106667.00
      },
      "org_002": {
        "revenue": 38765432.00,
        "cost": 2444334.00,
        "profit": 36321098.00
      }
    }
  },

  "driverMetrics": {
    "totalDrivers": 87,
    "activeDrivers": 82,
    "averagePackagesPerDriver": 17.5,
    "averageEarningsPerDriver": 23456.78,
    "topPerformers": [
      {
        "rank": 1,
        "driverId": "drv_12345",
        "driverName": "Juan Carlos Rodríguez",
        "organizationId": "org_001",
        "packagesDelivered": 87,
        "successRate": 0.94,
        "earnings": 29262.50
      }
    ]
  },

  "operationalMetrics": {
    "totalRoutes": 412,
    "totalDistance": 18765.4,
    "averageRouteDistance": 45.5,
    "averageDeliveryTime": 238,
    "onTimeDeliveryRate": 0.88,
    "fuelEfficiency": 41.2
  },

  "trends": {
    "dailyPackages": [
      {"date": "2025-10-14", "count": 234, "successRate": 0.95},
      {"date": "2025-10-15", "count": 218, "successRate": 0.93},
      {"date": "2025-10-16", "count": 209, "successRate": 0.94},
      {"date": "2025-10-17", "count": 225, "successRate": 0.94},
      {"date": "2025-10-18", "count": 198, "successRate": 0.92},
      {"date": "2025-10-19", "count": 187, "successRate": 0.93},
      {"date": "2025-10-20", "count": 252, "successRate": 0.96}
    ],
    "peakHours": ["15:00", "16:00", "10:00"],
    "peakDays": ["monday", "thursday", "friday"]
  },

  "kpis": {
    "customerSatisfaction": 4.7,
    "firstAttemptSuccess": 0.89,
    "returnRate": 0.016,
    "damageRate": 0.003,
    "averageDeliveryWindow": 4.2,
    "driverUtilization": 0.87
  },

  "metadata": {
    "createdAt": "2025-10-21T00:30:00Z",
    "updatedAt": "2025-10-21T00:30:00Z",
    "computedBy": "sys_analytics_processor",
    "computationTimeMs": 45678,
    "tags": ["weekly", "global", "complete", "executive_summary"]
  }
}
```

### Casos de Uso Dashboard
```sql
-- 1. Dashboard principal - métricas del día
SELECT * FROM analytics a
WHERE a.aggregationKey = 'daily_2025-10-27_global'

-- 2. Performance por organización hoy
SELECT * FROM analytics a
WHERE STARTSWITH(a.aggregationKey, 'daily_2025-10-27_org_')

-- 3. Tendencias semanales
SELECT * FROM analytics a
WHERE a.aggregationInfo.aggregationType = 'weekly_global'
ORDER BY a.aggregationInfo.period DESC
OFFSET 0 LIMIT 12

-- 4. Comparación entre organizaciones
SELECT * FROM analytics a
WHERE a.aggregationInfo.period = '2025-W42'
AND a.aggregationInfo.aggregationType = 'weekly_organization'
ORDER BY a.financialMetrics.totalRevenue DESC
```

### Índices Recomendados
```sql
/aggregationKey ASC
/aggregationInfo/aggregationType ASC, /aggregationInfo/period DESC
/aggregationInfo/organizationId ASC, /aggregationInfo/period DESC
```

---

## 🔍 ESTRATEGIA DE PARTICIONAMIENTO Y ESCALABILIDAD

### Resumen de Partition Keys

| Contenedor | Partition Key | Justificación | Cardinalidad Esperada |
|------------|---------------|---------------|----------------------|
| Organizations | `/organizationId` | Aislamiento por tenant | Baja (~100) |
| Drivers | `/subLogisticsId` | Distribución por organización | Media (~100) |
| Packages | `/zoneId` | Distribución geográfica | Media (~20-50) |
| Scans | `/packageId` | Agrupación por paquete | Alta (1M+) |
| Routes | `/routeDate-zoneId` | Temporal + geográfica | Media (~500/día) |
| Settlements | `/period-organizationId` | Temporal + tenant | Media (~1000/semana) |
| Transactions | `/transactionDate-organizationId` | Temporal + tenant | Alta (10K+/día) |
| Analytics | `/aggregationKey` | Por tipo de agregación | Baja (~1000) |

### Consideraciones de RU (Request Units)

**Operaciones Estimadas:**
- **Write Packages**: ~400 RU/s (10,000 paquetes/día)
- **Read Packages**: ~800 RU/s (consultas dashboard, apps)
- **Write Scans**: ~600 RU/s (OCR processing)
- **Read Analytics**: ~200 RU/s (dashboard queries)
- **Write Analytics**: ~100 RU/s (batch updates)
- **Settlements**: ~50 RU/s (procesamiento semanal)

**Configuración Recomendada:**
- **Modo**: Autoscale
- **RU Mínimos**: 4,000 RU/s
- **RU Máximos**: 20,000 RU/s
- **Costo Estimado**: ~USD 1,200-6,000/mes según carga

### Patrones de Indexación

**Índices Compuestos Críticos:**
```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/*"}
  ],
  "excludedPaths": [
    {"path": "/imageData/*"},
    {"path": "/ocrData/rawText"},
    {"path": "/_etag/?"}
  ],
  "compositeIndexes": [
    [
      {"path": "/zoneId", "order": "ascending"},
      {"path": "/status/current", "order": "ascending"},
      {"path": "/status/timestamp", "order": "descending"}
    ],
    [
      {"path": "/assignment/driverId", "order": "ascending"},
      {"path": "/status/current", "order": "ascending"}
    ],
    [
      {"path": "/financials/paymentStatus", "order": "ascending"},
      {"path": "/createdAt", "order": "descending"}
    ]
  ]
}
```

---

## 🔐 SEGURIDAD Y COMPLIANCE

### Control de Acceso (RBAC)

**Roles Definidos:**
1. **Admin**: Acceso total
2. **Manager**: Lectura/escritura organizaciones, drivers, settlements
3. **Dispatcher**: Lectura/escritura packages, routes
4. **Driver**: Lectura/escritura limitada (solo sus propios datos)
5. **Finance**: Lectura/escritura settlements, transactions
6. **Analytics**: Solo lectura analytics

**Implementación:**
```json
{
  "dataActions": [
    "Microsoft.DocumentDB/databaseAccounts/readMetadata",
    "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/read",
    "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/create",
    "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/replace"
  ],
  "condition": "@Resource[organizationId] == @User[organizationId]"
}
```

### Encriptación

**En Reposo:**
- Cosmos DB encriptación nativa (AES-256)
- Azure Key Vault para claves de encriptación
- Datos sensibles: DNI, CBU, teléfono → encriptación adicional a nivel aplicación

**En Tránsito:**
- TLS 1.2+ obligatorio
- Certificados SSL para todos los endpoints
- VPN para acceso administrativo

### Auditoría

**Logs Requeridos:**
- Todos los accesos a settlements y transactions
- Modificaciones de drivers y organizations
- Cambios en configuración de comisiones
- Accesos a datos financieros

**Implementación:**
- Azure Monitor + Log Analytics
- Retención: 7 años (compliance)
- Alertas automáticas por accesos sospechosos

---

## 📈 ESTRATEGIA DE BACKUP Y DR

### Backups

**Configuración:**
- **Continuous Backup Mode** activado
- **Point-in-Time Restore**: Últimos 30 días
- **Geo-Redundancy**: Activada (Brazil South como secundaria)
- **Backup Interval**: Cada 4 horas
- **Retention**: 30 días online, 7 años archivado

### Disaster Recovery

**RTO/RPO:**
- **RTO**: < 4 horas
- **RPO**: < 1 hora
- **Multi-Region**: Primary (East US 2), Secondary (Brazil South)

**Procedimiento:**
1. Automatic failover configurado
2. Read replicas en región secundaria
3. Runbooks automatizados para failover manual
4. Testing trimestral de DR

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Infraestructura Base (Semana 1-2)
- [ ] Crear Cosmos DB account con configuración multi-region
- [ ] Crear database "logistics_db"
- [ ] Crear 8 contenedores con partition keys definidos
- [ ] Configurar índices compuestos
- [ ] Implementar RBAC y políticas de seguridad
- [ ] Configurar backups y DR

### Fase 2: Migración de Datos Existentes (Semana 3-4)
- [ ] Script de migración desde Excel/CSV
- [ ] Validación de datos migrados
- [ ] Generación de IDs y relaciones
- [ ] Carga inicial de organizations y drivers
- [ ] Testing de queries críticos

### Fase 3: Integración con Backend (Semana 5-8)
- [ ] Azure Functions para APIs CRUD
- [ ] Integración con Azure AI Vision (Phi4)
- [ ] Procesamiento de scans y OCR
- [ ] Cálculo automático de settlements
- [ ] Webhooks para notificaciones

### Fase 4: Aplicación Android (Semana 9-12)
- [ ] UI para captura de etiquetas
- [ ] Integración con cámara y ML Kit
- [ ] Sincronización con Cosmos DB
- [ ] Geolocalización en tiempo real
- [ ] Modo offline con sincronización

### Fase 5: Dashboard Web (Semana 13-16)
- [ ] Dashboard ejecutivo (métricas globales)
- [ ] Vista por organización
- [ ] Gestión de repartidores
- [ ] Módulo de liquidaciones
- [ ] Reportes y exports (PDF, Excel)

### Fase 6: Optimización y Go-Live (Semana 17-20)
- [ ] Load testing y optimización de RUs
- [ ] Ajuste de índices según queries reales
- [ ] Capacitación de usuarios
- [ ] Deployment a producción
- [ ] Monitoreo post-go-live

---

## 💡 MEJORES PRÁCTICAS Y RECOMENDACIONES

### Performance
1. **Usar SELECT específicos**: Evitar `SELECT *`, especificar campos necesarios
2. **Limitar resultados**: Usar `TOP` o `OFFSET/LIMIT` para paginación
3. **Consultas por partition key**: Siempre incluir partition key en queries
4. **Evitar cross-partition queries** en operaciones frecuentes
5. **Caché**: Implementar Azure Cache for Redis para analytics

### Escalabilidad
1. **Autoscale RUs**: Configurar autoscale para manejar picos
2. **Sharding lógico**: Partition keys bien diseñados
3. **Batch operations**: Usar bulk inserts para cargas masivas
4. **TTL**: Configurar Time-To-Live para datos antiguos (logs, scans obsoletos)

### Costos
1. **Monitorear RU consumption**: Azure Monitor dashboards
2. **Optimizar índices**: Excluir paths innecesarios
3. **Comprimir imágenes**: Usar Blob Storage tier apropiado
4. **Archivar datos antiguos**: Mover a Storage Archive tier después de 1 año

### Desarrollo
1. **Cosmos DB Emulator**: Usar para desarrollo local
2. **SDK oficial**: Azure Cosmos DB SDK para Node.js/Python
3. **Retry policies**: Implementar retry logic para throttling
4. **Cosmos DB Change Feed**: Para triggers y procesamiento asíncrono

---

## 📚 QUERIES DE EJEMPLO OPTIMIZADOS

### Query 1: Dashboard Principal - Paquetes Activos por Zona
```sql
SELECT
  p.zoneId,
  COUNT(1) as totalPackages,
  SUM(CASE WHEN p.status.current = 'delivered' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN p.status.current = 'out_for_delivery' THEN 1 ELSE 0 END) as inTransit,
  SUM(p.packageDetails.declaredValue) as totalValue
FROM packages p
WHERE p.zoneId IN ('caba', 'ramos_mejia', 'benavidez')
  AND p.status.timestamp >= '2025-10-20T00:00:00Z'
GROUP BY p.zoneId
```

### Query 2: Performance de Repartidor
```sql
SELECT
  p.assignment.driverId,
  p.assignment.driverName,
  COUNT(1) as totalAssigned,
  SUM(CASE WHEN p.status.current = 'delivered' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN p.status.current = 'failed' THEN 1 ELSE 0 END) as failed,
  AVG(p.assignment.actualDeliveryTime - p.assignment.estimatedDeliveryTime) as avgDelayMinutes
FROM packages p
WHERE p.assignment.driverId = 'drv_12345'
  AND p.assignment.assignedAt >= '2025-10-01T00:00:00Z'
```

### Query 3: Liquidación Semanal - Paquetes Pendientes
```sql
SELECT
  p.packageId,
  p.trackingNumber,
  p.assignment.driverId,
  p.packageDetails.declaredValue,
  p.financials.driverCommission,
  p.status.timestamp as deliveredAt
FROM packages p
WHERE p.zoneId = 'caba'
  AND p.status.current = 'delivered'
  AND p.financials.settlementId = null
  AND p.status.timestamp >= '2025-10-14T00:00:00Z'
  AND p.status.timestamp < '2025-10-21T00:00:00Z'
ORDER BY p.assignment.driverId, p.status.timestamp
```

### Query 4: Alertas - Paquetes Atrasados
```sql
SELECT
  p.packageId,
  p.trackingNumber,
  p.destination.recipient.name,
  p.destination.address.street,
  p.assignment.driverName,
  p.assignment.estimatedDeliveryTime,
  DateTimeDiff('minute', p.assignment.estimatedDeliveryTime, GetCurrentDateTime()) as minutesLate
FROM packages p
WHERE p.zoneId IN ('caba', 'ramos_mejia')
  AND p.status.current = 'out_for_delivery'
  AND p.assignment.estimatedDeliveryTime < GetCurrentDateTime()
ORDER BY minutesLate DESC
```

### Query 5: Analytics - Scans con Baja Confianza
```sql
SELECT
  s.scanId,
  s.packageId,
  s.scanInfo.scannedBy,
  s.ocrData.confidence,
  s.qualityMetrics.imageQuality.overall,
  ARRAY_LENGTH(s.ocrData.validation.errors) as errorCount
FROM scans s
WHERE s.ocrData.confidence < 0.75
  OR s.qualityMetrics.ocrQuality.requiresManualReview = true
ORDER BY s.scanInfo.scanTimestamp DESC
```

---

## 🎯 MÉTRICAS DE ÉXITO Y KPIs

### KPIs Operacionales
- **Tasa de Entrega Exitosa**: > 95%
- **Entregas a Tiempo**: > 90%
- **Tiempo Promedio de Entrega**: < 4 horas
- **Calidad de OCR**: Confianza promedio > 90%
- **Disponibilidad del Sistema**: > 99.9%

### KPIs Financieros
- **Margen de Ganancia**: > 90%
- **Costo por Paquete**: < ARS 200
- **Liquidaciones a Tiempo**: 100%
- **Disputas Resueltas**: < 3 días promedio

### KPIs Técnicos
- **RU Utilization**: 60-80% promedio
- **Query Performance**: < 100ms P95
- **API Latency**: < 500ms P99
- **Mobile App Crash Rate**: < 1%

---

## 📞 SOPORTE Y DOCUMENTACIÓN

### Recursos Azure
- [Cosmos DB Documentation](https://learn.microsoft.com/azure/cosmos-db/)
- [Azure Functions Best Practices](https://learn.microsoft.com/azure/azure-functions/functions-best-practices)
- [Azure AI Vision](https://learn.microsoft.com/azure/ai-services/computer-vision/)

### Contactos Técnicos
- **Architect**: [email@empresa.com]
- **DevOps**: [devops@empresa.com]
- **Support**: [support@empresa.com]

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Pre-Implementación
- [ ] Aprobación de diseño de arquitectura
- [ ] Presupuesto aprobado (~USD 10K-15K/mes)
- [ ] Cuenta Azure configurada
- [ ] Equipo técnico asignado (2 Backend, 1 Mobile, 1 Frontend, 1 DevOps)
- [ ] Ambiente de desarrollo provisionado

### Implementación
- [ ] Cosmos DB database y contenedores creados
- [ ] Índices y partition keys configurados
- [ ] Scripts de migración de datos ejecutados
- [ ] APIs backend desplegadas
- [ ] Integración OCR/LLM funcionando
- [ ] App Android en testing
- [ ] Dashboard web desplegado
- [ ] Tests de carga completados

### Post-Implementación
- [ ] Monitoreo configurado (Azure Monitor, Application Insights)
- [ ] Alertas configuradas
- [ ] Runbooks de DR documentados
- [ ] Capacitación de usuarios completada
- [ ] Go-live exitoso
- [ ] Soporte 24/7 establecido

---

## 🏁 CONCLUSIÓN

Este modelo de datos para Azure Cosmos DB proporciona:

✅ **Escalabilidad horizontal** mediante particionamiento inteligente
✅ **Multi-tenancy** con aislamiento por organización
✅ **Performance óptimo** con índices compuestos y queries eficientes
✅ **Trazabilidad completa** con historial de estados y auditoría
✅ **Integración AI/ML** para OCR y extracción de datos
✅ **Analytics en tiempo real** mediante contenedor dedicado
✅ **Flexibilidad** para evolución futura del negocio
✅ **Seguridad y compliance** con RBAC y encriptación

**Próximos Pasos:**
1. Revisar y aprobar este diseño
2. Provisionar infraestructura Azure
3. Iniciar implementación por fases
4. Iterar basado en feedback de usuarios

---

## 📄 APÉNDICE A: EJEMPLO DE CARGA MASIVA

### Script de Migración desde Excel (Python)
```python
import pandas as pd
from azure.cosmos import CosmosClient
import uuid
from datetime import datetime

# Conexión a Cosmos DB
client = CosmosClient(url=COSMOS_URL, credential=COSMOS_KEY)
database = client.get_database_client("logistics_db")
packages_container = database.get_container_client("packages")

# Leer Excel
df = pd.read_excel("semana_20_25_octubre.xlsx")

# Procesar cada fila
for index, row in df.iterrows():
    package_id = f"pkg_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8]}"

    package_doc = {
        "id": package_id,
        "packageId": package_id,
        "trackingNumber": f"{row['clte'].upper()}-{datetime.now().strftime('%Y%m%d')}-{index:04d}",
        "zoneId": normalize_zone(row['zona']),
        "type": "package",
        "destination": {
            "address": {
                "street": row['dire'],
                "city": row['zona'].upper(),
                "zone": normalize_zone(row['zona'])
            }
        },
        "packageDetails": {
            "declaredValue": float(row['monto'].replace('$', '').replace(',', '')),
            "currency": "ARS"
        },
        "status": {
            "current": "delivered",
            "timestamp": f"{row['fecha']}T16:00:00Z",
            "history": [
                {
                    "status": "created",
                    "timestamp": f"{row['fecha']}T09:00:00Z"
                },
                {
                    "status": "delivered",
                    "timestamp": f"{row['fecha']}T16:00:00Z"
                }
            ]
        },
        "origin": {
            "organizationName": row['clte'].title()
        },
        "metadata": {
            "createdAt": datetime.now().isoformat(),
            "source": "excel_migration",
            "tags": ["migrated", "historical"]
        }
    }

    # Insertar en Cosmos DB
    packages_container.create_item(body=package_doc)
    print(f"✅ Paquete {package_id} migrado exitosamente")

def normalize_zone(zone_name):
    zone_mapping = {
        'caba': 'caba',
        'ramos mejia': 'ramos_mejia',
        'benavidez': 'benavidez',
        'zarate': 'zarate',
        'r calzada': 'r_calzada'
    }
    return zone_mapping.get(zone_name.lower(), 'other')
```

---

## 📄 APÉNDICE B: EJEMPLO DE API AZURE FUNCTION

### Function: Crear Paquete
```python
import azure.functions as func
from azure.cosmos import CosmosClient
import json
import uuid
from datetime import datetime

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()

        # Validar datos requeridos
        required_fields = ['destination', 'packageDetails', 'organizationId']
        if not all(field in req_body for field in required_fields):
            return func.HttpResponse(
                json.dumps({"error": "Missing required fields"}),
                status_code=400
            )

        # Conectar a Cosmos DB
        client = CosmosClient(url=os.environ['COSMOS_URL'],
                              credential=os.environ['COSMOS_KEY'])
        database = client.get_database_client("logistics_db")
        packages_container = database.get_container_client("packages")

        # Generar IDs
        package_id = f"pkg_{datetime.now().strftime('%Y%m%d')}_{str(uuid.uuid4())[:8]}"
        tracking_number = f"{req_body['organizationId'].upper()}-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"

        # Construir documento
        package_doc = {
            "id": package_id,
            "packageId": package_id,
            "trackingNumber": tracking_number,
            "zoneId": req_body['destination']['address']['zone'],
            "type": "package",
            "origin": {
                "organizationId": req_body['organizationId']
            },
            "destination": req_body['destination'],
            "packageDetails": req_body['packageDetails'],
            "status": {
                "current": "created",
                "timestamp": datetime.now().isoformat(),
                "history": [
                    {
                        "status": "created",
                        "timestamp": datetime.now().isoformat(),
                        "notes": "Paquete creado desde API"
                    }
                ]
            },
            "metadata": {
                "createdAt": datetime.now().isoformat(),
                "source": "api",
                "version": 1
            }
        }

        # Insertar en Cosmos DB
        created_item = packages_container.create_item(body=package_doc)

        return func.HttpResponse(
            json.dumps({
                "success": True,
                "packageId": package_id,
                "trackingNumber": tracking_number,
                "data": created_item
            }),
            status_code=201,
            mimetype="application/json"
        )

    except Exception as e:
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500
        )
```

---

**FIN DEL PROMPT - MODELO DE DATOS COSMOS DB PARA SISTEMA DE LOGÍSTICA**

**Versión**: 1.0
**Fecha**: Octubre 2025
**Autor**: AI Architect
**Confidencialidad**: Interno - No Distribuir

---
