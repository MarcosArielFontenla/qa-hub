import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { AutomationStatus, ExecutionResult } from '../../types/contracts';
import { automationStatusLabel, executionResultLabel } from '../../lib/format';

const resultClass: Record<ExecutionResult, string> = {
  NotRun: 'bg-lavender text-muted border-line',
  Pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Fail: 'bg-red-50 text-red-700 border-red-200',
  Blocked: 'bg-amber-50 text-amber-700 border-amber-200'
};

const automationClass: Record<AutomationStatus, string> = {
  ManualOnly: 'bg-lavender text-muted border-line',
  ReadyToAutomate: 'bg-blue-50 text-blue-700 border-blue-200',
  InAutomation: 'bg-skywash text-sky-700 border-sky-200',
  Automated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Flaky: 'bg-amber-50 text-amber-700 border-amber-200',
  Deprecated: 'bg-zinc-100 text-zinc-700 border-zinc-200'
};

export function ResultBadge({ value }: { value?: ExecutionResult | null }) {
  const result = value ?? 'NotRun';
  return <span className={clsx('rounded border px-2 py-1 text-xs font-medium shadow-sm', resultClass[result])}>{executionResultLabel(result)}</span>;
}

export function AutomationBadge({ value }: { value: AutomationStatus }) {
  return <span className={clsx('rounded border px-2 py-1 text-xs font-medium shadow-sm', automationClass[value])}>{automationStatusLabel(value)}</span>;
}

export function TextBadge({ children }: { children: ReactNode }) {
  return <span className="rounded border border-line bg-white/85 px-2 py-1 text-xs font-medium text-muted shadow-sm">{children}</span>;
}
