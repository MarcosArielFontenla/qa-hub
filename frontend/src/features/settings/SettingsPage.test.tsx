import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHealth, getJiraSettings } from '../../api/testCasesApi';
import { SettingsPage } from './SettingsPage';

vi.mock('../../api/testCasesApi', () => ({
  getHealth: vi.fn(),
  getJiraSettings: vi.fn()
}));

function renderSettingsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SettingsPage />
    </QueryClientProvider>
  );
}

describe('SettingsPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('presents QA-oriented integration settings without backend variable examples', async () => {
    vi.mocked(getHealth).mockResolvedValue({
      status: 'ok',
      database: 'ok',
      jiraMode: 'real'
    });
    vi.mocked(getJiraSettings).mockResolvedValue({
      baseUrl: 'https://surtec.atlassian.net',
      projectKey: 'SCRUM',
      testCaseIssueType: 'Tarea',
      bugIssueType: 'Error',
      gherkinField: 'description',
      parentField: 'parent',
      labelsField: 'labels',
      mockMode: false
    });

    renderSettingsPage();

    expect(await screen.findByRole('heading', { name: 'Configuración' })).toBeInTheDocument();
    expect(screen.getByText('Integraciones operativas')).toBeInTheDocument();
    expect(screen.getByText('JQL recomendado')).toBeInTheDocument();
    expect(screen.getByText('project = SCRUM AND labels in (qa, gherkin) ORDER BY updated DESC')).toBeInTheDocument();
    expect(screen.getByText('Crear bug al fallar')).toBeInTheDocument();
    expect(screen.queryByText('Variables backend')).not.toBeInTheDocument();
  });
});
