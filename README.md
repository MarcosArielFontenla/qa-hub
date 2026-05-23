# QA Test Case Hub for Jira

App interna para **QA Manual y QA Leads** que centraliza la visualización, ejecución y reporte de bugs
de test cases en Gherkin que viven en **Jira Cloud**. En lugar de abrir una pestaña por subtarea, todo
el trabajo ocurre en una sola pantalla.

> **¿Sos nuevo en el equipo?** Andá directo al [Quickstart](#quickstart) — en ~5 minutos tenés la app
> andando con tu propio Jira. El roadmap de lo que falta vive en
> [`checklist-production.md`](./checklist-production.md).

## Problema y solución

Los QA suelen tener 100+ test cases dispersos como subtareas/issues en Jira. Leer, ejecutar o marcar
resultado de cada uno obliga a saltar entre pestañas. QA Test Case Hub trae esos casos a **una vista
centralizada** donde el QA puede:

1. Ver todos los casos sincronizados desde Jira.
2. Filtrarlos por proyecto, status, tag Gherkin, automation status y búsqueda libre.
3. Abrir cualquier caso en un panel lateral (drawer) para leer el Gherkin sin salir de la app.
4. Ejecutar el caso manualmente y marcar resultado (Pass / Fail / Blocked / Not run).
5. Si falla, crear el bug en Jira con un click, linkeado al test case.
6. Ver KPIs (totales, pass rate, automation coverage) y actividad reciente.
7. Exportar la vista filtrada a CSV.

## Pantallas

| Ruta | Pantalla | Qué ofrece |
|---|---|---|
| `/dashboard` *(home)* | **Dashboard** | Resumen de QA: KPIs, resultado de la última corrida, desglose por proyecto, fallas recientes, tags Gherkin y actividad reciente. |
| `/test-cases` | **Test cases** | Grilla de cards (con franja de color por resultado) + filtros (proyecto, status, tag, automation, búsqueda) + drawer lateral con tabs **Gherkin / Ejecutar / Historial**. La sincronización se dispara desde el botón **Sincronizar**, que abre un modal con input JQL. Incluye **Nuevo caso** para crear casos locales en Gherkin (validados con Cucumber). |
| `/bugs` | **Bugs abiertos** | Casos cuya última ejecución es `Fail`, con su bug de Jira linkeado (o acción para reportarlo si todavía no existe). |
| `/executions` | **Ejecuciones** | Historial cronológico de corridas (quién, cuándo, resultado, comentario, bug), con filtros por resultado y proyecto. |
| `/settings` | **Settings** | Read-only. Estado de salud (backend / DB / Jira) y modo (`mock` / `real`), más cómo conectar tu Jira. |

## Quickstart

Requisitos: [.NET 10 SDK](https://dotnet.microsoft.com/download) y [Node.js 20+](https://nodejs.org/).

```bash
# 1. Clonar
git clone <url-del-repo> && cd qa-cases-hub

# 2. Configurar el backend (ver "Conectá tu Jira" abajo)
cp backend/src/API/.env.example backend/src/API/.env
#    → editá backend/src/API/.env con tus credenciales de Jira

# 3. Backend (corre migraciones EF Core solo) → http://localhost:5000
dotnet run --project backend/src/API/QaTestCaseHub.API.csproj

# 4. Frontend → http://localhost:5173
cd frontend && npm install && npm run dev
```

5. Abrí `http://localhost:5173` → botón **Sincronizar** → ingresá tu JQL → ves tus casos.

> **Sin Jira a mano?** Si no configurás credenciales, la app arranca en **mock mode** con casos demo.
> Sirve para evaluar la app sin tocar Jira. Ver [Jira y mock mode](#jira-y-mock-mode).

## Conectá tu Jira

Las credenciales viven **solo en el backend** (`backend/src/API/.env`) y **nunca** llegan al frontend
ni a los logs.

1. Generá un **API token** de Atlassian en <https://id.atlassian.com/manage-profile/security/api-tokens>
   → *Create API token*. Copialo (no se vuelve a mostrar).
2. Copiá la plantilla y completá tus valores:

   ```bash
   cp backend/src/API/.env.example backend/src/API/.env
   ```

   ```env
   JIRA_BASE_URL=https://tu-empresa.atlassian.net
   JIRA_EMAIL=tu-correo@tu-empresa.com      # el dueño del API token
   JIRA_API_TOKEN=tu-api-token              # el token del paso 1
   JIRA_PROJECT_KEY=SCRUM                   # la key de tu proyecto en Jira
   JIRA_MOCK_MODE=false                     # false = Jira real
   ```

3. Reiniciá el backend (`dotnet run …`). En **Settings** debería figurar Jira en modo `real`.
4. En **Test cases** → **Sincronizar**, ajustá el JQL si querés (por defecto trae el proyecto entero,
   p. ej. `project = SCRUM ORDER BY updated DESC`).

> El token usa **Basic Auth** (email + token). Si tu proyecto guarda el Gherkin en un campo custom,
> ajustá `JIRA_GHERKIN_FIELD` (ver [Variables de entorno](#variables-de-entorno)).

## Stack

- **Frontend:** React 19 + TypeScript + Vite, React Router 7 (rutas: `/dashboard`, `/test-cases`,
  `/settings`), TanStack Query. Estilos en **`soft.css`** (sistema de diseño propio); UI en español,
  código en inglés.
- **Backend:** ASP.NET Core 10 (.NET 10), Web API REST, EF Core + Npgsql + PostgreSQL,
  HttpClientFactory para Jira, librería **`Gherkin` de Cucumber (NuGet)** para parsear, OpenAPI en
  Development, health checks, CORS restringido a `FRONTEND_ORIGIN`, logging estructurado.
- **Arquitectura backend:** modular monolith bajo `backend/` (módulos `TestCases`, `Executions`,
  `Dashboard` + capa `Shared` con `Abstractions` / `Contracts` / `Infrastructure`).
- **Estrategia de datos (frontend):** se traen todos los casos en una sola query y se derivan en el
  cliente los KPIs, contadores por proyecto, tags y filtros — una sola fuente de verdad en memoria.
- **Infra:** PostgreSQL local vía `docker-compose.yml`; soporta `DATABASE_URL` (formato Railway) y
  connection string tradicional; migraciones EF Core.

## Correr local

### Backend

```bash
dotnet run --project backend/src/API/QaTestCaseHub.API.csproj
```

- API en `http://localhost:5000`. OpenAPI (Development): `/openapi/v1.json`.
- Carga variables locales desde `backend/src/API/.env` si existe (gitignorado;
  `backend/src/API/.env.example` es la plantilla).
- Sin `DATABASE_URL` ni connection string, usa una base **InMemory** y siembra 25+ casos demo.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend en `http://localhost:5173`. Configurable con `VITE_API_BASE_URL` (ver `frontend/.env.example`,
default `http://localhost:5000`).

### PostgreSQL local (opcional)

```bash
docker compose up -d
```

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qa_test_case_hub
```

### Base de datos y despliegue

Por defecto se sugiere **PostgreSQL** (Railway, Supabase, Neon, RDS, on-prem, etc.): apuntá
`DATABASE_URL` (`postgresql://user:password@host:port/database`) a tu instancia. El parser aplica
`SSL Mode=Require` para hosts remotos y `Disable` para `localhost`.

Para correr local, conectar tu propia base, hostear la app, o **migrar a otro motor** (SQL Server, etc.),
ver la guía **[`docs/deployment-and-database.md`](./docs/deployment-and-database.md)**.

## Jira y mock mode

Reglas de mock mode:

- `JIRA_MOCK_MODE=true` → siempre mock.
- Faltan `JIRA_BASE_URL` / `JIRA_EMAIL` / `JIRA_API_TOKEN` (o son placeholders) → mock automático.
- En mock se devuelven 25+ casos demo con tags `@smoke`, `@regression`, `@login`, `@api`, `@mobile`,
  y al crear un bug se devuelve un key `MOCK-{n}`.

Mapeo de campos y manejo de errores Jira en `docs/jira-mapping.md`.

## Variables de entorno

Backend (`backend/src/API/.env`, plantilla en `.env.example`):

| Variable | Default | Descripción |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` | Entorno ASP.NET Core. |
| `DATABASE_URL` | *(InMemory)* | Connection string Postgres (formato Railway o tradicional). Sin valor → base InMemory. |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Único origen permitido por CORS. |
| `JIRA_BASE_URL` | — | URL de tu Jira Cloud (`https://tu-empresa.atlassian.net`). |
| `JIRA_EMAIL` | — | Email dueño del API token. |
| `JIRA_API_TOKEN` | — | API token de Atlassian (Basic Auth). |
| `JIRA_PROJECT_KEY` | `QA` | Key del proyecto por defecto. |
| `JIRA_MOCK_MODE` | `false` | `true` fuerza mock; faltando credenciales también cae a mock. |
| `JIRA_BUG_ISSUE_TYPE` | `Bug` | Issue type usado al crear bugs. |
| `JIRA_TEST_CASE_ISSUE_TYPE` | `Sub-task` | Issue type de los casos al sincronizar. |
| `JIRA_GHERKIN_FIELD` | `description` | Campo de Jira de donde se lee el Gherkin. |
| `JIRA_PARENT_FIELD` | `parent` | Campo del parent de la subtarea. |
| `JIRA_LABELS_FIELD` | `labels` | Campo de labels. |

Frontend (`frontend/.env`, plantilla en `frontend/.env.example`):

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000` | URL base del backend. |

## Migraciones

El backend aplica migraciones EF Core **automáticamente al iniciar** cuando usa un provider relacional
(`Database.MigrateAsync()`). Migraciones incluidas:

- `InitialCreate` — tablas `test_cases` y `test_executions`.
- `RemoveImportsAndSyncLogs` — quita `import_batches` y `jira_sync_logs` (fuera de alcance del MVP).
  Es aditiva: se aplica sobre una base nueva o sobre una Railway que ya tenga `InitialCreate`.

Para crear nuevas migraciones manualmente:

```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add <Nombre> --project backend/src/Shared/QaTestCaseHub.Shared.Infrastructure --startup-project backend/src/API
dotnet ef database update --project backend/src/Shared/QaTestCaseHub.Shared.Infrastructure --startup-project backend/src/API
```

## Tests

```bash
dotnet test backend/QaTestCaseHub.sln
cd frontend && npm run test && npm run build
```

## API (resumen)

Swagger/OpenAPI cubre el detalle en Development. Endpoints principales:

- `GET /api/health` → `{ status, database, jiraMode }`
- `GET /api/dashboard/summary` → KPIs globales
- `GET /api/test-cases` (filtros + paginación) · `GET /api/test-cases/{id}`
- `PATCH /api/test-cases/{id}/automation-status`
- `POST /api/jira/sync` `{ jql, maxResults }` → `{ totalFetched, created, updated, errors, items }`
- `GET /api/jira/settings` → config no sensible (base URL, email, project key — sin token)
- `POST /api/test-cases/{id}/executions` · `GET /api/test-cases/{id}/executions`
- `GET /api/executions?take=N` → últimas ejecuciones (feed de actividad)
- `GET /api/exports/test-cases.csv` (mismos filtros que la lista)

Errores con formato estándar `{ "error": { "code", "message", "details" } }`
(`JIRA_AUTH_FAILED`, `JIRA_RATE_LIMITED`, `VALIDATION_ERROR`, `NOT_FOUND`, `DATABASE_ERROR`).

## Roadmap y alcance

Lo que falta para dejar la app 100% productiva está fasado en
[`checklist-production.md`](./checklist-production.md).

**Fuera de alcance** de este MVP: hosting administrado / instancia compartida, autenticación y roles
multiusuario, editor de Gherkin in-app, import/export `.feature`, bulk-create de issues, dashboard de
tendencias históricas, integración con runners de automation (Cucumber/JUnit), Xray / Zephyr, y OAuth
en lugar de Basic Auth.
