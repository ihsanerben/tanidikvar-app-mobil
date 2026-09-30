import type { Ref } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Text } from './text';

/** One visual field for catalog, tag and finite-option pickers. */
export function SelectionField({label,value,onPress,disabled=false,expanded=false,triggerRef,compact=false}: {
  compact?:boolean; label:string; value:string; onPress:()=>void; disabled?:boolean; expanded?:boolean; triggerRef?:Ref<View>;
}) {
  return <View className="gap-1">
    <Text variant="unstyled" className="text-caption font-bold text-muted">{label}</Text>
    <Pressable ref={triggerRef} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityHint="Seçenekleri açar" accessibilityState={{disabled,expanded}} disabled={disabled} onPress={onPress}
      className={`${Platform.OS==='android' ? 'min-h-touch-android' : 'min-h-touch-ios'} justify-center ${disabled ? 'opacity-50' : 'active:opacity-80'}`}>
      <View className="min-h-control-standard flex-row items-center justify-between gap-2 rounded-control border border-secondary-border bg-surface px-2.5 py-2">
        <Text variant="unstyled" numberOfLines={2} className={compact?"min-w-0 flex-1 text-metadata font-normal text-text":"min-w-0 flex-1 text-excerpt font-normal text-text"}>{value}</Text>
        <Text variant="unstyled" accessible={false} className="text-caption text-muted">⌄</Text>
      </View>
    </Pressable>
  </View>;
}
