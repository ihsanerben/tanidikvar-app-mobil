import { Platform, Pressable, ScrollView, View } from "react-native";
import { cva } from "class-variance-authority";
import { Text } from "./text";

export type SelectionOption<T extends string> = { value: T; label: string };

const target = cva("min-w-0 flex-1 justify-center active:opacity-80", {
  variants: { platform: { ios: "min-h-touch-ios", android: "min-h-touch-android" } },
});
const surface = cva("min-h-control-compact items-center justify-center rounded-control px-2 py-1.5", {
  variants: { selected: { true: '', false: 'bg-transparent' }, mode: { segmented: '', filled: '' }, tone: { primary: '', candidate: '', student: '', graduate: '' } },
  compoundVariants: [
    {selected:true,mode:'segmented',className:'bg-surface'},
    {selected:true,mode:'filled',tone:'primary',className:'bg-primary'},
    {selected:true,mode:'filled',tone:'candidate',className:'bg-candidate'},
    {selected:true,mode:'filled',tone:'student',className:'bg-profile-student'},
    {selected:true,mode:'filled',tone:'graduate',className:'bg-graduate'},
  ],
});

// Account/history tabs share the web's pale track and white active surface.
// Labels can wrap with large fonts instead of hiding content off screen.
export function Tabs<T extends string>({ label, value, options, onChange, variant = "segmented", tone = "primary", compact = false }: {
  compact?: boolean;
  label: string;
  value: T;
  options: SelectionOption<T>[];
  onChange: (value: T) => void;
  variant?: "segmented" | "navigation" | "filled" | "pills";
  tone?: "primary" | "candidate" | "student" | "graduate";
}) {
  if (variant === "pills") return <View accessibilityRole="tablist" accessibilityLabel={label} className="flex-row flex-wrap gap-x-2">
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityLabel={option.label} accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} className="min-h-touch-ios android:min-h-touch-android justify-center">
      <View className={"rounded-full border px-3 py-2 " + (value === option.value ? "border-primary bg-primary-soft" : "border-border bg-surface")}><Text variant="muted" className="font-semibold text-primary">{option.label}</Text></View>
    </Pressable>)}
  </View>;
  if (compact) return <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0 rounded-control border border-tab-border bg-tab-track" contentContainerClassName="min-w-full flex-row items-center gap-0.5 px-1" accessibilityRole="tablist" accessibilityLabel={label}>
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityLabel={option.label} accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} className="min-h-touch-ios android:min-h-touch-android min-w-touch-ios flex-grow justify-center">
      <View className={surface({ selected: value === option.value, mode: 'segmented', tone, className: 'min-h-control-small px-1.5 py-1' })}><Text variant="unstyled" numberOfLines={1} className="text-metadata font-semibold text-primary">{option.label}</Text></View>
    </Pressable>)}
  </ScrollView>;
  if (variant === 'navigation') return <ScrollView className="flex-grow-0" horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="items-center gap-3" accessibilityRole="tablist" accessibilityLabel={label}>{options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityLabel={option.label} accessibilityState={{selected:value===option.value}} onPress={()=>onChange(option.value)} className={target({platform:Platform.OS==='android'?'android':'ios',className:'flex-none border-b-2 px-1 '+(value===option.value?'border-primary':'border-transparent')})}><Text variant="unstyled" className="text-caption font-semibold text-primary">{option.label}</Text></Pressable>)}</ScrollView>;
  return <View accessibilityRole="tablist" accessibilityLabel={label}
    className="flex-row flex-wrap gap-1 rounded-control border border-tab-border bg-tab-track p-1">
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab"
      accessibilityLabel={option.label} accessibilityState={{ selected: value === option.value }}
      className={target({ platform: Platform.OS === "android" ? "android" : "ios", className: options.length > 2 ? "min-w-table-column" : undefined })}
      onPress={() => onChange(option.value)}>
      <View pointerEvents="none" className={surface({ selected: value === option.value, mode: variant === "filled" ? "filled" : "segmented", tone })}>
        <Text variant="unstyled" className={"text-center text-metadata font-semibold " + (variant === "filled" && value === option.value ? "text-primary-foreground" : "text-primary")}>{option.label}</Text>
      </View>
    </Pressable>)}
  </View>;
}
