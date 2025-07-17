/**
 * Hook for audio state and playback control
 */

import { useState, useEffect, useCallback } from 'react';
import { UseAudioReturn, AudioNotificationState, AmbientSoundType, NotificationSoundType } from '@/types/audio';
import { audioService } from '@/services/audio-service';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { audioFileUtils } from '@/lib/audio-utils';

export function useAudio(): UseAudioReturn {
  const { preferences, updatePreference } = useUserPreferences();
  const [audioState, setAudioState] = useState(audioService.getState());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio state and sync with preferences
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Preload critical audio files
        await audioFileUtils.preloadCriticalAudio();
        
        // Sync audio state with user preferences
        const currentState = audioService.getState();
        setAudioState(currentState);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing audio:', error);
        setIsInitialized(true); // Continue even if preload fails
      }
    };

    initializeAudio();
  }, []);

  // Update audio state when it changes
  const refreshAudioState = useCallback(() => {
    const newState = audioService.getState();
    setAudioState(newState);
  }, []);

  /**
   * Play ambient sound
   */
  const playAmbientSound = useCallback(async (sound: AmbientSoundType) => {
    if (!preferences.soundEnabled) {
      console.log('Sound is disabled in preferences');
      return;
    }

    try {
      await audioService.playAmbientSound(sound);
      refreshAudioState();
    } catch (error) {
      console.error('Error playing ambient sound:', error);
    }
  }, [preferences.soundEnabled, refreshAudioState]);

  /**
   * Stop ambient sound
   */
  const stopAmbientSound = useCallback(() => {
    audioService.stopAmbientSound();
    refreshAudioState();
  }, [refreshAudioState]);

  /**
   * Set ambient volume
   */
  const setAmbientVolume = useCallback((volume: number) => {
    audioService.setAmbientVolume(volume);
    refreshAudioState();
  }, [refreshAudioState]);

  /**
   * Set notification volume
   */
  const setNotificationVolume = useCallback((volume: number) => {
    audioService.setNotificationVolume(volume);
    refreshAudioState();
  }, [refreshAudioState]);

  /**
   * Set master volume
   */
  const setMasterVolume = useCallback((volume: number) => {
    audioService.setMasterVolume(volume);
    refreshAudioState();
  }, [refreshAudioState]);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    if (audioState.isMuted) {
      audioService.unmute();
    } else {
      audioService.mute();
    }
    refreshAudioState();
  }, [audioState.isMuted, refreshAudioState]);

  /**
   * Update audio settings
   */
  const updateSettings = useCallback((settings: Partial<AudioNotificationState>) => {
    if (settings.ambientVolume !== undefined) {
      setAmbientVolume(settings.ambientVolume);
    }
    if (settings.notificationVolume !== undefined) {
      setNotificationVolume(settings.notificationVolume);
    }
    if (settings.masterVolume !== undefined) {
      setMasterVolume(settings.masterVolume);
    }
    if (settings.isMuted !== undefined) {
      if (settings.isMuted !== audioState.isMuted) {
        toggleMute();
      }
    }
    if (settings.ambientSound !== undefined) {
      playAmbientSound(settings.ambientSound);
    }
  }, [audioState.isMuted, setAmbientVolume, setNotificationVolume, setMasterVolume, toggleMute, playAmbientSound]);

  /**
   * Test notification sound
   */
  const testNotificationSound = useCallback(async () => {
    if (!preferences.soundEnabled) {
      console.log('Sound is disabled in preferences');
      return;
    }

    try {
      await audioService.playNotificationSound(audioState.notificationSound);
    } catch (error) {
      console.error('Error testing notification sound:', error);
    }
  }, [preferences.soundEnabled, audioState.notificationSound]);

  /**
   * Test ambient sound (play for 3 seconds)
   */
  const testAmbientSound = useCallback(async (sound: AmbientSoundType) => {
    if (!preferences.soundEnabled || sound === 'none') {
      return;
    }

    try {
      await audioService.playAmbientSound(sound);
      refreshAudioState();
      
      // Stop after 3 seconds
      setTimeout(() => {
        audioService.stopAmbientSound();
        refreshAudioState();
      }, 3000);
    } catch (error) {
      console.error('Error testing ambient sound:', error);
    }
  }, [preferences.soundEnabled, refreshAudioState]);

  // Create combined state
  const state: AudioNotificationState = {
    ...audioState,
    notificationsEnabled: preferences.notificationsEnabled ?? false,
    soundEnabled: preferences.soundEnabled ?? false,
    notificationPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied',
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioService.cleanup();
    };
  }, []);

  return {
    state,
    playAmbientSound,
    stopAmbientSound,
    setAmbientVolume,
    setNotificationVolume,
    setMasterVolume,
    toggleMute,
    updateSettings,
    testNotificationSound,
    testAmbientSound,
  };
}

/**
 * Hook for simplified audio controls
 */
export function useSimpleAudio() {
  const { state, playAmbientSound, stopAmbientSound, toggleMute } = useAudio();
  
  return {
    isPlaying: state.isAmbientPlaying,
    currentSound: state.ambientSound,
    isMuted: state.isMuted,
    volume: state.masterVolume,
    playSound: playAmbientSound,
    stopSound: stopAmbientSound,
    toggleMute,
  };
}

/**
 * Hook for audio settings management
 */
export function useAudioSettings() {
  const { preferences, updatePreference } = useUserPreferences();
  const { state, updateSettings } = useAudio();

  const toggleSound = useCallback(() => {
    updatePreference('soundEnabled', !preferences.soundEnabled);
  }, [preferences.soundEnabled, updatePreference]);

  const isAudioSupported = typeof Audio !== 'undefined';

  return {
    isEnabled: preferences.soundEnabled,
    isSupported: isAudioSupported,
    audioState: state,
    toggleSound,
    updateSettings,
  };
}
