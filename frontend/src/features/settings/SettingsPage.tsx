import { useQuery } from '@tanstack/react-query';
import { getHealth } from '../../api/testCasesApi';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000';

function dotClass(ok: boolean, warn = false) {
  if (warn) return 'health-dot warn';
  return ok ? 'health-dot' : 'health-dot fail';
}

export function SettingsPage() {
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });

  const health = healthQuery.data;
  const loading = healthQuery.isLoading;

  const backendOk = !healthQuery.isError && health?.status === 'ok';
  const dbOk = !healthQuery.isError && health?.database === 'ok';
  const isReal = health?.jiraMode === 'real';
  const okCount = [backendOk, dbOk, isReal].filter(Boolean).length;

  return (
    <div className="content">
      <div className="topbar">
        <div className="crumb">
          <span className="home">⚙️</span>
          <span>QA</span>
          <span style={{ color: 'var(--text-4)' }}>›</span>
          <b>Settings</b>
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={() => healthQuery.refetch()} disabled={healthQuery.isFetching}>
          <span>🔄</span>{healthQuery.isFetching ? 'Verificando…' : 'Verificar conexión'}
        </button>
      </div>

      <div className="scroll">
        <div className="hero" style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, #FDF2DA 100%)', border: 0 }}>
          <div className="hero-l">
            <span className="hero-emoji" style={{ background: 'linear-gradient(135deg, #FFD89B, #B6A8FF)' }}>⚙️</span>
            <div>
              <h1>Settings</h1>
              <div className="sub">Estado del sistema. La configuración se hace en <b className="mono" style={{ background: 'rgba(255,255,255,0.6)', padding: '1px 6px', borderRadius: 4 }}>backend/src/API/.env</b> — ver el README.</div>
            </div>
          </div>
        </div>

        <div className="settings-inner">
          <div className="set-section">
            <div className="set-section-head">
              <span className="icn">💚</span>
              <div style={{ flex: 1 }}>
                <div className="set-section-title">Estado</div>
                <div className="set-section-sub">En vivo desde GET /api/health</div>
              </div>
              {!loading && <span className={`pill ${okCount === 3 ? 'pass' : 'blk'}`}><span className="dot" />{okCount} de 3 OK</span>}
            </div>

            {loading ? (
              <div className="set-row"><span className="set-value muted">Verificando estado…</span></div>
            ) : healthQuery.isError ? (
              <div className="set-row">
                <span className="set-label">🖥 Backend API</span>
                <span><span className={dotClass(false)} /><span className="set-value">sin respuesta · {API_BASE}</span></span>
                <span className="pill fail"><span className="dot" />down</span>
              </div>
            ) : (
              <>
                <div className="set-row">
                  <span className="set-label">🖥 Backend API</span>
                  <span><span className={dotClass(backendOk)} /><span className="set-value">{backendOk ? `conectado · ${API_BASE}` : 'sin respuesta'}</span></span>
                  <span className={`pill ${backendOk ? 'pass' : 'fail'}`}><span className="dot" />{backendOk ? 'operational' : 'down'}</span>
                </div>
                <div className="set-row">
                  <span className="set-label">🗄 PostgreSQL</span>
                  <span><span className={dotClass(dbOk)} /><span className="set-value">{dbOk ? 'conectado' : 'no disponible'}</span></span>
                  <span className={`pill ${dbOk ? 'pass' : 'fail'}`}><span className="dot" />{dbOk ? 'operational' : 'down'}</span>
                </div>
                <div className="set-row">
                  <span className="set-label">☁️ Jira</span>
                  <span><span className={dotClass(isReal, !isReal)} /><span className={`set-value ${isReal ? '' : 'muted'}`}>{isReal ? 'Jira real conectado' : 'modo mock · casos demo'}</span></span>
                  <span className={`pill ${isReal ? 'pass' : 'blk'}`}><span className="dot" />{isReal ? 'real' : 'mock'}</span>
                </div>
              </>
            )}
          </div>

          <div className="set-section">
            <div className="set-section-head">
              <span className="icn">☁️</span>
              <div style={{ flex: 1 }}>
                <div className="set-section-title">¿Cómo conecto mi Jira?</div>
                <div className="set-section-sub">La conexión es read-only desde acá; se configura por variables de entorno</div>
              </div>
            </div>
            <div style={{ padding: '4px 18px 18px', color: 'var(--text-2)', fontSize: 13, lineHeight: 1.7 }}>
              <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Generá un API token de Atlassian en <span className="mono" style={{ fontSize: 12 }}>id.atlassian.com</span> → API tokens.</li>
                <li>Copiá <span className="mono" style={{ fontSize: 12 }}>backend/src/API/.env.example</span> a <span className="mono" style={{ fontSize: 12 }}>.env</span> y completá <span className="mono" style={{ fontSize: 12 }}>JIRA_BASE_URL</span>, <span className="mono" style={{ fontSize: 12 }}>JIRA_EMAIL</span>, <span className="mono" style={{ fontSize: 12 }}>JIRA_API_TOKEN</span>, <span className="mono" style={{ fontSize: 12 }}>JIRA_PROJECT_KEY</span>.</li>
                <li>Reiniciá el backend. El estado de Jira de arriba debería pasar a <b>real</b>.</li>
              </ol>
              <div style={{ marginTop: 12, color: 'var(--text-3)', fontSize: 12.5 }}>
                Detalle completo en el <b>README</b> → sección <b>Conectá tu Jira</b>.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '14px 18px', background: 'var(--accent-soft)', border: '1px solid rgba(124,92,255,0.15)', borderRadius: 12, color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>🔒</span>
            <div>
              <b>Seguridad.</b> El token Jira <b>nunca</b> llega al frontend ni a los logs (redactado en el logging estructurado). Las credenciales viven solo en <span className="mono">backend/src/API/.env</span> (gitignoreado).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
