import { FlashList } from '@shopify/flash-list';
import { ScrollView, View } from 'react-native';
import { Text } from './text';
type Row=(string | number | null | undefined)[];
const tableColumnWidth=120;
// Only the table scrolls sideways; the page and its actions stay within the viewport.
export function DataTable({ label, columns, rows }: { label: string; columns: string[]; rows: (string | number | null | undefined)[][] }) {
  return <View className="overflow-hidden rounded-card border border-border bg-surface"><ScrollView horizontal accessibilityLabel={label}><View style={rows.length>20 ? {width:columns.length*tableColumnWidth}:undefined}>
    <View className="flex-row bg-primary-soft">{columns.map((column, index) => <Text key={index} className="w-table-column px-2.5 py-2 text-caption font-semibold">{column}</Text>)}</View>
    {rows.length>20 ? <View className="h-select-list"><FlashList data={rows} renderItem={TableRow} keyExtractor={(row,index)=>`${row[0]}-${index}`} /></View> : rows.map((row,index)=><TableRow key={index} item={row} />)}
    {!rows.length && <Text variant="muted" className="p-3">Veri bulunamadı.</Text>}
  </View></ScrollView></View>;
}

function TableRow({item}: {item:Row}) {return <View className="flex-row border-t border-border">{item.map((value,cell)=><Text key={cell} className="w-table-column px-2.5 py-2 text-caption">{typeof value==='number'?value.toLocaleString('tr-TR',{maximumFractionDigits:3}):value ?? 'Veri yok'}</Text>)}</View>;}
