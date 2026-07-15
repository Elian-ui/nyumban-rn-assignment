import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTO_SYNC_KEY = 'settings.auto_sync_enabled';
const listeners = new Set<(enabled: boolean) => void>();

export async function getAutoSyncEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(AUTO_SYNC_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(AUTO_SYNC_KEY, String(enabled));
  listeners.forEach(listener => listener(enabled));
}

export function subscribeToAutoSync(
  listener: (enabled: boolean) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
