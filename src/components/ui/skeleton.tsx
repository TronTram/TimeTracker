import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva(
  'animate-pulse rounded-md bg-muted',
  {
    variants: {
      variant: {
        default: '',
        text: 'h-4',
        heading: 'h-6',
        button: 'h-10',
        avatar: 'rounded-full',
        card: 'h-32',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
Skeleton.displayName = 'Skeleton';

// Pre-built skeleton components for common use cases
const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={cn(
          'w-full',
          i === lines - 1 && 'w-4/5' // Last line is shorter
        )}
      />
    ))}
  </div>
);

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-4 rounded-lg border p-6', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="avatar" className="h-12 w-12" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="heading" className="w-1/3" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-4/5" />
      <Skeleton variant="text" className="w-3/5" />
    </div>
    <div className="flex space-x-2">
      <Skeleton variant="button" className="w-20" />
      <Skeleton variant="button" className="w-16" />
    </div>
  </div>
);

const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string; 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-5 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonList: React.FC<{ 
  items?: number; 
  showAvatar?: boolean;
  className?: string; 
}> = ({ 
  items = 5, 
  showAvatar = true,
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        {showAvatar && (
          <Skeleton variant="avatar" className="h-10 w-10" />
        )}
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const SkeletonTimer: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex flex-col items-center space-y-4', className)}>
    {/* Timer display */}
    <Skeleton className="h-24 w-48 rounded-lg" />
    {/* Controls */}
    <div className="flex space-x-4">
      <Skeleton variant="button" className="w-16 rounded-full" />
      <Skeleton variant="button" className="w-16 rounded-full" />
      <Skeleton variant="button" className="w-16 rounded-full" />
    </div>
    {/* Progress */}
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
);

const SkeletonChart: React.FC<{ 
  type?: 'bar' | 'line' | 'pie'; 
  className?: string; 
}> = ({ 
  type = 'bar', 
  className 
}) => {
  if (type === 'pie') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Chart area */}
      <Skeleton className="h-48 w-full" />
      {/* Legend */}
      <div className="flex space-x-4 justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton variant="text" className="w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonTimer,
  SkeletonChart,
  skeletonVariants,
};
