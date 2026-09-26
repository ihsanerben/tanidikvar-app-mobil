import { Platform } from 'react-native';
export const theme = { primary: '#163F36', text: '#21372F', muted: '#626D63', surface: '#FFFFFF' } as const;

// Avenir Next is an iOS system family; Android uses its installed sans serif.
export const fontFamily = Platform.select({ios:'Avenir Next',android:'sans-serif',default:'Avenir Next, Avenir, Arial, sans-serif'});
