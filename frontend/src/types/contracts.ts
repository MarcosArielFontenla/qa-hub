export type AutomationStatus =
  | 'ManualOnly'
  | 'ReadyToAutomate'
  | 'InAutomation'
  | 'Automated'
  | 'Flaky'
  | 'Deprecated';

export type ExecutionResult = 'NotRun' | 'Pass' | 'Fail' | 'Blocked';

export interface TestCaseDto {
  id: string;
  jiraIssueId?: string | null;
  jiraIssueKey?: string | null;
  projectKey: string;
  parentIssueKey?: string | null;
  parentSummary?: string | null;
  issueType?: string | null;
  summary: string;
  featureName?: string | null;
  scenarioName?: string | null;
  gherkinText: string;
  tags: string[];
  labels: string[];
  priority?: string | null;
  jiraStatus?: string | null;
  assigneeDisplayName?: string | null;
  automationStatus: AutomationStatus;
  lastExecutionResult?: ExecutionResult | null;
  lastExecutedAt?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseListResponse {
  items: TestCaseDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TestCaseQuery {
  projectKey?: string;
  parentIssueKey?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  label?: string;
  tag?: string;
  automationStatus?: AutomationStatus;
  executionResult?: ExecutionResult;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface SyncJiraResponse {
  totalFetched: number;
  created: number;
  updated: number;
  errors: number;
  items: TestCaseDto[];
}

export interface DashboardSummaryDto {
  totalTestCases: number;
  notRun: number;
  passed: number;
  failed: number;
  blocked: number;
  automated: number;
  manualOnly: number;
  readyToAutomate: number;
  passRate: number;
  automationCoverage: number;
}

export interface JiraSettingsDto {
  baseUrl?: string | null;
  projectKey?: string | null;
  testCaseIssueType: string;
  bugIssueType: string;
  gherkinField: string;
  parentField: string;
  labelsField: string;
  mockMode: boolean;
}

export interface HealthResponse {
  status: string;
  database: string;
  jiraMode: 'mock' | 'real';
}

export interface TestExecutionDto {
  id: string;
  testCaseId: string;
  testCaseSummary?: string | null;
  jiraIssueKey?: string | null;
  result: ExecutionResult;
  executedBy?: string | null;
  comment?: string | null;
  evidenceUrl?: string | null;
  evidenceText?: string | null;
  jiraBugKey?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  warning?: string | null;
}
