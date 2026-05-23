import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllTestCases, getHealth, getJiraSettings, getRecentExecutions } from '../../api/testCasesApi';
import { Avatar, Empty, StatusPill } from '../../components/design/primitives';
import { fmtRel, initialsOf, jiraBrowseUrl, projEmoji } from '../../lib/design';
import { openBugs } from '../../lib/selectors';
import { useOpenSync } from '../../layout/AppLayout';

export function BugsPage() {
  const navigate = useNavigate();
  const openSync = useOpenSync();

  const casesQuery = useQuery({ queryKey: ['all-test-cases'], queryFn: getAllTestCases });
  const execQuery = useQuery({ queryKey: ['recent-executions', 200], queryFn: () => getRecentExecutions(200) });
  const jiraQuery = useQuery({ queryKey: ['jira-settings'], queryFn: getJiraSettings });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });

  const all = casesQuery.data ?? [];
  const executions = execQuery.data ?? [];
  const baseUrl = jiraQuery.data?.baseUrl ?? null;
  const jiraMode = healthQuery.data?.jiraMode ?? 'mock';

  const rows = openBugs(all, executions);
  const withBug = rows.filter((r) => r.bugKey).length;
  const withoutBug = rows.length - withBug;

  const openCase = (id: string) => navigate(`/test-cases?case=${encodeURIComponent(id)}`);
  const reportBug = (id: string) => navigate(`/test-cases?case=${encodeURIComponent(id)}&tab=execute`);

  return (
    <div className="content">
      <div className="topbar">
        <div className="crumb">
          <span className="home">🐞</span>
          <span>QA</span>
          <span style={{ color: 'var(--text-4)' }}>›</span>
          <b>Bugs abiertos</b>
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={openSync}><span>🔄</span>Sincronizar</button>
      </div>

      <div className="scroll">
        <div className="hero">
          <div className="hero-l">
            <span className="hero-emoji" style={{ background: 'linear-gradient(135deg, #FFB3A8, #E55747)' }}>🐞</span>
            <div>
              <h1>Bugs abiertos</h1>
              <div className="sub">
                {rows.length === 0 ? (
                  <>Sin casos en falla 🎉</>
                ) : (
                  <>
                    <b style={{ color: 'var(--fail-fg)' }}>{rows.length} caso(s) en falla</b>
                    {' · '}<b>{withBug}</b> con bug en Jira
                    {withoutBug > 0 && <> · <b>{withoutBug}</b> sin reportar</>}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hero-r">
            <span className={`pill ${jiraMode === 'real' ? 'pass' : 'blk'}`}><span className="dot" />{jiraMode === 'real' ? 'Jira real' : 'mock mode'}</span>
            <button className="btn" onClick={() => navigate('/test-cases')}>Ver test cases →</button>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#E55747' }}>✕</span>En falla</div>
            <div className="val" style={{ color: rows.length > 0 ? '#B33A2E' : 'var(--text-3)' }}>{rows.length}</div>
            <div className="sub">última ejecución = Fail</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#7C5CFF' }}>🐞</span>Con bug</div>
            <div className="val">{withBug}</div>
            <div className="sub">linkeados a Jira</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#E4A53A' }}>!</span>Sin reportar</div>
            <div className="val" style={{ color: withoutBug > 0 ? '#8A5C16' : 'var(--text-3)' }}>{withoutBug}</div>
            <div className="sub">{withoutBug > 0 ? 'requieren bug' : 'todo reportado'}</div>
          </div>
        </div>

        <div className="listcard">
          <div className="listhead">
            <h2>Casos en falla</h2>
            <span className="meta">· <b>{rows.length}</b> en total</span>
          </div>
          <div className="list">
            {casesQuery.isLoading || execQuery.isLoading ? (
              <Empty icon="⏳" title="Cargando bugs…" />
            ) : casesQuery.isError ? (
              <Empty icon="⚠️" title="No se pudieron cargar los casos" hint="Verificá que el backend esté arriba (Settings → Estado)." />
            ) : rows.length === 0 ? (
              <Empty icon="🎉" title="Sin bugs abiertos" hint="Ningún caso tiene su última ejecución en Fail." />
            ) : (
              rows.map(({ testCase: tc, bugKey, executedBy, failedAt }) => {
                const link = jiraBrowseUrl(baseUrl, bugKey);
                return (
                  <div key={tc.id} className="tcrow" onClick={() => openCase(tc.id)}>
                    <span className="tc-key">{tc.jiraIssueKey ?? 'LOCAL'}</span>
                    <div>
                      <div className="tc-sum">{tc.summary}</div>
                      <div className="tc-meta">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {projEmoji(tc.projectKey)}
                          <b style={{ color: 'var(--text-2)', fontWeight: 600 }}>{tc.projectKey}</b>
                        </span>
                        <span className="dot" />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Avatar person={executedBy ? { name: executedBy, initials: initialsOf(executedBy) } : null} size={18} />
                          {executedBy || tc.assigneeDisplayName || 'sin asignar'}
                        </span>
                        <span className="dot" />
                        <span>{fmtRel(failedAt)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusPill r="Fail" />
                      {bugKey ? (
                        link ? (
                          <a className="pill fail" href={link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="Ver bug en Jira">
                            <span className="dot" />🐞 {bugKey} ↗
                          </a>
                        ) : (
                          <span className="pill fail"><span className="dot" />🐞 {bugKey}</span>
                        )
                      ) : (
                        <button className="btn sm" onClick={(e) => { e.stopPropagation(); reportBug(tc.id); }} title="Abrir el caso en la pestaña Ejecutar para reportar el bug">
                          🐞 Reportar bug
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
