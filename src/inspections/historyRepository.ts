import type { QueryResultRow, SQLiteValue } from 'react-native-nitro-sqlite';
import { database } from '../database';
import type { InspectionSyncStatus, InspectionType } from '../domain';

export interface InspectionHistoryItem {
  key: string;
  id: string;
  propertyId: string;
  propertyName: string;
  type: InspectionType;
  status: InspectionSyncStatus;
  completedAt: number | null;
  updatedAt: number;
  roomCount: number;
  source: 'local' | 'server';
}

interface LocalHistoryRow extends QueryResultRow {
  id: string;
  property_id: string;
  property_name: string;
  type: string;
  status: string;
  completed_at: number | null;
  updated_at: number;
  room_count: number;
}

interface ServerHistoryRow extends QueryResultRow {
  id: string;
  property_id: string;
  property_name: string | null;
  type: string;
  completed_at: number;
  updated_at: number;
  payload_json: string;
}

function milliseconds(value: number): number {
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

function localItem(row: Record<string, SQLiteValue>): InspectionHistoryItem {
  const value = row as LocalHistoryRow;
  return {
    key: `local:${value.id}`,
    id: value.id,
    propertyId: value.property_id,
    propertyName: value.property_name,
    type: value.type as InspectionType,
    status: value.status as InspectionSyncStatus,
    completedAt:
      value.completed_at === null ? null : milliseconds(value.completed_at),
    updatedAt: milliseconds(value.updated_at),
    roomCount: value.room_count,
    source: 'local',
  };
}

function serverItem(row: Record<string, SQLiteValue>): InspectionHistoryItem {
  const value = row as ServerHistoryRow;
  let roomCount = 0;
  try {
    const payload = JSON.parse(value.payload_json) as { rooms?: unknown };
    roomCount = Array.isArray(payload.rooms) ? payload.rooms.length : 0;
  } catch {
    // A malformed cached payload still remains visible in history.
  }
  return {
    key: `server:${value.id}`,
    id: value.id,
    propertyId: value.property_id,
    propertyName: value.property_name ?? value.property_id,
    type: value.type as InspectionType,
    status: 'synced',
    completedAt: milliseconds(value.completed_at),
    updatedAt: milliseconds(value.updated_at),
    roomCount,
    source: 'server',
  };
}

export async function listInspectionHistory(): Promise<
  InspectionHistoryItem[]
> {
  const db = database();
  const [localResult, serverResult] = await Promise.all([
    db.executeAsync(
      `SELECT inspections.id, inspections.property_id,
        properties.name AS property_name, inspections.type,
        inspections.status, inspections.completed_at, inspections.updated_at,
        COUNT(room_entries.id) AS room_count
       FROM inspections
       INNER JOIN properties ON properties.id = inspections.property_id
       LEFT JOIN room_entries ON room_entries.inspection_id = inspections.id
       GROUP BY inspections.id`,
    ),
    db.executeAsync(
      `SELECT server_inspections.id, server_inspections.property_id,
        properties.name AS property_name, server_inspections.type,
        server_inspections.completed_at, server_inspections.updated_at,
        server_inspections.payload_json
       FROM server_inspections
       LEFT JOIN properties ON properties.id = server_inspections.property_id
       WHERE NOT EXISTS (
         SELECT 1 FROM inspections
         WHERE inspections.server_id = server_inspections.id
       )`,
    ),
  ]);

  return [
    ...localResult.results.map(localItem),
    ...serverResult.results.map(serverItem),
  ].sort((left, right) => right.updatedAt - left.updatedAt);
}
