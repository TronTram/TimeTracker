import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn, getInitials } from '@/lib/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
  fallback?: string;
  loading?: 'eager' | 'lazy';
  onError?: () => void;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className, 
    size, 
    src, 
    alt, 
    name, 
    fallback, 
    loading = 'eager',
    onError,
    ...props 
  }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const handleImageError = () => {
      setImageError(true);
      onError?.();
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
    };

    const showImage = src && !imageError;
    const initials = fallback || (name ? getInitials(name) : '?');

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {showImage && (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            loading={loading}
            className={cn(
              'aspect-square h-full w-full object-cover transition-opacity duration-200',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
        {(!showImage || !imageLoaded) && (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <span className="text-xs font-medium uppercase">
              {initials}
            </span>
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

// Avatar Group component for displaying multiple avatars
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: VariantProps<typeof avatarVariants>['size'];
  spacing?: 'tight' | 'normal' | 'loose';
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ 
    className, 
    children, 
    max = 5, 
    size = 'default',
    spacing = 'normal',
    ...props 
  }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const remainingCount = childrenArray.length - max;

    const spacingClass = {
      tight: '-space-x-1',
      normal: '-space-x-2',
      loose: '-space-x-1',
    }[spacing];

    return (
      <div
        ref={ref}
        className={cn('flex items-center', spacingClass, className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div key={index} className="ring-2 ring-background">
            {React.isValidElement(child)
              ? React.cloneElement(child, { size } as any)
              : child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="ring-2 ring-background">
            <Avatar
              size={size}
              fallback={`+${remainingCount}`}
              className="bg-muted text-muted-foreground"
            />
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

// Avatar with status indicator
export interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
}

const AvatarWithStatus = React.forwardRef<HTMLDivElement, AvatarWithStatusProps>(
  ({ status = 'offline', showStatus = true, className, ...props }, ref) => {
    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    };

    return (
      <div className={cn('relative', className)}>
        <Avatar ref={ref} {...props} />
        {showStatus && (
          <div
            className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);
AvatarWithStatus.displayName = 'AvatarWithStatus';

export { Avatar, AvatarGroup, AvatarWithStatus, avatarVariants };
