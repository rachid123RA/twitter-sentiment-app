import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import TwitterBanner from '../components/ui/TwitterBanner';
import { H_PADDING } from '../theme/layout';
import { api } from '../api';
import { API_URL, COLORS } from '../config';
import { SENTIMENT_ICONS } from '../constants/education';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LABELS = ['Positive', 'Negative', 'Neutral', 'Irrelevant'];

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.predictionsAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      setTotal(res.total ?? list.length);
    } catch (e) {
      setError(e.message || 'Erreur de chargement');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const ListHeader = () => (
    <>
      <TwitterBanner variant="hero" style={styles.hero} height={100} />
      <View style={styles.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Historique</Text>
          <Text style={styles.sub}>
            {loading ? 'Chargement…' : `${total} prédiction(s) enregistrée(s)`}
          </Text>
        </View>
        <Ionicons name="logo-twitter" size={32} color="#1DA1F2" />
      </View>
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="cloud-offline-outline" size={22} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>API : {API_URL}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  const ListEmpty = () => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      );
    }
    if (error) return null;
    return (
      <View style={styles.empty}>
        <Ionicons name="document-text-outline" size={48} color="#AAB8C2" />
        <Text style={styles.emptyText}>Aucune prédiction pour ce compte.</Text>
        <Text style={styles.emptyHint}>
          Allez dans Accueil → « Analyser un tweet », puis revenez ici. L&apos;historique est lié à
          votre compte connecté.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1DA1F2" />
        }
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          const probs = item.probabilities || {
            Positive: item.prob_positive,
            Negative: item.prob_negative,
            Neutral: item.prob_neutral,
            Irrelevant: item.prob_irrelevant,
          };
          const color = COLORS[item.label] || '#1DA1F2';
          const conf =
            item.confidence ??
            Math.round((probs[item.label] || 0) * 1000) / 10;

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => toggleExpand(item.id)}
            >
              <View style={styles.cardTop}>
                <View style={[styles.chip, { backgroundColor: color + '22' }]}>
                  <Ionicons
                    name={SENTIMENT_ICONS[item.label] || 'help-circle-outline'}
                    size={16}
                    color={color}
                  />
                  <Text style={[styles.chipText, { color }]}>{item.label}</Text>
                </View>
                <View style={styles.confWrap}>
                  <Text style={styles.confLabel}>Confiance</Text>
                  <Text style={[styles.confVal, { color }]}>{conf}%</Text>
                </View>
              </View>

              <Text style={styles.date}>
                {formatDate(item.created_at)} · #{item.id}
              </Text>

              <Text style={styles.sectionLbl}>Tweet original</Text>
              <Text style={styles.tweet}>{item.tweet_raw}</Text>

              {expanded ? (
                <View style={styles.details}>
                  {item.tweet_clean ? (
                    <>
                      <Text style={styles.sectionLbl}>Texte nettoyé (NLP)</Text>
                      <Text style={styles.cleanText}>{item.tweet_clean}</Text>
                    </>
                  ) : null}

                  <Text style={styles.sectionLbl}>Probabilités</Text>
                  {LABELS.map((lbl) => {
                    const p = Number(probs[lbl]) || 0;
                    return (
                      <View key={lbl} style={styles.probRow}>
                        <Text style={[styles.probLbl, { color: COLORS[lbl] }]}>{lbl}</Text>
                        <View style={styles.probBg}>
                          <View
                            style={[
                              styles.probFill,
                              {
                                width: `${Math.min(100, p * 100)}%`,
                                backgroundColor: COLORS[lbl],
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.probPct}>{(p * 100).toFixed(1)}%</Text>
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.reopenBtn}
                    onPress={() =>
                      navigation.getParent()?.navigate('Result', {
                        result: {
                          label: item.label,
                          probabilities: probs,
                          tweet_raw: item.tweet_raw,
                          tweet_clean: item.tweet_clean,
                        },
                      })
                    }
                  >
                    <Ionicons name="open-outline" size={18} color="#1DA1F2" />
                    <Text style={styles.reopenText}>Analyse complète + chatbot</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.tapHint}>Appuyer pour le détail NLP</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso || '';
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F5F8FA' },
  listContent: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 32,
    flexGrow: 1,
  },
  hero: { marginTop: 8 },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f1419' },
  sub: { fontSize: 13, color: '#657786', marginTop: 4 },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: { color: '#C62828', marginTop: 8, fontWeight: '600' },
  errorHint: { fontSize: 11, color: '#657786', marginTop: 4 },
  retryBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#657786', marginTop: 12, fontWeight: '600', textAlign: 'center' },
  emptyHint: { color: '#AAB8C2', marginTop: 8, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EFF5',
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipText: { fontWeight: '800', fontSize: 14 },
  confWrap: { alignItems: 'flex-end' },
  confLabel: { fontSize: 10, color: '#657786' },
  confVal: { fontSize: 18, fontWeight: '800' },
  date: { fontSize: 11, color: '#657786', marginTop: 10, marginBottom: 8 },
  sectionLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1DA1F2',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  tweet: { fontSize: 15, color: '#0f1419', lineHeight: 22 },
  cleanText: {
    fontSize: 14,
    color: '#657786',
    fontStyle: 'italic',
    backgroundColor: '#F5F8FA',
    padding: 10,
    borderRadius: 8,
    lineHeight: 20,
  },
  details: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F5F8FA', paddingTop: 8 },
  probRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  probLbl: { width: 72, fontSize: 12, fontWeight: '600' },
  probBg: { flex: 1, height: 8, backgroundColor: '#E8EFF5', borderRadius: 4, marginHorizontal: 8 },
  probFill: { height: '100%', borderRadius: 4 },
  probPct: { width: 44, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  tapHint: { fontSize: 12, color: '#1DA1F2', marginTop: 10, fontWeight: '600' },
  reopenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    padding: 12,
    backgroundColor: '#E8F5FE',
    borderRadius: 12,
  },
  reopenText: { color: '#1DA1F2', fontWeight: '700', fontSize: 13 },
});
