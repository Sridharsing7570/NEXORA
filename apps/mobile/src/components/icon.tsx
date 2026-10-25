import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

/**
 * App icon names mapped to SF Symbols (iOS) and Material Symbols (Android, web).
 * Add new icons here instead of passing raw symbol names around.
 */
const icons = {
  home: { ios: 'house', android: 'home', web: 'home' },
  notes: { ios: 'doc.text', android: 'description', web: 'description' },
  library: { ios: 'books.vertical', android: 'menu_book', web: 'menu_book' },
  journal: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  pen: { ios: 'pencil', android: 'edit', web: 'edit' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  starOutline: { ios: 'star', android: 'star', web: 'star' },
  folder: { ios: 'folder', android: 'folder', web: 'folder' },
  link: { ios: 'link', android: 'link', web: 'link' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'tune', web: 'tune' },
  highlight: { ios: 'highlighter', android: 'edit_note', web: 'edit_note' },
  paragraph: { ios: 'text.alignleft', android: 'notes', web: 'notes' },
  heading: { ios: 'textformat.size', android: 'title', web: 'title' },
  bulletList: { ios: 'list.bullet', android: 'format_list_bulleted', web: 'format_list_bulleted' },
  numberList: { ios: 'list.number', android: 'format_list_numbered', web: 'format_list_numbered' },
  todo: { ios: 'checkmark.square', android: 'check_box', web: 'check_box' },
  quote: { ios: 'text.quote', android: 'format_quote', web: 'format_quote' },
  code: {
    ios: 'chevron.left.forwardslash.chevron.right',
    android: 'code',
    web: 'code',
  },
  divider: { ios: 'minus', android: 'horizontal_rule', web: 'horizontal_rule' },
  image: { ios: 'photo', android: 'image', web: 'image' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  keyboardHide: {
    ios: 'keyboard.chevron.compact.down',
    android: 'keyboard_hide',
    web: 'keyboard_hide',
  },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
};

export function Icon({ name, size = 22, color }: IconProps) {
  return <SymbolView name={icons[name]} size={size} tintColor={color} />;
}
