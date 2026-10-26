import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import type { ZodType } from 'zod';

import { ThemedText } from '@/components/themed-text';
import { TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Underlined text field with an uppercase label, as used on the auth screens. */
export function AuthField({ label, ...inputProps }: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="overline" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderBottomColor: theme.rule }]}
        {...inputProps}
      />
    </View>
  );
}

export function FormError({ message }: { message: string | null }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <ThemedText type="small" accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.danger }}>
      {message}
    </ThemedText>
  );
}

export function FormNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <ThemedText type="small" themeColor="textBody" accessibilityLiveRegion="polite">
      {message}
    </ThemedText>
  );
}

/**
 * Validates `input` with a shared API schema. Returns the parsed value, or the first
 * human-readable problem so the form can show the same message the server would.
 */
export function validate<T>(schema: ZodType<T>, input: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(input);
  return result.success
    ? { data: result.data, error: null }
    : { data: null, error: result.error.issues[0]?.message ?? 'Please check the form.' };
}

const styles = StyleSheet.create({
  field: {
    gap: 4,
  },
  input: {
    height: TouchTarget,
    paddingHorizontal: 0,
    fontSize: 17,
    borderBottomWidth: 1,
  },
});
