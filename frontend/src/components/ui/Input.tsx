import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-potato-muted">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl bg-[#F9F7F1] border border-potato-border text-potato-ink placeholder:text-potato-muted/50 text-sm transition-all duration-200',
            'focus:outline-none focus:border-potato-olive focus:bg-white focus:ring-1 focus:ring-potato-olive',
            error ? 'border-potato-error focus:border-potato-error focus:ring-potato-error bg-rose-50/20' : '',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-medium text-potato-error">{error}</p>}
        {helperText && !error && <p className="text-xs text-potato-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
