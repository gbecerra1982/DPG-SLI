# 📋 CUESTIONARIO DE VALIDACIÓN PARA PRODUCT OWNER
## Sistema de Logística Multi-Nivel con App Android y Dashboard Web

**Fecha de creación**: 27 de Octubre 2025
**Propósito**: Validar los 4 documentos técnicos y requisitos funcionales antes de la implementación
**Documentos analizados**:
1. COSMOS_DB_LOGISTICS_MODEL_PROMPT.md
2. ANDROID_SYNC_ARCHITECTURE.md
3. LOGISTICS_FRONTEND_PROMPT.md
4. ZONE_ROUTING_LOGIC.md

---

## 📊 RESUMEN EJECUTIVO DEL SISTEMA

### Componentes Principales
1. **App Android Offline-First** para repartidores
2. **Dashboard Web** para administración y monitoreo
3. **Base de Datos Cosmos DB** (NoSQL) con 8 contenedores
4. **Azure Blob Storage** para imágenes
5. **OCR con Phi4 Multimodal** para escaneo de etiquetas
6. **Sistema de Enrutamiento Geográfico** automático por zonas

### Actores del Sistema
- **Empresa Matriz**: Coordina todas las operaciones
- **Sublogísticas** (Internas): Cangallo, Defilippi, etc.
- **Repartidores**: Usan app Android
- **Administradores/Supervisores**: Usan dashboard web
- **Clientes/Destinatarios**: Reciben paquetes

---

## 🎯 SECCIÓN 1: MODELO DE NEGOCIO Y ESTRUCTURA ORGANIZACIONAL

### 1.1 Jerarquía de Organizaciones

**P1.1**: ¿Confirma que existe una **empresa matriz** que coordina múltiples **sublogísticas**?
- [ ] Sí
- [ ] No
- **Si No**: ¿Cuál es la estructura correcta?

**P1.2**: Las sublogísticas pueden ser:
- [ ] **Internas** (propias, como Cangallo y Defilippi)
- [ ] **Tercerizadas** (externas que proveen datos)
- [ ] Ambas

**P1.3**: Cada sublogística opera en **zonas geográficas específicas**. Ejemplo:
- Cangallo → CABA, Palermo, Recoleta, Belgrano
- Defilippi → Ramos Mejía, Benavidez, GBA Oeste

¿Es correcto este modelo?
- [ ] Sí
- [ ] No
- **Si No**: ¿Cómo se distribuyen las zonas?

**P1.4**: ¿Puede una **misma zona** estar cubierta por **múltiples sublogísticas** (overlapping)?
- [ ] Sí, y se asigna manualmente
- [ ] Sí, y hay un algoritmo de prioridad
- [ ] No, cada zona pertenece a UNA sola sublogística
- **Comentarios**:

---

## 📦 SECCIÓN 2: GESTIÓN DE PAQUETES Y ENRUTAMIENTO

### 2.1 Flujo de Ingreso de Paquetes

**P2.1**: ¿Cómo ingresan los paquetes al sistema?
- [ ] Escaneo manual con app Android (OCR)
- [ ] Carga masiva desde CSV/Excel
- [ ] API de e-commerce (MercadoLibre, Tienda Nube, etc.)
- [ ] Ingreso manual en dashboard web
- [ ] Todos los anteriores

**P2.2**: Cuando se escanea una etiqueta con la **app Android**, ¿qué datos se extraen automáticamente con OCR?
- [ ] Nombre del destinatario
- [ ] Teléfono
- [ ] Dirección completa
- [ ] DNI
- [ ] Valor declarado del paquete
- [ ] Descripción del contenido
- **Comentarios adicionales**:

**P2.3**: Si el OCR no puede leer algún campo (confianza < umbral), ¿qué ocurre?
- [ ] El repartidor debe corregir manualmente en la app
- [ ] Se marca para revisión posterior en el dashboard
- [ ] Se rechaza el paquete
- **Comentarios**:

### 2.2 Asignación Automática por Zona

**P2.4**: El sistema asigna **automáticamente** cada paquete a una sublogística basándose en la **dirección de destino**. ¿Es correcto?
- [ ] Sí
- [ ] No, la asignación es manual
- **Si Sí**: ¿Qué ocurre si la dirección no tiene cobertura en ninguna sublogística?
  - [ ] Se rechaza el paquete
  - [ ] Se asigna a una sublogística por defecto
  - [ ] Se marca para asignación manual
  - [ ] Otro: _______________

**P2.5**: Ejemplos de asignación (validar si son correctos):
- **Dirección**: Nazca 3733, CABA → **Asignado a**: Logística Cangallo
- **Dirección**: Argentina 97, Ramos Mejía → **Asignado a**: Logística Defilippi

¿Son correctos estos ejemplos?
- [ ] Sí
- [ ] No
- **Si No**: ¿Cuál es la asignación correcta?

**P2.6**: ¿Se pueden reasignar paquetes **después** de haber sido asignados a una sublogística?
- [ ] Sí, en cualquier momento
- [ ] Sí, solo antes de ser asignados a un repartidor
- [ ] No, la asignación es definitiva
- **Comentarios**:

### 2.3 Estados de Paquetes

**P2.7**: Confirme los estados de un paquete en su ciclo de vida:

| Estado | ¿Es correcto? | Comentarios |
|--------|---------------|-------------|
| `created` (Creado en el sistema) | ☐ Sí ☐ No | |
| `scanned` (Etiqueta escaneada con OCR) | ☐ Sí ☐ No | |
| `assigned_to_driver` (Asignado a repartidor) | ☐ Sí ☐ No | |
| `out_for_delivery` (En ruta de entrega) | ☐ Sí ☐ No | |
| `delivered` (Entregado exitosamente) | ☐ Sí ☐ No | |
| `failed` (Entrega fallida) | ☐ Sí ☐ No | |
| `returned` (Devuelto al remitente) | ☐ Sí ☐ No | |
| `cancelled` (Cancelado) | ☐ Sí ☐ No | |

**¿Falta algún estado importante?** _______________

**P2.8**: ¿Se debe mantener un **historial completo** de todos los cambios de estado de cada paquete?
- [ ] Sí, con timestamp, ubicación GPS, y usuario que hizo el cambio
- [ ] Sí, pero solo timestamp y usuario
- [ ] No, solo el estado actual

---

## 📱 SECCIÓN 3: APP ANDROID PARA REPARTIDORES

### 3.1 Funcionalidad Offline-First

**P3.1**: Los repartidores deben poder **trabajar completamente sin conexión a internet**. ¿Es correcto?
- [ ] Sí, es crítico (zonas con mala cobertura)
- [ ] Sí, pero solo por períodos cortos
- [ ] No, siempre tendrán internet

**P3.2**: Si el repartidor trabaja **sin conexión** durante horas, ¿qué datos quedan almacenados localmente?
- [ ] Paquetes asignados a él ese día
- [ ] Rutas del día
- [ ] Fotos capturadas (etiquetas, pruebas de entrega)
- [ ] Cambios de estado de paquetes
- [ ] Tracking GPS acumulado
- [ ] Todos los anteriores

**P3.3**: Cuando el dispositivo recupera conexión, ¿cada cuánto debe sincronizarse automáticamente?
- [ ] Inmediatamente
- [ ] Cada 5 minutos
- [ ] Cada 15 minutos
- [ ] Cada 30 minutos
- [ ] Manualmente solo cuando el repartidor lo solicite
- **Recomendación del documento**: Cada 15 minutos. ¿Es aceptable?

**P3.4**: ¿Qué debe ocurrir si hay un **conflicto** de datos (el paquete fue modificado en el servidor mientras el repartidor trabajaba offline)?
- [ ] El servidor siempre gana (Server-Wins)
- [ ] El dispositivo local siempre gana (Client-Wins)
- [ ] Depende del tipo de dato (usar reglas específicas)
- **Comentarios**:

### 3.2 Prueba de Entrega (Proof of Delivery)

**P3.5**: Al confirmar una entrega exitosa, el repartidor debe capturar:

| Dato | ¿Es obligatorio? | Comentarios |
|------|------------------|-------------|
| **Nombre de quien recibe** | ☐ Sí ☐ No | |
| **DNI de quien recibe** | ☐ Sí ☐ No | |
| **Relación con destinatario** (destinatario/familiar/vecino/portero/otro) | ☐ Sí ☐ No | |
| **Firma digital** | ☐ Sí ☐ No | |
| **Foto del receptor CON el paquete** | ☐ Sí ☐ No | *NUEVO: Validar si es obligatoria* |
| **Foto del paquete entregado** | ☐ Sí ☐ No | |

**P3.6**: ¿La **foto del receptor con el paquete** es una característica nueva y obligatoria?
- [ ] Sí, es obligatoria para reducir fraude
- [ ] Sí, pero es opcional
- [ ] No, solo foto del paquete
- **Justificación**: _______________

**P3.7**: ¿Qué ocurre si el destinatario se niega a que le tomen una foto?
- [ ] No se puede completar la entrega
- [ ] Se marca como "entrega con incidente"
- [ ] Se permite completar sin foto (excepcional)
- **Política deseada**: _______________

### 3.3 Entregas Fallidas

**P3.8**: Razones de entrega fallida a capturar:

| Razón | ¿Es válida? | Comentarios |
|-------|-------------|-------------|
| Destinatario ausente | ☐ Sí ☐ No | |
| Dirección incorrecta/no existe | ☐ Sí ☐ No | |
| Destinatario rechaza el paquete | ☐ Sí ☐ No | |
| Zona peligrosa (seguridad del repartidor) | ☐ Sí ☐ No | |
| Paquete dañado | ☐ Sí ☐ No | |
| Otro (texto libre) | ☐ Sí ☐ No | |

**¿Falta alguna razón importante?** _______________

**P3.9**: Si una entrega falla, ¿se debe tomar una foto del lugar?
- [ ] Sí, obligatorio (puerta cerrada, cartel, etc.)
- [ ] Sí, opcional
- [ ] No

**P3.10**: ¿Cuántos intentos de entrega se permiten antes de devolver el paquete?
- [ ] 1 intento
- [ ] 2 intentos
- [ ] 3 intentos
- [ ] Indefinido (hasta que el destinatario esté disponible)
- **Comentarios**: _______________

### 3.4 Tracking GPS

**P3.11**: ¿Se debe trackear la ubicación GPS del repartidor **durante toda la jornada**?
- [ ] Sí, cada 30 segundos
- [ ] Sí, cada 1 minuto
- [ ] Sí, cada 5 minutos
- [ ] Solo cuando escanea un paquete o confirma entrega
- **Recomendación del documento**: Cada 60 segundos. ¿Es aceptable?

**P3.12**: ¿Es aceptable que el tracking GPS se pause cuando el dispositivo está sin conexión?
- [ ] Sí, se guarda localmente y se sube después
- [ ] No, debe subirse en tiempo real siempre

---

## 💻 SECCIÓN 4: DASHBOARD WEB PARA ADMINISTRACIÓN

### 4.1 Roles y Permisos

**P4.1**: Confirme los roles de usuarios del dashboard:

| Rol | Acceso | ¿Es correcto? | Comentarios |
|-----|--------|---------------|-------------|
| **Admin** | Acceso total | ☐ Sí ☐ No | |
| **Manager** | Dashboard, paquetes, repartidores, rutas, liquidaciones, reportes | ☐ Sí ☐ No | |
| **Supervisor** | Dashboard, paquetes, repartidores, rutas | ☐ Sí ☐ No | |
| **Operator** | Solo dashboard y lista de paquetes | ☐ Sí ☐ No | |

**¿Falta algún rol?** _______________

**P4.2**: ¿Los usuarios de una **sublogística** pueden ver datos de **otras sublogísticas**?
- [ ] No, cada sublogística solo ve sus datos (Multi-tenancy estricto)
- [ ] Sí, la empresa matriz ve todo
- [ ] Sí, pero con permisos especiales
- **Comentarios**: _______________

### 4.2 Métricas y KPIs del Dashboard

**P4.3**: Validar las métricas principales en el dashboard:

| Métrica | ¿Es importante? | Prioridad (1-5) |
|---------|-----------------|-----------------|
| **Paquetes en tránsito** | ☐ Sí ☐ No | ___ |
| **Entregas del día** | ☐ Sí ☐ No | ___ |
| **Repartidores activos** | ☐ Sí ☐ No | ___ |
| **Ingresos del mes** | ☐ Sí ☐ No | ___ |
| **Tasa de éxito de entregas (%)** | ☐ Sí ☐ No | ___ |
| **Tiempo promedio de entrega** | ☐ Sí ☐ No | ___ |
| **Paquetes con problemas** | ☐ Sí ☐ No | ___ |
| **Entregas por zona** | ☐ Sí ☐ No | ___ |

**¿Faltan métricas críticas?** _______________

### 4.3 Gráficos y Visualizaciones

**P4.4**: El dashboard incluirá estos gráficos:

| Gráfico | ¿Es útil? | Comentarios |
|---------|-----------|-------------|
| **Estado de paquetes** (Pie Chart) | ☐ Sí ☐ No | |
| **Entregas por zona** (Bar Chart) | ☐ Sí ☐ No | |
| **Tendencia de entregas** (Line Chart) | ☐ Sí ☐ No | |
| **Performance de repartidores** (Ranking) | ☐ Sí ☐ No | |
| **Mapa en tiempo real de repartidores** | ☐ Sí ☐ No | |

**¿Qué otros gráficos necesitan?** _______________

### 4.4 Gestión de Paquetes

**P4.5**: Desde el dashboard, ¿se debe poder **crear paquetes manualmente** (sin escaneo)?
- [ ] Sí
- [ ] No, solo desde la app Android

**P4.6**: ¿Se debe poder **editar información de un paquete** después de creado?
- [ ] Sí, cualquier campo
- [ ] Sí, solo campos específicos (dirección, teléfono, notas)
- [ ] No, los datos son inmutables
- **Comentarios**: _______________

**P4.7**: ¿Se debe poder **cancelar un paquete** desde el dashboard?
- [ ] Sí, en cualquier momento
- [ ] Sí, solo si no está asignado a un repartidor
- [ ] No
- **Comentarios**: _______________

### 4.5 Administración de Rutas

**P4.8**: ¿Se deben crear rutas **manualmente** o el sistema las **optimiza automáticamente**?
- [ ] Manual (el supervisor asigna paquetes a cada repartidor)
- [ ] Automático (algoritmo de optimización de rutas)
- [ ] Mixto (sugerencia automática + ajuste manual)

**P4.9**: ¿Qué algoritmo de optimización se prefiere?
- [ ] Por proximidad geográfica (minimizar distancia)
- [ ] Por prioridad de paquetes
- [ ] Por ventanas horarias de entrega
- [ ] Combinación de los anteriores

**P4.10**: ¿Se pueden **reasignar paquetes** de un repartidor a otro **durante el día**?
- [ ] Sí, libremente
- [ ] Sí, pero el repartidor original debe confirmar
- [ ] No

---

## 💰 SECCIÓN 5: LIQUIDACIONES Y PAGOS

### 5.1 Modelo de Comisiones

**P5.1**: Confirme el modelo de comisiones para repartidores:

| Concepto | ¿Es correcto? | Valor típico |
|----------|---------------|--------------|
| **Comisión por paquete entregado** | ☐ Sí ☐ No | $150 |
| **Bono por zona** (ej. CABA +$50, Ramos Mejía +$75) | ☐ Sí ☐ No | Variable |
| **Comisión por kilómetro recorrido** | ☐ Sí ☐ No | $25/km |

**¿Faltan conceptos?** (ej. bono por urgente, bono por horario nocturno, etc.)
_______________

**P5.2**: ¿Las comisiones son configurables **por sublogística**?
- [ ] Sí, cada sublogística define sus tarifas
- [ ] No, la empresa matriz define tarifas únicas
- **Comentarios**: _______________

### 5.2 Descuentos e Incidencias

**P5.3**: Se aplican descuentos por:

| Incidencia | ¿Se descuenta? | Monto o % | Comentarios |
|------------|----------------|-----------|-------------|
| **Entrega fallida por culpa del repartidor** | ☐ Sí ☐ No | ___ | |
| **Paquete dañado por el repartidor** | ☐ Sí ☐ No | ___ | |
| **Pérdida de paquete** | ☐ Sí ☐ No | ___ | |
| **Reclamo del cliente** | ☐ Sí ☐ No | ___ | |
| **Demora excesiva en entrega** | ☐ Sí ☐ No | ___ | |

**¿Faltan situaciones?** _______________

**P5.4**: ¿Los descuentos se aplican **automáticamente** o requieren **aprobación manual**?
- [ ] Automático según reglas predefinidas
- [ ] Manual (supervisor debe aprobar)
- [ ] Mixto (automático con revisión posterior)

### 5.3 Periodicidad de Liquidaciones

**P5.5**: ¿Cada cuánto se liquida a los repartidores?
- [ ] Diario
- [ ] Semanal (lunes)
- [ ] Quincenal
- [ ] Mensual
- **Comentarios**: _______________

**P5.6**: ¿Las liquidaciones se calculan automáticamente o requieren revisión?
- [ ] Automático (el sistema genera la liquidación y notifica)
- [ ] Semi-automático (el sistema calcula, supervisor aprueba)
- [ ] Manual (se revisa todo caso por caso)

**P5.7**: ¿Se envía un **resumen de liquidación** al repartidor (PDF o email)?
- [ ] Sí, automáticamente
- [ ] Sí, bajo demanda
- [ ] No

---

## 🗂️ SECCIÓN 6: BASE DE DATOS Y ARQUITECTURA TÉCNICA

### 6.1 Cosmos DB - Contenedores

**P6.1**: El sistema usará **Azure Cosmos DB** (NoSQL) con estos 8 contenedores:

| Contenedor | Propósito | ¿Es necesario? | Comentarios |
|------------|-----------|----------------|-------------|
| **Organizations** | Matriz y sublogísticas | ☐ Sí ☐ No | |
| **Drivers** | Información de repartidores | ☐ Sí ☐ No | |
| **Packages** | Paquetes con historial completo | ☐ Sí ☐ No | |
| **Scans** | Datos de OCR de etiquetas | ☐ Sí ☐ No | |
| **Routes** | Rutas diarias con secuencia de paradas | ☐ Sí ☐ No | |
| **Settlements** | Liquidaciones de repartidores | ☐ Sí ☐ No | |
| **Transactions** | Pagos realizados | ☐ Sí ☐ No | |
| **Analytics** | Métricas pre-agregadas | ☐ Sí ☐ No | |

**¿Falta algún contenedor?** _______________

**P6.2**: ¿Se debe mantener un **historial completo** de cambios en cada paquete (Event Sourcing)?
- [ ] Sí, es crítico para auditoría
- [ ] Sí, pero solo los últimos 6 meses
- [ ] No, solo el estado actual

### 6.2 Almacenamiento de Imágenes

**P6.3**: Las fotos (etiquetas, pruebas de entrega) se almacenarán en:
- [ ] **Azure Blob Storage** (recomendado en el documento)
- [ ] Cosmos DB (como base64)
- [ ] Otro: _______________

**P6.4**: ¿Cuánto tiempo deben conservarse las fotos?
- [ ] 6 meses
- [ ] 1 año
- [ ] 2 años
- [ ] Indefinidamente

### 6.3 OCR con Phi4 Multimodal

**P6.5**: El sistema usa **Phi4 Vision** (modelo multimodal de Microsoft) para OCR. ¿Es aceptable?
- [ ] Sí
- [ ] No, preferimos otro servicio (Azure AI Vision, Tesseract, Google Vision, etc.)
- **Alternativa preferida**: _______________

**P6.6**: Si el OCR extrae datos con **baja confianza** (ej. 60%), ¿qué debe ocurrir?
- [ ] Se marca para revisión manual
- [ ] El repartidor corrige en el momento
- [ ] Se rechaza el escaneo y debe repetirse
- **Comentarios**: _______________

### 6.4 Integración con Terceros

**P6.7**: ¿El sistema debe integrarse con plataformas de e-commerce para **recibir paquetes automáticamente**?
- [ ] Sí
- [ ] No, solo ingreso manual

**Si Sí**, ¿con cuáles?
- [ ] MercadoLibre
- [ ] Tienda Nube
- [ ] WooCommerce
- [ ] Shopify
- [ ] Otras: _______________

**P6.8**: ¿El sistema debe integrarse con servicios de **geocodificación** (convertir dirección a coordenadas)?
- [ ] Sí, Azure Maps
- [ ] Sí, Google Maps API
- [ ] No, se ingresarán coordenadas manualmente
- **Comentarios**: _______________

**P6.9**: ¿El sistema debe enviar **notificaciones push** a los destinatarios?
- [ ] Sí, SMS cuando el repartidor está cerca
- [ ] Sí, WhatsApp con estado del paquete
- [ ] Sí, email con tracking
- [ ] No
- **Comentarios**: _______________

---

## 🗺️ SECCIÓN 7: ENRUTAMIENTO GEOGRÁFICO Y ZONAS

### 7.1 Definición de Zonas

**P7.1**: Validar el mapeo de zonas propuesto:

| Ciudad/Barrio | Zona ID | Sublogística asignada | ¿Es correcto? |
|---------------|---------|----------------------|---------------|
| CABA (genérico) | `caba` | Cangallo | ☐ Sí ☐ No |
| Palermo | `palermo` | Cangallo | ☐ Sí ☐ No |
| Recoleta | `recoleta` | Cangallo | ☐ Sí ☐ No |
| Belgrano | `belgrano` | Cangallo | ☐ Sí ☐ No |
| Ramos Mejía | `ramos_mejia` | Defilippi | ☐ Sí ☐ No |
| Benavidez | `benavidez` | Defilippi | ☐ Sí ☐ No |

**¿Faltan zonas críticas?** _______________

**P7.2**: ¿Se debe usar **geofencing** (polígonos geográficos) para definir zonas con precisión?
- [ ] Sí, con coordenadas lat/lng
- [ ] No, solo mapeo ciudad → zona
- **Comentarios**: _______________

### 7.2 Asignación Automática

**P7.3**: Cuando un paquete ingresa con dirección "Nazca 3733, CABA", el sistema debe:
1. Normalizar la dirección
2. Detectar zona: `caba`
3. Buscar qué sublogística cubre `caba`
4. Asignar a **Logística Cangallo**

¿Este flujo es correcto?
- [ ] Sí
- [ ] No
- **Si No**: ¿Cuál es el flujo correcto? _______________

**P7.4**: Si una dirección **no tiene cobertura**, ¿quién la asigna manualmente?
- [ ] Administrador de la empresa matriz
- [ ] Supervisor de alguna sublogística
- [ ] Se rechaza el paquete
- **Comentarios**: _______________

---

## 📊 SECCIÓN 8: REPORTES Y ANALYTICS

### 8.1 Reportes Requeridos

**P8.1**: Validar los reportes necesarios:

| Reporte | ¿Es necesario? | Frecuencia | Formato |
|---------|----------------|------------|---------|
| **Resumen diario de entregas** | ☐ Sí ☐ No | Diario | PDF / Excel |
| **Performance de repartidores** | ☐ Sí ☐ No | Semanal | PDF / Excel |
| **Liquidaciones mensuales** | ☐ Sí ☐ No | Semanal/Mensual | PDF / Excel |
| **Paquetes con problemas** | ☐ Sí ☐ No | Diario | Excel |
| **Entregas por zona** | ☐ Sí ☐ No | Semanal | Dashboard + Excel |
| **Costos operativos** | ☐ Sí ☐ No | Mensual | Excel |

**¿Faltan reportes críticos?** _______________

**P8.2**: ¿Los reportes deben poder **filtrarse por sublogística**?
- [ ] Sí
- [ ] No (solo reportes globales)

**P8.3**: ¿Se debe poder **exportar a Excel** desde cualquier tabla del dashboard?
- [ ] Sí
- [ ] No

### 8.2 Power BI

**P8.4**: ¿Se debe integrar con **Power BI** para reportes avanzados?
- [ ] Sí
- [ ] No
- [ ] Tal vez en el futuro

---

## 🎨 SECCIÓN 9: UX/UI Y LOOK & FEEL

### 9.1 Colores Corporativos

**P9.1**: El dashboard web usará estos colores:
- **Primario**: Rojo #E31E24
- **Secundario**: Azul #003DA5
- **Éxito**: Verde #10b981
- **Advertencia**: Amarillo #f59e0b
- **Error**: Rojo #ef4444

¿Son los colores de la marca?
- [ ] Sí
- [ ] No
- **Si No**: Especificar colores corporativos: _______________

**P9.2**: ¿Existe un **logo oficial** que debe aparecer en la app y dashboard?
- [ ] Sí
- [ ] No
- **Si Sí**: Proporcionar logo en alta resolución (PNG/SVG)

### 9.2 Diseño de la App Android

**P9.3**: La app Android debe ser:
- [ ] **Material Design 3** (estilo Google moderno)
- [ ] Estilo personalizado corporativo
- **Comentarios**: _______________

**P9.4**: ¿La app debe soportar **modo oscuro** (dark mode)?
- [ ] Sí
- [ ] No
- [ ] En futuras versiones

---

## 🔒 SECCIÓN 10: SEGURIDAD Y PERMISOS

### 10.1 Autenticación

**P10.1**: ¿Cómo se autentican los repartidores en la app Android?
- [ ] Usuario y contraseña
- [ ] DNI y contraseña
- [ ] Biometría (huella/face ID)
- [ ] Código QR
- **Comentarios**: _______________

**P10.2**: ¿Cómo se autentican los usuarios del dashboard web?
- [ ] Usuario y contraseña
- [ ] Email y contraseña
- [ ] SSO (Single Sign-On) con Microsoft/Google
- [ ] Autenticación de dos factores (2FA)
- **Comentarios**: _______________

### 10.2 Privacidad de Datos

**P10.3**: Los datos personales de destinatarios (nombre, DNI, teléfono, dirección) deben:
- [ ] Ser visibles solo para repartidores asignados
- [ ] Ser visibles para toda la sublogística
- [ ] Estar encriptados en tránsito y reposo
- [ ] Cumplir con GDPR/Ley de Protección de Datos Argentina
- **Comentarios**: _______________

**P10.4**: ¿Las fotos de destinatarios se deben **anonimizar** o **blur faces** automáticamente?
- [ ] Sí, por privacidad
- [ ] No, son prueba legal de entrega
- **Comentarios**: _______________

---

## 🚀 SECCIÓN 11: DESPLIEGUE Y ESCALABILIDAD

### 11.1 Infraestructura Azure

**P11.1**: El sistema se desplegará en **Azure Cloud**. ¿Es correcto?
- [ ] Sí
- [ ] No, preferimos otro proveedor (AWS, GCP, on-premise)
- **Comentarios**: _______________

**P11.2**: Componentes confirmados:
- [ ] Azure Cosmos DB (base de datos)
- [ ] Azure Blob Storage (imágenes)
- [ ] Azure Functions (APIs backend)
- [ ] Azure App Service (dashboard web)
- [ ] Azure AI Services (OCR)

¿Es correcta esta arquitectura?
- [ ] Sí
- [ ] No
- **Si No**: ¿Qué debe cambiarse? _______________

### 11.2 Escalabilidad

**P11.3**: ¿Cuántos repartidores se esperan en el sistema?
- [ ] < 50
- [ ] 50-100
- [ ] 100-500
- [ ] > 500
- **Número aproximado**: _______________

**P11.4**: ¿Cuántos paquetes se esperan **por día**?
- [ ] < 500
- [ ] 500-1,000
- [ ] 1,000-5,000
- [ ] > 5,000
- **Número aproximado**: _______________

**P11.5**: ¿Cuántas sublogísticas se esperan?
- [ ] 2-5
- [ ] 5-10
- [ ] > 10
- **Número aproximado**: _______________

---

## 🧪 SECCIÓN 12: PLAN DE IMPLEMENTACIÓN

### 12.1 Prioridades

**P12.1**: Ordene las funcionalidades por prioridad (1 = más urgente):

| Funcionalidad | Prioridad (1-10) | Comentarios |
|---------------|------------------|-------------|
| App Android con escaneo OCR | ___ | |
| Sincronización offline-first | ___ | |
| Dashboard web básico (métricas y listados) | ___ | |
| Sistema de liquidaciones | ___ | |
| Enrutamiento automático por zonas | ___ | |
| Tracking GPS en tiempo real | ___ | |
| Reportes avanzados | ___ | |
| Notificaciones a destinatarios | ___ | |
| Integración con e-commerce | ___ | |

### 12.2 MVP (Producto Mínimo Viable)

**P12.2**: Para el **MVP inicial**, ¿cuáles funcionalidades son **imprescindibles**?
(Marcar con X)

- [ ] App Android con escaneo OCR
- [ ] Creación y listado de paquetes
- [ ] Asignación manual de paquetes a repartidores
- [ ] Prueba de entrega con foto
- [ ] Dashboard con métricas básicas
- [ ] Liquidaciones básicas
- [ ] Tracking GPS
- [ ] Reportes en Excel

**Otras funcionalidades críticas para MVP**: _______________

**P12.3**: ¿En cuánto tiempo se espera tener el **MVP funcionando**?
- [ ] 3 meses
- [ ] 6 meses
- [ ] 9 meses
- [ ] 12 meses
- **Fecha objetivo**: _______________

---

## 📝 SECCIÓN 13: OBSERVACIONES Y REQUISITOS ADICIONALES

### P13.1: ¿Existen funcionalidades **NO mencionadas** en los documentos que sean críticas?

_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

### P13.2: ¿Existen integraciones con sistemas internos existentes?

_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

### P13.3: ¿Existen restricciones técnicas, legales o de compliance que debamos considerar?

_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

### P13.4: ¿Cuál es el **mayor dolor/problema** que este sistema debe resolver?

_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

### P13.5: ¿Qué funcionalidad consideran que es **innovadora o diferenciadora** respecto a otros sistemas de logística?

_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

---

## ✅ VALIDACIÓN FINAL

**Revisor**: _______________
**Cargo**: _______________
**Fecha**: _______________
**Firma**: _______________

### Conclusión

- [ ] **APROBADO**: Los documentos reflejan correctamente los requisitos del negocio. Proceder con la implementación.
- [ ] **APROBADO CON CAMBIOS**: Realizar las correcciones indicadas en las secciones anteriores.
- [ ] **RECHAZADO**: Los documentos requieren una revisión completa antes de proceder.

**Comentarios finales**:
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

---

## 📎 ANEXOS

### Anexo A: Referencias a Documentos
- [COSMOS_DB_LOGISTICS_MODEL_PROMPT.md](./COSMOS_DB_LOGISTICS_MODEL_PROMPT.md)
- [ANDROID_SYNC_ARCHITECTURE.md](./ANDROID_SYNC_ARCHITECTURE.md)
- [LOGISTICS_FRONTEND_PROMPT.md](./LOGISTICS_FRONTEND_PROMPT.md)
- [ZONE_ROUTING_LOGIC.md](./ZONE_ROUTING_LOGIC.md)

### Anexo B: Glosario de Términos

| Término | Definición |
|---------|------------|
| **Multi-tenancy** | Arquitectura donde múltiples organizaciones (sublogísticas) comparten la misma infraestructura pero con datos aislados |
| **Offline-first** | Enfoque donde la app funciona completamente sin conexión y sincroniza cuando hay internet |
| **OCR** | Optical Character Recognition - Tecnología para extraer texto de imágenes |
| **Event Sourcing** | Patrón donde todos los cambios se almacenan como eventos en orden cronológico |
| **Partition Key** | Clave que determina cómo se distribuyen los datos en Cosmos DB |
| **SAS Token** | Shared Access Signature - Token temporal para subir archivos a Azure Blob Storage |

---

**FIN DEL CUESTIONARIO**

**Total de preguntas**: 150+
**Tiempo estimado de revisión**: 2-3 horas
**Siguiente paso**: Reunión de validación con Product Owner y equipo técnico
