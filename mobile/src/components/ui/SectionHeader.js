import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#0f1419' },
  sub: { fontSize: 13, color: '#657786', marginTop: 4, lineHeight: 18 },
});
