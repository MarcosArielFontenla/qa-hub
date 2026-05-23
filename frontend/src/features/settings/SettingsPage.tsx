import { useQuery } from '@tanstack/react-query';
import { getAllTestCases, getHealth, getJiraSettings } from '../../api/testCasesApi';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000';
const LATEST_MIGRATION = '20260523_RemoveImportsAndSyncLogs';

function dotClass(ok: boolean, warn = false) {
  if (warn) return 'health-dot warn';
  return ok ? 'health-dot' : 'health-dot fail';
}

export function SettingsPage() {
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });
  const jiraQuery = useQuery({ queryKey: ['jira-settings'], queryFn: getJiraSettings });
  const casesQuery = useQuery({ queryKey: ['all-test-cases'], queryFn: getAllTestCases });

  const health = healthQuery.data;
  const jira = jiraQuery.data;
  const caseCount = casesQuery.data?.length ?? 0;

  const backendOk = !healthQuery.isError && health?.status === 'ok';
  const dbOk = !healthQuery.isError && health?.database === 'ok';
  const isReal = health?.jiraMode === 'real';
  const okCount = [backendOk, dbOk, isReal].filter(Boolean).length;

  const has = (v?: string | null) => Boolean(v && v.trim());

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
        <button className="btn" onClick={() => { healthQuery.refetch(); jiraQuery.refetch(); }}><span>🔄</span>Verificar conexión</button>
      </div>

      <div className="scroll">
        <div className="hero" style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, #FDF2DA 100%)', border: 0 }}>
          <div className="hero-l">
            <span className="hero-emoji" style={{ background: 'linear-gradient(135deg, #FFD89B, #B6A8FF)' }}>⚙️</span>
            <div>
              <h1>Settings</h1>
              <div className="sub">
                Vista read-only · configuración cargada desde variables de entorno · para modificar, editá{' '}
                <b className="mono" style={{ background: 'rgba(255,255,255,0.6)', padding: '1px 6px', borderRadius: 4 }}>backend/.env</b> y reiniciá
              </div>
            </div>
          </div>
        </div>

        <div className="settings-inner">
          <div className="set-section">
            <div className="set-section-head">
              <span className="icn">💚</span>
              <div style={{ flex: 1 }}>
                <div className="set-section-title">Health</div>
                <div className="set-section-sub">Estado en vivo desde GET /api/health</div>
              </div>
              <span className={`pill ${okCount === 3 ? 'pass' : 'blk'}`}><span className="dot" />{okCount} de 3 OK</span>
            </div>
            <div className="set-row">
              <span className="set-label">🖥 Backend API</span>
              <span><span className={dotClass(backendOk)} /><span className="set-value">{backendOk ? `200 OK · ${API_BASE}` : 'sin respuesta'}</span></span>
              <span className={`pill ${backendOk ? 'pass' : 'fail'}`}><span className="dot" />{backendOk ? 'operational' : 'down'}</span>
            </div>
            <div className="set-row">
              <span className="set-label">🗄 PostgreSQL</span>
              <span><span className={dotClass(dbOk)} /><span className="set-value">{dbOk ? 'conectado' : 'no disponible'}</span></span>
              <span className={`pill ${dbOk ? 'pass' : 'fail'}`}><span className="dot" />{dbOk ? 'operational' : 'down'}</span>
            </div>
            <div className="set-row">
              <span className="set-label">☁️ Jira</span>
              <span><span className={dotClass(isReal, !isReal)} /><span className={`set-value ${isReal ? '' : 'muted'}`}>{isReal ? 'Jira real conectado' : 'modo mock · casos seed'}</span></span>
              <span className={`pill ${isReal ? 'pass' : 'blk'}`}><span className="dot" />{isReal ? 'real' : 'mock'}</span>
            </div>
          </div>

          <div className="set-section">
            <div className="set-section-head">
              <span className="icn">☁️</span>
              <div style={{ flex: 1 }}>
                <div className="set-section-title">Conexión Jira</div>
                <div className="set-section-sub">Para conectar Jira real, configurá las variables abajo y reiniciá el backend</div>
              </div>
            </div>
            <div className="set-row">
              <span className="set-label">Modo activo</span>
              <span className="set-value">{isReal ? 'real' : 'mock'} <span style={{ color: 'var(--text-3)' }}>· {isReal ? 'credenciales configuradas' : 'fallback automático por credenciales faltantes'}</span></span>
              <span className="tag">{isReal ? 'real' : 'auto'}</span>
            </div>
            <div className="set-row">
              <span className="set-label">Base URL</span>
              <span className={`set-value ${has(jira?.baseUrl) ? '' : 'muted'}`}>{jira?.baseUrl || '— sin configurar —'}</span>
              <span className={`pill ${has(jira?.baseUrl) ? 'pass' : 'notrun'}`}><span className="dot" />{has(jira?.baseUrl) ? 'ok' : 'missing'}</span>
            </div>
            <div className="set-row">
              <span className="set-label">Email</span>
              <span className={`set-value ${has(jira?.email) ? '' : 'muted'}`}>{jira?.email || '— sin configurar —'}</span>
              <span className={`pill ${has(jira?.email) ? 'pass' : 'notrun'}`}><span className="dot" />{has(jira?.email) ? 'ok' : 'missing'}</span>
            </div>
            <div className="set-row">
              <span className="set-label">API token</span>
              <span className="set-value muted">•••••••• <span style={{ color: 'var(--text-4)', fontSize: 11.5 }}>(nunca expuesto al frontend)</span></span>
              <span className={`pill ${isReal ? 'pass' : 'notrun'}`}><span className="dot" />{isReal ? 'ok' : 'missing'}</span>
            </div>
            <div className="set-row">
              <span className="set-label">Project key default</span>
              <span className="set-value">{jira?.projectKey || '—'}</span>
              <span className="pill pass"><span className="dot" />ok</span>
            </div>
            <div className="set-row">
              <span className="set-label">Bug issue type</span>
              <span className="set-value">{jira?.bugIssueType || '—'}</span>
              <span className="pill pass"><span className="dot" />ok</span>
            </div>
            <div className="set-row">
              <span className="set-label">Gherkin field</span>
              <span className="set-value">{jira?.gherkinField || '—'}</span>
              <span className="pill pass"><span className="dot" />ok</span>
            </div>
            <div className="env-grid">
              <div style={{ color: 'var(--text-3)', fontSize: 10.5, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}># .env.example</div>
              <div><span className="k">JIRA_BASE_URL=</span><span className="v">{jira?.baseUrl || 'https://your-company.atlassian.net'}</span></div>
              <div><span className="k">JIRA_EMAIL=</span><span className="v">{jira?.email || 'qa@example.com'}</span></div>
              <div><span className="k">JIRA_API_TOKEN=</span><span className="v">••••••••••••••••</span></div>
              <div><span className="k">JIRA_PROJECT_KEY=</span><span className="v">{jira?.projectKey || 'SCRUM'}</span></div>
              <div><span className="k">JIRA_BUG_ISSUE_TYPE=</span><span className="v">{jira?.bugIssueType || 'Bug'}</span></div>
              <div><span className="k">JIRA_GHERKIN_FIELD=</span><span className="v">{jira?.gherkinField || 'description'}</span></div>
              <div><span className="k">JIRA_MOCK_MODE=</span><span className="v">{isReal ? 'false' : 'true'}</span></div>
            </div>
          </div>

          <div className="set-section">
            <div className="set-section-head">
              <span className="icn">🗄</span>
              <div style={{ flex: 1 }}>
                <div className="set-section-title">Base de datos</div>
                <div className="set-section-sub">PostgreSQL · Entity Framework Core migrations</div>
              </div>
            </div>
            <div className="set-row">
              <span className="set-label">Connection string</span>
              <span className="set-value muted">postgresql://•••:•••@•••/qa_test_case_hub</span>
              <span className={`pill ${dbOk ? 'pass' : 'fail'}`}><span className="dot" />{dbOk ? 'conectado' : 'sin conexión'}</span>
            </div>
            <div className="set-row">
              <span className="set-label">Migración aplicada</span>
              <span className="set-value">{LATEST_MIGRATION}</span>
              <span className="pill pass"><span className="dot" />up to date</span>
            </div>
            <div className="set-row">
              <span className="set-label">Tablas</span>
              <span className="set-value">test_cases · test_executions</span>
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}><span className="mono">{caseCount}</span> casos</span>
            </div>
          </div>

          <div className="set-section">
            <div className="set-section-head">
              <span className="icn">✨</span>
              <div style={{ flex: 1 }}>
                <div className="set-section-title">App</div>
                <div className="set-section-sub">Build info y entorno</div>
              </div>
            </div>
            <div className="set-row">
              <span className="set-label">Versión</span>
              <span className="set-value">v0.1.0-mvp</span>
              <span></span>
            </div>
            <div className="set-row">
              <span className="set-label">Entorno (frontend)</span>
              <span className="set-value">{import.meta.env.MODE}</span>
              <span className="pill info"><span className="dot" />{import.meta.env.DEV ? 'dev' : 'prod'}</span>
            </div>
            <div className="set-row">
              <span className="set-label">CORS origin</span>
              <span className="set-value">{typeof window !== 'undefined' ? window.location.origin : '—'}</span>
              <span className="pill pass"><span className="dot" />ok</span>
            </div>
            <div className="set-row">
              <span className="set-label">OpenAPI</span>
              <span className="set-value">
                <a href={`${API_BASE}/openapi/v1.json`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{API_BASE}/openapi/v1.json ↗</a>
              </span>
              <span className="pill info"><span className="dot" />habilitado</span>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '14px 18px', background: 'var(--accent-soft)', border: '1px solid rgba(124,92,255,0.15)', borderRadius: 12, color: 'var(--text-2)', fontSize: 12.5, lineHeight: 1.6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>🔒</span>
            <div>
              <b>Seguridad.</b> El token Jira <b>nunca</b> llega al frontend ni a los logs (redactado en logging estructurado). Para modificar: editá <span className="mono">backend/.env</span> y reiniciá <span className="mono">dotnet run</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
