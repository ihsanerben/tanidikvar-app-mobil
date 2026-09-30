import { useState, type ReactElement } from "react";
import { View } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { ErrorState, EmptyState, Skeleton, useOffline } from "./states";
import { Button } from "./button";
import { BrandFooter } from "./brand-footer";
type Page<T> = {
  items?: T[];
  page?: number;
  size?: number;
  totalElements?: number;
};
export function PagedList<T extends { id?: string }>({
  query,
  renderItem,
  header,
  empty,
  footer,
  maintainPosition = true,
  mapItems,
  numColumns = 1,
}: {
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>, Error>;
  renderItem: ListRenderItem<T>;
  header?: ReactElement;
  empty?: ReactElement;
  footer?: ReactElement;
  maintainPosition?: boolean;
  mapItems?: (items: T[]) => T[];
  numColumns?: number;
}) {
  const offline = useOffline();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const loaded = query.data?.pages.flatMap((page) => page.items ?? []) ?? [];
  const data = mapItems ? mapItems(loaded) : loaded;
  // v2 measures rows automatically; estimatedItemSize is a removed v1 prop.
  return (
    <FlashList showsVerticalScrollIndicator={false}
      data={data}
      numColumns={numColumns}
      maintainVisibleContentPosition={{ disabled: !maintainPosition }}
      renderItem={renderItem}
      keyExtractor={(item) => item.id!}
      ListHeaderComponent={header}
      ItemSeparatorComponent={Separator}
      refreshing={pullRefreshing}
      onRefresh={() => {
        setPullRefreshing(true);
        void query.refetch().finally(() => setPullRefreshing(false));
      }}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetching && !query.isError)
          void query.fetchNextPage();
      }}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        query.isPending && offline ? (
          <EmptyState title="Bağlantı bekleniyor" description="Bu listeyi ilk kez yüklemek için internete bağlan." />
        ) : query.isPending ? (
          <Skeleton />
        ) : query.isError ? (
          <ErrorState
            error={query.error}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : (
          empty ?? <EmptyState
            action={() => {
              void query.refetch();
            }}
          />
        )
      }
      ListFooterComponent={
        <View className="gap-3 py-5">
          {data.length > 0 && query.isError && (
            <ErrorState
              error={query.error}
              retry={() => {
                void (query.isFetchNextPageError
                  ? query.fetchNextPage()
                  : query.refetch());
              }}
            />
          )}
          {query.isFetchingNextPage ? (
            <Skeleton />
          ) : (
            query.hasNextPage && (
              <Button
                label="Daha fazla göster"
                disabled={offline || query.isFetching}
                variant="secondary"
                onPress={() => {
                  void query.fetchNextPage();
                }}
              />
            )
          )}
          {footer}
          {!query.hasNextPage && <BrandFooter />}
        </View>
      }
    />
  );
}
function Separator() {
  return <View className="h-list-gap" />;
}
