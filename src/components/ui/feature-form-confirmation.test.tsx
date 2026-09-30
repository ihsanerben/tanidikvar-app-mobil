import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { z } from 'zod';
import { FeatureForm } from './feature-form';
import { Button } from './button';
jest.mock('./bottom-sheet', () => ({ BottomSheet: ({visible,children}: {visible:boolean;children:React.ReactNode}) => visible ? children : null }));
jest.mock('./states', () => ({ useOffline: () => false, ErrorState: () => null }));

it('keeps the draft and sends nothing on cancel; saves once only after confirmation', async () => {
  const client = new QueryClient({defaultOptions:{mutations:{gcTime:Infinity}}});
  const submit = jest.fn().mockResolvedValue(undefined), onSuccess = jest.fn();
  let tree!: ReactTestRenderer;
  await act(async () => { tree=create(<QueryClientProvider client={client}><FeatureForm schema={z.object({name:z.string()})} defaults={{name:'Ayşe'}} fields={[]} submit={submit} onSuccess={onSuccess} confirm={()=>'Statün kaldırılacak.'} /></QueryClientProvider>); });
  const press = async (label:string) => act(async () => { tree.root.findAllByType(Button).find(node=>node.props.label===label)!.props.onPress(); });
  await press('Kaydet');
  expect(submit).not.toHaveBeenCalled();
  await press('Vazgeç');
  expect(submit).not.toHaveBeenCalled();
  expect(onSuccess).not.toHaveBeenCalled();
  await press('Kaydet');
  await press('Değişikliği kaydet');
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submit.mock.calls[0][0]).toEqual({name:'Ayşe'});
  await act(async()=>tree.unmount());client.clear();
});
