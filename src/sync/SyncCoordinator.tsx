import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../auth';
import { runSyncCycle } from './syncCycle';
import { getAutoSyncEnabled, subscribeToAutoSync } from './syncPreferences';

export function SyncCoordinator() {
  const { status, session } = useAuth();
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    getAutoSyncEnabled().then(enabled => {
      if (active) setAutoSyncEnabled(enabled);
    });
    const unsubscribe = subscribeToAutoSync(setAutoSyncEnabled);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !session || !autoSyncEnabled) return;

    const trigger = () => {
      runSyncCycle(session.agent.id).catch(() => undefined);
    };
    trigger();

    const removeNetworkListener = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) trigger();
    });
    const appStateListener = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') trigger();
    });

    return () => {
      removeNetworkListener();
      appStateListener.remove();
    };
  }, [autoSyncEnabled, session, status]);

  return null;
}
