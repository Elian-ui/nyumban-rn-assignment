import { open, type NitroSQLiteConnection } from 'react-native-nitro-sqlite';
import { migrations } from './migrations';

const DATABASE_NAME = 'nyumban.sqlite';

let connection: NitroSQLiteConnection | undefined;
let initialization: Promise<NitroSQLiteConnection> | undefined;

function getConnection(): NitroSQLiteConnection {
  if (!connection) {
    connection = open({ name: DATABASE_NAME });
  }

  return connection;
}

async function applyMigrations(db: NitroSQLiteConnection): Promise<void> {
  const versionResult = await db.executeAsync('PRAGMA user_version');
  const storedVersion = versionResult.results[0]?.user_version;
  const currentVersion = typeof storedVersion === 'number' ? storedVersion : 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await db.transaction(async tx => {
      for (const statement of migration.statements) {
        await tx.executeAsync(statement.query);
      }
      await tx.executeAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

export async function initializeDatabase(): Promise<NitroSQLiteConnection> {
  if (initialization) {
    return initialization;
  }

  initialization = (async () => {
    const db = getConnection();
    await db.executeAsync('PRAGMA foreign_keys = ON');
    await db.executeAsync('PRAGMA journal_mode = WAL');
    await db.executeAsync('PRAGMA busy_timeout = 5000');
    await applyMigrations(db);
    return db;
  })().catch(error => {
    initialization = undefined;
    throw error;
  });

  return initialization;
}

export function database(): NitroSQLiteConnection {
  if (!connection) {
    throw new Error('Database has not been initialized');
  }

  return connection;
}
