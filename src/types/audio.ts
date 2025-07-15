/**
 * Audio and notification related TypeScript interfaces
 */

// Ambient sound types
export type AmbientSoundType = 'rain' | 'forest' | 'ocean' | 'white-noise' | 'cafe' | 'none';

// Notification sound types
export type NotificationSoundType = 'default' | 'success' | 'none';

// Audio state interfaces
export interface AudioState {
  // Ambient sounds
  ambientSound: AmbientSoundType;
  ambientVolume: number; // 0-100
  isAmbientPlaying: boolean;
  
  // Notification sounds
  notificationSound: NotificationSoundType;
  notificationVolume: number; // 0-100
  
  // Master controls
  isMuted: boolean;
  masterVolume: number; // 0-100
}

// Audio configuration
export interface AudioConfig {
  ambientSounds: {
    [key in Exclude<AmbientSoundType, 'none'>]: {
      name: string;
      file: string;
      description: string;
      icon: string;
    };
  };
  notificationSounds: {
    [key in Exclude<NotificationSoundType, 'none'>]: {
      name: string;
      file: string;
      description: string;
    };
  };
}

// Audio service interfaces
export interface AudioService {
  // Ambient sound controls
  playAmbientSound: (sound: AmbientSoundType) => Promise<void>;
  stopAmbientSound: () => void;
  setAmbientVolume: (volume: number) => void;
  
  // Notification sounds
  playNotificationSound: (sound: NotificationSoundType) => Promise<void>;
  setNotificationVolume: (volume: number) => void;
  
  // Master controls
  setMasterVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  
  // State
  getState: () => AudioState;
  cleanup: () => void;
}

// Notification types
export type NotificationType = 
  | 'session-start'
  | 'session-complete' 
  | 'break-start'
  | 'break-complete'
  | 'pomodoro-complete'
  | 'achievement-unlocked'
  | 'reminder';

// Browser notification interface
export interface BrowserNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  silent?: boolean;
  actions?: NotificationAction[];
  data?: any;
}

// Notification action
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Notification service interface
export interface NotificationService {
  // Permission management
  requestPermission: () => Promise<NotificationPermission>;
  hasPermission: () => boolean;
  
  // Notification display
  show: (notification: BrowserNotification) => Promise<void>;
  showSimple: (title: string, body: string, type?: NotificationType) => Promise<void>;
  
  // Cleanup
  cleanup: () => void;
}

// Combined audio and notification state
export interface AudioNotificationState extends AudioState {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  notificationPermission: NotificationPermission;
}

// Hook return type
export interface UseAudioReturn {
  // State
  state: AudioNotificationState;
  
  // Ambient sound controls
  playAmbientSound: (sound: AmbientSoundType) => void;
  stopAmbientSound: () => void;
  setAmbientVolume: (volume: number) => void;
  
  // Notification controls
  setNotificationVolume: (volume: number) => void;
  
  // Master controls
  setMasterVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Settings
  updateSettings: (settings: Partial<AudioNotificationState>) => void;
  
  // Utility
  testNotificationSound: () => void;
  testAmbientSound: (sound: AmbientSoundType) => void;
}

// Hook return type for notifications
export interface UseNotificationsReturn {
  // Permission state
  permission: NotificationPermission;
  hasPermission: boolean;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  showNotification: (notification: BrowserNotification) => Promise<void>;
  showSimple: (title: string, body: string, type?: NotificationType) => Promise<void>;
  
  // Presets for common notifications
  notifySessionComplete: (sessionType: string, duration: number) => Promise<void>;
  notifyBreakStart: (breakType: string, duration: number) => Promise<void>;
  notifyPomodoroComplete: (cyclesCompleted: number) => Promise<void>;
}
