import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const W = Dimensions.get('window').width;

export default function ImageBanner({ uri, title, subtitle, height = 200 }) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.textWrap}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: W - 32,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  textWrap: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4, lineHeight: 18 },
});
