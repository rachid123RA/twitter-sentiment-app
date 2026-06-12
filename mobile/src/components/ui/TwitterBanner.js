import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const VARIANTS = {
  hero: { colors: ['#1DA1F2', '#0d8bd9', '#0f1419'], icon: 'logo-twitter', iconSize: 56 },
  feed: { colors: ['#0d8bd9', '#1DA1F2', '#14171a'], icon: 'chatbubbles-outline', iconSize: 40 },
  chart: { colors: ['#14171a', '#1DA1F2', '#0d8bd9'], icon: 'bar-chart-outline', iconSize: 36 },
  nlp: { colors: ['#794BC4', '#1DA1F2', '#0d8bd9'], icon: 'git-network-outline', iconSize: 40 },
};

/**
 * Bannière Twitter sans image réseau (fonctionne hors ligne / sans Unsplash).
 */
export default function TwitterBanner({ variant = 'hero', style, height }) {
  const v = VARIANTS[variant] || VARIANTS.hero;
  return (
    <LinearGradient
      colors={v.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.banner, height != null ? { height } : null, style]}
    >
      <View style={styles.pattern}>
        {[0, 1, 2].map((i) => (
          <Ionicons
            key={i}
            name={v.icon}
            size={v.iconSize}
            color="rgba(255,255,255,0.12)"
            style={{ position: 'absolute', right: 20 + i * 24, top: 12 + i * 16 }}
          />
        ))}
      </View>
      <Ionicons name={v.icon} size={Math.min(v.iconSize, 32)} color="rgba(255,255,255,0.5)" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pattern: { ...StyleSheet.absoluteFillObject },
});
