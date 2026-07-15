import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from './src/theme';
import type { RootStackParamList } from './src/navigation/types';
import { LoginScreen } from './src/screens/LoginScreen';
import { PropertiesScreen } from './src/screens/PropertiesScreen';
import { PropertyDetailScreen } from './src/screens/PropertyDetailScreen';
import { InspectionScreen } from './src/screens/InspectionScreen';
import { RoomInspectionScreen } from './src/screens/RoomInspectionScreen';
import { SyncQueueScreen } from './src/screens/SyncQueueScreen';
import { initializeDatabase } from './src/database';
import { AuthProvider, useAuth } from './src/auth';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { status } = useAuth();

  if (status === 'restoring') {
    return (
      <View style={styles.databaseState}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.databaseMessage}>Restoring secure session…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.canvas },
          headerTitleStyle: { fontSize: 17, fontWeight: '700' },
          headerTintColor: colors.ink,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        {status === 'authenticated' ? (
          <>
            <Stack.Screen
              name="Properties"
              component={PropertiesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PropertyDetail"
              component={PropertyDetailScreen}
              options={{ title: 'Property' }}
            />
            <Stack.Screen
              name="Inspection"
              component={InspectionScreen}
              options={{ title: 'Routine inspection' }}
            />
            <Stack.Screen
              name="RoomInspection"
              component={RoomInspectionScreen}
              options={({ route }) => ({ title: route.params.roomName })}
            />
            <Stack.Screen
              name="SyncQueue"
              component={SyncQueueScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function DatabaseGate() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const prepareDatabase = useCallback(() => {
    setState('loading');
    initializeDatabase().then(
      () => setState('ready'),
      () => setState('error'),
    );
  }, []);

  useEffect(() => {
    prepareDatabase();
  }, [prepareDatabase]);

  if (state === 'ready') {
    return (
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    );
  }

  return (
    <View style={styles.databaseState}>
      {state === 'loading' ? (
        <>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.databaseMessage}>Preparing offline data…</Text>
        </>
      ) : (
        <>
          <Text style={styles.databaseTitle}>Offline storage unavailable</Text>
          <Text style={styles.databaseMessage}>
            Nyumban could not prepare its local database.
          </Text>
          <Pressable style={styles.retryButton} onPress={prepareDatabase}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />
      <DatabaseGate />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  databaseState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: colors.canvas,
  },
  databaseTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  databaseMessage: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryText: { color: colors.surface, fontSize: 14, fontWeight: '800' },
});

export default App;
