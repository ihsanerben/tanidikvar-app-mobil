import type { ReactElement } from "react";
import { View } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { ErrorState, EmptyState, Skeleton, useOffline } from "./states";
import { Button } from "./button";
import { AppFooter } from "./app-footer";
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
}: {
  query: UseInfiniteQueryResult<InfiniteData<Page<T>>, Error>;
  renderItem: ListRenderItem<T>;
  header?: ReactElement;
}) {
  const offline = useOffline();
  const data = query.data?.pages.flatMap((page) => page.items ?? []) ?? [];
  // v2 measures rows automatically; estimatedItemSize is a removed v1 prop.
  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id!}
      ListHeaderComponent={header}
      ItemSeparatorComponent={Separator}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => {
        void query.refetch();
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
          <EmptyState
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
          <AppFooter />
        </View>
      }
    />
  );
}
function Separator() {
  return <View className="h-list-gap" />;
}
