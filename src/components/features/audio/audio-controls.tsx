/**
 * Compact audio controls for the main timer interface
 */

'use client';

import { Volume2, VolumeX, Music, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/hooks/use-audio';
import { useNotificationSettings } from '@/hooks/use-notifications';
import { AmbientSounds } from './ambient-sounds';
import { CompactVolumeControl } from './volume-control';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AudioControlsProps {
  className?: string;
  showAmbientSounds?: boolean;
  compact?: boolean;
}

export function AudioControls({ 
  className, 
  showAmbientSounds = true, 
  compact = false 
}: AudioControlsProps) {
  const { state, toggleMute } = useAudio();
  const { 
    isEnabled: notificationsEnabled, 
    toggleNotifications, 
    needsPermission,
    requestPermission,
  } = useNotificationSettings();

  const handleNotificationToggle = async () => {
    if (needsPermission) {
      await requestPermission();
    } else {
      toggleNotifications();
    }
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {/* Master Volume/Mute */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className={cn(
            'p-2',
            state.isMuted && 'text-red-500 hover:text-red-600'
          )}
          title={state.isMuted ? 'Unmute' : 'Mute'}
        >
          {state.isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>

        {/* Notifications Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNotificationToggle}
          className={cn(
            'p-2',
            !notificationsEnabled && 'text-gray-400'
          )}
          title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          {notificationsEnabled ? (
            <Bell className="w-4 h-4" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
        </Button>

        {/* Ambient Sound Indicator */}
        {state.isAmbientPlaying && (
          <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
            <Music className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">
              {state.ambientSound}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Audio Controls
        </h3>
        
        <div className="flex items-center space-x-2">
          {/* Notifications Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNotificationToggle}
            className={cn(
              'flex items-center space-x-2',
              notificationsEnabled && 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
            )}
          >
            {notificationsEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
            </span>
          </Button>

          {/* Master Mute Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className={cn(
              'flex items-center space-x-2',
              !state.isMuted && 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
              state.isMuted && 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            )}
          >
            {state.isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {state.isMuted ? 'Unmute' : 'Mute'}
            </span>
          </Button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-4">
        <CompactVolumeControl type="master" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Master Volume: {state.masterVolume}%
        </span>
      </div>

      {/* Ambient Sounds */}
      {showAmbientSounds && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ambient Sounds
          </h4>
          <AmbientSounds compact />
        </div>
      )}

      {/* Current Status */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className={cn(
              'flex items-center space-x-2',
              state.soundEnabled ? 'text-green-600' : 'text-gray-400'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                state.soundEnabled ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <span>Sound: {state.soundEnabled ? 'On' : 'Off'}</span>
            </span>
            
            <span className={cn(
              'flex items-center space-x-2',
              notificationsEnabled ? 'text-green-600' : 'text-gray-400'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                notificationsEnabled ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <span>Notifications: {notificationsEnabled ? 'On' : 'Off'}</span>
            </span>
          </div>

          {state.isAmbientPlaying && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Music className="w-4 h-4" />
              <span>Playing ambient sound</span>
            </div>
          )}
        </div>
      </div>

      {/* Permission Warning */}
      {needsPermission && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <Bell className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Notification Permission Required
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Click the notification button to enable browser notifications for timer alerts.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
