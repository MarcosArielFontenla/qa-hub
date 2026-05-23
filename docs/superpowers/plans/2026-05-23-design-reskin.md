# Reskin Visual (Claude Design) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git note:** El usuario commitea/pushea a GitHub manualmente y este entorno no es repo git. Donde un plan normal diría "Commit", acá el cierre de cada tarea es **build + tests verdes** (checkpoint de verificación). No correr comandos git.

**Goal:** Aplicar el look del diseño Claude Design a la app actual (sidebar, KPIs con sublabels, barra de filtros, tabla + panel de detalle inline, Gherkin con syntax highlight, Settings restyleado) sin agregar backend ni pantallas.

**Architecture:** Reskin frontend-only. Se reusan los endpoints, hooks de TanStack Query y el modelo de datos existentes. Se refactorizan/renombran componentes de `frontend/src` y se agregan 2 utilidades puras (highlighter de Gherkin, helper de sublabels de KPI) cubiertas por tests. La selección de caso sigue siendo estado local en `TestCasesPage`.

**Tech Stack:** React 19 + TypeScript + Vite, Tailwind CSS, TanStack Query, lucide-react, clsx. Tests con Vitest + Testing Library.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `frontend/src/features/testCases/gherkinHighlight.ts` | Crear | Función pura: tokeniza Gherkin en segmentos `{ kind, text }`. |
| `frontend/src/features/testCases/gherkinHighlight.test.ts` | Crear | Tests de la función pura. |
| `frontend/src/features/testCases/GherkinBlock.tsx` | Crear | Componente que renderiza el `<pre>` con spans coloreados + botón "Copiar". |
| `frontend/src/lib/kpis.ts` | Crear | Función pura `buildKpis(summary)` → array de cards (label, value, sublabel, tone, icon-key). |
| `frontend/src/lib/kpis.test.ts` | Crear | Tests de `buildKpis`. |
| `frontend/src/features/testCases/KpiCards.tsx` | Modificar | Render de cards con ícono + sublabel usando `buildKpis`. |
| `frontend/src/layout/AppLayout.tsx` | Reescribir | Sidebar fija + área de contenido; responsive. |
| `frontend/src/features/testCases/TestCasesFilters.tsx` | Reescribir | Barra de filtros horizontal + toggle "Más filtros". |
| `frontend/src/features/testCases/TestCaseDetailPanel.tsx` | Crear (desde `TestCaseDetailDrawer.tsx`) | Panel de detalle inline (no overlay) con tabs + GherkinBlock. |
| `frontend/src/features/testCases/TestCaseDetailDrawer.tsx` | Borrar | Reemplazado por el panel inline. |
| `frontend/src/features/testCases/TestCasesTable.tsx` | Modificar | Restyle; soporta modo "compacto" cuando hay selección. |
| `frontend/src/features/testCases/TestCasesPage.tsx` | Reescribir | Header con pill mock/real, KPIs, barra de filtros, layout tabla+panel inline. |
| `frontend/src/features/settings/SettingsPage.tsx` | Modificar | Restyle a Health pills + Conexión Jira + bloque `.env.example`. |
| `frontend/src/features/settings/SettingsPage.test.tsx` | Modificar (si hace falta) | Mantener verde tras el restyle. |
| `frontend/src/features/testCases/TestCasesTable.test.tsx` | Modificar (si hace falta) | Mantener verde tras el restyle. |
| `frontend/src/styles/index.css` | Modificar | Clases `.gh-*` para el highlight + utilidades. |

---

## Task 1: Highlighter de Gherkin (función pura, TDD)

**Files:**
- Create: `frontend/src/features/testCases/gherkinHighlight.ts`
- Test: `frontend/src/features/testCases/gherkinHighlight.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import { tokenizeGherkin } from './gherkinHighlight';

describe('tokenizeGherkin', () => {
  it('classifies tags, feature, scenario and steps (EN)', () => {
    const lines = tokenizeGherkin('@smoke @login\nFeature: Auth\nScenario: Login\n  Given a user\n  When submits\n  Then ok');
    const kinds = lines.map((line) => line.map((t) => t.kind));
    expect(kinds[0]).toContain('tag');
    expect(kinds[1][0]).toBe('keyword'); // Feature:
    expect(kinds[2][0]).toBe('keyword'); // Scenario:
    expect(kinds[3][0]).toBe('step');    // Given
    expect(kinds[5][0]).toBe('step');    // Then
  });

  it('classifies spanish keywords', () => {
    const lines = tokenizeGherkin('Característica: Auth\nEscenario: Login\n  Dado un user\n  Entonces ok');
    expect(lines[0][0].kind).toBe('keyword');
    expect(lines[2][0].kind).toBe('step');
  });

  it('treats plain text as text', () => {
    const lines = tokenizeGherkin('just a description line');
    expect(lines[0][0].kind).toBe('text');
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `cd frontend && npx vitest run src/features/testCases/gherkinHighlight.test.ts`
Expected: FAIL ("tokenizeGherkin is not a function" / módulo no encontrado).

- [ ] **Step 3: Implementación mínima**

```ts
export type GherkinTokenKind = 'tag' | 'keyword' | 'step' | 'text';
export interface GherkinToken { kind: GherkinTokenKind; text: string; }

const KEYWORDS = ['Feature', 'Característica', 'Funcionalidad', 'Scenario Outline', 'Esquema del escenario', 'Scenario', 'Escenario', 'Background', 'Antecedentes', 'Examples', 'Ejemplos'];
const STEPS = ['Given', 'When', 'Then', 'And', 'But', 'Dado', 'Cuando', 'Entonces', 'Y', 'Pero'];

function classifyLine(raw: string): GherkinToken[] {
  const trimmedStart = raw.trimStart();
  if (trimmedStart.startsWith('@')) {
    return [{ kind: 'tag', text: raw }];
  }
  const kw = KEYWORDS.find((k) => trimmedStart.startsWith(k + ':'));
  if (kw) {
    return [{ kind: 'keyword', text: raw }];
  }
  const step = STEPS.find((s) => trimmedStart === s || trimmedStart.startsWith(s + ' '));
  if (step) {
    return [{ kind: 'step', text: raw }];
  }
  return [{ kind: 'text', text: raw }];
}

export function tokenizeGherkin(content: string): GherkinToken[][] {
  return (content ?? '').replace(/\r\n/g, '\n').split('\n').map(classifyLine);
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `cd frontend && npx vitest run src/features/testCases/gherkinHighlight.test.ts`
Expected: PASS (3 tests).

---

## Task 2: GherkinBlock (componente de render + Copiar)

**Files:**
- Create: `frontend/src/features/testCases/GherkinBlock.tsx`

- [ ] **Step 1: Implementar el componente**

```tsx
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { tokenizeGherkin, type GherkinTokenKind } from './gherkinHighlight';

const toneClass: Record<GherkinTokenKind, string> = {
  tag: 'text-violet-300',
  keyword: 'text-sky-300 font-semibold',
  step: 'text-emerald-300',
  text: 'text-slate-200'
};

export function GherkinBlock({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const lines = tokenizeGherkin(content || 'Sin Gherkin sincronizado.');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-slate-100 hover:bg-white/20"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copiado' : 'Copiar'}
      </button>
      <pre className="gherkin-code overflow-auto rounded-md border border-line bg-[#252338] p-4 text-sm shadow-card">
        {lines.map((tokens, index) => (
          <div key={index}>
            {tokens.map((token, tokenIndex) => (
              <span key={tokenIndex} className={clsx(toneClass[token.kind])}>{token.text}</span>
            ))}
            {tokens.length === 0 ? ' ' : null}
          </div>
        ))}
      </pre>
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `cd frontend && npx tsc -b`
Expected: sin errores.

---

## Task 3: Helper de KPIs (función pura, TDD) + KpiCards

**Files:**
- Create: `frontend/src/lib/kpis.ts`
- Test: `frontend/src/lib/kpis.test.ts`
- Modify: `frontend/src/features/testCases/KpiCards.tsx`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import { buildKpis } from './kpis';

const summary = {
  totalTestCases: 30, notRun: 8, passed: 7, failed: 7, blocked: 8,
  automated: 10, manualOnly: 4, readyToAutomate: 5, passRate: 32, automationCoverage: 33
};

describe('buildKpis', () => {
  it('returns 6 cards with computed sublabels', () => {
    const cards = buildKpis(summary);
    expect(cards).toHaveLength(6);
    const total = cards.find((c) => c.label === 'Total');
    expect(total?.value).toBe(30);
    const passRate = cards.find((c) => c.label === 'Pass rate');
    expect(passRate?.value).toBe('32%');
    expect(passRate?.sublabel).toBe('7/22 corridos'); // passed/(passed+failed+blocked)
  });

  it('handles undefined summary with zeros', () => {
    const cards = buildKpis(undefined);
    expect(cards).toHaveLength(6);
    expect(cards[0].value).toBe(0);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `cd frontend && npx vitest run src/lib/kpis.test.ts`
Expected: FAIL (módulo no encontrado).

- [ ] **Step 3: Implementación mínima**

```ts
import type { DashboardSummaryDto } from '../types/contracts';

export type KpiTone = 'default' | 'ok' | 'danger' | 'warn';
export interface KpiCard { key: string; label: string; value: string | number; sublabel: string; tone: KpiTone; }

export function buildKpis(summary?: DashboardSummaryDto): KpiCard[] {
  const s = summary;
  const executed = (s?.passed ?? 0) + (s?.failed ?? 0) + (s?.blocked ?? 0);
  return [
    { key: 'total', label: 'Total', value: s?.totalTestCases ?? 0, sublabel: 'casos sincronizados', tone: 'default' },
    { key: 'passRate', label: 'Pass rate', value: `${s?.passRate ?? 0}%`, sublabel: `${s?.passed ?? 0}/${executed} corridos`, tone: 'ok' },
    { key: 'failed', label: 'Failed', value: s?.failed ?? 0, sublabel: 'requieren acción', tone: 'danger' },
    { key: 'blocked', label: 'Blocked', value: s?.blocked ?? 0, sublabel: 'bloqueados', tone: 'warn' },
    { key: 'notRun', label: 'Not run', value: s?.notRun ?? 0, sublabel: 'pendientes de ejecución', tone: 'default' },
    { key: 'automation', label: 'Automation', value: `${s?.automationCoverage ?? 0}%`, sublabel: `${s?.automated ?? 0} automatizados`, tone: 'ok' }
  ];
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `cd frontend && npx vitest run src/lib/kpis.test.ts`
Expected: PASS.

- [ ] **Step 5: Reescribir `KpiCards.tsx` usando `buildKpis`**

```tsx
import { Activity, BarChart3, CircleSlash, ShieldCheck, XCircle, Ban } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardSummaryDto } from '../../types/contracts';
import { buildKpis, type KpiTone } from '../../lib/kpis';

const icons: Record<string, LucideIcon> = {
  total: BarChart3, passRate: Activity, failed: XCircle, blocked: Ban, notRun: CircleSlash, automation: ShieldCheck
};
const toneClass: Record<KpiTone, string> = {
  default: 'text-ink', ok: 'text-accent', danger: 'text-danger', warn: 'text-warn'
};

export function KpiCards({ summary }: { summary?: DashboardSummaryDto }) {
  const cards = buildKpis(summary);
  return (
    <div className="sticky top-[68px] z-20 -mx-4 border-y border-white/50 bg-white/70 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = icons[card.key] ?? BarChart3;
          return (
            <div key={card.key} className="surface-card px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-lavender text-accent"><Icon className="h-4 w-4" aria-hidden /></span>
                <p className="text-xs font-semibold uppercase text-muted">{card.label}</p>
              </div>
              <p className={`mt-1 text-2xl font-semibold ${toneClass[card.tone]}`}>{card.value}</p>
              <p className="text-xs text-muted">{card.sublabel}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Checkpoint** — `cd frontend && npx vitest run && npx tsc -b` → verde.

---

## Task 4: Sidebar `AppLayout`

**Files:**
- Modify: `frontend/src/layout/AppLayout.tsx`

- [ ] **Step 1: Reescribir el layout con sidebar**

Estructura: contenedor `flex`. Sidebar `aside` fija (`hidden lg:flex` columna de ancho `w-64`, `border-r`, fondo `bg-lavender/80 backdrop-blur`): bloque marca (ícono `Sparkles` en chip `bg-accent`, "QA Test Case Hub", "QA · SCRUM"), `nav` con `navItems` (Test cases → `/test-cases` ícono `CheckSquare`; Settings → `/settings` ícono `Settings`) usando `NavLink` con `clsx` activo (`bg-white text-accent shadow-card`) / inactivo (`text-muted hover:bg-white/55`), y al pie una tarjeta neutra (`Sparkles`/marca, "QA Workspace", sin nombre de persona). En `< lg` mostrar un strip superior `sticky top-0` con los mismos links en fila scrolleable (igual patrón que el layout v2 actual). El contenido va en `<main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">` con `<Outlet />`, dentro de un wrapper `lg:pl-64`.

```tsx
import { CheckSquare, Settings, Sparkles } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';

const navItems = [
  { to: '/test-cases', label: 'Test cases', icon: CheckSquare },
  { to: '/settings', label: 'Settings', icon: Settings }
];

function NavItems({ variant }: { variant: 'side' | 'top' }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
              variant === 'top' && 'whitespace-nowrap',
              isActive ? 'bg-white text-accent shadow-card' : 'text-muted hover:bg-white/55 hover:text-ink'
            )
          }
        >
          <item.icon className="h-4 w-4" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/60 bg-lavender/80 px-4 py-5 shadow-soft backdrop-blur-xl lg:flex">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-white shadow-card"><Sparkles className="h-5 w-5" aria-hidden /></div>
          <div>
            <p className="text-base font-semibold leading-tight">QA Test Case Hub</p>
            <p className="text-xs font-medium text-muted">QA · SCRUM</p>
          </div>
        </div>
        <nav className="grid gap-1"><NavItems variant="side" /></nav>
        <div className="mt-auto rounded-md border border-white/70 bg-white/55 p-3">
          <p className="text-sm font-semibold">QA Workspace</p>
          <p className="mt-0.5 text-xs text-muted">Test Case Hub for Jira</p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 px-4 py-2 backdrop-blur lg:hidden">
          <div className="flex gap-2 overflow-auto"><NavItems variant="top" /></div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Checkpoint** — `cd frontend && npx tsc -b` → sin errores.

---

## Task 5: Barra de filtros horizontal `TestCasesFilters`

**Files:**
- Modify: `frontend/src/features/testCases/TestCasesFilters.tsx`

- [ ] **Step 1: Reescribir como barra horizontal**

Misma interfaz `{ filters, onChange }` (no cambia el contrato con la página). Render: tarjeta `surface-card p-3` con fila `flex flex-wrap items-end gap-3`: campos Proyecto (TextInput), Status (TextInput), Tag (TextInput), Automation (SelectInput), Resultado (SelectInput), y botón "Más filtros" que togglea una segunda fila con Assignee/Priority/Label/Parent. Reusar `Field`, `SelectInput`, `TextInput` de `components/ui/Field` y `automationStatusLabel`. Mantener los mismos `keyof TestCaseQuery`.

```tsx
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Field, SelectInput, TextInput } from '../../components/ui/Field';
import { automationStatusLabel } from '../../lib/format';
import type { AutomationStatus, ExecutionResult, TestCaseQuery } from '../../types/contracts';

const automationStatuses: AutomationStatus[] = ['ManualOnly', 'ReadyToAutomate', 'InAutomation', 'Automated', 'Flaky', 'Deprecated'];
const executionResults: ExecutionResult[] = ['NotRun', 'Pass', 'Fail', 'Blocked'];

export function TestCasesFilters({ filters, onChange }: { filters: TestCaseQuery; onChange: (key: keyof TestCaseQuery, value: string) => void }) {
  const [showMore, setShowMore] = useState(false);
  return (
    <section className="surface-card grid gap-3 p-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Proyecto" className="min-w-[8rem]"><TextInput placeholder="SCRUM" value={filters.projectKey ?? ''} onChange={(e) => onChange('projectKey', e.target.value)} /></Field>
        <Field label="Status" className="min-w-[8rem]"><TextInput placeholder="To Do" value={filters.status ?? ''} onChange={(e) => onChange('status', e.target.value)} /></Field>
        <Field label="Tag" className="min-w-[8rem]"><TextInput placeholder="@smoke" value={filters.tag ?? ''} onChange={(e) => onChange('tag', e.target.value)} /></Field>
        <Field label="Automation" className="min-w-[10rem]">
          <SelectInput value={filters.automationStatus ?? ''} onChange={(e) => onChange('automationStatus', e.target.value)}>
            <option value="">Todas</option>
            {automationStatuses.map((s) => <option key={s} value={s}>{automationStatusLabel(s)}</option>)}
          </SelectInput>
        </Field>
        <Field label="Resultado" className="min-w-[9rem]">
          <SelectInput value={filters.executionResult ?? ''} onChange={(e) => onChange('executionResult', e.target.value)}>
            <option value="">Todos</option>
            {executionResults.map((r) => <option key={r} value={r}>{r}</option>)}
          </SelectInput>
        </Field>
        <button type="button" className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-accent hover:bg-lavender" onClick={() => setShowMore((v) => !v)}>
          <SlidersHorizontal className="h-4 w-4" /> {showMore ? 'Menos' : 'Más'} filtros
        </button>
      </div>
      {showMore ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-line pt-3">
          <Field label="Assignee" className="min-w-[10rem]"><TextInput value={filters.assignee ?? ''} onChange={(e) => onChange('assignee', e.target.value)} /></Field>
          <Field label="Priority" className="min-w-[8rem]"><TextInput value={filters.priority ?? ''} onChange={(e) => onChange('priority', e.target.value)} /></Field>
          <Field label="Label" className="min-w-[8rem]"><TextInput value={filters.label ?? ''} onChange={(e) => onChange('label', e.target.value)} /></Field>
          <Field label="Parent / story" className="min-w-[10rem]"><TextInput value={filters.parentIssueKey ?? ''} onChange={(e) => onChange('parentIssueKey', e.target.value)} /></Field>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Checkpoint** — `npx tsc -b` → sin errores.

---

## Task 6: Panel de detalle inline `TestCaseDetailPanel`

**Files:**
- Create: `frontend/src/features/testCases/TestCaseDetailPanel.tsx` (basado en `TestCaseDetailDrawer.tsx`)
- Delete: `frontend/src/features/testCases/TestCaseDetailDrawer.tsx`

- [ ] **Step 1: Crear `TestCaseDetailPanel.tsx`**

Copiar la lógica del drawer actual (mismos hooks: `getJiraSettings`, `getExecutions`, `updateAutomationStatus`, `createExecution`; mismo form de ejecución con validación `bugSummary` cuando `createBug && Fail`; warning de la mutación; tabs Gherkin/Ejecutar/Historial; link a Jira). Cambios:
- Contenedor: en vez de `fixed inset-y-0 right-0 ... overlay`, usar panel relativo: `className="surface-card flex h-full flex-col overflow-hidden"` (la posición/ancho la maneja el grid de `TestCasesPage`). Mantener botón "Cerrar" (X) que llama `onClose`.
- Tab Gherkin: reemplazar el `<pre>` por `<GherkinBlock content={testCase.gherkinText} />`.
- Resto del contenido (badges, metadata, selector de Automation, form Ejecutar, Historial con links a bug) idéntico al drawer actual.
- Firma: `export function TestCaseDetailPanel({ testCase, onClose }: { testCase: TestCaseDto; onClose: () => void })`.

- [ ] **Step 2: Borrar el drawer viejo**

Run: `rm frontend/src/features/testCases/TestCaseDetailDrawer.tsx` (vía herramienta de borrado).

- [ ] **Step 3: Checkpoint** — `npx tsc -b` fallará hasta que `TestCasesPage` (Task 7) deje de importar el drawer. Continuar a Task 7 y verificar al final.

---

## Task 7: `TestCasesPage` (orquestación tabla + panel inline)

**Files:**
- Modify: `frontend/src/features/testCases/TestCasesPage.tsx`
- Modify: `frontend/src/features/testCases/TestCasesTable.tsx`

- [ ] **Step 1: Ajustar `TestCasesTable.tsx`**

Agregar prop opcional `compact?: boolean`. Cuando `compact` es true, ocultar columnas Status/Automation (clases `hidden`) para que la tabla quepa al lado del panel; cuando es false, mostrar todo (comportamiento actual). Mantener `items`, `isLoading`, `selectedId`, `onSelect`. El resto del restyle (chips de key, badges) ya está alineado con el theme.

- [ ] **Step 2: Reescribir `TestCasesPage.tsx`**

- Traer `getHealth` para el pill mock/real en el header.
- Header de página: título "Test Cases" + subtítulo (`{total} casos`), a la derecha pill `mock`/`real` (de `health.jiraMode`) + botones Sincronizar (abre `Modal` existente) y Exportar CSV.
- `<KpiCards summary={summaryQuery.data} />` (sticky).
- `<TestCasesFilters filters={filters} onChange={updateFilter} />` + búsqueda (input search arriba de la tabla).
- Layout principal: si hay `selected`, grid `lg:grid-cols-[1.4fr_1fr]` con `<TestCasesTable compact />` a la izquierda y `<TestCaseDetailPanel />` a la derecha (altura acotada, `lg:sticky lg:top-[180px] lg:h-[calc(100vh-200px)]`). Si no hay selección, `<TestCasesTable />` full width.
- Paginación igual que hoy.
- Mantener el `Modal` de Sincronizar y `syncResult` igual.
- En `< lg`, el panel se apila debajo de la tabla (el grid colapsa a 1 columna).

Reusar todo el state actual (`filters`, `selected`, `syncOpen`, `jql`, `syncResult`) y los hooks (`summaryQuery`, `testCasesQuery`, `syncMutation`). Importar `getHealth` y agregar `healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth })`.

- [ ] **Step 3: Checkpoint** — `cd frontend && npx tsc -b && npx vitest run` → verde. Ajustar `TestCasesTable.test.tsx` si el restyle rompió algún `getByText` (los textos clave key/summary/tag/result se mantienen).

---

## Task 8: `SettingsPage` restyle

**Files:**
- Modify: `frontend/src/features/settings/SettingsPage.tsx`
- Modify (si hace falta): `frontend/src/features/settings/SettingsPage.test.tsx`

- [ ] **Step 1: Restyle con datos disponibles**

Mantener heading "Configuración" y la sección "Integraciones operativas" (Backend/DB/Jira como Health con pills). Reordenar al look del diseño:
- **Health:** tres filas (Backend API, PostgreSQL, Jira) con `StatusPill` (reusar el existente) desde `health.status` / `health.database` / `health.jiraMode`.
- **Conexión Jira:** filas clave→valor con pill ok/missing: Modo activo (`jira.mockMode ? 'mock' : 'real'`), Base URL (`jira.baseUrl || '— sin configurar —'`), Project key (`jira.projectKey`), Bug issue type (`jira.bugIssueType`), Gherkin field (`jira.gherkinField`). (Email no se expone → omitir.)
- **Bloque `.env.example`** estático (texto plantilla, sin secretos).
- Mantener la card "JQL recomendado" con `buildDefaultSyncJql(projectKey)` y la card "Crear bug al fallar" (las valida el test). NO agregar un heading "Variables backend".

- [ ] **Step 2: Verificar el test de Settings**

Run: `cd frontend && npx vitest run src/features/settings/SettingsPage.test.tsx`
Expected: PASS. Si algún `getByText` cambió de wording, actualizar el assert (manteniendo el espíritu: heading "Configuración", "Integraciones operativas", "JQL recomendado", el JQL exacto, "Crear bug al fallar", ausencia de "Variables backend").

---

## Task 9: Estilos + verificación final

**Files:**
- Modify: `frontend/src/styles/index.css`

- [ ] **Step 1: Agregar utilidades si faltan**

`.gherkin-code { white-space: pre; }` ya existe como `white-space: pre-wrap` — mantener `pre-wrap`. No se necesitan clases extra (el color lo dan los spans inline de `GherkinBlock`). Agregar sólo si algún componente referencia una clase nueva.

- [ ] **Step 2: Verificación final completa**

Run: `cd frontend && npx tsc -b && npm run build && npx vitest run`
Expected: build OK + todos los tests verdes (incluye los 2 nuevos de Task 1 y Task 3).

- [ ] **Step 3: Verificación visual manual (opcional)**

Levantar `npm run dev` y revisar `/test-cases` (sidebar, KPIs con sublabels, filtros, tabla, panel inline con Gherkin coloreado + Copiar) y `/settings`. Backend en `:5000` en mock o real.

---

## Self-Review (writing-plans)

- **Spec coverage:** sidebar (T4), header mock/real pill (T7), KPIs sublabels (T3), barra filtros (T5), tabla+panel inline (T6+T7), Gherkin highlight + Copiar (T1+T2+T6), Settings restyle (T8), tests verdes (T1,T3,T7,T8,T9). Fuera-de-alcance documentado en la spec; ninguna tarea lo construye. ✔
- **Placeholder scan:** sin TBD/TODO; los componentes visuales grandes (panel, page) describen estructura + clases concretas + reúso explícito del código existente. ✔
- **Type consistency:** `tokenizeGherkin`/`GherkinToken`/`GherkinTokenKind` (T1) usados por `GherkinBlock` (T2); `buildKpis`/`KpiCard`/`KpiTone` (T3) usados por `KpiCards`; `TestCaseDetailPanel({testCase,onClose})` (T6) consumido por `TestCasesPage` (T7); `TestCasesFilters({filters,onChange})` sin cambио de contrato. ✔
