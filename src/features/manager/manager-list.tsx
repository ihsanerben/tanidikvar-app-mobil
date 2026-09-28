import { View } from 'react-native';
import { PagedList } from '@/components/ui/paged-list';
import { Text } from '@/components/ui/text';
export function ManagerList<T extends {id?:string}>({title,header,...props}: Parameters<typeof PagedList<T>>[0] & {title:string}) {
  return <View className="flex-1 px-gutter pt-5"><PagedList {...props} header={<View className="gap-3 pb-4"><Text variant="title">{title}</Text>{header}</View>} /></View>;
}
