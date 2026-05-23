import { AlertTriangle, ExternalLink, PlayCircle, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { clsx } from 'clsx';
import { createExecution, getExecutions, getJiraSettings, updateAutomationStatus, type CreateExecutionPayload } from '../../api/testCasesApi';
import { AutomationBadge, ResultBadge, TextBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, SelectInput, TextArea, TextInput } from '../../components/ui/Field';
import { automationStatusLabel, formatDate } from '../../lib/format';
import type { AutomationStatus, ExecutionResult, TestCaseDto } from '../../types/contracts';

const automationStatuses: AutomationStatus[] = ['ManualOnly', 'ReadyToAutomate', 'InAutomation', 'Automated', 'Flaky', 'Deprecated'];
const executionResults: ExecutionResult[] = ['Pass', 'Fail', 'Blocked', 'NotRun'];

type DrawerTab = 'gherkin' | 'ejecutar' | 'historial';

interface ExecutionFormState extends CreateExecutionPayload {
  result: ExecutionResult;
}

const emptyForm: ExecutionFormState = {
  result: 'Pass',
  executedBy: '',
  comment: '',
  evidenceUrl: '',
  evidenceText: '',
  createBug: false,
  bugSummary: '',
  bugDescription: ''
};

function buildJiraUrl(baseUrl?: string | null, key?: string | null) {
  if (!baseUrl || !key) {
    return null;
  }
  return `${baseUrl.replace(/\/+$/, '')}/browse/${key}`;
}

export function TestCaseDetailDrawer({ testCase, onClose }: { testCase: TestCaseDto; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DrawerTab>('gherkin');
  const [execution, setExecution] = useState<ExecutionFormState>(emptyForm);

  const jiraSettingsQuery = useQuery({ queryKey: ['jira-settings'], queryFn: getJiraSettings });
  const executionsQuery = useQuery({
    queryKey: ['executions', testCase.id],
    queryFn: () => getExecutions(testCase.id)
  });

  const automationMutation = useMutation({
    mutationFn: (automationStatus: AutomationStatus) => updateAutomationStatus(testCase.id, automationStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases'] })
  });

  const executionMutation = useMutation({
    mutationFn: (payload: ExecutionFormState) => createExecution(testCase.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', testCase.id] });
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setExecution(emptyForm);
      setTab('historial');
    }
  });

  const jiraUrl = buildJiraUrl(jiraSettingsQuery.data?.baseUrl, testCase.jiraIssueKey);
  const bugSummaryRequired = execution.createBug && execution.result === 'Fail';
  const canSubmit = !bugSummaryRequired || Boolean(execution.bugSummary?.trim());

  const tabs: Array<{ id: DrawerTab; label: string }> = [
    { id: 'gherkin', label: 'Gherkin' },
    { id: 'ejecutar', label: 'Ejecutar' },
    { id: 'historial', label: 'Historial' }
  ];

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col border-l border-white/70 bg-white/95 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-accent">{testCase.jiraIssueKey ?? 'Local'}</p>
            {jiraUrl ? (
              <a className="inline-flex items-center gap-1 text-xs font-medium text-focus hover:underline" href={jiraUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Abrir en Jira
              </a>
            ) : null}
          </div>
          <h3 className="truncate text-lg font-semibold" title={testCase.summary}>{testCase.summary}</h3>
        </div>
        <button className="rounded-md p-2 hover:bg-lavender" type="button" onClick={onClose} aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-3 border-b border-line px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <AutomationBadge value={testCase.automationStatus} />
          <ResultBadge value={testCase.lastExecutionResult} />
          {testCase.tags.map((tag) => <TextBadge key={tag}>{tag}</TextBadge>)}
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted">Parent:</span> {testCase.parentIssueKey ?? '-'}</p>
          <p><span className="text-muted">Priority:</span> {testCase.priority ?? '-'}</p>
          <p><span className="text-muted">Status Jira:</span> {testCase.jiraStatus ?? '-'}</p>
          <p><span className="text-muted">Assignee:</span> {testCase.assigneeDisplayName ?? '-'}</p>
        </div>
        <Field label="Automatización" className="max-w-xs">
          <SelectInput
            value={testCase.automationStatus}
            onChange={(event) => automationMutation.mutate(event.target.value as AutomationStatus)}
          >
            {automationStatuses.map((status) => (
              <option key={status} value={status}>{automationStatusLabel(status)}</option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="flex gap-1 border-b border-line px-5 pt-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={clsx(
              'rounded-t-md px-4 py-2 text-sm font-medium transition',
              tab === item.id ? 'bg-lavender text-accent' : 'text-muted hover:text-ink'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'gherkin' ? (
          <pre className="gherkin-code rounded-md border border-line bg-[#252338] p-4 text-sm text-slate-50 shadow-card">{testCase.gherkinText || 'Sin Gherkin sincronizado.'}</pre>
        ) : null}

        {tab === 'ejecutar' ? (
          <section className="grid gap-3">
            <h4 className="flex items-center gap-2 font-semibold"><PlayCircle className="h-4 w-4" /> Ejecutar caso</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Resultado">
                <SelectInput value={execution.result} onChange={(event) => setExecution({ ...execution, result: event.target.value as ExecutionResult })}>
                  {executionResults.map((result) => <option key={result} value={result}>{result}</option>)}
                </SelectInput>
              </Field>
              <Field label="Ejecutado por">
                <TextInput value={execution.executedBy} onChange={(event) => setExecution({ ...execution, executedBy: event.target.value })} />
              </Field>
            </div>
            <Field label="Comentario">
              <TextArea rows={3} value={execution.comment} onChange={(event) => setExecution({ ...execution, comment: event.target.value })} />
            </Field>
            <Field label="Evidencia URL">
              <TextInput placeholder="https://…" value={execution.evidenceUrl} onChange={(event) => setExecution({ ...execution, evidenceUrl: event.target.value })} />
            </Field>
            <Field label="Evidencia (texto)">
              <TextArea rows={2} value={execution.evidenceText} onChange={(event) => setExecution({ ...execution, evidenceText: event.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={execution.createBug}
                onChange={(event) => setExecution({ ...execution, createBug: event.target.checked })}
              />
              Crear bug en Jira si falla
            </label>
            {execution.createBug ? (
              <div className="grid gap-3 rounded-md border border-line bg-panel/60 p-3">
                <Field label="Bug summary">
                  <TextInput value={execution.bugSummary} onChange={(event) => setExecution({ ...execution, bugSummary: event.target.value })} />
                </Field>
                <Field label="Bug description">
                  <TextArea rows={3} value={execution.bugDescription} onChange={(event) => setExecution({ ...execution, bugDescription: event.target.value })} />
                </Field>
                {bugSummaryRequired && !execution.bugSummary?.trim() ? (
                  <p className="text-xs text-danger">El bug summary es obligatorio para crear el bug.</p>
                ) : null}
                <p className="text-xs text-muted">El bug se crea solo si el resultado es Fail.</p>
              </div>
            ) : null}
            {executionMutation.isError ? (
              <p className="text-sm text-danger">No se pudo guardar la ejecución. Revisá los datos e intentá de nuevo.</p>
            ) : null}
            <Button type="button" isLoading={executionMutation.isPending} disabled={!canSubmit} onClick={() => executionMutation.mutate(execution)}>
              Guardar ejecución
            </Button>
          </section>
        ) : null}

        {tab === 'historial' ? (
          <section className="grid gap-2">
            <h4 className="font-semibold">Historial de ejecuciones</h4>
            {executionMutation.data?.warning ? (
              <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {executionMutation.data.warning}
              </p>
            ) : null}
            {(executionsQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted">Sin ejecuciones registradas todavía.</p>
            ) : null}
            {(executionsQuery.data ?? []).map((item) => {
              const bugUrl = buildJiraUrl(jiraSettingsQuery.data?.baseUrl, item.jiraBugKey);
              return (
                <div key={item.id} className="rounded-md border border-line bg-white/80 p-3 text-sm shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <ResultBadge value={item.result} />
                    <span className="text-muted">{formatDate(item.createdAt)}</span>
                  </div>
                  {item.executedBy ? <p className="mt-2 text-muted">Por {item.executedBy}</p> : null}
                  {item.comment ? <p className="mt-1">{item.comment}</p> : null}
                  {item.jiraBugKey ? (
                    <p className="mt-2 font-medium text-danger">
                      Bug: {bugUrl ? (
                        <a className="inline-flex items-center gap-1 hover:underline" href={bugUrl} target="_blank" rel="noreferrer">
                          {item.jiraBugKey} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : item.jiraBugKey}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </section>
        ) : null}
      </div>
    </aside>
  );
}
