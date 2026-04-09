# SISMA — Sistema Inteligente de Situación y Manejo de Alertas

Plataforma de coordinación de emergencias sísmicas para la Ciudad de México. Conecta en tiempo real a ciudadanos, ambulancias, policía, bomberos y hospitales durante un sismo.

Construido para el hackathon de IBM Watsonx Orchestrate.

---

## Qué hace

**Predicción sísmica con IA**
Un agente de IBM Watsonx Orchestrate consulta el historial sísmico del SSN-UNAM (1990–2024, +11,000 eventos en CDMX), analiza patrones por zona y genera predicciones de riesgo mensuales. Las predicciones se visualizan en un mapa interactivo con pines por colonia y nivel de riesgo: ALTO / MEDIO-ALTO / MEDIO / BAJO.

**Coordinación de emergencias en tiempo real**
Cuando ocurre un sismo, cada servicio tiene su propio dashboard conectado al mismo sistema vía Pusher:

- **Ciudadano** — Botón de pánico que manda su ubicación GPS al instante a policía y bomberos
- **Policía** — Ve pánicos ciudadanos, reporta vialidades bloqueadas y zonas de evacuación
- **Bomberos** — Ve pánicos ciudadanos, reporta derrumbes, incendios y fugas de gas
- **Ambulancia** — Ve hospitales disponibles ordenados por capacidad, recibe alertas de bloqueos viales
- **Hospital** — Actualiza su capacidad (disponible / saturado / lleno) en tiempo real para todas las ambulancias

Todo lo que reporta un servicio aparece en el mapa de los demás al instante, sin recargar.

---

## Tech stack

- **Next.js 15** (App Router) + **React 19**
- **MongoDB + Mongoose** — modelos: Usuario, Sismo, Prediccion, HospitalUnit, Incident
- **Pusher Channels** — WebSockets para actualizaciones en tiempo real
- **MapLibre GL** — mapas interactivos (predicción sísmica + incidentes)
- **IBM Watsonx Orchestrate** — agente de IA que genera predicciones sísmicas
- **NextAuth v5** — autenticación con Google OAuth y JWT
- **Driver.js** — tutoriales guiados en los dashboards
- **Tailwind CSS 4 + DaisyUI 5** — estilos

---

## Roles de usuario

| Rol | Dashboard | Qué puede hacer |
|-----|-----------|-----------------|
| `ciudadano` | `/dashboard/ciudadano` | Botón de pánico, ver hospitales disponibles |
| `ambulancia` | `/dashboard/ambulancia` | Ver hospitales, advertencias de ruta, navegar con Google Maps |
| `policia` | `/dashboard/policia` | Ver pánicos, reportar bloqueos viales y zonas de evacuación |
| `bomberos` | `/dashboard/bomberos` | Ver pánicos, reportar derrumbes, incendios, fugas de gas |
| `hospital` | `/dashboard/hospital` | Registrar ubicación, actualizar capacidad y especialidades |

Al iniciar sesión por primera vez se elige el rol. El dashboard se adapta automáticamente.

---

## Páginas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/mapa` | Mapa de predicción sísmica (público) |
| `/panico` | Botón de pánico ciudadano (sin login requerido) |
| `/select-role` | Selector de rol al registrarse |
| `/dashboard/*` | Dashboards por rol (protegidos) |

---

## API routes relevantes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/sismos/query` | Consulta sismos por magnitud, fecha y zona |
| GET | `/api/sismos/stats` | Estadísticas agregadas del historial sísmico |
| POST | `/api/sismos/predictions` | Crea una predicción (usado por el agente de Orchestrate) |
| GET | `/api/sismos/predictions` | Obtiene las predicciones más recientes |
| GET | `/api/sismos/openapi.json` | Spec OpenAPI 3.0 para el agente de IBM Orchestrate |
| GET | `/api/hospitals` | Lista todos los hospitales |
| PATCH | `/api/hospitals/[id]` | Actualiza capacidad de un hospital (dispara Pusher) |
| GET | `/api/incidents` | Lista incidentes activos |
| POST | `/api/incidents` | Crea un incidente (acepta `x-sisma-public: true` para pánico sin login) |
| PATCH | `/api/incidents/[id]` | Marca incidente como resuelto (dispara Pusher) |

---

## Scripts de datos

```bash
# Importar catálogo sísmico SSN-UNAM (colocar CSV en la raíz primero)
node scripts/import-sismos.mjs

# Poblar hospitales reales de CDMX (SSA, IMSS, ISSSTE, SEDESA, Cruz Roja, privados)
node scripts/seed-hospitals.mjs

# Poblar incidentes de demo para visualizar los dashboards
node scripts/seed-incidents.mjs
```

---

## Variables de entorno requeridas

```env
# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_ID=
GOOGLE_SECRET=

# Base de datos
MONGODB_URI=

# Pusher (tiempo real)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# API key para IBM Orchestrate
SISMOS_API_KEY=
```

---

## Correr en local

```bash
npm install
npm run dev
```

La app corre en `http://localhost:3000`.
