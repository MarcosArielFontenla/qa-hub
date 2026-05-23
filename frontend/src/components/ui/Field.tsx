import { clsx } from 'clsx';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('grid gap-1 text-sm font-medium text-ink', className)}>
      <span className="text-xs font-semibold uppercase text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'min-h-10 rounded-md border border-line bg-white/90 px-3 py-2 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-violet-100',
        props.className
      )}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        'min-h-10 rounded-md border border-line bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-violet-100',
        props.className
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'rounded-md border border-line bg-white/90 px-3 py-2 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-violet-100',
        props.className
      )}
    />
  );
}
