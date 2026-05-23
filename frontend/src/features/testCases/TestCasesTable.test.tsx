import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TestCasesTable } from './TestCasesTable';
import type { TestCaseDto } from '../../types/contracts';

const sampleCase: TestCaseDto = {
  id: 'b1',
  jiraIssueKey: 'QA-1',
  projectKey: 'QA',
  summary: 'Login exitoso con credenciales válidas',
  featureName: 'Autenticación',
  gherkinText: 'Feature: Autenticación',
  tags: ['@smoke', '@login'],
  labels: ['qa'],
  automationStatus: 'ManualOnly',
  lastExecutionResult: 'Fail',
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-01T10:00:00Z'
};

describe('TestCasesTable', () => {
  it('renders a test case row with key, summary, tag and result', () => {
    render(<TestCasesTable items={[sampleCase]} isLoading={false} onSelect={() => {}} />);

    expect(screen.getByText('QA-1')).toBeInTheDocument();
    expect(screen.getByText('Login exitoso con credenciales válidas')).toBeInTheDocument();
    expect(screen.getByText('@smoke')).toBeInTheDocument();
    expect(screen.getByText('Fail')).toBeInTheDocument();
  });

  it('calls onSelect when the row action is clicked', async () => {
    const onSelect = vi.fn();
    render(<TestCasesTable items={[sampleCase]} isLoading={false} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Detalle' }));
    expect(onSelect).toHaveBeenCalledWith(sampleCase);
  });

  it('shows an empty state when there are no cases', () => {
    render(<TestCasesTable items={[]} isLoading={false} onSelect={() => {}} />);
    expect(screen.getByText(/No hay casos/)).toBeInTheDocument();
  });
});
