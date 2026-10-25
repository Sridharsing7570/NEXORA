/**
 * Nexora design tokens — "editorial & calm": paper ground, ink text, one accent,
 * thin rules instead of cards, serif for reading and sans-serif for interface text.
 * Keep component colors coming from here so light and dark mode stay in sync.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#191817',
    /** Long-form secondary copy (summaries, notes). */
    textBody: '#4A4741',
    textSecondary: '#6E6A63',
    background: '#FBFAF7',
    /** Sheets and inputs that sit above the page. */
    backgroundElement: '#FFFFFF',
    /** Pressed rows, code blocks. */
    backgroundSelected: '#F1EEE8',
    /** Hairline between items. */
    border: '#E4E0D8',
    /** Strong rule under section labels and inputs. */
    rule: '#191817',
    leader: '#CFC9BE',
    accent: '#8C2F1B',
    highlight: '#F3E3B5',
    /** Filled pill buttons use ink on paper. */
    buttonBackground: '#191817',
    buttonText: '#FBFAF7',
    danger: '#B42318',
  },
  dark: {
    text: '#EDEBE6',
    textBody: '#CFCBC3',
    textSecondary: '#A39F97',
    background: '#141311',
    backgroundElement: '#1C1B18',
    backgroundSelected: '#24221F',
    border: '#2C2A27',
    rule: '#EDEBE6',
    leader: '#45413C',
    accent: '#E08E73',
    highlight: '#4A3F22',
    buttonBackground: '#EDEBE6',
    buttonText: '#141311',
    danger: '#F97066',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` (New York) */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  /** Horizontal screen gutter. */
  gutter: 24,
} as const;

export const Radius = {
  small: 4,
  medium: 8,
  pill: 999,
} as const;

/** Minimum touch target, per platform accessibility guidelines. */
export const TouchTarget = 44;

export const MaxContentWidth = 640;
