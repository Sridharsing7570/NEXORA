import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { blockTypes, BlockView } from '@/components/editor/block-view';
import { Icon, type IconName } from '@/components/icon';
import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { IconButton, Rule } from '@/components/ui/primitives';
import { Fonts, MaxContentWidth, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { createId, findCollection, findPage, type Block, type BlockType } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';

/** Block types the toolbar can switch the focused block to in one tap. */
const quickTypes: { type: BlockType; label: string; icon: IconName }[] = [
  { type: 'heading2', label: 'Turn into heading', icon: 'heading' },
  { type: 'bulleted_list', label: 'Turn into bulleted list', icon: 'bulletList' },
  { type: 'todo', label: 'Turn into to-do', icon: 'todo' },
  { type: 'quote', label: 'Turn into quote', icon: 'quote' },
  { type: 'code', label: 'Turn into code', icon: 'code' },
];

/**
 * Prototype block editor: one plain-text input per block, held in local state.
 * It exists to try out mobile editing behaviour before committing to an editor library;
 * saving, rich text and drag-to-reorder come later.
 */
export default function PageEditorScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const source = id === 'new' ? undefined : findPage(id);

  const [title, setTitle] = useState(source?.title ?? '');
  const [favorite, setFavorite] = useState(source?.favorite ?? false);
  const [blocks, setBlocks] = useState<Block[]>(
    () => source?.blocks ?? [{ id: createId(), type: 'paragraph', content: '' }],
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const updateBlock = (blockId: string, patch: Partial<Block>) =>
    setBlocks((current) => current.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));

  const insertBlock = (type: BlockType) => {
    const block: Block = { id: createId(), type, content: '', checked: type === 'todo' ? false : undefined };
    setBlocks((current) => {
      const index = current.findIndex((item) => item.id === focusedId);
      if (index < 0) return [...current, block];
      return [...current.slice(0, index + 1), block, ...current.slice(index + 1)];
    });
    setFocusedId(block.id);
    setMenuOpen(false);
  };

  const convertFocused = (type: BlockType) => {
    if (!focusedId) return;
    const focused = blocks.find((block) => block.id === focusedId);
    // Tapping the active type again turns the block back into plain text.
    updateBlock(focusedId, { type: focused?.type === type ? 'paragraph' : type });
  };

  // Numbered list items count up within each consecutive run.
  const listNumbers = blocks.reduce<number[]>((numbers, block, index) => {
    const previous = index > 0 && blocks[index - 1]?.type === 'numbered_list' ? (numbers[index - 1] ?? 0) : 0;
    numbers.push(block.type === 'numbered_list' ? previous + 1 : 0);
    return numbers;
  }, []);

  const collection = source ? findCollection(source.collectionId) : undefined;
  const parent = source?.parentId ? findPage(source.parentId) : undefined;
  const breadcrumb = [collection?.name, parent?.title].filter(Boolean).join(' / ');

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top }}>
        <StackHeader
          backLabel="Notes"
          actions={
            <IconButton
              icon={favorite ? 'star' : 'starOutline'}
              label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              color={favorite ? theme.accent : theme.text}
              onPress={() => setFavorite((value) => !value)}
            />
          }
        />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {breadcrumb ? (
          <ThemedText type="overline" themeColor="textSecondary">
            {breadcrumb}
          </ThemedText>
        ) : null}

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Untitled"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Page title"
          multiline
          autoFocus={!source}
          style={[styles.title, { color: theme.text }]}
        />

        {source && source.tags.length > 0 ? (
          <ThemedText type="small" style={{ color: theme.accent }}>
            {source.tags.map((tag) => `#${tag}`).join('  ')}
          </ThemedText>
        ) : null}

        <Rule strong style={styles.titleRule} />

        <View style={styles.blocks}>
          {blocks.map((block, index) => (
            <BlockView
              key={block.id}
              block={block}
              listNumber={listNumbers[index] ?? 0}
              onChange={(patch) => updateBlock(block.id, patch)}
              onFocus={() => setFocusedId(block.id)}
            />
          ))}
        </View>

        <Pressable onPress={() => setMenuOpen(true)} accessibilityRole="button" style={styles.addBlock}>
          <ThemedText type="reading" themeColor="textSecondary" style={{ fontStyle: 'italic' }}>
            + Add a block
          </ThemedText>
        </Pressable>
      </ScrollView>

      <View
        accessibilityRole="toolbar"
        style={[
          styles.toolbar,
          { borderTopColor: theme.rule, paddingBottom: Math.max(insets.bottom, Spacing.two) },
        ]}>
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Insert block"
          style={[styles.insertButton, { backgroundColor: theme.buttonBackground }]}>
          <ThemedText type="smallBold" style={{ color: theme.buttonText }}>
            + Block
          </ThemedText>
        </Pressable>
        {quickTypes.map((item) => (
          <IconButton key={item.type} icon={item.icon} label={item.label} onPress={() => convertFocused(item.type)} />
        ))}
        <IconButton icon="keyboardHide" label="Hide keyboard" onPress={Keyboard.dismiss} />
      </View>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close block menu"
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.three },
          ]}>
          <ThemedText type="overline" themeColor="textSecondary" style={styles.sheetTitle}>
            Insert block
          </ThemedText>
          <Rule strong />
          <ScrollView>
            {blockTypes.map((item, index) => (
              <Pressable
                key={item.type}
                onPress={() => insertBlock(item.type)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.option,
                  index < blockTypes.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth * 2,
                    borderBottomColor: theme.border,
                  },
                  pressed && { backgroundColor: theme.backgroundSelected },
                ]}>
                <Icon name={item.icon} size={18} color={theme.textSecondary} />
                <ThemedText type="item" style={{ fontSize: 18 }}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: 10,
    paddingHorizontal: 28,
    paddingTop: Spacing.three - Spacing.one,
    paddingBottom: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: 400,
    padding: 0,
  },
  titleRule: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  blocks: {
    gap: 14,
  },
  addBlock: {
    minHeight: TouchTarget,
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three - Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  insertButton: {
    height: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    maxHeight: '60%',
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.gutter,
  },
  sheetTitle: {
    paddingBottom: Spacing.one,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 52,
  },
});
