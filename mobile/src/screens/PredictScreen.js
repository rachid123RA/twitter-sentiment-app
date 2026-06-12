import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TwitterBanner from '../components/ui/TwitterBanner';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { COLORS } from '../config';
import { TWEET_EXAMPLES, SENTIMENT_ICONS } from '../constants/education';
import { H_PADDING } from '../theme/layout';
import NlpDetailsPanel from '../components/nlp/NlpDetailsPanel';
import SentimentChatbot from '../components/nlp/SentimentChatbot';

const MAX_LEN = 280;

export default function PredictScreen({ navigation, route }) {
  const [tweet, setTweet] = useState(route.params?.prefill || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!tweet.trim()) {
      Alert.alert('Tweet requis', 'Saisissez le texte du tweet à analyser.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.predict(tweet.trim());
      setResult(data);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTweet('');
  };

  const chatContext = result
    ? {
        tweet_raw: result.tweet_raw || tweet,
        tweet_clean: result.tweet_clean,
        label: result.label,
        probabilities: result.probabilities,
        nlp: result.nlp,
      }
    : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TwitterBanner variant="feed" style={styles.headerImg} height={120} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Analyser un tweet</Text>
          <Text style={styles.sub}>
            Classification NLP · détection des mots · explication du sentiment · chatbot
          </Text>
        </View>

        {!result ? (
          <View style={styles.formCard}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Texte du tweet</Text>
              <Text style={styles.counter}>
                {tweet.length}/{MAX_LEN}
              </Text>
            </View>
            <TextInput
              style={styles.textarea}
              multiline
              placeholder="Ex: I love this product! Amazing quality..."
              placeholderTextColor="#AAB8C2"
              value={tweet}
              onChangeText={(t) => setTweet(t.slice(0, MAX_LEN))}
              maxLength={MAX_LEN}
            />

            <Text style={styles.examplesLabel}>Exemples rapides</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {TWEET_EXAMPLES.map((ex) => (
                <TouchableOpacity key={ex} style={styles.chip} onPress={() => setTweet(ex)}>
                  <Text numberOfLines={2} style={styles.chipText}>
                    {ex.length > 40 ? `${ex.slice(0, 40)}…` : ex}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.submitWrap} onPress={submit} disabled={loading}>
              <LinearGradient colors={['#1DA1F2', '#0d8bd9']} style={styles.submit}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="analytics" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitText}>Classifier le sentiment</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={[COLORS[result.label] || '#1DA1F2', '#0f1419']}
              style={styles.resultHero}
            >
              <Ionicons
                name={SENTIMENT_ICONS[result.label] || 'help-circle-outline'}
                size={40}
                color="#fff"
              />
              <Text style={styles.resultLabel}>{result.label}</Text>
              <Text style={styles.resultProb}>
                Confiance : {((result.probabilities?.[result.label] || 0) * 100).toFixed(1)} %
              </Text>
            </LinearGradient>

            <View style={styles.probCard}>
              <Text style={styles.probTitle}>Probabilités par classe</Text>
              {Object.entries(result.probabilities || {}).map(([lbl, p]) => (
                <View key={lbl} style={styles.probRow}>
                  <Text style={[styles.probLbl, { color: COLORS[lbl] }]}>{lbl}</Text>
                  <View style={styles.probBg}>
                    <View
                      style={[
                        styles.probFill,
                        { width: `${p * 100}%`, backgroundColor: COLORS[lbl] },
                      ]}
                    />
                  </View>
                  <Text style={styles.probVal}>{(p * 100).toFixed(0)}%</Text>
                </View>
              ))}
            </View>

            <NlpDetailsPanel nlp={result.nlp} label={result.label} />

            <SentimentChatbot
              context={chatContext}
              onContextUpdate={(ctx) =>
                setResult((r) => (r ? { ...r, ...ctx, nlp: ctx.nlp || r.nlp } : r))
              }
            />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
                <Ionicons name="refresh-outline" size={18} color="#1DA1F2" />
                <Text style={styles.secondaryText}>Nouvelle analyse</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Result', { result })}
              >
                <Ionicons name="expand-outline" size={18} color="#1DA1F2" />
                <Text style={styles.secondaryText}>Vue détaillée</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!result ? (
          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Pipeline NLP</Text>
            <Text style={styles.hintItem}>• Nettoyage : URLs, @mentions, hashtags</Text>
            <Text style={styles.hintItem}>• Vectorisation TF-IDF + classification SGD</Text>
            <Text style={styles.hintItem}>• Explication : mots détectés + termes influents</Text>
            <Text style={styles.hintItem}>• Chatbot : « Pourquoi ce sentiment ? »</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  headerImg: { width: '100%', height: 120, borderRadius: 16, marginTop: 8 },
  headerText: { paddingVertical: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f1419' },
  sub: { fontSize: 14, color: '#657786', marginTop: 6, lineHeight: 20 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontWeight: '700', fontSize: 15, color: '#0f1419' },
  counter: { fontSize: 12, color: '#657786' },
  textarea: {
    backgroundColor: '#F5F8FA',
    borderRadius: 14,
    padding: 14,
    minHeight: 140,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#0f1419',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  examplesLabel: { fontSize: 13, fontWeight: '600', color: '#657786', marginTop: 16, marginBottom: 8 },
  chips: { marginBottom: 16 },
  chip: {
    backgroundColor: '#E8F5FE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: '#CCE7F7',
  },
  chipText: { fontSize: 12, color: '#0f1419' },
  submitWrap: { borderRadius: 16, overflow: 'hidden' },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  resultHero: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 8 },
  resultProb: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  probCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  probTitle: { fontWeight: '800', marginBottom: 12, fontSize: 15 },
  probRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  probLbl: { width: 72, fontSize: 12, fontWeight: '700' },
  probBg: { flex: 1, height: 8, backgroundColor: '#E8EFF5', borderRadius: 4, marginHorizontal: 8 },
  probFill: { height: '100%', borderRadius: 4 },
  probVal: { width: 36, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  secondaryText: { color: '#1DA1F2', fontWeight: '700', fontSize: 13 },
  hintCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1DA1F2',
  },
  hintTitle: { fontWeight: '700', marginBottom: 8 },
  hintItem: { fontSize: 13, color: '#657786', marginBottom: 4 },
});
