import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'last_login_email';
const SESSION_EXPIRED_FLAG = 'session_expired_notice';

export async function saveLastLoginEmail(email: string): Promise<void> {
  if (!email?.trim()) return;
  await AsyncStorage.setItem(KEY, email.trim().toLowerCase());
}

export async function getLastLoginEmail(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function setSessionExpiredNoticePending(): Promise<void> {
  await AsyncStorage.setItem(SESSION_EXPIRED_FLAG, '1');
}

export async function consumeSessionExpiredNotice(): Promise<boolean> {
  const v = await AsyncStorage.getItem(SESSION_EXPIRED_FLAG);
  if (v) {
    await AsyncStorage.removeItem(SESSION_EXPIRED_FLAG);
    return true;
  }
  return false;
}
