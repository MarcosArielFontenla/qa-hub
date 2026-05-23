import { httpClient } from './httpClient';
import type {
  AutomationStatus,
  DashboardSummaryDto,
  HealthResponse,
  JiraSettingsDto,
  SyncJiraResponse,
  TestCaseDto,
  TestCaseListResponse,
  TestCaseQuery,
  TestExecutionDto
} from '../types/contracts';

export async function getDashboardSummary() {
  const response = await httpClient.get<DashboardSummaryDto>('/api/dashboard/summary');
  return response.data;
}

export async function getHealth() {
  const response = await httpClient.get<HealthResponse>('/api/health');
  return response.data;
}

export async function getJiraSettings() {
  const response = await httpClient.get<JiraSettingsDto>('/api/jira/settings');
  return response.data;
}

export async function getTestCases(query: TestCaseQuery) {
  const response = await httpClient.get<TestCaseListResponse>('/api/test-cases', { params: query });
  return response.data;
}

export async function getAllTestCases() {
  const response = await httpClient.get<TestCaseListResponse>('/api/test-cases', { params: { page: 1, pageSize: 200 } });
  return response.data.items;
}

export interface CreateTestCasePayload {
  projectKey: string;
  summary: string;
  gherkinText: string;
  priority?: string;
}

export async function createTestCase(payload: CreateTestCasePayload) {
  const response = await httpClient.post<TestCaseDto>('/api/test-cases', payload);
  return response.data;
}

export async function getRecentExecutions(take = 20) {
  const response = await httpClient.get<TestExecutionDto[]>('/api/executions', { params: { take } });
  return response.data;
}

export async function syncJira(jql: string) {
  const response = await httpClient.post<SyncJiraResponse>('/api/jira/sync', { jql, maxResults: 200 });
  return response.data;
}

export async function updateAutomationStatus(id: string, automationStatus: AutomationStatus) {
  const response = await httpClient.patch<TestCaseDto>(`/api/test-cases/${id}/automation-status`, {
    automationStatus
  });
  return response.data;
}

export async function getExecutions(testCaseId: string) {
  const response = await httpClient.get<TestExecutionDto[]>(`/api/test-cases/${testCaseId}/executions`);
  return response.data;
}

export interface CreateExecutionPayload {
  result: string;
  executedBy?: string;
  comment?: string;
  evidenceUrl?: string;
  evidenceText?: string;
  createBug: boolean;
  bugSummary?: string;
  bugDescription?: string;
}

export async function createExecution(testCaseId: string, payload: CreateExecutionPayload) {
  const response = await httpClient.post<TestExecutionDto>(`/api/test-cases/${testCaseId}/executions`, payload);
  return response.data;
}

export function exportCsvUrl(query: TestCaseQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return `${httpClient.defaults.baseURL}/api/exports/test-cases.csv?${params.toString()}`;
}
