import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Small secrets (refresh token, cached profile) in the iOS Keychain / Android Keystore.
 * SecureStore has no web implementation, so on web values live in memory only and the
 * session ends when the tab reloads.
 */
const memory = new Map<string, string>();
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export async function getSecureItem(key: string): Promise<string | null> {
  return isNative ? SecureStore.getItemAsync(key) : (memory.get(key) ?? null);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isNative) {
    await SecureStore.setItemAsync(key, value);
  } else {
    memory.set(key, value);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isNative) {
    await SecureStore.deleteItemAsync(key);
  } else {
    memory.delete(key);
  }
}
