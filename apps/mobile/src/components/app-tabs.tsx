import { Tabs, TabList, TabSlot, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentRef, Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const tabs = [
  { name: 'index', href: '/', label: 'Today' },
  { name: 'notes', href: '/notes', label: 'Notes' },
  { name: 'library', href: '/library', label: 'Library' },
  { name: 'journal', href: '/journal', label: 'Journal' },
  { name: 'search', href: '/search', label: 'Search' },
] as const;

/**
 * Text-only tab bar with an accent underline on the current tab. Built on the headless
 * expo-router/ui tabs so it looks the same on iOS, Android and web.
 */
export default function AppTabs() {
  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <BottomBar>
          {tabs.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </BottomBar>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ref, ...props }: TabTriggerSlotProps) {
  const theme = useTheme();

  return (
    <Pressable
      {...props}
      // expo-router/ui types the slot ref as a View component; Pressable expects its own element ref.
      ref={ref as Ref<ComponentRef<typeof Pressable>>}
      accessibilityRole="tab"
      accessibilityState={{ selected: Boolean(isFocused) }}
      style={styles.tab}>
      <ThemedText
        type={isFocused ? 'smallBold' : 'small'}
        themeColor={isFocused ? 'text' : 'textSecondary'}
        style={styles.label}>
        {children}
      </ThemedText>
      <View style={[styles.underline, isFocused && { backgroundColor: theme.accent }]} />
    </Pressable>
  );
}

function BottomBar(props: TabListProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        styles.bar,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}>
      <View style={styles.inner}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: Spacing.one,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  label: {
    fontSize: 12,
  },
  underline: {
    width: 18,
    height: 2,
  },
});
