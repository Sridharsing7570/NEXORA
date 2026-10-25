import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Header rendered above the scroll view (for stack screens with a back button). */
  header?: ReactNode;
  /** Floating action, rendered above the content. */
  fab?: ReactNode;
  /** Whether the screen sits above the tab bar, which already handles the bottom safe area. */
  inTabs?: boolean;
};

export function Screen({ children, header, fab, inTabs = true }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {header ? <View style={{ paddingTop: insets.top }}>{header}</View> : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: header ? Spacing.two : insets.top + Spacing.four,
            // Leave room for the floating action so the last item stays reachable.
            paddingBottom: (inTabs ? 0 : insets.bottom) + (fab ? 96 : Spacing.five),
          },
        ]}>
        {children}
      </ScrollView>
      {fab}
    </View>
  );
}

/** Floating pill action ("Write", "New page"…), bottom right. */
export function FloatingAction({
  label,
  icon = 'plus',
  onPress,
  inTabs = true,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  inTabs?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.buttonBackground,
          bottom: (inTabs ? 0 : insets.bottom) + Spacing.four,
        },
        pressed && { opacity: 0.8 },
      ]}>
      <Icon name={icon} size={17} color={theme.buttonText} />
      <ThemedText type="body" style={{ color: theme.buttonText, fontWeight: 600 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.gutter,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    right: Spacing.gutter,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
});
