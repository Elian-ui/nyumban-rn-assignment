import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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

type Props = NativeStackScreenProps<RootStackParamList, 'SyncQueue'>;

export function SyncQueueScreen({ navigation }: Props) {
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
            <Text style={styles.summaryTitle}>2 inspections waiting</Text>
            <Text style={styles.summaryText}>
              They are safe on this device and will remain here until the server
              confirms them.
            </Text>
          </View>
        </Card>
        <PrimaryButton label="Sync now" onPress={() => undefined} />
        <View style={styles.section}>
          <SectionTitle title="Waiting to sync" action="2 items" />
          <Card style={styles.item}>
            <View style={styles.itemTop}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>Kireka Heights Block C</Text>
                <Text style={styles.itemMeta}>Routine · Today, 10:42</Text>
              </View>
              <Pill label="Queued" tone="amber" />
            </View>
            <View style={styles.divider} />
            <Text style={styles.detail}>
              5 rooms · 3 photos · Ready to upload
            </Text>
          </Card>
          <Card style={styles.item}>
            <View style={styles.itemTop}>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>Ntinda View Apartments</Text>
                <Text style={styles.itemMeta}>Move-out · Yesterday, 16:18</Text>
              </View>
              <Pill label="Needs attention" tone="red" />
            </View>
            <View style={styles.divider} />
            <Text style={styles.error}>
              Property changed on the server. Your inspection is still safe.
            </Text>
          </Card>
        </View>
        <View style={styles.section}>
          <SectionTitle title="Recently synced" />
          <Card style={styles.item}>
            <View style={styles.itemTop}>
              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>Bukoto Gardens</Text>
                <Text style={styles.itemMeta}>Routine · 14 Jul, 11:05</Text>
              </View>
              <Pill label="Synced" />
            </View>
          </Card>
        </View>
      </ScrollView>
      <BottomNav
        active="sync"
        onProperties={() => navigation.navigate('Properties')}
        onSync={() => undefined}
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
  section: { marginTop: spacing.xl },
  item: { marginBottom: 11 },
  itemTop: { flexDirection: 'row', alignItems: 'center' },
  itemCopy: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  itemMeta: { fontSize: 11, color: colors.muted, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 12 },
  detail: { fontSize: 12, color: colors.muted },
  error: { fontSize: 12, lineHeight: 18, color: colors.red },
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
