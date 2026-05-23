import { describe, expect, it } from 'vitest';
import { computeKpis, deriveProjects, emptyFilters, execProjectKey, filterCases, filterExecutions, openBugs, perProject, tagCounts } from './selectors';
import type { TestCaseDto, TestExecutionDto } from '../types/contracts';

function tc(partial: Partial<TestCaseDto>): TestCaseDto {
  return {
    id: Math.random().toString(36).slice(2),
    projectKey: 'SCRUM',
    summary: 'caso',
    gherkinText: '',
    tags: [],
    labels: [],
    automationStatus: 'ManualOnly',
    lastExecutionResult: null,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
    ...partial
  } as TestCaseDto;
}

const cases: TestCaseDto[] = [
  tc({ projectKey: 'AUTH', tags: ['@smoke', '@login'], lastExecutionResult: 'Pass', automationStatus: 'Automated', jiraStatus: 'Done', summary: 'Login ok' }),
  tc({ projectKey: 'AUTH', tags: ['@regression'], lastExecutionResult: 'Fail', jiraStatus: 'To Do', summary: 'Login fail' }),
  tc({ projectKey: 'API', tags: ['@api'], lastExecutionResult: null, automationStatus: 'InAutomation' })
];

describe('selectors', () => {
  it('computes KPIs treating null result as not run', () => {
    const k = computeKpis(cases);
    expect(k.total).toBe(3);
    expect(k.passed).toBe(1);
    expect(k.failed).toBe(1);
    expect(k.notrun).toBe(1);
    expect(k.run).toBe(2);
    expect(k.passRate).toBe(50);
    expect(k.automated).toBe(2); // Automated + InAutomation
  });

  it('derives projects with counts sorted desc', () => {
    const projects = deriveProjects(cases);
    expect(projects[0]).toEqual({ key: 'AUTH', name: 'AUTH', count: 2 });
    expect(projects.find((p) => p.key === 'API')?.count).toBe(1);
  });

  it('per-project breakdown', () => {
    const auth = perProject(cases).find((p) => p.key === 'AUTH');
    expect(auth).toMatchObject({ total: 2, pass: 1, fail: 1, passRate: 50 });
  });

  it('counts tags sorted', () => {
    const tags = tagCounts(cases).map(([t]) => t);
    expect(tags).toContain('@smoke');
    expect(tags).toContain('@api');
  });

  it('filters by project and tag and search', () => {
    const f = emptyFilters('AUTH');
    expect(filterCases(cases, f, '')).toHaveLength(2);
    f.tag.add('@regression');
    expect(filterCases(cases, f, '')).toHaveLength(1);
    expect(filterCases(cases, emptyFilters(), 'login')).toHaveLength(2);
  });
});

describe('openBugs', () => {
  function ex(partial: Partial<TestExecutionDto>): TestExecutionDto {
    return {
      id: Math.random().toString(36).slice(2),
      testCaseId: 'x',
      result: 'Fail',
      createdAt: '2026-05-01T00:00:00Z',
      ...partial
    } as TestExecutionDto;
  }

  it('returns only failing cases, enriched with bug key, executor and date', () => {
    const failWithBug = tc({ id: 'a', summary: 'paga falla', lastExecutionResult: 'Fail' });
    const failNoBug = tc({ id: 'b', summary: 'login falla', lastExecutionResult: 'Fail', lastExecutedAt: '2026-05-02T00:00:00Z' });
    const passing = tc({ id: 'c', lastExecutionResult: 'Pass' });
    const executions: TestExecutionDto[] = [
      // ordered DESC by createdAt, as the API returns
      ex({ testCaseId: 'a', result: 'Fail', jiraBugKey: 'SCRUM-99', executedBy: 'Marcos', createdAt: '2026-05-05T10:00:00Z' }),
      ex({ testCaseId: 'a', result: 'Fail', jiraBugKey: 'SCRUM-50', executedBy: 'Vieja', createdAt: '2026-05-01T10:00:00Z' })
    ];

    const rows = openBugs([failWithBug, failNoBug, passing], executions);

    expect(rows).toHaveLength(2); // passing case excluded
    const a = rows.find((r) => r.testCase.id === 'a')!;
    expect(a.bugKey).toBe('SCRUM-99'); // most recent bug, not the older one
    expect(a.executedBy).toBe('Marcos');
    expect(a.failedAt).toBe('2026-05-05T10:00:00Z');

    const b = rows.find((r) => r.testCase.id === 'b')!;
    expect(b.bugKey).toBeNull(); // failing but no bug reported yet
    expect(b.failedAt).toBe('2026-05-02T00:00:00Z'); // falls back to lastExecutedAt
  });

  it('sorts rows by failedAt descending', () => {
    const older = tc({ id: 'old', lastExecutionResult: 'Fail', lastExecutedAt: '2026-05-01T00:00:00Z' });
    const newer = tc({ id: 'new', lastExecutionResult: 'Fail', lastExecutedAt: '2026-05-09T00:00:00Z' });
    const rows = openBugs([older, newer], []);
    expect(rows.map((r) => r.testCase.id)).toEqual(['new', 'old']);
  });
});

describe('execProjectKey / filterExecutions', () => {
  function ex(partial: Partial<TestExecutionDto>): TestExecutionDto {
    return { id: Math.random().toString(36).slice(2), testCaseId: 'x', result: 'Pass', createdAt: '2026-05-01T00:00:00Z', ...partial } as TestExecutionDto;
  }

  const projByCase = new Map<string, string>([['c1', 'AUTH']]);

  it('resolves project from the joined case, else from the issue key prefix', () => {
    expect(execProjectKey(ex({ testCaseId: 'c1', jiraIssueKey: 'AUTH-1' }), projByCase)).toBe('AUTH');
    expect(execProjectKey(ex({ testCaseId: 'unknown', jiraIssueKey: 'API-9' }), projByCase)).toBe('API');
    expect(execProjectKey(ex({ testCaseId: 'unknown', jiraIssueKey: null }), projByCase)).toBe('—');
  });

  it('filters by result and project, empty set means no filter', () => {
    const feed = [
      ex({ testCaseId: 'c1', jiraIssueKey: 'AUTH-1', result: 'Pass' }),
      ex({ testCaseId: 'c1', jiraIssueKey: 'AUTH-2', result: 'Fail' }),
      ex({ testCaseId: 'unknown', jiraIssueKey: 'API-1', result: 'Fail' })
    ];
    expect(filterExecutions(feed, projByCase, new Set(), new Set())).toHaveLength(3);
    expect(filterExecutions(feed, projByCase, new Set(['Fail']), new Set())).toHaveLength(2);
    expect(filterExecutions(feed, projByCase, new Set(), new Set(['AUTH']))).toHaveLength(2);
    expect(filterExecutions(feed, projByCase, new Set(['Fail']), new Set(['API']))).toHaveLength(1);
  });
});
