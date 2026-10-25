import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Header for screens pushed on top of the tabs: a back button plus optional actions on the right. */
export function StackHeader({ backLabel, actions }: { backLabel: string; actions?: ReactNode }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        accessibilityRole="button"
        accessibilityLabel={`Back to ${backLabel}`}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}>
        <Icon name="back" size={22} color={theme.text} />
        <ThemedText type="body" style={{ fontWeight: 500 }}>
          {backLabel}
        </ThemedText>
      </Pressable>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three - Spacing.one,
    paddingVertical: Spacing.one,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: TouchTarget,
    paddingRight: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
