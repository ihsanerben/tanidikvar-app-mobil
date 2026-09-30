import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import {Modal,Platform} from 'react-native';
import {ActionsMenu} from './actions-menu';
const originalOS=Platform.OS;
afterEach(()=>Object.defineProperty(Platform,'OS',{configurable:true,value:originalOS}));
it('resolves iOS close only after the native modal has dismissed',async()=>{
 Object.defineProperty(Platform,'OS',{configurable:true,value:'ios'});
 let tree!:ReactTestRenderer,close!:()=>Promise<void>;
 await act(async()=>{tree=create(<ActionsMenu>{dismiss=>{close=dismiss;return null;}}</ActionsMenu>);});
 await act(async()=>tree.root.findAll(node=>node.props.accessibilityLabel==='İçerik işlemleri' && typeof node.props.onPress==='function')[0].props.onPress());
 let finished=false;
 await act(async()=>{void close().then(()=>{finished=true;});});
 expect(finished).toBe(false);
 expect(tree.root.findByType(Modal).props.visible).toBe(false);
 await act(async()=>tree.root.findByType(Modal).props.onDismiss());
 expect(finished).toBe(true);
 await act(async()=>tree.unmount());
});
it('resolves Android close after the modal is hidden without waiting for an iOS event',async()=>{
 Object.defineProperty(Platform,'OS',{configurable:true,value:'android'});
 let tree!:ReactTestRenderer,close!:()=>Promise<void>;
 await act(async()=>{tree=create(<ActionsMenu>{dismiss=>{close=dismiss;return null;}}</ActionsMenu>);});
 await act(async()=>tree.root.findAll(node=>node.props.accessibilityLabel==='İçerik işlemleri' && typeof node.props.onPress==='function')[0].props.onPress());
 let finished=false;
 await act(async()=>{void close().then(()=>{finished=true;});});
 expect(finished).toBe(true);expect(tree.root.findByType(Modal).props.visible).toBe(false);
 await act(async()=>tree.unmount());
});
