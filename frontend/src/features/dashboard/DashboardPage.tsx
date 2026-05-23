import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllTestCases, getHealth, getRecentExecutions } from '../../api/testCasesApi';
import { StatusPill } from '../../components/design/primitives';
import { avatarColor, fmtRel, initialsOf, projEmoji } from '../../lib/design';
import { computeKpis, perProject, resultOf, tagCounts } from '../../lib/selectors';
import { useOpenSync } from '../../layout/AppLayout';

export function DashboardPage() {
  const navigate = useNavigate();
  const openSync = useOpenSync();

  const casesQuery = useQuery({ queryKey: ['all-test-cases'], queryFn: getAllTestCases });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });
  const recentQuery = useQuery({ queryKey: ['recent-executions', 50], queryFn: () => getRecentExecutions(50) });

  const all = casesQuery.data ?? [];
  const activity = recentQuery.data ?? [];
  const k = computeKpis(all);
  const total = k.total || 1; // avoid divide-by-zero for widths
  const projects = perProject(all);
  const tagsSorted = tagCounts(all);
  const failures = all.filter((t) => resultOf(t) === 'Fail').slice(0, 5);
  const recent = activity.slice(0, 6);
  const jiraMode = healthQuery.data?.jiraMode ?? 'mock';
  const lastSync = all.reduce<string | null>((acc, tc) => (tc.lastSyncedAt && (!acc || tc.lastSyncedAt > acc) ? tc.lastSyncedAt : acc), null);

  const bugByCase = new Map<string, string>();
  activity.forEach((ex) => {
    if (ex.jiraBugKey && !bugByCase.has(ex.testCaseId)) bugByCase.set(ex.testCaseId, ex.jiraBugKey);
  });

  const assignees = [...new Set(all.map((t) => t.assigneeDisplayName).filter((n): n is string => Boolean(n)))];

  return (
    <div className="content">
      <div className="topbar">
        <div className="crumb">
          <span className="home">🏠</span>
          <span>QA</span>
          <span style={{ color: 'var(--text-4)' }}>›</span>
          <b>Dashboard</b>
        </div>
        <span style={{ flex: 1 }} />
        {assignees.length > 0 && (
          <span className="avstack">
            {assignees.slice(0, 3).map((name) => (
              <span key={name} className="av" style={{ background: avatarColor(name) }} title={name}>{initialsOf(name)}</span>
            ))}
            {assignees.length > 3 && <span className="av" style={{ background: '#EFE9FF', color: '#7C5CFF' }}>+{assignees.length - 3}</span>}
          </span>
        )}
        <button className="btn primary" onClick={openSync}><span>🔄</span>Sincronizar</button>
      </div>

      <div className="scroll">
        {casesQuery.isError && (
          <div className="error-banner">⚠️ No se pudo conectar con el backend. Verificá que esté arriba (Settings → Estado).</div>
        )}
        <div className="hero">
          <div className="hero-l">
            <span className="hero-emoji">👋</span>
            <div>
              <h1>Resumen de QA</h1>
              <div className="sub">
                Tenés <b>{k.notrun} casos pendientes</b> de ejecutar
                {k.failed > 0 && <> · <b style={{ color: 'var(--fail-fg)' }}>{k.failed} fallas</b> requieren atención</>}
                {k.blocked > 0 && <> · <b style={{ color: 'var(--blk-fg)' }}>{k.blocked} bloqueados</b></>}
                {lastSync && <> · última sync <b>{fmtRel(lastSync)}</b></>}
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
            <div className="lbl"><span className="ic" style={{ background: '#A09BB0' }}>Σ</span>Total casos</div>
            <div className="val">{k.total}</div>
            <div className="sub">en <b>{projects.length}</b> proyecto(s)</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#34C77B' }}>✓</span>Pass rate</div>
            <div className="val">{k.passRate}<span className="suf">%</span></div>
            <div className="bar"><span style={{ width: `${k.passRate}%`, background: '#34C77B' }} /></div>
            <div className="sub"><b>{k.passed}</b> / <b>{k.run}</b> corridos</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#E55747' }}>✕</span>Failed</div>
            <div className="val" style={{ color: k.failed > 0 ? '#B33A2E' : 'var(--text-3)' }}>{k.failed}</div>
            <div className="sub">{k.failed > 0 ? <><b>{k.failed}</b> con falla</> : 'sin fallas 🎉'}</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#E4A53A' }}>◐</span>Blocked</div>
            <div className="val" style={{ color: k.blocked > 0 ? '#8A5C16' : 'var(--text-3)' }}>{k.blocked}</div>
            <div className="sub">{k.blocked > 0 ? 'requieren acción' : 'todo desbloqueado'}</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#A09BB0' }}>○</span>Not run</div>
            <div className="val">{k.notrun}</div>
            <div className="sub">pendientes de ejecución</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#7C5CFF' }}>🤖</span>Automation</div>
            <div className="val">{k.autoCov}<span className="suf">%</span></div>
            <div className="bar"><span style={{ width: `${k.autoCov}%`, background: '#7C5CFF' }} /></div>
            <div className="sub"><b>{k.automated}</b> automatizados</div>
          </div>
        </div>

        <div className="dash-row cols-2">
          <div className="dash-card">
            <div className="dash-card-head">
              <h3>📊 Resultado de la última ejecución</h3>
              <span className="meta"><b style={{ color: 'var(--text)' }}>{k.total}</b> casos totales</span>
            </div>
            <div className="dash-card-body">
              <div className="stack-bar">
                <span title={`Pass · ${k.passed}`} style={{ width: `${(k.passed / total) * 100}%`, background: 'var(--pass-dot)' }} />
                <span title={`Fail · ${k.failed}`} style={{ width: `${(k.failed / total) * 100}%`, background: 'var(--fail-dot)' }} />
                <span title={`Blocked · ${k.blocked}`} style={{ width: `${(k.blocked / total) * 100}%`, background: 'var(--blk-dot)' }} />
                <span title={`Not run · ${k.notrun}`} style={{ width: `${(k.notrun / total) * 100}%`, background: '#CFC8DC' }} />
              </div>
              <div className="stack-legend">
                {([['Pass', k.passed, 'var(--pass-dot)'], ['Fail', k.failed, 'var(--fail-dot)'], ['Blocked', k.blocked, 'var(--blk-dot)'], ['Not run', k.notrun, '#CFC8DC']] as Array<[string, number, string]>).map(([label, n, color]) => (
                  <div className="item" key={label}>
                    <span className="ll"><span className="sw" style={{ background: color }} />{label}</span>
                    <span className="rr"><b>{n}</b>{Math.round((n / total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3>🗂 Por proyecto</h3>
              <span className="meta">{projects.length} proyecto(s)</span>
            </div>
            <div>
              <div className="proj-row h">
                <span></span>
                <span>Proyecto</span>
                <span style={{ textAlign: 'right' }}>Casos</span>
                <span>Pass / Fail / Blk / NR</span>
                <span style={{ textAlign: 'right' }}>Pass</span>
              </div>
              {projects.map((p) => (
                <div key={p.key} className="proj-row">
                  <span style={{ fontSize: 16 }}>{projEmoji(p.key)}</span>
                  <span className="nm">
                    <span className="t">{p.name}</span>
                    <span className="k">{p.key}</span>
                  </span>
                  <span className="cnt">{p.total}</span>
                  <span className="proj-bar">
                    {p.total > 0 && (
                      <>
                        <span style={{ width: `${(p.pass / p.total) * 100}%`, background: 'var(--pass-dot)' }} />
                        <span style={{ width: `${(p.fail / p.total) * 100}%`, background: 'var(--fail-dot)' }} />
                        <span style={{ width: `${(p.blk / p.total) * 100}%`, background: 'var(--blk-dot)' }} />
                        <span style={{ width: `${(p.nr / p.total) * 100}%`, background: '#CFC8DC' }} />
                      </>
                    )}
                  </span>
                  <span className="pct">{p.passRate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-row cols-3">
          <div className="dash-card">
            <div className="dash-card-head">
              <h3>🐞 Fallas recientes</h3>
              <a href="/test-cases" onClick={(e) => { e.preventDefault(); navigate('/test-cases'); }} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 12.5, fontWeight: 600, marginLeft: 'auto' }}>
                Ver todas →
              </a>
            </div>
            <div>
              {failures.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Sin fallas recientes 🎉</div>}
              {failures.map((tc) => {
                const bug = bugByCase.get(tc.id);
                return (
                  <div key={tc.id} className="fail-row" onClick={() => navigate('/test-cases')}>
                    <span className="tc-key">{tc.jiraIssueKey ?? 'LOCAL'}</span>
                    <div className="sm">
                      {tc.summary}
                      {bug && <span className="cmt">🐞 <span className="mono" style={{ color: 'var(--fail-fg)', fontWeight: 600 }}>{bug}</span></span>}
                    </div>
                    <StatusPill r="Fail" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3>🏷 Tags Gherkin</h3>
              <span className="meta">{tagsSorted.length} únicos</span>
            </div>
            <div className="dash-card-body">
              <div className="tag-grid">
                {tagsSorted.length === 0 && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Sin tags todavía.</span>}
                {tagsSorted.map(([tag, n]) => (
                  <span key={tag} className="tg" title={`${n} casos`}>{tag} <b>{n}</b></span>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <h3>🕒 Actividad reciente</h3>
              <span className="meta">últimas {recent.length}</span>
            </div>
            <div>
              {recent.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Sin ejecuciones todavía.</div>}
              {recent.map((ex) => (
                <div key={ex.id} className="act-row" onClick={() => navigate('/test-cases')}>
                  <StatusPill r={ex.result} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                      <span className="mono" style={{ color: 'var(--text-3)', marginRight: 6, fontSize: 11.5 }}>{ex.jiraIssueKey}</span>
                      {ex.testCaseSummary}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>por <b style={{ fontWeight: 600 }}>{ex.executedBy || 'QA'}</b></div>
                  </div>
                  <span className="ts">{fmtRel(ex.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
