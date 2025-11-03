# 🚀 Guía Rápida de Inicio - Cosmos DB con Azure AD

**Fecha:** 2 de Noviembre, 2025
**Autenticación:** Azure AD / Managed Identity (sin claves)

---

## 📋 Pre-requisitos

1. **Azure CLI instalado:** [Descargar Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
2. **Node.js 18+:** [Descargar Node.js](https://nodejs.org/)
3. **Cuenta Azure activa**
4. **Cosmos DB Account creada:** `sli-cosmosdb` en `rg-model-SLI`

---

## ✨ Ventajas de Azure AD Authentication

✅ **Sin claves:** No necesitas `COSMOS_KEY` en variables de entorno
✅ **Más seguro:** Las credenciales se manejan via Azure AD
✅ **Managed Identity:** Funciona automáticamente en Azure (VM, App Service, Functions)
✅ **Desarrollo local:** Usa `az login` para autenticación
✅ **No requiere `disableLocalAuth: false`:** Evita el bloqueador de configuración

---

## 🔐 Paso 1: Configurar Permisos RBAC en Cosmos DB

### Opción A: Usando Azure Portal (Recomendado)

1. **Azure Portal** → https://portal.azure.com
2. **Resource Groups** → **rg-model-SLI** → **sli-cosmosdb**
3. Menú lateral → **Access Control (IAM)**
4. Click **+ Add** → **Add role assignment**
5. En la pestaña **Role**:
   - Buscar: **Cosmos DB Built-in Data Contributor**
   - Seleccionar el rol
   - Click **Next**
6. En la pestaña **Members**:
   - **Assign access to:** User, group, or service principal
   - Click **+ Select members**
   - Buscar tu usuario de Azure (el que usas con `az login`)
   - Click **Select**
   - Click **Next**
7. En la pestaña **Review + assign**:
   - Click **Review + assign**

**Esperar 2-3 minutos** para que los permisos se propaguen.

### Opción B: Usando Azure CLI

```bash
# 1. Login a Azure CLI
az login

# 2. Obtener tu User Object ID
USER_OBJECT_ID=$(az ad signed-in-user show --query id -o tsv)

# 3. Obtener el resource ID de Cosmos DB
COSMOS_ID=$(az cosmosdb show \
  --name sli-cosmosdb \
  --resource-group rg-model-SLI \
  --query id -o tsv)

# 4. Asignar rol "Cosmos DB Built-in Data Contributor"
az cosmosdb sql role assignment create \
  --account-name sli-cosmosdb \
  --resource-group rg-model-SLI \
  --role-definition-name "Cosmos DB Built-in Data Contributor" \
  --principal-id $USER_OBJECT_ID \
  --scope $COSMOS_ID

# Output esperado:
# {
#   "id": "/subscriptions/.../roleAssignments/...",
#   "name": "...",
#   "principalId": "your-user-object-id",
#   "roleDefinitionId": ".../00000000-0000-0000-0000-000000000002",
#   "scope": "/subscriptions/.../providers/Microsoft.DocumentDB/databaseAccounts/sli-cosmosdb"
# }
```

### Verificar Rol Asignado

```bash
az cosmosdb sql role assignment list \
  --account-name sli-cosmosdb \
  --resource-group rg-model-SLI \
  --query "[].{Principal:principalId, Role:roleDefinitionId}" -o table
```

---

## 📦 Paso 2: Configurar Variables de Entorno

### 2.1. Crear archivo `.env` en la raíz del proyecto

```bash
# Ubicación CORRECTA
c:\workspaces\DPG\SLI\.env    ✅

# Ubicación INCORRECTA
c:\workspaces\DPG\SLI\Database\.env    ❌
```

### 2.2. Contenido del `.env`

```env
# ============================================
# COSMOS DB CONFIGURATION - AZURE AD AUTH
# ============================================

# Cosmos DB Endpoint
COSMOS_ENDPOINT=https://sli-cosmosdb.documents.azure.com:443/

# Database Name
COSMOS_DATABASE_ID=SLIDB
```

**⚠️ IMPORTANTE:**
- **NO necesitas** `COSMOS_KEY`
- La autenticación se hace via Azure AD
- Para desarrollo local: usa `az login`

---

## 🔑 Paso 3: Autenticación Local (Desarrollo)

### Opción 1: Azure CLI (Recomendado para desarrollo)

```bash
# Login a Azure CLI
az login

# Verificar sesión activa
az account show --query "{Subscription:name, User:user.name}" -o table

# Output esperado:
# Subscription                 User
# --------------------------  -------------------------------
# Your Subscription Name      youremail@domain.com
```

### Opción 2: Variables de Entorno (Service Principal)

Si prefieres usar un Service Principal (para CI/CD):

```bash
# Crear Service Principal
az ad sp create-for-rbac --name "sli-cosmos-sp" --role "Cosmos DB Built-in Data Contributor" --scopes /subscriptions/4c7ae2e2-8d3e-4712-9b7d-04ccbdcc7e70/resourceGroups/rg-model-SLI/providers/Microsoft.DocumentDB/databaseAccounts/sli-cosmosdb

# Output:
# {
#   "appId": "your-app-id",
#   "password": "your-password",
#   "tenant": "your-tenant-id"
# }
```

Agregar al `.env`:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-id
AZURE_CLIENT_SECRET=your-password
```

---

## 📥 Paso 4: Instalar Dependencias

```bash
cd Database
npm install
```

Esto instalará:
- `@azure/cosmos` - SDK de Cosmos DB
- `@azure/identity` - Azure AD authentication
- `dotenv` - Variables de entorno

---

## 🚀 Paso 5: Ejecutar Scripts

### Ejecutar Setup Completo (Recomendado)

```bash
npm run setup
```

Esto ejecuta:
1. `1-inicializacion-database.js` - Crea database y contenedores
2. `2-carga-informacion-aleatoria.js` - Carga datos de prueba

### O ejecutar scripts individuales

```bash
# Solo inicialización
npm run init

# Solo carga de datos
npm run seed
```

---

## ✅ Verificación de Éxito

### 1. Verificar Database creada

```bash
az cosmosdb sql database show \
  --account-name sli-cosmosdb \
  --resource-group rg-model-SLI \
  --name SLIDB

# Output esperado:
# {
#   "id": "/subscriptions/.../databases/SLIDB",
#   "name": "SLIDB",
#   "resource": {
#     "id": "SLIDB"
#   },
#   "type": "Microsoft.DocumentDB/databaseAccounts/sqlDatabases"
# }
```

### 2. Verificar Contenedores creados

```bash
az cosmosdb sql container list \
  --account-name sli-cosmosdb \
  --resource-group rg-model-SLI \
  --database-name SLIDB \
  --query "[].name" -o table

# Output esperado:
# Result
# ----------------------
# ORGANIZATIONS
# DRIVERS
# PACKAGES
# DRIVER_ACTIVITY
# GEOLOCATION
# SCANS
# POD
# BILLING
# INCIDENTS
# ANALYTICS
```

### 3. Verificar datos cargados

Usando Azure Portal:
1. **Azure Portal** → **sli-cosmosdb**
2. **Data Explorer** (menú lateral)
3. Expandir **SLIDB** → **ORGANIZATIONS**
4. Click **Items**
5. Deberías ver 3 organizaciones:
   - `org_root` - Logística Nacional S.A.
   - `org_jj` - JJ Logística
   - `org_jm` - JM Logística

---

## 🐛 Troubleshooting

### Error: "Authentication failed"

**Causa:** No has hecho `az login` o el token expiró.

**Solución:**
```bash
az login
az account show  # Verificar sesión activa
```

---

### Error: "Forbidden" (403)

**Causa:** Tu usuario no tiene permisos RBAC en Cosmos DB.

**Solución:**
1. Verificar que asignaste el rol "Cosmos DB Built-in Data Contributor"
2. Esperar 2-3 minutos para propagación
3. Verificar con:
```bash
az cosmosdb sql role assignment list \
  --account-name sli-cosmosdb \
  --resource-group rg-model-SLI
```

---

### Error: "DefaultAzureCredential failed"

**Causa:** No hay credenciales configuradas.

**Solución:**
DefaultAzureCredential intenta en este orden:
1. Variables de entorno (`AZURE_*`)
2. Managed Identity
3. Visual Studio Code
4. Azure CLI (`az login`) ← **Ejecuta esto**
5. Azure PowerShell

Ejecutar:
```bash
az login
```

---

### Error: "Cannot find module '@azure/identity'"

**Causa:** Dependencias no instaladas.

**Solución:**
```bash
cd Database
npm install
```

---

## 📊 Datos Creados

Después de ejecutar `npm run setup` exitosamente:

### Organizaciones (3)
- **org_root** - Logística Nacional S.A. (Empresa matriz)
- **org_jj** - JJ Logística (Sublogística 1)
- **org_jm** - JM Logística (Sublogística 2)

### Drivers (14 total)
- **JJ Logística:** 7 drivers
- **JM Logística:** 7 drivers

### Zonas

**JJ Logística (12 zonas):**
- Exclusivas: caba, palermo, recoleta, belgrano, caballito, versalles
- Compartidas: olivos, san_isidro, vicente_lopez, martinez, tigre, quilmes

**JM Logística (14 zonas):**
- Exclusivas: ramos_mejia, benavidez, gba_oeste, lomas_zamora, avellaneda, gba_sur, moron, ituzaingo
- Compartidas: olivos, san_isidro, vicente_lopez, martinez, tigre, quilmes

**Zonas compartidas entre JJ y JM:**
- olivos
- san_isidro
- vicente_lopez
- martinez
- tigre
- quilmes

---

## 🔄 Colaboración Cross-Sublogística

### Concepto

El sistema soporta **colaboración entre sublogísticas** mediante un modelo híbrido con permisos explícitos.

**Ejemplo:** Un driver de JJ Logística puede entregar paquetes de JM Logística en zonas compartidas.

### Drivers con Autorización Cross-Sublogística

De los 14 drivers creados, **3 tienen autorización para trabajar con ambas sublogísticas**:

**drv_007** (JJ Logística):
- Zonas: san_isidro, olivos, vicente_lopez
- Autorizado para: `["org_jj", "org_jm"]`

**drv_008** (JM Logística):
- Zonas: tigre, benavidez
- Autorizado para: `["org_jm", "org_jj"]`

**drv_014** (JM Logística):
- Zonas: benavidez, tigre
- Autorizado para: `["org_jm", "org_jj"]`

### Cómo Funciona

1. **Permisos en DRIVERS:**
   ```json
   {
     "driverId": "drv_007",
     "subLogisticsId": "org_jj",
     "employment": {
       "authorizedSubLogistics": ["org_jj", "org_jm"]
     }
   }
   ```

2. **Tracking en PACKAGES:**
   ```json
   {
     "packageId": "pkg_jm_001",
     "subLogisticsId": "org_jm",
     "assignedDriverId": "drv_007",
     "crossSubLogistics": {
       "enabled": true,
       "driverSubLogisticsId": "org_jj",
       "commissionPaidBy": "org_jm"
     }
   }
   ```

3. **Liquidaciones Consolidadas:**
   - JM paga la comisión por sus paquetes
   - JJ recibe el reembolso de JM
   - Todo queda auditado en settlements

### Ventajas

- ✅ Optimización de rutas en zonas compartidas
- ✅ Mejor utilización de recursos
- ✅ Trazabilidad completa de colaboraciones
- ✅ Liquidaciones claras entre sublogísticas

### Verificar Drivers Cross-Sublogística

```bash
# Consultar drivers con autorización múltiple en Azure Portal
# Data Explorer → DRIVERS → Query:

SELECT
  c.driverId,
  c.subLogisticsId,
  c.employment.authorizedSubLogistics
FROM c
WHERE ARRAY_LENGTH(c.employment.authorizedSubLogistics) > 1
```

**Resultado esperado:**
- drv_007: JJ → ["org_jj", "org_jm"]
- drv_008: JM → ["org_jm", "org_jj"]
- drv_014: JM → ["org_jm", "org_jj"]

---

## 🔗 Recursos Adicionales

- **Azure CLI Docs:** https://learn.microsoft.com/cli/azure/
- **Cosmos DB RBAC:** https://learn.microsoft.com/azure/cosmos-db/role-based-access-control
- **DefaultAzureCredential:** https://learn.microsoft.com/javascript/api/@azure/identity/defaultazurecredential
- **@azure/cosmos SDK:** https://learn.microsoft.com/javascript/api/@azure/cosmos

---

## 📝 Notas de Seguridad

✅ **Ventajas de Azure AD:**
- No hay claves en archivos `.env`
- Rotación automática de tokens
- Auditoría de acceso via Azure AD logs
- Funciona con Managed Identity en producción

⚠️ **Para Producción:**
- Usar Managed Identity (no `az login`)
- Implementar en Azure App Service / Functions / VM
- La Managed Identity se autentica automáticamente
- No se requiere código adicional

---

**Última actualización:** 2 de Noviembre, 2025
**Estado:** ✅ Usando Azure AD Authentication (sin claves)
