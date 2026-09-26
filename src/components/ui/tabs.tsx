import { Platform, Pressable, View } from "react-native";
import { cva } from "class-variance-authority";
import { Text } from "./text";

export type SelectionOption<T extends string> = { value: T; label: string };

const target = cva("min-w-0 flex-1 justify-center active:opacity-80", {
  variants: { platform: { ios: "min-h-touch-ios", android: "min-h-touch-android" } },
});
const surface = cva("min-h-control-compact items-center justify-center rounded-control px-2 py-1.5", {
  variants: { selected: { true: "bg-surface", false: "bg-transparent" } },
});

// Account/history tabs share the web's pale track and white active surface.
// Labels can wrap with large fonts instead of hiding content off screen.
export function Tabs<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: SelectionOption<T>[];
  onChange: (value: T) => void;
}) {
  return <View accessibilityRole="tablist" accessibilityLabel={label}
    className="flex-row flex-wrap gap-1 rounded-control border border-tab-border bg-tab-track p-1">
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab"
      accessibilityLabel={option.label} accessibilityState={{ selected: value === option.value }}
      className={target({ platform: Platform.OS === "android" ? "android" : "ios" })}
      onPress={() => onChange(option.value)}>
      <View pointerEvents="none" className={surface({ selected: value === option.value })}>
        <Text className="text-center text-metadata font-semibold text-primary">{option.label}</Text>
      </View>
    </Pressable>)}
  </View>;
}
