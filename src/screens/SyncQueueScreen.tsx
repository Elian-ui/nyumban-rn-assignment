import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import {
  BottomNav,
  Card,
  Pill,
  PrimaryButton,
  SectionTitle,
} from '../components/ui';
import { colors, spacing } from '../theme';
import {
  listSyncInspections,
  reopenRejectedInspection,
  retryConflictWithCurrentVersion,
} from '../inspections';
import type { InspectionDraft, InspectionSyncStatus } from '../domain';
import { runSyncCycle } from '../sync';
import { useAuth } from '../auth';

type Props = NativeStackScreenProps<RootStackParamList, 'SyncQueue'>;
type SyncItem = InspectionDraft & { propertyName: string };

const labels: Record<InspectionSyncStatus, string> = {
  draft: 'Draft',
  queued: 'Queued',
  syncing: 'Syncing',
  synced: 'Synced',
  conflict: 'Conflict',
  rejected: 'Rejected',
};

function tone(
  status: InspectionSyncStatus,
): 'green' | 'amber' | 'grey' | 'red' {
  if (status === 'synced') return 'green';
  if (status === 'conflict' || status === 'rejected') return 'red';
  if (status === 'queued' || status === 'syncing') return 'amber';
  return 'grey';
}

function itemMessage(item: SyncItem): string {
  if (item.inspection.status === 'conflict') {
    return 'The property changed on the server. The inspection remains saved.';
  }
  if (item.inspection.status === 'rejected') {
    return `Server rejected this inspection (${
      item.inspection.errorCode ?? 'validation'
    }).`;
  }
  if (item.inspection.status === 'queued' && item.inspection.errorCode) {
    return 'Last attempt failed. It is still queued with the same idempotency key.';
  }
  const photos = item.photos.length;
  return `${item.entries.length} rooms · ${photos} ${
    photos === 1 ? 'photo' : 'photos'
  }`;
}

function conflictVersion(item: SyncItem): number | null {
  const property = item.inspection.conflictProperty;
  if (!property || typeof property !== 'object') return null;
  const version = (property as { version?: unknown }).version;
  return typeof version === 'number' ? version : null;
}

function validationMessages(details: unknown): string[] {
  if (!details || typeof details !== 'object') return [];
  const body = details as { errors?: unknown; message?: unknown };
  if (body.errors && typeof body.errors === 'object') {
    return Object.entries(body.errors).flatMap(([field, value]) => {
      if (typeof value === 'string') return [`${field}: ${value}`];
      if (Array.isArray(value)) {
        return value
          .filter(message => typeof message === 'string')
          .map(message => `${field}: ${message}`);
      }
      return [];
    });
  }
  return typeof body.message === 'string' ? [body.message] : [];
}

export function SyncQueueScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [items, setItems] = useState<SyncItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [recoveringId, setRecoveringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await listSyncInspections());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function syncNow() {
    setSyncing(true);
    try {
      if (session) await runSyncCycle(session.agent.id);
    } finally {
      await load();
      setSyncing(false);
    }
  }

  function reviewConflict(item: SyncItem) {
    const serverVersion = conflictVersion(item);
    if (serverVersion === null) {
      Alert.alert(
        'Server version unavailable',
        'Refresh properties before retrying this inspection.',
      );
      return;
    }

    Alert.alert(
      'Use current property version?',
      `Inspection version: ${item.inspection.propertyVersion}\nServer version: ${serverVersion}\n\nRoom entries and photos will be preserved and queued against the server version.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update and retry',
          onPress: async () => {
            setRecoveringId(item.inspection.id);
            try {
              await retryConflictWithCurrentVersion(item.inspection.id);
              await load();
            } catch (error) {
              Alert.alert(
                'Could not retry',
                error instanceof Error ? error.message : 'Try again.',
              );
            } finally {
              setRecoveringId(null);
            }
          },
        },
      ],
    );
  }

  async function editRejected(item: SyncItem) {
    setRecoveringId(item.inspection.id);
    try {
      await reopenRejectedInspection(item.inspection.id);
      navigation.navigate('Inspection', {
        propertyId: item.inspection.propertyId,
      });
    } catch (error) {
      Alert.alert(
        'Could not reopen inspection',
        error instanceof Error ? error.message : 'Try again.',
      );
    } finally {
      setRecoveringId(null);
    }
  }

  const pending = items.filter(item => item.inspection.status !== 'synced');
  const synced = items.filter(item => item.inspection.status === 'synced');
  const queuedCount = items.filter(
    item => item.inspection.status === 'queued',
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>FIELD ACTIVITY</Text>
        <Text style={styles.title}>Sync</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryIconText}>↻</Text>
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>
              {queuedCount} {queuedCount === 1 ? 'inspection' : 'inspections'}{' '}
              waiting
            </Text>
            <Text style={styles.summaryText}>
              Local records remain on this device until the server confirms
              them.
            </Text>
          </View>
        </Card>
        <PrimaryButton
          label={syncing ? 'Syncing…' : 'Sync now'}
          onPress={syncNow}
          disabled={syncing || queuedCount === 0}
        />
        {syncing ? (
          <ActivityIndicator
            style={styles.syncSpinner}
            color={colors.primary}
          />
        ) : null}

        <View style={styles.section}>
          <SectionTitle
            title="Needs attention"
            action={`${pending.length} items`}
          />
          {pending.length ? (
            pending.map(item => {
              const messages = validationMessages(item.inspection.errorDetails);
              const recovering = recoveringId === item.inspection.id;
              return (
                <Card key={item.inspection.id} style={styles.item}>
                  <View style={styles.itemTop}>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemTitle}>{item.propertyName}</Text>
                      <Text style={styles.itemMeta}>
                        {item.inspection.type.replace('_', '-')} · Saved locally
                      </Text>
                    </View>
                    <Pill
                      label={labels[item.inspection.status]}
                      tone={tone(item.inspection.status)}
                    />
                  </View>
                  <View style={styles.divider} />
                  <Text
                    style={[
                      styles.detail,
                      ['conflict', 'rejected'].includes(
                        item.inspection.status,
                      ) && styles.error,
                    ]}
                  >
                    {itemMessage(item)}
                  </Text>
                  {messages.map(message => (
                    <Text key={message} style={styles.validationMessage}>
                      {message}
                    </Text>
                  ))}
                  {item.inspection.status === 'conflict' ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={recovering}
                      onPress={() => reviewConflict(item)}
                      style={({ pressed }) => [
                        styles.recoveryButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.recoveryButtonText}>
                        {recovering ? 'Updating…' : 'Review and retry'}
                      </Text>
                    </Pressable>
                  ) : null}
                  {item.inspection.status === 'rejected' ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={recovering}
                      onPress={() => editRejected(item)}
                      style={({ pressed }) => [
                        styles.recoveryButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.recoveryButtonText}>
                        {recovering ? 'Opening…' : 'Edit inspection'}
                      </Text>
                    </Pressable>
                  ) : null}
                </Card>
              );
            })
          ) : (
            <Card style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing waiting</Text>
              <Text style={styles.detail}>
                Completed inspections will appear here.
              </Text>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle
            title="Recently synced"
            action={`${synced.length} items`}
          />
          {synced.slice(0, 10).map(item => (
            <Card key={item.inspection.id} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={styles.check}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemTitle}>{item.propertyName}</Text>
                  <Text style={styles.itemMeta}>
                    Server ID: {item.inspection.serverId}
                  </Text>
                </View>
                <Pill label="Synced" />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
      <BottomNav
        active="sync"
        onProperties={() => navigation.navigate('Properties')}
        onSync={() => undefined}
        syncCount={pending.length}
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
  content: { padding: spacing.lg, paddingTop: 4, paddingBottom: 30 },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.amberSoft,
    borderColor: '#F1D9AF',
    marginBottom: 12,
  },
  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconText: { fontSize: 24, color: colors.amber, fontWeight: '800' },
  summaryCopy: { flex: 1, marginLeft: 12 },
  summaryTitle: { fontSize: 15, color: colors.ink, fontWeight: '800' },
  summaryText: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 4,
  },
  syncSpinner: { marginTop: 14 },
  section: { marginTop: spacing.xl },
  item: { marginBottom: 11 },
  itemTop: { flexDirection: 'row', alignItems: 'center' },
  itemCopy: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  itemMeta: { fontSize: 11, color: colors.muted, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 12 },
  detail: { fontSize: 12, lineHeight: 18, color: colors.muted },
  error: { color: colors.red },
  validationMessage: {
    color: colors.red,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  recoveryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  recoveryButtonText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  buttonPressed: { opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 22 },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  check: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  checkText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
});
