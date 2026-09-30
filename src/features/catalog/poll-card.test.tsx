import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {QueryClient,QueryClientProvider,useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api/client';
import type {Schema} from '@/lib/api/types';
import {RadioGroup} from '@/components/ui/radio-group';
import {Avatar} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {ErrorState} from '@/components/ui/states';
import {Poll} from './poll-card';
import {decisionKeys} from './decision-queries';
jest.mock('@/lib/api/client',()=>({api:{call:jest.fn()}}));
jest.mock('@/lib/auth/auth-context',()=>({useAuth:()=>({status:'authenticated'})}));
jest.mock('@/features/auth/use-login-action',()=>({useLoginAction:()=>jest.fn()}));
const id='123e4567-e89b-42d3-a456-426614174000',first='223e4567-e89b-42d3-a456-426614174000',second='323e4567-e89b-42d3-a456-426614174000';
const poll:Schema['PollResponse']={id,universityId:id,question:'Kampüste hangi alanı kullanıyorsun?',authorName:'Mezun Tanıdık',activeAdmin:true,educationStatus:'MEZUN',totalVotes:1,options:[{id:first,label:'Kütüphane',voteCount:1},{id:second,label:'Bahçe',voteCount:0}]};
const detailKey=[...decisionKeys.all,'poll',id],voteKey=[...decisionKeys.all,'poll-votes',id];
let client:QueryClient,tree:ReactTestRenderer;
function Harness({allowed=true,closed=false}:{allowed?:boolean;closed?:boolean}){
 const detail=useQuery({queryKey:detailKey,queryFn:async()=>poll,enabled:false});
 const participation=useQuery({queryKey:voteKey,queryFn:async()=>[] as Schema['PollParticipationResponse'][],enabled:false});
 return <Poll poll={{...detail.data!,closesAt:closed?'2020-01-01T00:00:00Z':undefined}} saved={participation.data?.[0]?.optionId} canVote={allowed}/>;
}
beforeEach(()=>{jest.mocked(api.call).mockReset();client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity},mutations:{retry:false,gcTime:Infinity}}});client.setQueryData(detailKey,poll);client.setQueryData(voteKey,[{pollId:id,optionId:first}]);});
afterEach(async()=>{await act(async()=>tree?.unmount());client.clear();});
async function render(allowed=true,closed=false){await act(async()=>{tree=create(<QueryClientProvider client={client}><Harness allowed={allowed} closed={closed}/></QueryClientProvider>);});}
async function settle(){await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});}
async function choose(option:string){await act(async()=>tree.root.findByType(RadioGroup).props.onChange(option));await settle();}
it('updates the vote immediately on selection, preserves one vote and shows graduate stars',async()=>{
 await render();expect(tree.root.findByType(Avatar).props).toMatchObject({tanidik:true,educationStatus:'MEZUN'});
 expect(tree.root.findAllByType(Button).some(node=>['Oy ver','Oyunu değiştir'].includes(node.props.label))).toBe(false);
 jest.mocked(api.call).mockResolvedValueOnce({...poll,options:[{id:first,label:'Kütüphane',voteCount:0},{id:second,label:'Bahçe',voteCount:1}]});await choose(second);
 expect(api.call).toHaveBeenCalledWith('put','/api/polls/{id}/vote',{params:{id},body:{optionId:second},authenticated:true});
 expect(tree.root.findByType(RadioGroup).props.value).toBe(second);expect(client.getQueryData<Schema['PollResponse']>(detailKey)?.totalVotes).toBe(1);
 await choose(second);expect(api.call).toHaveBeenCalledTimes(1);
});
it('restores the saved selection after failure and retries the attempted option',async()=>{
 await render();jest.mocked(api.call).mockRejectedValueOnce(new Error('offline'));await choose(second);
 expect(tree.root.findByType(RadioGroup).props.value).toBe(first);
 jest.mocked(api.call).mockResolvedValueOnce(poll);await act(async()=>tree.root.findByType(ErrorState).props.retry());await settle();
 expect(jest.mocked(api.call).mock.calls[1][2]).toMatchObject({body:{optionId:second}});expect(tree.root.findByType(RadioGroup).props.value).toBe(second);
});
it.each([[false,false],[true,true]])('blocks voting when allowed=%s and closed=%s',async(allowed,closed)=>{
 await render(allowed,closed);expect(tree.root.findByType(RadioGroup).props.disabled).toBe(true);await choose(second);expect(api.call).not.toHaveBeenCalled();
});
it('does not send a second request while a selection is saving',async()=>{
 await render();let finish!:(value:Schema['PollResponse'])=>void;jest.mocked(api.call).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 await choose(second);expect(tree.root.findByType(RadioGroup).props.disabled).toBe(true);await choose(first);expect(api.call).toHaveBeenCalledTimes(1);
 await act(async()=>finish(poll));await settle();
});
