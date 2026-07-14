import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { PrimaryButton } from '../components/ui';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View>
          <View style={styles.mark}>
            <Text style={styles.markText}>N</Text>
          </View>
          <Text style={styles.brand}>Nyumban</Text>
          <Text style={styles.title}>
            Field inspections,{`\n`}built for anywhere.
          </Text>
          <Text style={styles.subtitle}>
            Sign in to access your properties and continue work offline.
          </Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="agent@nyumban.test"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={colors.muted}
            secureTextEntry
          />
          <PrimaryButton
            label="Sign in"
            onPress={() => navigation.replace('Properties')}
          />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  mark: {
    width: 46,
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  markText: { color: colors.surface, fontWeight: '900', fontSize: 24 },
  brand: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  title: {
    marginTop: spacing.xl,
    color: colors.ink,
    fontWeight: '900',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 14,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 340,
  },
  form: { gap: spacing.sm, paddingBottom: spacing.lg },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  helper: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
});
