type CommentIdentity = { id?: string; replyToId?: string | null };

/** Keep replies beside their parent, including locally created rows beyond a loaded page. */
export function orderDiscussion<T extends CommentIdentity>(loaded: T[], created: T[] = []): T[] {
  const items = new Map(loaded.filter(item => item.id).map(item => [item.id!, item]));
  for (const item of created) if (item.id && !items.has(item.id)) items.set(item.id, item);
  const children = new Map<string, T[]>();
  for (const item of items.values()) {
    const parent = item.replyToId && items.has(item.replyToId) ? item.replyToId : '';
    children.set(parent, [...(children.get(parent) ?? []), item]);
  }
  const result: T[] = [], visited = new Set<string>();
  function append(parent: string) {
    for (const item of children.get(parent) ?? []) {
      if (!item.id || visited.has(item.id)) continue;
      visited.add(item.id); result.push(item); append(item.id);
    }
  }
  append('');
  return result;
}

export function discussionPreview<T extends CommentIdentity>(items: T[], created: T[]): T[] {
  const visible = new Set(items.slice(0, 5).map(item => item.id));
  const byId = new Map(items.map(item => [item.id, item]));
  for (const item of created) {
    let current: T | undefined = byId.get(item.id);
    while (current && !visible.has(current.id)) {
      visible.add(current.id);
      current = current.replyToId ? byId.get(current.replyToId) : undefined;
    }
  }
  return items.filter(item => visible.has(item.id));
}
