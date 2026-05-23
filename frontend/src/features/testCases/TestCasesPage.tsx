import { ChevronLeft, ChevronRight, Download, RefreshCw, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { exportCsvUrl, getDashboardSummary, getTestCases, syncJira } from '../../api/testCasesApi';
import { Button } from '../../components/ui/Button';
import { Field, TextInput } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { buildDefaultSyncJql } from '../../lib/jiraWorkflow';
import type { SyncJiraResponse, TestCaseDto, TestCaseQuery } from '../../types/contracts';
import { KpiCards } from './KpiCards';
import { TestCaseDetailDrawer } from './TestCaseDetailDrawer';
import { TestCasesFilters } from './TestCasesFilters';
import { TestCasesTable } from './TestCasesTable';

export function TestCasesPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<TestCaseDto | null>(null);
  const [filters, setFilters] = useState<TestCaseQuery>({ page: 1, pageSize: 50 });
  const [syncOpen, setSyncOpen] = useState(false);
  const [jql, setJql] = useState(() => buildDefaultSyncJql());
  const [syncResult, setSyncResult] = useState<SyncJiraResponse | null>(null);

  const summaryQuery = useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary });
  const testCasesQuery = useQuery({ queryKey: ['test-cases', filters], queryFn: () => getTestCases(filters) });

  const syncMutation = useMutation({
    mutationFn: syncJira,
    onSuccess: (data) => {
      setSyncResult(data);
      setSyncOpen(false);
      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });

  const updateFilter = (key: keyof TestCaseQuery, value: string) => {
    setFilters((current) => ({ ...current, [key]: value || undefined, page: 1 }) as TestCaseQuery);
  };

  const total = testCasesQuery.data?.total ?? 0;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const goToPage = (next: number) => setFilters((current) => ({ ...current, page: Math.min(Math.max(next, 1), pageCount) }));

  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="page-heading">Casos de prueba</h2>
          <p className="page-subtitle">Vista única de los test cases Gherkin sincronizados desde Jira.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSyncOpen(true)}>
            <RefreshCw className="h-4 w-4" /> Sincronizar desde Jira
          </Button>
          <Button variant="secondary" onClick={() => window.open(exportCsvUrl(filters), '_blank')}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <KpiCards summary={summaryQuery.data} />

      {syncResult ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Sync completado: {syncResult.totalFetched} traídos · {syncResult.created} creados · {syncResult.updated} actualizados
          {syncResult.errors > 0 ? ` · ${syncResult.errors} con error` : ''}.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <TestCasesFilters filters={filters} onChange={updateFilter} />

        <div className="grid gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
              <TextInput
                className="w-full pl-9"
                placeholder="Buscar por summary, Jira key o Gherkin"
                value={filters.search ?? ''}
                onChange={(event) => updateFilter('search', event.target.value)}
              />
            </div>
            <p className="text-sm font-medium text-muted">{total} casos encontrados</p>
          </div>

          <TestCasesTable
            items={testCasesQuery.data?.items ?? []}
            isLoading={testCasesQuery.isLoading}
            selectedId={selected?.id}
            onSelect={setSelected}
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Página {page} de {pageCount}</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>
              <Button variant="secondary" disabled={page >= pageCount} onClick={() => goToPage(page + 1)}>
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {selected ? <TestCaseDetailDrawer testCase={selected} onClose={() => setSelected(null)} /> : null}

      {syncOpen ? (
        <Modal
          title="Sincronizar desde Jira"
          description="Ejecutá un JQL para traer y actualizar los test cases en la base local."
          onClose={() => setSyncOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSyncOpen(false)}>Cancelar</Button>
              <Button isLoading={syncMutation.isPending} disabled={!jql.trim()} onClick={() => syncMutation.mutate(jql)}>
                Sincronizar
              </Button>
            </>
          }
        >
          <Field label="JQL">
            <TextInput value={jql} onChange={(event) => setJql(event.target.value)} placeholder="project = QA ORDER BY updated DESC" />
          </Field>
          {syncMutation.isError ? (
            <p className="text-sm text-danger">No se pudo sincronizar. Verificá el JQL y la conexión con Jira.</p>
          ) : null}
        </Modal>
      ) : null}
    </section>
  );
}
