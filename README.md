# QA Test Case Hub for Jira

App interna para QA Manual y QA Leads que **centraliza la visualización, ejecución y reporte de bugs**
de test cases en Gherkin que viven en Jira Cloud. En lugar de abrir una pestaña por subtarea, todo el
trabajo ocurre en una sola pantalla.

## Problema y solución

Los QA suelen tener 100+ test cases dispersos como subtareas/issues en Jira. Leer, ejecutar o marcar
resultado de cada uno obliga a saltar entre pestañas. QA Test Case Hub trae esos casos a **una vista
centralizada** donde el QA puede:

1. Ver todos los casos sincronizados desde Jira en una tabla rápida.
2. Filtrarlos por proyecto, status, tag Gherkin, automation status y búsqueda libre.
3. Abrir cualquier caso en un panel lateral (drawer) para leer el Gherkin sin salir de la app.
4. Ejecutar el caso manualmente y marcar resultado (Pass / Fail / Blocked / Not run).
5. Si falla, crear el bug en Jira con un click, linkeado al test case.
6. Ver KPIs (totales, pass rate, automation coverage) siempre visibles arriba de la tabla.
7. Exportar la vista filtrada a CSV.

## Pantallas

Solo **2 rutas**:

- `/test-cases`: top bar + KPIs sticky (6 cards) + panel de filtros izquierdo colapsable + tabla
  paginada + drawer derecho con tabs **Gherkin / Ejecutar / Historial**. La sincronización se dispara
  desde el botón **Sincronizar desde Jira**, que abre un modal con input JQL.
- `/settings`: read-only. Estado de backend/DB, modo Jira (`mock` / `real`), base URL configurada
  (sin token), project key y el JQL recomendado.

> **KPIs:** los KPIs sticky reflejan el dataset **global** (endpoint `GET /api/dashboard/summary`),
> no la página filtrada actual. Es una decisión consciente para mantener una sola fuente de verdad y
> evitar recalcular sobre páginas parciales.

## Stack

- **Frontend:** React + TypeScript + Vite, React Router (2 rutas), TanStack Query, React Hook Form +
  Zod, Tailwind CSS. UI en español, código en inglés.
- **Backend:** ASP.NET Core 10 (.NET 10), Web API REST, EF Core + Npgsql + PostgreSQL,
  HttpClientFactory para Jira, librería **`Gherkin` de Cucumber (NuGet)** para parsear, OpenAPI en
  Development, health checks, CORS restringido a `FRONTEND_ORIGIN`, logging estructurado.
- **Arquitectura backend:** modular monolith bajo `backend/` (módulos `TestCases`, `Executions`,
  `Dashboard` + capa `Shared` con `Abstractions` / `Contracts` / `Infrastructure`).
- **Infra:** PostgreSQL local vía `docker-compose.yml`; soporta `DATABASE_URL` (formato Railway) y
  connection string tradicional; migraciones EF Core.

## Correr local

### Backend

Mock sin PostgreSQL ni Jira (usa base InMemory y siembra 25+ casos demo):

```bash
dotnet run --project backend/src/API/QaTestCaseHub.API.csproj
```

El backend carga variables locales desde `backend/src/API/.env` si existe (gitignorado;
`backend/src/API/.env.example` es la plantilla).

URLs esperadas:

- API: `http://localhost:5000` (o el puerto que asigne ASP.NET Core).
- OpenAPI (Development): `/openapi/v1.json`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend en `http://localhost:5173`. Configurable con `VITE_API_BASE_URL` (ver `frontend/.env.example`).

### PostgreSQL local (opcional)

```bash
docker compose up -d
```

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qa_test_case_hub
```

### Railway PostgreSQL

La base productiva es **PostgreSQL en Railway**. Usar el `DATABASE_URL` provisto por Railway
(`postgresql://user:password@host:port/database`). El parser aplica `SSL Mode=Require` para hosts
remotos y `Disable` para `localhost`. Notas operativas en `docs/railway-postgres-integration.md`.

## Jira y mock mode

Credenciales solo en backend (ver `backend/src/API/.env.example`):

```env
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=qa@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=QA
JIRA_MOCK_MODE=false
```

Reglas de mock mode:

- `JIRA_MOCK_MODE=true` → siempre mock.
- Faltan `JIRA_BASE_URL` / `JIRA_EMAIL` / `JIRA_API_TOKEN` (o son placeholders) → mock automático.
- En mock se devuelven 25+ casos demo con tags `@smoke`, `@regression`, `@login`, `@api`, `@mobile`,
  y al crear un bug se devuelve un key `MOCK-{n}`.

Mapeo de campos y manejo de errores Jira en `docs/jira-mapping.md`.

## Migraciones

El backend aplica migraciones EF Core **automáticamente al iniciar** cuando usa un provider relacional
(`Database.MigrateAsync()`). Migraciones incluidas:

- `InitialCreate` — tablas `test_cases` y `test_executions` (más tablas heredadas del MVP anterior).
- `RemoveImportsAndSyncLogs` — quita `import_batches` y `jira_sync_logs` (fuera de alcance del MVP v2).
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
- `POST /api/test-cases/{id}/executions` · `GET /api/test-cases/{id}/executions`
- `GET /api/exports/test-cases.csv` (mismos filtros que la lista)

Errores con formato estándar `{ "error": { "code", "message", "details" } }`
(`JIRA_AUTH_FAILED`, `JIRA_RATE_LIMITED`, `VALIDATION_ERROR`, `NOT_FOUND`, `DATABASE_ERROR`).

## Next steps

Fuera de alcance de este MVP (varios existían en una versión previa y se removieron para simplificar):

- Editor de Gherkin in-app y creación/edición de casos desde la app.
- Import de archivos `.feature` y export `.feature`.
- Bulk create de issues en Jira (módulo Imports) y asistente "App Gherkin de APIs".
- Dashboard de tendencias históricas.
- Integración con runners de automation (Cucumber/JUnit).
- OAuth en lugar de Basic Auth.
- Soporte para Xray / Zephyr.
