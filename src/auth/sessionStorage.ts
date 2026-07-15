import * as Keychain from 'react-native-keychain';
import type { Session } from '../domain';

const SERVICE = 'com.nyumban.field.session';

export async function loadSession(): Promise<Session | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });

  if (!credentials) {
    return null;
  }

  try {
    return JSON.parse(credentials.password) as Session;
  } catch {
    await clearSession();
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await Keychain.setGenericPassword(session.agent.id, JSON.stringify(session), {
    service: SERVICE,
  });
}

export async function clearSession(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
