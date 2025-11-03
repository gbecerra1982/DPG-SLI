# 📁 Database Scripts - Cosmos DB Logistics System

## 📋 Descripción

Esta carpeta contiene los scripts de inicialización y carga de datos para el sistema de logística multi-nivel basado en Azure Cosmos DB.

## 🗂️ Archivos

### 1. `Initialize-CosmosDB.ps1` (PowerShell)
**Propósito:** Crear la base de datos y todos los contenedores con sus configuraciones usando Azure CLI.

**Características:**
- ✅ Verificación de pre-requisitos (Azure CLI, autenticación)
- ✅ Asignación automática de permisos RBAC
- ✅ Creación de database `SLIDB`
- ✅ Creación de 10 contenedores con partition keys e índices
- ✅ Idempotente (puede ejecutarse múltiples veces)
- ✅ Manejo de errores y validaciones

**Contenedores creados:**
- `ORGANIZATIONS` - Empresa matriz y sublogísticas (400 RU/s)
- `DRIVERS` - Repartidores (400 RU/s)
- `PACKAGES` - Paquetes (600 RU/s - mayor throughput)
- `ROUTES` - Rutas asignadas (400 RU/s)
- `SCANS` - Escaneos de etiquetas con OCR (400 RU/s)
- `SETTLEMENTS` - Liquidaciones (400 RU/s)
- `INCIDENTS` - Incidencias (400 RU/s)
- `ANALYTICS` - Datos agregados (400 RU/s)
- `FRAUD_ATTEMPTS` - Log de intentos de fraude (400 RU/s)
- `QUALITY_ANALYTICS` - Análisis de calidad de fotos (400 RU/s)

**Total RU/s:** 4,400

### 2. `Load-SampleData.ps1` (PowerShell)
**Propósito:** Cargar datos iniciales de organizaciones y repartidores.

**Características:**
- ✅ Verificación de pre-requisitos (Node.js, npm, .env)
- ✅ Instalación automática de dependencias npm
- ✅ Ejecución del script Node.js `2-carga-informacion-aleatoria.js`
- ✅ Reporte detallado de datos cargados

**Datos creados:**
- 1 empresa matriz: **Logística Nacional S.A.**
- 2 sublogísticas:
  - **JJ Logística**: 7 drivers - 12 zonas (6 exclusivas + 6 compartidas)
    - Exclusivas: caba, palermo, recoleta, belgrano, caballito, versalles
    - Compartidas: olivos, san_isidro, vicente_lopez, martinez, tigre, quilmes
  - **JM Logística**: 7 drivers - 14 zonas (8 exclusivas + 6 compartidas)
    - Exclusivas: ramos_mejia, benavidez, gba_oeste, lomas_zamora, avellaneda, gba_sur, moron, ituzaingo
    - Compartidas: olivos, san_isidro, vicente_lopez, martinez, tigre, quilmes
- 14 repartidores totales
- **Zonas compartidas:** Olivos, San Isidro, Vicente López, Martínez, Tigre, Quilmes (ambas sublogísticas pueden operar en estas zonas)

### 3. `2-carga-informacion-aleatoria.js` (Node.js - Internal)
**Propósito:** Script interno usado por `Load-SampleData.ps1` para cargar datos.
**Nota:** No ejecutar directamente - usar `Load-SampleData.ps1`

### Archivos de Configuración

- `.env.example` - Template de variables de entorno
- `package.json` - Dependencias Node.js para scripts de carga
- `package-lock.json` - Lock file de dependencias
- `QUICK_START.md` - Guía rápida de inicio paso a paso
- `README.md` - Este archivo (documentación principal)

## 🚀 Requisitos Previos

### 1. Azure CLI y Autenticación
```bash
# Instalar Azure CLI
# Windows: https://learn.microsoft.com/cli/azure/install-azure-cli-windows
# macOS: brew install azure-cli
# Linux: https://learn.microsoft.com/cli/azure/install-azure-cli-linux

# Autenticarse con Azure
az login

# Verificar sesión activa
az account show
```

### 2. Configurar Permisos RBAC

**⚠️ IMPORTANTE:** Este proyecto usa **Azure AD Authentication** (sin claves).

Debes asignar el rol **"Cosmos DB Built-in Data Contributor"** a tu usuario:

```bash
# Obtener tu User Object ID
USER_OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)

# Asignar rol en Cosmos DB
az cosmosdb sql role assignment create \
  --account-name sli-cosmosdb \
  --resource-group rg-model-SLI \
  --role-definition-name "Cosmos DB Built-in Data Contributor" \
  --principal-id $USER_OBJECT_ID \
  --scope /subscriptions/4c7ae2e2-8d3e-4712-9b7d-04ccbdcc7e70/resourceGroups/rg-model-SLI/providers/Microsoft.DocumentDB/databaseAccounts/sli-cosmosdb
```

**Esperar 2-3 minutos** para que los permisos se propaguen.

### 3. Instalar dependencias
```bash
# Desde la carpeta Database
cd Database
npm install
```

Esto instalará:
- `@azure/cosmos` - SDK de Cosmos DB
- `@azure/identity` - Azure AD authentication
- `dotenv` - Variables de entorno

### 4. Configurar variables de entorno

Crear archivo `.env` en **la raíz del proyecto** (NO dentro de la carpeta Database):

```bash
# Ubicación del archivo .env
c:\workspaces\DPG\SLI\.env    ✅ CORRECTO (raíz del proyecto)
c:\workspaces\DPG\SLI\Database\.env    ❌ INCORRECTO
```

```env
# Contenido del archivo .env
# ⚠️ NO se requiere COSMOS_KEY - Autenticación via Azure AD

COSMOS_ENDPOINT=https://sli-cosmosdb.documents.azure.com:443/
COSMOS_DATABASE_ID=SLIDB
```

**Nota:**
- Los scripts usan `DefaultAzureCredential` de `@azure/identity`
- La autenticación se hace via `az login` (desarrollo) o Managed Identity (producción)
- **NO necesitas** `COSMOS_KEY` en el archivo `.env`

## 📦 Ejecución de Scripts

### Orden recomendado (PowerShell):

```powershell
# Navegar a la carpeta Database
cd Database

# 1. Inicializar base de datos y contenedores
.\Initialize-CosmosDB.ps1

# El script automáticamente:
# - Verifica Azure CLI autenticado
# - Asigna permisos RBAC
# - Crea database SLIDB
# - Crea 10 contenedores con índices

# 2. Cargar organizaciones y drivers
.\Load-SampleData.ps1

# El script automáticamente:
# - Verifica Node.js y dependencias npm
# - Ejecuta el script de carga de datos
# - Muestra resumen detallado de datos creados
```

### Parámetros Opcionales

**Initialize-CosmosDB.ps1:**
```powershell
# Cambiar Resource Group
.\Initialize-CosmosDB.ps1 -ResourceGroup "mi-rg"

# Cambiar Cosmos DB Account
.\Initialize-CosmosDB.ps1 -AccountName "mi-cosmosdb"

# Cambiar Database Name
.\Initialize-CosmosDB.ps1 -DatabaseName "MiDB"

# Todas las opciones
.\Initialize-CosmosDB.ps1 `
  -ResourceGroup "mi-rg" `
  -AccountName "mi-cosmosdb" `
  -DatabaseName "MiDB" `
  -SubscriptionId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Verificación en Azure Portal

1. Ir a Azure Portal → Cosmos DB Account
2. Seleccionar "Data Explorer"
3. Verificar database "SLIDB" (o el nombre que hayas elegido)
4. Explorar contenedores y datos

## 🗺️ Modelo de Datos

### Partition Keys por Contenedor

| Contenedor | Partition Key | Motivo |
|-----------|--------------|--------|
| ORGANIZATIONS | `/organizationId` | Aislamiento por organización |
| DRIVERS | `/subLogisticsId` | Consultas por sublogística |
| PACKAGES | `/zoneId` | Distribución geográfica |
| ROUTES | `/driverId` | Consultas por repartidor |
| SCANS | `/scanId` | Distribución uniforme |
| SETTLEMENTS | `/organizationId` | Liquidaciones por org |
| INCIDENTS | `/packageId` | Relación con paquetes |
| ANALYTICS | `/aggregationType` | Tipo de agregación |
| FRAUD_ATTEMPTS | `/driverId` | Análisis por driver |
| QUALITY_ANALYTICS | `/date` | Análisis por fecha |

### Relaciones Clave

```
ORGANIZATIONS (root)
  └── ORGANIZATIONS (sublogistics)
       └── DRIVERS
            └── ROUTES
                 └── PACKAGES
                      ├── SCANS (antiFraud)
                      ├── INCIDENTS
                      └── SETTLEMENTS
```

## 📊 Estimación de Costos

### Request Units (RU/s)

| Contenedor | RU/s | Motivo |
|-----------|------|--------|
| PACKAGES | 600 | Alto tráfico (núcleo) |
| Otros (9) | 400 c/u | Tráfico moderado |
| **TOTAL** | **4,400 RU/s** | |

**Costo estimado (región East US):**
- 4,400 RU/s × $0.00008/hora × 730 horas/mes = ~$257/mes
- Con autoscaling: variable según carga

### Storage

- 100 GB almacenamiento: ~$25/mes
- Backup automático: incluido

**Total estimado:** ~$280-350/mes

---

## 🔄 Colaboración Cross-Sublogística

### Modelo Híbrido con Permisos

El sistema soporta **colaboración entre sublogísticas** en zonas compartidas mediante permisos explícitos.

#### Concepto

Un driver que pertenece a una sublogística (ej: JJ Logística) puede entregar paquetes de otra sublogística (ej: JM Logística) si:
1. Tiene permisos explícitos en `authorizedSubLogistics`
2. Opera en una **zona compartida**
3. El paquete tiene tracking cross-sublogística habilitado

#### Zonas Compartidas

- olivos
- san_isidro
- vicente_lopez
- martinez
- tigre
- quilmes

#### Ejemplo de Driver Cross-Sublogística

```json
{
  "driverId": "drv_007",
  "subLogisticsId": "org_jj",
  "employment": {
    "assignedZones": ["san_isidro", "olivos", "vicente_lopez"],
    "authorizedSubLogistics": ["org_jj", "org_jm"]  // ← Puede trabajar para ambas
  }
}
```

Este driver puede entregar:
- ✅ Paquetes de JJ (su sublogística principal)
- ✅ Paquetes de JM en zonas compartidas (olivos, san_isidro, vicente_lopez)

#### Tracking de Paquetes Cross-Sublogística

Cuando un paquete de JM es entregado por un driver de JJ:

```json
{
  "packageId": "pkg_jm_001",
  "subLogisticsId": "org_jm",
  "assignedDriverId": "drv_007",  // ← Driver de JJ
  "zoneId": "olivos",  // ← Zona compartida
  "crossSubLogistics": {
    "enabled": true,
    "driverSubLogisticsId": "org_jj",
    "commissionPaidBy": "org_jm",  // ← JM paga la comisión
    "commissionRuleSource": "org_jm"  // ← Se usan tarifas de JM
  }
}
```

#### Liquidaciones (Settlements)

Las liquidaciones consolidan pagos de múltiples sublogísticas:

**Settlement de JJ (sublogística del driver):**
```json
{
  "subLogisticsId": "org_jj",
  "driverPayments": [{
    "driverId": "drv_007",
    "packagesBreakdown": {
      "ownSubLogistics": 50,  // Paquetes de JJ
      "crossSubLogistics": 10  // Paquetes de JM
    },
    "paymentBreakdown": {
      "fromOwnSubLogistics": 10000,
      "fromOtherSubLogistics": { "org_jm": 2000 }
    },
    "totalPayment": 12000
  }],
  "crossSubLogisticsDebts": [{
    "fromSubLogisticsId": "org_jm",
    "amount": 2000,
    "status": "pending"
  }]
}
```

**Ventajas:**
- ✅ Optimización de rutas en zonas compartidas
- ✅ Mejor utilización de recursos
- ✅ Trazabilidad completa
- ✅ Liquidaciones claras y auditables

---

## 🔍 Queries de Ejemplo

### Listar todas las organizaciones activas
```sql
SELECT *
FROM c
WHERE c.status = 'active'
  AND c.type = 'organization'
ORDER BY c.name
```

### Drivers por sublogística
```sql
SELECT
  c.driverId,
  c.personalInfo.firstName,
  c.personalInfo.lastName,
  c.performance.successRate,
  c.employment.status
FROM c
WHERE c.subLogisticsId = 'org_jj'
  AND c.employment.status = 'active'
ORDER BY c.performance.successRate DESC
```

### Paquetes por zona
```sql
SELECT
  COUNT(1) as total,
  c.zoneId,
  c.origin.organizationName
FROM c
WHERE c.type = 'package'
GROUP BY c.zoneId, c.origin.organizationName
```

### Drivers autorizados para cross-sublogística
```sql
SELECT
  c.driverId,
  c.subLogisticsId,
  c.personalInfo.firstName,
  c.personalInfo.lastName,
  c.employment.assignedZones,
  c.employment.authorizedSubLogistics
FROM c
WHERE c.type = 'driver'
  AND ARRAY_LENGTH(c.employment.authorizedSubLogistics) > 1
```

### Paquetes entregados en colaboración cross-sublogística
```sql
SELECT
  c.packageId,
  c.subLogisticsId,
  c.assignedDriverId,
  c.zoneId,
  c.crossSubLogistics.driverSubLogisticsId,
  c.crossSubLogistics.commissionPaidBy
FROM c
WHERE c.type = 'package'
  AND c.crossSubLogistics.enabled = true
```

### Deudas pendientes entre sublogísticas
```sql
SELECT
  c.settlementId,
  c.subLogisticsId,
  c.crossSubLogisticsDebts
FROM c
WHERE c.type = 'settlement'
  AND ARRAY_LENGTH(c.crossSubLogisticsDebts) > 0
  AND c.crossSubLogisticsDebts[0].status = 'pending'
```

## 🔧 Troubleshooting

### Error: "Unauthorized"
- Verificar COSMOS_KEY en .env
- Verificar permisos de la cuenta

### Error: "Database already exists"
- Normal si ejecutas el script varias veces
- El script usa `createIfNotExists`

### Error: "Request rate too large (429)"
- Aumentar RU/s del contenedor afectado
- Agregar retry logic con backoff

### Performance lento
- Verificar índices configurados correctamente
- Considerar aumentar RU/s
- Revisar partition key strategy

## 📚 Documentación Relacionada

- [Cosmos DB Best Practices](../../docs/COSMOS_DB_LOGISTICS_MODEL_PROMPT.md)
- [Android Sync Architecture](../../docs/ANDROID_SYNC_ARCHITECTURE.md)
- [Zone Routing Logic](../../docs/ZONE_ROUTING_LOGIC.md)
- [Anti-Fraud System](../../docs/SISTEMA_ANTI_FRAUDE.md)
- [Photo Quality Validation](../../docs/VALIDACION_CALIDAD_FOTO.md)

## 🛠️ Scripts de Utilidad

### Eliminar todos los datos (⚠️ CUIDADO)
```javascript
// delete-all-data.js
const { CosmosClient } = require('@azure/cosmos');

async function deleteAllData() {
  // Código para eliminar todos los items
  // USAR SOLO EN DESARROLLO
}
```

### Exportar datos a JSON
```javascript
// export-data.js
const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

async function exportData() {
  // Código para exportar a JSON
}
```

## 🎯 Próximos Pasos

1. ✅ Ejecutar scripts 1 y 2
2. ⏳ Desarrollar backend APIs (Azure Functions)
3. ⏳ Integrar con app Android
4. ⏳ Crear dashboard web (Next.js)
5. ⏳ Configurar CI/CD
6. ⏳ Testing end-to-end

## 📝 Notas

- **Importante:** Nunca commitear `.env` con credenciales reales
- Los scripts son idempotentes (pueden ejecutarse múltiples veces)
- Usar `upsert` en lugar de `create` para evitar duplicados
- Monitorear costos en Azure Portal regularmente

## 🤝 Contribución

Para modificar los scripts:
1. Hacer cambios en archivos .js
2. Probar en entorno de desarrollo
3. Documentar cambios en este README
4. Actualizar version en package.json

---

**Versión:** 1.0
**Última actualización:** Noviembre 2025
**Autor:** Sistema de Logística Multi-Nivel
