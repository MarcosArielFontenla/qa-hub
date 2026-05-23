import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTestCase } from '../../api/testCasesApi';
import { apiError } from '../../api/httpClient';
import { GherkinPre } from '../../components/design/primitives';

const TEMPLATE = `Feature: <nombre del feature>
  Scenario: <nombre del escenario>
    Given <precondición>
    When <acción>
    Then <resultado esperado>`;

const PRIORITIES = ['', 'Highest', 'High', 'Medium', 'Low'];

export function NewTestCaseModal({
  open,
  onClose,
  onCreated,
  projects
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
  projects: string[];
}) {
  const queryClient = useQueryClient();
  const [projectKey, setProjectKey] = useState(projects[0] ?? '');
  const [summary, setSummary] = useState('');
  const [priority, setPriority] = useState('');
  const [gherkin, setGherkin] = useState(TEMPLATE);

  useEffect(() => {
    if (open) {
      setProjectKey(projects[0] ?? '');
      setSummary('');
      setPriority('');
      setGherkin(TEMPLATE);
    }
  }, [open, projects]);

  const mutation = useMutation({
    mutationFn: () => createTestCase({ projectKey: projectKey.trim(), summary: summary.trim(), gherkinText: gherkin, priority: priority || undefined }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['all-test-cases'] });
      onCreated(created.id);
    }
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSave = Boolean(projectKey.trim() && summary.trim() && gherkin.trim()) && !mutation.isPending;
  const err = mutation.isError ? apiError(mutation.error) : null;

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="icn">➕</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Nuevo test case</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Se crea como caso <b>local</b> en QA Hub (no se escribe en Jira). Se valida el Gherkin con Cucumber.
            </div>
          </div>
          <button className="btn ghost sm icon-only" onClick={onClose} title="Cerrar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div className="field-label">Proyecto</div>
              <input className="input" list="np-projects" placeholder="p. ej. SCRUM" value={projectKey} onChange={(e) => setProjectKey(e.target.value)} />
              <datalist id="np-projects">
                {projects.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div>
              <div className="field-label">Prioridad (opcional)</div>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p || '—'}</option>)}
              </select>
            </div>
          </div>

          <div className="field-label" style={{ marginTop: 14 }}>Summary</div>
          <input className="input" placeholder="Título del caso" value={summary} onChange={(e) => setSummary(e.target.value)} />

          <div className="field-label" style={{ marginTop: 14 }}>Gherkin</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <textarea className="jql-input" style={{ minHeight: 220, fontFamily: 'JetBrains Mono, monospace' }} value={gherkin} onChange={(e) => setGherkin(e.target.value)} />
            <div style={{ minHeight: 220, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
              <GherkinPre text={gherkin} />
            </div>
          </div>

          {err && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--fail-bg)', border: '1px solid #F5C7C2', borderRadius: 12, fontSize: 12.5, color: 'var(--fail-fg)' }}>
              <b>No se pudo crear.</b> {err.message || 'Revisá los campos y el Gherkin.'}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>El caso aparecerá con el badge <b>LOCAL</b>.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            <button className="btn primary" disabled={!canSave} onClick={() => mutation.mutate()}>
              ➕ {mutation.isPending ? 'Creando…' : 'Crear caso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
