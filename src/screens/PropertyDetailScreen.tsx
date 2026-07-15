import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Card, Pill, PrimaryButton, SectionTitle } from '../components/ui';
import { colors, spacing } from '../theme';
import type { Property, PropertyStatus } from '../domain';
import { getCachedProperty, refreshPropertyDetail } from '../properties';

type Props = NativeStackScreenProps<RootStackParamList, 'PropertyDetail'>;

const statusLabels: Record<PropertyStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  under_renovation: 'Under renovation',
};

function shortDate(value: string | null): string {
  if (!value) {
    return 'Never';
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

function floorLabel(floor: number): string {
  if (floor === 0) {
    return 'Ground floor';
  }
  return `Floor ${floor}`;
}

export function PropertyDetailScreen({ navigation, route }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineFallback, setOfflineFallback] = useState(false);

  const load = useCallback(async () => {
    const cached = await getCachedProperty(route.params.propertyId);
    setProperty(cached);
    setLoading(!cached);

    try {
      await refreshPropertyDetail(route.params.propertyId);
      setProperty(await getCachedProperty(route.params.propertyId));
      setOfflineFallback(false);
    } catch {
      setOfflineFallback(true);
    } finally {
      setLoading(false);
    }
  }, [route.params.propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.stateText}>Loading property…</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateTitle}>Property unavailable</Text>
        <Text style={styles.stateText}>
          This property is not cached. Connect to the internet and try again.
        </Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const rooms = property.rooms ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Pill
          label={statusLabels[property.status]}
          tone={property.status === 'active' ? 'green' : 'amber'}
        />
        <Text style={styles.title}>{property.name}</Text>
        <Text style={styles.address}>
          {property.address ?? 'Address unavailable'} · {property.region} region
        </Text>
      </View>
      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{property.unitCount ?? '—'}</Text>
          <Text style={styles.statLabel}>UNITS</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{rooms.length}</Text>
          <Text style={styles.statLabel}>ROOMS</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>
            {shortDate(property.lastInspectedAt)}
          </Text>
          <Text style={styles.statLabel}>LAST CHECK</Text>
        </Card>
      </View>
      <Card style={[styles.notice, offlineFallback && styles.offlineNotice]}>
        <Text style={styles.noticeIcon}>{offlineFallback ? '⌁' : '✓'}</Text>
        <View style={styles.noticeCopy}>
          <Text style={styles.noticeTitle}>
            {offlineFallback ? 'Showing saved details' : 'Available offline'}
          </Text>
          <Text style={styles.noticeText}>
            {offlineFallback
              ? 'The latest server refresh failed. Nothing cached was removed.'
              : 'Property details and rooms are saved on this device.'}
          </Text>
        </View>
      </Card>
      <SectionTitle title="Rooms" action={`${rooms.length} total`} />
      <Card style={styles.roomsCard}>
        {rooms.length ? (
          rooms.map((room, index) => (
            <View
              key={room.id}
              style={[
                styles.room,
                index < rooms.length - 1 && styles.roomBorder,
              ]}
            >
              <View style={styles.roomNumber}>
                <Text style={styles.roomNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.roomCopy}>
                <Text style={styles.roomLabel}>{room.label}</Text>
                <Text style={styles.roomFloor}>{floorLabel(room.floor)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noRooms}>
            Room details have not been cached for this property yet.
          </Text>
        )}
      </Card>
      <PrimaryButton
        label="Start routine inspection"
        onPress={() =>
          navigation.navigate('Inspection', { propertyId: property.id })
        }
        disabled={!rooms.length}
      />
      <Text style={styles.version}>
        Property record version {property.version}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: 40 },
  state: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  stateTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  retry: {
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryText: { color: colors.surface, fontSize: 13, fontWeight: '800' },
  hero: { paddingVertical: spacing.md },
  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: 14,
  },
  address: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
    textTransform: 'capitalize',
  },
  stats: { flexDirection: 'row', gap: 9, marginVertical: spacing.md },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 5 },
  statValue: {
    fontSize: 17,
    color: colors.ink,
    fontWeight: '900',
    textAlign: 'center',
  },
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
  offlineNotice: { backgroundColor: colors.amberSoft, borderColor: '#F1D9AF' },
  noticeIcon: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 17,
    marginRight: 12,
  },
  noticeCopy: { flex: 1 },
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
  noRooms: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 24,
  },
  version: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    marginTop: 12,
  },
});
