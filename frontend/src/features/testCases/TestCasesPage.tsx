import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getAllTestCases, getHealth } from '../../api/testCasesApi';
import { Avatar, Empty, StatusPill, Tag } from '../../components/design/primitives';
import { FilterChip, type FilterOption } from '../../components/design/filters';
import { fmtRel, initialsOf, projEmoji } from '../../lib/design';
import {
  activeFilterCount,
  computeKpis,
  countBy,
  deriveProjects,
  emptyFilters,
  filterCases,
  toCsv,
  type CaseFilters
} from '../../lib/selectors';
import { useOpenSync } from '../../layout/AppLayout';
import { TestCaseDrawer } from './TestCaseDrawer';
import type { TestCaseDto } from '../../types/contracts';

const AUTOMATION = ['ManualOnly', 'ReadyToAutomate', 'InAutomation', 'Automated', 'Flaky', 'Deprecated'];
const STATUS_SWATCH: Record<string, string> = {
  'To Do': 'var(--text-3)',
  'In Progress': 'var(--info-fg)',
  'In Review': 'var(--violet-fg)',
  Done: 'var(--pass-fg)'
};
const RESULT_SWATCH: Record<string, string> = { Pass: 'var(--pass-dot)', Fail: 'var(--fail-dot)', Blocked: 'var(--blk-dot)', NotRun: '#CFC8DC' };
const PAGE_SIZE = 8;

function downloadCsv(cases: TestCaseDto[]) {
  const blob = new Blob([toCsv(cases)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test-cases.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function TestCasesPage() {
  const openSync = useOpenSync();
  const [searchParams] = useSearchParams();
  const initialProject = searchParams.get('proj') ?? undefined;

  const casesQuery = useQuery({ queryKey: ['all-test-cases'], queryFn: getAllTestCases });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });
  const all = casesQuery.data ?? [];

  const [filters, setFilters] = useState<CaseFilters>(() => emptyFilters(initialProject));
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (initialProject) {
      setFilters(emptyFilters(initialProject));
      setPage(1);
    }
  }, [initialProject]);

  const setKey = (key: keyof CaseFilters) => (val: Set<string>) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };
  const clearAll = () => {
    setFilters(emptyFilters());
    setPage(1);
  };

  const filtered = useMemo(() => filterCases(all, filters, search), [all, filters, search]);
  const counts = useMemo(
    () => ({
      project: countBy(all, 'projectKey'),
      status: countBy(all, 'jiraStatus'),
      tag: countBy(all, 'tags'),
      automation: countBy(all, 'automationStatus'),
      result: countBy(all, 'result')
    }),
    [all]
  );
  const kpis = computeKpis(filtered);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [pageCount, page]);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = all.find((t) => t.id === selectedId) ?? null;

  const lastSync = all.reduce<string | null>((acc, tc) => (tc.lastSyncedAt && (!acc || tc.lastSyncedAt > acc) ? tc.lastSyncedAt : acc), null);
  const jiraMode = healthQuery.data?.jiraMode ?? 'mock';
  const activeCount = activeFilterCount(filters);

  const projectOpts: FilterOption[] = deriveProjects(all).map((p) => ({ value: p.key, label: p.key, emoji: projEmoji(p.key) }));
  const statusOpts: FilterOption[] = [...counts.status.keys()].map((s) => ({ value: s, label: s, swatch: STATUS_SWATCH[s] || 'var(--text-3)' }));
  const tagOpts: FilterOption[] = [...counts.tag.keys()].sort().map((t) => ({ value: t, label: t }));
  const automationOpts: FilterOption[] = AUTOMATION.map((a) => ({ value: a, label: a }));
  const resultOpts: FilterOption[] = ['Pass', 'Fail', 'Blocked', 'NotRun'].map((r) => ({ value: r, label: r === 'NotRun' ? 'Not run' : r, swatch: RESULT_SWATCH[r] }));

  return (
    <div className="content">
      <div className="topbar">
        <div className="crumb">
          <span className="home">🧪</span>
          <span>QA</span>
          <span style={{ color: 'var(--text-4)' }}>›</span>
          <b>Test Cases</b>
          {filters.project.size === 1 && (
            <>
              <span style={{ color: 'var(--text-4)' }}>›</span>
              <span>{Array.from(filters.project)[0]}</span>
            </>
          )}
        </div>
        <span style={{ flex: 1 }} />
        <div className="topbar-search">
          <span style={{ color: 'var(--text-3)' }}>🔍</span>
          <input placeholder="Buscar key, summary, feature…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button className="btn" onClick={() => downloadCsv(filtered)}><span>📤</span>CSV</button>
        <button className="btn primary" onClick={openSync}><span>🔄</span>Sincronizar</button>
      </div>

      <div className="scroll">
        <div className="hero">
          <div className="hero-l">
            <span className="hero-emoji">🧪</span>
            <div>
              <h1>Test Cases</h1>
              <div className="sub">
                <b>{all.length}</b> casos sincronizados desde Jira · mostrando <b>{filtered.length}</b>
                {activeCount > 0 && <> con <b>{activeCount}</b> filtro(s)</>}
                {lastSync && <> · última sync <b>{fmtRel(lastSync)}</b></>}
              </div>
            </div>
          </div>
          <div className="hero-r">
            <span className={`pill ${jiraMode === 'real' ? 'pass' : 'blk'}`}><span className="dot" />{jiraMode === 'real' ? 'Jira real' : 'mock mode'}</span>
          </div>
        </div>

        <div className="kpis">
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#A09BB0' }}>Σ</span>Total</div>
            <div className="val">{kpis.total}</div>
            <div className="sub">de <b>{all.length}</b> globales</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#34C77B' }}>✓</span>Pass rate</div>
            <div className="val">{kpis.passRate}<span className="suf">%</span></div>
            <div className="bar"><span style={{ width: `${kpis.passRate}%`, background: '#34C77B' }} /></div>
            <div className="sub"><b>{kpis.passed}</b>/<b>{kpis.run}</b> corridos</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#E55747' }}>✕</span>Failed</div>
            <div className="val" style={{ color: kpis.failed > 0 ? '#B33A2E' : 'var(--text-3)' }}>{kpis.failed}</div>
            <div className="sub">{kpis.failed > 0 ? <><b>{kpis.failed}</b> bug(s)</> : 'sin fallas'}</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#E4A53A' }}>◐</span>Blocked</div>
            <div className="val" style={{ color: kpis.blocked > 0 ? '#8A5C16' : 'var(--text-3)' }}>{kpis.blocked}</div>
            <div className="sub">{kpis.blocked > 0 ? 'acción' : 'limpio'}</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#A09BB0' }}>○</span>Not run</div>
            <div className="val">{kpis.notrun}</div>
            <div className="sub">pendientes</div>
          </div>
          <div className="kpi">
            <div className="lbl"><span className="ic" style={{ background: '#7C5CFF' }}>🤖</span>Automation</div>
            <div className="val">{kpis.autoCov}<span className="suf">%</span></div>
            <div className="bar"><span style={{ width: `${kpis.autoCov}%`, background: '#7C5CFF' }} /></div>
            <div className="sub"><b>{kpis.automated}</b> auto</div>
          </div>
        </div>

        <div className="filterbar">
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-2)', marginRight: 4 }}>Filtrar</span>
          <FilterChip label="Proyecto" icon="🗂" values={filters.project} onChange={setKey('project')} options={projectOpts} getCount={(v) => counts.project.get(v) || 0} />
          <FilterChip label="Status" icon="●" values={filters.status} onChange={setKey('status')} options={statusOpts} getCount={(v) => counts.status.get(v) || 0} searchable={false} />
          <FilterChip label="Tag" icon="🏷" values={filters.tag} onChange={setKey('tag')} options={tagOpts} getCount={(v) => counts.tag.get(v) || 0} />
          <FilterChip label="Automation" icon="🤖" values={filters.automation} onChange={setKey('automation')} options={automationOpts} getCount={(v) => counts.automation.get(v) || 0} searchable={false} />
          <FilterChip label="Resultado" icon="✓" values={filters.result} onChange={setKey('result')} options={resultOpts} getCount={(v) => counts.result.get(v) || 0} searchable={false} />
          <span style={{ flex: 1 }} />
          {activeCount > 0 && <button className="btn ghost sm" onClick={clearAll}>✕ Limpiar todo</button>}
        </div>

        <div className={`main ${!selected ? 'no-drawer' : ''}`}>
          <div className="listcard">
            <div className="listhead">
              <h2>Casos</h2>
              <span className="meta">· mostrando <b>{filtered.length === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}</b> de <b>{filtered.length}</b></span>
            </div>
            <div className="list">
              {casesQuery.isLoading ? (
                <Empty icon="⏳" title="Cargando casos…" />
              ) : pageData.length === 0 ? (
                <Empty icon="🔎" title="Ningún caso coincide" hint="Probá ajustar los filtros o limpiarlos." action={<button className="btn sm" onClick={clearAll}>✕ Limpiar filtros</button>} />
              ) : (
                pageData.map((tc) => (
                  <div key={tc.id} className={`tcrow ${tc.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(tc.id)}>
                    <span className="tc-key">{tc.jiraIssueKey ?? 'LOCAL'}</span>
                    <div>
                      <div className="tc-sum">{tc.summary}</div>
                      <div className="tc-meta">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {projEmoji(tc.projectKey)}
                          <b style={{ color: 'var(--text-2)', fontWeight: 600 }}>{tc.projectKey}</b>
                        </span>
                        {tc.featureName && <><span className="dot" /><span>{tc.featureName}</span></>}
                        {tc.tags.length > 0 && <span className="dot" />}
                        {tc.tags.slice(0, 2).map((t) => <Tag key={t}>{t}</Tag>)}
                        {tc.tags.length > 2 && <span style={{ color: 'var(--text-4)', fontSize: 11 }}>+{tc.tags.length - 2}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StatusPill r={tc.lastExecutionResult} />
                      <Avatar person={tc.assigneeDisplayName ? { name: tc.assigneeDisplayName, initials: initialsOf(tc.assigneeDisplayName) } : null} size={24} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {filtered.length > PAGE_SIZE && (
              <div className="pager">
                <span>Página <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{page}</span> de <span className="mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{pageCount}</span></span>
                <div className="pages">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).slice(0, 5).map((p) => (
                    <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  {pageCount > 5 && <span style={{ color: 'var(--text-4)' }}>…</span>}
                  <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>›</button>
                </div>
              </div>
            )}
          </div>

          {selected && <TestCaseDrawer tc={selected} onClose={() => setSelectedId(null)} />}
        </div>
      </div>
    </div>
  );
}
