import { openBrowserAsync } from 'expo-web-browser';
export const managerWebUrl = 'https://tanidikvar.com.tr/yonetim';
export function openManagerWebPanel() {
  return openBrowserAsync(managerWebUrl);
}
