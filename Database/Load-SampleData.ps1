# ============================================
# 📦 Load Sample Data - PowerShell Script
# ============================================
#
# Este script carga datos de muestra en Cosmos DB:
# - 3 organizaciones (1 root + 2 sublogistics: JJ y JM)
# - 14 drivers (7 JJ + 7 JM)
# - Zonas compartidas: olivos, san_isidro, vicente_lopez, martinez, tigre, quilmes
#
# Pre-requisitos:
# 1. Azure CLI autenticado (az login)
# 2. Base de datos SLIDB creada
# 3. npm install ejecutado en /Database
#
# Uso:
#   .\Load-SampleData.ps1
#
# ============================================

param(
    [string]$DatabaseFolder = $PSScriptRoot
)

# ============================================
# CONFIGURACIÓN DE COLORES PARA OUTPUT
# ============================================

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n🔹 $Message" -ForegroundColor Magenta
}

# ============================================
# VERIFICAR PRE-REQUISITOS
# ============================================

Write-Step "Verificando pre-requisitos..."

# Verificar Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Success "Node.js instalado ($nodeVersion)"
    } else {
        throw "Node.js no encontrado"
    }
} catch {
    Write-Error "Node.js no está instalado. Descargarlo de: https://nodejs.org/"
    exit 1
}

# Verificar que existe package.json
if (-not (Test-Path "$DatabaseFolder\package.json")) {
    Write-Error "No se encuentra package.json en $DatabaseFolder"
    exit 1
}

# Verificar que existe el script de carga
if (-not (Test-Path "$DatabaseFolder\2-carga-informacion-aleatoria.js")) {
    Write-Error "No se encuentra el script 2-carga-informacion-aleatoria.js"
    exit 1
}

# Verificar que node_modules existe
if (-not (Test-Path "$DatabaseFolder\node_modules")) {
    Write-Warning "node_modules no existe. Instalando dependencias..."
    Push-Location $DatabaseFolder
    npm install
    Pop-Location

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error instalando dependencias npm"
        exit 1
    }
    Write-Success "Dependencias instaladas correctamente"
} else {
    Write-Success "Dependencias npm ya instaladas"
}

# Verificar archivo .env
$envPath = Join-Path (Split-Path $DatabaseFolder -Parent) ".env"
if (-not (Test-Path $envPath)) {
    Write-Error "No se encuentra el archivo .env en la raíz del proyecto: $envPath"
    Write-Info "Copiar .env.example a .env y configurar las credenciales"
    exit 1
}

# Verificar variables críticas en .env
$envContent = Get-Content $envPath -Raw
if ($envContent -notmatch "COSMOS_ENDPOINT=https://") {
    Write-Error "Variable COSMOS_ENDPOINT no está configurada correctamente en .env"
    exit 1
}

Write-Success "Archivo .env encontrado y configurado"

# Verificar Azure CLI autenticado
try {
    $account = az account show --query "{Subscription:name, User:user.name}" -o json | ConvertFrom-Json
    if ($account) {
        Write-Success "Autenticado en Azure CLI como: $($account.User)"
    } else {
        throw "No autenticado"
    }
} catch {
    Write-Error "No estás autenticado en Azure CLI. Ejecutar: az login"
    exit 1
}

# ============================================
# EJECUTAR CARGA DE DATOS
# ============================================

Write-Step "Ejecutando script de carga de datos..."
Write-Info "Este proceso puede tardar 1-2 minutos..."

Push-Location $DatabaseFolder

# Ejecutar el script de Node.js
node 2-carga-informacion-aleatoria.js

$exitCode = $LASTEXITCODE

Pop-Location

if ($exitCode -eq 0) {
    # ============================================
    # RESUMEN DE DATOS CARGADOS
    # ============================================

    Write-Host "`n" -NoNewline
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "║          ✅ DATOS CARGADOS EXITOSAMENTE                   ║" -ForegroundColor Cyan
    Write-Host "║                                                           ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    Write-Success "Datos de muestra creados correctamente"
    Write-Host ""

    Write-Host "📊 Resumen de datos cargados:" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  🏢 ORGANIZACIONES (3)" -ForegroundColor Cyan
    Write-Host "     ├─ org_root  - Logística Nacional S.A. (Matriz)" -ForegroundColor White
    Write-Host "     ├─ org_jj    - JJ Logística (12 zonas)" -ForegroundColor White
    Write-Host "     └─ org_jm    - JM Logística (14 zonas)" -ForegroundColor White
    Write-Host ""

    Write-Host "  👥 DRIVERS (14 total)" -ForegroundColor Cyan
    Write-Host "     ├─ JJ Logística: 7 drivers" -ForegroundColor White
    Write-Host "     └─ JM Logística: 7 drivers" -ForegroundColor White
    Write-Host ""

    Write-Host "  📍 ZONAS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "     JJ Logística (12 zonas):" -ForegroundColor Magenta
    Write-Host "       Exclusivas (6): caba, palermo, recoleta, belgrano," -ForegroundColor White
    Write-Host "                      caballito, versalles" -ForegroundColor White
    Write-Host "       Compartidas (6): olivos, san_isidro, vicente_lopez," -ForegroundColor Green
    Write-Host "                        martinez, tigre, quilmes" -ForegroundColor Green
    Write-Host ""
    Write-Host "     JM Logística (14 zonas):" -ForegroundColor Magenta
    Write-Host "       Exclusivas (8): ramos_mejia, benavidez, gba_oeste," -ForegroundColor White
    Write-Host "                      lomas_zamora, avellaneda, gba_sur," -ForegroundColor White
    Write-Host "                      moron, ituzaingo" -ForegroundColor White
    Write-Host "       Compartidas (6): olivos, san_isidro, vicente_lopez," -ForegroundColor Green
    Write-Host "                        martinez, tigre, quilmes" -ForegroundColor Green
    Write-Host ""

    Write-Host "  🔄 ZONAS COMPARTIDAS entre JJ y JM:" -ForegroundColor Yellow
    Write-Host "     - olivos" -ForegroundColor Green
    Write-Host "     - san_isidro" -ForegroundColor Green
    Write-Host "     - vicente_lopez" -ForegroundColor Green
    Write-Host "     - martinez" -ForegroundColor Green
    Write-Host "     - tigre" -ForegroundColor Green
    Write-Host "     - quilmes" -ForegroundColor Green
    Write-Host ""

    Write-Host "🎯 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "   1. Verificar datos en Azure Portal → Cosmos DB → Data Explorer" -ForegroundColor White
    Write-Host "   2. Explorar contenedor ORGANIZATIONS (3 items)" -ForegroundColor White
    Write-Host "   3. Explorar contenedor DRIVERS (14 items)" -ForegroundColor White
    Write-Host "   4. Revisar documentación: Database/README.md" -ForegroundColor White
    Write-Host ""

} else {
    Write-Host "`n" -NoNewline
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                                                           ║" -ForegroundColor Red
    Write-Host "║          ❌ ERROR EN CARGA DE DATOS                       ║" -ForegroundColor Red
    Write-Host "║                                                           ║" -ForegroundColor Red
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""

    Write-Error "El script de carga de datos falló (Exit Code: $exitCode)"
    Write-Host ""
    Write-Host "🔍 Pasos para troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Verificar que az login está activo" -ForegroundColor White
    Write-Host "   2. Verificar permisos RBAC (Cosmos DB Built-in Data Contributor)" -ForegroundColor White
    Write-Host "   3. Verificar variables en .env:" -ForegroundColor White
    Write-Host "      - COSMOS_ENDPOINT" -ForegroundColor Gray
    Write-Host "      - COSMOS_DATABASE_ID" -ForegroundColor Gray
    Write-Host "   4. Revisar logs del script Node.js arriba" -ForegroundColor White
    Write-Host "   5. Consultar: Database/QUICK_START.md" -ForegroundColor White
    Write-Host ""

    exit $exitCode
}
