import { apiRequest } from '../api';
import type { InspectionDraft } from '../domain';

interface PhotoUploadResponse {
  id: string;
  url: string;
}

interface InspectionSubmitResponse {
  id: string;
  created: number;
  updated_at: number;
}

export interface ServerInspection {
  id: string;
  propertyId: string;
  type: string;
  rooms: Array<{
    roomId: string;
    condition: string;
    notes: string;
    photoIds: string[];
  }>;
  completedAt: number;
  created: number;
  updated_at: number;
}

interface InspectionPageResponse {
  data: ServerInspection[];
  next_cursor: string | null;
}

export async function uploadInspectionPhoto(input: {
  uri: string;
  fileName: string | null;
  mimeType: string | null;
}): Promise<PhotoUploadResponse> {
  const form = new FormData();
  form.append('file', {
    uri: input.uri,
    name: input.fileName ?? 'inspection-photo.jpg',
    type: input.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  return apiRequest<PhotoUploadResponse>('/photos', {
    method: 'POST',
    body: form,
  });
}

export async function submitInspection(
  draft: InspectionDraft,
): Promise<InspectionSubmitResponse> {
  const photosByEntry = new Map<string, string[]>();
  for (const photo of draft.photos) {
    if (!photo.serverId) continue;
    const ids = photosByEntry.get(photo.roomEntryId) ?? [];
    ids.push(photo.serverId);
    photosByEntry.set(photo.roomEntryId, ids);
  }

  return apiRequest<InspectionSubmitResponse>('/inspections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': draft.inspection.idempotencyKey,
    },
    body: JSON.stringify({
      propertyId: draft.inspection.propertyId,
      propertyVersion: draft.inspection.propertyVersion,
      type: draft.inspection.type,
      rooms: draft.entries.map(entry => ({
        roomId: entry.roomId,
        condition: entry.condition ?? '',
        notes: entry.notes,
        photoIds: photosByEntry.get(entry.id) ?? [],
      })),
      completedAt: draft.inspection.completedAt,
    }),
  });
}

export async function fetchServerInspections(
  agentId: string,
  cursor?: string,
): Promise<InspectionPageResponse> {
  const query = new URLSearchParams({ agentId, limit: '50' });
  if (cursor) query.set('cursor', cursor);
  return apiRequest<InspectionPageResponse>(`/inspections?${query.toString()}`);
}
