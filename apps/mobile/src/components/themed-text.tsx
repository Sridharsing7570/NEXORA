import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    /** Serif — page titles and greetings. */
    | 'display'
    /** Serif — detail-screen titles. */
    | 'title'
    /** Serif — section headings and featured items. */
    | 'heading'
    /** Serif — list item titles. */
    | 'item'
    /** Serif — long-form reading text. */
    | 'reading'
    /** Sans — interface text. */
    | 'default'
    | 'body'
    | 'small'
    | 'smallBold'
    | 'caption'
    /** Sans — small uppercase section label. */
    | 'overline'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.serif,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: 400,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 400,
    letterSpacing: -0.6,
  },
  heading: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 500,
  },
  item: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: 400,
  },
  reading: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: 400,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 400,
  },
  small: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: 400,
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: 600,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 400,
  },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 400,
    fontSize: 13,
    lineHeight: 20,
  },
});
