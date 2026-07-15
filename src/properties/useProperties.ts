import { useCallback, useEffect, useRef, useState } from 'react';
import type { Property } from '../domain';
import {
  countCachedProperties,
  countOfflineReadyProperties,
  getPropertyCursor,
  listCachedProperties,
} from './propertyRepository';
import { fetchNextPropertyPage, refreshProperties } from './propertyService';

export function useProperties(query: string) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [count, setCount] = useState(0);
  const [offlineReadyCount, setOfflineReadyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offlineFallback, setOfflineFallback] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(100);
  const requestId = useRef(0);

  const loadCache = useCallback(async (search: string, limit: number) => {
    const id = ++requestId.current;
    const [cached, cachedCount, readyCount, cursor] = await Promise.all([
      listCachedProperties({ query: search }, search.trim() ? 250 : limit),
      countCachedProperties(),
      countOfflineReadyProperties(),
      getPropertyCursor(),
    ]);
    if (id === requestId.current) {
      setProperties(cached);
      setCount(cachedCount);
      setOfflineReadyCount(readyCount);
      setHasMore(cursor !== null);
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProperties();
      setOfflineFallback(false);
    } catch {
      setOfflineFallback(true);
    } finally {
      await loadCache(query, visibleLimit);
      setRefreshing(false);
    }
  }, [loadCache, query, visibleLimit]);

  const loadMore = useCallback(async () => {
    if (loadingMore || refreshing || query.trim()) {
      return;
    }

    const nextLimit = visibleLimit + 100;
    setLoadingMore(true);
    if (properties.length < count) {
      try {
        setVisibleLimit(nextLimit);
        await loadCache(query, nextLimit);
      } finally {
        setLoadingMore(false);
      }
      return;
    }

    if (!hasMore) {
      setLoadingMore(false);
      return;
    }

    try {
      await fetchNextPropertyPage();
      setOfflineFallback(false);
    } catch {
      setOfflineFallback(true);
    } finally {
      setVisibleLimit(nextLimit);
      await loadCache(query, nextLimit);
      setLoadingMore(false);
    }
  }, [
    count,
    hasMore,
    loadCache,
    loadingMore,
    properties.length,
    query,
    refreshing,
    visibleLimit,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => loadCache(query, visibleLimit), 180);
    return () => clearTimeout(timer);
  }, [loadCache, query, visibleLimit]);

  useEffect(() => {
    refresh();
    // Initial refresh only. Later query changes read the local cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    properties,
    count,
    offlineReadyCount,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    offlineFallback,
    refresh,
    loadMore,
  };
}
