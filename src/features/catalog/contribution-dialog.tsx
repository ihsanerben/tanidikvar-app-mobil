import {useState,type ReactNode} from 'react';
import {BottomSheet} from '@/components/ui/bottom-sheet';
import {Button} from '@/components/ui/button';
export function ContributionDialog({label,children}:{label:string;children:ReactNode}){
 const [open,setOpen]=useState(false);
 return <><Button label={label} variant="secondary" onPress={()=>setOpen(true)}/><BottomSheet visible={open} title={label} close={()=>setOpen(false)}>{children}</BottomSheet></>;
}
