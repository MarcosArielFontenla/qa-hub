import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  emoji?: string;
  swatch?: string;
}

export function Popover({ open, onClose, children, align = 'left' }: { open: boolean; onClose: () => void; children: ReactNode; align?: 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className="pop" style={align === 'right' ? { left: 'auto', right: 0 } : undefined}>
      {children}
    </div>
  );
}

export function FilterChip({
  label,
  icon,
  values,
  onChange,
  options,
  getCount,
  searchable = true
}: {
  label: string;
  icon?: string;
  values: Set<string>;
  onChange: (next: Set<string>) => void;
  options: FilterOption[];
  getCount?: (value: string) => number;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const on = values.size > 0;
  const opts = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  const toggle = (val: string) => {
    const next = new Set(values);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange(next);
  };
  const summary = on
    ? values.size === 1
      ? options.find((o) => o.value === Array.from(values)[0])?.label || Array.from(values)[0]
      : `${values.size} seleccionados`
    : 'todos';

  return (
    <div className="pop-wrap">
      <button className={`chip ${on ? 'on' : ''}`} onClick={() => setOpen((o) => !o)}>
        {icon && <span>{icon}</span>}
        <span className="lbl">{label}</span>
        <span>·</span>
        <span>{summary}</span>
        {on && <span className="val-count">{values.size}</span>}
        <span style={{ opacity: 0.6, fontSize: 10 }}>▾</span>
      </button>
      <Popover open={open} onClose={() => setOpen(false)}>
        {searchable && (
          <div className="pop-search">
            <input autoFocus placeholder={`Buscar ${label.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {opts.map((o) => (
            <div key={o.value} className={`pop-item ${values.has(o.value) ? 'on' : ''}`} onClick={() => toggle(o.value)}>
              <span className="ck">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-11" />
                </svg>
              </span>
              {o.swatch && <span style={{ width: 9, height: 9, borderRadius: 3, background: o.swatch, flexShrink: 0 }} />}
              {o.emoji && <span style={{ fontSize: 14 }}>{o.emoji}</span>}
              <span className="lbl">{o.label}</span>
              {getCount && <span className="cnt">{getCount(o.value)}</span>}
            </div>
          ))}
          {opts.length === 0 && <div style={{ padding: '10px 12px', color: 'var(--text-4)', fontSize: 12.5 }}>Sin resultados.</div>}
        </div>
        {on && (
          <div className="pop-foot">
            <button onClick={() => onChange(new Set())}>Limpiar</button>
            <span className="mono" style={{ color: 'var(--text-4)' }}>
              {values.size} activo(s)
            </span>
          </div>
        )}
      </Popover>
    </div>
  );
}

export function Checkbox({ checked, onChange, color }: { checked: boolean; onChange: (next: boolean) => void; color?: string }) {
  return (
    <span
      onClick={() => onChange(!checked)}
      style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        border: `1.5px solid ${color || 'var(--border-2)'}`,
        background: checked ? color || 'var(--accent)' : 'transparent',
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-11" />
        </svg>
      )}
    </span>
  );
}
