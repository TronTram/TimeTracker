/**
 * Utilities for audio file loading and management
 */

import { audioService } from '@/services/audio-service';
import { AmbientSoundType, NotificationSoundType } from '@/types/audio';
import { AUDIO_FILES } from '@/lib/constants';

/**
 * Audio file management utilities
 */
export const audioFileUtils = {
  /**
   * Check if an audio file exists and is accessible
   */
  async checkAudioFile(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get all available audio files
   */
  getAllAudioFiles(): string[] {
    return [
      AUDIO_FILES.NOTIFICATION,
      AUDIO_FILES.SUCCESS,
      ...Object.values(AUDIO_FILES.AMBIENT),
    ];
  },

  /**
   * Preload critical audio files
   */
  async preloadCriticalAudio(): Promise<void> {
    const criticalFiles = [
      AUDIO_FILES.NOTIFICATION,
      AUDIO_FILES.SUCCESS,
    ];

    const promises = criticalFiles.map(file => 
      new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.addEventListener('canplaythrough', () => resolve());
        audio.addEventListener('error', () => resolve()); // Resolve even on error
        audio.preload = 'auto';
        audio.src = file;
      })
    );

    await Promise.all(promises);
  },

  /**
   * Create audio element with error handling
   */
  createAudioElement(src: string, options: {
    volume?: number;
    loop?: boolean;
    autoplay?: boolean;
  } = {}): HTMLAudioElement {
    const audio = new Audio(src);
    
    if (options.volume !== undefined) {
      audio.volume = Math.max(0, Math.min(1, options.volume));
    }
    
    if (options.loop) {
      audio.loop = true;
    }
    
    if (options.autoplay) {
      audio.autoplay = true;
    }

    // Add error handling
    audio.addEventListener('error', (e) => {
      console.error(`Audio error for ${src}:`, e);
    });

    return audio;
  },
};

/**
 * Audio format and codec utilities
 */
export const audioFormatUtils = {
  /**
   * Check browser audio format support
   */
  getSupportedFormats(): string[] {
    if (typeof document === 'undefined') {
      return ['mp3']; // Default fallback for SSR
    }
    
    const audio = document.createElement('audio');
    const formats: { [key: string]: string } = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      aac: 'audio/aac',
      flac: 'audio/flac',
    };

    return Object.keys(formats).filter(format => {
      const mimeType = formats[format];
      return mimeType && audio.canPlayType(mimeType) !== '';
    });
  },

  /**
   * Get best audio format for current browser
   */
  getBestFormat(): string {
    const supported = this.getSupportedFormats();
    
    // Prefer MP3 for broad compatibility
    if (supported.includes('mp3')) return 'mp3';
    if (supported.includes('wav')) return 'wav';
    if (supported.includes('ogg')) return 'ogg';
    
    return supported[0] || 'mp3'; // Fallback
  },

  /**
   * Check if audio is supported in current browser
   */
  isAudioSupported(): boolean {
    return typeof Audio !== 'undefined' && this.getSupportedFormats().length > 0;
  },
};

/**
 * Audio context utilities for advanced audio features
 */
export const audioContextUtils = {
  /**
   * Create audio context with fallbacks
   */
  createAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      return new AudioContext();
    } catch {
      return null;
    }
  },

  /**
   * Create audio analyser for visualizations
   */
  createAnalyser(audioContext: AudioContext): AnalyserNode {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    return analyser;
  },

  /**
   * Create gain node for volume control
   */
  createGainNode(audioContext: AudioContext, initialGain: number = 1): GainNode {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, initialGain));
    return gainNode;
  },
};

/**
 * Audio timing and synchronization utilities
 */
export const audioTimingUtils = {
  /**
   * Calculate audio duration without loading the full file
   */
  async getAudioDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      
      audio.addEventListener('error', reject);
      
      // Trigger metadata loading
      audio.preload = 'metadata';
      audio.load();
    });
  },

  /**
   * Create fade in/out effects
   */
  fadeVolume(
    audio: HTMLAudioElement, 
    fromVolume: number, 
    toVolume: number, 
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = (toVolume - fromVolume) / steps;
      
      let currentStep = 0;
      audio.volume = fromVolume;
      
      const interval = setInterval(() => {
        currentStep++;
        audio.volume = fromVolume + (volumeStep * currentStep);
        
        if (currentStep >= steps) {
          clearInterval(interval);
          audio.volume = toVolume;
          resolve();
        }
      }, stepDuration);
    });
  },

  /**
   * Smooth audio transitions
   */
  async crossfade(
    fromAudio: HTMLAudioElement,
    toAudio: HTMLAudioElement,
    duration: number = 1000
  ): Promise<void> {
    const fadePromises = [
      this.fadeVolume(fromAudio, fromAudio.volume, 0, duration),
      this.fadeVolume(toAudio, 0, toAudio.volume, duration),
    ];

    await Promise.all(fadePromises);
    fromAudio.pause();
  },
};

/**
 * Audio accessibility utilities
 */
export const audioAccessibilityUtils = {
  /**
   * Check if user prefers reduced motion (affects audio visualizations)
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') {
      return false; // Default to false for SSR
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Create audio description for screen readers
   */
  getAudioDescription(soundType: AmbientSoundType | NotificationSoundType): string {
    const descriptions: Record<string, string> = {
      // Ambient sounds
      rain: 'Gentle rainfall ambient sound',
      forest: 'Forest birds and nature ambient sound',
      ocean: 'Ocean waves ambient sound',
      'white-noise': 'White noise ambient sound',
      cafe: 'Coffee shop ambient sound',
      // Notification sounds
      default: 'Default notification sound',
      success: 'Success notification chime',
      none: 'No sound',
    };

    return descriptions[soundType] || 'Audio sound';
  },

  /**
   * Announce audio state changes to screen readers
   */
  announceAudioChange(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
};

/**
 * Audio performance optimization utilities
 */
export const audioPerformanceUtils = {
  /**
   * Lazy load audio files
   */
  async lazyLoadAudio(urls: string[]): Promise<HTMLAudioElement[]> {
    const loadPromises = urls.map(url => 
      new Promise<HTMLAudioElement>((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener('canplaythrough', () => resolve(audio));
        audio.addEventListener('error', reject);
        audio.preload = 'none'; // Don't preload until needed
        audio.src = url;
      })
    );

    return Promise.all(loadPromises);
  },

  /**
   * Clean up unused audio elements
   */
  cleanupAudioElements(audioElements: HTMLAudioElement[]): void {
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load(); // Reset the element
    });
  },

  /**
   * Monitor audio memory usage
   */
  getAudioMemoryUsage(): { used: number; total: number } | null {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return null;
    }
    
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
      };
    }
    return null;
  },
};

/**
 * Test audio functionality
 */
export const audioTestUtils = {
  /**
   * Test if audio can be played (user gesture required)
   */
  async testAudioPlayback(): Promise<boolean> {
    try {
      const audio = new Audio();
      audio.volume = 0.01; // Very quiet test
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjeI0u/JeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBj';
      
      await audio.play();
      audio.pause();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Generate a test tone for audio verification
   */
  generateTestTone(frequency: number = 440, duration: number = 100): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const audioContext = audioContextUtils.createAudioContext();
        if (!audioContext) {
          resolve(false);
          return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);

        oscillator.onended = () => {
          audioContext.close();
          resolve(true);
        };
      } catch {
        resolve(false);
      }
    });
  },
};
