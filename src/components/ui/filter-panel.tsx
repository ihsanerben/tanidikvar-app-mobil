import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { FormField } from './form-field';
import { Text } from './text';
import type { SelectionOption } from './tabs';

type Selection = { label: string; value: string; options: SelectionOption<string>[]; onChange: (value: string) => void };
const FilterSelectionContext = createContext<((selection: Selection) => void) | null>(null);

/** Compact web filter grid; option lists replace the grid in the same modal. */
export function FilterPanel({ visible, title, close, children }: PropsWithChildren<{ visible: boolean; title: string; close: () => void }>) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [search, setSearch] = useState('');
  const back = () => { setSelection(null); setSearch(''); };
  const options = selection?.options.filter(option => option.label.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))) ?? [];
  return <BottomSheet visible={visible} title={selection?.label ?? title} scroll={false} close={() => { if (selection) back(); else close(); }}>
    <FilterSelectionContext.Provider value={value => { setSearch(''); setSelection(value); }}>
      <ScrollView className={selection ? 'hidden' : 'shrink'} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-2">
        {children}
      </ScrollView>
      {selection && <View className="gap-2">
        <Button label="‹ Filtrelere dön" variant="secondary" size="small" onPress={back} />
        {selection.options.length > 8 && <FormField label={`${selection.label} ara`} hideLabel compact placeholder="Ara" value={search} onChangeText={setSearch} />}
        <View className="h-select-list" accessibilityRole="radiogroup" accessibilityLabel={selection.label}>
          <FlashList data={options} keyExtractor={item => item.value} extraData={selection.value}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text variant="muted">Sonuç bulunamadı.</Text>}
            renderItem={({ item }) => <Pressable accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: item.value === selection.value }}
              className={`min-h-touch-ios android:min-h-touch-android flex-row items-center gap-2 rounded-control px-2 py-2 ${item.value === selection.value ? 'bg-primary-soft' : 'bg-surface'}`}
              onPress={() => { selection.onChange(item.value); back(); }}>
              <Text variant="unstyled" className="min-w-0 flex-1 text-caption text-text">{item.label}</Text>
              {item.value === selection.value && <Text accessible={false} className="text-primary">✓</Text>}
            </Pressable>} />
        </View>
      </View>}
    </FilterSelectionContext.Provider>
  </BottomSheet>;
}

export function FilterRow({ children }: PropsWithChildren) {
  return <View className="flex-row items-start gap-2">{children}</View>;
}
export function FilterCell({ children }: PropsWithChildren) {
  return <View className="min-w-0 flex-1">{children}</View>;
}
export function FilterSelect<T extends string>({ label, value, options, onChange, disabled = false }: {
  label: string; value: T; options: SelectionOption<T>[]; onChange: (value: T) => void; disabled?: boolean;
}) {
  const open = useContext(FilterSelectionContext);
  const selected = options.find(option => option.value === value);
  return <View className="gap-1">
    <Text variant="unstyled" className="text-caption font-semibold text-muted">{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${selected?.label ?? 'Seç'}`} accessibilityState={{ disabled }} disabled={disabled}
      onPress={() => open?.({ label, value, options, onChange: next => onChange(next as T) })}
      className={`min-h-touch-ios android:min-h-touch-android justify-center ${disabled ? 'opacity-50' : 'active:opacity-80'}`}>
      <View className="min-h-control-compact flex-row items-center gap-1 rounded-control border border-secondary-border bg-filter-field px-2 py-1.5">
        <Text variant="unstyled" numberOfLines={1} className="min-w-0 flex-1 text-caption text-text">{selected?.label ?? 'Seç'}</Text>
        <Text variant="unstyled" accessible={false} className="text-caption text-muted">⌄</Text>
      </View>
    </Pressable>
  </View>;
}
