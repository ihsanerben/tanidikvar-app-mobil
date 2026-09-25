import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { z } from 'zod';
import { useNetworkState } from 'expo-network';
import { FeatureForm } from './feature-form';
import { FormField } from './form-field';
import { Button } from './button';
import { ErrorState } from './states';
import { ApiError } from '../../../packages/api-client/errors';

jest.mock('expo-network', () => ({ useNetworkState: jest.fn() }));
const network = jest.mocked(useNetworkState);
const schema = z.object({ title: z.string().min(10, 'En az 10 karakter yaz.') });

describe('contribution form behavior', () => {
  let tree: ReactTestRenderer;
  let client: QueryClient;
  beforeEach(() => {
    network.mockReturnValue({ isConnected: true, isInternetReachable: true });
    client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity }, queries: { gcTime: Infinity } } });
  });
  afterEach(async () => {
    if (tree) await act(async () => tree.unmount());
    client.clear();
    onlineManager.setOnline(true);
  });
  async function render(submit: (value: { title: string }) => Promise<unknown>, reload?: () => void) {
    await act(async () => {
      tree = create(<QueryClientProvider client={client}><FeatureForm schema={schema} defaults={{ title: '' }} fields={[{ name: 'title', label: 'Başlık' }]} submit={submit} reload={reload} /></QueryClientProvider>);
    });
  }
  async function send() {
    await act(async () => { await tree.root.findByProps({ testID: 'form-submit', label: 'Kaydet' }).props.onPress(); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  }
  it('keeps invalid input local and sends a validated contribution only once', async () => {
    const submit = jest.fn(async (_value: { title: string }) => undefined);
    await render(submit);
    await send();
    expect(submit).not.toHaveBeenCalled();
    expect(tree.root.findByType(FormField).props.error).toBe('En az 10 karakter yaz.');
    await act(async () => tree.root.findByType(FormField).props.onChangeText('Üniversite hayatı nasıl?'));
    await send();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toEqual({ title: 'Üniversite hayatı nasıl?' });
  });
  it('keeps the draft after a version conflict and offers an explicit reload', async () => {
    const submit = jest.fn(async () => { throw new ApiError(409, 'STALE_VERSION'); });
    const reload = jest.fn();
    await render(submit, reload);
    await act(async () => tree.root.findByType(FormField).props.onChangeText('Korunacak soru taslağı'));
    await send();
    expect(tree.root.findByType(FormField).props.value).toBe('Korunacak soru taslağı');
    expect(tree.root.findByType(ErrorState).props.error.code).toBe('STALE_VERSION');
    await act(async () => tree.root.findAllByType(Button).find(button => button.props.label === 'Güncel bilgileri yükle')!.props.onPress());
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it('disables submission when offline', async () => {
    onlineManager.setOnline(false);
    await render(jest.fn(async () => undefined));
    expect(tree.root.findByType(Button).props.disabled).toBe(true);
  });
});
