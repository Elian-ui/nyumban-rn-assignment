import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { properties } from '../data/mockData';
import { BottomNav, Card, Pill } from '../components/ui';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Properties'>;

export function PropertiesScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CENTRAL REGION</Text>
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
          placeholder="Search name or address"
          placeholderTextColor={colors.muted}
        />
        <Pressable style={styles.filter}>
          <Text style={styles.filterText}>Filters</Text>
        </Pressable>
      </View>
      <View style={styles.connection}>
        <View style={styles.dot} />
        <Text style={styles.connectionText}>
          Offline ready · 147 properties on this device
        </Text>
      </View>
      <FlatList
        data={properties}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.count}>147 PROPERTIES</Text>}
        renderItem={({ item }) => (
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
                  <Text style={styles.address}>{item.address}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{item.units} units</Text>
                <Text style={styles.meta}>Last: {item.lastInspection}</Text>
                <Pill
                  label={item.status}
                  tone={item.status === 'Active' ? 'green' : 'amber'}
                />
              </View>
            </Card>
          </Pressable>
        )}
      />
      <BottomNav
        active="properties"
        onProperties={() => undefined}
        onSync={() => navigation.navigate('SyncQueue')}
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
    paddingLeft: 14,
  },
  searchIcon: { fontSize: 24, color: colors.muted, marginRight: 8 },
  search: { flex: 1, color: colors.ink, fontSize: 15 },
  filter: {
    height: 36,
    paddingHorizontal: 13,
    marginRight: 7,
    justifyContent: 'center',
    backgroundColor: colors.slateSoft,
    borderRadius: 10,
  },
  filterText: { fontSize: 12, color: colors.ink, fontWeight: '700' },
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
  connectionText: { fontSize: 12, color: colors.muted },
  list: { padding: spacing.lg, paddingTop: spacing.md, gap: 12 },
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
  meta: { fontSize: 11, color: colors.muted },
});
