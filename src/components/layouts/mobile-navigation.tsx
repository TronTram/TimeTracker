'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  Timer 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  className?: string;
}

const navItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Home',
    activePattern: /^\/dashboard$/,
  },
  {
    href: '/timer',
    icon: Timer,
    label: 'Timer',
    activePattern: /^\/timer/,
  },
  {
    href: '/projects',
    icon: FolderOpen,
    label: 'Projects',
    activePattern: /^\/projects/,
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label: 'Analytics',
    activePattern: /^\/analytics/,
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Settings',
    activePattern: /^\/settings/,
  },
];

export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t',
      'md:hidden', // Hide on desktop
      className
    )}>
      <div className="flex justify-around items-center py-2 px-4 safe-area-padding-bottom">
        {navItems.map((item) => {
          const isActive = item.activePattern.test(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center relative p-2 rounded-lg min-w-0 flex-1',
                'transition-colors duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Icon */}
              <Icon 
                className={cn(
                  'w-5 h-5 mb-1 transition-transform duration-200',
                  isActive && 'scale-110'
                )} 
              />

              {/* Label */}
              <span className={cn(
                'text-xs font-medium truncate w-full text-center',
                'transition-opacity duration-200',
                isActive ? 'opacity-100' : 'opacity-70'
              )}>
                {item.label}
              </span>

              {/* Ripple effect on press */}
              <motion.div
                className="absolute inset-0 rounded-lg bg-primary/10"
                initial={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.1 }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNavigation;
