export function nextPage(
  page: {
    page?: number;
    totalPages?: number;
    hasNext?: boolean;
    size?: number;
    totalElements?: number;
  },
  pages: unknown[],
) {
  if (page.hasNext === false) return undefined;
  if (page.totalPages !== undefined)
    return pages.length < page.totalPages ? pages.length : undefined;
  if (page.totalElements !== undefined && page.size)
    return pages.length * page.size < page.totalElements
      ? pages.length
      : undefined;
  return page.hasNext ? pages.length : undefined;
}
