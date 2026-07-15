import { ApiError } from '../api';
import type { InspectionDraft } from '../domain';
import {
  getInspectionDraft,
  listSyncInspections,
  recoverInterruptedSync,
  setInspectionSyncState,
  setPhotoSyncState,
} from '../inspections';
import { submitInspection, uploadInspectionPhoto } from './inspectionApi';
import { withTransientRetry } from './retry';

let activeSync: Promise<void> | null = null;

async function syncOne(initial: InspectionDraft): Promise<void> {
  const inspectionId = initial.inspection.id;
  await setInspectionSyncState(inspectionId, 'syncing');

  try {
    for (const photo of initial.photos) {
      if (photo.serverId) continue;
      await setPhotoSyncState(photo.id, 'uploading');
      try {
        const uploaded = await withTransientRetry(() =>
          uploadInspectionPhoto({
            uri: photo.localUri,
            fileName: photo.fileName,
            mimeType: photo.mimeType,
          }),
        );
        await setPhotoSyncState(photo.id, 'uploaded', uploaded);
      } catch (error) {
        const permanent =
          error instanceof ApiError && [413, 507].includes(error.status);
        await setPhotoSyncState(
          photo.id,
          permanent ? 'rejected' : 'local',
          undefined,
          error instanceof ApiError ? String(error.status) : 'network',
        );
        throw error;
      }
    }

    const ready = await getInspectionDraft(inspectionId);
    if (!ready) throw new Error('Queued inspection no longer exists');
    const response = await withTransientRetry(() => submitInspection(ready));
    await setInspectionSyncState(inspectionId, 'synced', {
      serverId: response.id,
      serverCreatedAt: response.created,
      serverUpdatedAt: response.updated_at,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      await setInspectionSyncState(inspectionId, 'conflict', {
        errorCode: '409',
        conflictProperty: error.body,
      });
      return;
    }
    if (error instanceof ApiError && [413, 422, 507].includes(error.status)) {
      await setInspectionSyncState(inspectionId, 'rejected', {
        errorCode: String(error.status),
        errorDetails: error.body,
      });
      return;
    }
    await setInspectionSyncState(inspectionId, 'queued', {
      errorCode: error instanceof ApiError ? String(error.status) : 'network',
    });
  }
}

export async function syncQueuedInspections(): Promise<void> {
  if (activeSync) return activeSync;
  activeSync = (async () => {
    await recoverInterruptedSync();
    const inspections = await listSyncInspections();
    for (const item of inspections) {
      if (item.inspection.status === 'queued') await syncOne(item);
    }
  })();
  try {
    await activeSync;
  } finally {
    activeSync = null;
  }
}
