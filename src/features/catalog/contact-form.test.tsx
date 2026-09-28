import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Text } from '@/components/ui/text';
import { ContactForm } from './contact-form';
jest.mock('@/lib/api/client', () => ({ api: { call: jest.fn() } }));
let tree: ReactTestRenderer;
let client: QueryClient;
beforeEach(async () => {
  jest.mocked(api.call).mockReset();
  client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity},mutations:{gcTime:Infinity}}});
  await act(async()=>{tree=create(<QueryClientProvider client={client}><ContactForm /></QueryClientProvider>);});
});
afterEach(async()=>{await act(async()=>tree.unmount());client.clear();});
async function fill(label:string,value:string){await act(async()=>tree.root.findAllByType(FormField).find(node=>node.props.label===label)!.props.onChangeText(value));}
it('validates fields before sending and retains the draft on validation errors', async()=>{
  await fill('Adın','Ayşe');await fill('E-posta adresin','geçersiz');await fill('Konu','Öneri');await fill('Mesajın','Bu benim önerim.');
  await act(async()=>tree.root.findByType(Button).props.onPress());
  expect(api.call).not.toHaveBeenCalled();
  expect(tree.root.findAllByType(FormField).find(node=>node.props.label==='E-posta adresin')!.props.error).toBeTruthy();
  expect(tree.root.findAllByType(FormField).find(node=>node.props.label==='Mesajın')!.props.value).toBe('Bu benim önerim.');
});
it('submits the contact contract once, clears the form and shows the web success message',async()=>{
  jest.mocked(api.call).mockResolvedValue(undefined);
  await fill('Adın',' Ayşe ');await fill('E-posta adresin','ayse@example.test');await fill('Konu','Öneri');await fill('Mesajın','Bu benim önerim.');
  await act(async()=>tree.root.findByType(Button).props.onPress());
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});
  expect(api.call).toHaveBeenCalledTimes(1);
  expect(api.call).toHaveBeenCalledWith('post','/api/contact',{body:{name:'Ayşe',email:'ayse@example.test',subject:'Öneri',message:'Bu benim önerim.'}});
  expect(tree.root.findAllByType(FormField).every(node=>node.props.value==='')).toBe(true);
  expect(tree.root.findAllByType(Text).some(node=>node.props.children==='Mesajın gönderildi. En kısa sürede sana döneceğiz.')).toBe(true);
});
