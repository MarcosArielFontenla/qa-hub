import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAllTestCases, getHealth, getJiraSettings } from '../api/testCasesApi';
import { deriveProjects, resultOf } from '../lib/selectors';
import { initialsOf, projEmoji } from '../lib/design';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const casesQuery = useQuery({ queryKey: ['all-test-cases'], queryFn: getAllTestCases });
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: getHealth });
  const jiraQuery = useQuery({ queryKey: ['jira-settings'], queryFn: getJiraSettings });

  const cases = casesQuery.data ?? [];
  const totalCases = cases.length;
  const failedCount = cases.filter((t) => resultOf(t) === 'Fail').length;
  const projects = deriveProjects(cases);
  const jiraMode = healthQuery.data?.jiraMode ?? 'mock';

  const email = jiraQuery.data?.email ?? null;
  const userName = email || 'QA Workspace';
  const userInitials = email ? initialsOf(email.replace(/@.*/, '').replace(/[._-]/g, ' ')) : 'QA';

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊', count: null as number | null, disabled: false, to: '/dashboard' },
    { key: 'test-cases', label: 'Test cases', icon: <span className="sq" style={{ background: '#7C5CFF' }}>QA</span>, count: totalCases, disabled: false, to: '/test-cases' },
    { key: 'bugs', label: 'Bugs abiertos', icon: '🐞', count: failedCount, disabled: true, to: '#' },
    { key: 'executions', label: 'Ejecuciones', icon: '🕒', count: null, disabled: true, to: '#' },
    { key: 'favorites', label: 'Favoritos', icon: '⭐', count: null, disabled: true, to: '#' }
  ];

  const go = (to: string) => navigate(to);

  return (
    <aside className="side">
      <div className="brand" onClick={() => go('/dashboard')}>
        <span className="mark">qa</span>
        <span>
          <div className="name">QA Test Case Hub</div>
          <div className="ws">QA · workspace</div>
        </span>
      </div>

      <div className="ws-card">
        <span className="av">QA</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="nm">QA · {jiraQuery.data?.projectKey || 'SCRUM'}</div>
          <div className="mb">{projects.length} proyecto(s) · {totalCases} casos</div>
        </div>
        <span style={{ color: 'var(--text-3)' }}>⌄</span>
      </div>

      <div className="sect-title">Workspace</div>
      <nav className="snav">
        {navItems.map((item) => (
          <a
            key={item.key}
            className={`nlink ${path.startsWith(item.to) && !item.disabled ? 'active' : ''}`}
            href={item.to}
            onClick={(e) => {
              e.preventDefault();
              if (!item.disabled) go(item.to);
            }}
            style={item.disabled ? { opacity: 0.55 } : undefined}
            title={item.disabled ? 'Próximamente' : ''}
          >
            <span className="ic">{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.count !== null && <span className="cnt">{item.count}</span>}
          </a>
        ))}
      </nav>

      {projects.length > 0 && (
        <>
          <div className="sect-title">Proyectos</div>
          <nav className="snav">
            {projects.map((p) => (
              <a
                key={p.key}
                className="nlink"
                href={`/test-cases?proj=${p.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(`/test-cases?proj=${encodeURIComponent(p.key)}`);
                }}
              >
                <span className="ic">{projEmoji(p.key)}</span>
                <span style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  {p.name}
                </span>
                <span className="cnt">{p.count}</span>
              </a>
            ))}
          </nav>
        </>
      )}

      <div className="sect-title">Sistema</div>
      <nav className="snav">
        <a
          className={`nlink ${path.startsWith('/settings') ? 'active' : ''}`}
          href="/settings"
          onClick={(e) => {
            e.preventDefault();
            go('/settings');
          }}
        >
          <span className="ic">⚙️</span>
          <span style={{ flex: 1 }}>Settings</span>
          <span
            className="cnt"
            style={{
              background: jiraMode === 'mock' ? '#FDF2DA' : '#E6F5EC',
              color: jiraMode === 'mock' ? '#8A5C16' : '#1F8A4C',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700
            }}
          >
            {jiraMode}
          </span>
        </a>
      </nav>

      <div className="side-foot">
        <div className="user">
          <span className="av">{userInitials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div className="role">{jiraMode === 'real' ? 'Conectado a Jira' : 'mock mode'}</div>
          </div>
          <span style={{ color: 'var(--text-3)' }}>···</span>
        </div>
      </div>
    </aside>
  );
}
