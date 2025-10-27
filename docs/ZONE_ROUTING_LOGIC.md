# 🗺️ LÓGICA DE ENRUTAMIENTO DE PAQUETES POR ZONA GEOGRÁFICA

## 📋 CONTEXTO

En el sistema de logística multi-nivel, **cada paquete se asigna automáticamente a una sublogística específica basándose en la zona geográfica de la dirección de destino**. Esto permite:

1. **Especialización territorial**: Cada sublogística opera en zonas específicas
2. **Optimización de costos**: Comisiones y bonos diferenciados por zona
3. **Escalabilidad**: Agregar nuevas sublogísticas sin afectar las existentes
4. **Multi-tenancy**: Aislamiento operacional y financiero

---

## 🏢 ARQUITECTURA DE ZONAS

### Jerarquía de Organizaciones

```
┌─────────────────────────────────────────────────────────────┐
│                  EMPRESA MATRIZ (org_root)                   │
│                  "Logística Nacional S.A."                   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼──────┐   ┌────────▼─────┐   ┌────────▼─────┐
│ SUBLOGÍSTICA │   │ SUBLOGÍSTICA │   │ SUBLOGÍSTICA │
│  CANGALLO    │   │  DEFILIPPI   │   │   RÁPIDA     │
│  (org_001)   │   │  (org_002)   │   │  (org_003)   │
└──────────────┘   └──────────────┘   └──────────────┘
      │                   │                   │
      │                   │                   │
 ┌────▼─────┐       ┌─────▼────┐       ┌─────▼────┐
 │  ZONAS:  │       │  ZONAS:  │       │  ZONAS:  │
 │  • CABA  │       │• Ramos   │       │• GBA Sur │
 │  • Zona  │       │  Mejía   │       │• Lomas   │
 │    Norte │       │• Benavidez│       │• Quilmes │
 └──────────┘       └──────────┘       └──────────┘
```

---

## 📊 CONFIGURACIÓN DE ZONAS EN COSMOS DB

### 1. Contenedor ORGANIZATIONS - Configuración de Cobertura

Cada sublogística tiene un campo `configuration.coverageZones` que define qué zonas geográficas cubre:

```json
{
  "id": "org_001",
  "organizationId": "org_001",
  "name": "Logística Cangallo",
  "organizationType": "sublogistics",
  "parentOrganizationId": "org_root",
  "status": "active",

  "configuration": {
    "coverageZones": [
      "caba",
      "palermo",
      "recoleta",
      "belgrano",
      "zona_norte"
    ],
    "commissionRules": {
      "perPackage": 150.00,
      "perKm": 25.00,
      "zoneBonuses": {
        "caba": 50.00,
        "palermo": 60.00,
        "recoleta": 55.00,
        "belgrano": 65.00
      }
    },
    "settlementPeriod": "weekly",
    "settlementDay": "monday"
  }
}
```

```json
{
  "id": "org_002",
  "organizationId": "org_002",
  "name": "Logística Defilippi",
  "organizationType": "sublogistics",
  "parentOrganizationId": "org_root",
  "status": "active",

  "configuration": {
    "coverageZones": [
      "ramos_mejia",
      "benavidez",
      "gba_oeste",
      "san_isidro"
    ],
    "commissionRules": {
      "perPackage": 180.00,
      "perKm": 30.00,
      "zoneBonuses": {
        "ramos_mejia": 75.00,
        "benavidez": 100.00,
        "gba_oeste": 85.00
      }
    },
    "settlementPeriod": "weekly",
    "settlementDay": "tuesday"
  }
}
```

### 2. Contenedor PACKAGES - Asignación por Zona

Cada paquete tiene:
- **`zoneId`** (Partition Key): Zona geográfica principal
- **`origin.organizationId`**: Sublogística responsable del paquete
- **`destination.address.zone`**: Zona específica de la dirección

```json
{
  "id": "pkg_20251020_0001",
  "packageId": "pkg_20251020_0001",
  "trackingNumber": "CAN-20251020-0001",
  "zoneId": "caba",  // ← PARTITION KEY para distribución geográfica
  "type": "package",

  "origin": {
    "organizationId": "org_001",  // ← Asignado a Cangallo (cubre CABA)
    "organizationName": "Logística Cangallo",
    "sender": {
      "name": "E-Commerce MercadoLibre",
      "phone": "+54 11 4000-0000"
    }
  },

  "destination": {
    "recipient": {
      "name": "María González",
      "phone": "+54 9 11 5555-1234"
    },
    "address": {
      "street": "Nazca 3733",
      "neighborhood": "Versalles",
      "city": "CABA",
      "zone": "caba",  // ← Determina la asignación a sublogística
      "coordinates": {
        "lat": -34.6158,
        "lng": -58.4707
      }
    }
  }
}
```

---

## 🔄 FLUJO DE ASIGNACIÓN AUTOMÁTICA

### Algoritmo de Enrutamiento

```
┌─────────────────────────────────────────────────────────────┐
│  1. INGRESO DE PAQUETE (Escaneo OCR o Input Manual)         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. EXTRACCIÓN DE DIRECCIÓN                                  │
│     - Calle: "Argentina 97"                                  │
│     - Ciudad: "Ramos Mejía"                                  │
│     - Provincia: "Buenos Aires"                              │
│     - Coordenadas: lat/lng (si disponible)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. GEOCODING / NORMALIZACIÓN DE ZONA                        │
│     - Lookup en tabla de zonas: "Ramos Mejía" → "ramos_mejia"│
│     - O usar coordenadas para determinar zona (GeoJSON)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. QUERY A ORGANIZATIONS PARA ENCONTRAR COBERTURA           │
│                                                               │
│  SELECT * FROM organizations o                               │
│  WHERE o.status = 'active'                                   │
│    AND ARRAY_CONTAINS(o.configuration.coverageZones,        │
│                        'ramos_mejia')                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. RESULTADO: org_002 "Logística Defilippi"                │
│     - coverageZones: ["ramos_mejia", "benavidez", ...]      │
│     - commission: 180.00 por paquete                         │
│     - zoneBonus: 75.00 para ramos_mejia                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. CREAR/ACTUALIZAR PAQUETE CON ASIGNACIÓN                 │
│     {                                                         │
│       "packageId": "pkg_20251022_0089",                      │
│       "zoneId": "ramos_mejia",  // Partition key            │
│       "origin": {                                            │
│         "organizationId": "org_002",  // ← Asignado         │
│         "organizationName": "Logística Defilippi"           │
│       },                                                     │
│       "financials": {                                        │
│         "driverCommission": 180.00,  // De config org       │
│         "zoneBonus": 75.00           // De config org       │
│       }                                                      │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 IMPLEMENTACIÓN EN CÓDIGO

### Azure Function: Package Assignment Service

```typescript
// File: functions/assignPackageToOrganization.ts

import { CosmosClient } from '@azure/cosmos';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode?: string;
  coordinates?: { lat: number; lng: number };
}

interface Organization {
  id: string;
  organizationId: string;
  name: string;
  configuration: {
    coverageZones: string[];
    commissionRules: {
      perPackage: number;
      perKm: number;
      zoneBonuses: { [zone: string]: number };
    };
  };
}

// Tabla de mapeo Ciudad → ZoneId
const CITY_TO_ZONE_MAP: { [key: string]: string } = {
  'CABA': 'caba',
  'Capital Federal': 'caba',
  'Buenos Aires': 'caba',
  'Ramos Mejía': 'ramos_mejia',
  'Ramos Mejia': 'ramos_mejia',
  'Benavidez': 'benavidez',
  'San Isidro': 'san_isidro',
  'Vicente López': 'vicente_lopez',
  'Tigre': 'tigre',
  'Lomas de Zamora': 'lomas_zamora',
  'Quilmes': 'quilmes'
  // ... agregar más ciudades
};

// Barrios de CABA mapeados a subzonas
const CABA_NEIGHBORHOODS: { [key: string]: string } = {
  'Palermo': 'palermo',
  'Recoleta': 'recoleta',
  'Belgrano': 'belgrano',
  'Versalles': 'versalles',
  'Caballito': 'caballito',
  'Villa Crespo': 'villa_crespo'
  // ... agregar más barrios
};

/**
 * Normaliza la dirección y determina la zona (zoneId)
 */
export function normalizeAddressToZone(address: Address): string {
  // 1. Primero intentar por ciudad exacta
  const cityNormalized = address.city.trim();

  if (CITY_TO_ZONE_MAP[cityNormalized]) {
    return CITY_TO_ZONE_MAP[cityNormalized];
  }

  // 2. Si es CABA, intentar determinar subzona por barrio
  if (cityNormalized === 'CABA' || cityNormalized === 'Capital Federal') {
    // Buscar el barrio en la calle/dirección
    for (const [neighborhood, zoneId] of Object.entries(CABA_NEIGHBORHOODS)) {
      if (address.street.toLowerCase().includes(neighborhood.toLowerCase())) {
        return zoneId;
      }
    }
    // Si no encontramos barrio específico, devolver CABA genérico
    return 'caba';
  }

  // 3. Si hay coordenadas, usar GeoJSON lookup (opcional)
  if (address.coordinates) {
    return getZoneFromCoordinates(address.coordinates);
  }

  // 4. Fallback: zona desconocida
  return 'zona_no_definida';
}

/**
 * Busca la organización responsable de una zona
 */
export async function findOrganizationForZone(
  zoneId: string,
  cosmosClient: CosmosClient
): Promise<Organization | null> {
  const database = cosmosClient.database('LogisticsDB');
  const container = database.container('Organizations');

  const querySpec = {
    query: `
      SELECT * FROM o
      WHERE o.status = 'active'
        AND o.organizationType = 'sublogistics'
        AND ARRAY_CONTAINS(o.configuration.coverageZones, @zoneId)
    `,
    parameters: [
      { name: '@zoneId', value: zoneId }
    ]
  };

  const { resources } = await container.items.query<Organization>(querySpec).fetchAll();

  if (resources.length === 0) {
    console.warn(`No organization found for zone: ${zoneId}`);
    return null;
  }

  if (resources.length > 1) {
    console.warn(`Multiple organizations found for zone ${zoneId}. Using first one.`);
  }

  return resources[0];
}

/**
 * Asigna un paquete a la organización correcta basándose en la dirección
 */
export async function assignPackageToOrganization(
  destinationAddress: Address,
  cosmosClient: CosmosClient
): Promise<{
  organizationId: string;
  organizationName: string;
  zoneId: string;
  commission: number;
  zoneBonus: number;
}> {
  // 1. Determinar la zona del paquete
  const zoneId = normalizeAddressToZone(destinationAddress);

  // 2. Buscar organización responsable
  const organization = await findOrganizationForZone(zoneId, cosmosClient);

  if (!organization) {
    throw new Error(
      `No se encontró sublogística para la zona: ${zoneId}. ` +
      `Dirección: ${destinationAddress.street}, ${destinationAddress.city}`
    );
  }

  // 3. Obtener comisiones y bonos de la configuración
  const commission = organization.configuration.commissionRules.perPackage;
  const zoneBonus = organization.configuration.commissionRules.zoneBonuses[zoneId] || 0;

  return {
    organizationId: organization.organizationId,
    organizationName: organization.name,
    zoneId: zoneId,
    commission: commission,
    zoneBonus: zoneBonus
  };
}

/**
 * Lookup de zona por coordenadas (usando GeoJSON o servicio de geocoding)
 */
function getZoneFromCoordinates(coords: { lat: number; lng: number }): string {
  // Implementación con Azure Maps API o GeoJSON lookups
  // Por ahora, simplificado:

  // CABA boundaries aproximados
  if (
    coords.lat >= -34.7 && coords.lat <= -34.5 &&
    coords.lng >= -58.55 && coords.lng <= -58.33
  ) {
    return 'caba';
  }

  // Zona Norte (San Isidro, Vicente López, Tigre)
  if (
    coords.lat >= -34.6 && coords.lat <= -34.4 &&
    coords.lng >= -58.6 && coords.lng <= -58.45
  ) {
    return 'zona_norte';
  }

  // Zona Oeste (Ramos Mejía, Morón)
  if (
    coords.lat >= -34.7 && coords.lat <= -34.6 &&
    coords.lng >= -58.65 && coords.lng <= -58.55
  ) {
    return 'ramos_mejia';
  }

  return 'zona_no_definida';
}

// ========== EJEMPLO DE USO ==========

async function createPackageWithAutoAssignment(
  packageData: any,
  cosmosClient: CosmosClient
) {
  // 1. Obtener asignación automática
  const assignment = await assignPackageToOrganization(
    packageData.destination.address,
    cosmosClient
  );

  // 2. Crear paquete con los datos de asignación
  const newPackage = {
    id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    packageId: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    trackingNumber: `${assignment.organizationId.toUpperCase()}-${Date.now()}`,
    zoneId: assignment.zoneId,  // ← PARTITION KEY
    type: 'package',

    origin: {
      organizationId: assignment.organizationId,
      organizationName: assignment.organizationName,
      sender: packageData.sender
    },

    destination: packageData.destination,
    packageDetails: packageData.packageDetails,

    status: {
      current: 'created',
      timestamp: new Date().toISOString(),
      history: [{
        status: 'created',
        timestamp: new Date().toISOString(),
        notes: `Asignado automáticamente a ${assignment.organizationName}`
      }]
    },

    financials: {
      deliveryFee: packageData.packageDetails.declaredValue,
      driverCommission: assignment.commission,
      zoneBonus: assignment.zoneBonus,
      totalCost: assignment.commission + assignment.zoneBonus,
      paymentStatus: 'pending'
    },

    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system_auto_assignment',
      source: 'android_app'
    }
  };

  // 3. Guardar en Cosmos DB
  const database = cosmosClient.database('LogisticsDB');
  const container = database.container('Packages');

  const { resource } = await container.items.create(newPackage);

  console.log(`✅ Paquete ${resource.packageId} asignado a ${assignment.organizationName}`);

  return resource;
}
```

---

## 📈 CASOS DE USO COMUNES

### Caso 1: Paquete en CABA → Asignado a Cangallo

```json
// INPUT
{
  "destination": {
    "address": {
      "street": "Nazca 3733, 3°B",
      "city": "CABA",
      "state": "Buenos Aires"
    }
  }
}

// PROCESO
normalizeAddressToZone() → "caba"
findOrganizationForZone("caba") → org_001 (Cangallo)

// OUTPUT
{
  "zoneId": "caba",
  "origin": {
    "organizationId": "org_001",
    "organizationName": "Logística Cangallo"
  },
  "financials": {
    "driverCommission": 150.00,
    "zoneBonus": 50.00
  }
}
```

### Caso 2: Paquete en Ramos Mejía → Asignado a Defilippi

```json
// INPUT
{
  "destination": {
    "address": {
      "street": "Argentina 97",
      "city": "Ramos Mejía",
      "state": "Buenos Aires"
    }
  }
}

// PROCESO
normalizeAddressToZone() → "ramos_mejia"
findOrganizationForZone("ramos_mejia") → org_002 (Defilippi)

// OUTPUT
{
  "zoneId": "ramos_mejia",
  "origin": {
    "organizationId": "org_002",
    "organizationName": "Logística Defilippi"
  },
  "financials": {
    "driverCommission": 180.00,
    "zoneBonus": 75.00
  }
}
```

### Caso 3: Zona sin Cobertura → Error o Asignación Manual

```json
// INPUT
{
  "destination": {
    "address": {
      "street": "San Martín 1234",
      "city": "Mar del Plata",
      "state": "Buenos Aires"
    }
  }
}

// PROCESO
normalizeAddressToZone() → "mar_del_plata"
findOrganizationForZone("mar_del_plata") → null

// OUTPUT
❌ Error: "No se encontró sublogística para la zona: mar_del_plata"

// SOLUCIÓN:
// 1. Agregar "mar_del_plata" a coverageZones de una organización existente
// 2. O crear nueva organización para esa zona
// 3. O permitir asignación manual por operador
```

---

## 🛠️ ADMINISTRACIÓN DE ZONAS

### Dashboard de Configuración de Zonas

```
┌──────────────────────────────────────────────────────────────┐
│  ADMINISTRACIÓN DE ZONAS GEOGRÁFICAS                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  SUBLOGÍSTICA: Logística Cangallo                            │
│                                                               │
│  Zonas de Cobertura:                                         │
│  ┌────────────────┬──────────────┬─────────────┐            │
│  │ Zona           │ Bono         │ Paquetes    │            │
│  ├────────────────┼──────────────┼─────────────┤            │
│  │ caba           │ $50.00       │ 1,234       │            │
│  │ palermo        │ $60.00       │ 456         │            │
│  │ recoleta       │ $55.00       │ 289         │            │
│  │ belgrano       │ $65.00       │ 178         │            │
│  │ zona_norte     │ $70.00       │ 98          │            │
│  └────────────────┴──────────────┴─────────────┘            │
│                                                               │
│  [+ Agregar Zona]  [Editar Bonos]  [Ver Mapa]               │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  ZONAS SIN COBERTURA (últimos 7 días):                       │
│  • Mar del Plata (3 paquetes rechazados)                     │
│  • La Plata (1 paquete rechazado)                            │
│                                                               │
│  [Asignar a Sublogística]                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 QUERIES ÚTILES

### Query 1: Ver todas las zonas cubiertas por todas las organizaciones

```sql
SELECT
  o.organizationId,
  o.name,
  ARRAY_LENGTH(o.configuration.coverageZones) as totalZones,
  o.configuration.coverageZones
FROM organizations o
WHERE o.organizationType = 'sublogistics'
  AND o.status = 'active'
ORDER BY o.name
```

### Query 2: Paquetes por organización y zona

```sql
SELECT
  p.origin.organizationId,
  p.origin.organizationName,
  p.zoneId,
  COUNT(1) as totalPackages,
  SUM(p.financials.driverCommission) as totalCommissions,
  SUM(p.financials.zoneBonus) as totalBonuses
FROM packages p
WHERE p.status.current IN ('delivered', 'out_for_delivery')
  AND p.status.timestamp >= '2025-10-01T00:00:00Z'
GROUP BY
  p.origin.organizationId,
  p.origin.organizationName,
  p.zoneId
ORDER BY totalPackages DESC
```

### Query 3: Detectar zonas sin cobertura (paquetes rechazados)

```sql
SELECT
  p.destination.address.city as ciudad,
  p.destination.address.zone as zona,
  COUNT(1) as paquetes_rechazados
FROM packages p
WHERE p.status.current = 'failed'
  AND p.incidents[0].type = 'no_coverage'
  AND p.status.timestamp >= '2025-10-20T00:00:00Z'
GROUP BY
  p.destination.address.city,
  p.destination.address.zone
ORDER BY paquetes_rechazados DESC
```

---

## 🔄 REASIGNACIÓN DINÁMICA

### Cambio de Zona de una Organización

Si una organización expande o reduce su cobertura:

```typescript
// Ejemplo: Cangallo ahora también cubre "san_telmo"
async function addZoneToCoverage(
  organizationId: string,
  newZone: string,
  cosmosClient: CosmosClient
) {
  const database = cosmosClient.database('LogisticsDB');
  const container = database.container('Organizations');

  // 1. Obtener organización actual
  const { resource: org } = await container.item(organizationId, organizationId).read();

  // 2. Agregar zona si no existe
  if (!org.configuration.coverageZones.includes(newZone)) {
    org.configuration.coverageZones.push(newZone);

    // 3. Agregar bono para la nueva zona (opcional)
    org.configuration.commissionRules.zoneBonuses[newZone] = 55.00;

    // 4. Actualizar documento
    await container.item(organizationId, organizationId).replace(org);

    console.log(`✅ Zona "${newZone}" agregada a ${org.name}`);
  }
}
```

---

## 📝 CONSIDERACIONES IMPORTANTES

### 1. **Overlapping de Zonas**
Si dos organizaciones tienen la misma zona en `coverageZones`, el sistema tomará la **primera organización que encuentre**. Se recomienda:
- Evitar overlapping cuando sea posible
- O implementar lógica de prioridad/preferencia
- O permitir asignación manual por operador

### 2. **Zonas Jerárquicas**
Algunas zonas son subconjuntos de otras:
- `"palermo"` es parte de `"caba"`
- `"ramos_mejia"` es parte de `"gba_oeste"`

Recomendación: Ordenar las zonas de más específica a menos específica en la búsqueda.

### 3. **Geofencing con Coordenadas**
Para mayor precisión, usar coordenadas lat/lng y polígonos GeoJSON para definir zonas exactas:

```json
{
  "zoneDefinitions": {
    "caba": {
      "type": "Polygon",
      "coordinates": [
        [
          [-58.531, -34.705],
          [-58.335, -34.705],
          [-58.335, -34.526],
          [-58.531, -34.526],
          [-58.531, -34.705]
        ]
      ]
    }
  }
}
```

### 4. **Actualización de Partition Key**
⚠️ **IMPORTANTE**: El `zoneId` es el partition key del contenedor Packages. **No se puede modificar después de creado el documento**. Si un paquete necesita cambiar de zona (reasignación), se debe:
- Crear un nuevo documento con el nuevo `zoneId`
- Marcar el documento anterior como `"status": "reassigned"`
- Copiar todo el historial al nuevo documento

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear tabla de mapeo ciudad → zoneId
- [ ] Crear tabla de mapeo barrios CABA → subzonas
- [ ] Implementar función `normalizeAddressToZone()`
- [ ] Implementar función `findOrganizationForZone()`
- [ ] Implementar función `assignPackageToOrganization()`
- [ ] Configurar `coverageZones` en todas las organizaciones existentes
- [ ] Crear índice en Organizations: `/configuration/coverageZones/*`
- [ ] Implementar dashboard de administración de zonas
- [ ] Crear alertas para zonas sin cobertura
- [ ] Implementar validación de overlapping de zonas
- [ ] Documentar procedimiento de expansión de zonas
- [ ] Testing de asignación automática con direcciones reales

---

**FIN DEL DOCUMENTO**
