import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { BottomNav, Card, Pill } from '../components/ui';
import { colors, radius, spacing } from '../theme';
import { useProperties } from '../properties/useProperties';
import { useAuth } from '../auth';
import type { Property } from '../domain';
import { countPendingInspections } from '../inspections';

type Props = NativeStackScreenProps<RootStackParamList, 'Properties'>;

function lastInspectionLabel(value: string | null): string {
  if (!value) {
    return 'Never';
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function PropertiesScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [syncCount, setSyncCount] = useState(0);
  const { session } = useAuth();
  const {
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
  } = useProperties(query);

  useFocusEffect(
    useCallback(() => {
      countPendingInspections().then(setSyncCount);
    }, []),
  );

  function renderProperty({ item }: { item: Property }) {
    return (
      <Pressable
        onPress={() =>
          navigation.navigate('PropertyDetail', { propertyId: item.id })
        }
      >
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.building}>
              <Text style={styles.buildingText}>▦</Text>
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.propertyName}>{item.name}</Text>
              <Text style={styles.address}>
                {item.address ?? 'Address unavailable'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {item.unitCount === null
                ? 'Units unknown'
                : `${item.unitCount} units`}
            </Text>
            <Text style={styles.meta}>
              Last: {lastInspectionLabel(item.lastInspectedAt)}
            </Text>
            <Pill
              label={item.detailsCachedAt ? 'Offline ready' : 'Needs internet'}
              tone={
                item.detailsCachedAt
                  ? 'green'
                  : item.status === 'active'
                  ? 'grey'
                  : 'amber'
              }
            />
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            {(session?.agent.assignedRegion ?? 'field').toUpperCase()} REGION
          </Text>
          <Text style={styles.title}>Properties</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>FA</Text>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.search}
          placeholder="Search cached properties"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>
      <View style={styles.connection}>
        <View style={[styles.dot, offlineFallback && styles.offlineDot]} />
        <Text style={styles.connectionText}>
          {offlineFallback ? 'Offline · ' : 'Cache status · '}
          {offlineReadyCount} of {count} offline ready
        </Text>
      </View>
      <FlatList
        data={properties}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        renderItem={renderProperty}
        ListHeaderComponent={
          <Text style={styles.count}>
            {query
              ? `${properties.length} MATCHES`
              : `${count} CACHED PROPERTIES`}
          </Text>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {query ? 'No cached matches' : 'No properties cached yet'}
              </Text>
              <Text style={styles.emptyText}>
                {offlineFallback
                  ? 'Connect to the internet and pull down to try again.'
                  : 'Pull down to refresh the portfolio.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={styles.footerLoader}
              color={colors.primary}
            />
          ) : hasMore && !query ? (
            <Text style={styles.moreHint}>Scroll to cache more properties</Text>
          ) : null
        }
      />
      <BottomNav
        active="properties"
        onProperties={() => undefined}
        onInspections={() => navigation.navigate('InspectionHistory')}
        onSync={() => navigation.navigate('SyncQueue')}
        syncCount={syncCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 30,
    color: colors.ink,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  searchWrap: {
    height: 52,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 24, color: colors.muted, marginRight: 8 },
  search: { flex: 1, color: colors.ink, fontSize: 15 },
  connection: {
    marginHorizontal: spacing.lg,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 7,
  },
  offlineDot: { backgroundColor: colors.amber },
  connectionText: { fontSize: 12, color: colors.muted },
  list: { padding: spacing.lg, paddingTop: spacing.md, gap: 12, flexGrow: 1 },
  count: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  card: { gap: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  building: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildingText: { fontSize: 21, color: colors.primary },
  cardCopy: { flex: 1, marginLeft: 12 },
  propertyName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  address: { fontSize: 13, color: colors.muted, marginTop: 4 },
  chevron: { fontSize: 28, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.line },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { fontSize: 11, color: colors.muted, maxWidth: '32%' },
  loader: { marginTop: 60 },
  empty: { alignItems: 'center', paddingTop: 54, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 7,
  },
  footerLoader: { paddingVertical: 18 },
  moreHint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    paddingVertical: 16,
  },
});
