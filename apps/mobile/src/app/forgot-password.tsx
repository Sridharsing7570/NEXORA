import { forgotPasswordSchema, resetPasswordSchema } from '@repo/api/auth/auth.schemas';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthField, FormError, FormNotice, validate } from '@/components/auth-form';
import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { PillButton } from '@/components/ui/primitives';
import { Spacing, TouchTarget } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { useTheme } from '@/hooks/use-theme';

/** Two steps: request a code by email, then set a new password with it. */
export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (task: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await task();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const requestCode = () => {
    const parsed = validate(forgotPasswordSchema, { email });
    if (parsed.error !== null) return setError(parsed.error);
    void run(async () => {
      await authApi.forgotPassword(parsed.data);
      setEmail(parsed.data.email);
      setCodeSent(true);
    });
  };

  const resetPassword = () => {
    const parsed = validate(resetPasswordSchema, { email, code, newPassword });
    if (parsed.error !== null) return setError(parsed.error);
    void run(async () => {
      await authApi.resetPassword(parsed.data);
      Alert.alert('Password updated', 'Sign in with your new password.');
      router.back();
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <StackHeader backLabel="Sign in" />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <View style={styles.intro}>
          <ThemedText type="title" accessibilityRole="header">
            {codeSent ? 'Check your email' : 'Reset your password'}
          </ThemedText>
          <ThemedText type="reading" themeColor="textBody">
            {codeSent
              ? 'If an account exists for this email, we sent it a 6-digit code. Enter it with your new password.'
              : 'Enter the email you signed up with and we’ll send you a code.'}
          </ThemedText>
        </View>

        {codeSent ? (
          <>
            <FormNotice message={email} />
            <AuthField
              label="Code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
            <AuthField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              onSubmitEditing={resetPassword}
            />
            <FormError message={error} />
            <PillButton label="Set new password" onPress={resetPassword} loading={busy} />
            <Pressable onPress={requestCode} disabled={busy} accessibilityRole="button" style={styles.textButton}>
              <ThemedText type="body" style={{ color: theme.accent, fontWeight: 600 }}>
                Send a new code
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <AuthField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              onSubmitEditing={requestCode}
            />
            <FormError message={error} />
            <PillButton label="Send code" onPress={requestCode} loading={busy} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: 22,
    paddingHorizontal: 28,
    paddingTop: Spacing.three,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  intro: {
    gap: Spacing.three - Spacing.one,
    marginBottom: Spacing.two,
  },
  textButton: {
    alignSelf: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
});
