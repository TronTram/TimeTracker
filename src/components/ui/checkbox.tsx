"use client";

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, indeterminate = false, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Handle indeterminate state
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref || inputRef}
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            checked || indeterminate
              ? 'bg-primary text-primary-foreground'
              : 'bg-background',
            className
          )}
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.click();
            }
          }}
        >
          {(checked || indeterminate) && (
            <Check
              className={cn(
                'h-4 w-4',
                indeterminate ? 'opacity-50' : 'opacity-100'
              )}
            />
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
