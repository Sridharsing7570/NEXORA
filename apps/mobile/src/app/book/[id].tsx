import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { EmptyState, ProgressLine, Rule, TextTabs } from '@/components/ui/primitives';
import { Spacing } from '@/constants/theme';
import { findBook, findPage, highlights, type ReadingStatus } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';

type Tab = 'highlights' | 'about';

const statusLabels: Record<ReadingStatus, string> = {
  want_to_read: 'Want to read',
  reading: 'Reading',
  finished: 'Finished',
};

export default function BookScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = findBook(id);

  const [tab, setTab] = useState<Tab>('highlights');
  const [rating, setRating] = useState(book?.rating ?? 0);

  const header = <StackHeader backLabel="Library" />;

  if (!book) {
    return (
      <Screen header={header} inTabs={false}>
        <EmptyState title="Book not found" message="It may have been removed from your library." />
      </Screen>
    );
  }

  const bookHighlights = highlights.filter((highlight) => highlight.bookId === book.id);
  const status =
    book.status === 'reading' && book.progress !== undefined
      ? `Reading · ${Math.round(book.progress * 100)}%`
      : statusLabels[book.status];

  return (
    <Screen header={header} inTabs={false}>
      <ThemedText type="overline" style={{ color: theme.accent }}>
        {status}
      </ThemedText>
      <ThemedText type="title" accessibilityRole="header" style={{ marginTop: 10 }}>
        {book.title}
      </ThemedText>
      <ThemedText type="reading" themeColor="textBody" style={styles.author}>
        {book.author}
      </ThemedText>

      <View style={styles.meta}>
        {book.startedLabel ? (
          <ThemedText type="small" themeColor="textSecondary">
            Started {book.startedLabel} ·{' '}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          Your rating
        </ThemedText>
        <View style={styles.stars} accessibilityLabel={`Your rating: ${rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              onPress={() => setRating(value === rating ? 0 : value)}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${value} out of 5`}
              style={styles.star}>
              <ThemedText type="body" style={{ color: value <= rating ? theme.text : theme.leader }}>
                ★
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {book.progress !== undefined ? (
        <View style={{ marginTop: Spacing.two }}>
          <ProgressLine value={book.progress} />
        </View>
      ) : null}

      <View style={{ marginTop: 20 }}>
        <TextTabs
          label="Book sections"
          options={[
            { value: 'highlights', label: `Highlights ${bookHighlights.length}` },
            { value: 'about', label: 'About' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === 'about' ? (
        <View style={styles.about}>
          <AboutRow label="Status" value={statusLabels[book.status]} />
          {book.startedLabel ? <AboutRow label="Started" value={book.startedLabel} /> : null}
          {book.finishedLabel ? <AboutRow label="Finished" value={book.finishedLabel} /> : null}
          <AboutRow label="Description" value={book.description} />
        </View>
      ) : bookHighlights.length === 0 ? (
        <EmptyState title="No highlights yet" message="Save passages from this book to find them again later." />
      ) : (
        bookHighlights.map((highlight, index) => {
          const linkedPage = highlight.linkedPageId ? findPage(highlight.linkedPageId) : undefined;
          return (
            <View key={highlight.id}>
              <View style={styles.highlight}>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.pageNumber}>
                  p. {highlight.pageNumber}
                </ThemedText>
                <View style={styles.highlightBody}>
                  <ThemedText type="reading" style={{ fontSize: 19, lineHeight: 29 }}>
                    <ThemedText type="reading" style={{ fontSize: 19, lineHeight: 29, backgroundColor: theme.highlight }}>
                      {highlight.text}
                    </ThemedText>
                  </ThemedText>
                  {highlight.note ? (
                    <ThemedText type="small" themeColor="textBody" style={{ fontSize: 14, lineHeight: 21 }}>
                      <ThemedText type="smallBold" style={{ fontSize: 14 }}>
                        Note —{' '}
                      </ThemedText>
                      {highlight.note}
                    </ThemedText>
                  ) : null}
                  {linkedPage ? (
                    <Pressable
                      onPress={() => router.push(`/page/${linkedPage.id}`)}
                      accessibilityRole="link"
                      hitSlop={8}>
                      <ThemedText type="small" style={{ color: theme.accent, fontWeight: 500 }}>
                        → {linkedPage.title}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              {index < bookHighlights.length - 1 ? <Rule /> : null}
            </View>
          );
        })
      )}
    </Screen>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText type="overline" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="reading">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  author: {
    fontStyle: 'italic',
    marginTop: Spacing.two,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  stars: {
    flexDirection: 'row',
    marginLeft: Spacing.one,
  },
  star: {
    width: 28,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  about: {
    paddingTop: 20,
    gap: Spacing.three,
  },
  highlight: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 20,
  },
  pageNumber: {
    width: 40,
    paddingTop: 6,
  },
  highlightBody: {
    flex: 1,
    gap: 10,
  },
});
