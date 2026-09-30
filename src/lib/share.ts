import { Alert, Platform, Share } from 'react-native';

/** Close native overlays before presenting another native view controller. */
export async function shareLink(message: string, close?: () => Promise<void>) {
  try {
    await close?.();
    if (Platform.OS === 'web') {
      if (navigator.share) await navigator.share(/^https?:\/\/\S+$/.test(message) ? { url: message } : { text: message });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        Alert.alert('Bağlantı kopyalandı', 'Bağlantıyı istediğin yerde paylaşabilirsin.');
      } else throw new Error('Sharing unavailable');
      return;
    }
    await Share.share({ message });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return;
    Alert.alert('Paylaşım açılamadı', 'Lütfen tekrar dene.');
  }
}
