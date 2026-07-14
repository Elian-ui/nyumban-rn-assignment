import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Card, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { rooms } from '../data/mockData';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyDetail'>;

export function PropertyDetailScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Pill label="Active" />
        <Text style={styles.title}>Kireka Heights Block C</Text>
        <Text style={styles.address}>
          Plot 14, Kireka Road · Central region
        </Text>
      </View>
      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>40</Text>
          <Text style={styles.statLabel}>UNITS</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>ROOMS</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>2 May</Text>
          <Text style={styles.statLabel}>LAST CHECK</Text>
        </Card>
      </View>
      <Card style={styles.notice}>
        <Text style={styles.noticeIcon}>↻</Text>
        <View style={styles.noticeCopy}>
          <Text style={styles.noticeTitle}>Inspection in progress · 40%</Text>
          <Text style={styles.noticeText}>
            2 of 5 rooms completed · Updated just now
          </Text>
        </View>
        <Pill label="Draft" tone="amber" />
      </Card>
      <SectionTitle title="Rooms" action="5 total" />
      <Card style={styles.roomsCard}>
        {rooms.map((room, index) => (
          <View
            key={room.id}
            style={[styles.room, index < rooms.length - 1 && styles.roomBorder]}
          >
            <View style={styles.roomNumber}>
              <Text style={styles.roomNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.roomCopy}>
              <Text style={styles.roomLabel}>{room.label}</Text>
              <Text style={styles.roomFloor}>{room.floor}</Text>
            </View>
          </View>
        ))}
      </Card>
      <PrimaryButton
        label="Continue inspection"
        onPress={() =>
          navigation.navigate('Inspection', { propertyId: 'prp_0000' })
        }
      />
      <Text style={styles.version}>Property record version 7</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hero: { paddingVertical: spacing.md },
  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: 14,
  },
  address: { fontSize: 14, color: colors.muted, marginTop: 8 },
  stats: { flexDirection: 'row', gap: 9, marginVertical: spacing.md },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
  statValue: { fontSize: 18, color: colors.ink, fontWeight: '900' },
  statLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 5,
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderColor: '#CBE3D7',
    marginBottom: spacing.xl,
  },
  noticeIcon: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 17,
    marginRight: 12,
  },
  noticeCopy: { flex: 1, paddingRight: 8 },
  noticeTitle: { color: colors.primaryDark, fontWeight: '800', fontSize: 14 },
  noticeText: {
    color: colors.primaryDark,
    opacity: 0.75,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  roomsCard: { paddingVertical: 0, marginBottom: spacing.lg },
  room: { height: 65, flexDirection: 'row', alignItems: 'center' },
  roomBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  roomNumber: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.slateSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomNumberText: { fontSize: 12, fontWeight: '800', color: colors.ink },
  roomCopy: { marginLeft: 12 },
  roomLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  roomFloor: { fontSize: 11, color: colors.muted, marginTop: 3 },
  version: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    marginTop: 12,
  },
});
