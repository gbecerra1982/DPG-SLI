/**
 * ================================================================
 * SCRIPT 2: CARGA DE INFORMACIÓN ALEATORIA (SEED DATA)
 * ================================================================
 *
 * Descripción:
 * - Crea organizaciones (1 empresa matriz + 2 sublogísticas: JJ y JM)
 * - Crea repartidores (14 drivers distribuidos en las sublogísticas)
 * - Crea zonas y configuraciones
 *
 * Requisitos:
 * - Script 1 ejecutado exitosamente
 * - Base de datos LogisticsDB existente
 *
 * Ejecución:
 * node 2-carga-informacion-aleatoria.js
 *
 * ================================================================
 */

const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');
const readline = require('readline');
const path = require('path');

// Cargar variables de entorno desde la raíz del proyecto
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ========== CONFIGURACIÓN ==========
const config = {
  endpoint: process.env.COSMOS_ENDPOINT || "https://YOUR_ACCOUNT.documents.azure.com:443/",
  databaseId: process.env.COSMOS_DATABASE_ID || "SLIDB"  // Default: SLIDB
};

// ========== DATOS DE MUESTRA ==========

// 1. ORGANIZATION (Empresa Matriz)
const rootOrganization = {
  id: "org_root",
  organizationId: "org_root",
  type: "organization",
  name: "Logística Nacional S.A.",
  businessName: "Logística Nacional Sociedad Anónima",
  cuit: "30-70000000-0",
  organizationType: "root",
  parentOrganizationId: null,
  status: "active",
  contact: {
    email: "contacto@logisticanacional.com.ar",
    phone: "+54 11 4000-0000",
    address: {
      street: "Av. Corrientes 1234",
      city: "CABA",
      state: "Buenos Aires",
      zipCode: "C1043AAZ",
      country: "Argentina",
      coordinates: {
        lat: -34.6037,
        lng: -58.3816
      }
    }
  },
  configuration: {
    coverageZones: [],
    commissionRules: null,
    settlementPeriod: null,
    currency: "ARS"
  },
  stats: {
    totalDrivers: 0,
    totalPackagesDelivered: 0,
    averageRating: 0,
    activePackages: 0
  },
  metadata: {
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
    createdBy: "system_init",
    tags: ["matriz", "principal"]
  }
};

// 2. SUBLOGÍSTICAS (JJ y JM)
const subOrganizations = [
  {
    id: "org_jj",
    organizationId: "org_jj",
    type: "organization",
    name: "JJ Logística",
    businessName: "JJ Transportes S.A.",
    cuit: "30-71234567-8",
    organizationType: "sublogistics",
    parentOrganizationId: "org_root",
    status: "active",
    contact: {
      email: "contacto@jjlogistica.com.ar",
      phone: "+54 11 4567-8900",
      address: {
        street: "Av. Cangallo 1234",
        city: "CABA",
        state: "Buenos Aires",
        zipCode: "C1234ABC",
        country: "Argentina",
        coordinates: {
          lat: -34.6037,
          lng: -58.3816
        }
      }
    },
    configuration: {
      coverageZones: ["caba", "palermo", "recoleta", "belgrano", "caballito", "versalles", "san_isidro", "olivos", "vicente_lopez", "martinez", "tigre", "quilmes"],
      commissionRules: {
        perPackage: 150.00,
        perKm: 25.00,
        zoneBonuses: {
          "caba": 50.00,
          "palermo": 60.00,
          "recoleta": 55.00,
          "belgrano": 65.00,
          "caballito": 50.00,
          "san_isidro": 70.00,
          "olivos": 75.00,
          "vicente_lopez": 70.00,
          "martinez": 65.00,
          "tigre": 85.00,
          "quilmes": 80.00
        }
      },
      settlementPeriod: "weekly",
      settlementDay: "monday",
      currency: "ARS"
    },
    stats: {
      totalDrivers: 7,
      totalPackagesDelivered: 0,
      averageRating: 4.7,
      activePackages: 0
    },
    metadata: {
      createdAt: "2024-03-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
      createdBy: "admin_001",
      tags: ["caba", "premium", "high_volume", "jj"]
    }
  },
  {
    id: "org_jm",
    organizationId: "org_jm",
    type: "organization",
    name: "JM Logística",
    businessName: "JM Transportes S.R.L.",
    cuit: "30-72345678-9",
    organizationType: "sublogistics",
    parentOrganizationId: "org_root",
    status: "active",
    contact: {
      email: "info@jmlogistica.com.ar",
      phone: "+54 11 5678-9012",
      address: {
        street: "Av. San Martín 5678",
        city: "Ramos Mejía",
        state: "Buenos Aires",
        zipCode: "B1704AAA",
        country: "Argentina",
        coordinates: {
          lat: -34.6414,
          lng: -58.5631
        }
      }
    },
    configuration: {
      coverageZones: ["ramos_mejia", "benavidez", "gba_oeste", "tigre", "lomas_zamora", "quilmes", "avellaneda", "gba_sur", "olivos", "san_isidro", "vicente_lopez", "martinez", "moron", "ituzaingo"],
      commissionRules: {
        perPackage: 180.00,
        perKm: 30.00,
        zoneBonuses: {
          "ramos_mejia": 75.00,
          "benavidez": 100.00,
          "gba_oeste": 85.00,
          "tigre": 90.00,
          "lomas_zamora": 80.00,
          "quilmes": 85.00,
          "avellaneda": 70.00,
          "olivos": 75.00,
          "san_isidro": 70.00,
          "vicente_lopez": 70.00,
          "martinez": 65.00,
          "moron": 80.00,
          "ituzaingo": 75.00
        }
      },
      settlementPeriod: "weekly",
      settlementDay: "tuesday",
      currency: "ARS"
    },
    stats: {
      totalDrivers: 7,
      totalPackagesDelivered: 0,
      averageRating: 4.6,
      activePackages: 0
    },
    metadata: {
      createdAt: "2024-03-15T00:00:00Z",
      updatedAt: new Date().toISOString(),
      createdBy: "admin_001",
      tags: ["gba", "zona_oeste", "gba_sur", "jm"]
    }
  }
];

// 3. DRIVERS (Repartidores)
const drivers = [
  // ===== JJ LOGÍSTICA (org_jj) - 7 drivers =====
  {
    id: "drv_001",
    driverId: "drv_001",
    subLogisticsId: "org_jj",
    type: "driver",
    personalInfo: {
      firstName: "Juan Carlos",
      lastName: "Rodríguez",
      dni: "35123456",
      birthDate: "1990-05-15",
      email: "jcrodriguez@email.com",
      phone: "+54 11 5678-1234",
      address: {
        street: "Belgrano 2958",
        city: "CABA",
        state: "Buenos Aires",
        zipCode: "C1094AAO"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_001.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-03-01",
      endDate: null,
      assignedZones: ["caba", "palermo", "belgrano"],
      authorizedSubLogistics: ["org_jj"],
      authorizedSubLogistics: ["org_jj"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "ABC123",
        brand: "Honda",
        model: "Wave 110",
        year: 2022,
        insurance: {
          company: "La Caja",
          policyNumber: "POL-987654",
          expiryDate: "2026-03-01"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 1523,
      successRate: 0.94,
      averageDeliveryTime: 35,
      rating: 4.6,
      onTimeDeliveryRate: 0.89,
      currentStreak: 47,
      bestStreak: 102,
      failedDeliveries: 98,
      returnedPackages: 23
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.5875,
        lng: -58.3974,
        timestamp: new Date().toISOString(),
        accuracy: 10
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Provincia",
        cbu: "0140987654321098765432",
        alias: "JCROD.COBROS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-03-01T09:00:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Samsung Galaxy A54",
        os: "Android 14",
        appBuild: "202510151"
      }
    }
  },
  {
    id: "drv_002",
    driverId: "drv_002",
    subLogisticsId: "org_jj",
    type: "driver",
    personalInfo: {
      firstName: "María Fernanda",
      lastName: "González",
      dni: "36234567",
      birthDate: "1992-08-22",
      email: "mfgonzalez@email.com",
      phone: "+54 11 6789-2345",
      address: {
        street: "Santa Fe 1234",
        city: "CABA",
        state: "Buenos Aires",
        zipCode: "C1059ABT"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_002.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-04-15",
      endDate: null,
      assignedZones: ["caba", "recoleta", "caballito"],
      authorizedSubLogistics: ["org_jj"],
      authorizedSubLogistics: ["org_jj"],
      vehicleType: "bicycle",
      vehicleInfo: {
        licensePlate: null,
        brand: "Mountain",
        model: "Rodado 29",
        year: 2023,
        insurance: null
      }
    },
    performance: {
      totalPackagesDelivered: 892,
      successRate: 0.96,
      averageDeliveryTime: 28,
      rating: 4.8,
      onTimeDeliveryRate: 0.93,
      currentStreak: 67,
      bestStreak: 89,
      failedDeliveries: 35,
      returnedPackages: 12
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.5958,
        lng: -58.3731,
        timestamp: new Date().toISOString(),
        accuracy: 8
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Galicia",
        cbu: "0070123456789012345678",
        alias: "MFGONZ.PAGOS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-04-15T10:00:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Motorola Edge 40",
        os: "Android 13",
        appBuild: "202510151"
      }
    }
  },

  // ===== JM LOGÍSTICA (org_jm) - 7 drivers =====
  {
    id: "drv_006",
    driverId: "drv_006",
    subLogisticsId: "org_jm",
    type: "driver",
    personalInfo: {
      firstName: "Roberto",
      lastName: "Martínez",
      dni: "33567890",
      birthDate: "1987-12-10",
      email: "rmartinez@email.com",
      phone: "+54 11 2345-6789",
      address: {
        street: "Rivadavia 4567",
        city: "Ramos Mejía",
        state: "Buenos Aires",
        zipCode: "B1704AAA"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_006.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-03-20",
      endDate: null,
      assignedZones: ["ramos_mejia", "gba_oeste"],
      authorizedSubLogistics: ["org_jm"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "XYZ789",
        brand: "Yamaha",
        model: "FZ 150",
        year: 2021,
        insurance: {
          company: "Seguros Rivadavia",
          policyNumber: "POL-555666",
          expiryDate: "2026-03-20"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 1234,
      successRate: 0.91,
      averageDeliveryTime: 42,
      rating: 4.5,
      onTimeDeliveryRate: 0.85,
      currentStreak: 38,
      bestStreak: 78,
      failedDeliveries: 112,
      returnedPackages: 34
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.6414,
        lng: -58.5631,
        timestamp: new Date().toISOString(),
        accuracy: 12
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Nación",
        cbu: "0110234567890123456789",
        alias: "RMARTI.COBROS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-03-20T09:30:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Samsung Galaxy A33",
        os: "Android 13",
        appBuild: "202510151"
      }
    }
  },

  {
    id: "drv_011",
    driverId: "drv_011",
    subLogisticsId: "org_jm",
    type: "driver",
    personalInfo: {
      firstName: "Diego",
      lastName: "Fernández",
      dni: "34789012",
      birthDate: "1989-06-30",
      email: "dfernandez@email.com",
      phone: "+54 11 7890-1234",
      address: {
        street: "Av. Meeks 890",
        city: "Lomas de Zamora",
        state: "Buenos Aires",
        zipCode: "B1832AAA"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_011.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-04-10",
      endDate: null,
      assignedZones: ["lomas_zamora", "quilmes"],
      authorizedSubLogistics: ["org_jm"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "LMZ456",
        brand: "Zanella",
        model: "RX 150",
        year: 2022,
        insurance: {
          company: "Seguros Sura",
          policyNumber: "POL-888999",
          expiryDate: "2026-04-10"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 756,
      successRate: 0.88,
      averageDeliveryTime: 48,
      rating: 4.3,
      onTimeDeliveryRate: 0.82,
      currentStreak: 22,
      bestStreak: 56,
      failedDeliveries: 103,
      returnedPackages: 28
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.7606,
        lng: -58.4014,
        timestamp: new Date().toISOString(),
        accuracy: 15
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Provincia",
        cbu: "0140555666777888999000",
        alias: "DFERNA.PAGOS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-04-10T08:00:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.0",
      deviceInfo: {
        model: "Xiaomi Redmi Note 11",
        os: "Android 12",
        appBuild: "202509012"
      }
    }
  },

  // Additional drivers for JJ (drv_003, drv_004, drv_005)
  {
    id: "drv_003",
    driverId: "drv_003",
    subLogisticsId: "org_jj",
    type: "driver",
    personalInfo: {
      firstName: "Carlos",
      lastName: "López",
      dni: "37345678",
      birthDate: "1993-03-15",
      email: "clopez@email.com",
      phone: "+54 11 7890-2345",
      address: {
        street: "Córdoba 3456",
        city: "CABA",
        state: "Buenos Aires",
        zipCode: "C1188AAH"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_003.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-05-01",
      endDate: null,
      assignedZones: ["caba", "belgrano"],
      authorizedSubLogistics: ["org_jj"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "DEF456",
        brand: "Honda",
        model: "CG 150",
        year: 2023,
        insurance: {
          company: "La Caja",
          policyNumber: "POL-111222",
          expiryDate: "2026-05-01"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 678,
      successRate: 0.92,
      averageDeliveryTime: 32,
      rating: 4.5,
      onTimeDeliveryRate: 0.88,
      currentStreak: 35,
      bestStreak: 67,
      failedDeliveries: 55,
      returnedPackages: 18
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.5931,
        lng: -58.4016,
        timestamp: new Date().toISOString(),
        accuracy: 9
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Santander",
        cbu: "0720345678901234567890",
        alias: "CLOPE.COBROS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-05-01T08:30:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "iPhone 13",
        os: "iOS 17",
        appBuild: "202510151"
      }
    }
  },
  {
    id: "drv_004",
    driverId: "drv_004",
    subLogisticsId: "org_jj",
    type: "driver",
    personalInfo: {
      firstName: "Ana",
      lastName: "Torres",
      dni: "38456789",
      birthDate: "1994-07-20",
      email: "atorres@email.com",
      phone: "+54 11 8901-3456",
      address: {
        street: "Rivadavia 5678",
        city: "CABA",
        state: "Buenos Aires",
        zipCode: "C1424CPG"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_004.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-05-15",
      endDate: null,
      assignedZones: ["caballito", "versalles"],
      authorizedSubLogistics: ["org_jj"],
      vehicleType: "bicycle",
      vehicleInfo: {
        licensePlate: null,
        brand: "Trek",
        model: "FX 2",
        year: 2023,
        insurance: null
      }
    },
    performance: {
      totalPackagesDelivered: 512,
      successRate: 0.95,
      averageDeliveryTime: 26,
      rating: 4.7,
      onTimeDeliveryRate: 0.91,
      currentStreak: 42,
      bestStreak: 58,
      failedDeliveries: 28,
      returnedPackages: 10
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.6158,
        lng: -58.4397,
        timestamp: new Date().toISOString(),
        accuracy: 7
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Galicia",
        cbu: "0070987654321098765432",
        alias: "ATORR.PAGOS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-05-15T09:00:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Samsung Galaxy S23",
        os: "Android 14",
        appBuild: "202510151"
      }
    }
  },
  {
    id: "drv_005",
    driverId: "drv_005",
    subLogisticsId: "org_jj",
    type: "driver",
    personalInfo: {
      firstName: "Miguel",
      lastName: "Sánchez",
      dni: "39567890",
      birthDate: "1995-11-08",
      email: "msanchez@email.com",
      phone: "+54 11 9012-4567",
      address: {
        street: "Las Heras 8901",
        city: "CABA",
        state: "Buenos Aires",
        zipCode: "C1425ASU"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_005.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-06-01",
      endDate: null,
      assignedZones: ["palermo", "recoleta"],
      authorizedSubLogistics: ["org_jj"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "GHI789",
        brand: "Yamaha",
        model: "YBR 125",
        year: 2022,
        insurance: {
          company: "Seguros Rivadavia",
          policyNumber: "POL-333444",
          expiryDate: "2026-06-01"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 423,
      successRate: 0.89,
      averageDeliveryTime: 38,
      rating: 4.4,
      onTimeDeliveryRate: 0.84,
      currentStreak: 28,
      bestStreak: 45,
      failedDeliveries: 52,
      returnedPackages: 15
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.5889,
        lng: -58.4080,
        timestamp: new Date().toISOString(),
        accuracy: 11
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Provincia",
        cbu: "0140123456789012345678",
        alias: "MSANC.COBROS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-06-01T10:00:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Motorola G84",
        os: "Android 13",
        appBuild: "202510151"
      }
    }
  },
  {
    id: "drv_007",
    driverId: "drv_007",
    subLogisticsId: "org_jj",
    type: "driver",
    personalInfo: {
      firstName: "Laura",
      lastName: "Díaz",
      dni: "40678901",
      birthDate: "1996-02-14",
      email: "ldiaz@email.com",
      phone: "+54 11 1234-5678",
      address: {
        street: "Corrientes 2345",
        city: "CABA",
        state: "Buenos Aires",
        zipCode: "C1045AAD"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_007.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-06-15",
      endDate: null,
      assignedZones: ["san_isidro", "olivos", "vicente_lopez"],
      authorizedSubLogistics: ["org_jj", "org_jm"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "JKL012",
        brand: "Honda",
        model: "Wave 110",
        year: 2023,
        insurance: {
          company: "La Caja",
          policyNumber: "POL-555666",
          expiryDate: "2026-06-15"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 389,
      successRate: 0.93,
      averageDeliveryTime: 34,
      rating: 4.6,
      onTimeDeliveryRate: 0.90,
      currentStreak: 31,
      bestStreak: 52,
      failedDeliveries: 29,
      returnedPackages: 12
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.4708,
        lng: -58.5057,
        timestamp: new Date().toISOString(),
        accuracy: 8
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Nación",
        cbu: "0110567890123456789012",
        alias: "LDIAZ.PAGOS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-06-15T08:45:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Samsung Galaxy A54",
        os: "Android 14",
        appBuild: "202510151"
      }
    }
  },

  // Additional drivers for JM (drv_008, drv_009, drv_010, drv_012, drv_013, drv_014)
  {
    id: "drv_008",
    driverId: "drv_008",
    subLogisticsId: "org_jm",
    type: "driver",
    personalInfo: {
      firstName: "Sergio",
      lastName: "Ramírez",
      dni: "33890123",
      birthDate: "1988-04-25",
      email: "sramirez@email.com",
      phone: "+54 11 2345-7890",
      address: {
        street: "San Martín 6789",
        city: "Tigre",
        state: "Buenos Aires",
        zipCode: "B1648BCD"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_008.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-04-01",
      endDate: null,
      assignedZones: ["tigre", "benavidez"],
      authorizedSubLogistics: ["org_jm", "org_jj"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "MNO345",
        brand: "Zanella",
        model: "ZB 110",
        year: 2021,
        insurance: {
          company: "Seguros Sura",
          policyNumber: "POL-777888",
          expiryDate: "2026-04-01"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 1089,
      successRate: 0.90,
      averageDeliveryTime: 45,
      rating: 4.4,
      onTimeDeliveryRate: 0.86,
      currentStreak: 33,
      bestStreak: 71,
      failedDeliveries: 121,
      returnedPackages: 31
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.4264,
        lng: -58.5795,
        timestamp: new Date().toISOString(),
        accuracy: 13
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Provincia",
        cbu: "0140234567890123456789",
        alias: "SRAMI.COBROS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-04-01T09:15:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Xiaomi Redmi Note 12",
        os: "Android 13",
        appBuild: "202510151"
      }
    }
  },
  {
    id: "drv_009",
    driverId: "drv_009",
    subLogisticsId: "org_jm",
    type: "driver",
    personalInfo: {
      firstName: "Patricia",
      lastName: "Morales",
      dni: "34901234",
      birthDate: "1989-09-12",
      email: "pmorales@email.com",
      phone: "+54 11 3456-8901",
      address: {
        street: "Belgrano 1234",
        city: "Ramos Mejía",
        state: "Buenos Aires",
        zipCode: "B1704EFG"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_009.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-04-20",
      endDate: null,
      assignedZones: ["ramos_mejia", "gba_oeste"],
      authorizedSubLogistics: ["org_jm"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "PQR678",
        brand: "Honda",
        model: "CG 150",
        year: 2022,
        insurance: {
          company: "La Caja",
          policyNumber: "POL-999000",
          expiryDate: "2026-04-20"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 945,
      successRate: 0.92,
      averageDeliveryTime: 40,
      rating: 4.5,
      onTimeDeliveryRate: 0.87,
      currentStreak: 29,
      bestStreak: 64,
      failedDeliveries: 82,
      returnedPackages: 24
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.6414,
        lng: -58.5631,
        timestamp: new Date().toISOString(),
        accuracy: 10
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Galicia",
        cbu: "0070234567890123456789",
        alias: "PMORA.PAGOS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-04-20T10:30:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Samsung Galaxy A34",
        os: "Android 14",
        appBuild: "202510151"
      }
    }
  },
  {
    id: "drv_010",
    driverId: "drv_010",
    subLogisticsId: "org_jm",
    type: "driver",
    personalInfo: {
      firstName: "Fernando",
      lastName: "Castro",
      dni: "35012345",
      birthDate: "1990-12-05",
      email: "fcastro@email.com",
      phone: "+54 11 4567-9012",
      address: {
        street: "Mitre 5678",
        city: "Avellaneda",
        state: "Buenos Aires",
        zipCode: "B1870HIJ"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_010.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-05-10",
      endDate: null,
      assignedZones: ["avellaneda", "quilmes"],
      authorizedSubLogistics: ["org_jm"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "STU901",
        brand: "Yamaha",
        model: "FZ 150",
        year: 2023,
        insurance: {
          company: "Seguros Rivadavia",
          policyNumber: "POL-123456",
          expiryDate: "2026-05-10"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 812,
      successRate: 0.87,
      averageDeliveryTime: 47,
      rating: 4.2,
      onTimeDeliveryRate: 0.81,
      currentStreak: 19,
      bestStreak: 48,
      failedDeliveries: 122,
      returnedPackages: 35
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.6637,
        lng: -58.3648,
        timestamp: new Date().toISOString(),
        accuracy: 14
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Nación",
        cbu: "0110678901234567890123",
        alias: "FCAST.COBROS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-05-10T08:20:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.0",
      deviceInfo: {
        model: "Motorola Edge 30",
        os: "Android 13",
        appBuild: "202509012"
      }
    }
  },
  {
    id: "drv_012",
    driverId: "drv_012",
    subLogisticsId: "org_jm",
    type: "driver",
    personalInfo: {
      firstName: "Gabriela",
      lastName: "Vega",
      dni: "36123456",
      birthDate: "1991-06-18",
      email: "gvega@email.com",
      phone: "+54 11 5678-0123",
      address: {
        street: "9 de Julio 2345",
        city: "Quilmes",
        state: "Buenos Aires",
        zipCode: "B1878KLM"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_012.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-05-25",
      endDate: null,
      assignedZones: ["quilmes", "gba_sur"],
      authorizedSubLogistics: ["org_jm"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "VWX234",
        brand: "Zanella",
        model: "RX 150",
        year: 2022,
        insurance: {
          company: "Seguros Sura",
          policyNumber: "POL-234567",
          expiryDate: "2026-05-25"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 698,
      successRate: 0.91,
      averageDeliveryTime: 44,
      rating: 4.5,
      onTimeDeliveryRate: 0.85,
      currentStreak: 26,
      bestStreak: 59,
      failedDeliveries: 69,
      returnedPackages: 21
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.7203,
        lng: -58.2541,
        timestamp: new Date().toISOString(),
        accuracy: 12
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Provincia",
        cbu: "0140345678901234567890",
        alias: "GVEGA.PAGOS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-05-25T09:45:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Samsung Galaxy A24",
        os: "Android 13",
        appBuild: "202510151"
      }
    }
  },
  {
    id: "drv_013",
    driverId: "drv_013",
    subLogisticsId: "org_jm",
    type: "driver",
    personalInfo: {
      firstName: "Martín",
      lastName: "Paredes",
      dni: "37234567",
      birthDate: "1992-10-30",
      email: "mparedes@email.com",
      phone: "+54 11 6789-1234",
      address: {
        street: "Sarmiento 6789",
        city: "Lomas de Zamora",
        state: "Buenos Aires",
        zipCode: "B1832NOP"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_013.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-06-10",
      endDate: null,
      assignedZones: ["lomas_zamora", "gba_sur"],
      authorizedSubLogistics: ["org_jm"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "YZA567",
        brand: "Honda",
        model: "Wave 110",
        year: 2023,
        insurance: {
          company: "La Caja",
          policyNumber: "POL-345678",
          expiryDate: "2026-06-10"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 534,
      successRate: 0.88,
      averageDeliveryTime: 49,
      rating: 4.3,
      onTimeDeliveryRate: 0.83,
      currentStreak: 24,
      bestStreak: 51,
      failedDeliveries: 73,
      returnedPackages: 19
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.7606,
        lng: -58.4014,
        timestamp: new Date().toISOString(),
        accuracy: 11
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Galicia",
        cbu: "0070345678901234567890",
        alias: "MPARE.COBROS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-06-10T08:00:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Xiaomi Redmi Note 11 Pro",
        os: "Android 13",
        appBuild: "202510151"
      }
    }
  },
  {
    id: "drv_014",
    driverId: "drv_014",
    subLogisticsId: "org_jm",
    type: "driver",
    personalInfo: {
      firstName: "Valeria",
      lastName: "Rojas",
      dni: "38345678",
      birthDate: "1993-01-22",
      email: "vrojas@email.com",
      phone: "+54 11 7890-2345",
      address: {
        street: "Alsina 3456",
        city: "Benavidez",
        state: "Buenos Aires",
        zipCode: "B1621QRS"
      },
      profilePhoto: "https://storage.blob.core.windows.net/drivers/drv_014.jpg"
    },
    employment: {
      status: "active",
      employmentType: "contractor",
      startDate: "2024-06-20",
      endDate: null,
      assignedZones: ["benavidez", "tigre"],
      authorizedSubLogistics: ["org_jm", "org_jj"],
      vehicleType: "motorcycle",
      vehicleInfo: {
        licensePlate: "BCD890",
        brand: "Yamaha",
        model: "YBR 125",
        year: 2022,
        insurance: {
          company: "Seguros Rivadavia",
          policyNumber: "POL-456789",
          expiryDate: "2026-06-20"
        }
      }
    },
    performance: {
      totalPackagesDelivered: 467,
      successRate: 0.94,
      averageDeliveryTime: 41,
      rating: 4.6,
      onTimeDeliveryRate: 0.89,
      currentStreak: 37,
      bestStreak: 62,
      failedDeliveries: 31,
      returnedPackages: 13
    },
    currentStatus: {
      status: "active",
      lastLocation: {
        lat: -34.4159,
        lng: -58.6975,
        timestamp: new Date().toISOString(),
        accuracy: 9
      },
      currentRoute: null,
      packagesInTransit: 0,
      estimatedCompletionTime: null
    },
    financials: {
      bankAccount: {
        bank: "Banco Nación",
        cbu: "0110789012345678901234",
        alias: "VROJA.PAGOS"
      },
      lastSettlement: null,
      pendingAmount: 0
    },
    metadata: {
      createdAt: "2024-06-20T09:30:00Z",
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      appVersion: "2.3.1",
      deviceInfo: {
        model: "Samsung Galaxy S22",
        os: "Android 14",
        appBuild: "202510151"
      }
    }
  }
];

// ========== FUNCIÓN PARA SOLICITAR NOMBRE DE BASE DE DATOS ==========
async function promptDatabaseName() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`Ingrese el nombre de la base de datos (presione Enter para usar "${config.databaseId}"): `, (answer) => {
      rl.close();
      resolve(answer.trim() || config.databaseId);
    });
  });
}

// ========== FUNCIÓN PRINCIPAL ==========
async function seedDatabase(databaseName = null) {
  console.log("====================================================");
  console.log("  CARGA DE INFORMACIÓN ALEATORIA");
  console.log("====================================================\n");

  const dbName = databaseName || config.databaseId;

  // Crear cliente usando DefaultAzureCredential (Azure AD / Managed Identity)
  const credential = new DefaultAzureCredential();
  const client = new CosmosClient({
    endpoint: config.endpoint,
    aadCredentials: credential
  });

  const database = client.database(dbName);

  try {
    // ========== 1. CARGAR ORGANIZACIONES ==========
    console.log("[1/2] Cargando Organizaciones...\n");

    const orgContainer = database.container("ORGANIZATIONS");

    // Root organization
    console.log(`📋 Creando empresa matriz: ${rootOrganization.name}`);
    await orgContainer.items.upsert(rootOrganization);
    console.log(`   ✅ Creada\n`);

    // Sub-organizations
    for (const org of subOrganizations) {
      console.log(`📋 Creando sublogística: ${org.name}`);
      console.log(`   Zonas: ${org.configuration.coverageZones.join(', ')}`);
      console.log(`   Drivers asignados: ${org.stats.totalDrivers}`);

      await orgContainer.items.upsert(org);
      console.log(`   ✅ Creada\n`);
    }

    console.log(`✅ Total organizaciones: ${1 + subOrganizations.length}\n`);

    // ========== 2. CARGAR DRIVERS ==========
    console.log("[2/2] Cargando Repartidores...\n");

    const driverContainer = database.container("DRIVERS");

    let driversByOrg = {
      "org_jj": 0,
      "org_jm": 0
    };

    for (const driver of drivers) {
      console.log(`👤 Creando driver: ${driver.personalInfo.firstName} ${driver.personalInfo.lastName}`);
      console.log(`   Organización: ${driver.subLogisticsId}`);
      console.log(`   Zonas: ${driver.employment.assignedZones.join(', ')}`);
      console.log(`   Vehículo: ${driver.employment.vehicleType}`);

      await driverContainer.items.upsert(driver);
      driversByOrg[driver.subLogisticsId]++;
      console.log(`   ✅ Creado\n`);
    }

    console.log(`✅ Total drivers: ${drivers.length}`);
    console.log(`   - JJ Logística (org_jj): ${driversByOrg["org_jj"]}`);
    console.log(`   - JM Logística (org_jm): ${driversByOrg["org_jm"]}\n`);

    // ========== RESUMEN FINAL ==========
    console.log("====================================================");
    console.log("  RESUMEN DE CARGA");
    console.log("====================================================");
    console.log(`✅ Organizaciones creadas: ${1 + subOrganizations.length}`);
    console.log(`✅ Drivers creados: ${drivers.length}`);
    console.log(`✅ Contenedores utilizados: 2 (ORGANIZATIONS, DRIVERS)`);
    console.log("====================================================\n");

    console.log("Próximos pasos:");
    console.log("  1. Ejecutar: node 3-carga-paquetes-scans.js");
    console.log("  2. Verificar datos en Azure Portal");
    console.log("  3. Probar queries desde el portal\n");

    return {
      success: true,
      organizationsCreated: 1 + subOrganizations.length,
      driversCreated: drivers.length
    };

  } catch (error) {
    console.error("\n❌ ERROR DURANTE LA CARGA:");
    console.error(error);
    throw error;
  }
}

// ========== EJECUCIÓN ==========
if (require.main === module) {
  // Solicitar nombre de base de datos
  promptDatabaseName()
    .then(dbName => {
      console.log(`\n✅ Usando base de datos: ${dbName}\n`);
      return seedDatabase(dbName);
    })
    .then(() => {
      console.log("🎉 Carga completada exitosamente");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  rootOrganization,
  subOrganizations,
  drivers
};
