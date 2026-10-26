import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { EmailRow, NameRow, PasswordRow, PhoneRow, ProfileRow } from '@/components/profile-sections';
import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { EmptyState, ListRow, PillButton, SectionLabel } from '@/components/ui/primitives';
import { Fonts, Spacing, TouchTarget } from '@/constants/theme';
import { displayName, useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/lib/api';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, workspaces, reloadProfile, signOut, signOutEverywhere } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [signingOutEverywhere, setSigningOutEverywhere] = useState(false);

  const header = <StackHeader backLabel="Today" />;

  if (!user) {
    return (
      <Screen header={header} inTabs={false}>
        <EmptyState title="Not signed in" message="Sign in to see your profile." />
      </Screen>
    );
  }

  const contact = user.email ?? user.phone ?? '';
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const runSignOutEverywhere = async () => {
    // Guard against a second confirmation while the first request is still in flight.
    if (signingOutEverywhere) return;
    setSigningOutEverywhere(true);
    try {
      await signOutEverywhere();
      // On success the session ends and this screen unmounts; no state to reset.
    } catch (error) {
      setSigningOutEverywhere(false);
      Alert.alert('Could not sign out everywhere', errorMessage(error));
    }
  };

  const confirmSignOutEverywhere = () =>
    Alert.alert(
      'Sign out of all devices?',
      'You will be signed out here and on every other phone or browser where you use Nexora.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out everywhere', style: 'destructive', onPress: () => void runSignOutEverywhere() },
      ],
    );

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <Screen header={header} inTabs={false}>
      <View style={styles.hero}>
        <View style={[styles.avatar, { borderColor: theme.leader }]} accessibilityElementsHidden>
          <ThemedText style={[styles.initial, { fontFamily: Fonts.serif }]}>
            {displayName(user).charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.heroText}>
          <ThemedText type="title" accessibilityRole="header">
            {user.name ?? displayName(user)}
          </ThemedText>
          {contact ? (
            <ThemedText type="body" themeColor="textBody">
              {contact}
            </ThemedText>
          ) : null}
          <ThemedText type="caption" themeColor="textSecondary">
            Member since {memberSince}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel ruled>Account</SectionLabel>
        <NameRow user={user} onSaved={reloadProfile} />
        <EmailRow user={user} onVerified={reloadProfile} />
        <PhoneRow user={user} />
      </View>

      <View style={styles.section}>
        <SectionLabel ruled>Security</SectionLabel>
        <PasswordRow user={user} onChanged={reloadProfile} />
        <ProfileRow label="Sessions" last>
          <ThemedText type="body" themeColor="textBody">
            Signed in on this device.
          </ThemedText>
          <Pressable
            onPress={confirmSignOutEverywhere}
            disabled={signingOutEverywhere}
            accessibilityRole="button"
            accessibilityState={{ busy: signingOutEverywhere, disabled: signingOutEverywhere }}
            style={styles.textButton}>
            <ThemedText
              type="body"
              style={{ color: signingOutEverywhere ? theme.textSecondary : theme.danger, fontWeight: 600 }}>
              {signingOutEverywhere ? 'Signing out everywhere…' : 'Sign out of all devices'}
            </ThemedText>
          </Pressable>
        </ProfileRow>
      </View>

      {workspaces.length > 0 ? (
        <View style={styles.section}>
          <SectionLabel ruled>Workspaces</SectionLabel>
          {workspaces.map((workspace, index) => (
            <ListRow key={workspace.id} last={index === workspaces.length - 1} style={styles.workspace}>
              <ThemedText type="item" style={{ flex: 1 }}>
                {workspace.name}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {workspace.kind === 'personal' ? 'Personal' : 'Team'} · {capitalize(workspace.role)}
              </ThemedText>
            </ListRow>
          ))}
        </View>
      ) : null}

      <View style={styles.signOut}>
        <PillButton label="Sign out" filled={false} onPress={handleSignOut} loading={signingOut} />
      </View>
    </Screen>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingTop: Spacing.three,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 32,
    lineHeight: 38,
  },
  heroText: {
    flex: 1,
    gap: Spacing.one,
  },
  section: {
    paddingTop: Spacing.five,
  },
  textButton: {
    alignSelf: 'flex-start',
    minHeight: TouchTarget,
    justifyContent: 'center',
  },
  workspace: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.three,
  },
  signOut: {
    paddingTop: Spacing.five,
  },
});
