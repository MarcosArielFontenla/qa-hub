import type { ExecutionResult, TestCaseDto, TestExecutionDto } from '../types/contracts';

export type ResultKey = 'Pass' | 'Fail' | 'Blocked' | 'NotRun';

export function resultOf(testCase: TestCaseDto): ResultKey {
  return (testCase.lastExecutionResult as ExecutionResult | null) ?? 'NotRun';
}

export interface ProjectInfo {
  key: string;
  name: string;
  count: number;
}

export function deriveProjects(cases: TestCaseDto[]): ProjectInfo[] {
  const map = new Map<string, number>();
  for (const tc of cases) map.set(tc.projectKey, (map.get(tc.projectKey) || 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, name: key, count }));
}

export interface Kpis {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  notrun: number;
  run: number;
  passRate: number;
  automated: number;
  autoCov: number;
}

export function computeKpis(cases: TestCaseDto[]): Kpis {
  const total = cases.length;
  const passed = cases.filter((t) => resultOf(t) === 'Pass').length;
  const failed = cases.filter((t) => resultOf(t) === 'Fail').length;
  const blocked = cases.filter((t) => resultOf(t) === 'Blocked').length;
  const notrun = cases.filter((t) => resultOf(t) === 'NotRun').length;
  const run = passed + failed + blocked;
  const passRate = run > 0 ? Math.round((passed / run) * 100) : 0;
  const automated = cases.filter((t) => t.automationStatus === 'Automated' || t.automationStatus === 'InAutomation').length;
  const autoCov = total > 0 ? Math.round((automated / total) * 100) : 0;
  return { total, passed, failed, blocked, notrun, run, passRate, automated, autoCov };
}

export interface ProjectStats extends ProjectInfo {
  total: number;
  pass: number;
  fail: number;
  blk: number;
  nr: number;
  passRate: number;
}

export function perProject(cases: TestCaseDto[]): ProjectStats[] {
  return deriveProjects(cases).map((p) => {
    const items = cases.filter((tc) => tc.projectKey === p.key);
    const pass = items.filter((t) => resultOf(t) === 'Pass').length;
    const fail = items.filter((t) => resultOf(t) === 'Fail').length;
    const blk = items.filter((t) => resultOf(t) === 'Blocked').length;
    const nr = items.filter((t) => resultOf(t) === 'NotRun').length;
    const run = pass + fail + blk;
    return { ...p, total: items.length, pass, fail, blk, nr, passRate: run > 0 ? Math.round((pass / run) * 100) : 0 };
  });
}

export function tagCounts(cases: TestCaseDto[]): Array<[string, number]> {
  const counts: Record<string, number> = {};
  cases.forEach((tc) => tc.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export type CountKey = 'projectKey' | 'jiraStatus' | 'automationStatus' | 'tags' | 'result';

export function countBy(cases: TestCaseDto[], key: CountKey): Map<string, number> {
  const map = new Map<string, number>();
  for (const tc of cases) {
    let values: Array<string | null | undefined>;
    if (key === 'tags') values = tc.tags;
    else if (key === 'result') values = [resultOf(tc)];
    else values = [tc[key] as string | null | undefined];
    for (const v of values) {
      if (v == null) continue;
      map.set(v, (map.get(v) || 0) + 1);
    }
  }
  return map;
}

export interface CaseFilters {
  project: Set<string>;
  status: Set<string>;
  tag: Set<string>;
  automation: Set<string>;
  result: Set<string>;
}

export function emptyFilters(initialProject?: string): CaseFilters {
  return {
    project: new Set(initialProject ? [initialProject] : []),
    status: new Set(),
    tag: new Set(),
    automation: new Set(),
    result: new Set()
  };
}

export function activeFilterCount(f: CaseFilters): number {
  return f.project.size + f.status.size + f.tag.size + f.automation.size + f.result.size;
}

export function filterCases(cases: TestCaseDto[], f: CaseFilters, search: string): TestCaseDto[] {
  const s = search.trim().toLowerCase();
  return cases.filter((tc) => {
    if (f.project.size && !f.project.has(tc.projectKey)) return false;
    if (f.status.size && !(tc.jiraStatus && f.status.has(tc.jiraStatus))) return false;
    if (f.tag.size && !tc.tags.some((t) => f.tag.has(t))) return false;
    if (f.automation.size && !f.automation.has(tc.automationStatus)) return false;
    if (f.result.size && !f.result.has(resultOf(tc))) return false;
    if (s) {
      const hit =
        tc.summary.toLowerCase().includes(s) ||
        (tc.jiraIssueKey || '').toLowerCase().includes(s) ||
        (tc.featureName || '').toLowerCase().includes(s);
      if (!hit) return false;
    }
    return true;
  });
}

export interface OpenBugRow {
  testCase: TestCaseDto;
  /** Jira bug key from the most recent execution that reported one, or null. */
  bugKey: string | null;
  /** Who ran the most recent execution for this case. */
  executedBy: string | null;
  /** When the case last failed (most recent execution, falling back to lastExecutedAt). */
  failedAt: string | null;
}

// Open bugs = test cases whose current result is Fail. Each row is enriched with the
// most recent execution's data (bug key / executor / date). `executions` is expected
// ordered by createdAt DESC (as returned by GET /api/executions). Returns rows sorted
// by failedAt DESC. Cases failing without a reported bug have bugKey === null.
export function openBugs(cases: TestCaseDto[], executions: TestExecutionDto[]): OpenBugRow[] {
  const recentByCase = new Map<string, TestExecutionDto>();
  const bugByCase = new Map<string, TestExecutionDto>();
  for (const ex of executions) {
    if (!recentByCase.has(ex.testCaseId)) recentByCase.set(ex.testCaseId, ex);
    if (ex.jiraBugKey && !bugByCase.has(ex.testCaseId)) bugByCase.set(ex.testCaseId, ex);
  }
  return cases
    .filter((tc) => resultOf(tc) === 'Fail')
    .map((tc) => {
      const recent = recentByCase.get(tc.id);
      const bugEx = bugByCase.get(tc.id);
      return {
        testCase: tc,
        bugKey: bugEx?.jiraBugKey ?? null,
        executedBy: recent?.executedBy ?? null,
        failedAt: recent?.createdAt ?? tc.lastExecutedAt ?? null
      };
    })
    .sort((a, b) => (b.failedAt ?? '').localeCompare(a.failedAt ?? ''));
}

// Resolves the project key for an execution: prefers the joined test case's project,
// falling back to the Jira issue key prefix (e.g. "SCRUM-12" → "SCRUM").
export function execProjectKey(ex: TestExecutionDto, projByCase: Map<string, string>): string {
  return projByCase.get(ex.testCaseId) ?? ex.jiraIssueKey?.split('-')[0] ?? '—';
}

// Filters the executions feed by result and/or project (empty set = no filter).
export function filterExecutions(
  executions: TestExecutionDto[],
  projByCase: Map<string, string>,
  result: Set<string>,
  project: Set<string>
): TestExecutionDto[] {
  return executions.filter((ex) => {
    if (result.size && !result.has(ex.result)) return false;
    if (project.size && !project.has(execProjectKey(ex, projByCase))) return false;
    return true;
  });
}

function csvEscape(value: string): string {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function toCsv(cases: TestCaseDto[]): string {
  const header = ['jiraIssueKey', 'summary', 'featureName', 'projectKey', 'tags', 'jiraStatus', 'automationStatus', 'lastResult', 'assignee'];
  const rows = cases.map((tc) =>
    [
      tc.jiraIssueKey ?? '',
      tc.summary,
      tc.featureName ?? '',
      tc.projectKey,
      tc.tags.join(' '),
      tc.jiraStatus ?? '',
      tc.automationStatus,
      resultOf(tc),
      tc.assigneeDisplayName ?? ''
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}
