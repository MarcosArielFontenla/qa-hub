import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllTestCases, getHealth, getJiraSettings, getRecentExecutions } from '../../api/testCasesApi';
import { Avatar, Empty, StatusPill } from '../../components/design/primitives';
import { FilterChip, type FilterOption } from '../../components/design/filters';
import { fmtDate, fmtRel, initialsOf, jiraBrowseUrl, projEmoji } from '../../lib/design';
import { execProjectKey, filterExecutions } from '../../lib/selectors';
import { useOpenSync } from '../../layout/AppLayout';

const FEED_SIZE = 200;
const PAGE_STEP = 25;
const RESULT_SWATCH: Record<string, string> = { Pass: 'var(--pass-dot)', Fail: 'var(--fail-dot)', Blocked: 'var(--blk-dot)', NotRun: '#CFC8DC' };

export function ExecutionsPage() {
  const navigate = useNavigate();
  const openSync = useOpenSync();

  const execQuery = useQuery({ queryKey: ['recent-executions', FEED_SIZE], queryFn: () => getRecentExecutions(FEED_SIZE) });
  const casesQuery = useQuery({ queryKey: ['all-test-cases'], queryFn: getAllTestCases });
  const jiraQuery = useQuery({ queryKey: ['jira-settings'], queryFn: getJiraSettings });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });

  const executions = execQuery.data ?? [];
  const cases = casesQuery.data ?? [];
  const baseUrl = jiraQuery.data?.baseUrl ?? null;
  const jiraMode = healthQuery.data?.jiraMode ?? 'mock';

  const projByCase = useMemo(() => new Map(cases.map((tc) => [tc.id, tc.projectKey] as [string, string])), [cases]);

  const [resultSet, setResultSet] = useState<Set<string>>(new Set());
  const [projSet, setProjSet] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(PAGE_STEP);

  const { resultCounts, projCounts } = useMemo(() => {
    const r = new Map<string, number>();
    const p = new Map<string, number>();
    for (const ex of executions) {
      r.set(ex.result, (r.get(ex.result) || 0) + 1);
      const k = execProjectKey(ex, projByCase);
      p.set(k, (p.get(k) || 0) + 1);
    }
    return { resultCounts: r, projCounts: p };
  }, [executions, projByCase]);

  const filtered = useMemo(
    () => filterExecutions(executions, projByCase, resultSet, projSet),
    [executions, projByCase, resultSet, projSet]
  );

  const shown = filtered.slice(0, visible);
  const activeCount = resultSet.size + projSet.size;
  const openCase = (id: string) => navigate(`/test-cases?case=${encodeURIComponent(id)}`);

  const resultOpts: FilterOption[] = ['Pass', 'Fail', 'Blocked', 'NotRun'].map((r) => ({ value: r, label: r === 'NotRun' ? 'Not run' : r, swatch: RESULT_SWATCH[r] }));
  const projOpts: FilterOption[] = [...projCounts.keys()].sort().map((k) => ({ value: k, label: k, emoji: projEmoji(k) }));

  const onResult = (next: Set<string>) => { setResultSet(next); setVisible(PAGE_STEP); };
  const onProj = (next: Set<string>) => { setProjSet(next); setVisible(PAGE_STEP); };
  const clearAll = () => { setResultSet(new Set()); setProjSet(new Set()); setVisible(PAGE_STEP); };

  return (
    <div className="content">
      <div className="topbar">
        <div className="crumb">
          <span className="home">🕒</span>
          <span>QA</span>
          <span style={{ color: 'var(--text-4)' }}>›</span>
          <b>Ejecuciones</b>
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn primary" onClick={openSync}><span>🔄</span>Sincronizar</button>
      </div>

      <div className="scroll">
        <div className="hero">
          <div className="hero-l">
            <span className="hero-emoji" style={{ background: 'linear-gradient(135deg, #B6E5FF, #7C5CFF)' }}>🕒</span>
            <div>
              <h1>Ejecuciones</h1>
              <div className="sub">
                Historial cronológico de corridas · <b>{executions.length}</b> registradas
                {activeCount > 0 && <> · mostrando <b>{filtered.length}</b> con <b>{activeCount}</b> filtro(s)</>}
              </div>
            </div>
          </div>
          <div className="hero-r">
            <span className={`pill ${jiraMode === 'real' ? 'pass' : 'blk'}`}><span className="dot" />{jiraMode === 'real' ? 'Jira real' : 'mock mode'}</span>
          </div>
        </div>

        <div className="filterbar">
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', marginRight: 4 }}>Filtrar</span>
          <FilterChip label="Resultado" icon="✓" values={resultSet} onChange={onResult} options={resultOpts} getCount={(v) => resultCounts.get(v) || 0} searchable={false} />
          <FilterChip label="Proyecto" icon="🗂" values={projSet} onChange={onProj} options={projOpts} getCount={(v) => projCounts.get(v) || 0} />
          <span style={{ flex: 1 }} />
          {activeCount > 0 && <button className="btn ghost sm" onClick={clearAll}>✕ Limpiar todo</button>}
        </div>

        <div className="listcard">
          <div className="listhead">
            <h2>Corridas</h2>
            <span className="meta">· mostrando <b>{shown.length}</b> de <b>{filtered.length}</b></span>
          </div>
          <div className="list">
            {execQuery.isLoading ? (
              <Empty icon="⏳" title="Cargando ejecuciones…" />
            ) : execQuery.isError ? (
              <Empty icon="⚠️" title="No se pudieron cargar las ejecuciones" hint="Verificá que el backend esté arriba (Settings → Estado)." />
            ) : filtered.length === 0 ? (
              <Empty
                icon={executions.length === 0 ? '🌱' : '🔎'}
                title={executions.length === 0 ? 'Sin ejecuciones todavía' : 'Ninguna coincide'}
                hint={executions.length === 0 ? 'Ejecutá un caso desde Test cases para verlo acá.' : 'Probá ajustar los filtros.'}
                action={activeCount > 0 ? <button className="btn sm" onClick={clearAll}>✕ Limpiar filtros</button> : undefined}
              />
            ) : (
              shown.map((ex) => {
                const proj = execProjectKey(ex, projByCase);
                const link = jiraBrowseUrl(baseUrl, ex.jiraBugKey);
                return (
                  <div key={ex.id} className="tcrow" onClick={() => openCase(ex.testCaseId)}>
                    <span className="tc-key">{ex.jiraIssueKey ?? 'LOCAL'}</span>
                    <div>
                      <div className="tc-sum">{ex.testCaseSummary || '(sin summary)'}</div>
                      <div className="tc-meta">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Avatar person={ex.executedBy ? { name: ex.executedBy, initials: initialsOf(ex.executedBy) } : null} size={18} />
                          {ex.executedBy || 'QA'}
                        </span>
                        <span className="dot" />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{projEmoji(proj)} <b style={{ color: 'var(--text-2)', fontWeight: 600 }}>{proj}</b></span>
                        <span className="dot" />
                        <span title={fmtDate(ex.createdAt)}>{fmtRel(ex.createdAt)}</span>
                        {ex.comment && <><span className="dot" /><span style={{ color: 'var(--text-3)' }}>"{ex.comment.slice(0, 60)}{ex.comment.length > 60 ? '…' : ''}"</span></>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusPill r={ex.result} />
                      {ex.jiraBugKey && (
                        link ? (
                          <a className="pill fail" href={link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="Ver bug en Jira">
                            <span className="dot" />🐞 {ex.jiraBugKey} ↗
                          </a>
                        ) : (
                          <span className="pill fail"><span className="dot" />🐞 {ex.jiraBugKey}</span>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {visible < filtered.length && (
            <div className="pager">
              <span>mostrando <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{shown.length}</span> de <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{filtered.length}</span></span>
              <button className="btn sm" onClick={() => setVisible((v) => v + PAGE_STEP)}>Cargar más</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
