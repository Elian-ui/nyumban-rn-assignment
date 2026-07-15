import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { Card, Pill, PrimaryButton } from '../components/ui';
import { colors, spacing } from '../theme';
import type { InspectionDraft, Property, Room } from '../domain';
import { getCachedProperty } from '../properties';
import { getOrCreateInspectionDraft, queueInspection } from '../inspections';

type Props = NativeStackScreenProps<RootStackParamList, 'Inspection'>;

export function InspectionScreen({ navigation, route }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [draft, setDraft] = useState<InspectionDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const cachedProperty = await getCachedProperty(route.params.propertyId);
      if (!cachedProperty?.rooms?.length) {
        throw new Error('Property rooms are not available offline');
      }
      const currentDraft = await getOrCreateInspectionDraft(
        cachedProperty.id,
        cachedProperty.version,
        cachedProperty.rooms,
      );
      setProperty(cachedProperty);
      setDraft(currentDraft);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load inspection',
      );
    } finally {
      setLoading(false);
    }
  }, [route.params.propertyId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.stateText}>Preparing local draft…</Text>
      </View>
    );
  }

  if (!property || !draft) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Inspection unavailable</Text>
        <Text style={styles.stateText}>{error}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const rooms = property.rooms ?? [];
  const completed = draft.entries.filter(entry => entry.completed).length;
  const percent = rooms.length
    ? Math.round((completed / rooms.length) * 100)
    : 0;

  function roomState(room: Room): 'Completed' | 'In progress' | 'Not started' {
    const entry = draft?.entries.find(item => item.roomId === room.id);
    if (entry?.completed) return 'Completed';
    if (entry?.condition || entry?.notes) return 'In progress';
    return 'Not started';
  }

  async function complete() {
    if (!draft) return;
    try {
      await queueInspection(draft.inspection.id);
      navigation.navigate('SyncQueue');
    } catch (completionError) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : 'Could not complete inspection',
      );
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.property}>{property.name}</Text>
        <View style={styles.saveLine}>
          <View style={styles.dot} />
          <Text style={styles.saveText}>Draft saved on this device</Text>
        </View>
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressTitle}>Inspection progress</Text>
            <Text style={styles.progressValue}>
              {completed} of {rooms.length}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.progressHelp}>
            {percent}% complete · Saved locally
          </Text>
        </Card>
        <Text style={styles.sectionLabel}>ROOMS</Text>
        <Card style={styles.roomList}>
          {rooms.map((room, index) => {
            const state = roomState(room);
            return (
              <Pressable
                key={room.id}
                onPress={() =>
                  navigation.navigate('RoomInspection', {
                    inspectionId: draft.inspection.id,
                    roomId: room.id,
                    roomName: room.label,
                  })
                }
                style={[
                  styles.room,
                  index < rooms.length - 1 && styles.roomBorder,
                ]}
              >
                <View
                  style={[
                    styles.roomState,
                    state === 'Completed' && styles.completedState,
                    state === 'In progress' && styles.activeState,
                  ]}
                >
                  <Text
                    style={[
                      styles.roomStateText,
                      state === 'Completed' && styles.completedStateText,
                      state === 'In progress' && styles.activeStateText,
                    ]}
                  >
                    {state === 'Completed'
                      ? '✓'
                      : state === 'In progress'
                      ? '•'
                      : ''}
                  </Text>
                </View>
                <View style={styles.roomCopy}>
                  <Text style={styles.roomName}>{room.label}</Text>
                  <Text style={styles.roomFloor}>
                    {room.floor === 0 ? 'Ground floor' : `Floor ${room.floor}`}
                  </Text>
                </View>
                <View style={styles.badgeColumn}>
                  <Pill
                    label={state}
                    style={styles.roomBadge}
                    tone={
                      state === 'Completed'
                        ? 'green'
                        : state === 'In progress'
                        ? 'amber'
                        : 'grey'
                    }
                  />
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </Card>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Card style={styles.tip}>
          <Text style={styles.tipTitle}>Work safely offline</Text>
          <Text style={styles.tipText}>
            Conditions, notes, and photo references are stored locally before
            sync.
          </Text>
        </Card>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label="Complete inspection"
          onPress={complete}
          disabled={completed !== rooms.length}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  state: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  stateTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  stateText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },
  retry: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
  },
  retryText: { color: colors.surface, fontWeight: '800', fontSize: 13 },
  content: { padding: spacing.lg, paddingBottom: 24 },
  property: {
    fontSize: 24,
    color: colors.ink,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  saveLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 7,
  },
  saveText: { fontSize: 12, color: colors.muted },
  progressCard: { marginBottom: spacing.lg },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  progressValue: { fontSize: 13, fontWeight: '800', color: colors.primary },
  track: {
    height: 7,
    backgroundColor: colors.slateSoft,
    borderRadius: 5,
    marginTop: 14,
    overflow: 'hidden',
  },
  fill: { height: 7, backgroundColor: colors.primary },
  progressHelp: { fontSize: 11, color: colors.muted, marginTop: 9 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: 9,
  },
  roomList: { paddingVertical: 0 },
  room: { minHeight: 70, flexDirection: 'row', alignItems: 'center' },
  roomBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  roomState: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedState: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  activeState: { borderColor: colors.amber, backgroundColor: colors.amberSoft },
  roomStateText: { fontSize: 12, fontWeight: '900' },
  completedStateText: { color: colors.surface },
  activeStateText: { color: colors.amber, fontSize: 18, lineHeight: 18 },
  roomCopy: { flex: 1, marginLeft: 11 },
  roomName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  roomFloor: { fontSize: 11, color: colors.muted, marginTop: 3 },
  badgeColumn: { width: 96, alignItems: 'center', justifyContent: 'center' },
  roomBadge: {
    alignSelf: 'stretch',
    height: 28,
    paddingHorizontal: 4,
    paddingVertical: 0,
    justifyContent: 'center',
  },
  chevron: {
    width: 18,
    fontSize: 25,
    color: colors.muted,
    marginLeft: 5,
    textAlign: 'right',
  },
  error: { color: colors.red, fontSize: 12, lineHeight: 18, marginTop: 12 },
  tip: {
    marginTop: spacing.md,
    backgroundColor: colors.amberSoft,
    borderColor: '#F1D9AF',
  },
  tipTitle: { fontSize: 13, color: colors.amber, fontWeight: '800' },
  tipText: { fontSize: 12, color: colors.amber, lineHeight: 18, marginTop: 4 },
  footer: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
