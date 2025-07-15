/**
 * Volume slider component
 */

'use client';

import { useState, useEffect } from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/hooks/use-audio';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  type?: 'master' | 'ambient' | 'notification';
  label?: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPercentage?: boolean;
}

export function VolumeControl({
  type = 'master',
  label,
  className,
  orientation = 'horizontal',
  size = 'md',
  showLabel = true,
  showPercentage = false,
}: VolumeControlProps) {
  const { state, setMasterVolume, setAmbientVolume, setNotificationVolume, toggleMute } = useAudio();
  const [isDragging, setIsDragging] = useState(false);

  // Get current volume based on type
  const getCurrentVolume = () => {
    switch (type) {
      case 'ambient':
        return state.ambientVolume;
      case 'notification':
        return state.notificationVolume;
      default:
        return state.masterVolume;
    }
  };

  // Set volume based on type
  const setVolume = (volume: number) => {
    switch (type) {
      case 'ambient':
        setAmbientVolume(volume);
        break;
      case 'notification':
        setNotificationVolume(volume);
        break;
      default:
        setMasterVolume(volume);
        break;
    }
  };

  const currentVolume = getCurrentVolume();
  const isMuted = state.isMuted;
  const effectiveVolume = isMuted ? 0 : currentVolume;

  // Get volume icon based on level
  const getVolumeIcon = () => {
    if (isMuted || effectiveVolume === 0) return VolumeX;
    if (effectiveVolume <= 33) return Volume;
    if (effectiveVolume <= 66) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  // Handle slider change
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(event.target.value);
    setVolume(newVolume);
  };

  // Handle click on slider track
  const handleSliderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const isVertical = orientation === 'vertical';
    
    let percentage;
    if (isVertical) {
      percentage = (rect.bottom - event.clientY) / rect.height;
    } else {
      percentage = (event.clientX - rect.left) / rect.width;
    }
    
    const newVolume = Math.round(percentage * 100);
    setVolume(Math.max(0, Math.min(100, newVolume)));
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      sliderHeight: orientation === 'vertical' ? 'h-20' : 'h-1',
      sliderWidth: orientation === 'vertical' ? 'w-1' : 'w-20',
      iconSize: 'w-4 h-4',
      text: 'text-xs',
    },
    md: {
      sliderHeight: orientation === 'vertical' ? 'h-32' : 'h-2',
      sliderWidth: orientation === 'vertical' ? 'w-2' : 'w-32',
      iconSize: 'w-5 h-5',
      text: 'text-sm',
    },
    lg: {
      sliderHeight: orientation === 'vertical' ? 'h-40' : 'h-3',
      sliderWidth: orientation === 'vertical' ? 'w-3' : 'w-40',
      iconSize: 'w-6 h-6',
      text: 'text-base',
    },
  };

  const config = sizeConfig[size];

  // Default labels
  const getDefaultLabel = () => {
    switch (type) {
      case 'ambient':
        return 'Ambient Volume';
      case 'notification':
        return 'Notification Volume';
      default:
        return 'Master Volume';
    }
  };

  const displayLabel = label || getDefaultLabel();

  return (
    <div
      className={cn(
        'flex items-center space-x-3',
        orientation === 'vertical' && 'flex-col space-x-0 space-y-3',
        className
      )}
    >
      {/* Volume Icon / Mute Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={type === 'master' ? toggleMute : undefined}
        disabled={type !== 'master'}
        className={cn(
          'p-1',
          type === 'master' ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'cursor-default',
          isMuted && 'text-red-500'
        )}
        title={type === 'master' ? (isMuted ? 'Unmute' : 'Mute') : undefined}
      >
        <VolumeIcon className={config.iconSize} />
      </Button>

      {/* Volume Slider Container */}
      <div
        className={cn(
          'relative group cursor-pointer',
          orientation === 'vertical' ? config.sliderHeight : config.sliderWidth
        )}
        onClick={handleSliderClick}
      >
        {/* Slider Track */}
        <div
          className={cn(
            'absolute bg-gray-200 dark:bg-gray-700 rounded-full',
            orientation === 'vertical' 
              ? `w-2 h-full left-1/2 transform -translate-x-1/2`
              : `h-2 w-full top-1/2 transform -translate-y-1/2`
          )}
        />

        {/* Slider Fill */}
        <div
          className={cn(
            'absolute bg-blue-500 rounded-full transition-all duration-150',
            orientation === 'vertical'
              ? `w-2 left-1/2 transform -translate-x-1/2 bottom-0`
              : `h-2 top-1/2 transform -translate-y-1/2 left-0`
          )}
          style={{
            [orientation === 'vertical' ? 'height' : 'width']: `${effectiveVolume}%`,
          }}
        />

        {/* Slider Thumb */}
        <div
          className={cn(
            'absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm',
            'transform transition-all duration-150',
            'group-hover:scale-110',
            isDragging && 'scale-125',
            orientation === 'vertical'
              ? 'left-1/2 -translate-x-1/2'
              : 'top-1/2 -translate-y-1/2'
          )}
          style={{
            [orientation === 'vertical' ? 'bottom' : 'left']: `calc(${effectiveVolume}% - 8px)`,
          }}
        />

        {/* Hidden Range Input for Accessibility */}
        <input
          type="range"
          min="0"
          max="100"
          value={currentVolume}
          onChange={handleVolumeChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={displayLabel}
        />
      </div>

      {/* Label and Percentage */}
      {(showLabel || showPercentage) && (
        <div
          className={cn(
            'flex items-center space-x-2',
            orientation === 'vertical' && 'flex-col space-x-0 space-y-1',
            config.text
          )}
        >
          {showLabel && (
            <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {displayLabel}
            </span>
          )}
          {showPercentage && (
            <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
              {Math.round(effectiveVolume)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact volume control with just icon and slider
 */
export function CompactVolumeControl({
  type = 'master',
  className,
}: Pick<VolumeControlProps, 'type' | 'className'>) {
  return (
    <VolumeControl
      type={type}
      size="sm"
      showLabel={false}
      showPercentage={false}
      className={className}
    />
  );
}

/**
 * Volume control panel with multiple sliders
 */
export function VolumeControlPanel({ className }: { className?: string }) {
  const { state } = useAudio();

  return (
    <div className={cn('space-y-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Volume Controls
      </h3>

      <div className="space-y-4">
        <VolumeControl
          type="master"
          label="Master Volume"
          showPercentage
        />

        <VolumeControl
          type="ambient"
          label="Ambient Sounds"
          showPercentage
          className={!state.isAmbientPlaying ? 'opacity-50' : ''}
        />

        <VolumeControl
          type="notification"
          label="Notifications"
          showPercentage
        />
      </div>

      {state.isMuted && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
            <VolumeX className="w-4 h-4" />
            <span className="text-sm">Audio is currently muted</span>
          </div>
        </div>
      )}
    </div>
  );
}
