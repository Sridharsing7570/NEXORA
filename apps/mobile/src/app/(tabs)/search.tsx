import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { EmptyState, IconButton, ListRow, SectionLabel, TextTabs } from '@/components/ui/primitives';
import { Fonts, Spacing } from '@/constants/theme';
import { books, findBook, findCollection, highlights, journalEntries, pages } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';

type ResultType = 'page' | 'highlight' | 'book' | 'journal';
type Filter = 'all' | ResultType;

type Result = {
  id: string;
  type: ResultType;
  title: string;
  snippet: string;
  meta: string;
  href: Href;
};

const groupLabels: Record<ResultType, string> = {
  page: 'Pages',
  highlight: 'Highlights',
  book: 'Books',
  journal: 'Journal',
};

/** Searchable documents. Mirrors what PostgreSQL full-text search will index on the server. */
function buildIndex(): Result[] {
  return [
    ...pages
      .filter((page) => !page.archived)
      .map((page) => ({
        id: page.id,
        type: 'page' as const,
        title: page.title,
        snippet: page.blocks.map((block) => block.content).join(' '),
        meta: [findCollection(page.collectionId)?.name, ...page.tags.map((t) => `#${t}`)].join(' · '),
        href: `/page/${page.id}` as Href,
      })),
    ...highlights.map((highlight) => ({
      id: highlight.id,
      type: 'highlight' as const,
      title: highlight.text,
      snippet: highlight.note ?? '',
      meta: `${findBook(highlight.bookId)?.title ?? ''} · p. ${highlight.pageNumber}`,
      href: `/book/${highlight.bookId}` as Href,
    })),
    ...books.map((book) => ({
      id: book.id,
      type: 'book' as const,
      title: book.title,
      snippet: book.author,
      meta: book.author,
      href: `/book/${book.id}` as Href,
    })),
    ...journalEntries.map((entry) => ({
      id: entry.id,
      type: 'journal' as const,
      title: entry.title,
      snippet: [entry.learned, entry.challenges, entry.reflection].filter(Boolean).join(' '),
      meta: entry.daysAgo === 0 ? 'Today' : `${entry.daysAgo} days ago`,
      href: '/journal' as Href,
    })),
  ];
}

/** A short excerpt of `text` centred on the first match. */
function excerpt(text: string, query: string) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return text.slice(0, 90);
  const start = Math.max(0, index - 30);
  const end = index + query.length + 50;
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const index = useMemo(buildIndex, []);
  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!trimmed) return [];
    const needle = trimmed.toLowerCase();
    return index.filter(
      (item) =>
        (filter === 'all' || item.type === filter) &&
        (item.title.toLowerCase().includes(needle) || item.snippet.toLowerCase().includes(needle)),
    );
  }, [index, trimmed, filter]);

  const groups = (Object.keys(groupLabels) as ResultType[])
    .map((type) => ({ type, items: results.filter((item) => item.type === type) }))
    .filter((group) => group.items.length > 0);

  const filters = [
    { value: 'all', label: trimmed ? `All ${results.length}` : 'All' },
    { value: 'page', label: 'Pages' },
    { value: 'highlight', label: 'Highlights' },
    { value: 'book', label: 'Books' },
    { value: 'journal', label: 'Journal' },
  ] as const;

  return (
    <Screen>
      <ThemedText type="overline" themeColor="textSecondary" style={{ fontSize: 12 }} nativeID="search-label">
        Search
      </ThemedText>
      <View style={[styles.searchRow, { borderBottomColor: theme.rule }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Type a word…"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabelledBy="search-label"
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {query ? <IconButton icon="close" label="Clear search" onPress={() => setQuery('')} color={theme.textSecondary} /> : null}
      </View>

      <View style={{ marginTop: Spacing.one }}>
        <TextTabs label="Filter results" options={filters} value={filter} onChange={setFilter} />
      </View>

      {!trimmed ? (
        <EmptyState
          title="Search everything"
          message="Find pages, book highlights and journal entries by any word they contain."
        />
      ) : groups.length === 0 ? (
        <EmptyState title="No results" message={`Nothing matches “${trimmed}”. Try a shorter word.`} />
      ) : (
        groups.map((group) => (
          <View key={group.type} style={styles.group}>
            <SectionLabel>
              {groupLabels[group.type]} · {group.items.length}
            </SectionLabel>
            {group.items.map((item) => (
              <ListRow
                key={item.id}
                onPress={() => router.push(item.href)}
                style={[styles.result, { borderTopColor: theme.border }]}>
                <Highlighted
                  text={group.type === 'highlight' ? `“${item.title}”` : item.title}
                  query={trimmed}
                  italic={group.type === 'highlight'}
                />
                {item.snippet && item.snippet !== item.meta ? (
                  <Highlighted text={excerpt(item.snippet, trimmed)} query={trimmed} secondary />
                ) : null}
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.meta}
                </ThemedText>
              </ListRow>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

/** Renders `text` with every case-insensitive occurrence of `query` marked. */
function Highlighted({
  text,
  query,
  italic = false,
  secondary = false,
}: {
  text: string;
  query: string;
  italic?: boolean;
  secondary?: boolean;
}) {
  const theme = useTheme();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  const type = secondary ? 'small' : 'item';

  return (
    <ThemedText
      type={type}
      themeColor={secondary ? 'textBody' : 'text'}
      style={italic && { fontStyle: 'italic', fontSize: 17 }}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <ThemedText key={i} type={type} style={[{ backgroundColor: theme.highlight }, italic && { fontStyle: 'italic', fontSize: 17 }]}>
            {part}
          </ThemedText>
        ) : (
          part
        ),
      )}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 56,
    padding: 0,
    fontFamily: Fonts.serif,
    fontSize: 32,
  },
  group: {
    paddingTop: 22,
  },
  result: {
    gap: Spacing.one,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: 0,
  },
});
