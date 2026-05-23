import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export function Button({ className, variant = 'primary', isLoading, children, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-accent text-white shadow-card hover:bg-violet-700',
    secondary: 'border border-white/70 bg-white/85 text-ink shadow-card hover:bg-white',
    ghost: 'text-ink hover:bg-lavender',
    danger: 'bg-danger text-white shadow-card hover:bg-red-800'
  };

  return (
    <button
      className={clsx(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
