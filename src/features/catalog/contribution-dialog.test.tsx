import type {ReactNode} from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {api} from '@/lib/api/client';
import {Button} from '@/components/ui/button';
import {FormField} from '@/components/ui/form-field';
import {BottomSheet} from '@/components/ui/bottom-sheet';
import {ContributionDialog} from './contribution-dialog';
import {PollCreate} from './context-contribution';
import {ExperienceEditor} from './experience-editor';
jest.mock('@/lib/api/client',()=>({api:{call:jest.fn()}}));
jest.mock('@/features/auth/use-login-action',()=>({useLoginAction:()=>jest.fn()}));
let tree:ReactTestRenderer;
let client:QueryClient;
const after=jest.fn();
beforeEach(()=>{jest.mocked(api.call).mockReset();after.mockReset();client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity},mutations:{gcTime:Infinity}}});});
afterEach(async()=>{await act(async()=>tree?.unmount());client.clear();});
async function mount(children:ReactNode){await act(async()=>{tree=create(<QueryClientProvider client={client}><ContributionDialog label="Ekle">{children}</ContributionDialog></QueryClientProvider>);});await press('Ekle');}
async function press(label:string){await act(async()=>tree.root.findAllByType(Button).find(node=>node.props.label===label)!.props.onPress());await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});}
async function fill(label:string,value:string){await act(async()=>tree.root.findAllByType(FormField).find(node=>node.props.label===label)!.props.onChangeText(value));}
const isOpen=()=>tree.root.findAllByType(BottomSheet).find(node=>node.props.title==='Ekle')!.props.visible;
it('keeps a failed poll draft open and closes only after publication succeeds',async()=>{
 await mount(<PollCreate universityId="university" after={after}/>);
 await fill('Soru','Kampüste en çok hangi alanı kullanıyorsun?');await fill('Seçenek 1','Kütüphane');await fill('Seçenek 2','Bahçe');
 jest.mocked(api.call).mockRejectedValueOnce(new Error('Ağ hatası'));
 await press('Anketi yayınla');expect(isOpen()).toBe(true);expect(after).not.toHaveBeenCalled();
 expect(tree.root.findAllByType(FormField).find(node=>node.props.label==='Seçenek 1')!.props.value).toBe('Kütüphane');
 jest.mocked(api.call).mockResolvedValueOnce({});await press('Anketi yayınla');expect(isOpen()).toBe(false);expect(after).toHaveBeenCalledTimes(1);
 expect(api.call).toHaveBeenLastCalledWith('post','/api/polls',{body:{universityId:'university',programId:undefined,question:'Kampüste en çok hangi alanı kullanıyorsun?',options:['Kütüphane','Bahçe'],verifiedOnly:false},authenticated:true});
});
it('asks only for the comment, validates it, and sends the selected experience topic',async()=>{
 await mount(<ExperienceEditor universityId="university" templateType="CHOOSE_AGAIN" after={after}/>);
 expect(tree.root.findAllByType(FormField).map(node=>node.props.label)).toEqual(['Yorumun']);
 await fill('Yorumun','Kısa');await press('Yorumu paylaş');expect(api.call).not.toHaveBeenCalled();expect(isOpen()).toBe(true);
 await fill('Yorumun','Üniversiteyi yeniden tercih ederdim, kampüs yaşamından çok memnunum.');jest.mocked(api.call).mockResolvedValueOnce({});await press('Yorumu paylaş');
 expect(api.call).toHaveBeenCalledWith('post','/api/experiences',{body:{universityId:'university',programId:undefined,templateType:'CHOOSE_AGAIN',title:'Tekrar tercih eder miydim?',sentiment:'NEUTRAL',body:'Üniversiteyi yeniden tercih ederdim, kampüs yaşamından çok memnunum.'},authenticated:true});expect(isOpen()).toBe(false);expect(after).toHaveBeenCalledTimes(1);
});
