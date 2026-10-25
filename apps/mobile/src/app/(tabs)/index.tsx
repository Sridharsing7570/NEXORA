import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { FloatingAction, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { BigPercent, ListRow, SectionLabel } from '@/components/ui/primitives';
import { Spacing, TouchTarget } from '@/constants/theme';
import { books, findCollection, highlights, journalEntries, pages, sampleUser } from '@/data/sample';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function weekSummary() {
  const recent = journalEntries.filter((entry) => entry.daysAgo < 7);
  const activeDays = new Set(recent.map((entry) => entry.daysAgo)).size;
  const openQuestions = recent.filter((entry) => entry.challenges.trim()).length;
  const days = `You wrote on ${activeDays} of the last 7 days.`;
  if (openQuestions === 0) return days;
  return `${days} ${openQuestions} ${openQuestions === 1 ? 'question is' : 'questions are'} still open.`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signOut } = useSession();

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  const currentBook = books.find((book) => book.status === 'reading');
  // Sample data is already in most-recently-edited order; skip the index page at the top.
  const recentPages = pages.filter((page) => !page.archived).slice(1, 4);

  const openProfile = () =>
    Alert.alert(sampleUser.name, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <Screen fab={<FloatingAction label="Write" icon="pen" onPress={() => router.push('/page/new')} />}>
      <View style={styles.topRow}>
        <ThemedText type="overline" themeColor="textSecondary" style={{ fontSize: 12 }}>
          {dateLabel}
        </ThemedText>
        <Pressable
          onPress={openProfile}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          style={[styles.avatar, { borderColor: theme.leader }]}>
          <ThemedText type="item">{sampleUser.name.charAt(0)}</ThemedText>
        </Pressable>
      </View>

      <ThemedText type="display" accessibilityRole="header" style={styles.greeting}>
        {greeting(now.getHours())},{'\n'}
        <ThemedText type="display" style={{ fontStyle: 'italic', color: theme.accent }}>
          {sampleUser.name}.
        </ThemedText>
      </ThemedText>
      <ThemedText type="reading" themeColor="textBody" style={styles.summary}>
        {weekSummary()}
      </ThemedText>

      <Pressable
        onPress={() => router.push('/search')}
        accessibilityRole="search"
        style={[styles.search, { borderBottomColor: theme.rule }]}>
        <Icon name="search" size={19} color={theme.textSecondary} />
        <ThemedText type="body" themeColor="textSecondary">
          Search your notes, books and journal
        </ThemedText>
      </Pressable>

      {currentBook ? (
        <View style={[styles.section, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth * 2 }]}>
          <SectionLabel>Continue reading</SectionLabel>
          <ListRow
            last
            onPress={() => router.push(`/book/${currentBook.id}`)}
            label={`Continue reading ${currentBook.title}`}
            style={styles.bookRow}>
            <View style={styles.bookText}>
              <ThemedText type="heading">{currentBook.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {currentBook.author} — {highlights.filter((h) => h.bookId === currentBook.id).length} highlights
              </ThemedText>
            </View>
            <BigPercent value={currentBook.progress ?? 0} />
          </ListRow>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionLabel>Recently written</SectionLabel>
        {recentPages.map((page, index) => (
          <ListRow
            key={page.id}
            last={index === recentPages.length - 1}
            onPress={() => router.push(`/page/${page.id}`)}
            style={styles.numberedRow}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.number}>
              {String(index + 1).padStart(2, '0')}
            </ThemedText>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="item">{page.title}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {findCollection(page.collectionId)?.name} · {page.editedLabel}
              </ThemedText>
            </View>
          </ListRow>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: TouchTarget / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    marginTop: Spacing.three,
  },
  summary: {
    marginTop: Spacing.three - Spacing.one,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    marginTop: 22,
    borderBottomWidth: 1,
  },
  section: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  bookRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  bookText: {
    flex: 1,
    gap: 6,
  },
  numberedRow: {
    flexDirection: 'row',
    gap: Spacing.three - Spacing.one,
  },
  number: {
    width: 22,
    paddingTop: 5,
  },
});
