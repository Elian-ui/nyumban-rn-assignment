import { database } from '../database';
import { fetchServerInspections, type ServerInspection } from './inspectionApi';
import { withTransientRetry } from './retry';

async function cachePage(items: ServerInspection[]): Promise<void> {
  const reconciledAt = Date.now();
  await database().transaction(async tx => {
    for (const item of items) {
      await tx.executeAsync(
        `INSERT INTO server_inspections (
          id, property_id, type, completed_at, created, updated_at, payload_json, reconciled_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          property_id = excluded.property_id,
          type = excluded.type,
          completed_at = excluded.completed_at,
          created = excluded.created,
          updated_at = excluded.updated_at,
          payload_json = excluded.payload_json,
          reconciled_at = excluded.reconciled_at`,
        [
          item.id,
          item.propertyId,
          item.type,
          item.completedAt,
          item.created,
          item.updated_at,
          JSON.stringify(item),
          reconciledAt,
        ],
      );
      await tx.executeAsync(
        `UPDATE inspections SET status = 'synced', error_code = NULL, updated_at = ?
         WHERE server_id = ?`,
        [reconciledAt, item.id],
      );
    }
  });
}

export async function reconcileServerInspections(
  agentId: string,
): Promise<void> {
  let cursor: string | undefined;
  do {
    const page = await withTransientRetry(() =>
      fetchServerInspections(agentId, cursor),
    );
    await cachePage(page.data);
    cursor = page.next_cursor ?? undefined;
  } while (cursor);
}
