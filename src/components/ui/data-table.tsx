import { FlashList } from '@shopify/flash-list';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Text } from './text';
type Row = (string | number | null | undefined)[];
const display = (value: Row[number]) => typeof value === 'number' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 3 }) : value ?? 'Veri yok';
export function DataTable({ label, columns, rows, fixedFirstColumn = false, firstColumnWidth = 112, regularWeight = false, compact = false, fit = false }: { label: string; columns: string[]; rows: Row[]; fixedFirstColumn?: boolean; firstColumnWidth?: number; regularWeight?: boolean; compact?: boolean; fit?: boolean }) {
  const { fontScale } = useWindowDimensions();
  const columnWidth = compact ? 72 : 120;
  const cellText = compact ? 'text-metadata leading-4' : 'text-caption';
  if (fixedFirstColumn && !fit && columns.length > 1) {
    // Both panes share row heights, including when system text is enlarged.
    const rowHeight = Math.ceil((compact ? 80 : 96) * fontScale);
    const headerHeight = Math.ceil((compact ? 64 : 80) * fontScale);
    return <View className="flex-row overflow-hidden rounded-card border border-border bg-surface" accessibilityLabel={label}>
      <View style={{ width: firstColumnWidth }} className="border-r border-border bg-primary-soft">
        <View style={{ minHeight: headerHeight }} className="justify-center px-1.5 py-1"><Text className={`${cellText} font-bold`}>{columns[0]}</Text></View>
        {rows.map((row,index) => <View key={index} style={{ minHeight: rowHeight }} className="justify-center border-t border-border px-1.5 py-1"><Text className={`${cellText} ${regularWeight ? 'font-normal' : 'font-semibold'}`}>{display(row[0])}</Text></View>)}
      </View>
      <ScrollView showsHorizontalScrollIndicator={false} horizontal className="min-w-0 flex-1" accessibilityLabel={`${label} ölçüt değerleri`}><View>
        <View className="flex-row bg-primary-soft">{columns.slice(1).map((column,index) => <View key={index} style={{ width: columnWidth, minHeight: headerHeight }} className="justify-center px-1.5 py-1"><Text className={`${cellText} font-bold`}>{column}</Text></View>)}</View>
        {rows.map((row,index) => <View key={index} style={{ minHeight: rowHeight }} className="flex-row items-center border-t border-border">{row.slice(1).map((value,cell) => <Text key={cell} style={{ width: columnWidth }} className={`px-1.5 py-1 font-normal ${cellText}`}>{display(value)}</Text>)}</View>)}
      </View></ScrollView>
    </View>;
  }
  const content = <View style={fit ? { width: '100%' } : { width: columns.length * columnWidth }}>
    <View className="flex-row bg-primary-soft">{columns.map((column,index) => <Text key={index} style={fit ? { flex: 1, minWidth: 0 } : { width: columnWidth }} className={`px-1 py-1.5 font-bold ${cellText}`}>{column}</Text>)}</View>
    {rows.length > 20 ? <View className="h-select-list"><FlashList data={rows} renderItem={({item}) => <TableRow item={item} compact={compact} fit={fit}/>} keyExtractor={(row,index) => `${row[0]}-${index}`}/></View> : rows.map((row,index) => <TableRow key={index} item={row} compact={compact} fit={fit}/>)}
    {!rows.length && <Text variant="muted" className="p-3">Veri bulunamadı.</Text>}
  </View>;
  return <View accessibilityLabel={label} className="overflow-hidden rounded-card border border-border bg-surface">{fit ? content : <ScrollView horizontal showsHorizontalScrollIndicator={false}>{content}</ScrollView>}</View>;
}
function TableRow({item,compact,fit}: {item:Row;compact:boolean;fit:boolean}) {
  return <View className="flex-row border-t border-border">{item.map((value,cell) => <Text key={cell} style={fit ? { flex: 1, minWidth: 0 } : { width: compact ? 72 : 120 }} className={compact ? 'px-1 py-1.5 text-metadata leading-4 font-normal' : 'px-1 py-2 text-caption font-normal'}>{display(value)}</Text>)}</View>;
}
