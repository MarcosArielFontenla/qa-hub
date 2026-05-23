# Prompt para Codex — MVP “QA Test Case Hub for Jira”

Copia y pega este prompt completo en Codex desde la raíz de un repositorio vacío.

---

## Rol

Actúa como un senior full-stack engineer especializado en QA tooling, Jira integrations, React, TypeScript, ASP.NET Core y PostgreSQL.

Quiero que construyas un MVP llamado **QA Test Case Hub for Jira**: una app interna para QA Manual, QA Automation y QA Leads que permita visualizar, filtrar, editar, importar, subir y ejecutar test cases escritos en Gherkin, integrándose con Jira Cloud mediante API.

No hagas preguntas antes de empezar. Si algo no está definido, tomá una decisión razonable, documentala en el README y seguí construyendo.

---

## Objetivo del producto

El problema principal es que los QA tienen muchos test cases dispersos en Jira, por ejemplo 100 subtareas o issues diferentes, y hoy tienen que abrirlos uno por uno para leerlos, actualizarlos o ejecutarlos.

La app debe centralizar ese trabajo en una única interfaz:

- Buscar test cases desde Jira usando JQL.
- Ver todos los test cases en una tabla rápida.
- Expandir cada caso para leer el Gherkin sin abrir Jira.
- Filtrar por proyecto, epic, story, status, assignee, priority, labels, tags Gherkin y automation status.
- Crear o actualizar test cases en Jira desde la app.
- Importar Gherkin pegado manualmente o desde archivos `.feature`.
- Ejecutar manualmente test cases con estados Pass, Fail, Blocked y Not Run.
- Crear bugs en Jira automáticamente cuando un test case falla.
- Exportar test cases a CSV y a `.feature`.

Construí esto como MVP en tres fases, pero dejá el código listo para evolucionar.

---

## Stack obligatorio

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query para llamadas HTTP y cache de datos
- Axios o Fetch wrapper propio
- React Hook Form + Zod para formularios y validaciones
- Tailwind CSS para estilos
- Componentes reutilizables propios
- UI en español
- Código, nombres de variables, carpetas y tipos en inglés

### Backend

- ASP.NET Core con .NET 10
- Web API REST
- Entity Framework Core
- PostgreSQL
- Npgsql
- Swagger / OpenAPI habilitado en desarrollo
- FluentValidation o validaciones explícitas equivalentes
- HttpClientFactory para llamadas a Jira
- Logging estructurado básico
- Health checks
- CORS configurado para el frontend

Nota: usar el naming actual de Microsoft: `.NET 10` y `ASP.NET Core 10`. Evitar nombrarlo como “.NET Core 10” en documentación interna, aunque el usuario lo mencione así.

### Base de datos

- PostgreSQL en Railway para producción.
- Soportar `DATABASE_URL` estilo Railway.
- Soportar también connection string local tradicional para desarrollo.
- Incluir migraciones de Entity Framework.
- Incluir `docker-compose.yml` para desarrollo local con PostgreSQL.

---

## Estructura esperada del repositorio

Crear una estructura similar a esta:

```txt
qa-test-case-hub/
  README.md
  docker-compose.yml
  .gitignore
  docs/
    architecture.md
    api.md
    jira-mapping.md
  backend/
    QaTestCaseHub.sln
    src/
      QaTestCaseHub.Api/
        Controllers/
        Data/
        Domain/
        Dtos/
        Services/
          Jira/
          Gherkin/
          Export/
          Dashboard/
        Configuration/
        Middleware/
        Program.cs
        appsettings.json
        appsettings.Development.json
        .env.example
    tests/
      QaTestCaseHub.Tests/
  frontend/
    package.json
    vite.config.ts
    tsconfig.json
    index.html
    .env.example
    src/
      main.tsx
      App.tsx
      api/
      components/
      features/
        dashboard/
        testCases/
        imports/
        executions/
        settings/
      hooks/
      layout/
      lib/
      routes/
      types/
      styles/
```

No sobreingenierizar con demasiados proyectos backend. Un solo proyecto API con carpetas claras está bien para el MVP, más un proyecto de tests.

---

## Fases del MVP

### Fase 1 — Visualización centralizada desde Jira

Implementar completamente esta fase primero.

Features:

1. Pantalla de configuración Jira.
2. Conexión a Jira usando variables de entorno del backend.
3. Búsqueda por JQL.
4. Sincronización de issues desde Jira hacia la base local.
5. Tabla de test cases.
6. Filtros por:
   - project key
   - parent/story key
   - status
   - assignee
   - priority
   - label
   - tag Gherkin
   - automation status
   - texto libre
7. Vista detalle en drawer o panel lateral.
8. Renderizado legible del Gherkin.
9. Exportación CSV.
10. Modo mock/demo si no existen credenciales Jira.

Criterio de éxito Fase 1:

- Puedo correr frontend y backend localmente.
- Puedo ver datos mock si no configuré Jira.
- Puedo configurar credenciales Jira por env vars.
- Puedo ejecutar un JQL y traer issues.
- Puedo ver 100 test cases en una sola tabla.
- Puedo abrir un caso y leer su Gherkin sin abrir Jira.
- Puedo filtrar por tags como `@smoke`, `@regression`, `@login`.
- Puedo exportar la vista actual a CSV.

### Fase 2 — Crear, editar e importar test cases

Después de completar Fase 1, implementar Fase 2.

Features:

1. Editor Gherkin.
2. Linter/validador básico de Gherkin.
3. Importador por texto pegado.
4. Importador de archivo `.feature`.
5. Preview antes de subir a Jira.
6. Bulk create en Jira.
7. Bulk update en Jira.
8. Mapeo configurable de campos Jira.
9. Guardado en base local.
10. Manejo de errores por item en operaciones bulk.

Criterio de éxito Fase 2:

- Puedo pegar Gherkin con varios escenarios y parsearlo.
- Puedo ver preview de los casos detectados.
- La app avisa si falta `Feature`, `Scenario`, `Given`, `When` o `Then`.
- La app detecta tags Gherkin.
- Puedo crear issues/subtareas en Jira en lotes.
- Si hay más de 50 issues, el backend divide la creación en batches de máximo 50.
- Puedo actualizar el Gherkin de un test case existente.

### Fase 3 — Ejecución manual y puente hacia automation

Después de completar Fase 2, implementar Fase 3.

Features:

1. Modo ejecución manual de test case.
2. Estados:
   - Not Run
   - Pass
   - Fail
   - Blocked
3. Comentario de ejecución.
4. Evidencia por URL o texto en MVP.
5. Si el resultado es Fail, opción para crear bug en Jira.
6. Link entre bug creado y test case.
7. Dashboard con métricas.
8. Automation status:
   - ManualOnly
   - ReadyToAutomate
   - InAutomation
   - Automated
   - Flaky
   - Deprecated
9. Exportación a `.feature`.
10. Endpoint preparado para futura importación de resultados Cucumber/JUnit, aunque puede quedar como scaffold si no hay tiempo.

Criterio de éxito Fase 3:

- Puedo ejecutar manualmente un caso.
- Puedo guardar resultado, comentario y evidencia.
- Puedo crear un bug en Jira desde un caso fallido.
- Puedo ver dashboard con totales, pass rate, failed, blocked, not run y automation coverage.
- Puedo exportar casos seleccionados como `.feature`.

---

## Integración con Jira

Crear un servicio backend `JiraClient` usando `HttpClientFactory`.

Las credenciales Jira deben vivir solo en el backend. Nunca exponer token Jira al frontend.

Variables de entorno backend:

```env
ASPNETCORE_ENVIRONMENT=Development
DATABASE_URL=postgresql://user:password@localhost:5432/qa_test_case_hub
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=qa@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=ABC
JIRA_TEST_CASE_ISSUE_TYPE=Sub-task
JIRA_BUG_ISSUE_TYPE=Bug
JIRA_GHERKIN_FIELD=description
JIRA_PARENT_FIELD=parent
JIRA_LABELS_FIELD=labels
JIRA_MOCK_MODE=false
FRONTEND_ORIGIN=http://localhost:5173
```

Variables de entorno frontend:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### Autenticación Jira para el MVP

Para el MVP usar Basic Auth con email + API token desde backend.

Preparar la abstracción para que en el futuro pueda cambiarse a OAuth sin reescribir todo.

### Endpoints Jira que debe soportar el servicio

Usar la REST API actual de Jira Cloud v3. No hardcodear endpoints deprecated si la documentación actual indica otro endpoint.

Necesidades funcionales:

- Search issues by JQL.
- Get issue by key.
- Create issue.
- Bulk create issues.
- Update issue.
- Create bug issue.
- Link bug con test case, si el tipo de link está disponible.
- Obtener metadata mínima de issue types y fields si hace falta.

Notas importantes:

- Para búsquedas JQL, usar el endpoint actual recomendado por Jira Cloud. Preferir el enhanced JQL search actual si corresponde, por ejemplo `/rest/api/3/search/jql` cuando esté disponible.
- Para crear issues, usar `/rest/api/3/issue`.
- Para bulk create, usar `/rest/api/3/issue/bulk`.
- Jira Cloud permite crear hasta 50 issues por request bulk; implementar chunking de 50.
- Para subtareas, el payload debe incluir `parent` con key o id del parent issue.
- Para `description` en Jira Cloud usar Atlassian Document Format, no string plano.
- Si `JIRA_GHERKIN_FIELD=description`, guardar el Gherkin como bloque de código o texto preformateado en ADF.
- Si `JIRA_GHERKIN_FIELD` apunta a un custom field textarea, tratarlo también con el formato esperado por Jira.
- Si apunta a custom field de texto simple, usar string.
- Manejar rate limits y errores HTTP con mensajes claros.

### Modo mock/demo

Si `JIRA_MOCK_MODE=true` o faltan credenciales Jira:

- El backend debe devolver test cases mock realistas.
- Deben existir al menos 25 test cases mock.
- Incluir casos con tags `@smoke`, `@regression`, `@login`, `@api`, `@mobile`.
- Incluir varios statuses y automation statuses.
- El frontend debe funcionar completamente para demo sin Jira real.

---

## Modelo de datos PostgreSQL

Usar nombres de tablas en snake_case.

### Entity: TestCase

Campos sugeridos:

```txt
id: Guid
jira_issue_id: string nullable
jira_issue_key: string nullable unique
project_key: string
parent_issue_key: string nullable
parent_summary: string nullable
issue_type: string nullable
summary: string
feature_name: string nullable
scenario_name: string nullable
gherkin_text: text
tags: jsonb or text[]
labels: jsonb or text[]
priority: string nullable
jira_status: string nullable
assignee_display_name: string nullable
automation_status: enum/string
last_execution_result: enum/string nullable
last_executed_at: timestamp nullable
last_synced_at: timestamp nullable
created_at: timestamp
updated_at: timestamp
```

### Entity: TestExecution

```txt
id: Guid
test_case_id: Guid
result: enum/string // NotRun, Pass, Fail, Blocked
executed_by: string nullable
comment: text nullable
evidence_url: string nullable
evidence_text: text nullable
jira_bug_key: string nullable
started_at: timestamp nullable
finished_at: timestamp
created_at: timestamp
```

### Entity: ImportBatch

```txt
id: Guid
source_type: string // PastedText, FeatureFile, JiraSync
status: string // Pending, Completed, Failed, PartiallyFailed
requested_by: string nullable
total_items: int
success_count: int
failed_count: int
error_summary: text nullable
created_at: timestamp
completed_at: timestamp nullable
```

### Entity: ImportBatchItem

```txt
id: Guid
import_batch_id: Guid
summary: string
gherkin_text: text
status: string // Pending, Created, Updated, Failed
jira_issue_key: string nullable
error_message: text nullable
created_at: timestamp
```

### Entity: JiraSyncLog

```txt
id: Guid
jql: text
status: string
total_fetched: int
total_created: int
total_updated: int
error_message: text nullable
started_at: timestamp
finished_at: timestamp nullable
```

### Enums

```txt
AutomationStatus:
- ManualOnly
- ReadyToAutomate
- InAutomation
- Automated
- Flaky
- Deprecated

ExecutionResult:
- NotRun
- Pass
- Fail
- Blocked

ImportStatus:
- Pending
- Completed
- Failed
- PartiallyFailed
```

---

## Parser y validador Gherkin

Crear un servicio backend `GherkinParserService`.

Debe soportar Gherkin básico en inglés y español.

### Keywords inglés

- Feature
- Scenario
- Scenario Outline
- Examples
- Given
- When
- Then
- And
- But

### Keywords español

- Característica
- Funcionalidad
- Escenario
- Esquema del escenario
- Ejemplos
- Dado
- Cuando
- Entonces
- Y
- Pero

### Tags

Detectar tags que comiencen con `@`, por ejemplo:

```gherkin
@smoke @login
Scenario: Login exitoso
  Given el usuario está en la pantalla de login
  When ingresa credenciales válidas
  Then debería acceder al dashboard
```

### Validaciones mínimas

El linter debe devolver warnings y errors:

Errors:

- No hay `Feature` o equivalente.
- No hay ningún `Scenario`.
- Un scenario no tiene steps.
- Un `Scenario Outline` no tiene `Examples`.

Warnings:

- Scenario sin tags.
- Scenario sin `Given`.
- Scenario sin `When`.
- Scenario sin `Then`.
- Steps duplicados dentro del mismo scenario.
- Nombre de scenario vacío o demasiado genérico.
- Gherkin mayor a 10.000 caracteres.

### Output esperado del parser

```ts
interface ParsedGherkinDocument {
  featureName: string | null;
  scenarios: ParsedScenario[];
  tags: string[];
  errors: GherkinValidationMessage[];
  warnings: GherkinValidationMessage[];
}

interface ParsedScenario {
  name: string;
  type: 'Scenario' | 'ScenarioOutline';
  tags: string[];
  steps: ParsedStep[];
  examplesRaw?: string;
  rawText: string;
}

interface ParsedStep {
  keyword: string;
  text: string;
  line: number;
}
```

Implementar tipos equivalentes en C# y TypeScript.

---

## API REST backend

Base path: `/api`

### Health

```http
GET /api/health
```

Respuesta:

```json
{
  "status": "ok",
  "database": "ok",
  "jiraMode": "mock|real"
}
```

### Dashboard

```http
GET /api/dashboard/summary
```

Debe devolver:

```json
{
  "totalTestCases": 120,
  "notRun": 70,
  "passed": 30,
  "failed": 10,
  "blocked": 10,
  "automated": 20,
  "manualOnly": 80,
  "readyToAutomate": 20,
  "passRate": 75.0,
  "automationCoverage": 16.7
}
```

### Test cases

```http
GET /api/test-cases
```

Query params:

```txt
projectKey
parentIssueKey
status
assignee
priority
label
tag
automationStatus
executionResult
search
page
pageSize
sortBy
sortDirection
```

```http
GET /api/test-cases/{id}
POST /api/test-cases
PUT /api/test-cases/{id}
PATCH /api/test-cases/{id}/automation-status
DELETE /api/test-cases/{id}
```

### Jira sync

```http
POST /api/jira/sync
```

Body:

```json
{
  "jql": "project = ABC AND issuetype in ('Sub-task', 'Test') ORDER BY updated DESC",
  "maxResults": 200
}
```

Comportamiento:

- Buscar issues en Jira.
- Extraer summary, key, id, status, labels, priority, assignee, parent, description/custom field Gherkin.
- Parsear Gherkin.
- Upsert en base local por `jira_issue_key`.
- Devolver resumen.

### Gherkin parse/validate

```http
POST /api/gherkin/parse
```

Body:

```json
{
  "content": "Feature: Login\nScenario: Login exitoso\nGiven ..."
}
```

### Import preview

```http
POST /api/imports/preview
```

Body:

```json
{
  "sourceType": "PastedText",
  "content": "Feature: Login\n..."
}
```

Debe devolver scenarios detectados, errores y warnings.

### Bulk create in Jira

```http
POST /api/imports/bulk-create-jira
```

Body:

```json
{
  "projectKey": "ABC",
  "parentIssueKey": "ABC-123",
  "issueType": "Sub-task",
  "priority": "Medium",
  "labels": ["qa", "gherkin"],
  "items": [
    {
      "summary": "Login exitoso",
      "gherkinText": "Scenario: Login exitoso\nGiven ...",
      "tags": ["@smoke", "@login"]
    }
  ]
}
```

Debe:

- Validar items.
- Crear en Jira en batches de 50.
- Guardar `ImportBatch` e `ImportBatchItem`.
- Guardar o actualizar `TestCase` local.
- Devolver errores por item.

### Executions

```http
POST /api/test-cases/{id}/executions
GET /api/test-cases/{id}/executions
```

Body de ejecución:

```json
{
  "result": "Fail",
  "executedBy": "QA Tester",
  "comment": "Falló al validar credenciales inválidas",
  "evidenceUrl": "https://...",
  "evidenceText": "Screenshot adjunto en Jira",
  "createBug": true,
  "bugSummary": "Login permite acceso con contraseña inválida",
  "bugDescription": "Resultado actual vs esperado..."
}
```

Si `createBug=true` y `result=Fail`, crear bug en Jira y guardar `jira_bug_key`.

### Export

```http
GET /api/exports/test-cases.csv
GET /api/exports/test-cases.feature
```

Permitir filtros similares a `/api/test-cases`.

---

## Frontend

### Layout

Crear un layout con sidebar:

- Dashboard
- Test Cases
- Importar Gherkin
- Ejecuciones
- Settings

### Pantalla Dashboard

Mostrar cards:

- Total test cases
- Pass rate
- Failed
- Blocked
- Not run
- Automation coverage
- Manual only
- Ready to automate

Mostrar una tabla breve con últimos fallos.

### Pantalla Test Cases

Debe incluir:

- Input de búsqueda libre.
- Filtros por proyecto, parent/story, tag, status, result, automation status.
- Botón “Sincronizar desde Jira”.
- Campo JQL para sincronización.
- Tabla paginada.
- Botón exportar CSV.
- Botón exportar `.feature`.
- Panel lateral de detalle.

Columnas mínimas:

```txt
Jira Key
Summary
Feature
Scenario
Tags
Priority
Jira Status
Automation Status
Last Result
Last Executed At
Assignee
Actions
```

### Detalle del test case

Mostrar:

- Summary
- Jira issue key con link externo a Jira
- Parent issue
- Tags
- Labels
- Automation status editable
- Gherkin renderizado con formato monoespaciado
- Botón editar
- Botón ejecutar
- Historial de ejecuciones

### Editor Gherkin

Para MVP usar `<textarea>` monoespaciado si no se quiere incorporar Monaco.

Debe incluir:

- Preview/linter en vivo llamando al backend o validando localmente si se implementa helper.
- Lista de errores y warnings.
- Botón guardar.

### Pantalla Importar Gherkin

Debe incluir:

- Textarea grande para pegar Gherkin.
- Input file para `.feature`.
- Botón “Analizar”.
- Preview de scenarios detectados.
- Errores/warnings por scenario.
- Campos para project key, parent issue key, issue type, labels, priority.
- Botón “Crear en Jira”.
- Resultado por item.

### Pantalla Ejecuciones

Puede ser simple:

- Tabla de últimas ejecuciones.
- Filtros por resultado.
- Link al test case.
- Link al bug Jira si existe.

### Pantalla Settings

Mostrar:

- Estado de backend.
- Estado de DB.
- Modo Jira: mock o real.
- Jira base URL configurada, sin mostrar token.
- Project key por default.
- Texto explicativo de variables de entorno necesarias.

---

## UX y diseño

La UI debe ser simple, clara y profesional.

Usar textos en español:

- “Casos de prueba”
- “Sincronizar desde Jira”
- “Importar Gherkin”
- “Ejecutar caso”
- “Resultado”
- “Evidencia”
- “Crear bug en Jira”
- “Automatización”
- “Listo para automatizar”

Estados visuales:

- Pass: badge
- Fail: badge
- Blocked: badge
- Not Run: badge
- Automated: badge
- Flaky: badge

No usar colores hardcodeados excesivamente. Usar clases Tailwind consistentes.

---

## Seguridad y buenas prácticas

- Nunca exponer `JIRA_API_TOKEN` al frontend.
- No commitear secretos.
- Incluir `.env.example`, no `.env` real.
- Redactar tokens en logs.
- Validar inputs de usuario.
- Manejar errores con responses consistentes.
- Evitar que errores internos muestren stack traces en producción.
- Configurar CORS desde `FRONTEND_ORIGIN`.
- Usar paginación.
- Usar async/await correctamente.
- Usar DTOs, no exponer entidades EF directamente.
- No usar datos fake cuando `JIRA_MOCK_MODE=false`, salvo que Jira falle y el usuario active mock mode.

---

## Manejo de errores

Crear un formato estándar:

```json
{
  "error": {
    "code": "JIRA_AUTH_FAILED",
    "message": "No se pudo autenticar con Jira. Revisá JIRA_EMAIL y JIRA_API_TOKEN.",
    "details": {}
  }
}
```

Errores esperados:

- `JIRA_AUTH_FAILED`
- `JIRA_RATE_LIMITED`
- `JIRA_NOT_CONFIGURED`
- `JIRA_FIELD_MAPPING_ERROR`
- `GHERKIN_PARSE_ERROR`
- `VALIDATION_ERROR`
- `DATABASE_ERROR`
- `IMPORT_BATCH_FAILED`

---

## Testing

Agregar tests backend para:

- Parser Gherkin en inglés.
- Parser Gherkin en español.
- Tags múltiples.
- Scenario Outline sin Examples.
- Validación de scenario sin Then.
- Chunking de bulk create en batches de 50.
- Conversión básica de Gherkin a ADF si se guarda en description.

Agregar tests frontend básicos si el tiempo lo permite:

- Render de tabla de test cases.
- Filtro por tag.
- Pantalla import preview.

---

## Seed/mock data

Crear mock data realista para demo:

Ejemplos:

```gherkin
@smoke @login
Feature: Autenticación

Scenario: Login exitoso con credenciales válidas
  Given el usuario está en la pantalla de login
  When ingresa email y contraseña válidos
  Then debería acceder al dashboard
```

```gherkin
@regression @login
Feature: Autenticación

Scenario: Login fallido con contraseña inválida
  Given el usuario está en la pantalla de login
  When ingresa una contraseña inválida
  Then debería ver un mensaje de error
```

```gherkin
@api @regression
Feature: Usuarios

Scenario: Crear usuario por API
  Given existe un token de autenticación válido
  When envío una solicitud POST a /users
  Then la API debería responder 201
```

Generar al menos 25 casos variados.

---

## Documentación obligatoria

Crear `README.md` con:

- Descripción del producto.
- Stack.
- Cómo correr localmente.
- Cómo correr con Docker Compose.
- Cómo configurar Railway PostgreSQL.
- Cómo configurar Jira.
- Variables de entorno.
- Cómo usar mock mode.
- Cómo ejecutar migraciones.
- Cómo ejecutar tests.
- Limitaciones conocidas del MVP.
- Próximos pasos.

Crear `docs/architecture.md` con:

- Diagrama textual de componentes.
- Flujo frontend → backend → Jira.
- Flujo backend → PostgreSQL.
- Decisiones técnicas.

Crear `docs/api.md` con:

- Lista de endpoints.
- Ejemplos request/response.

Crear `docs/jira-mapping.md` con:

- Cómo se mapea un test case a Jira.
- Cómo se guarda Gherkin en description o custom field.
- Cómo se crean subtareas.
- Cómo se crean bugs.
- Limitaciones de campos custom.

---

## Implementación esperada paso a paso

Trabajá en este orden:

1. Crear estructura del repo.
2. Crear backend ASP.NET Core .NET 10.
3. Configurar PostgreSQL, EF Core, migrations y health checks.
4. Crear entidades, DTOs y DbContext.
5. Crear servicios mock.
6. Crear parser Gherkin y tests.
7. Crear JiraClient con abstracción e implementación real/mock.
8. Crear endpoints Fase 1.
9. Crear frontend Vite React TypeScript.
10. Crear layout, routing y API client.
11. Crear Dashboard.
12. Crear Test Cases page con tabla, filtros y detalle.
13. Crear sync desde Jira.
14. Crear export CSV.
15. Implementar Fase 2: import, preview, editor, bulk create/update.
16. Implementar Fase 3: execution, bug creation, dashboard metrics, feature export.
17. Agregar documentación.
18. Ejecutar tests y corregir errores.
19. Verificar que `dotnet test`, `dotnet run`, `npm install` y `npm run dev` funcionen.

---

## Requisitos de calidad

- El código debe compilar.
- No dejar pseudocódigo.
- No dejar TODOs críticos en features principales.
- Si una integración real no puede completarse sin credenciales, implementar la interfaz y mock mode funcional.
- Mantener una arquitectura clara, pero no enterprise-overengineered.
- Frontend usable y prolijo.
- Backend con errores claros.
- Documentación suficiente para que otro dev pueda correrlo.
- El MVP debe poder demostrarse sin Jira real usando mock mode.

---

## Resultado final esperado

Al terminar, quiero un repo funcional con:

- Frontend React + TypeScript + Vite.
- Backend ASP.NET Core .NET 10.
- PostgreSQL local y compatible con Railway.
- Jira API client real y mock.
- Parser/validador Gherkin.
- Tabla centralizada de test cases.
- Filtros.
- Vista detalle.
- Import preview.
- Bulk create/update en Jira.
- Ejecución manual.
- Creación de bugs en Jira.
- Dashboard.
- Export CSV y `.feature`.
- README y docs.
- Tests básicos.

Priorizá que Fase 1 esté sólida. Después implementá Fase 2 y Fase 3. Si alguna parte de Fase 3 requiere más decisiones, dejá la base implementada y documentá claramente la limitación.
