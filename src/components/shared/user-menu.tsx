'use client';

import { useUser } from '@clerk/nextjs';
import { SignOutButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  BarChart3,
  FolderOpen
} from 'lucide-react';

export function UserMenu() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button 
        onClick={() => router.push('/sign-in')}
        variant="outline"
        size="sm"
      >
        Sign In
      </Button>
    );
  }

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" className="flex items-center space-x-2 px-2">
          <Avatar
            src={user.imageUrl}
            fallback={user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || 'U'}
            size="sm"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-24 truncate">
            {user.firstName || 'User'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </Button>
      }
      align="end"
    >
      <DropdownItem onClick={() => router.push('/dashboard')}>
        <BarChart3 className="w-4 h-4 mr-2" />
        Dashboard
      </DropdownItem>
      <DropdownItem onClick={() => router.push('/projects')}>
        <FolderOpen className="w-4 h-4 mr-2" />
        Projects
      </DropdownItem>
      <DropdownItem onClick={() => router.push('/analytics')}>
        <BarChart3 className="w-4 h-4 mr-2" />
        Analytics
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem onClick={() => router.push('/settings')}>
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </DropdownItem>
      <DropdownItem onClick={() => router.push('/profile')}>
        <User className="w-4 h-4 mr-2" />
        Profile
      </DropdownItem>
      <DropdownSeparator />
      <SignOutButton>
        <DropdownItem destructive>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownItem>
      </SignOutButton>
    </Dropdown>
  );
} 