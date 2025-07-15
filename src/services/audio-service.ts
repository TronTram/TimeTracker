/**
 * Audio playback service for ambient sounds and notifications
 */

import { 
  AudioService, 
  AudioState, 
  AmbientSoundType, 
  NotificationSoundType,
  AudioConfig 
} from '@/types/audio';
import { AUDIO_FILES, STORAGE_KEYS } from '@/lib/constants';

class AudioServiceImpl implements AudioService {
  private ambientAudio: HTMLAudioElement | null = null;
  private notificationAudio: HTMLAudioElement | null = null;
  private state: AudioState;
  private config: AudioConfig;
  
  constructor() {
    this.state = this.getInitialState();
    this.config = this.getAudioConfig();
    this.loadStoredState();
  }

  /**
   * Play ambient sound
   */
  async playAmbientSound(sound: AmbientSoundType): Promise<void> {
    try {
      // Stop current ambient sound
      this.stopAmbientSound();
      
      if (sound === 'none') {
        this.state.ambientSound = 'none';
        this.state.isAmbientPlaying = false;
        this.saveState();
        return;
      }

      const soundFile = this.config.ambientSounds[sound as Exclude<AmbientSoundType, 'none'>]?.file;
      if (!soundFile) {
        console.error(`Audio file not found for sound: ${sound}`);
        return;
      }

      this.ambientAudio = new Audio(soundFile);
      this.ambientAudio.loop = true;
      this.ambientAudio.volume = (this.state.ambientVolume / 100) * (this.state.masterVolume / 100);
      
      if (this.state.isMuted) {
        this.ambientAudio.muted = true;
      }

      await this.ambientAudio.play();
      
      this.state.ambientSound = sound;
      this.state.isAmbientPlaying = true;
      this.saveState();

      // Handle audio end/error events
      this.ambientAudio.onended = () => {
        this.state.isAmbientPlaying = false;
        this.saveState();
      };

      this.ambientAudio.onerror = (error) => {
        console.error('Ambient audio error:', error);
        this.state.isAmbientPlaying = false;
        this.saveState();
      };

    } catch (error) {
      console.error('Error playing ambient sound:', error);
      this.state.isAmbientPlaying = false;
      this.saveState();
    }
  }

  /**
   * Stop ambient sound
   */
  stopAmbientSound(): void {
    if (this.ambientAudio) {
      this.ambientAudio.pause();
      this.ambientAudio.currentTime = 0;
      this.ambientAudio = null;
    }
    
    this.state.isAmbientPlaying = false;
    this.saveState();
  }

  /**
   * Set ambient sound volume
   */
  setAmbientVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    this.state.ambientVolume = clampedVolume;
    
    if (this.ambientAudio) {
      this.ambientAudio.volume = (clampedVolume / 100) * (this.state.masterVolume / 100);
    }
    
    this.saveState();
  }

  /**
   * Play notification sound
   */
  async playNotificationSound(sound: NotificationSoundType): Promise<void> {
    try {
      if (sound === 'none' || this.state.isMuted) {
        return;
      }

      const soundFile = this.config.notificationSounds[sound as Exclude<NotificationSoundType, 'none'>]?.file;
      if (!soundFile) {
        console.error(`Notification sound file not found: ${sound}`);
        return;
      }

      // Stop any existing notification sound
      if (this.notificationAudio) {
        this.notificationAudio.pause();
        this.notificationAudio.currentTime = 0;
      }

      this.notificationAudio = new Audio(soundFile);
      this.notificationAudio.volume = (this.state.notificationVolume / 100) * (this.state.masterVolume / 100);
      
      await this.notificationAudio.play();

      // Clean up after playing
      this.notificationAudio.onended = () => {
        this.notificationAudio = null;
      };

    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Set notification volume
   */
  setNotificationVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    this.state.notificationVolume = clampedVolume;
    
    if (this.notificationAudio) {
      this.notificationAudio.volume = (clampedVolume / 100) * (this.state.masterVolume / 100);
    }
    
    this.saveState();
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    this.state.masterVolume = clampedVolume;
    
    // Update all active audio elements
    if (this.ambientAudio) {
      this.ambientAudio.volume = (this.state.ambientVolume / 100) * (clampedVolume / 100);
    }
    
    if (this.notificationAudio) {
      this.notificationAudio.volume = (this.state.notificationVolume / 100) * (clampedVolume / 100);
    }
    
    this.saveState();
  }

  /**
   * Mute all audio
   */
  mute(): void {
    this.state.isMuted = true;
    
    if (this.ambientAudio) {
      this.ambientAudio.muted = true;
    }
    
    if (this.notificationAudio) {
      this.notificationAudio.muted = true;
    }
    
    this.saveState();
  }

  /**
   * Unmute all audio
   */
  unmute(): void {
    this.state.isMuted = false;
    
    if (this.ambientAudio) {
      this.ambientAudio.muted = false;
    }
    
    if (this.notificationAudio) {
      this.notificationAudio.muted = false;
    }
    
    this.saveState();
  }

  /**
   * Get current audio state
   */
  getState(): AudioState {
    return { ...this.state };
  }

  /**
   * Clean up audio resources
   */
  cleanup(): void {
    this.stopAmbientSound();
    
    if (this.notificationAudio) {
      this.notificationAudio.pause();
      this.notificationAudio = null;
    }
  }

  /**
   * Get initial audio state
   */
  private getInitialState(): AudioState {
    return {
      ambientSound: 'none',
      ambientVolume: 50,
      isAmbientPlaying: false,
      notificationSound: 'default',
      notificationVolume: 70,
      isMuted: false,
      masterVolume: 80,
    };
  }

  /**
   * Get audio configuration
   */
  private getAudioConfig(): AudioConfig {
    return {
      ambientSounds: {
        rain: {
          name: 'Rain',
          file: AUDIO_FILES.AMBIENT.RAIN,
          description: 'Gentle rainfall sounds',
          icon: '🌧️',
        },
        forest: {
          name: 'Forest',
          file: AUDIO_FILES.AMBIENT.FOREST,
          description: 'Peaceful forest ambiance',
          icon: '🌲',
        },
        ocean: {
          name: 'Ocean Waves',
          file: AUDIO_FILES.AMBIENT.OCEAN,
          description: 'Relaxing ocean waves',
          icon: '🌊',
        },
        'white-noise': {
          name: 'White Noise',
          file: AUDIO_FILES.AMBIENT.WHITE_NOISE,
          description: 'Steady white noise',
          icon: '📻',
        },
        cafe: {
          name: 'Coffee Shop',
          file: AUDIO_FILES.AMBIENT.CAFE,
          description: 'Cozy cafe atmosphere',
          icon: '☕',
        },
      },
      notificationSounds: {
        default: {
          name: 'Default',
          file: AUDIO_FILES.NOTIFICATION,
          description: 'Standard notification sound',
        },
        success: {
          name: 'Success',
          file: AUDIO_FILES.SUCCESS,
          description: 'Success chime',
        },
      },
    };
  }

  /**
   * Load stored state from localStorage
   */
  private loadStoredState(): void {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_SETTINGS);
      if (stored) {
        const parsedState = JSON.parse(stored);
        this.state = { ...this.state, ...parsedState };
      }
    } catch (error) {
      console.error('Error loading audio state:', error);
    }
  }

  /**
   * Save current state to localStorage
   */
  private saveState(): void {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIO_SETTINGS, JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving audio state:', error);
    }
  }
}

// Create singleton instance
export const audioService = new AudioServiceImpl();

// Audio utility functions
export const audioUtils = {
  /**
   * Test if browser supports audio
   */
  isAudioSupported(): boolean {
    return typeof Audio !== 'undefined';
  },

  /**
   * Get user-friendly volume description
   */
  getVolumeDescription(volume: number): string {
    if (volume === 0) return 'Muted';
    if (volume <= 25) return 'Low';
    if (volume <= 50) return 'Medium';
    if (volume <= 75) return 'High';
    return 'Maximum';
  },

  /**
   * Preload audio files for better performance
   */
  async preloadAudioFiles(files: string[]): Promise<void> {
    const promises = files.map(file => {
      return new Promise<void>((resolve, reject) => {
        const audio = new Audio(file);
        audio.addEventListener('canplaythrough', () => resolve());
        audio.addEventListener('error', reject);
        audio.load();
      });
    });

    try {
      await Promise.all(promises);
      console.log('Audio files preloaded successfully');
    } catch (error) {
      console.warn('Some audio files failed to preload:', error);
    }
  },
};

export default audioService;
