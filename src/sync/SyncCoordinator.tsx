import { useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../auth';
import { runSyncCycle } from './syncCycle';

export function SyncCoordinator() {
  const { status, session } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated' || !session) return;

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
  }, [session, status]);

  return null;
}
