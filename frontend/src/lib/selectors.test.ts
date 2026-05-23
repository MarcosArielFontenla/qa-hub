import { describe, expect, it } from 'vitest';
import { computeKpis, deriveProjects, emptyFilters, filterCases, perProject, tagCounts } from './selectors';
import type { TestCaseDto } from '../types/contracts';

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
