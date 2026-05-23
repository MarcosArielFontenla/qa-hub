import type { CSSProperties, ReactNode } from 'react';
import type { AutomationStatus, ExecutionResult } from '../../types/contracts';
import { avatarColor, highlightGherkin, tagClass } from '../../lib/design';

export interface Person {
  name?: string | null;
  initials: string;
}

export function Tag({ children }: { children: string }) {
  return <span className={`tag ${tagClass(children)}`}>{children}</span>;
}

export function StatusPill({ r }: { r?: ExecutionResult | null }) {
  const map: Record<ExecutionResult, { cls: string; lbl: string }> = {
    Pass: { cls: 'pass', lbl: 'Pass' },
    Fail: { cls: 'fail', lbl: 'Fail' },
    Blocked: { cls: 'blk', lbl: 'Blocked' },
    NotRun: { cls: 'notrun', lbl: 'Not run' }
  };
  const m = map[r ?? 'NotRun'] ?? map.NotRun;
  return (
    <span className={`pill ${m.cls}`}>
      <span className="dot" />
      {m.lbl}
    </span>
  );
}

export function AutomationPill({ s }: { s: AutomationStatus }) {
  const map: Record<AutomationStatus, { cls: string; icon: string; lbl: string }> = {
    Automated: { cls: 'violet', icon: '🤖', lbl: 'Automated' },
    InAutomation: { cls: 'info', icon: '🔧', lbl: 'In auto' },
    ReadyToAutomate: { cls: 'info', icon: '✨', lbl: 'Ready' },
    ManualOnly: { cls: 'notrun', icon: '✋', lbl: 'Manual' },
    Flaky: { cls: 'blk', icon: '🌪', lbl: 'Flaky' },
    Deprecated: { cls: 'notrun', icon: '✕', lbl: 'Deprecated' }
  };
  const m = map[s] ?? map.ManualOnly;
  return (
    <span className={`pill ${m.cls}`}>
      {m.icon} {m.lbl}
    </span>
  );
}

export function JiraStatusPill({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    'To Do': 'var(--text-3)',
    'In Progress': 'var(--info-fg)',
    'In Review': 'var(--violet-fg)',
    Done: 'var(--pass-fg)'
  };
  const color = (status && map[status]) || 'var(--text-3)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: color }} />
      {status || '—'}
    </span>
  );
}

export function Avatar({ person, size = 22 }: { person?: Person | null; size?: number }) {
  if (!person || !person.name) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#EFE9FF',
          color: '#A09BB0',
          fontSize: size * 0.42,
          border: '1px dashed #D6CFEA',
          flexShrink: 0
        }}
      >
        ?
      </span>
    );
  }
  return (
    <span
      className="av"
      title={person.name}
      style={{ width: size, height: size, background: avatarColor(person.name), fontSize: size * 0.42, flexShrink: 0 }}
    >
      {person.initials}
    </span>
  );
}

export function GherkinPre({ text, style }: { text: string; style?: CSSProperties }) {
  return <pre className="gherkin" style={style} dangerouslySetInnerHTML={{ __html: highlightGherkin(text) }} />;
}

export function Empty({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>{title}</div>
      {hint ? <div style={{ fontSize: 12.5, marginBottom: 14 }}>{hint}</div> : null}
      {action}
    </div>
  );
}
