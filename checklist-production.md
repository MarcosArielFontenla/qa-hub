# Checklist de producción — QA Test Case Hub

> Documento de handover y roadmap. Marca qué falta para entregar el repo **listo y productivo**
> al equipo de QA y al QA Lead, fase por fase, sin credenciales ni datos sensibles nuestros.

---

## TL;DR

**Qué es la app.** Una vista centralizada para QA Manual / QA Leads: trae los test cases en Gherkin
que viven en Jira Cloud a una sola pantalla, los deja filtrar, ejecutar (Pass / Fail / Blocked /
Not run), reportar el bug en Jira con un click, y ver KPIs y actividad — sin saltar entre pestañas.

**Qué está listo hoy.**
- 3 pantallas funcionando con **data real de Jira**: Dashboard, Test cases (con drawer
  Gherkin / Ejecutar / Historial), Settings.
- Sincronización real desde Jira vía modal con JQL.
- Diseño aplicado (`soft.css`) y conectado a la API.
- Backend (.NET 10) + frontend (React 19) compilando; tests verdes (backend 18/18, frontend vitest).
- **Sin secretos en el repo**: el `.env` está gitignoreado y nunca estuvo en el historial; no hay
  URL ni token reales en archivos trackeados (verificado).

**Definición de "listo para entregar".**
El equipo de QA **clona el repo, pone _sus_ credenciales de Jira en `backend/src/API/.env`,
corre backend + frontend, y ve _sus_ datos** en QA Hub. Lo corren ellos (local o en una VM/Railway
propia). **No** incluye hosting administrado por nosotros ni login multiusuario (ver _Fuera de alcance_).

**Qué falta** (resumen): documentación de onboarding actualizada, simplificar Settings a solo health,
completar las secciones Bugs abiertos y Ejecuciones, sacar Favoritos, y un pase final de robustez.

---

## Las secciones, explicadas para gente nueva

Para que alguien que nunca vio la app entienda en 30 segundos qué ofrece cada parte:

| Sección | Para qué sirve | Estado |
|---|---|---|
| **Dashboard** | Resumen de QA: KPIs (total, pass rate, fallas, automation), resultado de la última corrida, desglose por proyecto, fallas recientes, tags Gherkin y actividad reciente. La foto del día. | ✅ Funcional |
| **Test cases** | El corazón. Lista de casos sincronizados de Jira + filtros (proyecto, status, tag, automation, búsqueda) + drawer lateral con **Gherkin** (resaltado), **Ejecutar** (marcar resultado y abrir bug) e **Historial**. | ✅ Funcional |
| **Bugs abiertos** | Vista enfocada solo en los casos que fallaron y su bug de Jira linkeado, para seguimiento. | 🔜 A implementar (Fase 4) |
| **Ejecuciones** | Historial cronológico de todas las corridas (quién, cuándo, resultado), transversal a los casos. | 🔜 A implementar (Fase 5) |
| **Settings** | Estado de salud del sistema (¿Jira conectado? ¿DB ok?) y cómo conectar _tu_ Jira. Read-only. | ⚠️ A simplificar (Fase 2) |
| ~~Favoritos~~ | — | ❌ Se quita del MVP (Fase 3) |

**Onboarding en una frase:** *"Sincronizás desde Jira, mirás el Dashboard para el estado general,
trabajás los casos en Test cases (ejecutar / abrir bug), y seguís fallas e historial en Bugs y
Ejecuciones."*

---

## Fase 0 — Seguridad / handover sin secretos

> **Objetivo:** garantizar que el repo se entrega sin una sola credencial ni dato sensible nuestro.
> Estado: **mayormente hecho**, queda verificar y dejarlo asentado.

- [x] `backend/src/API/.env` está en `.gitignore` y **nunca** estuvo en el historial de git *(verificado)*.
- [x] No hay URL real (`*.atlassian.net` de la empresa) ni token (`ATATT…`) en archivos trackeados *(verificado)*.
- [x] Existen plantillas `backend/src/API/.env.example` y `frontend/.env.example`.
- [ ] `appsettings.json` no contiene secretos (hoy: `BaseUrl: null`, `MockMode: true` — ok, confirmar que sigue así).
- [ ] Confirmar que el token de Jira **nunca** se serializa al frontend ni a logs (redactado en logging estructurado).
- [ ] **(Lo hace Marcos al final, antes de entregar)** Quitar archivos de trabajo nuestros que no deberían viajar al equipo: `prompt_codex_qa_test_case_hub_mvp_v2.md`, PDFs de diseño, y los specs/plans internos en `docs/superpowers/`. _(La carpeta `qa-hub-design/` ya fue removida.)_
- [ ] Verificar que no queden datos seed con nombres/correos nuestros (mock usa nombres genéricos).

**Criterio de aceptación:** `git grep` de la URL real y del prefijo de token devuelve vacío; un clon
fresco no contiene ningún `.env`; el repo arranca en mock mode sin configuración.

---

## Fase 1 — Documentación y onboarding

> **Objetivo:** que alguien nuevo clone y tenga la app andando con _su_ Jira en ~5 minutos.
> El README actual está **desactualizado** (dice "2 rutas", menciona Tailwind, dice que los KPIs salen
> de `/api/dashboard/summary` global) — hoy son 3+ rutas, `soft.css`, y los KPIs de Test cases se
> derivan en el cliente.

- [x] Reescribir `README.md`:
  - [x] Pantallas reales: Dashboard (default) · Test cases · Settings activas; Bugs abiertos / Ejecuciones marcadas como roadmap.
  - [x] Stack actualizado: `soft.css` (no Tailwind como sistema principal), React Router 7 con las rutas reales.
  - [x] Aclarar la estrategia de datos: se traen todos los casos en una query y se derivan KPIs/contadores en el cliente.
  - [x] Sección **"Conectá tu Jira"** paso a paso.
- [x] Crear un **QUICKSTART** (incluido en el README, sección [Quickstart]):
  1. Clonar.
  2. Copiar `backend/src/API/.env.example` → `.env` y completar `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`.
  3. `dotnet run --project backend/src/API/QaTestCaseHub.API.csproj` (corre migraciones solo).
  4. `cd frontend && npm install && npm run dev`.
  5. Abrir `http://localhost:5173` → botón **Sincronizar** → JQL → ver casos.
- [x] Documentar **cómo se obtiene un API token de Atlassian** (link a `id.atlassian.com` → API tokens).
- [x] Verificar que `.env.example` (backend y frontend) tenga **todas** las variables que el código lee — confirmado: las 13 vars del backend (`DATABASE_URL`, `FRONTEND_ORIGIN`, 10× `JIRA_*`, `ASPNETCORE_ENVIRONMENT`) y `VITE_API_BASE_URL` del frontend están en las plantillas.
- [x] Nota explícita sobre **mock mode**: si faltan credenciales, la app arranca con casos demo (no rompe), útil para evaluar la app sin Jira.
- [x] Tabla de **Variables de entorno** completa (backend + frontend) con defaults y descripción.
- [x] Verificado: ningún link del README está roto (`docs/deployment-and-database.md`, `docs/jira-mapping.md`, `docker-compose.yml`, `checklist-production.md` existen).

**Criterio de aceptación:** una persona ajena al proyecto, siguiendo solo el README, levanta la app
y sincroniza su Jira sin pedir ayuda. ✅

---

## Fase 2 — Settings: reducir a solo health

> **Objetivo:** Settings hoy muestra detalle técnico/infra (nombre de migración EF, CORS origin, link
> a OpenAPI, email y base URL de Jira). Para onboarding de QA eso confunde y expone config interna.
> Lo dejamos como **panel de estado** simple + puntero a la doc.

- [x] Mantener: estado **Backend API** / **PostgreSQL** / **Jira** (ok / down) y **modo** (mock / real), con pill **"X de 3 OK"**.
- [x] Mantener un botón **"Verificar conexión"** (refetch de `/api/health`), con estado "Verificando…".
- [x] Quitar de la vista: nombre de migración, connection string, CORS origin, link a OpenAPI, versión de build técnica, y el bloque `.env.example` embebido.
- [x] Reemplazar el detalle de credenciales por una guía corta de 3 pasos "¿Cómo conecto mi Jira?" que apunta al README (sin mostrar email ni base URL de Jira).
- [x] Dejar el puntero a la documentación (README → Conectá tu Jira) + nota de seguridad.
- [x] Actualizar `frontend/src/features/settings/SettingsPage.tsx` y quitar `LATEST_MIGRATION` y los imports `getAllTestCases`/`getJiraSettings` que ya no se usan (`API_BASE` se conserva solo para mostrar la URL del backend en el health, no sensible).
- [x] Agregar estados loading / error en el panel de estado.
- [x] Verificado: `npm run build` (tsc + vite) limpio, 155 módulos.

**Criterio de aceptación:** Settings responde a una sola pregunta del QA — *"¿está todo conectado?"* —
y, si no, lo manda a la doc. No expone infra ni datos personales. ✅

---

## Fase 3 — Sacar Favoritos

> **Objetivo:** Favoritos requiere persistencia nueva y aporta poco al MVP. Se quita para simplificar.

- [x] Remover el ítem `favorites` del array `navItems` en `frontend/src/layout/Sidebar.tsx`.
- [x] Confirmar que no quedan referencias a Favoritos en estilos/rutas — `grep` de `favorit|Favorito|⭐` en `src` devuelve vacío.
- [x] Verificado: `npm run build` limpio.

**Criterio de aceptación:** el sidebar no muestra Favoritos; nada queda muerto. ✅

---

## Fase 4 — Bugs abiertos

> **Objetivo:** habilitar la sección con la data que **ya tenemos** — casos cuya última ejecución es
> `Fail` y que tienen un `jiraBugKey` asociado (más los Fail sin bug, como pendientes de reportar).

- [x] Nueva ruta `/bugs` en `frontend/src/routes/AppRoutes.tsx`.
- [x] Habilitar el ítem `bugs` en el sidebar (quitar `disabled`, navegar a `/bugs`) — muestra el contador de fallas.
- [x] Página `BugsPage`: lista de casos con falla → key del caso, summary, proyecto, quién ejecutó, fecha de la falla, y **bug de Jira linkeado** (pill con link a `${baseUrl}/browse/{bug}`).
- [x] Distinguir visualmente: **con bug** (pill linkeada) vs **falla sin bug** (botón "Reportar bug" → abre el caso en la pestaña Ejecutar vía deep-link `?case=<id>&tab=execute`).
- [x] Lógica en un selector testeable `openBugs(cases, executions)` (`selectors.ts`) — reusa `resultOf` + feed `getRecentExecutions(200)` con `jiraBugKey`. Se resuelve 100% en cliente; sin endpoint nuevo. _Limitación conocida: el bug se busca en las últimas 200 ejecuciones (suficiente para el volumen actual); si en el futuro hay miles, conviene un endpoint dedicado de "bugs abiertos"._
- [x] 2 tests nuevos para `openBugs` (filtra solo Fail, enriquece con bug/executor/fecha más reciente, ordena desc). `vitest` 7/7.
- [x] Estados loading / empty ("Sin bugs abiertos 🎉") / error.
- [x] Mejora de soporte: deep-link `?case=<id>&tab=execute` en `TestCasesPage` + prop `initialTab` en `TestCaseDrawer`; helper `jiraBrowseUrl` unificado en `design.ts` (antes duplicado en el drawer).
- [x] Verificado: `npm run build` limpio (156 módulos), `vitest` 7/7.

**Criterio de aceptación:** un QA Lead entra a Bugs abiertos y ve, de un vistazo, qué está roto y
qué bug de Jira lo trackea, con link directo. ✅

---

## Fase 5 — Ejecuciones

> **Objetivo:** historial cronológico transversal de corridas. El endpoint ya existe
> (`GET /api/executions?take=N`, usado hoy por el feed del Dashboard).

- [x] Nueva ruta `/executions` en `AppRoutes.tsx`.
- [x] Habilitar el ítem `executions` en el sidebar (navega a `/executions`).
- [x] Página `ExecutionsPage`: lista cronológica con resultado (pill), key + summary del caso, quién ejecutó (avatar), proyecto, fecha relativa (tooltip con fecha absoluta), comentario y bug linkeado si hay. Click → abrir el caso.
- [x] Filtros por **resultado** (Pass / Fail / Blocked / Not run) y **proyecto** reusando `FilterChip` con contadores. El proyecto se resuelve cruzando `testCaseId` con los casos (fallback al prefijo del issue key).
- [x] "Cargar más" client-side (de a 25) sobre el feed `getRecentExecutions(200)`.
- [x] Estados loading / empty (distingue "sin ejecuciones" vs "ninguna coincide") / error.
- [x] **Arreglo de caché**: la query del feed ahora incluye `take` en la key (`['recent-executions', N]`) — antes Dashboard (50) y Bugs (200) colisionaban con la misma key. La invalidación del drawer por prefijo sigue cubriendo todas.
- [x] Verificado: `npm run build` limpio (157 módulos), `vitest` 7/7.

**Criterio de aceptación:** se puede responder *"¿qué se ejecutó esta semana y cómo salió?"* sin
abrir Jira. ✅

---

## Fase 6 — Robustez y verificación final

> **Objetivo:** sello de calidad antes de entregar.

- [x] **Estados** loading / empty / error consistentes en las 5 pantallas — agregado banner de error en Dashboard y rama de error en Test cases; Bugs/Ejecuciones/Settings ya los tenían. Ninguna queda en blanco si la API falla.
- [x] **Validación de entorno** al arrancar el backend: log claro al iniciar (`Program.cs`) con provider de DB (PostgreSQL/InMemory) y modo Jira (REAL/MOCK + el motivo: mock flag, credenciales faltantes, o conectado). Sin cambiar el comportamiento de seeding.
- [x] **Manejo de errores de Jira** en el modal de sync: muestra el **código estándar** (`JIRA_AUTH_FAILED`, `JIRA_RATE_LIMITED`, `VALIDATION_ERROR`, `DATABASE_ERROR`) con un hint en español, vía helper `apiError` que parsea el envelope `{ error: { code, message } }`.
- [ ] **Smoke test del flujo real** _(lo corrés vos contra tu Jira — pasos en el reporte)_: sincronizar → ver casos → ejecutar uno → abrir bug → verlo en Bugs/Ejecuciones.
- [x] **Tests verdes**: `dotnet test` **18/18** · frontend `vitest` **9/9** + `npm run build` limpio.
- [x] Tests para Bugs y Ejecuciones: `openBugs` (2) + `execProjectKey`/`filterExecutions` (2).
- [x] Sin `console.log` ni TODOs colgados (grep en `src` vacío).
- [x] **Onboarding doc**: README actualizado a las 5 pantallas reales (Bugs y Ejecuciones ya no figuran como "roadmap"; Test cases descrito como grilla de cards).
- [ ] **Pase de onboarding final** _(lo hacés vos)_: clonar en una carpeta limpia y correr el QUICKSTART de cero siguiendo solo el README.

**Criterio de aceptación:** clon limpio → seguir README → app andando con Jira propio, las 5 secciones
funcionando, tests y build verdes. ✅ _(falta tu smoke test de extremo a extremo)_

---

## Fuera de alcance (explícito)

Para evitar over-engineering y dejar claro qué **no** entra en esta entrega:

- Hosting administrado por nosotros / despliegue de una instancia compartida (lo corre el equipo).
- Autenticación, login por usuario y roles (QA vs QA Lead).
- **Favoritos** (se quita del MVP).
- Editor de Gherkin in-app y creación/edición de casos desde la app.
- Import/export de archivos `.feature`, bulk-create de issues en Jira.
- Dashboard de tendencias históricas.
- Integración con runners de automation (Cucumber/JUnit) y con Xray / Zephyr.
- OAuth en lugar de Basic Auth (token).

---

## Orden sugerido de ejecución

1. **Fase 0 + Fase 1** — habilitan el handover (sin esto, nadie puede correrlo).
2. **Fase 2 + Fase 3** — limpieza rápida (Settings simple, sacar Favoritos).
3. **Fase 4 + Fase 5** — completan las secciones con data que ya existe.
4. **Fase 6** — verificación final antes de entregar.

> Cada fase se puede abordar como una unidad de trabajo independiente con su propio plan de
> implementación (TDD donde aplique). Las Fases 1–3 son de bajo riesgo; 4–5 agregan vistas nuevas.
