import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ListRow, PillButton, SectionLabel } from '@/components/ui/primitives';
import { Fonts, Spacing } from '@/constants/theme';
import { createId, journalEntries, type JournalEntry } from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';

type Section = 'learned' | 'challenges' | 'reflection';

const sections: { key: Section; label: string; placeholder: string }[] = [
  { key: 'learned', label: 'What I learned', placeholder: 'One thing that clicked today…' },
  { key: 'challenges', label: 'Challenges & questions', placeholder: 'What was hard or still unclear?' },
  { key: 'reflection', label: 'Reflection', placeholder: 'Tap to write a reflection…' },
];

function dayInfo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    initial: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
    short: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
    day: date.getDate(),
    long: date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
    month: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  };
}

export default function JournalScreen() {
  const theme = useTheme();
  const [entries, setEntries] = useState<JournalEntry[]>(journalEntries);
  const [selected, setSelected] = useState(0);

  const entry = entries.find((item) => item.daysAgo === selected);
  const earlier = entries
    .filter((item) => item.daysAgo !== selected)
    .sort((a, b) => a.daysAgo - b.daysAgo);

  const updateEntry = (id: string, key: Section, value: string) =>
    setEntries((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));

  const startEntry = () =>
    setEntries((current) => [
      ...current,
      { id: createId(), daysAgo: selected, title: '', learned: '', challenges: '', reflection: '' },
    ]);

  return (
    <Screen>
      <ThemedText type="overline" themeColor="textSecondary" style={{ fontSize: 12 }}>
        {dayInfo(0).month}
      </ThemedText>
      <ThemedText type="display" accessibilityRole="header" style={{ marginTop: Spacing.two }}>
        Journal
      </ThemedText>

      <View style={[styles.week, { borderTopColor: theme.rule, borderBottomColor: theme.border }]}>
        {[6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
          const info = dayInfo(daysAgo);
          const isSelected = daysAgo === selected;
          const hasEntry = entries.some((item) => item.daysAgo === daysAgo);
          const color = isSelected ? theme.accent : theme.text;
          return (
            <Pressable
              key={daysAgo}
              onPress={() => setSelected(daysAgo)}
              accessibilityRole="button"
              accessibilityLabel={`${daysAgo === 0 ? 'Today, ' : ''}${info.long}${hasEntry ? ', has entry' : ''}`}
              accessibilityState={{ selected: isSelected }}
              style={[styles.day, isSelected && { borderBottomColor: theme.accent }]}>
              <ThemedText type="caption" style={{ color: isSelected ? theme.accent : theme.textSecondary }}>
                {info.initial}
              </ThemedText>
              <ThemedText type="item" style={{ color, fontWeight: isSelected ? 500 : 400 }}>
                {info.day}
              </ThemedText>
              <View style={[styles.dot, hasEntry && { backgroundColor: color }]} />
            </Pressable>
          );
        })}
      </View>

      {entry ? (
        <View style={styles.entry}>
          <View style={styles.entryHeader}>
            <ThemedText type="heading" style={{ fontStyle: 'italic', fontWeight: 400, fontSize: 26, lineHeight: 32 }}>
              {selected === 0 ? 'Today' : dayInfo(selected).long}
            </ThemedText>
          </View>
          {sections.map((section) => (
            <View key={section.key} style={styles.entrySection}>
              <ThemedText type="overline" themeColor="textSecondary">
                {section.label}
              </ThemedText>
              <TextInput
                multiline
                accessibilityLabel={section.label}
                value={entry[section.key]}
                onChangeText={(value) => updateEntry(entry.id, section.key, value)}
                placeholder={section.placeholder}
                placeholderTextColor={theme.textSecondary}
                style={[styles.entryInput, { color: theme.text }]}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyEntry}>
          <ThemedText type="heading" style={{ fontStyle: 'italic', fontWeight: 400 }}>
            Nothing written on {dayInfo(selected).long}.
          </ThemedText>
          <ThemedText type="reading" themeColor="textBody">
            Write down what you learned, what was hard, and how the day went.
          </ThemedText>
          <PillButton label="Start entry" onPress={startEntry} />
        </View>
      )}

      {earlier.length > 0 ? (
        <View style={styles.earlier}>
          <SectionLabel ruled>This week</SectionLabel>
          {earlier.map((item, index) => (
            <ListRow
              key={item.id}
              last={index === earlier.length - 1}
              onPress={() => setSelected(item.daysAgo)}
              label={`Open entry for ${dayInfo(item.daysAgo).long}`}
              style={styles.pastRow}>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.pastDate}>
                {dayInfo(item.daysAgo).short}
              </ThemedText>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="item" style={{ fontSize: 18 }}>
                  {item.title || 'Untitled entry'}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                  {item.learned || 'Nothing written yet'}
                </ThemedText>
              </View>
            </ListRow>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  week: {
    flexDirection: 'row',
    marginTop: 18,
    borderTopWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  day: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  entry: {
    paddingTop: 22,
    gap: 20,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  entrySection: {
    gap: 6,
  },
  entryInput: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 28,
    minHeight: 44,
    padding: 0,
    textAlignVertical: 'top',
  },
  emptyEntry: {
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  earlier: {
    paddingTop: Spacing.five,
  },
  pastRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 13,
  },
  pastDate: {
    width: 48,
    paddingTop: 4,
  },
});
