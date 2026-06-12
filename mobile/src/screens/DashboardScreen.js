import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TwitterBanner from '../components/ui/TwitterBanner';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { api } from '../api';
import { COLORS } from '../config';
import {
  mergeModelMetrics,
  mergeDataset,
  mergeCvModels,
  NOTEBOOK_METRICS,
} from '../constants/notebookMetrics';
import { PIPELINE_STEPS } from '../constants/education';
import { CV_COLORS } from '../constants/education';
import StatCard from '../components/ui/StatCard';
import SectionHeader from '../components/ui/SectionHeader';
import { H_PADDING } from '../theme/layout';

const W = Dimensions.get('window').width;
const CHART_W = W - H_PADDING * 2 - 32;

export default function DashboardScreen({ onPredict }) {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const dash = await api.dashboard();
      setData(dash);
    } catch (e) {
      console.warn(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const model = mergeModelMetrics(data?.model);
  const dataset = mergeDataset(data?.dataset);
  const preds = data?.predictions || {};
  const dist = dataset.sentiment_distribution || {};
  const cvModels = mergeCvModels(data?.cv_models);
  const trainRows = dataset.train_rows;

  const pieData = Object.entries(dist).map(([label, count]) => ({
    value: Number(count) || 1,
    color: COLORS[label] || '#999',
    text: label?.slice(0, 3),
  }));

  const metricBarData = [
    { value: model.accuracy * 100, label: 'Acc', frontColor: '#1DA1F2' },
    { value: model.f1_macro * 100, label: 'F1', frontColor: '#17BF63' },
    { value: model.precision_macro * 100, label: 'Prec', frontColor: '#794BC4' },
    { value: model.recall_macro * 100, label: 'Rec', frontColor: '#F45D22' },
    { value: model.cv_f1_macro * 100, label: 'CV', frontColor: '#FFAD1F' },
  ];

  const cvCompareData = cvModels.map((m, i) => ({
    value: (m.f1 || 0) * 100,
    label: m.name?.length > 6 ? m.name.slice(0, 6) : m.name,
    frontColor: m.color || CV_COLORS[i % CV_COLORS.length],
  }));

  const userPredBar = [
    { value: preds.positive || 0, label: 'Pos', frontColor: COLORS.Positive },
    { value: preds.negative || 0, label: 'Neg', frontColor: COLORS.Negative },
    { value: preds.neutral || 0, label: 'Neu', frontColor: COLORS.Neutral },
    { value: preds.irrelevant || 0, label: 'Irr', frontColor: COLORS.Irrelevant },
  ];

  const hasMetrics = metricBarData.some((b) => b.value > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1DA1F2" />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <TwitterBanner variant="hero" style={StyleSheet.absoluteFill} height={200} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroOverlay}>
          <View style={styles.heroBadgeRow}>
            <Ionicons name="logo-twitter" size={14} color="#fff" />
            <Text style={styles.heroBadge}> Sentiment AI</Text>
          </View>
          <Text style={styles.heroTitle}>Analyse de sentiment Twitter</Text>
          <Text style={styles.heroSub}>
            Détection automatique · 4 classes · TF-IDF + Machine Learning
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.cta} onPress={onPredict} activeOpacity={0.85}>
        <LinearGradient colors={['#17BF63', '#0d9e4f']} style={styles.ctaGrad}>
          <Ionicons name="create-outline" size={28} color="#fff" style={{ marginRight: 12 }} />
          <View style={styles.ctaTextWrap}>
            <Text style={styles.ctaTitle}>Analyser un tweet</Text>
            <Text style={styles.ctaSub}>Saisir un texte · NLP · chatbot explicatif</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <SectionHeader
        title="Indicateurs du modèle"
        subtitle="Jeu de test — notebook twitter_sentiment_final"
      />
      <View style={styles.statGrid}>
        <StatCard
          label="Accuracy"
          value={pct(model.accuracy)}
          sub="Exactitude test"
          colors={['#1DA1F2', '#0a7bc4']}
          iconName="checkmark-circle-outline"
        />
        <StatCard
          label="F1 Macro"
          value={pct(model.f1_macro)}
          sub="Équilibre classes"
          colors={['#17BF63', '#0d8a4a']}
          iconName="stats-chart-outline"
        />
        <StatCard
          label="F1 Weighted"
          value={pct(model.f1_weighted)}
          sub="Pondéré support"
          colors={['#794BC4', '#5a3599']}
          iconName="pie-chart-outline"
        />
        <StatCard
          label="CV F1 Macro"
          value={pct(model.cv_f1_macro)}
          sub="GridSearchCV"
          colors={['#F45D22', '#c44a1a']}
          iconName="refresh-outline"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Comparaison des métriques (%)</Text>
        <Text style={styles.cardSub}>Accuracy · F1 · Précision · Rappel · CV F1</Text>
        {hasMetrics ? (
          <BarChart
            data={metricBarData}
            barWidth={28}
            spacing={12}
            roundedTop
            hideRules
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#E1E8ED"
            noOfSections={5}
            maxValue={100}
            height={180}
            width={CHART_W}
            yAxisTextStyle={{ color: '#657786', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#657786', fontSize: 10 }}
            isAnimated
            showValuesAsTopLabel
            topLabelTextStyle={{ fontSize: 9, color: '#0f1419' }}
          />
        ) : (
          <Text style={styles.muted}>Métriques indisponibles — lancez seed.py</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Comparaison modèles (CV 5-fold)</Text>
        <Text style={styles.cardSub}>F1-macro — notebook</Text>
        {cvCompareData.length > 0 ? (
          <BarChart
            data={cvCompareData}
            horizontal
            barWidth={22}
            barBorderRadius={6}
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            height={Math.max(160, cvCompareData.length * 36)}
            width={CHART_W}
            isAnimated
            showValuesAsTopLabel
          />
        ) : null}
      </View>

      <SectionHeader
        title="Pipeline de traitement"
        subtitle="Du tweet brut à la prédiction de sentiment"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pipelineScroll}>
        {PIPELINE_STEPS.map((step) => (
          <View key={step.id} style={styles.pipelineCard}>
            <Ionicons name={step.icon} size={28} color="#1DA1F2" />
            <Text style={styles.pipelineStep}>Étape {step.id}</Text>
            <Text style={styles.pipelineTitle}>{step.title}</Text>
            <Text style={styles.pipelineDesc}>{step.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <TwitterBanner variant="nlp" style={styles.bannerImg} height={120} />

      <SectionHeader
        title="Distribution des sentiments"
        subtitle={`Entraînement · ${Number(trainRows || NOTEBOOK_METRICS.train_rows).toLocaleString()} tweets`}
      />
      <View style={styles.card}>
        {pieData.length > 0 ? (
          <View style={styles.pieWrap}>
            <PieChart
              data={pieData}
              donut
              radius={90}
              innerRadius={55}
              innerCircleColor="#fff"
              centerLabelComponent={() => (
                <Text style={styles.pieCenter}>4{'\n'}classes</Text>
              )}
            />
            <View style={styles.legend}>
              {Object.entries(dist).map(([label, count]) => (
                <View key={label} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS[label] }]} />
                  <Text style={styles.legendText}>
                    {label}: {Number(count).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.muted}>Distribution non chargée.</Text>
        )}
      </View>

      <SectionHeader title="Vos prédictions" subtitle={`${preds.total || 0} analyse(s)`} />
      <View style={styles.card}>
        {preds.total > 0 ? (
          <BarChart
            data={userPredBar}
            barWidth={40}
            spacing={20}
            roundedTop
            hideRules
            yAxisThickness={0}
            xAxisThickness={0}
            height={140}
            width={CHART_W}
            isAnimated
          />
        ) : (
          <Text style={styles.muted}>Aucune prédiction — analysez votre premier tweet.</Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <TwitterBanner variant="feed" style={styles.infoThumb} height={100} />
        <View style={styles.infoBody}>
          <Text style={styles.infoTitle}>{model.model_name}</Text>
          <Text style={styles.infoText}>
            Test : accuracy {(model.accuracy * 100).toFixed(1)} %, F1 macro{' '}
            {(model.f1_macro * 100).toFixed(1)} %. Meilleur CV : Linear SVC{' '}
            {(cvModels[0]?.f1 * 100 || 89.7).toFixed(1)} %.
          </Text>
        </View>
      </View>
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

function pct(v) {
  return v != null ? `${(v * 100).toFixed(1)}%` : '—';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  hero: {
    height: 200,
    marginBottom: -20,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 40 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 6, lineHeight: 18 },
  cta: { marginTop: 8, borderRadius: 20, overflow: 'hidden', elevation: 6 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  ctaTextWrap: { flex: 1 },
  ctaTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  ctaSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4, color: '#0f1419' },
  cardSub: { fontSize: 12, color: '#657786', marginBottom: 12 },
  pipelineScroll: { marginBottom: 12, marginHorizontal: -H_PADDING, paddingLeft: H_PADDING },
  pipelineCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  pipelineStep: { fontSize: 11, color: '#1DA1F2', fontWeight: '700', marginTop: 8 },
  pipelineTitle: { fontSize: 15, fontWeight: '700', color: '#0f1419', marginTop: 4 },
  pipelineDesc: { fontSize: 12, color: '#657786', marginTop: 6, lineHeight: 17 },
  bannerImg: { height: 120, borderRadius: 16, marginBottom: 8 },
  pieWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  pieCenter: { fontSize: 14, fontWeight: '700', textAlign: 'center', color: '#657786' },
  legend: { flex: 1, marginLeft: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, color: '#0f1419' },
  muted: { color: '#657786', fontSize: 13 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    elevation: 2,
  },
  infoThumb: { width: 100, height: 100, borderRadius: 0 },
  infoBody: { flex: 1, padding: 12, justifyContent: 'center' },
  infoTitle: { fontWeight: '800', fontSize: 14, color: '#0f1419' },
  infoText: { fontSize: 12, color: '#657786', marginTop: 4, lineHeight: 17 },
});
