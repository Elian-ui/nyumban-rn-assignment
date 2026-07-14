import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Card, Pill, PrimaryButton } from '../components/ui';
import { rooms } from '../data/mockData';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Inspection'>;

export function InspectionScreen({ navigation }: Props) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.property}>Kireka Heights Block C</Text>
        <View style={styles.saveLine}>
          <View style={styles.dot} />
          <Text style={styles.saveText}>Draft saved on this device</Text>
        </View>
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressTitle}>Inspection progress</Text>
            <Text style={styles.progressValue}>2 of 5</Text>
          </View>
          <View style={styles.track}>
            <View style={styles.fill} />
          </View>
          <Text style={styles.progressHelp}>
            40% complete · Last saved just now
          </Text>
        </Card>
        <Text style={styles.sectionLabel}>ROOMS</Text>
        <Card style={styles.roomList}>
          {rooms.map((room, index) => (
            <Pressable
              key={room.id}
              onPress={() =>
                navigation.navigate('RoomInspection', {
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
                  room.state === 'Completed' && styles.completedState,
                  room.state === 'In progress' && styles.activeState,
                ]}
              >
                <Text
                  style={[
                    styles.roomStateText,
                    room.state === 'Completed' && styles.completedStateText,
                    room.state === 'In progress' && styles.activeStateText,
                  ]}
                >
                  {room.state === 'Completed'
                    ? '✓'
                    : room.state === 'In progress'
                    ? '•'
                    : ''}
                </Text>
              </View>
              <View style={styles.roomCopy}>
                <Text style={styles.roomName}>{room.label}</Text>
                <Text style={styles.roomFloor}>{room.floor}</Text>
              </View>
              <View style={styles.badgeColumn}>
                <Pill
                  label={room.state}
                  style={styles.roomBadge}
                  tone={
                    room.state === 'Completed'
                      ? 'green'
                      : room.state === 'In progress'
                      ? 'amber'
                      : 'grey'
                  }
                />
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </Card>
        <Card style={styles.tip}>
          <Text style={styles.tipTitle}>Work safely offline</Text>
          <Text style={styles.tipText}>
            Your entries are saved as you go. You can leave and return without
            losing this draft.
          </Text>
        </Card>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label="Complete inspection"
          onPress={() => navigation.navigate('SyncQueue')}
          disabled
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
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
  fill: { height: 7, width: '40%', backgroundColor: colors.primary },
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
  activeState: {
    borderColor: colors.amber,
    backgroundColor: colors.amberSoft,
  },
  roomStateText: { fontSize: 12, fontWeight: '900' },
  completedStateText: { color: colors.surface },
  activeStateText: { color: colors.amber, fontSize: 18, lineHeight: 18 },
  roomCopy: { flex: 1, marginLeft: 11 },
  roomName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  roomFloor: { fontSize: 11, color: colors.muted, marginTop: 3 },
  badgeColumn: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
