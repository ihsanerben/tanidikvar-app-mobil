import {useEffect,useRef} from 'react';
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
export function Tabs<T extends string>({ label, value, options, onChange, variant = "segmented", tone = "primary", compact = false, fill = false, revealSelected = false }: {
  compact?: boolean;
  fill?: boolean;
  revealSelected?: boolean;
  label: string;
  value: T;
  options: SelectionOption<T>[];
  onChange: (value: T) => void;
  variant?: "segmented" | "navigation" | "filled" | "pills";
  tone?: "primary" | "candidate" | "student" | "graduate";
}) {
  if (variant === "pills") {
    const pills = options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityLabel={option.label} aria-selected={value === option.value} accessibilityState={{ selected: value === option.value }} onPress={() => { if (value !== option.value) onChange(option.value); }} className="min-h-touch-ios android:min-h-touch-android justify-center">
      <View className={(compact ? "rounded-full border px-2 py-1 " : "rounded-full border px-3 py-2 ") + (value === option.value ? "border-primary bg-primary-soft" : "border-border bg-surface")}><Text variant="muted" className={compact ? "text-metadata font-semibold text-primary" : "font-semibold text-primary"}>{option.label}</Text></View>
    </Pressable>);
    return compact ? <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="items-center gap-1" accessibilityRole="tablist" accessibilityLabel={label}>{pills}</ScrollView> : <View accessibilityRole="tablist" accessibilityLabel={label} className="flex-row flex-wrap gap-x-2">{pills}</View>;
  }
  if (fill) return <View accessibilityRole="tablist" accessibilityLabel={label} className="w-full flex-row rounded-control border border-tab-border bg-tab-track p-1">
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityLabel={option.label} accessibilityState={{ selected: value === option.value }} onPress={() => { if (value !== option.value) onChange(option.value); }} className="min-h-touch-ios android:min-h-touch-android min-w-0 flex-1 justify-center">
      <View pointerEvents="none" className={surface({ selected: value === option.value, mode: variant === 'filled' ? 'filled' : 'segmented', tone, className: 'min-w-0 px-1' })}><Text variant="unstyled" className={"text-center text-metadata font-semibold " + (variant === 'filled' && value === option.value ? 'text-primary-foreground' : 'text-primary')}>{option.label}</Text></View>
    </Pressable>)}
  </View>;
  if (compact) return <NavigationTabs label={label} value={value} options={options} onChange={onChange} revealSelected={revealSelected} mode={variant==='filled'?'filled':'segmented'} tone={tone}/>;
  if (variant === 'navigation') return <NavigationTabs label={label} value={value} options={options} onChange={onChange} revealSelected={revealSelected}/>;
  return <View accessibilityRole="tablist" accessibilityLabel={label}
    className="flex-row flex-wrap gap-1 rounded-control border border-tab-border bg-tab-track p-1">
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab"
      accessibilityLabel={option.label} aria-selected={value === option.value} accessibilityState={{ selected: value === option.value }}
      className={target({ platform: Platform.OS === "android" ? "android" : "ios", className: options.length > 2 ? "min-w-table-column" : undefined })}
      onPress={() => { if (value !== option.value) onChange(option.value); }}>
      <View pointerEvents="none" className={surface({ selected: value === option.value, mode: variant === "filled" ? "filled" : "segmented", tone })}>
        <Text variant="unstyled" className={"text-center text-metadata font-semibold " + (variant === "filled" && value === option.value ? "text-primary-foreground" : "text-primary")}>{option.label}</Text>
      </View>
    </Pressable>)}
  </View>;
}

function NavigationTabs<T extends string>({label,value,options,onChange,revealSelected,mode,tone="primary"}:{mode?:"segmented"|"filled";tone?:"primary"|"candidate"|"student"|"graduate";label:string;value:T;options:SelectionOption<T>[];onChange:(value:T)=>void;revealSelected:boolean}) {
 const scroll=useRef<ScrollView>(null),width=useRef(0),offset=useRef(0),positions=useRef(new Map<string,{x:number;width:number}>());
 const reveal=(animated:boolean)=>{
   if(!revealSelected||!width.current)return;
   const item=positions.current.get(value);if(!item)return;
   const next=item.x<offset.current?item.x:item.x+item.width>offset.current+width.current?item.x+item.width-width.current:offset.current;
   if(next!==offset.current){offset.current=Math.max(0,next);scroll.current?.scrollTo({x:offset.current,animated});}
 };
 useEffect(()=>{reveal(true);});
 return <ScrollView showsVerticalScrollIndicator={false} ref={scroll} onScroll={event=>{offset.current=event.nativeEvent.contentOffset.x;}} scrollEventThrottle={16} onLayout={event=>{width.current=event.nativeEvent.layout.width;reveal(false);}} className={mode?"flex-grow-0 rounded-control border border-tab-border bg-tab-track":"flex-grow-0"} horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={mode?"min-w-full items-center gap-1 px-1":"items-center gap-3"} accessibilityRole="tablist" accessibilityLabel={label}>{options.map(option=><Pressable key={option.value} onLayout={event=>{positions.current.set(option.value,event.nativeEvent.layout);if(value===option.value)reveal(false);}} accessibilityRole="tab" accessibilityLabel={option.label} aria-selected={value===option.value} accessibilityState={{selected:value===option.value}} onPress={()=>{if(value!==option.value)onChange(option.value);}} className={target({platform:Platform.OS==='android'?'android':'ios',className:mode?'flex-none':('flex-none border-b-2 px-1 '+(value===option.value?'border-primary':'border-transparent'))})}><View className={mode?surface({selected:value===option.value,mode,tone}):undefined}><Text key={value===option.value?"selected":"idle"} variant="unstyled" className={"text-caption font-semibold "+(mode==='filled'&&value===option.value?"text-primary-foreground":"text-primary")}>{option.label}</Text></View></Pressable>)}</ScrollView>;
}
