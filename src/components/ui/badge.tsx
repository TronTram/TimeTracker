import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-500 text-white hover:bg-green-500/80',
        warning:
          'border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80',
        info:
          'border-transparent bg-blue-500 text-white hover:bg-blue-500/80',
        timer:
          'border-transparent bg-timer-work text-white',
        'timer-break':
          'border-transparent bg-timer-short-break text-white',
        'timer-focus':
          'border-transparent bg-timer-focus text-white',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    icon, 
    removable, 
    onRemove, 
    children, 
    ...props 
  }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {removable && onRemove && (
          <button
            type="button"
            className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            onClick={onRemove}
            aria-label="Remove"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Badge.displayName = 'Badge';

// Status Badge for different states
export interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  showText?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showText = false, 
  className 
}) => {
  const statusConfig = {
    online: { color: 'bg-green-500', text: 'Online' },
    offline: { color: 'bg-gray-500', text: 'Offline' },
    away: { color: 'bg-yellow-500', text: 'Away' },
    busy: { color: 'bg-red-500', text: 'Busy' },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('h-2 w-2 rounded-full', config.color)} />
      {showText && (
        <span className="text-xs text-muted-foreground">{config.text}</span>
      )}
    </div>
  );
};

// Tag Badge specifically for tags
export interface TagBadgeProps extends Omit<BadgeProps, 'variant'> {
  color?: string;
}

const TagBadge = React.forwardRef<HTMLDivElement, TagBadgeProps>(
  ({ className, color, style, children, ...props }, ref) => {
    const badgeStyle = color
      ? {
          backgroundColor: color,
          color: 'white',
          ...style,
        }
      : style;

    return (
      <Badge
        ref={ref}
        variant="secondary"
        className={className}
        style={badgeStyle}
        {...props}
      >
        {children}
      </Badge>
    );
  }
);
TagBadge.displayName = 'TagBadge';

export { Badge, StatusBadge, TagBadge, badgeVariants };
