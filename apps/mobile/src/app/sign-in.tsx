import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PillButton, TextTabs } from '@/components/ui/primitives';
import { Spacing, TouchTarget } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';

type Method = 'email' | 'phone';

const methods = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone number' },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();

  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeMethod = (next: Method) => {
    setMethod(next);
    setError(null);
  };

  // These handlers only validate input; they call the auth API once it exists.
  const submitEmail = () => {
    if (!EMAIL_PATTERN.test(email.trim())) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setError(null);
    signIn();
  };

  const sendCode = () => {
    if (phone.replace(/\D/g, '').length < 10) return setError('Enter a 10-digit phone number.');
    setError(null);
    setCodeSent(true);
  };

  const verifyCode = () => {
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code.');
    setError(null);
    signIn();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.five },
        ]}>
        <ThemedText type="heading" style={{ fontStyle: 'italic', fontWeight: 400 }}>
          Nexora
        </ThemedText>

        <View style={styles.intro}>
          <ThemedText type="display" accessibilityRole="header">
            Your knowledge,{'\n'}
            <ThemedText type="display" style={{ fontStyle: 'italic', color: theme.accent }}>
              connected.
            </ThemedText>
          </ThemedText>
          <ThemedText type="reading" themeColor="textBody">
            Sign in to pick up where you left off.
          </ThemedText>
        </View>

        <PillButton
          label="Continue with Google"
          filled={false}
          onPress={signIn}
          leading={<ThemedText style={styles.googleMark}>G</ThemedText>}
        />

        <View style={styles.form}>
          <TextTabs label="Sign in with" options={methods} value={method} onChange={changeMethod} />

          {method === 'email' ? (
            <>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                onSubmitEditing={submitEmail}
              />
              <ErrorText message={error} />
              <PillButton label="Sign in" onPress={submitEmail} />
            </>
          ) : codeSent ? (
            <>
              <ThemedText type="body" themeColor="textBody">
                We sent a 6-digit code to +91 {phone}.
              </ThemedText>
              <Field
                label="Verification code"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                onSubmitEditing={verifyCode}
              />
              <ErrorText message={error} />
              <PillButton label="Verify and sign in" onPress={verifyCode} />
              <Pressable
                onPress={() => {
                  setCodeSent(false);
                  setCode('');
                }}
                accessibilityRole="button"
                style={styles.textButton}>
                <ThemedText type="body" style={{ color: theme.accent, fontWeight: 600 }}>
                  Change phone number
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <ThemedText type="overline" themeColor="textSecondary" nativeID="phone-label">
                  Phone number
                </ThemedText>
                <View style={[styles.phoneRow, { borderBottomColor: theme.rule }]}>
                  <ThemedText type="default" style={{ fontSize: 17 }}>
                    +91
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
                    style={[styles.input, styles.phoneInput, { color: theme.text }]}
                  />
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>
                  We&apos;ll text you a 6-digit code. No password needed.
                </ThemedText>
              </View>
              <ErrorText message={error} />
              <PillButton label="Send code" onPress={sendCode} />
            </>
          )}
        </View>

        <View style={styles.footer}>
          <ThemedText type="body" themeColor="textSecondary">
            New here?
          </ThemedText>
          <Pressable onPress={signIn} accessibilityRole="button" hitSlop={8}>
            <ThemedText type="body" style={{ color: theme.accent, fontWeight: 600 }}>
              Create an account
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...inputProps }: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="overline" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderBottomColor: theme.rule, borderBottomWidth: 1 }]}
        {...inputProps}
      />
    </View>
  );
}

function ErrorText({ message }: { message: string | null }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <ThemedText type="small" accessibilityRole="alert" style={{ color: theme.danger }}>
      {message}
    </ThemedText>
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
  field: {
    gap: Spacing.one,
  },
  input: {
    height: TouchTarget,
    paddingHorizontal: 0,
    fontSize: 17,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    borderBottomWidth: 1,
  },
  phoneInput: {
    flex: 1,
  },
  textButton: {
    alignSelf: 'center',
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
