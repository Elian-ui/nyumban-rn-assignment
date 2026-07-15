import type { BatchQueryCommand } from 'react-native-nitro-sqlite';

export interface Migration {
  version: number;
  statements: BatchQueryCommand[];
}

export const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      {
        query: `CREATE TABLE IF NOT EXISTS properties (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          address TEXT,
          unit_count INTEGER,
          region TEXT NOT NULL,
          last_inspected_at TEXT,
          status TEXT NOT NULL,
          version INTEGER NOT NULL,
          cached_at INTEGER NOT NULL
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY NOT NULL,
          property_id TEXT NOT NULL,
          label TEXT NOT NULL,
          floor INTEGER NOT NULL,
          FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS inspections (
          id TEXT PRIMARY KEY NOT NULL,
          property_id TEXT NOT NULL,
          property_version INTEGER NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          idempotency_key TEXT NOT NULL UNIQUE,
          completed_at INTEGER,
          server_id TEXT UNIQUE,
          server_created_at INTEGER,
          server_updated_at INTEGER,
          error_code TEXT,
          error_details_json TEXT,
          conflict_property_json TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (property_id) REFERENCES properties(id)
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS room_entries (
          id TEXT PRIMARY KEY NOT NULL,
          inspection_id TEXT NOT NULL,
          room_id TEXT NOT NULL,
          condition TEXT,
          notes TEXT NOT NULL DEFAULT '',
          completed INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL,
          UNIQUE (inspection_id, room_id),
          FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
          FOREIGN KEY (room_id) REFERENCES rooms(id)
        )`,
      },
      {
        query: `CREATE TABLE IF NOT EXISTS photo_evidence (
          id TEXT PRIMARY KEY NOT NULL,
          room_entry_id TEXT NOT NULL,
          local_uri TEXT NOT NULL,
          file_name TEXT,
          mime_type TEXT,
          file_size INTEGER,
          width INTEGER,
          height INTEGER,
          status TEXT NOT NULL,
          server_id TEXT UNIQUE,
          server_url TEXT,
          error_code TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (room_entry_id) REFERENCES room_entries(id) ON DELETE CASCADE
        )`,
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(name COLLATE NOCASE)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(address COLLATE NOCASE)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_properties_filters ON properties(region, status)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_inspections_sync ON inspections(status, updated_at)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_inspections_property ON inspections(property_id, created_at)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_room_entries_inspection ON room_entries(inspection_id)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_photos_room_entry ON photo_evidence(room_entry_id)',
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_photos_sync ON photo_evidence(status, updated_at)',
      },
    ],
  },
  {
    version: 2,
    statements: [
      {
        query: `CREATE TABLE IF NOT EXISTS app_metadata (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
      },
    ],
  },
  {
    version: 3,
    statements: [
      {
        query: `CREATE TABLE IF NOT EXISTS server_inspections (
          id TEXT PRIMARY KEY NOT NULL,
          property_id TEXT NOT NULL,
          type TEXT NOT NULL,
          completed_at INTEGER NOT NULL,
          created INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          payload_json TEXT NOT NULL,
          reconciled_at INTEGER NOT NULL
        )`,
      },
      {
        query:
          'CREATE INDEX IF NOT EXISTS idx_server_inspections_property ON server_inspections(property_id, updated_at)',
      },
    ],
  },
];
