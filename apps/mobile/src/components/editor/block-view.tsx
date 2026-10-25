import { Pressable, StyleSheet, TextInput, View, type TextStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { Block, BlockType } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';

export const blockTypes: { type: BlockType; label: string; icon: IconName }[] = [
  { type: 'paragraph', label: 'Text', icon: 'paragraph' },
  { type: 'heading1', label: 'Heading 1', icon: 'heading' },
  { type: 'heading2', label: 'Heading 2', icon: 'heading' },
  { type: 'heading3', label: 'Heading 3', icon: 'heading' },
  { type: 'bulleted_list', label: 'Bulleted list', icon: 'bulletList' },
  { type: 'numbered_list', label: 'Numbered list', icon: 'numberList' },
  { type: 'todo', label: 'To-do', icon: 'todo' },
  { type: 'quote', label: 'Quote', icon: 'quote' },
  { type: 'code', label: 'Code', icon: 'code' },
  { type: 'divider', label: 'Divider', icon: 'divider' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'link', label: 'Link', icon: 'link' },
];

const placeholders: Partial<Record<BlockType, string>> = {
  paragraph: 'Type something…',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bulleted_list: 'List item',
  numbered_list: 'List item',
  todo: 'To-do',
  quote: 'Quote',
  code: 'Code',
  link: 'https://',
};

const reading: TextStyle = { fontFamily: Fonts.serif, fontSize: 18, lineHeight: 28 };

const textStyles: Partial<Record<BlockType, TextStyle>> = {
  paragraph: reading,
  heading1: { fontFamily: Fonts.serif, fontSize: 28, lineHeight: 34 },
  heading2: { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 28, fontWeight: 500 },
  heading3: { fontFamily: Fonts.serif, fontSize: 19, lineHeight: 25, fontWeight: 600 },
  bulleted_list: reading,
  numbered_list: reading,
  todo: reading,
  quote: { ...reading, fontStyle: 'italic' },
  code: { fontFamily: Fonts.mono, fontSize: 13, lineHeight: 20 },
  link: { fontSize: 16, lineHeight: 24 },
};

type BlockViewProps = {
  block: Block;
  /** 1-based position within a run of numbered list items. */
  listNumber: number;
  onChange: (patch: Partial<Block>) => void;
  onFocus: () => void;
};

export function BlockView({ block, listNumber, onChange, onFocus }: BlockViewProps) {
  const theme = useTheme();

  if (block.type === 'divider') {
    return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
  }

  if (block.type === 'image') {
    return (
      <Pressable
        onPress={onFocus}
        accessibilityRole="button"
        accessibilityLabel="Add image"
        style={[styles.image, { borderColor: theme.leader }]}>
        <Icon name="image" size={24} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">
          Tap to add an image
        </ThemedText>
      </Pressable>
    );
  }

  const done = block.type === 'todo' && block.checked;
  const color = done
    ? theme.textSecondary
    : block.type === 'link'
      ? theme.accent
      : block.type === 'quote'
        ? theme.textBody
        : theme.text;

  const input = (
    <TextInput
      multiline
      value={block.content}
      onChangeText={(content) => onChange({ content })}
      onFocus={onFocus}
      placeholder={placeholders[block.type]}
      placeholderTextColor={theme.textSecondary}
      accessibilityLabel={blockTypes.find((item) => item.type === block.type)?.label}
      autoCapitalize={block.type === 'code' || block.type === 'link' ? 'none' : 'sentences'}
      autoCorrect={block.type !== 'code' && block.type !== 'link'}
      keyboardType={block.type === 'link' ? 'url' : 'default'}
      style={[styles.input, textStyles[block.type], { color }, done && styles.done]}
    />
  );

  switch (block.type) {
    case 'bulleted_list':
    case 'numbered_list':
      return (
        <View style={styles.row}>
          <ThemedText type="reading" style={styles.marker}>
            {block.type === 'bulleted_list' ? '•' : `${listNumber}.`}
          </ThemedText>
          {input}
        </View>
      );
    case 'todo':
      return (
        <View style={styles.row}>
          <Pressable
            onPress={() => onChange({ checked: !block.checked })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: Boolean(block.checked) }}
            hitSlop={12}
            style={[
              styles.checkbox,
              { borderColor: theme.text },
              block.checked && { backgroundColor: theme.text },
            ]}>
            {block.checked ? <Icon name="check" size={13} color={theme.background} /> : null}
          </Pressable>
          {input}
        </View>
      );
    case 'quote':
      return <View style={[styles.quote, { borderLeftColor: theme.accent }]}>{input}</View>;
    case 'code':
      return <View style={[styles.code, { backgroundColor: theme.backgroundSelected }]}>{input}</View>;
    case 'link':
      return (
        <View style={[styles.row, styles.linkRow]}>
          <Icon name="link" size={18} color={theme.accent} />
          {input}
        </View>
      );
    default:
      return input;
  }
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    padding: 0,
    minHeight: 28,
    textAlignVertical: 'top',
  },
  done: {
    textDecorationLine: 'line-through',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three - Spacing.one,
  },
  marker: {
    minWidth: 14,
  },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 5,
    borderRadius: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quote: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.three,
  },
  code: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
  },
  linkRow: {
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    marginVertical: Spacing.two,
  },
  image: {
    height: 140,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
