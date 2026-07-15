import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  label,
  tone = 'green',
  style,
}: {
  label: string;
  tone?: 'green' | 'amber' | 'grey' | 'red';
  style?: StyleProp<ViewStyle>;
}) {
  const tones = {
    green: [styles.pillGreen, styles.pillTextGreen],
    amber: [styles.pillAmber, styles.pillTextAmber],
    grey: [styles.pillGrey, styles.pillTextGrey],
    red: [styles.pillRed, styles.pillTextRed],
  } as const;
  return (
    <View style={[styles.pill, tones[tone][0], style]}>
      <Text style={[styles.pillText, tones[tone][1]]}>{label}</Text>
    </View>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function BottomNav({
  active,
  onProperties,
  onInspections,
  onSync,
  syncCount,
}: {
  active: 'properties' | 'inspections' | 'sync';
  onProperties: () => void;
  onInspections: () => void;
  onSync: () => void;
  syncCount?: number;
}) {
  return (
    <View style={styles.bottomNav}>
      <Pressable style={styles.navItem} onPress={onProperties}>
        <Text
          style={[styles.navIcon, active === 'properties' && styles.navActive]}
        >
          ⌂
        </Text>
        <Text
          style={[styles.navLabel, active === 'properties' && styles.navActive]}
        >
          Properties
        </Text>
      </Pressable>
      <Pressable style={styles.navItem} onPress={onInspections}>
        <Text
          style={[styles.navIcon, active === 'inspections' && styles.navActive]}
        >
          ≡
        </Text>
        <Text
          style={[
            styles.navLabel,
            active === 'inspections' && styles.navActive,
          ]}
        >
          Inspections
        </Text>
      </Pressable>
      <Pressable style={styles.navItem} onPress={onSync}>
        <View>
          <Text style={[styles.navIcon, active === 'sync' && styles.navActive]}>
            ↻
          </Text>
          {syncCount ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {syncCount > 99 ? '99+' : syncCount}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.navLabel, active === 'sync' && styles.navActive]}>
          Sync
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.86 },
  disabled: { opacity: 0.45 },
  pill: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  pillGreen: { backgroundColor: colors.primarySoft },
  pillTextGreen: { color: colors.primaryDark },
  pillAmber: { backgroundColor: colors.amberSoft },
  pillTextAmber: { color: colors.amber },
  pillGrey: { backgroundColor: colors.slateSoft },
  pillTextGrey: { color: colors.muted },
  pillRed: { backgroundColor: colors.redSoft },
  pillTextRed: { color: colors.red },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 19, color: colors.ink, fontWeight: '800' },
  sectionAction: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  bottomNav: {
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navIcon: { fontSize: 23, color: colors.muted, fontWeight: '700' },
  navLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  navActive: { color: colors.primary },
  badge: {
    position: 'absolute',
    right: -11,
    top: -3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    backgroundColor: colors.amber,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, color: colors.surface, fontWeight: '800' },
});
