import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "expo-router";
import { NotificationRow } from "./notification-row";
import { readNotification, type Notification } from "./api";
import { ErrorState } from "@/components/ui/states";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("./api", () => ({ readNotification: jest.fn(), notificationKeys: { all: ["notifications"] } }));
const note: Notification = {
  id: "11111111-1111-4111-8111-111111111111", title: "Yeni cevap", body: "Soruna cevap geldi.",
  targetType: "QUESTION", targetId: "22222222-2222-4222-8222-222222222222",
};
describe("compact notification row", () => {
  let client: QueryClient;
  let tree: ReactTestRenderer;
  beforeEach(() => {
    jest.clearAllMocks();
    onlineManager.setOnline(true);
    client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
    jest.mocked(readNotification).mockResolvedValue(undefined);
  });
  afterEach(async () => {
    if (tree) await act(async () => tree.unmount());
    client.clear();
    onlineManager.setOnline(true);
  });
  async function render(item: Notification = note) {
    await act(async () => { tree = create(<QueryClientProvider client={client}><NotificationRow item={item} /></QueryClientProvider>); });
  }
  async function open() {
    await act(async () => tree.root.findAllByProps({ testID: `notification-open-${note.id}` })[0].props.onPress());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  }
  it("opens the destination and marks an unread notification read", async () => {
    const invalidate = jest.spyOn(client, "invalidateQueries");
    await render(); await open();
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(readNotification).toHaveBeenCalledTimes(1);
    expect(jest.mocked(readNotification).mock.calls[0][0]).toBe(note.id);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });
  it("opens cached content offline without attempting a write", async () => {
    onlineManager.setOnline(false);
    await render(); await open();
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(readNotification).not.toHaveBeenCalled();
  });
  it("does not mark an already read notification again", async () => {
    await render({ ...note, readAt: "2026-09-26T10:00:00Z" }); await open();
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(readNotification).not.toHaveBeenCalled();
  });
  it("keeps a failed read visible and offers retry", async () => {
    jest.mocked(readNotification).mockRejectedValue(new Error("offline"));
    await render(); await open();
    expect(tree.root.findByType(ErrorState).props.retry).toEqual(expect.any(Function));
  });
});
