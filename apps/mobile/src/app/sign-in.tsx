import {
  loginSchema,
  phoneRequestCodeSchema,
  phoneVerifySchema,
  registerSchema,
} from '@repo/api/auth/auth.schemas';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AuthField,
  FormError,
  FormNotice,
  validate,
} from '@/components/auth-form';
import { ThemedText } from '@/components/themed-text';
import { PillButton, TextTabs } from '@/components/ui/primitives';
import { Spacing, TouchTarget } from '@/constants/theme';
import { ApiError, errorMessage } from '@/lib/api';
import { authApi } from '@/lib/auth-api';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';

type Method = 'email' | 'phone';
type EmailMode = 'signIn' | 'register';

const methods = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone number' },
] as const;

/** Phone sign-in currently offers India only; the country code becomes a picker later. */
const COUNTRY_CODE = '+91';

export default function SignInScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeSignIn } = useSession();

  const [method, setMethod] = useState<Method>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /**
   * After a failed login, offer sign-up. The server deliberately does not say whether the email
   * has an account, so the hint is shown for any rejected email/password.
   */
  const [suggestSignUp, setSuggestSignUp] = useState(false);

  const fullPhone = `${COUNTRY_CODE}${phone.replace(/\D/g, '')}`;

  /** Runs an API call with a loading state and shows its error message on failure. */
  const run = async (task: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    setSuggestSignUp(false);
    setBusy(true);
    try {
      await task();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = () => {
    if (emailMode === 'signIn') {
      const parsed = validate(loginSchema, { email, password });
      if (parsed.error !== null) return setError(parsed.error);
      void run(async () => {
        try {
          await completeSignIn(await authApi.login(parsed.data));
        } catch (caught) {
          // Rejected credentials (not a network error): the user may not have an account yet.
          if (caught instanceof ApiError && caught.status === 401) {
            setSuggestSignUp(true);
          }
          throw caught;
        }
      });
    } else {
      const parsed = validate(registerSchema, {
        email,
        password,
        name: name.trim() || undefined,
      });
      if (parsed.error !== null) return setError(parsed.error);
      void run(async () => completeSignIn(await authApi.register(parsed.data)));
    }
  };

  /** Switches to sign-up, keeping the email and password the user already typed. */
  const createAccountInstead = () => {
    setEmailMode('register');
    setSuggestSignUp(false);
    setError(null);
  };

  const sendCode = () => {
    const parsed = validate(phoneRequestCodeSchema, { phone: fullPhone });
    if (parsed.error !== null) return setError(parsed.error);

    void run(async () => {
      await authApi.requestPhoneCode(parsed.data.phone);
      setCodeSent(true);
      setNotice(`We sent a 6-digit code to ${parsed.data.phone}.`);
    });
  };

  const verifyCode = () => {
    const parsed = validate(phoneVerifySchema, { phone: fullPhone, code });
    if (parsed.error !== null) return setError(parsed.error);

    void run(async () => {
      await completeSignIn(await authApi.verifyPhone(parsed.data));
    });
  };

  const changeMethod = (next: Method) => {
    setMethod(next);
    setError(null);
    setNotice(null);
    setSuggestSignUp(false);
  };

  const toggleEmailMode = () => {
    setMethod('email');
    setEmailMode((mode) => (mode === 'signIn' ? 'register' : 'signIn'));
    setError(null);
    setSuggestSignUp(false);
  };

  const signInWithGoogle = () =>
    Alert.alert(
      'Google sign-in',
      'Google sign-in is not available in this version of the app yet.',
    );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.five,
            paddingBottom: insets.bottom + Spacing.five,
          },
        ]}
      >
        <ThemedText
          type="heading"
          style={{ fontStyle: 'italic', fontWeight: 400 }}
        >
          Nexora
        </ThemedText>

        <View style={styles.intro}>
          <ThemedText type="display" accessibilityRole="header">
            {emailMode === 'register' && method === 'email'
              ? 'Start your\n'
              : 'Your knowledge,\n'}
            <ThemedText
              type="display"
              style={{ fontStyle: 'italic', color: theme.accent }}
            >
              {emailMode === 'register' && method === 'email'
                ? 'second brain.'
                : 'connected.'}
            </ThemedText>
          </ThemedText>
          <ThemedText type="reading" themeColor="textBody">
            {emailMode === 'register' && method === 'email'
              ? 'Create an account to start capturing what you learn.'
              : 'Sign in to pick up where you left off.'}
          </ThemedText>
        </View>

        <PillButton
          label="Continue with Google"
          filled={false}
          onPress={signInWithGoogle}
          leading={<ThemedText style={styles.googleMark}>G</ThemedText>}
        />

        <View style={styles.form}>
          <TextTabs
            label="Sign in with"
            options={methods}
            value={method}
            onChange={changeMethod}
          />

          {method === 'email' ? (
            <>
              {emailMode === 'register' ? (
                <AuthField
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="What should we call you?"
                  autoComplete="name"
                  textContentType="name"
                  // Email and password carry over from sign-in, so the name is what's left to fill.
                  autoFocus={email.length > 0}
                />
              ) : null}
              <AuthField
                label="Email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setSuggestSignUp(false);
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <View style={{ gap: Spacing.one }}>
                <AuthField
                  label="Password"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setSuggestSignUp(false);
                  }}
                  placeholder="At least 8 characters"
                  secureTextEntry
                  autoComplete={
                    emailMode === 'signIn' ? 'current-password' : 'new-password'
                  }
                  textContentType={
                    emailMode === 'signIn' ? 'password' : 'newPassword'
                  }
                  onSubmitEditing={submitEmail}
                />
                {emailMode === 'signIn' ? (
                  <Pressable
                    onPress={() => router.push('/forgot-password')}
                    accessibilityRole="link"
                    style={styles.forgot}
                  >
                    <ThemedText
                      type="small"
                      style={{ color: theme.accent, fontWeight: 500 }}
                    >
                      Forgot password?
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <FormError message={error} />
              {suggestSignUp && emailMode === 'signIn' ? (
                <View
                  style={[styles.missing, { borderLeftColor: theme.accent }]}
                  accessibilityLiveRegion="polite">
                  <ThemedText type="body" style={{ fontWeight: 600 }}>
                    Don&apos;t have an account yet?
                  </ThemedText>
                  <ThemedText type="small" themeColor="textBody">
                    Create one with this email and password in one step.
                  </ThemedText>
                  <Pressable
                    onPress={createAccountInstead}
                    accessibilityRole="button"
                    style={styles.missingAction}>
                    <ThemedText type="body" style={{ color: theme.accent, fontWeight: 600 }}>
                      Create account →
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
              <PillButton
                label={emailMode === 'signIn' ? 'Sign in' : 'Create account'}
                onPress={submitEmail}
                loading={busy}
              />
            </>
          ) : codeSent ? (
            <>
              <FormNotice message={notice} />
              <AuthField
                label="Verification code"
                value={code}
                onChangeText={(value) =>
                  setCode(value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="123456"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                onSubmitEditing={verifyCode}
              />
              <FormError message={error} />
              <PillButton
                label="Verify and continue"
                onPress={verifyCode}
                loading={busy}
              />
              <View style={styles.codeActions}>
                <Pressable
                  onPress={sendCode}
                  disabled={busy}
                  accessibilityRole="button"
                  style={styles.textButton}
                >
                  <ThemedText
                    type="body"
                    style={{ color: theme.accent, fontWeight: 600 }}
                  >
                    Resend code
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCodeSent(false);
                    setCode('');
                    setError(null);
                    setNotice(null);
                  }}
                  accessibilityRole="button"
                  style={styles.textButton}
                >
                  <ThemedText type="body" themeColor="textSecondary">
                    Change number
                  </ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={{ gap: Spacing.one }}>
                <ThemedText
                  type="overline"
                  themeColor="textSecondary"
                  nativeID="phone-label"
                >
                  Phone number
                </ThemedText>
                <View
                  style={[styles.phoneRow, { borderBottomColor: theme.rule }]}
                >
                  <ThemedText type="default" style={{ fontSize: 17 }}>
                    {COUNTRY_CODE}
                  </ThemedText>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="98765 43210"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    accessibilityLabelledBy="phone-label"
                    onSubmitEditing={sendCode}
                    style={[styles.phoneInput, { color: theme.text }]}
                  />
                </View>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={{ marginTop: 6 }}
                >
                  We&apos;ll text you a 6-digit code. No password needed.
                </ThemedText>
              </View>
              <FormError message={error} />
              <PillButton label="Send code" onPress={sendCode} loading={busy} />
            </>
          )}
        </View>

        <View style={styles.footer}>
          <ThemedText type="body" themeColor="textSecondary">
            {emailMode === 'signIn' ? 'New here?' : 'Already have an account?'}
          </ThemedText>
          <Pressable
            onPress={toggleEmailMode}
            accessibilityRole="button"
            hitSlop={8}
          >
            <ThemedText
              type="body"
              style={{ color: theme.accent, fontWeight: 600 }}
            >
              {emailMode === 'signIn' ? 'Create an account' : 'Sign in'}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.five,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  intro: {
    gap: Spacing.three - Spacing.one,
  },
  googleMark: {
    fontSize: 17,
    fontWeight: 700,
    color: '#4285F4',
  },
  form: {
    gap: 22,
    marginTop: -Spacing.two,
  },
  forgot: {
    alignSelf: 'flex-end',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    borderBottomWidth: 1,
  },
  phoneInput: {
    flex: 1,
    height: TouchTarget,
    paddingHorizontal: 0,
    fontSize: 17,
  },
  missing: {
    gap: Spacing.one,
    paddingLeft: Spacing.three,
    borderLeftWidth: 2,
  },
  missingAction: {
    alignSelf: 'flex-start',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textButton: {
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
});
