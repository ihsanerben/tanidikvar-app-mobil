import { useContext, useRef, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, View } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { cva } from "class-variance-authority";
import { BottomSheet, DialogContentContext } from "./bottom-sheet";
import { SelectionField } from "./selection-field";
import { Text } from "./text";
import type { SelectionOption } from "./tabs";

const control = cva("flex-row items-center justify-between gap-2 rounded-control border border-secondary-border bg-surface px-2.5 py-2", {
  variants: {
    platform: { ios: "min-h-touch-ios", android: "min-h-touch-android" },
    disabled: { true: "opacity-50", false: "active:opacity-80" },
  },
});
const optionStyle = cva("flex-row items-center justify-between gap-3 rounded-control px-3 py-2", {
  variants: {
    platform: { ios: "min-h-touch-ios", android: "min-h-touch-android" },
    selected: { true: "bg-primary-soft", false: "bg-surface" },
  },
});

export function Select<T extends string>({ label, value, options, onChange, disabled = false }: {
  label: string;
  value: T;
  options: SelectionOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const insideDialog = useContext(DialogContentContext);
  const trigger = useRef<View>(null);
  const platform = Platform.OS === "android" ? "android" : "ios";
  const selected = options.find(option => option.value === value);
  const close = () => {
    setOpen(false);
  };
  const restoreFocus = () => {
    if (trigger.current) AccessibilityInfo.sendAccessibilityEvent?.(trigger.current, "focus");
  };
  const renderOption: ListRenderItem<SelectionOption<T>> = ({ item }) => <Pressable
    accessibilityRole="radio" accessibilityLabel={item.label}
    accessibilityState={{ checked: item.value === value }}
    className={optionStyle({ platform, selected: item.value === value })}
    onPress={() => { onChange(item.value); close(); }}>
    <Text className="min-w-0 flex-1">{item.label}</Text>
    {item.value === value && <Text accessible={false} className="text-primary">✓</Text>}
  </Pressable>;

  return <View className="gap-2">
    <SelectionField label={label} value={selected?.label ?? 'Seç'} onPress={()=>setOpen(true)} disabled={disabled} expanded={open} triggerRef={trigger} />
    {insideDialog ? open && !disabled && <View className="gap-2 rounded-control border border-border p-2">
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} seçeneklerini kapat`}
        className={control({ platform })} onPress={close}><Text>Seçenekleri kapat</Text></Pressable>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} className="h-select-list">
        <FlashList data={options} keyExtractor={item => item.value} renderItem={renderOption} extraData={value} />
      </View>
    </View> : <BottomSheet visible={open && !disabled} title={label} close={close} scroll={false} onDismiss={restoreFocus}>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} className="h-select-list">
        <FlashList data={options} keyExtractor={item => item.value} renderItem={renderOption}
          extraData={value} />
      </View>
    </BottomSheet>}
  </View>;
}
