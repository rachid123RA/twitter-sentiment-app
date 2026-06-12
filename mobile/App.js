import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainTabs from './src/screens/MainTabs';
import PredictScreen from './src/screens/PredictScreen';
import ResultScreen from './src/screens/ResultScreen';
import AdminScreen from './src/screens/AdminScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Predict"
            component={PredictScreen}
            options={{
              headerShown: true,
              title: 'Analyser un tweet',
              headerTintColor: '#1DA1F2',
              headerStyle: { backgroundColor: '#fff' },
            }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{
              headerShown: true,
              title: 'Résultat',
              headerTintColor: '#1DA1F2',
              headerStyle: { backgroundColor: '#fff' },
            }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
