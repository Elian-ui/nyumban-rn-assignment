import { Dirs, FileSystem, Util } from 'react-native-file-access';
import type { Asset } from 'react-native-image-picker';
import {
  getInspectionDraft,
  removeRoomPhoto,
  saveRoomPhoto,
} from './inspectionRepository';
import { createLocalId } from './ids';

const PHOTO_DIRECTORY = `${Dirs.DocumentDir}/inspection-photos`;

function filePath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice(7) : uri;
}

async function ensurePhotoDirectory(): Promise<void> {
  if (!(await FileSystem.exists(PHOTO_DIRECTORY))) {
    await FileSystem.mkdir(PHOTO_DIRECTORY);
  }
}

function extensionFor(asset: Asset): string {
  const fromName = asset.fileName ? Util.extname(asset.fileName) : '';
  if (fromName) return fromName;
  if (asset.type === 'image/png') return '.png';
  if (asset.type === 'image/webp') return '.webp';
  return '.jpg';
}

async function deleteIfOwned(uri: string | undefined): Promise<void> {
  if (!uri) return;
  const path = filePath(uri);
  if (path.startsWith(PHOTO_DIRECTORY) && (await FileSystem.exists(path))) {
    await FileSystem.unlink(path);
  }
}

export async function persistRoomPhoto(
  inspectionId: string,
  roomId: string,
  asset: Asset,
): Promise<Asset> {
  if (!asset.uri) throw new Error('Photo has no local URI');
  await ensurePhotoDirectory();

  const draft = await getInspectionDraft(inspectionId);
  const entry = draft?.entries.find(item => item.roomId === roomId);
  const previous = draft?.photos.find(item => item.roomEntryId === entry?.id);
  const destination = `${PHOTO_DIRECTORY}/${createLocalId(
    'evidence',
  )}${extensionFor(asset)}`;

  await FileSystem.cp(asset.uri, destination);
  try {
    await saveRoomPhoto({
      inspectionId,
      roomId,
      localUri: `file://${destination}`,
      fileName: asset.fileName ?? destination.split('/').pop() ?? null,
      mimeType: asset.type ?? 'image/jpeg',
      fileSize: asset.fileSize ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
    });
    await deleteIfOwned(previous?.localUri);
  } catch (error) {
    await deleteIfOwned(`file://${destination}`);
    throw error;
  }

  return { ...asset, uri: `file://${destination}` };
}

export async function removePersistedRoomPhoto(
  inspectionId: string,
  roomId: string,
): Promise<void> {
  const draft = await getInspectionDraft(inspectionId);
  const entry = draft?.entries.find(item => item.roomId === roomId);
  const photo = draft?.photos.find(item => item.roomEntryId === entry?.id);
  await removeRoomPhoto(inspectionId, roomId);
  await deleteIfOwned(photo?.localUri);
}
