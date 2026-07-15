import type { QueryResultRow, SQLiteValue } from 'react-native-nitro-sqlite';
import { database } from '../database';
import type {
  Property,
  PropertyFilters,
  PropertyRegion,
  PropertyStatus,
  Room,
} from '../domain';

const CURSOR_KEY = 'properties.next_cursor';
const END_OF_LIST = '__END__';

interface PropertyRow extends QueryResultRow {
  id: string;
  name: string;
  address: string | null;
  unit_count: number | null;
  region: string;
  last_inspected_at: string | null;
  status: string;
  version: number;
  cached_at: number;
}

interface RoomRow extends QueryResultRow {
  id: string;
  property_id: string;
  label: string;
  floor: number;
}

function propertyFromRow(row: Record<string, SQLiteValue>): Property {
  const typed = row as PropertyRow;
  return {
    id: typed.id,
    name: typed.name,
    address: typed.address,
    unitCount: typed.unit_count,
    region: typed.region as PropertyRegion,
    lastInspectedAt: typed.last_inspected_at,
    status: typed.status as PropertyStatus,
    version: typed.version,
    cachedAt: typed.cached_at,
  };
}

function roomFromRow(row: Record<string, SQLiteValue>): Room {
  const typed = row as RoomRow;
  return {
    id: typed.id,
    propertyId: typed.property_id,
    label: typed.label,
    floor: typed.floor,
  };
}

const UPSERT_PROPERTY = `INSERT INTO properties (
  id, name, address, unit_count, region, last_inspected_at, status, version, cached_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  address = excluded.address,
  unit_count = excluded.unit_count,
  region = excluded.region,
  last_inspected_at = excluded.last_inspected_at,
  status = excluded.status,
  version = excluded.version,
  cached_at = excluded.cached_at`;

function propertyParams(property: Property): SQLiteValue[] {
  return [
    property.id,
    property.name,
    property.address,
    property.unitCount,
    property.region,
    property.lastInspectedAt,
    property.status,
    property.version,
    property.cachedAt,
  ];
}

export async function cachePropertyPage(
  properties: Property[],
  nextCursor: string | null,
): Promise<void> {
  const db = database();
  await db.transaction(async tx => {
    for (const property of properties) {
      await tx.executeAsync(UPSERT_PROPERTY, propertyParams(property));
    }

    await tx.executeAsync(
      `INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [CURSOR_KEY, nextCursor ?? END_OF_LIST, Date.now()],
    );
  });
}

export async function cachePropertyDetail(property: Property): Promise<void> {
  const db = database();
  await db.transaction(async tx => {
    await tx.executeAsync(UPSERT_PROPERTY, propertyParams(property));

    for (const room of property.rooms ?? []) {
      await tx.executeAsync(
        `INSERT INTO rooms (id, property_id, label, floor) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           property_id = excluded.property_id,
           label = excluded.label,
           floor = excluded.floor`,
        [room.id, room.propertyId, room.label, room.floor],
      );
    }
  });
}

export async function listCachedProperties(
  filters: PropertyFilters = {},
  limit = 100,
): Promise<Property[]> {
  const conditions: string[] = [];
  const params: SQLiteValue[] = [];

  if (filters.query?.trim()) {
    conditions.push(
      '(name LIKE ? COLLATE NOCASE OR address LIKE ? COLLATE NOCASE)',
    );
    const pattern = `%${filters.query.trim()}%`;
    params.push(pattern, pattern);
  }
  if (filters.region) {
    conditions.push('region = ?');
    params.push(filters.region);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit);
  const result = await database().executeAsync(
    `SELECT * FROM properties ${where} ORDER BY name COLLATE NOCASE LIMIT ?`,
    params,
  );

  return result.results.map(propertyFromRow);
}

export async function countCachedProperties(): Promise<number> {
  const result = await database().executeAsync(
    'SELECT COUNT(*) AS count FROM properties',
  );
  const count = result.results[0]?.count;
  return typeof count === 'number' ? count : 0;
}

export async function getCachedProperty(id: string): Promise<Property | null> {
  const propertyResult = await database().executeAsync(
    'SELECT * FROM properties WHERE id = ? LIMIT 1',
    [id],
  );
  const row = propertyResult.results[0];
  if (!row) {
    return null;
  }

  const roomResult = await database().executeAsync(
    'SELECT * FROM rooms WHERE property_id = ? ORDER BY floor, label COLLATE NOCASE',
    [id],
  );
  return {
    ...propertyFromRow(row),
    rooms: roomResult.results.map(roomFromRow),
  };
}

export async function getPropertyCursor(): Promise<string | null | undefined> {
  const result = await database().executeAsync(
    'SELECT value FROM app_metadata WHERE key = ? LIMIT 1',
    [CURSOR_KEY],
  );
  const value = result.results[0]?.value;
  if (value === END_OF_LIST) {
    return null;
  }
  return typeof value === 'string' ? value : undefined;
}
