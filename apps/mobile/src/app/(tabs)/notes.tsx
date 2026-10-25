import { useRouter } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { FloatingAction, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { EmptyState, ListRow, Rule, SectionLabel, TextTabs } from '@/components/ui/primitives';
import { Spacing } from '@/constants/theme';
import { collections, pages, type Page } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';

type Filter = 'all' | 'favorites' | 'archive' | 'trash';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'archive', label: 'Archive' },
  { value: 'trash', label: 'Trash' },
] as const;

const emptyMessages: Record<Filter, { title: string; message: string }> = {
  all: { title: 'No pages yet', message: 'Tap New page to write your first note.' },
  favorites: { title: 'No favorites', message: 'Star a page to keep it one tap away.' },
  archive: {
    title: 'Archive is empty',
    message: 'Archive pages you want to keep but no longer need every day.',
  },
  trash: { title: 'Trash is empty', message: 'Deleted pages stay here for 30 days.' },
};

function matchesFilter(page: Page, filter: Filter) {
  switch (filter) {
    case 'all':
      return !page.archived;
    case 'favorites':
      return page.favorite && !page.archived;
    case 'archive':
      return page.archived;
    case 'trash':
      return false;
  }
}

export default function NotesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['p-distributed']));

  const visible = pages.filter((page) => matchesFilter(page, filter));
  // In "All", show the page tree; other filters are flat lists.
  const roots = filter === 'all' ? visible.filter((page) => !page.parentId) : visible;
  const childrenOf = (id: string) => visible.filter((page) => page.parentId === id);
  const activeCount = pages.filter((page) => !page.archived).length;

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Screen fab={<FloatingAction label="New page" onPress={() => router.push('/page/new')} />}>
      <View style={styles.titleRow}>
        <ThemedText type="display" accessibilityRole="header">
          Notes
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ paddingBottom: Spacing.two }}>
          {activeCount} pages
        </ThemedText>
      </View>

      <View style={{ marginTop: 18 }}>
        <TextTabs label="Filter" options={filters} value={filter} onChange={setFilter} />
      </View>

      {filter === 'all' ? (
        <View style={styles.section}>
          <SectionLabel>Collections</SectionLabel>
          {collections.map((collection, index) => (
            <ListRow key={collection.id} last={index === collections.length - 1} style={styles.leaderRow}>
              <ThemedText type="item">{collection.name}</ThemedText>
              <DottedLeader />
              <ThemedText type="small" themeColor="textSecondary">
                {pages.filter((p) => p.collectionId === collection.id && !p.archived).length}
              </ThemedText>
            </ListRow>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionLabel ruled>Pages</SectionLabel>
        {roots.length === 0 ? (
          <EmptyState {...emptyMessages[filter]} />
        ) : (
          roots.map((page) => {
            const children = filter === 'all' ? childrenOf(page.id) : [];
            const isOpen = expanded.has(page.id);
            return (
              <Fragment key={page.id}>
                <PageRow
                  page={page}
                  childCount={children.length}
                  expanded={isOpen}
                  onToggle={children.length > 0 ? () => toggle(page.id) : undefined}
                  onOpen={() => router.push(`/page/${page.id}`)}
                />
                {isOpen
                  ? children.map((child) => (
                      <PageRow
                        key={child.id}
                        page={child}
                        nested
                        onOpen={() => router.push(`/page/${child.id}`)}
                      />
                    ))
                  : null}
              </Fragment>
            );
          })
        )}
      </View>
    </Screen>
  );
}

function DottedLeader() {
  const theme = useTheme();
  return <View style={[styles.leader, { borderBottomColor: theme.leader }]} />;
}

function PageRow({
  page,
  nested = false,
  childCount = 0,
  expanded = false,
  onToggle,
  onOpen,
}: {
  page: Page;
  nested?: boolean;
  childCount?: number;
  expanded?: boolean;
  onToggle?: () => void;
  onOpen: () => void;
}) {
  const theme = useTheme();

  return (
    <View>
      <View style={styles.pageRow}>
        {!nested ? (
          onToggle ? (
            <Pressable
              onPress={onToggle}
              accessibilityRole="button"
              accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${page.title}`}
              accessibilityState={{ expanded }}
              style={styles.disclosure}>
              <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} color={theme.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.disclosure} />
          )
        ) : null}
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          style={({ pressed }) => [styles.pageMain, nested && styles.nested, pressed && { opacity: 0.6 }]}>
          <ThemedText type="item" style={nested && { fontSize: 17, lineHeight: 22 }}>
            {page.title}
            {page.favorite ? (
              <ThemedText type="small" style={{ color: theme.accent }} accessibilityLabel="Favorite">
                {'  ★'}
              </ThemedText>
            ) : null}
          </ThemedText>
          {nested && page.tags.length > 0 ? (
            <ThemedText type="caption" style={{ color: theme.accent }}>
              {page.tags.map((tag) => `#${tag}`).join('  ')}
            </ThemedText>
          ) : (
            <ThemedText type="caption" themeColor="textSecondary">
              {childCount > 0 ? `${childCount} sub-pages · ` : ''}Edited {page.editedLabel.toLowerCase()}
            </ThemedText>
          )}
        </Pressable>
      </View>
      <Rule />
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  section: {
    paddingTop: Spacing.four,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  leader: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    transform: [{ translateY: -4 }],
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclosure: {
    width: 28,
    height: 52,
    marginLeft: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageMain: {
    flex: 1,
    gap: 2,
    paddingVertical: 12,
  },
  nested: {
    paddingLeft: 30,
  },
});
