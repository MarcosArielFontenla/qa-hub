import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getHealth, syncJira } from '../../api/testCasesApi';
import { buildDefaultSyncJql } from '../../lib/jiraWorkflow';

const PRESETS = [
  'project = SCRUM ORDER BY updated DESC',
  'project = SCRUM AND labels in (qa, gherkin)',
  'status != Done ORDER BY updated DESC',
  'updated >= -7d'
];

export function SyncModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [jql, setJql] = useState(() => buildDefaultSyncJql());
  const [maxResults, setMaxResults] = useState(200);
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });
  const isMock = healthQuery.data?.jiraMode !== 'real';

  const syncMutation = useMutation({
    mutationFn: () => syncJira(jql),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-test-cases'] });
      queryClient.invalidateQueries({ queryKey: ['recent-executions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onClose();
    }
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) syncMutation.mutate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, syncMutation]);

  return (
    <div className={`modal-backdrop ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="icn">🔄</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Sincronizar desde Jira</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Ejecuta el JQL, parsea Gherkin con Cucumber y hace upsert por <span className="mono" style={{ color: 'var(--text-2)' }}>jira_issue_key</span>.
            </div>
          </div>
          <button className="btn ghost sm icon-only" onClick={onClose} title="Cerrar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="field-label">JQL Query</div>
          <textarea className="jql-input" rows={3} value={jql} onChange={(e) => setJql(e.target.value)} />
          <div className="jql-presets">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setJql(p)}>{p}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            <div>
              <div className="field-label">Max results</div>
              <input className="input" type="number" value={maxResults} onChange={(e) => setMaxResults(parseInt(e.target.value || '0', 10))} />
            </div>
            <div>
              <div className="field-label">Modo Jira</div>
              <div
                style={{
                  background: isMock ? 'var(--blk-bg)' : 'var(--pass-bg)',
                  border: `1px solid ${isMock ? '#F1DDA8' : '#BFE2CB'}`,
                  color: isMock ? 'var(--blk-fg)' : 'var(--pass-fg)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 999, background: isMock ? 'var(--blk-dot)' : 'var(--pass-dot)' }} />
                {isMock ? 'Mock mode' : 'Jira real'}
              </div>
            </div>
          </div>

          {syncMutation.isError ? (
            <div
              style={{
                marginTop: 16,
                padding: '12px 14px',
                background: 'var(--fail-bg)',
                border: '1px solid #F5C7C2',
                borderRadius: 12,
                fontSize: 12.5,
                color: 'var(--fail-fg)'
              }}
            >
              No se pudo sincronizar. Verificá el JQL y la conexión con Jira.
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                padding: '12px 14px',
                background: 'var(--accent-soft)',
                border: '1px solid rgba(124,92,255,0.15)',
                borderRadius: 12,
                fontSize: 12.5,
                color: 'var(--text-2)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start'
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>✨</span>
              <div>
                {isMock ? (
                  <>Sin credenciales Jira: vas a importar los <b>25 casos del mock</b>. Configurá Jira en <b>Settings</b> para conectar tu instancia real.</>
                ) : (
                  <>Conectado a Jira real. El sync trae los issues que matcheen el JQL y hace upsert por <span className="mono">jira_issue_key</span>.</>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <span style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <span className="kbd-inline">⌘</span>
            <span className="kbd-inline">↵</span> sincronizar · <span className="kbd-inline">Esc</span> cerrar
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            <button className="btn primary" disabled={syncMutation.isPending || !jql.trim()} onClick={() => syncMutation.mutate()}>
              🔄 {syncMutation.isPending ? 'Sincronizando…' : 'Sincronizar ahora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
