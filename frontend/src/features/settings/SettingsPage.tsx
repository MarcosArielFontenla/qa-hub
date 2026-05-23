import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { Bug, CheckCircle2, Database, FileText, RefreshCw, Server, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { getHealth, getJiraSettings } from '../../api/testCasesApi';
import { TextBadge } from '../../components/ui/Badge';
import { buildDefaultSyncJql, QA_HUB_GHERKIN_LABELS } from '../../lib/jiraWorkflow';

type StatusTone = 'ok' | 'warning' | 'error' | 'loading';

function getStatusTone(value?: string | null): StatusTone {
  if (!value) {
    return 'loading';
  }

  if (value.toLowerCase() === 'ok' || value.toLowerCase() === 'real') {
    return 'ok';
  }

  if (value.toLowerCase() === 'mock') {
    return 'warning';
  }

  return 'error';
}

function statusLabel(value?: string | null) {
  if (!value) {
    return 'Verificando';
  }

  const labels: Record<string, string> = {
    ok: 'Operativo',
    real: 'Jira real',
    mock: 'Modo mock'
  };

  return labels[value.toLowerCase()] ?? value;
}

function StatusPill({ value }: { value?: string | null }) {
  const tone = getStatusTone(value);

  return (
    <span
      className={clsx(
        'rounded border px-2 py-1 text-xs font-semibold shadow-sm',
        tone === 'ok' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'error' && 'border-red-200 bg-red-50 text-red-700',
        tone === 'loading' && 'border-line bg-lavender text-muted'
      )}
    >
      {statusLabel(value)}
    </span>
  );
}

function IntegrationCard({
  icon: Icon,
  title,
  value,
  detail
}: {
  icon: LucideIcon;
  title: string;
  value?: string | null;
  detail: string;
}) {
  return (
    <article className="rounded-md border border-line bg-white/75 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-lavender text-accent">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-muted">{detail}</p>
          </div>
        </div>
        <StatusPill value={value} />
      </div>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-line bg-white/70 p-3">
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value || 'No configurado'}</dd>
    </div>
  );
}

function WorkflowCard({
  icon: Icon,
  title,
  children
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-md border border-line bg-white/70 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" aria-hidden />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="text-sm text-muted">{children}</div>
    </article>
  );
}

export function SettingsPage() {
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });
  const jiraQuery = useQuery({ queryKey: ['jira-settings'], queryFn: getJiraSettings });
  const health = healthQuery.data;
  const jira = jiraQuery.data;
  const projectKey = jira?.projectKey?.trim() || 'SCRUM';
  const recommendedJql = buildDefaultSyncJql(projectKey);
  const backendStatus = healthQuery.isError ? 'error' : health?.status;
  const databaseStatus = healthQuery.isError ? 'error' : health?.database;
  const jiraStatus = healthQuery.isError || jiraQuery.isError ? 'error' : health?.jiraMode;

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="page-heading">Configuración</h2>
        <p className="page-subtitle">Estado de integraciones, sincronización y reglas operativas para el equipo QA.</p>
      </div>

      <section className="surface-card grid gap-4 p-4">
        <div>
          <h3 className="font-semibold">Integraciones operativas</h3>
          <p className="mt-1 text-sm text-muted">Vista rápida para confirmar si QA Hub puede leer datos y sincronizar Jira.</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          <IntegrationCard icon={Server} title="Backend API" value={backendStatus} detail="Servicios y endpoints de QA Hub" />
          <IntegrationCard icon={Database} title="Railway DB" value={databaseStatus} detail="Persistencia de casos y ejecuciones" />
          <IntegrationCard icon={CheckCircle2} title="Jira" value={jiraStatus} detail="Conexión configurada desde backend" />
        </div>
      </section>

      <section className="surface-card grid gap-4 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-semibold">Jira workspace</h3>
            <p className="mt-1 text-sm text-muted">Datos seguros que ayudan a validar que el equipo trabaja contra el proyecto correcto.</p>
          </div>
          <TextBadge>Token protegido en backend</TextBadge>
        </div>
        <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailItem label="Base URL" value={jira?.baseUrl} />
          <DetailItem label="Project key" value={projectKey} />
          <DetailItem label="Tipo caso de prueba" value={jira?.testCaseIssueType} />
          <DetailItem label="Tipo bug" value={jira?.bugIssueType} />
          <DetailItem label="Campo Gherkin" value={jira?.gherkinField} />
          <DetailItem label="Campo labels" value={jira?.labelsField} />
        </dl>
      </section>

      <section className="surface-card grid gap-4 p-4">
        <div>
          <h3 className="font-semibold">Sincronización y reglas QA</h3>
          <p className="mt-1 text-sm text-muted">Resumen del flujo esperado para crear, revisar y ejecutar casos con Gherkin.</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          <WorkflowCard icon={RefreshCw} title="JQL recomendado">
            <code className="block overflow-auto rounded-md border border-line bg-panel/80 p-3 text-xs text-ink">{recommendedJql}</code>
          </WorkflowCard>
          <WorkflowCard icon={FileText} title="Casos en Gherkin">
            <p>Los escenarios se toman desde el campo <span className="font-medium text-ink">{jira?.gherkinField || 'description'}</span> y se detectan con tags como {QA_HUB_GHERKIN_LABELS.map((label) => <TextBadge key={label}>@{label}</TextBadge>)}.</p>
          </WorkflowCard>
          <WorkflowCard icon={CheckCircle2} title="Ejecución manual">
            <p>El equipo puede registrar resultados Pass, Fail, Blocked o No ejecutado desde el detalle de cada caso.</p>
          </WorkflowCard>
          <WorkflowCard icon={Bug} title="Crear bug al fallar">
            <p>Cuando una ejecución falla, QA puede crear un issue de tipo <span className="font-medium text-ink">{jira?.bugIssueType || 'Bug'}</span> con evidencia y comentario.</p>
          </WorkflowCard>
          <WorkflowCard icon={ShieldCheck} title="Alcance seguro">
            <p>La sincronización de casos entra desde Jira hacia QA Hub; los cambios de detalle del caso no se escriben de vuelta en Jira.</p>
          </WorkflowCard>
        </div>
      </section>
    </section>
  );
}
