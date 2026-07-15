import { fetchPropertyDetail, fetchPropertyPage } from './propertyApi';
import {
  cachePropertyDetail,
  cachePropertyPage,
  getPropertyCursor,
} from './propertyRepository';

export async function refreshProperties(): Promise<void> {
  const page = await fetchPropertyPage();
  await cachePropertyPage(page.properties, page.nextCursor);
}

export async function fetchNextPropertyPage(): Promise<boolean> {
  const cursor = await getPropertyCursor();
  if (cursor === null) {
    return false;
  }

  if (cursor === undefined) {
    await refreshProperties();
    return true;
  }

  const page = await fetchPropertyPage(cursor);
  await cachePropertyPage(page.properties, page.nextCursor);
  return page.nextCursor !== null;
}

export async function refreshPropertyDetail(id: string): Promise<void> {
  const property = await fetchPropertyDetail(id);
  await cachePropertyDetail(property);
}
