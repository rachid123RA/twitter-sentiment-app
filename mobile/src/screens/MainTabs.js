import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/layout/AppHeader';
import DashboardScreen from './DashboardScreen';
import HistoryScreen from './HistoryScreen';
import AnalysisScreen from './AnalysisScreen';
import VariablesScreen from './VariablesScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Accueil: { active: 'home', inactive: 'home-outline' },
  Historique: { active: 'time', inactive: 'time-outline' },
  Analyse: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  Guide: { active: 'book', inactive: 'book-outline' },
};

function TabIcon({ routeName, label, focused }) {
  const icons = TAB_ICONS[routeName] || { active: 'ellipse', inactive: 'ellipse-outline' };
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? icons.active : icons.inactive}
          size={22}
          color={focused ? '#1DA1F2' : '#657786'}
        />
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function MainTabs({ navigation }) {
  const goPredict = () => navigation.navigate('Predict');

  return (
    <View style={styles.root}>
      <AppHeader navigation={navigation} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon routeName={route.name} label={route.name} focused={focused} />
          ),
        })}
      >
        <Tab.Screen name="Accueil">
          {() => <DashboardScreen onPredict={goPredict} />}
        </Tab.Screen>
        <Tab.Screen name="Historique" component={HistoryScreen} />
        <Tab.Screen name="Analyse" component={AnalysisScreen} />
        <Tab.Screen name="Guide" component={VariablesScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F8FA' },
  tabBar: {
    height: 72,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8EFF5',
    elevation: 8,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: { backgroundColor: '#E8F5FE' },
  label: { fontSize: 10, color: '#657786', marginTop: 2, fontWeight: '500' },
  labelActive: { color: '#1DA1F2', fontWeight: '700' },
});
