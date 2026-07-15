import type { QueryResultRow, SQLiteValue } from 'react-native-nitro-sqlite';
import { database } from '../database';
import type {
  Inspection,
  InspectionDraft,
  InspectionSyncStatus,
  InspectionType,
  PhotoEvidence,
  PhotoSyncStatus,
  Room,
  RoomCondition,
  RoomEntry,
} from '../domain';
import { createLocalId } from './ids';

interface InspectionRow extends QueryResultRow {
  id: string;
  property_id: string;
  property_version: number;
  type: string;
  status: string;
  idempotency_key: string;
  completed_at: number | null;
  server_id: string | null;
  server_created_at: number | null;
  server_updated_at: number | null;
  error_code: string | null;
  error_details_json: string | null;
  conflict_property_json: string | null;
  created_at: number;
  updated_at: number;
}

interface EntryRow extends QueryResultRow {
  id: string;
  inspection_id: string;
  room_id: string;
  condition: string | null;
  notes: string;
  completed: number;
  updated_at: number;
}

interface PhotoRow extends QueryResultRow {
  id: string;
  room_entry_id: string;
  local_uri: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  status: string;
  server_id: string | null;
  server_url: string | null;
  error_code: string | null;
  created_at: number;
  updated_at: number;
}

function parseJsonObject(value: string | null): Record<string, string> | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return null;
  }
}

function inspectionFromRow(row: Record<string, SQLiteValue>): Inspection {
  const value = row as InspectionRow;
  return {
    id: value.id,
    propertyId: value.property_id,
    propertyVersion: value.property_version,
    type: value.type as InspectionType,
    status: value.status as InspectionSyncStatus,
    idempotencyKey: value.idempotency_key,
    completedAt: value.completed_at,
    serverId: value.server_id,
    serverCreatedAt: value.server_created_at,
    serverUpdatedAt: value.server_updated_at,
    errorCode: value.error_code,
    errorDetails: parseJsonObject(value.error_details_json),
    conflictProperty: value.conflict_property_json
      ? JSON.parse(value.conflict_property_json)
      : null,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

function entryFromRow(row: Record<string, SQLiteValue>): RoomEntry {
  const value = row as EntryRow;
  return {
    id: value.id,
    inspectionId: value.inspection_id,
    roomId: value.room_id,
    condition: value.condition as RoomCondition | null,
    notes: value.notes,
    completed: value.completed === 1,
    updatedAt: value.updated_at,
  };
}

function photoFromRow(row: Record<string, SQLiteValue>): PhotoEvidence {
  const value = row as PhotoRow;
  return {
    id: value.id,
    roomEntryId: value.room_entry_id,
    localUri: value.local_uri,
    fileName: value.file_name,
    mimeType: value.mime_type,
    fileSize: value.file_size,
    width: value.width,
    height: value.height,
    status: value.status as PhotoSyncStatus,
    serverId: value.server_id,
    serverUrl: value.server_url,
    errorCode: value.error_code,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export async function getInspectionDraft(
  inspectionId: string,
): Promise<InspectionDraft | null> {
  const db = database();
  const inspectionResult = await db.executeAsync(
    'SELECT * FROM inspections WHERE id = ? LIMIT 1',
    [inspectionId],
  );
  if (!inspectionResult.results[0]) return null;

  const [entryResult, photoResult] = await Promise.all([
    db.executeAsync(
      'SELECT * FROM room_entries WHERE inspection_id = ? ORDER BY rowid',
      [inspectionId],
    ),
    db.executeAsync(
      `SELECT photo_evidence.* FROM photo_evidence
       INNER JOIN room_entries ON room_entries.id = photo_evidence.room_entry_id
       WHERE room_entries.inspection_id = ?`,
      [inspectionId],
    ),
  ]);

  return {
    inspection: inspectionFromRow(inspectionResult.results[0]),
    entries: entryResult.results.map(entryFromRow),
    photos: photoResult.results.map(photoFromRow),
  };
}

export async function getOrCreateInspectionDraft(
  propertyId: string,
  propertyVersion: number,
  rooms: Room[],
  type: InspectionType = 'routine',
): Promise<InspectionDraft> {
  const existing = await database().executeAsync(
    `SELECT id FROM inspections
     WHERE property_id = ? AND status = 'draft'
     ORDER BY created_at DESC LIMIT 1`,
    [propertyId],
  );
  const existingId = existing.results[0]?.id;
  if (typeof existingId === 'string') {
    const draft = await getInspectionDraft(existingId);
    if (draft) return draft;
  }

  const inspectionId = createLocalId('insp_local');
  const now = Date.now();
  await database().transaction(async tx => {
    await tx.executeAsync(
      `INSERT INTO inspections (
        id, property_id, property_version, type, status, idempotency_key,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
      [
        inspectionId,
        propertyId,
        propertyVersion,
        type,
        createLocalId('idem'),
        now,
        now,
      ],
    );

    for (const room of rooms) {
      await tx.executeAsync(
        `INSERT INTO room_entries (
          id, inspection_id, room_id, condition, notes, completed, updated_at
        ) VALUES (?, ?, ?, NULL, '', 0, ?)`,
        [createLocalId('entry'), inspectionId, room.id, now],
      );
    }
  });

  const created = await getInspectionDraft(inspectionId);
  if (!created) throw new Error('Inspection draft was not created');
  return created;
}

export async function saveRoomEntry(input: {
  inspectionId: string;
  roomId: string;
  condition: RoomCondition;
  notes: string;
}): Promise<void> {
  const now = Date.now();
  await database().transaction(async tx => {
    await tx.executeAsync(
      `UPDATE room_entries SET condition = ?, notes = ?, completed = 1, updated_at = ?
       WHERE inspection_id = ? AND room_id = ?`,
      [
        input.condition,
        input.notes.trim(),
        now,
        input.inspectionId,
        input.roomId,
      ],
    );
    await tx.executeAsync(
      'UPDATE inspections SET updated_at = ? WHERE id = ? AND status = ?',
      [now, input.inspectionId, 'draft'],
    );
  });
}

export async function saveRoomPhoto(input: {
  inspectionId: string;
  roomId: string;
  localUri: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
}): Promise<void> {
  const entryResult = await database().executeAsync(
    'SELECT id FROM room_entries WHERE inspection_id = ? AND room_id = ? LIMIT 1',
    [input.inspectionId, input.roomId],
  );
  const entryId = entryResult.results[0]?.id;
  if (typeof entryId !== 'string') throw new Error('Room entry not found');

  const now = Date.now();
  await database().transaction(async tx => {
    await tx.executeAsync(
      'DELETE FROM photo_evidence WHERE room_entry_id = ?',
      [entryId],
    );
    await tx.executeAsync(
      `INSERT INTO photo_evidence (
        id, room_entry_id, local_uri, file_name, mime_type, file_size, width,
        height, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'local', ?, ?)`,
      [
        createLocalId('photo'),
        entryId,
        input.localUri,
        input.fileName,
        input.mimeType,
        input.fileSize,
        input.width,
        input.height,
        now,
        now,
      ],
    );
    await tx.executeAsync(
      'UPDATE inspections SET updated_at = ? WHERE id = ?',
      [now, input.inspectionId],
    );
  });
}

export async function removeRoomPhoto(
  inspectionId: string,
  roomId: string,
): Promise<void> {
  await database().executeAsync(
    `DELETE FROM photo_evidence WHERE room_entry_id IN (
      SELECT id FROM room_entries WHERE inspection_id = ? AND room_id = ?
    )`,
    [inspectionId, roomId],
  );
}

export async function queueInspection(inspectionId: string): Promise<void> {
  const draft = await getInspectionDraft(inspectionId);
  if (!draft || draft.entries.some(entry => !entry.completed)) {
    throw new Error('Complete every room before finishing the inspection');
  }
  const now = Date.now();
  await database().executeAsync(
    `UPDATE inspections SET status = 'queued', completed_at = ?, updated_at = ?
     WHERE id = ? AND status = 'draft'`,
    [Math.floor(now / 1000), now, inspectionId],
  );
}
