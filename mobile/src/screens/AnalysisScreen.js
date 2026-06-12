import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import TwitterBanner from '../components/ui/TwitterBanner';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { api } from '../api';
import { COLORS } from '../config';
import { CV_COLORS } from '../constants/education';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import { H_PADDING } from '../theme/layout';

const W = Dimensions.get('window').width;

export default function AnalysisScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => api.analysisDetailed().then(setData).catch(console.warn);

  useEffect(() => {
    load();
  }, []);

  const model = data?.model;
  const cm = data?.confusion_matrix;
  const perClass = data?.per_class || [];

  const f1Bar = perClass.map((c) => ({
    value: (c.f1 || 0) * 100,
    label: c.label?.slice(0, 4),
    frontColor: COLORS[c.label] || '#1DA1F2',
  }));

  const precRecData = perClass.flatMap((c) => [
    {
      value: (c.precision || 0) * 100,
      label: `${c.label?.slice(0, 3)}P`,
      spacing: 2,
      frontColor: COLORS[c.label] || '#1DA1F2',
    },
    {
      value: (c.recall || 0) * 100,
      label: `${c.label?.slice(0, 3)}R`,
      spacing: 12,
      frontColor: `${COLORS[c.label]}99` || '#1DA1F288',
    },
  ]);

  const cvModels = data?.cv_models || [];
  const cvCompare = cvModels.map((m, i) => ({
    value: (m.f1 || 0) * 100,
    label: m.name?.length > 8 ? `${m.name.slice(0, 8)}…` : m.name,
    frontColor: CV_COLORS[i % CV_COLORS.length],
  }));

  const lineTrend = perClass.map((c, i) => ({
    value: (c.f1 || 0) * 100,
    label: String(i + 1),
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true);
          await load();
          setRefreshing(false);
        }} />
      }
      showsVerticalScrollIndicator={false}
    >
      <TwitterBanner variant="chart" style={styles.hero} height={140} />
      <View style={[styles.heroText, { paddingHorizontal: 0 }]}>
        <Text style={styles.heroTitle}>Analyse des performances</Text>
        <Text style={styles.heroSub}>Métriques · matrices · comparaison de modèles</Text>
      </View>

      <View style={styles.statGrid}>
        <StatCard label="Accuracy" value={fmt(model?.accuracy)} colors={['#1DA1F2', '#0a7bc4']} iconName="checkmark-circle-outline" />
        <StatCard label="F1 Macro" value={fmt(model?.f1_macro)} colors={['#17BF63', '#0d8a4a']} iconName="stats-chart-outline" />
        <StatCard label="Précision" value={fmt(model?.precision_macro)} colors={['#794BC4', '#5a3599']} iconName="search-outline" />
        <StatCard label="Rappel" value={fmt(model?.recall_macro)} colors={['#F45D22', '#c44a1a']} iconName="megaphone-outline" />
      </View>

      <SectionHeader title="F1-Score par classe" subtitle="Performance sur chaque sentiment" />
      <View style={styles.card}>
        {f1Bar.length > 0 ? (
          <BarChart
            data={f1Bar}
            barWidth={42}
            spacing={18}
            roundedTop
            hideRules
            maxValue={100}
            height={170}
            width={W - 72}
            isAnimated
          />
        ) : (
          <Text style={styles.muted}>Métriques par classe non disponibles.</Text>
        )}
      </View>

      <SectionHeader title="Précision vs Rappel" subtitle="Par classe (P = précision, R = rappel)" />
      <View style={styles.card}>
        {precRecData.length > 0 ? (
          <BarChart
            data={precRecData}
            barWidth={22}
            spacing={4}
            roundedTop
            hideRules
            maxValue={100}
            height={160}
            width={W - 72}
            isAnimated
          />
        ) : null}
      </View>

      <SectionHeader title="Courbe F1 par classe" subtitle="Vue linéaire comparative" />
      <View style={styles.card}>
        {lineTrend.length > 0 ? (
          <LineChart
            data={lineTrend}
            height={160}
            width={W - 72}
            curved
            thickness={3}
            color="#1DA1F2"
            dataPointsColor="#1DA1F2"
            startFillColor="rgba(29,161,242,0.3)"
            endFillColor="rgba(29,161,242,0.01)"
            areaChart
            hideRules
            maxValue={100}
            isAnimated
          />
        ) : null}
      </View>

      <SectionHeader
        title="Comparaison des modèles (CV)"
        subtitle="F1-Macro · validation croisée 5-fold (notebook)"
      />
      <View style={styles.card}>
        {cvCompare.length === 0 ? (
          <Text style={styles.muted}>Lancez seed.py pour charger les scores CV du notebook.</Text>
        ) : (
        <BarChart
          data={cvCompare}
          horizontal
          barWidth={22}
          barBorderRadius={6}
          hideRules
          yAxisThickness={0}
          xAxisThickness={0}
          height={200}
          width={W - 72}
          isAnimated
        />
        )}
      </View>

      {cm?.matrix && (
        <>
          <SectionHeader
            title="Matrice de confusion"
            subtitle="Lignes = sentiment réel · Colonnes = prédiction"
          />
          <View style={styles.card}>
            <ScrollView horizontal>
              <View>
                <View style={styles.cmHeaderRow}>
                  <View style={styles.cmCorner} />
                  {cm.labels?.map((l) => (
                    <Text key={l} style={styles.cmColHead}>
                      {l?.slice(0, 6)}
                    </Text>
                  ))}
                </View>
                {cm.matrix.map((row, i) => {
                  const maxVal = Math.max(...cm.matrix.flat(), 1);
                  return (
                    <View key={i} style={styles.cmRow}>
                      <Text style={styles.cmRowLabel}>{cm.labels?.[i]?.slice(0, 8)}</Text>
                      {row.map((v, j) => {
                        const intensity = v / maxVal;
                        const isDiag = i === j;
                        return (
                          <View
                            key={j}
                            style={[
                              styles.cmCell,
                              {
                                backgroundColor: isDiag
                                  ? `rgba(23,191,99,${0.25 + intensity * 0.75})`
                                  : `rgba(211,47,47,${intensity * 0.5})`,
                              },
                            ]}
                          >
                            <Text style={styles.cmCellText}>{v}</Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </>
      )}

      <SectionHeader title="Support par classe" subtitle="Nombre d'exemples dans le jeu de test" />
      <View style={styles.card}>
        {perClass.map((c) => (
          <View key={c.label} style={styles.supportRow}>
            <View style={[styles.supportDot, { backgroundColor: COLORS[c.label] }]} />
            <Text style={styles.supportLabel}>{c.label}</Text>
            <View style={styles.supportBarBg}>
              <View
                style={[
                  styles.supportBarFill,
                  {
                    width: `${Math.min(100, (c.support / Math.max(...perClass.map((x) => x.support), 1)) * 100)}%`,
                    backgroundColor: COLORS[c.label],
                  },
                ]}
              />
            </View>
            <Text style={styles.supportVal}>{c.support}</Text>
          </View>
        ))}
      </View>

      <TwitterBanner variant="chart" style={styles.footerImg} height={100} />
    </ScrollView>
  );
}

function fmt(v) {
  return v != null ? `${(v * 100).toFixed(1)}%` : '—';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  hero: { width: '100%', height: 140, borderRadius: 16, marginTop: 8 },
  heroText: { paddingVertical: 16, paddingBottom: 0 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#0f1419' },
  heroSub: { fontSize: 13, color: '#657786', marginTop: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
  },
  muted: { color: '#657786' },
  cmHeaderRow: { flexDirection: 'row', marginBottom: 4 },
  cmCorner: { width: 72 },
  cmColHead: { width: 64, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#657786' },
  cmRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cmRowLabel: { width: 72, fontSize: 11, fontWeight: '600' },
  cmCell: {
    width: 64,
    height: 44,
    marginHorizontal: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cmCellText: { fontWeight: '700', fontSize: 13 },
  supportRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  supportDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  supportLabel: { width: 80, fontSize: 13, fontWeight: '600' },
  supportBarBg: { flex: 1, height: 8, backgroundColor: '#E8EFF5', borderRadius: 4, marginHorizontal: 8 },
  supportBarFill: { height: '100%', borderRadius: 4 },
  supportVal: { width: 36, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  footerImg: { height: 100, borderRadius: 16, marginTop: 12 },
});
