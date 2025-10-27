# Sistema de Logística - Frontend Web Dashboard
## Especificación Técnica Completa basada en Mars Balanza

---

## 📋 ÍNDICE

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura de Proyecto](#2-estructura-de-proyecto)
3. [Sistema de Diseño y Estilos](#3-sistema-de-diseño-y-estilos)
4. [Componentes Core](#4-componentes-core)
5. [Vistas Principales](#5-vistas-principales)
6. [Gráficos y Visualizaciones](#6-gráficos-y-visualizaciones)
7. [Integración con Backend](#7-integración-con-backend)
8. [Plan de Implementación](#8-plan-de-implementación)

---

## 1. STACK TECNOLÓGICO

### Frontend Framework
```json
{
  "next": "^15.5.3",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5"
}
```

### UI Component Library
```json
{
  "@coreui/react": "^5.7.0",
  "@coreui/react-chartjs": "^3.0.0",
  "@coreui/icons": "^3.0.1",
  "@coreui/icons-react": "^2.3.0",
  "@tabler/core": "^1.0.0-beta20",
  "@tabler/icons-react": "^3.34.0",
  "lucide-react": "^0.469.0"
}
```

### Chart Libraries
```json
{
  "apexcharts": "^4.7.0",
  "react-apexcharts": "^1.7.0",
  "echarts": "^5.6.0",
  "echarts-for-react": "^3.0.2",
  "chart.js": "^4.4.9",
  "react-chartjs-2": "^5.3.0"
}
```

### Styling
```json
{
  "tailwindcss": "^4.0.0",
  "postcss": "^8.4.49",
  "animate.css": "^4.1.1"
}
```

### Animation & Motion
```json
{
  "framer-motion": "^11.11.9"
}
```

### Authentication & API
```json
{
  "next-auth": "^4.24.11",
  "axios": "^1.7.9"
}
```

### Database & ORM (Backend)
```json
{
  "prisma": "^6.16.2",
  "@prisma/client": "^6.16.2"
}
```

### Azure Integration
```json
{
  "@azure/storage-blob": "^12.26.0",
  "@azure/cosmos": "^4.3.0"
}
```

---

## 2. ESTRUCTURA DE PROYECTO

```
logistics-web/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Global styles + CSS variables
│   │   ├── page.tsx                  # Landing/redirect page
│   │   ├── login/
│   │   │   └── page.tsx              # Login page
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Main dashboard
│   │   ├── paquetes/
│   │   │   ├── page.tsx              # Package list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Package detail
│   │   ├── repartidores/
│   │   │   ├── page.tsx              # Driver list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Driver detail
│   │   ├── rutas/
│   │   │   ├── page.tsx              # Route list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Route detail
│   │   ├── liquidaciones/
│   │   │   ├── page.tsx              # Settlements list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Settlement detail
│   │   ├── organizaciones/
│   │   │   ├── page.tsx              # Organization list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Organization detail
│   │   ├── reportes/
│   │   │   └── page.tsx              # Reports & analytics
│   │   ├── configuracion/
│   │   │   └── page.tsx              # Settings
│   │   └── api/                      # API routes
│   │       ├── auth/
│   │       │   ├── [...nextauth]/
│   │       │   │   └── route.ts      # NextAuth endpoints
│   │       │   ├── session/
│   │       │   │   └── route.ts      # Session check
│   │       │   └── logout/
│   │       │       └── route.ts      # Logout
│   │       ├── dashboard/
│   │       │   └── metrics/
│   │       │       └── route.ts      # Dashboard metrics
│   │       ├── packages/
│   │       │   ├── route.ts          # List packages
│   │       │   ├── [id]/
│   │       │   │   └── route.ts      # Get/update package
│   │       │   └── sync/
│   │       │       └── route.ts      # Sync from mobile
│   │       ├── drivers/
│   │       │   ├── route.ts          # List drivers
│   │       │   └── [id]/
│   │       │       └── route.ts      # Get/update driver
│   │       ├── routes/
│   │       │   ├── route.ts          # List routes
│   │       │   └── [id]/
│   │       │       └── route.ts      # Get/update route
│   │       ├── settlements/
│   │       │   ├── route.ts          # List settlements
│   │       │   └── [id]/
│   │       │       └── route.ts      # Get/update settlement
│   │       └── reports/
│   │           └── route.ts          # Generate reports
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx   # Main app layout
│   │   │   ├── Sidebar.tsx           # Left sidebar navigation
│   │   │   ├── Header.tsx            # Top header bar
│   │   │   └── Footer.tsx            # Footer
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx        # KPI metric card
│   │   │   ├── PackageStatusChart.tsx
│   │   │   ├── DeliveryMapView.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── packages/
│   │   │   ├── PackageTable.tsx      # Package data table
│   │   │   ├── PackageCard.tsx       # Package card view
│   │   │   ├── PackageFilters.tsx    # Filter controls
│   │   │   ├── PackageStatusBadge.tsx
│   │   │   └── PackageTimeline.tsx   # Status history
│   │   ├── drivers/
│   │   │   ├── DriverTable.tsx
│   │   │   ├── DriverCard.tsx
│   │   │   ├── DriverPerformanceChart.tsx
│   │   │   └── DriverMap.tsx         # Real-time location
│   │   ├── routes/
│   │   │   ├── RouteTable.tsx
│   │   │   ├── RouteCard.tsx
│   │   │   ├── RouteMap.tsx          # Route visualization
│   │   │   └── RouteOptimizer.tsx
│   │   ├── settlements/
│   │   │   ├── SettlementTable.tsx
│   │   │   ├── SettlementSummary.tsx
│   │   │   └── PaymentBreakdown.tsx
│   │   ├── charts/
│   │   │   ├── ApexLineChart.tsx     # Reusable ApexCharts
│   │   │   ├── ApexBarChart.tsx
│   │   │   ├── ApexPieChart.tsx
│   │   │   ├── EChartsWrapper.tsx    # Reusable ECharts
│   │   │   └── ChartCard.tsx         # Chart container
│   │   ├── ui/
│   │   │   ├── Button.tsx            # Styled button
│   │   │   ├── Card.tsx              # Card container
│   │   │   ├── Badge.tsx             # Status badge
│   │   │   ├── Input.tsx             # Form input
│   │   │   ├── Select.tsx            # Dropdown select
│   │   │   ├── Table.tsx             # Data table
│   │   │   ├── Modal.tsx             # Modal dialog
│   │   │   ├── Tabs.tsx              # Tab navigation
│   │   │   ├── Pagination.tsx        # Page controls
│   │   │   └── LoadingSpinner.tsx
│   │   └── forms/
│   │       ├── PackageForm.tsx
│   │       ├── DriverForm.tsx
│   │       └── RouteForm.tsx
│   ├── lib/
│   │   ├── cosmos-client.ts          # Cosmos DB client
│   │   ├── blob-storage.ts           # Azure Blob Storage
│   │   ├── api-client.ts             # API helper
│   │   └── utils.ts                  # Utility functions
│   ├── types/
│   │   ├── index.ts                  # Type definitions
│   │   ├── package.ts
│   │   ├── driver.ts
│   │   ├── route.ts
│   │   └── settlement.ts
│   └── styles/
│       └── theme.css                 # Theme overrides
├── public/
│   ├── images/
│   └── icons/
├── prisma/
│   └── schema.prisma                 # Database schema (if using SQL)
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. SISTEMA DE DISEÑO Y ESTILOS

### 3.1 Paleta de Colores

**Archivo: `src/app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Colores Corporativos - Logística */
  --primary: #E31E24;              /* Rojo corporativo */
  --primary-dark: #C4161B;
  --primary-light: #FF4D51;
  --secondary: #003DA5;            /* Azul corporativo */
  --secondary-dark: #002D7A;
  --secondary-light: #1256C4;
  --accent: #003DA5;

  /* Colores de Estado */
  --success: #10b981;              /* Verde - Entregado */
  --warning: #f59e0b;              /* Amarillo - En tránsito */
  --error: #ef4444;                /* Rojo - Error/Devolución */
  --info: #3b82f6;                 /* Azul - Información */

  /* Colores de Estado de Paquetes */
  --status-pending: #94a3b8;       /* Gris - Pendiente */
  --status-picked: #3b82f6;        /* Azul - Recogido */
  --status-in-transit: #f59e0b;    /* Amarillo - En tránsito */
  --status-delivered: #10b981;     /* Verde - Entregado */
  --status-failed: #ef4444;        /* Rojo - Fallido */
  --status-returned: #8b5cf6;      /* Púrpura - Devuelto */

  /* Escala de Grises */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Espaciado */
  --radius: 0.375rem;
  --radius-lg: 0.75rem;

  /* Sombras Modernas */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

  /* Z-Index controlado */
  --z-base: 1;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-fixed: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-tooltip: 70;
}

/* Tipografía Base */
html {
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--gray-900);
  background-color: var(--gray-50);
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; }
h4 { font-size: 1.25rem; }
h5 { font-size: 1.125rem; }
h6 { font-size: 1rem; }
```

### 3.2 Componentes de Tarjeta (Metric Cards)

```css
/* Modern Metric Cards */
.metric-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.metric-icon.packages {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.metric-icon.deliveries {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.metric-icon.drivers {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.metric-icon.revenue {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 500;
}
```

### 3.3 Status Badges

```css
/* Status Badges para Paquetes */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-pending {
  background: var(--status-pending);
  color: white;
}

.badge-picked {
  background: var(--status-picked);
  color: white;
}

.badge-in-transit {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.badge-delivered {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.badge-failed {
  background: var(--status-failed);
  color: white;
}

.badge-returned {
  background: var(--status-returned);
  color: white;
}
```

### 3.4 Animaciones

```css
/* Loading Skeleton */
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Slide In Animation */
.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse Animation for Status Indicators */
.status-indicator-online {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  position: relative;
}

.status-indicator-online::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: var(--success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
```

---

## 4. COMPONENTES CORE

### 4.1 DashboardLayout Component

**Archivo: `src/components/layout/DashboardLayout.tsx`**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { IconBell, IconMenu2, IconX, IconUser } from '@tabler/icons-react';
import '@tabler/core/dist/css/tabler.min.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>('Usuario');
  const [userRole, setUserRole] = useState<string>('');
  const [notifications, setNotifications] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserName(data.user.name || 'Usuario');
            setUserRole(data.user.role || '');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.push('/login');
      }
    };

    fetchUserInfo();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main Content */}
      <div
        className="flex-fill d-flex flex-column"
        style={{
          marginLeft: sidebarOpen ? '280px' : '0',
          transition: 'margin-left 0.3s ease'
        }}
      >
        {/* Header */}
        <header
          className="navbar navbar-expand-md d-print-none"
          style={{
            backgroundColor: '#1F2937',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}
        >
          <div className="container-fluid">
            <button
              className="btn btn-link text-white p-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
            </button>

            <div className="navbar-brand mx-auto text-white">
              Sistema de Logística
            </div>

            <div className="navbar-nav flex-row order-md-last">
              {/* Notifications */}
              <div className="nav-item dropdown">
                <a
                  className="nav-link px-3 text-white position-relative"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <IconBell size={20} />
                  {notifications > 0 && (
                    <span className="badge bg-danger badge-notification badge-pill">
                      {notifications}
                    </span>
                  )}
                </a>
              </div>

              {/* User Menu */}
              <div className="nav-item dropdown">
                <a
                  className="nav-link d-flex align-items-center text-white"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                >
                  <IconUser size={20} className="me-2" />
                  <span className="d-none d-md-block">{userName}</span>
                </a>
                {userMenuOpen && (
                  <div className="dropdown-menu dropdown-menu-end show">
                    <a className="dropdown-item" href="/configuracion">
                      Configuración
                    </a>
                    <div className="dropdown-divider"></div>
                    <a
                      className="dropdown-item text-danger"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      Cerrar Sesión
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-fill" style={{ backgroundColor: 'var(--gray-50)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
```

### 4.2 Sidebar Component

**Archivo: `src/components/layout/Sidebar.tsx`**

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconHome,
  IconPackage,
  IconTruck,
  IconRoute,
  IconCash,
  IconBuilding,
  IconChartBar,
  IconSettings,
  IconUser
} from '@tabler/icons-react';

interface SidebarProps {
  isOpen?: boolean;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.role || '');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <IconHome size={20} />,
      roles: ['admin', 'manager', 'supervisor', 'operator']
    },
    {
      title: 'Paquetes',
      href: '/paquetes',
      icon: <IconPackage size={20} />,
      roles: ['admin', 'manager', 'supervisor', 'operator']
    },
    {
      title: 'Repartidores',
      href: '/repartidores',
      icon: <IconTruck size={20} />,
      roles: ['admin', 'manager', 'supervisor']
    },
    {
      title: 'Rutas',
      href: '/rutas',
      icon: <IconRoute size={20} />,
      roles: ['admin', 'manager', 'supervisor']
    },
    {
      title: 'Liquidaciones',
      href: '/liquidaciones',
      icon: <IconCash size={20} />,
      roles: ['admin', 'manager']
    },
    {
      title: 'Organizaciones',
      href: '/organizaciones',
      icon: <IconBuilding size={20} />,
      roles: ['admin']
    },
    {
      title: 'Reportes',
      href: '/reportes',
      icon: <IconChartBar size={20} />,
      roles: ['admin', 'manager', 'supervisor']
    },
    {
      title: 'Configuración',
      href: '/configuracion',
      icon: <IconSettings size={20} />,
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(userRole)
  );

  if (!isOpen) return null;

  return (
    <aside
      className="navbar navbar-vertical navbar-expand-lg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '280px',
        backgroundColor: 'white',
        borderRight: '1px solid var(--gray-200)',
        zIndex: 1030,
        overflowY: 'auto'
      }}
    >
      <div className="container-fluid">
        {/* Logo */}
        <div className="navbar-brand py-4 text-center" style={{ width: '100%' }}>
          <h2 className="text-primary mb-0">🚚 Logística</h2>
        </div>

        {/* Navigation Menu */}
        <div className="navbar-collapse">
          <ul className="navbar-nav pt-lg-3" style={{ width: '100%' }}>
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li className="nav-item" key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-link d-flex align-items-center ${
                      isActive ? 'bg-primary text-white' : ''
                    }`}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.375rem',
                      margin: '0.125rem 0',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span className="nav-link-icon d-md-none d-lg-inline-block me-2">
                      {item.icon}
                    </span>
                    <span className="nav-link-title">{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
```

### 4.3 MetricCard Component

**Archivo: `src/components/dashboard/MetricCard.tsx`**

```typescript
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconType?: 'packages' | 'deliveries' | 'drivers' | 'revenue';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  iconType = 'packages',
  trend = 'neutral',
  subtitle,
  className = '',
}) => {
  const trendColor =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
        ? 'text-error'
        : 'text-gray-500';

  const trendIcon =
    trend === 'up'
      ? '↑'
      : trend === 'down'
        ? '↓'
        : '→';

  return (
    <div className={`metric-card ${className}`}>
      <div className={`metric-icon ${iconType}`}>
        {icon}
      </div>
      <div>
        <p className="metric-value">{value}</p>
        <p className="metric-label">{title}</p>

        {(change !== undefined || subtitle) && (
          <div className="mt-2">
            {change !== undefined && (
              <span className={`inline-flex items-center text-sm ${trendColor}`}>
                <span className="mr-1">{trendIcon}</span>
                <span>{Math.abs(change)}%</span>
              </span>
            )}
            {subtitle && (
              <span className="text-sm text-gray-500 ml-2">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
```

---

## 5. VISTAS PRINCIPALES

### 5.1 Dashboard Principal

**Archivo: `src/app/dashboard/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import dynamic from 'next/dynamic';
import {
  IconPackage,
  IconTruck,
  IconMapPin,
  IconCash,
  IconClock,
  IconAlertCircle
} from '@tabler/icons-react';

// Dynamic import for charts (avoid SSR issues)
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
});

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentPackages, setRecentPackages] = useState<any[]>([]);

  useEffect(() => {
    // Verify session
    fetch('/api/auth/session', {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('No autenticado');
        return res.json();
      })
      .then(data => {
        if (data.user) {
          setUser(data.user);
          fetchDashboardData();
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard/metrics', {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Error al cargar datos');

      const data = await res.json();
      setMetrics(data.metrics);
      setRecentPackages(data.recentPackages || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container-fluid p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container-fluid p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Bienvenido, {user?.name} | {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Paquetes en Tránsito"
            value={metrics?.packagesInTransit || 0}
            icon={<IconPackage size={24} />}
            iconType="packages"
            change={5.2}
            trend="up"
          />

          <MetricCard
            title="Entregas Hoy"
            value={metrics?.deliveriesToday || 0}
            icon={<IconMapPin size={24} />}
            iconType="deliveries"
            change={12.5}
            trend="up"
          />

          <MetricCard
            title="Repartidores Activos"
            value={metrics?.activeDrivers || 0}
            icon={<IconTruck size={24} />}
            iconType="drivers"
            subtitle={`de ${metrics?.totalDrivers || 0} total`}
          />

          <MetricCard
            title="Ingresos del Mes"
            value={`$${(metrics?.monthlyRevenue || 0).toLocaleString()}`}
            icon={<IconCash size={24} />}
            iconType="revenue"
            change={8.3}
            trend="up"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Package Status Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Estado de Paquetes</h3>
            </div>
            <div className="card-body">
              <ReactECharts
                option={{
                  tooltip: { trigger: 'item' },
                  legend: { bottom: 0 },
                  series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: [
                      { value: metrics?.statusBreakdown?.pending || 0, name: 'Pendientes' },
                      { value: metrics?.statusBreakdown?.inTransit || 0, name: 'En Tránsito' },
                      { value: metrics?.statusBreakdown?.delivered || 0, name: 'Entregados' },
                      { value: metrics?.statusBreakdown?.failed || 0, name: 'Fallidos' }
                    ],
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                    }
                  }],
                  color: ['#94a3b8', '#f59e0b', '#10b981', '#ef4444']
                }}
                style={{ height: '300px' }}
              />
            </div>
          </div>

          {/* Deliveries by Zone Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Entregas por Zona</h3>
            </div>
            <div className="card-body">
              <ReactApexChart
                type="bar"
                height={300}
                options={{
                  chart: {
                    toolbar: { show: false }
                  },
                  plotOptions: {
                    bar: {
                      horizontal: true,
                      borderRadius: 4
                    }
                  },
                  xaxis: {
                    categories: metrics?.zoneData?.map((z: any) => z.zoneName) || []
                  },
                  colors: ['#3b82f6']
                }}
                series={[{
                  name: 'Entregas',
                  data: metrics?.zoneData?.map((z: any) => z.count) || []
                }]}
              />
            </div>
          </div>
        </div>

        {/* Recent Packages Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Paquetes Recientes</h3>
            <div className="card-actions">
              <a href="/paquetes" className="btn btn-primary btn-sm">
                Ver Todos
              </a>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-vcenter">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Destinatario</th>
                    <th>Zona</th>
                    <th>Repartidor</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPackages.map((pkg: any) => (
                    <tr key={pkg.packageId}>
                      <td>{pkg.trackingNumber}</td>
                      <td>{pkg.destination?.recipient?.name}</td>
                      <td>
                        <span className="badge bg-blue-lt">
                          {pkg.zoneId?.toUpperCase()}
                        </span>
                      </td>
                      <td>{pkg.assignedDriver || 'Sin asignar'}</td>
                      <td>
                        <span className={`badge badge-${getStatusColor(pkg.status?.current)}`}>
                          {getStatusLabel(pkg.status?.current)}
                        </span>
                      </td>
                      <td>{new Date(pkg.createdAt).toLocaleDateString('es-ES')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'pending': 'secondary',
    'picked_up': 'info',
    'in_transit': 'warning',
    'delivered': 'success',
    'failed': 'danger',
    'returned': 'purple'
  };
  return colors[status] || 'secondary';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'Pendiente',
    'picked_up': 'Recogido',
    'in_transit': 'En Tránsito',
    'delivered': 'Entregado',
    'failed': 'Fallido',
    'returned': 'Devuelto'
  };
  return labels[status] || status;
}
```

### 5.2 Lista de Paquetes

**Archivo: `src/app/paquetes/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  IconPackage,
  IconSearch,
  IconFilter,
  IconDownload,
  IconPlus
} from '@tabler/icons-react';

export default function PaquetesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  useEffect(() => {
    fetchPackages();
  }, [statusFilter, zoneFilter]);

  const fetchPackages = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (zoneFilter !== 'all') params.append('zone', zoneFilter);

      const res = await fetch(`/api/packages?${params.toString()}`, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Error al cargar paquetes');

      const data = await res.json();
      setPackages(data.packages || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      pkg.trackingNumber?.toLowerCase().includes(search) ||
      pkg.destination?.recipient?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="container-fluid p-6">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <IconPackage size={32} className="inline mr-2" />
              Paquetes
            </h1>
            <p className="text-gray-600">
              Gestión de todos los paquetes del sistema
            </p>
          </div>
          <button className="btn btn-primary">
            <IconPlus size={20} className="mr-2" />
            Nuevo Paquete
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text">
                    <IconSearch size={20} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por ID o destinatario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="in_transit">En Tránsito</option>
                  <option value="delivered">Entregados</option>
                  <option value="failed">Fallidos</option>
                </select>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                >
                  <option value="all">Todas las zonas</option>
                  <option value="caba">CABA</option>
                  <option value="gba_norte">GBA Norte</option>
                  <option value="gba_sur">GBA Sur</option>
                  <option value="gba_oeste">GBA Oeste</option>
                </select>
              </div>

              <div className="col-md-2">
                <button className="btn btn-outline-primary w-100">
                  <IconDownload size={20} className="mr-2" />
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Table */}
        <div className="card">
          <div className="table-responsive">
            <table className="table table-vcenter card-table">
              <thead>
                <tr>
                  <th>Tracking</th>
                  <th>Destinatario</th>
                  <th>Dirección</th>
                  <th>Zona</th>
                  <th>Repartidor</th>
                  <th>Estado</th>
                  <th>Valor</th>
                  <th>Fecha</th>
                  <th className="w-1"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No se encontraron paquetes
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg) => (
                    <tr key={pkg.packageId}>
                      <td>
                        <span className="font-monospace text-primary">
                          {pkg.trackingNumber}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="font-weight-medium">
                            {pkg.destination?.recipient?.name}
                          </span>
                          <span className="text-muted text-sm">
                            {pkg.destination?.recipient?.phone}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted">
                        {pkg.destination?.address?.street}
                      </td>
                      <td>
                        <span className="badge bg-blue-lt">
                          {pkg.zoneId?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {pkg.assignedDriver || (
                          <span className="text-muted">Sin asignar</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusColor(pkg.status?.current)}`}>
                          {getStatusLabel(pkg.status?.current)}
                        </span>
                      </td>
                      <td>
                        ${pkg.packageDetails?.declaredValue?.toLocaleString()}
                      </td>
                      <td className="text-muted">
                        {new Date(pkg.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td>
                        <a
                          href={`/paquetes/${pkg.packageId}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Ver
                        </a>
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

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'pending': 'secondary',
    'picked_up': 'info',
    'in_transit': 'warning',
    'delivered': 'success',
    'failed': 'danger',
    'returned': 'purple'
  };
  return colors[status] || 'secondary';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'Pendiente',
    'picked_up': 'Recogido',
    'in_transit': 'En Tránsito',
    'delivered': 'Entregado',
    'failed': 'Fallido',
    'returned': 'Devuelto'
  };
  return labels[status] || status;
}
```

---

## 6. GRÁFICOS Y VISUALIZACIONES

### 6.1 ApexCharts - Line Chart Component

**Archivo: `src/components/charts/ApexLineChart.tsx`**

```typescript
'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface ApexLineChartProps {
  series: Array<{
    name: string;
    data: number[];
  }>;
  categories: string[];
  title?: string;
  height?: number;
  colors?: string[];
  curved?: boolean;
  showDataLabels?: boolean;
}

export const ApexLineChart: React.FC<ApexLineChartProps> = ({
  series,
  categories,
  title,
  height = 350,
  colors = ['#3b82f6', '#10b981', '#f59e0b'],
  curved = true,
  showDataLabels = false
}) => {
  const options: any = {
    chart: {
      type: 'line',
      height: height,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false
        }
      },
      fontFamily: 'Inter, sans-serif'
    },
    colors: colors,
    dataLabels: {
      enabled: showDataLabels
    },
    stroke: {
      curve: curved ? 'smooth' : 'straight',
      width: 3
    },
    title: title ? {
      text: title,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#111827'
      }
    } : undefined,
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 3
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px'
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: '#6b7280'
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: function (val: number) {
          return val.toFixed(0);
        }
      }
    }
  };

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="line"
      height={height}
    />
  );
};

export default ApexLineChart;
```

### 6.2 ECharts - Pie/Donut Chart Component

**Archivo: `src/components/charts/EChartsPieChart.tsx`**

```typescript
'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
});

interface EChartsPieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
  donut?: boolean;
  height?: number;
  colors?: string[];
}

export const EChartsPieChart: React.FC<EChartsPieChartProps> = ({
  data,
  title,
  donut = false,
  height = 350,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
}) => {
  const option = {
    title: title ? {
      text: title,
      left: 'left',
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#111827',
        fontFamily: 'Inter, sans-serif'
      }
    } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 0,
      left: 'center',
      textStyle: {
        color: '#6b7280',
        fontFamily: 'Inter, sans-serif'
      }
    },
    color: colors,
    series: [{
      type: 'pie',
      radius: donut ? ['40%', '70%'] : '70%',
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {d}%',
        color: '#374151',
        fontFamily: 'Inter, sans-serif'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      labelLine: {
        show: true
      },
      data: data
    }]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
};

export default EChartsPieChart;
```

### 6.3 Gráfico de Barras Horizontal con ApexCharts

```typescript
'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
});

interface ApexBarChartProps {
  series: Array<{
    name: string;
    data: number[];
  }>;
  categories: string[];
  title?: string;
  height?: number;
  horizontal?: boolean;
  stacked?: boolean;
  colors?: string[];
}

export const ApexBarChart: React.FC<ApexBarChartProps> = ({
  series,
  categories,
  title,
  height = 350,
  horizontal = false,
  stacked = false,
  colors = ['#3b82f6']
}) => {
  const options: any = {
    chart: {
      type: 'bar',
      height: height,
      stacked: stacked,
      toolbar: {
        show: true
      },
      fontFamily: 'Inter, sans-serif'
    },
    plotOptions: {
      bar: {
        horizontal: horizontal,
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: colors,
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 3
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: '#6b7280'
      }
    },
    tooltip: {
      theme: 'light'
    },
    title: title ? {
      text: title,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#111827'
      }
    } : undefined
  };

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="bar"
      height={height}
    />
  );
};

export default ApexBarChart;
```

---

## 7. INTEGRACIÓN CON BACKEND

### 7.1 Cosmos DB Client

**Archivo: `src/lib/cosmos-client.ts`**

```typescript
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT!;
const key = process.env.COSMOS_KEY!;
const databaseId = process.env.COSMOS_DATABASE_ID || 'LogisticsDB';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

export const containers = {
  packages: database.container('Packages'),
  drivers: database.container('Drivers'),
  routes: database.container('Routes'),
  settlements: database.container('Settlements'),
  transactions: database.container('Transactions'),
  organizations: database.container('Organizations'),
  scans: database.container('Scans'),
  analytics: database.container('Analytics')
};

export { client, database };
```

### 7.2 API Route - Dashboard Metrics

**Archivo: `src/app/api/dashboard/metrics/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-client';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user?.organizationId;

    // Query packages by status
    const packagesQuery = `
      SELECT
        c.status.current as status,
        COUNT(1) as count
      FROM c
      WHERE c.organizationId = @orgId
        AND c.createdAt >= @startDate
      GROUP BY c.status.current
    `;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { resources: statusBreakdown } = await containers.packages.items
      .query({
        query: packagesQuery,
        parameters: [
          { name: '@orgId', value: organizationId },
          { name: '@startDate', value: startDate.toISOString() }
        ]
      })
      .fetchAll();

    // Get active drivers
    const driversQuery = `
      SELECT COUNT(1) as total
      FROM c
      WHERE c.organizationId = @orgId
        AND c.status = 'active'
    `;

    const { resources: driverCount } = await containers.drivers.items
      .query({
        query: driversQuery,
        parameters: [{ name: '@orgId', value: organizationId }]
      })
      .fetchAll();

    // Get zone delivery counts
    const zoneQuery = `
      SELECT
        c.zoneId as zoneName,
        COUNT(1) as count
      FROM c
      WHERE c.organizationId = @orgId
        AND c.status.current = 'delivered'
        AND c.status.timestamp >= @startDate
      GROUP BY c.zoneId
    `;

    const { resources: zoneData } = await containers.packages.items
      .query({
        query: zoneQuery,
        parameters: [
          { name: '@orgId', value: organizationId },
          { name: '@startDate', value: startDate.toISOString() }
        ]
      })
      .fetchAll();

    // Calculate metrics
    const metrics = {
      packagesInTransit: statusBreakdown.find(s => s.status === 'in_transit')?.count || 0,
      deliveriesToday: statusBreakdown.find(s => s.status === 'delivered')?.count || 0,
      activeDrivers: driverCount[0]?.total || 0,
      totalDrivers: driverCount[0]?.total || 0,
      monthlyRevenue: 0, // Calculate from transactions
      statusBreakdown: {
        pending: statusBreakdown.find(s => s.status === 'pending')?.count || 0,
        inTransit: statusBreakdown.find(s => s.status === 'in_transit')?.count || 0,
        delivered: statusBreakdown.find(s => s.status === 'delivered')?.count || 0,
        failed: statusBreakdown.find(s => s.status === 'failed')?.count || 0
      },
      zoneData: zoneData
    };

    // Get recent packages
    const recentQuery = `
      SELECT TOP 10 *
      FROM c
      WHERE c.organizationId = @orgId
      ORDER BY c.createdAt DESC
    `;

    const { resources: recentPackages } = await containers.packages.items
      .query({
        query: recentQuery,
        parameters: [{ name: '@orgId', value: organizationId }]
      })
      .fetchAll();

    return NextResponse.json({
      metrics,
      recentPackages
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 7.3 API Route - List Packages

**Archivo: `src/app/api/packages/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-client';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const zone = searchParams.get('zone');
    const organizationId = session.user?.organizationId;

    let querySpec = {
      query: `
        SELECT *
        FROM c
        WHERE c.organizationId = @orgId
        ${status && status !== 'all' ? 'AND c.status.current = @status' : ''}
        ${zone && zone !== 'all' ? 'AND c.zoneId = @zone' : ''}
        ORDER BY c.createdAt DESC
      `,
      parameters: [
        { name: '@orgId', value: organizationId }
      ] as any[]
    };

    if (status && status !== 'all') {
      querySpec.parameters.push({ name: '@status', value: status });
    }

    if (zone && zone !== 'all') {
      querySpec.parameters.push({ name: '@zone', value: zone });
    }

    const { resources: packages } = await containers.packages.items
      .query(querySpec)
      .fetchAll();

    return NextResponse.json({ packages });

  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const organizationId = session.user?.organizationId;

    const newPackage = {
      id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      packageId: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId: organizationId,
      ...body,
      status: {
        current: 'pending',
        timestamp: new Date().toISOString(),
        updatedBy: session.user?.id
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource: created } = await containers.packages.items.create(newPackage);

    return NextResponse.json({ package: created }, { status: 201 });

  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 8. PLAN DE IMPLEMENTACIÓN

### Semana 1-2: Configuración y Setup
- [ ] Crear proyecto Next.js 15 con TypeScript
- [ ] Instalar todas las dependencias (CoreUI, Tabler, ApexCharts, ECharts)
- [ ] Configurar Tailwind CSS 4.x
- [ ] Configurar variables de entorno (.env.local)
- [ ] Configurar NextAuth para autenticación
- [ ] Setup Cosmos DB client y conexiones
- [ ] Crear estructura de carpetas completa

### Semana 3-4: Componentes Base y Layout
- [ ] Implementar sistema de colores y CSS variables en globals.css
- [ ] Crear DashboardLayout con sidebar y header
- [ ] Implementar Sidebar con navegación
- [ ] Crear componentes UI base (Button, Card, Badge, Input, Table)
- [ ] Implementar MetricCard component
- [ ] Crear componentes de gráficos reutilizables (ApexLineChart, EChartsPieChart, ApexBarChart)
- [ ] Implementar sistema de animaciones (loading, slideIn, pulse)

### Semana 5-6: Dashboard Principal
- [ ] Crear página de Dashboard (/dashboard)
- [ ] Implementar API route para métricas del dashboard
- [ ] Crear tarjetas de métricas (Paquetes, Entregas, Repartidores, Ingresos)
- [ ] Implementar gráfico de estado de paquetes (Pie/Donut con ECharts)
- [ ] Implementar gráfico de entregas por zona (Bar Chart con ApexCharts)
- [ ] Crear tabla de paquetes recientes
- [ ] Implementar actualización automática de datos (polling cada 30s)

### Semana 7-8: Gestión de Paquetes
- [ ] Crear página de lista de paquetes (/paquetes)
- [ ] Implementar API routes (GET, POST, PUT, DELETE)
- [ ] Crear filtros avanzados (búsqueda, estado, zona)
- [ ] Implementar tabla con paginación
- [ ] Crear página de detalle de paquete (/paquetes/[id])
- [ ] Implementar timeline de estados
- [ ] Crear formulario de creación/edición de paquetes
- [ ] Implementar vista de foto del receptor y prueba de entrega

### Semana 9-10: Gestión de Repartidores y Rutas
- [ ] Crear página de lista de repartidores (/repartidores)
- [ ] Implementar API routes para drivers
- [ ] Crear página de detalle de repartidor con performance
- [ ] Implementar mapa de ubicación en tiempo real
- [ ] Crear página de lista de rutas (/rutas)
- [ ] Implementar API routes para routes
- [ ] Crear visualización de ruta en mapa
- [ ] Implementar optimizador de rutas

### Semana 11-12: Liquidaciones y Reportes
- [ ] Crear página de liquidaciones (/liquidaciones)
- [ ] Implementar API routes para settlements
- [ ] Crear desglose de pagos por repartidor
- [ ] Implementar generación de PDF de liquidaciones
- [ ] Crear página de reportes (/reportes)
- [ ] Implementar gráficos de rendimiento (línea de tiempo, comparativas)
- [ ] Crear exportación a Excel
- [ ] Implementar filtros por fecha y organización

### Semana 13-14: Organizaciones y Configuración
- [ ] Crear página de organizaciones (/organizaciones)
- [ ] Implementar árbol jerárquico (matriz → sublogísticas)
- [ ] Crear página de configuración (/configuracion)
- [ ] Implementar gestión de usuarios y permisos
- [ ] Crear configuración de zonas y tarifas
- [ ] Implementar personalización de logo y colores

### Semana 15-16: Integración Mobile y Testing
- [ ] Implementar API de sincronización con app Android
- [ ] Crear endpoint para subida de fotos a Azure Blob Storage
- [ ] Implementar endpoint de descarga de paquetes asignados
- [ ] Crear endpoint de actualización de estado de paquetes
- [ ] Testing de integración frontend-backend
- [ ] Testing de autenticación y autorización
- [ ] Testing de responsive design
- [ ] Optimización de performance

### Semana 17-18: Notificaciones y Real-time
- [ ] Implementar sistema de notificaciones push
- [ ] Crear centro de notificaciones en header
- [ ] Implementar WebSockets para actualizaciones en tiempo real
- [ ] Crear alertas de paquetes con problemas
- [ ] Implementar notificaciones de liquidaciones pendientes

### Semana 19-20: Deployment y Documentación
- [ ] Configurar Azure App Service para deployment
- [ ] Setup CI/CD con GitHub Actions o Azure DevOps
- [ ] Crear documentación de usuario
- [ ] Crear documentación técnica de APIs
- [ ] Realizar testing de seguridad
- [ ] Optimizar bundle size y lazy loading
- [ ] Deploy a producción
- [ ] Capacitación de usuarios

---

## 9. VARIABLES DE ENTORNO

**Archivo: `.env.local`**

```bash
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secret_muy_seguro_aqui

# Azure Cosmos DB
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=tu_cosmos_key_aqui
COSMOS_DATABASE_ID=LogisticsDB

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=yourstorageaccount
AZURE_STORAGE_ACCOUNT_KEY=your_storage_key
AZURE_STORAGE_CONTAINER_NAME=logistics-images

# Azure Functions (si aplica)
AZURE_FUNCTIONS_URL=https://your-function-app.azurewebsites.net
```

---

## 10. CONFIGURACIÓN DE TAILWIND

**Archivo: `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        'primary-light': 'var(--primary-light)',
        secondary: 'var(--secondary)',
        'secondary-dark': 'var(--secondary-dark)',
        'secondary-light': 'var(--secondary-light)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      }
    },
  },
  plugins: [],
};

export default config;
```

---

## 11. NOTAS FINALES

### Librerías Clave Utilizadas (Coherente con mars-balanza-web)

1. **CoreUI React 5.7.0**: Componentes UI profesionales (cards, tables, forms, badges)
2. **Tabler Icons React 3.34.0**: Iconografía moderna y consistente
3. **ApexCharts 4.7.0**: Gráficos interactivos de línea, barra, área
4. **ECharts 5.6.0**: Gráficos avanzados (pie, donut, scatter, radar, funnel, gauge)
5. **Chart.js 4.4.9**: Alternativa ligera para gráficos simples
6. **Framer Motion 11.11.9**: Animaciones fluidas y transiciones
7. **Animate.css 4.1.1**: Animaciones CSS predefinidas
8. **Tailwind CSS 4.x**: Utility-first styling con variables CSS

### Paleta de Colores Mantenida

- **Rojo Corporativo (#E31E24)**: Color principal de marca
- **Azul Corporativo (#003DA5)**: Color secundario
- **Verde (#10b981)**: Estados exitosos (entregas)
- **Amarillo (#f59e0b)**: Estados en proceso (tránsito)
- **Rojo (#ef4444)**: Estados de error (fallidos)

### Patrones de Diseño Aplicados

1. **Metric Cards con gradientes**: Similar a mars-balanza-web
2. **Status badges con colores semánticos**
3. **Tablas responsivas con CoreUI**
4. **Sidebar fijo con navegación colapsable**
5. **Header sticky con notificaciones**
6. **Animaciones suaves con Framer Motion y Animate.css**
7. **Loading skeletons durante carga de datos**
8. **Charts interactivos con toolbar y tooltips**

---

**FIN DEL DOCUMENTO**

Este prompt mantiene la coherencia total con el stack tecnológico de mars-balanza-web, utilizando las mismas librerías de UI (CoreUI, Tabler), gráficos (ApexCharts, ECharts), animaciones (Framer Motion, Animate.css) y estilos (Tailwind CSS con variables CSS). El sistema de diseño replica los colores corporativos, tipografía (Inter), sombras modernas y patrones de componentes observados en el proyecto original.
