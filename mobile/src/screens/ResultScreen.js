import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import TwitterBanner from '../components/ui/TwitterBanner';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { COLORS } from '../config';
import { SENTIMENT_ICONS } from '../constants/education';
import { H_PADDING } from '../theme/layout';
import NlpDetailsPanel from '../components/nlp/NlpDetailsPanel';
import SentimentChatbot from '../components/nlp/SentimentChatbot';

const W = Dimensions.get('window').width;

export default function ResultScreen({ route }) {
  const [result, setResult] = useState(route.params.result);
  const color = COLORS[result.label] || COLORS.primary;
  const probs = result.probabilities || {};

  const pieData = Object.entries(probs).map(([label, p]) => ({
    value: Math.max(p * 100, 0.1),
    color: COLORS[label] || '#999',
    text: `${(p * 100).toFixed(0)}%`,
  }));

  const chatContext = {
    tweet_raw: result.tweet_raw,
    tweet_clean: result.tweet_clean,
    label: result.label,
    probabilities: result.probabilities,
    nlp: result.nlp,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[color, '#0f1419']} style={styles.hero}>
        <Ionicons
          name={SENTIMENT_ICONS[result.label] || 'help-circle-outline'}
          size={48}
          color="#fff"
        />
        <Text style={styles.heroLabel}>{result.label}</Text>
        <Text style={styles.heroSub}>Sentiment détecté · NLP + ML</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Répartition des probabilités</Text>
        <View style={styles.pieRow}>
          <PieChart data={pieData} donut radius={75} innerRadius={48} innerCircleColor="#fff" />
          <View style={styles.legend}>
            {Object.entries(probs).map(([label, p]) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: COLORS[label] }]} />
                <Text style={styles.legendLabel}>{label}</Text>
                <Text style={styles.legendVal}>{(p * 100).toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {result.tweet_raw ? (
        <View style={styles.cleanCard}>
          <Text style={styles.cleanTitle}>Tweet original</Text>
          <Text style={styles.cleanText}>{result.tweet_raw}</Text>
        </View>
      ) : null}

      <NlpDetailsPanel nlp={result.nlp} label={result.label} />

      <SentimentChatbot
        context={chatContext}
        onContextUpdate={(ctx) =>
          setResult((r) => ({ ...r, ...ctx, nlp: ctx.nlp || r.nlp }))
        }
      />

      <TwitterBanner variant="nlp" style={styles.footerImg} height={80} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  hero: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  heroLabel: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  sectionTitle: { fontWeight: '800', fontSize: 16, marginBottom: 12 },
  pieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  legend: { flex: 1, marginLeft: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 13 },
  legendVal: { fontWeight: '700', fontSize: 13 },
  cleanCard: {
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#E8F5FE',
    borderRadius: 12,
  },
  cleanTitle: { fontWeight: '700', fontSize: 12, color: '#1DA1F2' },
  cleanText: { marginTop: 6, fontSize: 14, color: '#0f1419', lineHeight: 20 },
  footerImg: { height: 80, borderRadius: 12, marginTop: 8 },
});
