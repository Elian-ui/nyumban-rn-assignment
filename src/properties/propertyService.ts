import { fetchPropertyDetail, fetchPropertyPage } from './propertyApi';
import {
  cachePropertyDetail,
  cachePropertyPage,
  getPropertyCursor,
  listPropertyIdsMissingDetails,
} from './propertyRepository';

const DETAIL_PREFETCH_CONCURRENCY = 3;

async function prefetchPropertyDetails(ids: string[]): Promise<void> {
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < ids.length) {
      const id = ids[nextIndex];
      nextIndex += 1;
      try {
        const property = await fetchPropertyDetail(id);
        await cachePropertyDetail(property);
      } catch {
        // Successful details remain cached. Missing details retry with the next page refresh.
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(DETAIL_PREFETCH_CONCURRENCY, ids.length) },
      () => worker(),
    ),
  );
}

export async function refreshProperties(): Promise<void> {
  const page = await fetchPropertyPage();
  await cachePropertyPage(page.properties, page.nextCursor);
  const missingIds = await listPropertyIdsMissingDetails(
    page.properties.map(property => property.id),
  );
  await prefetchPropertyDetails(missingIds);
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
  const missingIds = await listPropertyIdsMissingDetails(
    page.properties.map(property => property.id),
  );
  await prefetchPropertyDetails(missingIds);
  return page.nextCursor !== null;
}

export async function refreshPropertyDetail(id: string): Promise<void> {
  const property = await fetchPropertyDetail(id);
  await cachePropertyDetail(property);
}
