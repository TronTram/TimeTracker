import { UserPreferencesForm } from '@/components/forms/user-preferences-form';
import { PomodoroSettings } from '@/components/features/pomodoro/pomodoro-settings';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and application settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            Import Data
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            Reset All Settings
          </Button>
        </div>
      </Card>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* General Preferences */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">General Preferences</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Customize your general timer experience
            </p>
          </div>
          
          <UserPreferencesForm />
        </Card>

        {/* Pomodoro Settings */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Pomodoro Timer</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Configure your Pomodoro timer settings and preferences
            </p>
          </div>
          
          <PomodoroSettings />
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Changes are automatically saved when you update preferences</p>
      </div>
    </div>
  );
} 