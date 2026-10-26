import {
  changePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  type UserProfile,
} from '@repo/api/auth/auth.schemas';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthField, FormError, FormNotice, validate } from '@/components/auth-form';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { PillButton } from '@/components/ui/primitives';
import { Spacing, TouchTarget } from '@/constants/theme';
import { useAction } from '@/hooks/use-action';
import { useTheme } from '@/hooks/use-theme';
import { storeTokens } from '@/lib/api';
import { authApi } from '@/lib/auth-api';

/** One labelled row of the profile, with an optional text action on the right. */
export function ProfileRow({
  label,
  children,
  action,
  last = false,
}: {
  label: string;
  children: ReactNode;
  action?: { label: string; onPress: () => void };
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: theme.border },
      ]}>
      <View style={styles.rowTop}>
        <View style={styles.rowText}>
          <ThemedText type="overline" themeColor="textSecondary">
            {label}
          </ThemedText>
          {children}
        </View>
        {action ? (
          <Pressable onPress={action.onPress} accessibilityRole="button" hitSlop={8} style={styles.rowAction}>
            <ThemedText type="body" style={{ color: theme.accent, fontWeight: 600 }}>
              {action.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function EmptyValue({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="item" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
      {children}
    </ThemedText>
  );
}

function Status({ verified }: { verified: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.status}>
      {verified ? <Icon name="check" size={13} color={theme.textSecondary} /> : null}
      <ThemedText type="caption" style={{ color: verified ? theme.textSecondary : theme.accent }}>
        {verified ? 'Verified' : 'Not verified'}
      </ThemedText>
    </View>
  );
}

/**
 * Refreshes the profile after a change that already succeeded. A failure here only means the
 * screen shows slightly stale data until the next reload, so it is not reported as an error.
 */
async function reloadQuietly(reload: () => Promise<void>) {
  await reload().catch(() => undefined);
}

function CancelLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.cancel}>
      <ThemedText type="body" themeColor="textSecondary">
        Cancel
      </ThemedText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------

export function NameRow({ user, onSaved }: { user: UserProfile; onSaved: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user.name ?? '');
  const { busy, error, setError, run } = useAction();

  const save = async () => {
    const parsed = validate(updateProfileSchema, { name: draft.trim() || null });
    if (parsed.error !== null) return setError(parsed.error);
    const ok = await run(async () => {
      await authApi.updateProfile(parsed.data);
    });
    if (ok) {
      setEditing(false);
      await reloadQuietly(onSaved);
    }
  };

  // Start from the current name each time, in case the profile was reloaded since mount.
  const startEditing = () => {
    setDraft(user.name ?? '');
    setError(null);
    setEditing(true);
  };

  if (editing) {
    return (
      <ProfileRow label="Name">
        <View style={styles.form}>
          <AuthField
            label="Your name"
            value={draft}
            onChangeText={setDraft}
            placeholder="What should we call you?"
            autoComplete="name"
            textContentType="name"
            autoFocus
            onSubmitEditing={save}
          />
          <FormError message={error} />
          <PillButton label="Save name" onPress={save} loading={busy} />
          <CancelLink
            onPress={() => {
              setError(null);
              setEditing(false);
            }}
          />
        </View>
      </ProfileRow>
    );
  }

  return (
    <ProfileRow label="Name" action={{ label: 'Edit', onPress: startEditing }}>
      {user.name ? <ThemedText type="item">{user.name}</ThemedText> : <EmptyValue>Not set</EmptyValue>}
    </ProfileRow>
  );
}

export function EmailRow({ user, onVerified }: { user: UserProfile; onVerified: () => Promise<void> }) {
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const { busy, error, setError, run } = useAction();
  const sender = useAction();

  if (!user.email) {
    return (
      <ProfileRow label="Email">
        <EmptyValue>Not added</EmptyValue>
      </ProfileRow>
    );
  }

  const sendCode = async () => {
    setError(null);
    const ok = await sender.run(() => authApi.requestEmailVerification());
    if (ok) setNotice(`We sent a new code to ${user.email}.`);
  };

  const close = () => {
    setVerifying(false);
    setCode('');
    setError(null);
    sender.setError(null);
    setNotice(null);
  };

  const confirm = async () => {
    sender.setError(null);
    const parsed = validate(verifyEmailSchema, { code });
    if (parsed.error !== null) return setError(parsed.error);
    // Only the verification decides success: the code is single-use, so a failed reload
    // afterwards must not invite the user to submit it again.
    const ok = await run(async () => {
      await authApi.verifyEmail(parsed.data);
    });
    if (ok) {
      close();
      await reloadQuietly(onVerified);
    }
  };

  return (
    <ProfileRow
      label="Email"
      action={!user.emailVerified && !verifying ? { label: 'Verify', onPress: () => setVerifying(true) } : undefined}>
      <ThemedText type="item">{user.email}</ThemedText>
      <Status verified={user.emailVerified} />
      {verifying ? (
        <View style={styles.form}>
          <FormNotice
            message={notice ?? 'Enter the 6-digit code we emailed you when you signed up, or send a new one.'}
          />
          <AuthField
            label="Verification code"
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            onSubmitEditing={confirm}
          />
          <FormError message={error ?? sender.error} />
          <PillButton label="Verify email" onPress={confirm} loading={busy} />
          <View style={styles.links}>
            <Pressable onPress={sendCode} disabled={sender.busy} accessibilityRole="button" style={styles.cancel}>
              <ThemedText type="body" style={{ fontWeight: 600 }} themeColor={sender.busy ? 'textSecondary' : 'text'}>
                {sender.busy ? 'Sending…' : 'Send a new code'}
              </ThemedText>
            </Pressable>
            <CancelLink onPress={close} />
          </View>
        </View>
      ) : null}
    </ProfileRow>
  );
}

export function PhoneRow({ user }: { user: UserProfile }) {
  return (
    <ProfileRow label="Phone">
      {user.phone ? (
        <>
          <ThemedText type="item">{user.phone}</ThemedText>
          <Status verified={user.phoneVerified} />
        </>
      ) : (
        <EmptyValue>Not added</EmptyValue>
      )}
    </ProfileRow>
  );
}

export function PasswordRow({ user, onChanged }: { user: UserProfile; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const { busy, error, setError, run } = useAction();

  const close = () => {
    setEditing(false);
    setCurrentPassword('');
    setNewPassword('');
    setError(null);
  };

  const save = async () => {
    const parsed = validate(changePasswordSchema, {
      currentPassword: user.hasPassword ? currentPassword : undefined,
      newPassword,
    });
    if (parsed.error !== null) return setError(parsed.error);
    const hadPassword = user.hasPassword;
    // Only the change itself decides success. If the reload afterwards failed, reporting an error
    // would make the user retry with a current password that is no longer valid.
    const ok = await run(async () => {
      const { tokens } = await authApi.changePassword(parsed.data);
      // The server signed out every session, including this one, and returned new tokens for it.
      await storeTokens(tokens);
    });
    if (ok) {
      close();
      setNotice(
        hadPassword
          ? 'Password changed. Your other devices were signed out.'
          : 'Password set. You can now sign in with your email and password.',
      );
      await reloadQuietly(onChanged);
    }
  };

  return (
    <ProfileRow
      label="Password"
      action={editing ? undefined : { label: user.hasPassword ? 'Change' : 'Set', onPress: () => setEditing(true) }}>
      {user.hasPassword ? (
        <ThemedText type="item" accessibilityLabel="Password is set">
          ••••••••
        </ThemedText>
      ) : (
        <EmptyValue>Not set</EmptyValue>
      )}
      {!editing ? <FormNotice message={notice} /> : null}
      {editing ? (
        <View style={styles.form}>
          {user.hasPassword ? (
            <AuthField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              autoFocus
            />
          ) : null}
          <AuthField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            autoFocus={!user.hasPassword}
            onSubmitEditing={save}
          />
          <FormError message={error} />
          <PillButton label={user.hasPassword ? 'Change password' : 'Set password'} onPress={save} loading={busy} />
          <CancelLink onPress={close} />
        </View>
      ) : null}
    </ProfileRow>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowAction: {
    minHeight: TouchTarget,
    justifyContent: 'center',
    marginTop: -Spacing.two,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  form: {
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancel: {
    alignSelf: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
});
