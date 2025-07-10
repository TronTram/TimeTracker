import * as React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dropdownVariants = cva(
  'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      side: {
        top: 'slide-in-from-bottom-2',
        bottom: 'slide-in-from-top-2',
        left: 'slide-in-from-right-2',
        right: 'slide-in-from-left-2',
      },
    },
    defaultVariants: {
      side: 'bottom',
    },
  }
);

export interface DropdownProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({
    className,
    side = 'bottom',
    open = false,
    onOpenChange,
    trigger,
    align = 'start',
    sideOffset = 4,
    children,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          triggerRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          handleClose();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
          handleClose();
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen]);

    const handleClose = () => {
      setIsOpen(false);
      onOpenChange?.(false);
    };

    const handleToggle = () => {
      const newState = !isOpen;
      setIsOpen(newState);
      onOpenChange?.(newState);
    };

    const getDropdownPosition = () => {
      const styles: React.CSSProperties = {};

      switch (side) {
        case 'top':
          styles.bottom = '100%';
          styles.marginBottom = sideOffset;
          break;
        case 'bottom':
          styles.top = '100%';
          styles.marginTop = sideOffset;
          break;
        case 'left':
          styles.right = '100%';
          styles.marginRight = sideOffset;
          break;
        case 'right':
          styles.left = '100%';
          styles.marginLeft = sideOffset;
          break;
      }

      switch (align) {
        case 'start':
          if (side === 'top' || side === 'bottom') {
            styles.left = 0;
          } else {
            styles.top = 0;
          }
          break;
        case 'center':
          if (side === 'top' || side === 'bottom') {
            styles.left = '50%';
            styles.transform = 'translateX(-50%)';
          } else {
            styles.top = '50%';
            styles.transform = 'translateY(-50%)';
          }
          break;
        case 'end':
          if (side === 'top' || side === 'bottom') {
            styles.right = 0;
          } else {
            styles.bottom = 0;
          }
          break;
      }

      return styles;
    };

    return (
      <div className="relative inline-block">
        <div
          ref={triggerRef}
          onClick={handleToggle}
          className="cursor-pointer"
        >
          {trigger}
        </div>
        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(dropdownVariants({ side, className }))}
            style={getDropdownPosition()}
            {...props}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);
Dropdown.displayName = 'Dropdown';

// Dropdown Item
export interface DropdownItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  destructive?: boolean;
}

const DropdownItem = React.forwardRef<HTMLDivElement, DropdownItemProps>(
  ({ className, disabled, destructive, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onClick?.(e);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
          disabled
            ? 'pointer-events-none opacity-50'
            : 'focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground',
          destructive && 'text-destructive focus:bg-destructive focus:text-destructive-foreground',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownItem.displayName = 'DropdownItem';

// Dropdown Separator
const DropdownSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
DropdownSeparator.displayName = 'DropdownSeparator';

// Dropdown Label
const DropdownLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold', className)}
    {...props}
  />
));
DropdownLabel.displayName = 'DropdownLabel';

export {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  dropdownVariants,
};
