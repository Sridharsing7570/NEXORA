import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { BigPercent, BookSpine, EmptyState, ListRow, SectionLabel, TextTabs } from '@/components/ui/primitives';
import { Spacing } from '@/constants/theme';
import { books, highlights, type ReadingStatus } from '@/data/sample';

type ResourceType = 'books' | 'articles' | 'docs' | 'links';

const resourceTypes = [
  { value: 'books', label: 'Books' },
  { value: 'articles', label: 'Articles' },
  { value: 'docs', label: 'Docs' },
  { value: 'links', label: 'Links' },
] as const;

const statuses: { value: ReadingStatus; label: string }[] = [
  { value: 'reading', label: 'Reading' },
  { value: 'want_to_read', label: 'Want to read' },
  { value: 'finished', label: 'Finished' },
];

const emptyMessages: Record<Exclude<ResourceType, 'books'>, string> = {
  articles: 'Save articles you want to read or keep for reference.',
  docs: 'Keep links to technical documentation you return to often.',
  links: 'Collect videos, courses and other online resources.',
};

export default function LibraryScreen() {
  const router = useRouter();
  const [type, setType] = useState<ResourceType>('books');
  const [status, setStatus] = useState<ReadingStatus>('reading');

  const filtered = books.filter((book) => book.status === status);
  const finished = books.filter((book) => book.status === 'finished');

  return (
    <Screen>
      <ThemedText type="display" accessibilityRole="header">
        Library
      </ThemedText>

      <View style={{ marginTop: 18 }}>
        <TextTabs label="Resource type" options={resourceTypes} value={type} onChange={setType} />
      </View>

      {type !== 'books' ? (
        <EmptyState title={`No ${type} yet`} message={emptyMessages[type]} />
      ) : (
        <>
          <View style={styles.statuses} accessibilityRole="tablist" accessibilityLabel="Reading status">
            {statuses.map((item, index) => {
              const selected = status === item.value;
              return (
                <View key={item.value} style={styles.statusItem}>
                  {index > 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      ·
                    </ThemedText>
                  ) : null}
                  <Pressable
                    onPress={() => setStatus(item.value)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    hitSlop={10}>
                    <ThemedText type={selected ? 'smallBold' : 'small'} themeColor={selected ? 'text' : 'textSecondary'}>
                      {item.label} {books.filter((b) => b.status === item.value).length}
                    </ThemedText>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {filtered.length === 0 ? (
            <EmptyState title="Nothing here yet" message="Books you add with this status appear here." />
          ) : (
            filtered.map((book, index) => (
              <ListRow
                key={book.id}
                last={index === filtered.length - 1}
                onPress={() => router.push(`/book/${book.id}`)}
                label={`${book.title} by ${book.author}`}
                style={styles.bookRow}>
                <BookSpine color={book.cover.background} />
                <View style={styles.bookText}>
                  <ThemedText type="item" style={{ fontSize: 20, fontWeight: 500 }}>
                    {book.title}
                  </ThemedText>
                  <ThemedText type="item" themeColor="textBody" style={styles.author}>
                    {book.author}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {book.startedLabel ? `Since ${book.startedLabel} · ` : ''}
                    {highlights.filter((h) => h.bookId === book.id).length} highlights
                  </ThemedText>
                </View>
                {book.progress !== undefined ? <BigPercent value={book.progress} size={28} /> : null}
              </ListRow>
            ))
          )}

          {status !== 'finished' && finished.length > 0 ? (
            <View style={styles.section}>
              <SectionLabel ruled>Recently finished</SectionLabel>
              {finished.map((book, index) => (
                <ListRow
                  key={book.id}
                  last={index === finished.length - 1}
                  onPress={() => router.push(`/book/${book.id}`)}
                  style={styles.finishedRow}>
                  <ThemedText type="item" style={{ flex: 1, fontSize: 18 }}>
                    {book.title}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {[book.finishedLabel, book.rating ? `${book.rating}/5` : null].filter(Boolean).join(' · ')}
                  </ThemedText>
                </ListRow>
              ))}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statuses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginRight: Spacing.two,
  },
  bookRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingVertical: 18,
  },
  bookText: {
    flex: 1,
    gap: Spacing.one,
  },
  author: {
    fontSize: 15,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  section: {
    paddingTop: Spacing.four,
  },
  finishedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingVertical: 13,
  },
});
