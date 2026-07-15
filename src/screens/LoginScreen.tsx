import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/ui';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../auth';
import { ApiError } from '../api/errors';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('agent@nyumban.test');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setError('The email or password is incorrect.');
      } else if (
        requestError instanceof Error &&
        requestError.message.includes('ASSESSMENT_KEY')
      ) {
        setError('This build is missing its assessment key.');
      } else {
        setError('Could not sign in. Check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

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
            autoCorrect={false}
            editable={!submitting}
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            editable={!submitting}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            returnKeyType="done"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label={submitting ? 'Signing in…' : 'Sign in'}
            onPress={submit}
            disabled={submitting}
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
  error: { color: colors.red, fontSize: 12, lineHeight: 18, marginBottom: 2 },
});
