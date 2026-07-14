import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/ui';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomInspection'>;

export function RoomInspectionScreen({ navigation, route }: Props) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>ROOM CONDITION</Text>
      <Text style={styles.title}>
        How is the {route.params.roomName.toLowerCase()}?
      </Text>
      <Text style={styles.subtitle}>
        Choose the condition that best reflects what you see.
      </Text>
      <View style={styles.conditions}>
        {[
          ['Good', 'No action needed', colors.primarySoft, colors.primary],
          ['Fair', 'Minor attention needed', colors.amberSoft, colors.amber],
          ['Poor', 'Repair or replacement needed', colors.redSoft, colors.red],
        ].map(([label, help, bg, color]) => (
          <Pressable key={label} style={styles.condition}>
            <View style={[styles.conditionIcon, { backgroundColor: bg }]}>
              <Text style={[styles.conditionIconText, { color }]}>✓</Text>
            </View>
            <View style={styles.conditionCopy}>
              <Text style={styles.conditionLabel}>{label}</Text>
              <Text style={styles.conditionHelp}>{help}</Text>
            </View>
            <View style={styles.radio} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>
        Notes <Text style={styles.optional}>OPTIONAL</Text>
      </Text>
      <TextInput
        style={styles.notes}
        placeholder="Describe damage, wear, or anything the office should know…"
        placeholderTextColor={colors.muted}
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.label}>
        Photo evidence <Text style={styles.optional}>OPTIONAL</Text>
      </Text>
      <Pressable style={styles.photoBox}>
        <View style={styles.camera}>
          <Text style={styles.cameraText}>＋</Text>
        </View>
        <Text style={styles.photoTitle}>Add a photo</Text>
        <Text style={styles.photoHelp}>Photos will upload when connected</Text>
      </Pressable>
      <PrimaryButton label="Save room" onPress={() => navigation.goBack()} />
      <Text style={styles.saved}>
        Changes save automatically on this device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: 40 },
  eyebrow: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 4,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    color: colors.ink,
    marginTop: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  conditions: { gap: 10, marginBottom: spacing.xl },
  condition: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
  },
  conditionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionIconText: { fontSize: 18, fontWeight: '900' },
  conditionCopy: { flex: 1, marginLeft: 12 },
  conditionLabel: { fontSize: 15, color: colors.ink, fontWeight: '800' },
  conditionHelp: { fontSize: 11, color: colors.muted, marginTop: 4 },
  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.line,
  },
  label: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '800',
    marginBottom: 9,
  },
  optional: { fontSize: 9, color: colors.muted, letterSpacing: 0.8 },
  notes: {
    minHeight: 115,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  photoBox: {
    height: 138,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BFC8C2',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  camera: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraText: { color: colors.primary, fontSize: 22, fontWeight: '500' },
  photoTitle: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '800',
    marginTop: 8,
  },
  photoHelp: { fontSize: 11, color: colors.muted, marginTop: 3 },
  saved: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 10,
  },
});
