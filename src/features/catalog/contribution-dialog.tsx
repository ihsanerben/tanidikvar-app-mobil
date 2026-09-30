import {createContext,useContext,useState,type ReactNode} from 'react';
import {BottomSheet} from '@/components/ui/bottom-sheet';
import {Button} from '@/components/ui/button';
const ContributionCloseContext=createContext<(()=>void)|undefined>(undefined);
export const useContributionClose=()=>useContext(ContributionCloseContext);
export function ContributionDialog({label,children,variant='secondary'}:{label:string;children:ReactNode;variant?:'primary'|'secondary'}){
 const [open,setOpen]=useState(false);
 return <><Button label={label} variant={variant} onPress={()=>setOpen(true)}/><BottomSheet visible={open} title={label} close={()=>setOpen(false)}><ContributionCloseContext.Provider value={()=>setOpen(false)}>{children}</ContributionCloseContext.Provider></BottomSheet></>;
}
