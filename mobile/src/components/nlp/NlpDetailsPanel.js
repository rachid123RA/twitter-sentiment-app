import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config';

export default function NlpDetailsPanel({ nlp, label }) {
  if (!nlp) return null;
  const color = COLORS[label] || '#1DA1F2';

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Ionicons name="git-network-outline" size={22} color={color} />
        <Text style={styles.title}>Traitement NLP</Text>
      </View>

      {nlp.summary_fr ? (
        <View style={[styles.summaryBox, { borderLeftColor: color }]}>
          <Text style={styles.summaryTitle}>Pourquoi {label} ?</Text>
          <Text style={styles.summaryText}>{nlp.summary_fr}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Étapes de prétraitement</Text>
      {(nlp.preprocessing || []).map((s, i) => (
        <View key={`${s.step}-${i}`} style={styles.stepRow}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepName}>{s.step}</Text>
            <Text style={styles.stepDetail} numberOfLines={3}>
              {s.detail}
            </Text>
          </View>
        </View>
      ))}

      {nlp.tokens?.tokens?.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>
            Mots détectés ({nlp.tokens.token_count} tokens)
          </Text>
          <View style={styles.chipWrap}>
            {nlp.tokens.tokens.map((t) => (
              <View key={t} style={styles.chip}>
                <Text style={styles.chipText}>{t}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {Object.entries(nlp.tokens?.lexicon_hits || {}).map(([sent, words]) =>
        words.length > 0 ? (
          <View key={sent} style={styles.lexRow}>
            <View style={[styles.lexDot, { backgroundColor: COLORS[sent] || '#999' }]} />
            <Text style={styles.lexText}>
              {sent} : {words.join(', ')}
            </Text>
          </View>
        ) : null
      )}

      {(nlp.top_features || []).length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Termes TF-IDF influents</Text>
          {nlp.top_features.map((f) => (
            <View key={f.term} style={styles.featRow}>
              <Text style={styles.featTerm}>{f.term}</Text>
              <Text style={styles.featScore}>
                {f.contribution > 0 ? '+' : ''}
                {f.contribution.toFixed(3)}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: '#0f1419' },
  summaryBox: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 14,
  },
  summaryTitle: { fontWeight: '700', color: '#0f1419', marginBottom: 6 },
  summaryText: { fontSize: 13, color: '#657786', lineHeight: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1DA1F2',
    marginTop: 8,
    marginBottom: 8,
  },
  stepRow: { flexDirection: 'row', marginBottom: 10 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E8F5FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumText: { fontSize: 12, fontWeight: '800', color: '#1DA1F2' },
  stepBody: { flex: 1 },
  stepName: { fontWeight: '700', fontSize: 13, color: '#0f1419' },
  stepDetail: { fontSize: 12, color: '#657786', marginTop: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    backgroundColor: '#F5F8FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  chipText: { fontSize: 12, color: '#0f1419' },
  lexRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  lexDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  lexText: { fontSize: 12, color: '#0f1419', flex: 1 },
  featRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8FA',
  },
  featTerm: { fontSize: 13, fontWeight: '600', color: '#0f1419' },
  featScore: { fontSize: 13, fontWeight: '700', color: '#1DA1F2' },
});
