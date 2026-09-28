import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Schema } from "@/lib/api/types";
import { ShowcaseForm } from "./showcase-form";
import { setShowcase } from "./api";
import { Button } from "@/components/ui/button";

jest.mock("./api", () => ({ setShowcase: jest.fn(), retentionKeys: { achievements: (id: string) => ["achievements", id], score: (id: string) => ["score", id] } }));
jest.mock("@shopify/flash-list", () => ({
  FlashList: ({ data, renderItem, ListHeaderComponent, ListFooterComponent }: {
    data: Schema["AchievementResponse"][];
    renderItem: (args: { item: Schema["AchievementResponse"]; index: number }) => React.ReactNode;
    ListHeaderComponent: React.ReactNode;
    ListFooterComponent: React.ReactNode;
  }) => {
    const React = jest.requireActual<typeof import("react")>("react");
    return React.createElement(React.Fragment, null, ListHeaderComponent,
      data.map((item, index) => React.createElement(React.Fragment, { key: item.id }, renderItem({ item, index }))), ListFooterComponent);
  },
}));
const items: Schema["AchievementResponse"][] = [1, 2, 3, 4].map(n => ({
  id: `${n}${n}${n}${n}${n}${n}${n}${n}-${n}${n}${n}${n}-4${n}${n}${n}-8${n}${n}${n}-${String(n).repeat(12)}`, title: `Rozet ${n}`, featured: false,
}));
describe("inline showcase selection", () => {
  let tree: ReactTestRenderer;
  let client: QueryClient;
  const onSaved = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks(); onlineManager.setOnline(true);
    client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
    jest.mocked(setShowcase).mockResolvedValue([]);
  });
  afterEach(async () => {
    if (tree) await act(async () => tree.unmount());
    client.clear(); onlineManager.setOnline(true);
  });
  async function render() {
    await act(async () => { tree = create(<QueryClientProvider client={client}><ShowcaseForm id="owner" items={items}
      header={<></>} refreshing={false} refresh={jest.fn()} onSaved={onSaved} onChange={jest.fn()} /></QueryClientProvider>); });
  }
  const option = (n: number) => tree.root.findAllByProps({ accessibilityRole: "checkbox", accessibilityLabel: `Rozet ${n}` })[0];
  async function toggle(n: number) { await act(async () => option(n).props.onPress()); }
  it("prevents a fourth selection while still allowing a selected badge to be removed", async () => {
    await render(); await toggle(1); await toggle(2); await toggle(3);
    expect(option(4).props.disabled).toBe(true);
    expect(option(1).props.disabled).toBe(false);
    await toggle(1);
    expect(option(4).props.disabled).toBe(false);
  });
  it("saves only the selected UUIDs", async () => {
    await render(); await toggle(2);
    await act(async () => { await tree.root.findByType(Button).props.onPress(); });
    expect(jest.mocked(setShowcase).mock.calls[0][0]).toEqual([items[1].id]);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
  it("keeps selection unavailable during submission", async () => {
    let resolve!: (value: Schema["AchievementResponse"][]) => void;
    jest.mocked(setShowcase).mockImplementation(() => new Promise(done => { resolve = done; }));
    await render(); await toggle(1);
    await act(async () => { void tree.root.findByType(Button).props.onPress(); });
    expect(option(1).props.disabled).toBe(true);
    await act(async () => { resolve([]); });
  });
  it("disables submission and selection offline", async () => {
    onlineManager.setOnline(false); await render();
    expect(tree.root.findByType(Button).props.disabled).toBe(true);
    expect(option(1).props.disabled).toBe(true);
    expect(setShowcase).not.toHaveBeenCalled();
  });
});
