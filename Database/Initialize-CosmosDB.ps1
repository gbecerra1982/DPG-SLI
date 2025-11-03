# ============================================
# 🚀 Initialize Cosmos DB - PowerShell Script
# ============================================
#
# Este script crea la base de datos SLIDB y todos los contenedores
# necesarios para el sistema de logística usando Azure AD Authentication
#
# Pre-requisitos:
# 1. Azure CLI instalado y autenticado (az login)
# 2. Permisos de Contributor en el Resource Group o Subscription
#
# Uso:
#   .\Initialize-CosmosDB.ps1
#
# ============================================

param(
    [string]$ResourceGroup = "rg-model-SLI",
    [string]$AccountName = "sli-cosmosdb",
    [string]$DatabaseName = "SLIDB",
    [string]$SubscriptionId = "4c7ae2e2-8d3e-4712-9b7d-04ccbdcc7e70"
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

# Verificar Azure CLI
try {
    $azVersion = az version --query '\"azure-cli\"' -o tsv 2>$null
    if ($azVersion) {
        Write-Success "Azure CLI instalado (versión $azVersion)"
    } else {
        throw "Azure CLI no encontrado"
    }
} catch {
    Write-Error "Azure CLI no está instalado. Descargarlo de: https://learn.microsoft.com/cli/azure/install-azure-cli"
    exit 1
}

# Verificar autenticación
try {
    $account = az account show --query "{Subscription:name, User:user.name}" -o json | ConvertFrom-Json
    if ($account) {
        Write-Success "Autenticado como: $($account.User)"
        Write-Info "Subscription: $($account.Subscription)"
    } else {
        throw "No autenticado"
    }
} catch {
    Write-Error "No estás autenticado en Azure CLI. Ejecutar: az login"
    exit 1
}

# Establecer subscription
Write-Info "Estableciendo subscription: $SubscriptionId"
az account set --subscription $SubscriptionId

# Verificar que existe el Cosmos DB account
Write-Step "Verificando Cosmos DB account..."
$cosmosExists = az cosmosdb show --name $AccountName --resource-group $ResourceGroup 2>$null
if (-not $cosmosExists) {
    Write-Error "Cosmos DB account '$AccountName' no existe en el Resource Group '$ResourceGroup'"
    exit 1
}
Write-Success "Cosmos DB account encontrado: $AccountName"

# ============================================
# ASIGNAR PERMISOS RBAC
# ============================================

Write-Step "Configurando permisos RBAC..."

# Obtener User Object ID
$userObjectId = az ad signed-in-user show --query id -o tsv

if (-not $userObjectId) {
    Write-Error "No se pudo obtener el User Object ID"
    exit 1
}

Write-Info "User Object ID: $userObjectId"

# Obtener Cosmos DB resource ID
$cosmosId = az cosmosdb show --name $AccountName --resource-group $ResourceGroup --query id -o tsv

# Verificar si ya tiene el rol asignado
$existingAssignment = az cosmosdb sql role assignment list `
    --account-name $AccountName `
    --resource-group $ResourceGroup `
    --query "[?principalId=='$userObjectId']" -o json | ConvertFrom-Json

if ($existingAssignment.Count -eq 0) {
    Write-Info "Asignando rol 'Cosmos DB Built-in Data Contributor'..."
    az cosmosdb sql role assignment create `
        --account-name $AccountName `
        --resource-group $ResourceGroup `
        --role-definition-name "Cosmos DB Built-in Data Contributor" `
        --principal-id $userObjectId `
        --scope $cosmosId

    Write-Success "Rol asignado correctamente"
    Write-Warning "Esperando 30 segundos para propagación de permisos..."
    Start-Sleep -Seconds 30
} else {
    Write-Success "Usuario ya tiene permisos RBAC asignados"
}

# ============================================
# CREAR DATABASE
# ============================================

Write-Step "Creando database '$DatabaseName'..."

# Verificar si ya existe
$dbExists = az cosmosdb sql database show `
    --account-name $AccountName `
    --resource-group $ResourceGroup `
    --name $DatabaseName 2>$null

if ($dbExists) {
    Write-Warning "Database '$DatabaseName' ya existe, saltando creación"
} else {
    az cosmosdb sql database create `
        --account-name $AccountName `
        --resource-group $ResourceGroup `
        --name $DatabaseName

    Write-Success "Database '$DatabaseName' creada exitosamente"
}

# ============================================
# DEFINICIÓN DE CONTENEDORES
# ============================================

$containers = @(
    @{
        Name = "ORGANIZATIONS"
        PartitionKey = "/organizationId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/type"; order = "ascending" },
                    @{ path = "/createdAt"; order = "descending" }
                )
            )
        }
    },
    @{
        Name = "DRIVERS"
        PartitionKey = "/subLogisticsId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/currentStatus/status"; order = "ascending" },
                    @{ path = "/performance/averageRating"; order = "descending" }
                ),
                @(
                    @{ path = "/zones/*"; order = "ascending" },
                    @{ path = "/currentStatus/status"; order = "ascending" }
                )
            )
        }
    },
    @{
        Name = "PACKAGES"
        PartitionKey = "/zoneId"
        Throughput = 600
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/status"; order = "ascending" },
                    @{ path = "/priority"; order = "descending" },
                    @{ path = "/estimatedDeliveryDate"; order = "ascending" }
                ),
                @(
                    @{ path = "/assignedDriverId"; order = "ascending" },
                    @{ path = "/status"; order = "ascending" }
                ),
                @(
                    @{ path = "/subLogisticsId"; order = "ascending" },
                    @{ path = "/zoneId"; order = "ascending" },
                    @{ path = "/status"; order = "ascending" }
                )
            )
        }
    },
    @{
        Name = "ROUTES"
        PartitionKey = "/driverId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/status"; order = "ascending" },
                    @{ path = "/scheduledDate"; order = "descending" }
                ),
                @(
                    @{ path = "/driverId"; order = "ascending" },
                    @{ path = "/scheduledDate"; order = "descending" }
                )
            )
        }
    },
    @{
        Name = "SCANS"
        PartitionKey = "/scanId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" },
                @{ path = "/rawImageUrl/?" },
                @{ path = "/processedImageUrl/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/packageId"; order = "ascending" },
                    @{ path = "/scanType"; order = "ascending" },
                    @{ path = "/scannedAt"; order = "descending" }
                ),
                @(
                    @{ path = "/driverId"; order = "ascending" },
                    @{ path = "/scannedAt"; order = "descending" }
                ),
                @(
                    @{ path = "/fraudDetection/isFraudulent"; order = "ascending" },
                    @{ path = "/fraudDetection/confidenceScore"; order = "descending" }
                )
            )
            spatialIndexes = @(
                @{ path = "/location/*"; types = @("Point") }
            )
        }
    },
    @{
        Name = "SETTLEMENTS"
        PartitionKey = "/subLogisticsId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/status"; order = "ascending" },
                    @{ path = "/periodEnd"; order = "descending" }
                ),
                @(
                    @{ path = "/subLogisticsId"; order = "ascending" },
                    @{ path = "/periodEnd"; order = "descending" }
                )
            )
        }
    },
    @{
        Name = "INCIDENTS"
        PartitionKey = "/packageId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/severity"; order = "descending" },
                    @{ path = "/reportedAt"; order = "descending" }
                ),
                @(
                    @{ path = "/status"; order = "ascending" },
                    @{ path = "/reportedAt"; order = "descending" }
                )
            )
        }
    },
    @{
        Name = "ANALYTICS"
        PartitionKey = "/organizationId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/date"; order = "descending" },
                    @{ path = "/organizationId"; order = "ascending" }
                )
            )
        }
    },
    @{
        Name = "FRAUD_ATTEMPTS"
        PartitionKey = "/driverId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/detectedAt"; order = "descending" },
                    @{ path = "/confidenceScore"; order = "descending" }
                ),
                @(
                    @{ path = "/fraudType"; order = "ascending" },
                    @{ path = "/detectedAt"; order = "descending" }
                )
            )
        }
    },
    @{
        Name = "QUALITY_ANALYTICS"
        PartitionKey = "/scanId"
        Throughput = 400
        IndexingPolicy = @{
            indexingMode = "consistent"
            automatic = $true
            includedPaths = @(
                @{ path = "/*" }
            )
            excludedPaths = @(
                @{ path = "/\"_etag\"/?" }
            )
            compositeIndexes = @(
                @(
                    @{ path = "/analyzedAt"; order = "descending" },
                    @{ path = "/overallScore"; order = "descending" }
                )
            )
        }
    }
)

# ============================================
# CREAR CONTENEDORES
# ============================================

Write-Step "Creando contenedores..."

foreach ($container in $containers) {
    Write-Info "Procesando contenedor: $($container.Name)"

    # Verificar si ya existe
    $containerExists = az cosmosdb sql container show `
        --account-name $AccountName `
        --resource-group $ResourceGroup `
        --database-name $DatabaseName `
        --name $container.Name 2>$null

    if ($containerExists) {
        Write-Warning "  └─ Contenedor '$($container.Name)' ya existe, saltando"
        continue
    }

    # Convertir indexing policy a JSON
    $indexingPolicyJson = $container.IndexingPolicy | ConvertTo-Json -Depth 10 -Compress

    # Crear contenedor
    az cosmosdb sql container create `
        --account-name $AccountName `
        --resource-group $ResourceGroup `
        --database-name $DatabaseName `
        --name $container.Name `
        --partition-key-path $container.PartitionKey `
        --throughput $container.Throughput `
        --idx $indexingPolicyJson

    if ($LASTEXITCODE -eq 0) {
        Write-Success "  └─ Contenedor '$($container.Name)' creado ($($container.Throughput) RU/s)"
    } else {
        Write-Error "  └─ Error creando contenedor '$($container.Name)'"
    }
}

# ============================================
# VERIFICACIÓN FINAL
# ============================================

Write-Step "Verificando creación..."

# Listar todos los contenedores
$createdContainers = az cosmosdb sql container list `
    --account-name $AccountName `
    --resource-group $ResourceGroup `
    --database-name $DatabaseName `
    --query "[].name" -o tsv

Write-Info "Contenedores creados:"
foreach ($containerName in $createdContainers) {
    Write-Host "  ✓ $containerName" -ForegroundColor Green
}

# Calcular throughput total
$totalThroughput = ($containers | Measure-Object -Property Throughput -Sum).Sum
Write-Info "Throughput total: $totalThroughput RU/s"

# ============================================
# RESUMEN FINAL
# ============================================

Write-Host "`n" -NoNewline
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║          ✅ INICIALIZACIÓN COMPLETADA EXITOSAMENTE        ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Success "Database: $DatabaseName"
Write-Success "Contenedores: $($createdContainers.Count)"
Write-Success "Throughput total: $totalThroughput RU/s"

Write-Host "`n🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Ejecutar: .\Load-SampleData.ps1" -ForegroundColor White
Write-Host "   2. Verificar datos en Azure Portal → Data Explorer" -ForegroundColor White
Write-Host ""
