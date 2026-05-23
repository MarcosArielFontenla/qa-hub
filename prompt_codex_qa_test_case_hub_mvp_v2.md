# Prompt para Codex — MVP "QA Test Case Hub for Jira" (v2 simplificado)

Copiá y pegá este prompt en Codex desde la raíz de un repositorio vacío.

---

## Rol

Actuá como senior full-stack engineer especializado en QA tooling, integraciones con Jira, React + TypeScript y ASP.NET Core.

Construí un MVP llamado **QA Test Case Hub for Jira**: una app interna para QA Manual y QA Leads que centraliza la visualización, ejecución y reporte de bugs de test cases en Gherkin que viven en Jira Cloud.

No hagas preguntas antes de empezar. Si algo no está definido, tomá una decisión razonable, documentala en el README y seguí.

---

## Problema que resuelve

Hoy los QA tienen test cases dispersos como subtareas o issues en Jira (típicamente 100+). Para leer, ejecutar o marcar resultado de cada caso tienen que abrir una pestaña distinta en Jira. Es lento, fragmentado y se pierde contexto.

## Solución (MVP)

**Una sola vista centralizada** donde el QA puede:

1. Ver todos los test cases sincronizados desde Jira en una tabla rápida.
2. Filtrarlos por proyecto, status, tag Gherkin, automation status y búsqueda libre.
3. Expandir cualquier caso en un panel lateral para leer el Gherkin sin salir de la app.
4. Ejecutar el caso manualmente y marcar resultado (Pass / Fail / Blocked).
5. Si falla, crear el bug en Jira con un click, ya linkeado al test case.
6. Ver KPIs (totales, pass rate, automation coverage) siempre visibles arriba.
7. Exportar la vista filtrada a CSV.

No incluye en este MVP: edición/creación de Gherkin desde la app, import de `.feature`, bulk create en Jira, integración con runners de automation. Esos quedan en "Next steps".

---

## Stack

### Frontend
- React + TypeScript + Vite
- React Router (2 rutas)
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS
- UI en español, código en inglés

### Backend
- ASP.NET Core 10 (.NET 10) — usar este naming, no "ASP.NET Core .NET Core 10"
- Web API REST
- Entity Framework Core + Npgsql + PostgreSQL
- HttpClientFactory para Jira
- **Librería `Gherkin` de Cucumber (NuGet)** para parsear — no escribir parser propio
- Swagger en Development, health checks, CORS configurado
- Logging estructurado con redacción de tokens

### Infra
- PostgreSQL local en `docker-compose.yml`
- Soportar `DATABASE_URL` (formato Railway) y connection string tradicional
- Migraciones EF Core

---

## UX — Una sola pantalla principal

La app tiene **2 rutas**: `/test-cases` (todo el trabajo) y `/settings` (estado de conexión y configuración read-only).

### Layout de `/test-cases`

```
┌─────────────────────────────────────────────────────────────────┐
│  Top bar: logo + [Sincronizar desde Jira] + link Settings       │
├─────────────────────────────────────────────────────────────────┤
│  KPIs sticky (6 cards): Total · Pass rate · Failed · Blocked    │
│                          · Not run · Automation coverage        │
├──────────────┬──────────────────────────────────────────────────┤
│              │  Buscador + botón Exportar CSV                   │
│  Filtros     ├──────────────────────────────────────────────────┤
│  (panel      │                                                  │
│  izquierdo,  │  Tabla de test cases (paginada)                  │
│  colapsable) │  - Click en fila → abre Drawer derecho           │
│              │                                                  │
│  • Proyecto  │                                                  │
│  • Status    │                                                  │
│  • Tag       │                                                  │
│  • Automat.  │                                                  │
│  • [▸ Más]   │                                                  │
└──────────────┴──────────────────────────────────────────────────┘

Drawer lateral derecho (cuando se selecciona un caso):
  Tabs: [Gherkin] [Ejecutar] [Historial]
  - Gherkin: render monoespaciado + link externo a Jira
  - Ejecutar: form con resultado, comentario, evidencia, [✓] crear bug
  - Historial: tabla de ejecuciones previas con link al bug Jira si existe
```

**Reglas clave de UX:**

- El "dashboard" NO es una pantalla aparte: son los KPIs sticky arriba de la tabla.
- "Ejecuciones" NO es una pantalla aparte: vive en el tab "Historial" del drawer.
- "Sincronizar desde Jira" es un botón que abre un modal con input JQL y botón "Sincronizar".
- Filtros por default visibles: Proyecto, Status, Tag, Automation status. El resto (assignee, priority, label, parent) detrás de un toggle "Más filtros".
- Tabla compacta: columnas Jira Key · Summary · Tags · Status · Automation · Last Result · Acciones.
- Badges de color consistentes vía clases Tailwind para resultados y automation status.

### Layout de `/settings`

Read-only. Mostrar:
- Estado backend / DB.
- Modo Jira actual: `mock` o `real`.
- Jira base URL configurada (sin mostrar token).
- Project key default.
- Texto explicativo de variables de entorno requeridas.

---

## Estructura del repo

```txt
qa-test-case-hub/
  README.md
  docker-compose.yml
  .gitignore
  backend/
    QaTestCaseHub.sln
    src/QaTestCaseHub.Api/
      Controllers/
      Data/              # DbContext, migrations
      Domain/            # Entities, enums
      Dtos/
      Services/
        Jira/            # IJiraClient, JiraClient, JiraMockClient
        Gherkin/         # Wrapper sobre librería Cucumber
      Configuration/
      Middleware/
      Program.cs
      appsettings.json
      .env.example
    tests/QaTestCaseHub.Tests/
  frontend/
    package.json
    vite.config.ts
    tsconfig.json
    index.html
    .env.example
    src/
      main.tsx
      App.tsx
      api/               # API client + hooks de TanStack Query
      components/        # UI reutilizable (Badge, Drawer, Modal, etc.)
      features/
        testCases/       # Tabla, filtros, drawer detalle, ejecución
        settings/
      lib/
      routes/
      types/
      styles/
```

Un solo proyecto backend. No sobreingenierizar.

---

## Modelo de datos

Solo 2 entidades. Snake_case en PostgreSQL, PascalCase en C#.

### TestCase

```txt
id: Guid
jira_issue_id: string nullable
jira_issue_key: string unique
project_key: string
parent_issue_key: string nullable
summary: string
feature_name: string nullable
scenario_name: string nullable
gherkin_text: text
tags: jsonb            # ["@smoke", "@login"]
labels: jsonb
priority: string nullable
jira_status: string nullable
assignee_display_name: string nullable
automation_status: string   # ManualOnly | ReadyToAutomate | InAutomation | Automated | Flaky | Deprecated
last_execution_result: string nullable   # NotRun | Pass | Fail | Blocked
last_executed_at: timestamp nullable
last_synced_at: timestamp nullable
created_at: timestamp
updated_at: timestamp
```

### TestExecution

```txt
id: Guid
test_case_id: Guid (FK)
result: string         # Pass | Fail | Blocked
executed_by: string nullable
comment: text nullable
evidence_url: string nullable
evidence_text: text nullable
jira_bug_key: string nullable    # Si se creó bug en Jira
finished_at: timestamp
created_at: timestamp
```

**No incluir** `ImportBatch`, `ImportBatchItem`, ni `JiraSyncLog` en este MVP. Logging estructurado alcanza.

---

## API REST

Base path: `/api`

### Health
```http
GET /api/health
→ { "status": "ok", "database": "ok", "jiraMode": "mock|real" }
```

### Dashboard KPIs
```http
GET /api/dashboard/summary
→ { totalTestCases, notRun, passed, failed, blocked, automated, manualOnly,
    readyToAutomate, passRate, automationCoverage }
```

### Test cases
```http
GET    /api/test-cases?projectKey=&status=&tag=&automationStatus=&search=&page=&pageSize=&sortBy=&sortDirection=
GET    /api/test-cases/{id}
PATCH  /api/test-cases/{id}/automation-status   # body: { automationStatus }
```

(No incluir POST/PUT/DELETE de test cases en este MVP — los casos vienen de Jira vía sync.)

### Jira sync
```http
POST /api/jira/sync
body: { "jql": "project = ABC ORDER BY updated DESC", "maxResults": 200 }
```
Comportamiento: ejecuta JQL → trae issues → parsea Gherkin con librería Cucumber → upsert local por `jira_issue_key` → devuelve `{ totalFetched, created, updated, errors }`.

### Ejecuciones
```http
POST /api/test-cases/{id}/executions
body: {
  "result": "Fail",
  "executedBy": "QA Tester",
  "comment": "...",
  "evidenceUrl": "...",
  "evidenceText": "...",
  "createBug": true,
  "bugSummary": "...",
  "bugDescription": "..."
}

GET /api/test-cases/{id}/executions
```
Si `createBug=true` y `result=Fail`: crear bug en Jira, intentar linkearlo al test case (link type `Relates` si está disponible), guardar `jira_bug_key` en la ejecución. Si el link falla pero el bug se creó, devolver warning, no error.

### Export
```http
GET /api/exports/test-cases.csv?[mismos filtros que GET /api/test-cases]
```

---

## Integración Jira

Servicio backend `IJiraClient` con dos implementaciones: `JiraClient` (real) y `JiraMockClient`. Inyectar según config.

### Auth
Basic Auth con email + API token. Credenciales viven solo en backend, nunca expuestas al frontend.

### Endpoints Jira a usar (Cloud REST API v3)
- Search JQL: usar endpoint actual recomendado por Jira (preferir `/rest/api/3/search/jql` enhanced search).
- Get issue: `/rest/api/3/issue/{key}`.
- Create bug: `/rest/api/3/issue` con `issuetype = JIRA_BUG_ISSUE_TYPE`.
- Issue link: `/rest/api/3/issueLink` (manejar 404 si el tipo de link no existe).

### Formato `description`
Jira Cloud usa ADF (Atlassian Document Format). Implementar helper mínimo `ToAdf(text)` que envuelva el texto como bloque preformateado/codeblock. Usarlo para descripciones de bugs creados desde la app.

### Lectura de Gherkin desde Jira
- Si `JIRA_GHERKIN_FIELD=description`: extraer texto plano del ADF del campo `description` del issue.
- Si apunta a un custom field textarea: leer ese campo como texto.
- Pasar el texto al parser Cucumber y guardar `feature_name`, `scenario_name`, `tags` en la entidad.

### Manejo de errores Jira
- 401/403 → `JIRA_AUTH_FAILED`
- 429 → `JIRA_RATE_LIMITED` (devolver retry-after si Jira lo envía)
- 404 → mensaje claro de "issue/field no encontrado"
- Otros → log + error 500 con código genérico

---

## Mock mode automático

Reglas:
- Si `JIRA_MOCK_MODE=true` → siempre mock.
- Si faltan `JIRA_BASE_URL` / `JIRA_EMAIL` / `JIRA_API_TOKEN` → mock automático, log warning al arrancar.
- Si todo está configurado pero Jira responde error de auth en el primer ping → log + seguir en modo real (no fallback silencioso a mock para evitar confusión).

El `JiraMockClient` debe:
- Devolver al menos **25 test cases** variados, con tags `@smoke`, `@regression`, `@login`, `@api`, `@mobile`.
- Variedad de statuses (`To Do`, `In Progress`, `Done`) y automation statuses.
- Al crear bug en mock, devolver un key fake (`MOCK-{n}`) y guardar en memoria.

Ejemplos de Gherkin mock (incluir varios así, mezclando inglés y español):

```gherkin
@smoke @login
Feature: Autenticación
Scenario: Login exitoso con credenciales válidas
  Given el usuario está en la pantalla de login
  When ingresa email y contraseña válidos
  Then debería acceder al dashboard
```

```gherkin
@api @regression
Feature: Users API
Scenario: Create user via API
  Given a valid auth token
  When I send POST to /users
  Then the API should respond with 201
```

---

## Variables de entorno

### Backend (`.env.example`)
```env
ASPNETCORE_ENVIRONMENT=Development
DATABASE_URL=postgresql://user:password@localhost:5432/qa_test_case_hub
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=qa@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=ABC
JIRA_BUG_ISSUE_TYPE=Bug
JIRA_GHERKIN_FIELD=description
JIRA_MOCK_MODE=false
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend (`.env.example`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## Validaciones y manejo de errores

Formato estándar de error:
```json
{ "error": { "code": "JIRA_AUTH_FAILED", "message": "...", "details": {} } }
```

Códigos:
- `JIRA_AUTH_FAILED`, `JIRA_RATE_LIMITED`, `JIRA_NOT_CONFIGURED`
- `VALIDATION_ERROR`, `DATABASE_ERROR`, `NOT_FOUND`

Validaciones obligatorias:
- Ejecución: `result` debe ser uno de los valores válidos. Si `createBug=true`, `bugSummary` es requerido.
- JQL en sync: no vacío, max 2000 chars.

---

## Tests

Tests backend mínimos:
- `JiraMockClient` devuelve ≥25 casos con tags esperados.
- Wrapper Gherkin extrae correctamente `featureName`, `scenarioName` y `tags` (inglés y español).
- POST execution con `createBug=true` y `result=Fail` llama a `IJiraClient.CreateBugAsync`.
- POST execution con `result=Pass` NO llama a `CreateBugAsync` aunque `createBug=true`.
- GET test-cases respeta filtros de tag y projectKey.

Tests frontend (si hay tiempo, no bloqueante):
- Render tabla con datos mock.
- Filtro por tag actualiza la query.

---

## Documentación

Solo `README.md` con:
- Descripción del producto.
- Stack.
- Cómo correr localmente (backend + frontend + docker-compose).
- Cómo configurar Jira y cómo usar mock mode.
- Variables de entorno (referencia a `.env.example`).
- Cómo correr migraciones (`dotnet ef database update`).
- Cómo correr tests.
- **Next steps** explícitos (sección al final): editor Gherkin in-app, import `.feature`, bulk create en Jira, dashboard de tendencias, integración con runners de automation (Cucumber/JUnit), OAuth en lugar de Basic Auth, soporte para Xray/Zephyr.

Swagger en dev cubre la doc de API. No crear `architecture.md` ni `api.md` separados.

---

## Orden de implementación

1. Estructura del repo + `.gitignore` + `docker-compose.yml`.
2. Backend ASP.NET Core 10 scaffolding + EF Core + PostgreSQL + health checks + Swagger + CORS.
3. Entidades `TestCase` y `TestExecution` + DbContext + primera migración.
4. `IJiraClient` + `JiraMockClient` con 25+ casos seed.
5. Wrapper de Cucumber Gherkin (`GherkinParserService` que delega en la librería).
6. Endpoints: `/health`, `/dashboard/summary`, `/test-cases` (GET list + GET by id), `/jira/sync` (con mock), `/test-cases/{id}/executions` (POST + GET), `/exports/test-cases.csv`.
7. `JiraClient` real con Basic Auth, búsqueda JQL, get issue, create bug, link issue.
8. Frontend Vite + React + TS + Tailwind + TanStack Query + React Router (2 rutas).
9. Layout: top bar + KPIs sticky + filtros izquierda + tabla central + drawer derecho.
10. Vista `/test-cases` con tabla paginada, filtros, búsqueda libre.
11. Drawer con tabs Gherkin / Ejecutar / Historial.
12. Modal "Sincronizar desde Jira" con input JQL.
13. Botón "Exportar CSV" (descarga del backend con filtros aplicados).
14. Vista `/settings` read-only.
15. Tests backend.
16. README.

---

## Criterios de éxito del MVP

Al terminar, demoable sin Jira real (usando mock mode) y con Jira real:

- ✅ Levanto backend y frontend localmente sin errores.
- ✅ Sin credenciales Jira veo 25+ casos mock en la tabla.
- ✅ Con credenciales Jira ejecuto un JQL y se sincronizan issues a la base local.
- ✅ Veo 100+ test cases en una sola tabla sin abrir múltiples tabs.
- ✅ Filtro por proyecto, status, tag (`@smoke`, `@regression`) y automation status.
- ✅ Click en un caso → drawer derecho con Gherkin renderizado legible.
- ✅ Ejecuto un caso, marco resultado, agrego comentario y evidencia.
- ✅ Marco un caso como Fail con "crear bug" → se crea bug en Jira (o mock), se linkea al test case, queda guardado en el historial.
- ✅ Cambio automation status de un caso desde el drawer.
- ✅ Exporto la vista filtrada actual a CSV.
- ✅ Veo KPIs sticky arriba que reflejan los filtros aplicados (o globales — documentar decisión).
- ✅ `/settings` muestra estado de backend, DB y modo Jira correctamente.

---

## Requisitos de calidad

- Código compila sin warnings críticos.
- Sin pseudocódigo ni TODOs en features del MVP.
- DTOs separados de entidades EF.
- Async/await consistente.
- Paginación en lista de test cases.
- Tokens redactados en logs.
- `JIRA_API_TOKEN` nunca llega al frontend.
- CORS solo permite `FRONTEND_ORIGIN`.
- Errores devuelven el formato estándar definido arriba.
- UI prolija, badges consistentes, sin colores hardcodeados fuera de Tailwind.
- README suficiente para que otro dev clone, levante y demuestre la app en <10 minutos.
