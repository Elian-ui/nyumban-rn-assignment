import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth';
import { BottomNav, Card, Pill } from '../components/ui';
import {
  countPendingInspections,
  listInspectionHistory,
  type InspectionHistoryItem,
} from '../inspections';
import type { RootStackParamList } from '../navigation/types';
import { runSyncCycle } from '../sync';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionHistory'>;

const statusLabels: Record<InspectionHistoryItem['status'], string> = {
  draft: 'Draft',
  queued: 'Queued',
  syncing: 'Syncing',
  synced: 'Synced',
  conflict: 'Conflict',
  rejected: 'Rejected',
};

function statusTone(
  status: InspectionHistoryItem['status'],
): 'green' | 'amber' | 'grey' | 'red' {
  if (status === 'synced') return 'green';
  if (status === 'conflict' || status === 'rejected') return 'red';
  if (status === 'queued' || status === 'syncing') return 'amber';
  return 'grey';
}

function dateLabel(value: number | null): string {
  if (value === null) return 'In progress';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function InspectionHistoryScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [items, setItems] = useState<InspectionHistoryItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [history, pending] = await Promise.all([
      listInspectionHistory(),
      countPendingInspections(),
    ]);
    setItems(history);
    setPendingCount(pending);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    try {
      if (session) await runSyncCycle(session.agent.id);
    } finally {
      await load();
      setRefreshing(false);
    }
  }

  function openItem(item: InspectionHistoryItem) {
    if (item.status === 'draft') {
      navigation.navigate('Inspection', { propertyId: item.propertyId });
      return;
    }
    if (
      item.status === 'queued' ||
      item.status === 'syncing' ||
      item.status === 'conflict' ||
      item.status === 'rejected'
    ) {
      navigation.navigate('SyncQueue');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>FIELD ACTIVITY</Text>
        <Text style={styles.title}>Inspections</Text>
        <Text style={styles.subtitle}>
          Local work and inspections confirmed by the server.
        </Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={refresh}
        renderItem={({ item }) => (
          <Pressable onPress={() => openItem(item)}>
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardCopy}>
                  <Text style={styles.property}>{item.propertyName}</Text>
                  <Text style={styles.meta}>
                    {item.type.replace('_', '-')} · {item.roomCount}{' '}
                    {item.roomCount === 1 ? 'room' : 'rooms'}
                  </Text>
                </View>
                <Pill
                  label={statusLabels[item.status]}
                  tone={statusTone(item.status)}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.footer}>
                <Text style={styles.date}>{dateLabel(item.completedAt)}</Text>
                <Text style={styles.source}>
                  {item.source === 'server' ? 'SERVER RECORD' : 'THIS DEVICE'}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No inspections yet</Text>
              <Text style={styles.emptyText}>
                Start an inspection from a property or pull down to retrieve
                server history.
              </Text>
            </View>
          )
        }
      />
      <BottomNav
        active="inspections"
        onProperties={() => navigation.navigate('Properties')}
        onInspections={() => undefined}
        onSync={() => navigation.navigate('SyncQueue')}
        syncCount={pendingCount}
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
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 6 },
  content: {
    flexGrow: 1,
    gap: 11,
    padding: spacing.lg,
    paddingTop: 4,
    paddingBottom: 30,
  },
  card: { gap: 12 },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  cardCopy: { flex: 1, paddingRight: 10 },
  property: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  divider: { backgroundColor: colors.line, height: 1 },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: { color: colors.muted, fontSize: 12 },
  source: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  loader: { marginTop: 60 },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 65 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
});
