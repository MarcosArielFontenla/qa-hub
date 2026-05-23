import { clsx } from 'clsx';
import { AutomationBadge, ResultBadge, TextBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/format';
import type { TestCaseDto } from '../../types/contracts';

interface TestCasesTableProps {
  items: TestCaseDto[];
  isLoading: boolean;
  selectedId?: string | null;
  onSelect: (testCase: TestCaseDto) => void;
}

export function TestCasesTable({ items, isLoading, selectedId, onSelect }: TestCasesTableProps) {
  return (
    <div className="data-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3 font-semibold">Jira Key</th>
              <th className="px-4 py-3 font-semibold">Summary</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Automation</th>
              <th className="px-4 py-3 font-semibold">Last Result</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr
                key={item.id}
                className={clsx('cursor-pointer transition hover:bg-panel/70', selectedId === item.id && 'bg-lavender/60')}
                onClick={() => onSelect(item)}
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-accent">{item.jiraIssueKey ?? 'Local'}</td>
                <td className="max-w-md px-4 py-3">
                  <p className="truncate font-medium text-ink" title={item.summary}>{item.summary}</p>
                  {item.featureName ? <p className="truncate text-xs text-muted" title={item.featureName}>{item.featureName}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-[12rem] flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => <TextBadge key={tag}>{tag}</TextBadge>)}
                    {item.tags.length > 3 ? <span className="text-xs text-muted">+{item.tags.length - 3}</span> : null}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{item.jiraStatus ?? '-'}</td>
                <td className="px-4 py-3"><AutomationBadge value={item.automationStatus} /></td>
                <td className="px-4 py-3">
                  <ResultBadge value={item.lastExecutionResult} />
                  <p className="mt-1 text-xs text-muted">{formatDate(item.lastExecutedAt)}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                    }}
                  >
                    Detalle
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No hay casos para los filtros actuales. Sincronizá desde Jira para traer casos.
                </td>
              </tr>
            ) : null}
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">Cargando casos…</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
