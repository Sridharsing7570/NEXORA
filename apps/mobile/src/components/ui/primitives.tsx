import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Hairline between list items; `strong` is the ink rule used under section labels. */
export function Rule({ strong = false, style }: { strong?: boolean; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[
        { height: strong ? 1 : StyleSheet.hairlineWidth * 2, backgroundColor: strong ? theme.rule : theme.border },
        style,
      ]}
    />
  );
}

/** Small uppercase label that opens a section, optionally with an ink rule beneath it. */
export function SectionLabel({ children, ruled = false }: { children: ReactNode; ruled?: boolean }) {
  return (
    <View style={styles.sectionLabel}>
      <ThemedText type="overline" themeColor="textSecondary" accessibilityRole="header">
        {children}
      </ThemedText>
      {ruled ? <Rule strong style={{ marginTop: 6 }} /> : null}
    </View>
  );
}

/** A pressable row in a ruled list. */
export function ListRow({
  children,
  onPress,
  last = false,
  label,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  last?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: theme.border },
        pressed && { opacity: 0.6 },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

/** Underlined text tabs, used for filters and section switches. */
export function TextTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={[styles.tabs, { borderBottomColor: theme.border }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.tab, selected && { borderBottomColor: theme.accent }]}>
            <ThemedText
              type={selected ? 'smallBold' : 'small'}
              themeColor={selected ? 'text' : 'textSecondary'}
              style={{ fontSize: 14 }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Rounded pill button. `filled` is the primary ink button; otherwise outlined.
 * `loading` shows a spinner and blocks taps, so a request cannot be sent twice.
 */
export function PillButton({
  label,
  onPress,
  filled = true,
  leading,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  leading?: ReactNode;
  loading?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading }}
      style={({ pressed }) => [
        styles.pill,
        filled
          ? { backgroundColor: theme.buttonBackground }
          : { borderWidth: 1, borderColor: theme.rule },
        (pressed || loading) && { opacity: 0.75 },
      ]}>
      {loading ? <ActivityIndicator color={filled ? theme.buttonText : theme.text} /> : leading}
      <ThemedText
        type="body"
        style={{ fontWeight: 600, color: filled ? theme.buttonText : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Thin progress line; ink fill on a hairline track. */
export function ProgressLine({ value }: { value: number }) {
  const theme = useTheme();
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.progressTrack, { backgroundColor: theme.border }]}>
      <View style={{ width: `${percent}%`, height: 2, backgroundColor: theme.rule }} />
    </View>
  );
}

/** Large serif percentage, e.g. reading progress. */
export function BigPercent({ value, size = 34 }: { value: number; size?: number }) {
  const theme = useTheme();
  return (
    <ThemedText
      type="title"
      style={{ fontSize: size, lineHeight: size, color: theme.accent }}
      accessibilityLabel={`${Math.round(value * 100)} percent`}>
      {Math.round(value * 100)}
      <ThemedText type="title" style={{ fontSize: size * 0.47, lineHeight: size, color: theme.accent }}>
        %
      </ThemedText>
    </ThemedText>
  );
}

/** Flat book spine/cover swatch with a printed-page offset shadow. */
export function BookSpine({ color, width = 52 }: { color: string; width?: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width,
        height: width * 1.46,
        backgroundColor: color,
        shadowColor: theme.border,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 1,
      }}
    />
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={20} color={color ?? theme.text} />
    </Pressable>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.empty}>
      <ThemedText type="heading" style={{ fontStyle: 'italic' }}>
        {title}
      </ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    paddingBottom: Spacing.one,
  },
  row: {
    paddingVertical: 14,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 22,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  tab: {
    minHeight: TouchTarget,
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  pill: {
    height: 50,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: 20,
  },
  progressTrack: {
    height: 2,
  },
  iconButton: {
    width: TouchTarget,
    height: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
});
