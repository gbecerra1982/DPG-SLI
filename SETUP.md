# 🚀 Guía de Configuración - Sistema de Logística Integral

## 📋 Tabla de Contenidos
- [Pre-requisitos](#pre-requisitos)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Configuración de Azure Cosmos DB](#configuración-de-azure-cosmos-db)
- [Configuración de Azure Blob Storage](#configuración-de-azure-blob-storage)
- [Inicialización de Base de Datos](#inicialización-de-base-de-datos)
- [Verificación](#verificación)

---

## 🛠️ Pre-requisitos

### 1. Cuenta de Azure
- ✅ Cuenta de Azure activa
- ✅ Suscripción con créditos disponibles
- ✅ Permisos para crear recursos

### 2. Software Instalado
```bash
# Node.js (versión 18 o superior)
node --version  # Debe ser >= 18.0.0

# npm
npm --version

# Git
git --version
```

---

## ⚙️ Configuración de Variables de Entorno

### Paso 1: Copiar template
```bash
# En la raíz del proyecto
cp .env-template .env
```

### Paso 2: Editar .env
Abrir el archivo `.env` y completar las credenciales:

#### ⚠️ IMPORTANTE
- **NUNCA** commitear el archivo `.env` al repositorio
- El archivo `.env` ya está en `.gitignore`
- Usar diferentes credenciales para dev/staging/prod

---

## 📊 Configuración de Azure Cosmos DB

### Crear Cuenta de Cosmos DB

1. **Azure Portal** → "Create a resource"
2. Buscar **"Azure Cosmos DB"**
3. Clic en **"Create"**
4. **IMPORTANTE:** Seleccionar **"Azure Cosmos DB for NoSQL"** (NO seleccionar MongoDB, PostgreSQL, Cassandra, etc.)

### Configuración:

| Campo | Valor Recomendado |
|-------|-------------------|
| **Subscription** | Tu suscripción |
| **Resource Group** | `rg-logistics-dev` (o crear nuevo) |
| **Account Name** | `cosmos-logistics-dev` (único globalmente) |
| **API** | ⚠️ **Azure Cosmos DB for NoSQL** (también conocido como Core SQL API) |
| **Location** | `East US` o `Brazil South` (cercano) |
| **Capacity mode** | `Serverless` (para dev) o `Provisioned` (prod) |
| **Apply Free Tier Discount** | ✅ Sí (si disponible) |

> **⚠️ CRÍTICO:** Este proyecto utiliza **Azure Cosmos DB for NoSQL** (la API nativa de Cosmos DB con sintaxis SQL-like). NO utilizar Azure Cosmos DB for MongoDB, ya que son APIs completamente diferentes.

### Obtener Credenciales:

1. Ir a tu cuenta de Cosmos DB creada
2. Sidebar → **"Keys"**
3. Copiar valores:

```env
# En .env
COSMOS_ENDPOINT=https://TU_CUENTA.documents.azure.com:443/
COSMOS_KEY=TU_PRIMARY_KEY_AQUI
COSMOS_DATABASE_ID=SLIDB
```

**Screenshot de referencia:**
```
Azure Portal → Cosmos DB Account → Keys
┌─────────────────────────────────────┐
│ URI:         [Copiar]               │
│ PRIMARY KEY: [Copiar]               │
└─────────────────────────────────────┘
```

---

## 🗄️ Configuración de Azure Blob Storage

### Crear Storage Account

1. **Azure Portal** → "Create a resource"
2. Buscar **"Storage account"**
3. Clic en **"Create"**

### Configuración:

| Campo | Valor Recomendado |
|-------|-------------------|
| **Subscription** | Tu suscripción |
| **Resource Group** | `rg-logistics-dev` (mismo que Cosmos) |
| **Storage account name** | `stlogisticsdev` (único, solo minúsculas) |
| **Location** | Mismo que Cosmos DB |
| **Performance** | Standard |
| **Redundancy** | LRS (dev) / GRS (prod) |

### Obtener Credenciales:

1. Ir a tu Storage Account
2. Sidebar → **"Access keys"**
3. Copiar valores:

```env
# En .env
AZURE_STORAGE_ACCOUNT_NAME=stlogisticsdev
AZURE_STORAGE_ACCOUNT_KEY=TU_STORAGE_KEY

# O usar connection string completo
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

### Crear Containers (opcional - los scripts los crean automáticamente):

1. Sidebar → **"Containers"**
2. **"+ Container"**
3. Crear los siguientes:
   - `scans` - Para fotos de escaneos
   - `pod` - Para pruebas de entrega
   - `incidents` - Para fotos de incidencias
   - `drivers` - Para fotos de perfil

---

## 🎯 Inicialización de Base de Datos

Una vez configuradas las credenciales en `.env`:

### Paso 1: Instalar dependencias
```bash
cd Database
npm install
```

### Paso 2: Ejecutar scripts de inicialización
```bash
# Opción A: Todo automático
npm run setup

# O paso a paso:
npm run init  # Crear DB y contenedores
npm run seed  # Cargar datos de ejemplo
```

### Durante la ejecución:
```
Ingrese el nombre de la base de datos (presione Enter para usar "SLIDB"):
# Presionar Enter para usar default
```

### Resultado esperado:
```
✅ Base de datos "SLIDB" creada/verificada
✅ Contenedores procesados: 10
✅ Organizaciones creadas: 4
✅ Drivers creados: 15
🎉 Proceso completado exitosamente
```

---

## ✅ Verificación

### 1. Verificar Cosmos DB en Azure Portal

1. Ir a tu Cosmos DB Account
2. **Data Explorer** (sidebar)
3. Deberías ver:
   - Database: `SLIDB`
   - Containers: 10 contenedores
   - Items: Datos en ORGANIZATIONS y DRIVERS

### 2. Probar query de ejemplo

En Data Explorer:
```sql
SELECT c.name, c.organizationType, c.stats.totalDrivers
FROM c
WHERE c.type = 'organization'
ORDER BY c.name
```

Deberías ver 4 organizaciones:
- Logística Nacional S.A. (matriz)
- Logística Cangallo
- Logística Defilippi
- Logística Rápida Sur

### 3. Verificar Blob Storage

1. Ir a Storage Account
2. **Containers** (sidebar)
3. Verificar que existen los containers (pueden estar vacíos al inicio)

---

## 🔐 Seguridad

### Variables de Entorno Sensibles

⚠️ **NUNCA compartir públicamente:**
- `COSMOS_KEY`
- `AZURE_STORAGE_ACCOUNT_KEY`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- Cualquier API key o token

### Buenas Prácticas:

1. ✅ Usar Azure Key Vault en producción
2. ✅ Rotar credenciales cada 90 días
3. ✅ Diferentes credenciales para cada ambiente
4. ✅ Habilitar Managed Identity cuando sea posible
5. ✅ Revisar access logs regularmente

### Configuración de Azure Key Vault (Opcional - Producción):

```bash
# Crear Key Vault
az keyvault create \
  --name kv-logistics-prod \
  --resource-group rg-logistics-prod \
  --location eastus

# Almacenar secretos
az keyvault secret set \
  --vault-name kv-logistics-prod \
  --name CosmosKey \
  --value "TU_PRIMARY_KEY"
```

---

## 🌍 Configuración Multi-Ambiente

### Desarrollo
```env
# .env.development
COSMOS_DATABASE_ID=SLIDB_DEV
NODE_ENV=development
```

### Staging
```env
# .env.staging
COSMOS_DATABASE_ID=SLIDB_STAGING
NODE_ENV=staging
```

### Producción
```env
# .env.production
COSMOS_DATABASE_ID=SLIDB_PROD
NODE_ENV=production
COSMOS_CONSISTENCY_LEVEL=Strong
```

### Uso:
```bash
# Cargar ambiente específico
NODE_ENV=development npm run setup
NODE_ENV=staging npm run setup
NODE_ENV=production npm run setup
```

---

## 💰 Estimación de Costos

### Desarrollo (con Free Tier):
- **Cosmos DB Serverless:** $0 - $10/mes
- **Blob Storage (100GB):** ~$2/mes
- **Total:** ~$2-12/mes

### Producción (sin Free Tier):
- **Cosmos DB (4,400 RU/s):** ~$280/mes
- **Blob Storage (500GB):** ~$10/mes
- **Azure Functions (Consumption):** ~$20/mes
- **Total:** ~$310/mes

### Reducir Costos:

1. Usar **Serverless** en desarrollo
2. Configurar **Autoscaling** en producción
3. Habilitar **TTL** para datos antiguos
4. Usar **Reserved Capacity** para descuentos

---

## 🐛 Troubleshooting

### Error: "Unauthorized" al ejecutar scripts

**Causa:** Credenciales incorrectas en `.env`

**Solución:**
1. Verificar `COSMOS_ENDPOINT` termina en `/`
2. Verificar `COSMOS_KEY` sin espacios
3. Re-generar keys en Azure Portal si es necesario

### Error: "Database already exists"

**Causa:** Normal - el script usa `createIfNotExists`

**Solución:** No es un error, el script continúa normalmente

### Error: "Request rate too large (429)"

**Causa:** RU/s insuficientes

**Solución:**
1. En Azure Portal → Cosmos DB → Scale & Settings
2. Aumentar throughput temporalmente
3. O esperar y el script reintentará automáticamente

### Error: Scripts no preguntan nombre de DB

**Causa:** Variable `COSMOS_DATABASE_ID` ya está en `.env`

**Solución:**
- El script usa el valor de `.env` si existe
- Para que pregunte, comentar la línea en `.env`:
  ```env
  # COSMOS_DATABASE_ID=SLIDB
  ```

---

## 📚 Recursos Adicionales

### Documentación del Proyecto:
- [Database Scripts README](./Database/README.md)
- [Quick Start Guide](./Database/QUICK_START.md)
- [Changelog](./Database/CHANGELOG.md)
- [Modelo de Datos Cosmos DB](./docs/COSMOS_DB_LOGISTICS_MODEL_PROMPT.md)

### Documentación de Azure:
- [Cosmos DB Docs](https://docs.microsoft.com/azure/cosmos-db/)
- [Blob Storage Docs](https://docs.microsoft.com/azure/storage/blobs/)
- [Azure Functions Docs](https://docs.microsoft.com/azure/azure-functions/)

### Herramientas Útiles:
- [Azure Portal](https://portal.azure.com)
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
- [Azure Storage Explorer](https://azure.microsoft.com/features/storage-explorer/)
- [Cosmos DB Emulator](https://docs.microsoft.com/azure/cosmos-db/local-emulator)

---

## 🎯 Próximos Pasos

Después de completar esta configuración:

1. ✅ Configurar Azure Functions (backend APIs)
2. ✅ Configurar Next.js (frontend web)
3. ✅ Configurar Android app
4. ✅ Integrar autenticación
5. ✅ Configurar CI/CD
6. ✅ Deploy a staging/producción

---

## 🤝 Soporte

**¿Problemas durante la configuración?**

1. Revisar esta guía completa
2. Consultar [Troubleshooting](#troubleshooting)
3. Verificar logs de consola
4. Contactar al equipo de desarrollo

---

**Última actualización:** Noviembre 2025
**Versión:** 1.1.0
