import type { AutomationStatus, ExecutionResult } from '../types/contracts';

export function formatDate(value?: string | null) {
  if (!value) {
    return 'Sin ejecutar';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function automationStatusLabel(value: AutomationStatus) {
  const labels: Record<AutomationStatus, string> = {
    ManualOnly: 'Manual',
    ReadyToAutomate: 'Listo para automatizar',
    InAutomation: 'En automatización',
    Automated: 'Automatizado',
    Flaky: 'Flaky',
    Deprecated: 'Deprecado'
  };
  return labels[value];
}

export function executionResultLabel(value?: ExecutionResult | null) {
  if (!value || value === 'NotRun') {
    return 'No ejecutado';
  }

  const labels: Record<ExecutionResult, string> = {
    NotRun: 'No ejecutado',
    Pass: 'Pass',
    Fail: 'Fail',
    Blocked: 'Blocked'
  };
  return labels[value];
}
