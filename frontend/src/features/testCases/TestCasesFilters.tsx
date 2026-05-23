import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { Field, SelectInput, TextInput } from '../../components/ui/Field';
import { automationStatusLabel } from '../../lib/format';
import type { AutomationStatus, ExecutionResult, TestCaseQuery } from '../../types/contracts';

const automationStatuses: AutomationStatus[] = ['ManualOnly', 'ReadyToAutomate', 'InAutomation', 'Automated', 'Flaky', 'Deprecated'];
const executionResults: ExecutionResult[] = ['NotRun', 'Pass', 'Fail', 'Blocked'];

interface TestCasesFiltersProps {
  filters: TestCaseQuery;
  onChange: (key: keyof TestCaseQuery, value: string) => void;
}

export function TestCasesFilters({ filters, onChange }: TestCasesFiltersProps) {
  const [open, setOpen] = useState(true);
  const [showMore, setShowMore] = useState(false);

  return (
    <aside className="surface-card h-fit p-4 lg:sticky lg:top-[168px]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-accent" aria-hidden /> Filtros
        </span>
        <ChevronDown className={clsx('h-4 w-4 text-muted transition', open ? '' : '-rotate-90')} aria-hidden />
      </button>

      {open ? (
        <div className="mt-4 grid gap-3">
          <Field label="Proyecto">
            <TextInput placeholder="QA" value={filters.projectKey ?? ''} onChange={(event) => onChange('projectKey', event.target.value)} />
          </Field>
          <Field label="Status Jira">
            <TextInput placeholder="To Do" value={filters.status ?? ''} onChange={(event) => onChange('status', event.target.value)} />
          </Field>
          <Field label="Tag Gherkin">
            <TextInput placeholder="@smoke" value={filters.tag ?? ''} onChange={(event) => onChange('tag', event.target.value)} />
          </Field>
          <Field label="Automatización">
            <SelectInput value={filters.automationStatus ?? ''} onChange={(event) => onChange('automationStatus', event.target.value)}>
              <option value="">Todas</option>
              {automationStatuses.map((status) => (
                <option key={status} value={status}>{automationStatusLabel(status)}</option>
              ))}
            </SelectInput>
          </Field>

          <button
            type="button"
            className="justify-self-start text-sm font-medium text-accent hover:underline"
            onClick={() => setShowMore((value) => !value)}
          >
            {showMore ? '▾ Menos filtros' : '▸ Más filtros'}
          </button>

          {showMore ? (
            <div className="grid gap-3 border-t border-line pt-3">
              <Field label="Resultado">
                <SelectInput value={filters.executionResult ?? ''} onChange={(event) => onChange('executionResult', event.target.value)}>
                  <option value="">Todos</option>
                  {executionResults.map((result) => <option key={result} value={result}>{result}</option>)}
                </SelectInput>
              </Field>
              <Field label="Assignee">
                <TextInput value={filters.assignee ?? ''} onChange={(event) => onChange('assignee', event.target.value)} />
              </Field>
              <Field label="Priority">
                <TextInput value={filters.priority ?? ''} onChange={(event) => onChange('priority', event.target.value)} />
              </Field>
              <Field label="Label">
                <TextInput value={filters.label ?? ''} onChange={(event) => onChange('label', event.target.value)} />
              </Field>
              <Field label="Parent / story">
                <TextInput value={filters.parentIssueKey ?? ''} onChange={(event) => onChange('parentIssueKey', event.target.value)} />
              </Field>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
