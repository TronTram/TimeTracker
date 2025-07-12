'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { 
  Sun, 
  Moon, 
  Monitor, 
  ChevronDown 
} from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ 
  variant = 'dropdown', 
  size = 'default',
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  const getThemeIcon = (currentTheme: string | undefined) => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getThemeLabel = (currentTheme: string | undefined) => {
    switch (currentTheme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'System';
    }
  };

  if (variant === 'button') {
    // Simple toggle button that cycles through themes
    const cycleTheme = () => {
      if (theme === 'light') {
        setTheme('dark');
      } else if (theme === 'dark') {
        setTheme('system');
      } else {
        setTheme('light');
      }
    };

    return (
      <Button
        variant="outline"
        size={size}
        onClick={cycleTheme}
        className="gap-2"
        aria-label="Toggle theme"
      >
        {getThemeIcon(theme)}
        {showLabel && (
          <span className="hidden sm:inline">
            {getThemeLabel(theme)}
          </span>
        )}
      </Button>
    );
  }

  // Dropdown variant with all theme options
  return (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size={size}
          className="gap-2 justify-between min-w-[100px]"
          aria-label="Select theme"
        >
          <div className="flex items-center gap-2">
            {getThemeIcon(theme)}
            {showLabel && (
              <span className="hidden sm:inline">
                {getThemeLabel(theme)}
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      }
      align="end"
    >
      <DropdownItem
        onClick={() => setTheme('light')}
        className={theme === 'light' ? 'bg-accent' : ''}
      >
        <Sun className="w-4 h-4 mr-2" />
        Light
      </DropdownItem>
      
      <DropdownItem
        onClick={() => setTheme('dark')}
        className={theme === 'dark' ? 'bg-accent' : ''}
      >
        <Moon className="w-4 h-4 mr-2" />
        Dark
      </DropdownItem>
      
      <DropdownItem
        onClick={() => setTheme('system')}
        className={theme === 'system' ? 'bg-accent' : ''}
      >
        <Monitor className="w-4 h-4 mr-2" />
        System
      </DropdownItem>
    </Dropdown>
  );
} 