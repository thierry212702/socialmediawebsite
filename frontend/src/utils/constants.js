// File: src/utils/constants.js
// Updated color scheme based on color psychology principles
export const COLORS = {
  // Primary brand color - Blue for trust and reliability
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Secondary color - Purple for creativity and innovation
  secondary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  
  // Accent color - Coral/Orange for engagement and energy
  accent: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  
  // Success color - Green for positive actions
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  // Warning color - Amber/Yellow for attention
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Danger color - Red for critical actions
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Neutral colors - More vibrant than plain gray
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  }
};

export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  secondary: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
  success: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
  premium: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
  creative: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
  sunset: 'linear-gradient(135deg, #F97316 0%, #8B5CF6 100%)',
  ocean: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
};

export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glow: '0 0 20px rgba(59, 130, 246, 0.5)',
  'glow-success': '0 0 20px rgba(34, 197, 94, 0.5)',
  'glow-danger': '0 0 20px rgba(239, 68, 68, 0.5)',
};

export const ANIMATIONS = {
  durations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easings: {
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// App constants
export const APP = {
  name: 'SocialSphere',
  slogan: 'Connect. Share. Inspire.',
  maxPhotosPerPost: 5,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  supportedVideoTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
  maxBioLength: 150,
  maxCaptionLength: 2200,
};

// Notification types
export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  MENTION: 'mention',
  REPOST: 'repost',
  MESSAGE: 'message',
  CALL: 'call',
  SYSTEM: 'system',
};

// Message status
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

// Call types
export const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video',
};

// User roles
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

// Privacy settings
export const PRIVACY_SETTINGS = {
  PUBLIC: 'public',
  FOLLOWERS: 'followers',
  PRIVATE: 'private',
  CLOSE_FRIENDS: 'close_friends',
};

// Post types
export const POST_TYPES = {
  POST: 'post',
  REEL: 'reel',
  STORY: 'story',
};

// Theme modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const BACKGROUND_THEMES = [
  {
    id: 'default',
    name: 'Default',
    gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    color: '#EFF6FF',
    type: 'gradient',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(135deg, #F97316 0%, #8B5CF6 100%)',
    color: '#F97316',
    type: 'gradient',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    color: '#06B6D4',
    type: 'gradient',
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: '#22C55E',
    type: 'gradient',
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
    color: '#EC4899',
    type: 'gradient',
  },
  {
    id: 'warm-light',
    name: 'Warm Light',
    gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    color: '#FEF3C7',
    type: 'gradient',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    gradient: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
    color: '#1E40AF',
    type: 'gradient',
  },
];