import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function StatCard({ label, value, sub, colors = ['#1DA1F2', '#0d8bd9'], iconName }) {
  return (
    <LinearGradient colors={colors} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {iconName ? (
        <Ionicons name={iconName} size={22} color="rgba(255,255,255,0.95)" style={styles.icon} />
      ) : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    minWidth: '47%',
    flex: 1,
    margin: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon: { marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '800', color: '#fff' },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, fontWeight: '600' },
  sub: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});
