import type { DashboardSummaryDto } from '../../types/contracts';

interface Kpi {
  label: string;
  value: string | number;
  tone?: 'default' | 'danger' | 'warn' | 'ok';
}

export function KpiCards({ summary }: { summary?: DashboardSummaryDto }) {
  const kpis: Kpi[] = [
    { label: 'Total', value: summary?.totalTestCases ?? 0 },
    { label: 'Pass rate', value: `${summary?.passRate ?? 0}%`, tone: 'ok' },
    { label: 'Failed', value: summary?.failed ?? 0, tone: 'danger' },
    { label: 'Blocked', value: summary?.blocked ?? 0, tone: 'warn' },
    { label: 'Not run', value: summary?.notRun ?? 0 },
    { label: 'Automation coverage', value: `${summary?.automationCoverage ?? 0}%`, tone: 'ok' }
  ];

  const toneClass: Record<NonNullable<Kpi['tone']>, string> = {
    default: 'text-ink',
    danger: 'text-danger',
    warn: 'text-warn',
    ok: 'text-accent'
  };

  return (
    <div className="sticky top-[68px] z-20 -mx-4 border-y border-white/50 bg-white/70 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="surface-card px-3 py-2.5">
            <p className="text-xs font-semibold uppercase text-muted">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${toneClass[kpi.tone ?? 'default']}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
