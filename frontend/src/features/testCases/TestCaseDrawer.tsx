import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createExecution, getExecutions, getJiraSettings, updateAutomationStatus, type CreateExecutionPayload } from '../../api/testCasesApi';
import { Avatar, AutomationPill, GherkinPre, JiraStatusPill, StatusPill, Tag } from '../../components/design/primitives';
import { Popover } from '../../components/design/filters';
import { fmtDate, fmtRel, initialsOf, jiraBrowseUrl, projEmoji } from '../../lib/design';
import type { AutomationStatus, ExecutionResult, TestCaseDto } from '../../types/contracts';

const AUTOMATION_STATUSES: AutomationStatus[] = ['ManualOnly', 'ReadyToAutomate', 'InAutomation', 'Automated', 'Flaky', 'Deprecated'];

type DrawerTab = 'gherkin' | 'execute' | 'history';

interface ExecState {
  result: Extract<ExecutionResult, 'Pass' | 'Fail' | 'Blocked'>;
  comment: string;
  evidenceUrl: string;
  executedBy: string;
  createBug: boolean;
  bugSummary: string;
  bugDescription: string;
}

function AutomationMenu({ tc }: { tc: TestCaseDto }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (status: AutomationStatus) => updateAutomationStatus(tc.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-test-cases'] });
      setOpen(false);
    }
  });
  return (
    <span className="pop-wrap">
      <span style={{ cursor: 'pointer' }} onClick={() => setOpen((o) => !o)} title="Cambiar automation status">
        <AutomationPill s={tc.automationStatus} />
      </span>
      <Popover open={open} onClose={() => setOpen(false)}>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {AUTOMATION_STATUSES.map((status) => (
            <div key={status} className={`pop-item ${status === tc.automationStatus ? 'on' : ''}`} onClick={() => mutation.mutate(status)}>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-11" />
                </svg>
              </span>
              <span className="lbl">{status}</span>
            </div>
          ))}
        </div>
      </Popover>
    </span>
  );
}

export function TestCaseDrawer({ tc, onClose, initialTab = 'gherkin' }: { tc: TestCaseDto; onClose: () => void; initialTab?: DrawerTab }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [copied, setCopied] = useState(false);
  const [exec, setExec] = useState<ExecState>(() => ({
    result: 'Pass',
    comment: '',
    evidenceUrl: '',
    executedBy: '',
    createBug: true,
    bugSummary: `[${tc.jiraIssueKey ?? 'LOCAL'}] ${tc.summary}`,
    bugDescription: 'Pasos para reproducir:\n1. \n2. \n\nResultado esperado:\n\nResultado actual:'
  }));

  useEffect(() => {
    setTab(initialTab);
    setExec((prev) => ({ ...prev, result: 'Pass', comment: '', evidenceUrl: '', bugSummary: `[${tc.jiraIssueKey ?? 'LOCAL'}] ${tc.summary}` }));
  }, [tc.id, tc.jiraIssueKey, tc.summary, initialTab]);

  const jiraSettingsQuery = useQuery({ queryKey: ['jira-settings'], queryFn: getJiraSettings });
  const executionsQuery = useQuery({ queryKey: ['executions', tc.id], queryFn: () => getExecutions(tc.id) });
  const executions = executionsQuery.data ?? [];
  const lastExec = executions[0];
  const link = jiraBrowseUrl(jiraSettingsQuery.data?.baseUrl, tc.jiraIssueKey);

  const createMutation = useMutation({
    mutationFn: (payload: CreateExecutionPayload) => createExecution(tc.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', tc.id] });
      queryClient.invalidateQueries({ queryKey: ['all-test-cases'] });
      queryClient.invalidateQueries({ queryKey: ['recent-executions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setTab('history');
    }
  });

  const willCreateBug = exec.result === 'Fail' && exec.createBug;
  const canSave = !willCreateBug || Boolean(exec.bugSummary.trim());

  const save = () => {
    if (!canSave) return;
    createMutation.mutate({
      result: exec.result,
      executedBy: exec.executedBy || undefined,
      comment: exec.comment || undefined,
      evidenceUrl: exec.evidenceUrl || undefined,
      createBug: willCreateBug,
      bugSummary: willCreateBug ? exec.bugSummary : undefined,
      bugDescription: willCreateBug ? exec.bugDescription : undefined
    });
  };

  const copy = () => {
    navigator.clipboard?.writeText(tc.gherkinText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="drawer">
      <div className="dhead">
        <button className="close" onClick={onClose} title="Cerrar (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="pillrow">
          <span className="tc-key">{tc.jiraIssueKey ?? 'LOCAL'}</span>
          {tc.tags.map((t) => <Tag key={t}>{t}</Tag>)}
        </div>
        <h3>{tc.summary}</h3>
        <div className="meta">
          <span className="mi">{projEmoji(tc.projectKey)} <b style={{ color: 'var(--text-2)', fontWeight: 600 }}>{tc.projectKey}</b></span>
          <span>·</span>
          <span className="mi"><Avatar person={tc.assigneeDisplayName ? { name: tc.assigneeDisplayName, initials: initialsOf(tc.assigneeDisplayName) } : null} size={18} /> {tc.assigneeDisplayName || 'sin asignar'}</span>
          <span>·</span>
          <span className="mi"><JiraStatusPill status={tc.jiraStatus} /></span>
        </div>
        <div className="meta" style={{ marginTop: 8 }}>
          <StatusPill r={tc.lastExecutionResult} />
          <AutomationMenu tc={tc} />
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'gherkin' ? 'active' : ''}`} onClick={() => setTab('gherkin')}>📝 Gherkin</div>
        <div className={`tab ${tab === 'execute' ? 'active' : ''}`} onClick={() => setTab('execute')}>▶ Ejecutar</div>
        <div className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          🕒 Historial <span className="cnt">{executions.length}</span>
        </div>
      </div>

      <div className="dbody">
        {tab === 'gherkin' && (
          <>
            <div className="dsection-title">
              <span>📄 {(tc.featureName || 'feature').toLowerCase().replace(/\s+/g, '-')}.feature</span>
              <span style={{ flex: 1 }} />
              <button className="btn ghost sm" style={{ height: 22, padding: '0 8px', fontSize: 11.5 }} onClick={copy}>
                {copied ? '✓ Copiado' : '⧉ Copiar'}
              </button>
            </div>
            <GherkinPre text={tc.gherkinText} />

            <div className="dsection-title">🕒 Última ejecución</div>
            {lastExec ? (
              <div className="last-exec">
                <Avatar person={{ name: lastExec.executedBy, initials: initialsOf(lastExec.executedBy) }} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="who" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <b>{lastExec.executedBy || 'QA'}</b>
                    <StatusPill r={lastExec.result} />
                    {lastExec.jiraBugKey && <span className="pill fail"><span className="dot" />🐞 {lastExec.jiraBugKey}</span>}
                  </div>
                  <div className="when">{fmtRel(lastExec.createdAt)}{lastExec.comment ? ` · "${lastExec.comment.slice(0, 100)}${lastExec.comment.length > 100 ? '…' : ''}"` : ''}</div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Sin ejecuciones registradas.</div>
            )}
          </>
        )}

        {tab === 'execute' && (
          <>
            <div className="field-label">Resultado</div>
            <div className="results-pick">
              <button className={`pass ${exec.result === 'Pass' ? 'on' : ''}`} onClick={() => setExec({ ...exec, result: 'Pass' })}>
                <span className="rcircle">✓</span>Pass
              </button>
              <button className={`fail ${exec.result === 'Fail' ? 'on' : ''}`} onClick={() => setExec({ ...exec, result: 'Fail' })}>
                <span className="rcircle">✕</span>Fail
              </button>
              <button className={`blk ${exec.result === 'Blocked' ? 'on' : ''}`} onClick={() => setExec({ ...exec, result: 'Blocked' })}>
                <span className="rcircle">◐</span>Blocked
              </button>
            </div>

            <div className="field-label" style={{ marginTop: 16 }}>Comentario</div>
            <textarea className="textarea" rows={3} placeholder="Notas, observaciones, contexto del entorno…" value={exec.comment} onChange={(e) => setExec({ ...exec, comment: e.target.value })} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <div>
                <div className="field-label">Evidencia</div>
                <input className="input" placeholder="https://drive.example/…" value={exec.evidenceUrl} onChange={(e) => setExec({ ...exec, evidenceUrl: e.target.value })} />
              </div>
              <div>
                <div className="field-label">Ejecutado por</div>
                <input className="input" placeholder="QA" value={exec.executedBy} onChange={(e) => setExec({ ...exec, executedBy: e.target.value })} />
              </div>
            </div>

            <div className={`bug-block ${willCreateBug ? 'active' : ''}`} style={exec.result !== 'Fail' ? { opacity: 0.55, pointerEvents: 'none' } : undefined}>
              <div className="head" onClick={() => exec.result === 'Fail' && setExec({ ...exec, createBug: !exec.createBug })}>
                <span className="ck" style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid var(--fail-fg)', background: willCreateBug ? 'var(--fail-fg)' : 'transparent', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {willCreateBug && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
                  )}
                </span>
                <span className="lbl-text">🐞 Crear bug en Jira y linkear al test case</span>
              </div>
              {willCreateBug && (
                <div style={{ marginTop: 12 }}>
                  <input className="input" value={exec.bugSummary} onChange={(e) => setExec({ ...exec, bugSummary: e.target.value })} style={{ background: 'white', borderColor: '#F5C7C2' }} />
                  <textarea className="textarea" rows={3} value={exec.bugDescription} onChange={(e) => setExec({ ...exec, bugDescription: e.target.value })} style={{ background: 'white', borderColor: '#F5C7C2', marginTop: 8 }} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 11.5, color: 'var(--text-3)' }}>
                    <span>tipo</span>
                    <span className="pill fail"><span className="dot" />🐞 Bug</span>
                    <span>· proyecto</span>
                    <span className="pill info"><span className="dot" />{tc.projectKey}</span>
                    <span>· link</span>
                    <span className="tag">Relates</span>
                  </div>
                </div>
              )}
            </div>

            {createMutation.isError && <div style={{ marginTop: 12, color: 'var(--fail-fg)', fontSize: 12.5 }}>No se pudo guardar la ejecución.</div>}
          </>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {executions.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
                Sin ejecuciones registradas para este caso aún.
              </div>
            ) : (
              executions.map((ex) => (
                <div key={ex.id} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar person={{ name: ex.executedBy, initials: initialsOf(ex.executedBy) }} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <b style={{ fontSize: 12.5 }}>{ex.executedBy || 'QA'}</b>
                      <StatusPill r={ex.result} />
                      {ex.jiraBugKey && <span className="pill fail"><span className="dot" />🐞 {ex.jiraBugKey}</span>}
                    </div>
                    {ex.comment && <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{ex.comment}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{fmtRel(ex.createdAt)} · {fmtDate(ex.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="dfoot">
        {link ? (
          <a className="btn sm ghost" href={link} target="_blank" rel="noreferrer">🔗 Ver en Jira</a>
        ) : (
          <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>sin link Jira</span>
        )}
        {tab === 'execute' ? (
          <button className="btn primary sm" disabled={!canSave || createMutation.isPending} onClick={save}>
            ✓ {createMutation.isPending ? 'Guardando…' : 'Guardar ejecución'}
          </button>
        ) : (
          <button className="btn primary sm" onClick={() => setTab('execute')}>▶ Ejecutar caso</button>
        )}
      </div>
    </div>
  );
}
