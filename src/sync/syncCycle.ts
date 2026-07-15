import { reconcileServerInspections } from './reconciliation';
import { syncQueuedInspections } from './syncWorker';

let activeCycle: Promise<void> | null = null;

export async function runSyncCycle(agentId: string): Promise<void> {
  if (activeCycle) return activeCycle;
  activeCycle = (async () => {
    await syncQueuedInspections();
    await reconcileServerInspections(agentId);
  })();
  try {
    await activeCycle;
  } finally {
    activeCycle = null;
  }
}
