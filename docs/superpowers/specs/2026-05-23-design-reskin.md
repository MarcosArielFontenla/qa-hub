# Spec — Reskin visual del QA Test Case Hub (a partir del diseño Claude Design)

Fecha: 2026-05-23
Estado: aprobado por el usuario (Marcos) en brainstorming.

## Contexto

Existe un diseño hecho en Claude Design (`QA Test Case Hub — Print.pdf`, 3 pantallas:
Dashboard, Test Cases, Settings) más rico que el MVP v2 actual (2 rutas: `/test-cases`,
`/settings`, con top bar, KPIs sticky, tabla, drawer flotante, filtros y modal de sync).
La paleta del diseño (fondo lavanda, acento violeta, tarjetas suaves, badges de color) ya
coincide con el theme Tailwind existente.

## Objetivo

Aplicar el **look** del diseño a la app actual **sin agregar backend ni pantallas nuevas**
(reskin visual). Mantener la arquitectura: frontend React/TS + Tailwind, 2 rutas, TanStack
Query, mismos endpoints y modelo de datos.

## Decisiones bloqueadas (del brainstorming)

1. **Alcance:** reskin visual only. Sin endpoints nuevos, sin entidades nuevas, sin datos inventados.
2. **Layout `/test-cases`:** híbrido — tabla ancha escaneable (full width sin selección) + panel
   de detalle inline a la derecha al seleccionar una fila (reemplaza el drawer flotante). Filtros
   en barra horizontal arriba.
3. **Sidebar:** limpio — logo + etiqueta workspace ("QA · SCRUM") + nav real (Test cases, Settings)
   + tarjeta de pie neutra. Sin proyectos/bugs/ejecuciones/favoritos ni datos falsos.

## Alcance — qué se construye

### Layout (`src/layout/AppLayout.tsx`)
- Reemplazar el top bar por **sidebar fija** a la izquierda: marca (logo "QA Test Case Hub" +
  "QA · SCRUM"), nav con íconos + estado activo (Test cases, Settings), tarjeta de pie neutra
  (marca, sin nombre de persona). Colapsa a strip superior en pantallas chicas (`lg` breakpoint).
- Contenido a la derecha del sidebar. Header de página delgado dentro de cada vista.

### `/test-cases` (`src/features/testCases/`)
- **Header de página:** título + **pill mock/real** (de `getHealth`) + botones Sincronizar (abre
  el modal existente) y Exportar CSV.
- **KPIs sticky** (`KpiCards.tsx`): mismo set de 6, restyleados con ícono + sublabel calculado de
  `DashboardSummaryDto` real (ej.: Pass rate → "{passed}/{passed+failed+blocked} corridos";
  Automation → "{automated} automatizados"; Failed/Blocked/Not run → etiqueta descriptiva). Sin
  sublabels inventados (nada de "en 5 proyectos" ni "7 bugs en Jira").
- **Barra de filtros horizontal** (refactor de `TestCasesFilters.tsx`): Proyecto · Status · Tag ·
  Automation · Resultado + búsqueda. Toggle "Más filtros" para extra (assignee/priority/label/parent).
- **Tabla** (`TestCasesTable.tsx`): restyle (chip de key, summary, chips de tags, badges). Full width
  sin selección; se angosta cuando hay un caso seleccionado. Paginación se mantiene.
- **Panel de detalle inline** (renombrar `TestCaseDetailDrawer.tsx` → `TestCaseDetailPanel.tsx`):
  el contenido del drawer actual pasa a panel fijo a la derecha (no overlay). Header (key, tags,
  feature, assignee, status, result, selector Automation) + tabs Gherkin/Ejecutar/Historial +
  "Última ejecución" con link al bug. Botón "Copiar" para el Gherkin.

### Gherkin con syntax highlight (`src/features/testCases/gherkinHighlight.tsx` — nuevo)
- Función pura + componente que tokeniza por regex y envuelve en spans con clases de color:
  `@tags`, `Feature/Característica/Funcionalidad`, `Scenario/Escenario`, `Given/Dado`,
  `When/Cuando`, `Then/Entonces`, `And/But/Y/Pero`. Sin dependencias nuevas. Render dentro de un
  `<pre>` con el fondo oscuro actual.

### `/settings` (`src/features/settings/SettingsPage.tsx`)
- Restyle al look del diseño usando **solo datos disponibles**:
  - **Health:** Backend API, PostgreSQL, Jira con pills de estado desde `getHealth`
    (`status`, `database`, `jiraMode`).
  - **Conexión Jira:** campos de `getJiraSettings` (modo, base URL, project key, bug issue type,
    gherkin field) con pills ok/missing. Email no se expone hoy → se omite o se muestra "—".
  - **Bloque `.env.example`** estático (texto público de plantilla).
- Mantener heading "Configuración" y los textos que valida `SettingsPage.test.tsx`
  (`Integraciones operativas`, `JQL recomendado`, el JQL recomendado, `Crear bug al fallar`,
  ausencia de `Variables backend`) — o actualizar el test si cambian.

### Estilos (`src/styles/index.css`, `tailwind.config.js`)
- Clases `.gherkin-*` para el highlight. Reusar tokens existentes (accent, emerald/red/amber/zinc).
  Agregar tokens sólo si hace falta.

## Fuera de alcance (documentado, NO se construye)

Pantalla Dashboard; nav Bugs abiertos / Ejecuciones / Favoritos; lista de proyectos con contadores;
"Por proyecto"; "Fallas recientes"; "Tags Gherkin" cloud; "Actividad reciente"; saludo/usuario real;
métricas de DB (filas, migración) y build/commit en Settings. Todo eso requiere backend nuevo y/o
reintroduce lo removido en v2 → es el salto a "diseño completo" descartado.

## Data flow

Sin cambios. Mismos hooks/llamadas: `getDashboardSummary` (KPIs), `getTestCases`, `syncJira`,
`updateAutomationStatus`, `getExecutions`, `createExecution`, `getHealth`, `getJiraSettings`,
`exportCsvUrl`. La selección de caso es estado local en `TestCasesPage`.

## Testing / calidad

- `npm run build` (tsc) y `npm run test` (vitest) verdes.
- Nuevo test unitario del highlighter de Gherkin (función pura).
- Ajustar `SettingsPage.test.tsx` y `TestCasesTable.test.tsx` si cambian headings/estructura.
- Sin tocar backend, modelo de datos ni migraciones.

## Riesgos / notas

- Responsive del layout de 3 columnas (sidebar + tabla + detalle) en pantallas medianas: el panel
  de detalle debe degradar a overlay/stack por debajo de cierto breakpoint.
- El folder no es repo git en este entorno; el usuario commitea/pushea a GitHub manualmente.
