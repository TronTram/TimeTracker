/**
 * Ambient sound selector and controls
 */

'use client';

import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { AmbientSoundType } from '@/types/audio';
import { useAudio } from '@/hooks/use-audio';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AmbientSoundsProps {
  className?: string;
  compact?: boolean;
}

const AMBIENT_SOUNDS: Array<{
  type: AmbientSoundType;
  name: string;
  description: string;
  icon: string;
  gradient: string;
}> = [
  {
    type: 'none',
    name: 'No Sound',
    description: 'Silence for pure focus',
    icon: '🔇',
    gradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
  },
  {
    type: 'rain',
    name: 'Rain',
    description: 'Gentle rainfall sounds',
    icon: '🌧️',
    gradient: 'from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800',
  },
  {
    type: 'forest',
    name: 'Forest',
    description: 'Peaceful forest ambiance',
    icon: '🌲',
    gradient: 'from-green-100 to-green-200 dark:from-green-900 dark:to-green-800',
  },
  {
    type: 'ocean',
    name: 'Ocean',
    description: 'Relaxing ocean waves',
    icon: '🌊',
    gradient: 'from-cyan-100 to-cyan-200 dark:from-cyan-900 dark:to-cyan-800',
  },
  {
    type: 'white-noise',
    name: 'White Noise',
    description: 'Steady white noise',
    icon: '📻',
    gradient: 'from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800',
  },
  {
    type: 'cafe',
    name: 'Coffee Shop',
    description: 'Cozy cafe atmosphere',
    icon: '☕',
    gradient: 'from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800',
  },
];

export function AmbientSounds({ className, compact = false }: AmbientSoundsProps) {
  const { state, playAmbientSound, stopAmbientSound, testAmbientSound } = useAudio();
  const [testingSound, setTestingSound] = useState<AmbientSoundType | null>(null);

  const handleSoundSelect = async (soundType: AmbientSoundType) => {
    if (soundType === 'none' || soundType === state.ambientSound) {
      stopAmbientSound();
    } else {
      await playAmbientSound(soundType);
    }
  };

  const handleTestSound = async (soundType: AmbientSoundType) => {
    if (soundType === 'none') return;
    
    setTestingSound(soundType);
    await testAmbientSound(soundType);
    
    // Reset testing state after 3 seconds
    setTimeout(() => {
      setTestingSound(null);
    }, 3000);
  };

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {AMBIENT_SOUNDS.map((sound) => (
          <Button
            key={sound.type}
            variant={state.ambientSound === sound.type ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSoundSelect(sound.type)}
            className={cn(
              'flex items-center space-x-1 transition-all duration-200',
              state.ambientSound === sound.type && 'ring-2 ring-blue-500'
            )}
            title={sound.description}
          >
            <span className="text-sm">{sound.icon}</span>
            <span className="hidden sm:inline">{sound.name}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Ambient Sounds
        </h3>
        {state.isAmbientPlaying && (
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <Volume2 className="w-4 h-4" />
            <span>Playing</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {AMBIENT_SOUNDS.map((sound) => {
          const isSelected = state.ambientSound === sound.type;
          const isPlaying = isSelected && state.isAmbientPlaying;
          const isTesting = testingSound === sound.type;

          return (
            <Card
              key={sound.type}
              className={cn(
                'relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected && 'ring-2 ring-blue-500 shadow-lg',
                'group'
              )}
              onClick={() => handleSoundSelect(sound.type)}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-20', sound.gradient)} />
              
              <div className="relative p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{sound.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {sound.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sound.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {/* Play/Pause indicator */}
                    <div className="flex items-center justify-center w-8 h-8">
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : isTesting ? (
                        <div className="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                      ) : isSelected ? (
                        <VolumeX className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Play className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      )}
                    </div>

                    {/* Test button */}
                    {sound.type !== 'none' && !isSelected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestSound(sound.type);
                        }}
                        disabled={isTesting}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1"
                      >
                        Test
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isPlaying ? 'Now Playing' : 'Selected'}
                      </span>
                      {isPlaying && (
                        <div className="flex space-x-1">
                          <div className="w-1 h-3 bg-blue-500 rounded animate-pulse" />
                          <div className="w-1 h-3 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-1 h-3 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Audio disabled notice */}
      {!state.soundEnabled && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
            <VolumeX className="w-4 h-4" />
            <span className="text-sm">
              Sound is disabled in your preferences. Enable sound to use ambient sounds.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
