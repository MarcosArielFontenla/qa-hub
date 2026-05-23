import { CheckSquare, Settings, Sparkles } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';

const navItems = [
  { to: '/test-cases', label: 'Casos de prueba', icon: CheckSquare },
  { to: '/settings', label: 'Configuración', icon: Settings }
];

export function AppLayout() {
  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-white shadow-card">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight">QA Test Case Hub</p>
              <p className="text-xs font-medium text-muted">for Jira</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-lavender text-accent shadow-card' : 'text-muted hover:bg-white/60 hover:text-ink'
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
