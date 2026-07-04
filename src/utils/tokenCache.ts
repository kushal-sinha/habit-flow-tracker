import * as SecureStore from 'expo-secure-store';

/**
 * Custom token cache for Clerk in React Native using expo-secure-store.
 * Stores JWTs securely in the device's keychain.
 */
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error('SecureStore get token error: ', error);
      // Clean up potentially corrupt data
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {}
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore save token error: ', error);
    }
  },
};
