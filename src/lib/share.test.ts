import { Alert, Platform, Share } from 'react-native';
import { shareLink } from './share';
const url='https://tanidikvar.com.tr/soru/test#answer-1';
const originalOS=Platform.OS;
beforeEach(()=>{Object.defineProperty(Platform,'OS',{configurable:true,value:'ios'});jest.spyOn(Share,'share').mockResolvedValue({action:Share.sharedAction});jest.spyOn(Alert,'alert').mockImplementation(()=>undefined);});
afterEach(()=>{Object.defineProperty(Platform,'OS',{configurable:true,value:originalOS});jest.restoreAllMocks();});
it('waits for the menu to finish dismissing before presenting the system share sheet',async()=>{
 let dismiss!:()=>void;
 const closed=new Promise<void>(resolve=>{dismiss=resolve;});
 const pending=shareLink(url,()=>closed);
 expect(Share.share).not.toHaveBeenCalled();
 dismiss();await pending;
 expect(Share.share).toHaveBeenCalledWith({message:url});
});
it('shows a recoverable error when the native share sheet fails',async()=>{
 jest.mocked(Share.share).mockRejectedValueOnce(new Error('Unavailable'));
 await shareLink(url);
 expect(Alert.alert).toHaveBeenCalledWith('Paylaşım açılamadı','Lütfen tekrar dene.');
});
it('cancellation is not an error',async()=>{
 jest.mocked(Share.share).mockResolvedValueOnce({action:Share.dismissedAction});
 await shareLink(url);expect(Alert.alert).not.toHaveBeenCalled();
});
