import React from 'react';
import { StatusBar } from 'react-native';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.canvas },
            headerTitleStyle: { fontSize: 17, fontWeight: '700' },
            headerTintColor: colors.ink,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
