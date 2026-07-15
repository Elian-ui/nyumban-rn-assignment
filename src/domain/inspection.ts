export type InspectionType = 'routine' | 'move_in' | 'move_out';

export type InspectionSyncStatus =
  | 'draft'
  | 'queued'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'rejected';

export type RoomCondition = 'good' | 'fair' | 'poor';

export type PhotoSyncStatus = 'local' | 'uploading' | 'uploaded' | 'rejected';

export interface Inspection {
  id: string;
  propertyId: string;
  propertyVersion: number;
  type: InspectionType;
  status: InspectionSyncStatus;
  idempotencyKey: string;
  completedAt: number | null;
  serverId: string | null;
  serverCreatedAt: number | null;
  serverUpdatedAt: number | null;
  errorCode: string | null;
  errorDetails: Record<string, string> | null;
  conflictProperty: unknown | null;
  createdAt: number;
  updatedAt: number;
}

export interface RoomEntry {
  id: string;
  inspectionId: string;
  roomId: string;
  condition: RoomCondition | null;
  notes: string;
  completed: boolean;
  updatedAt: number;
}

export interface PhotoEvidence {
  id: string;
  roomEntryId: string;
  localUri: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  status: PhotoSyncStatus;
  serverId: string | null;
  serverUrl: string | null;
  errorCode: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface InspectionDraft {
  inspection: Inspection;
  entries: RoomEntry[];
  photos: PhotoEvidence[];
}
