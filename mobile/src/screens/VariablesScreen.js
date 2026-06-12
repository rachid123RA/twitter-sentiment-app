import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config';
import { H_PADDING } from '../theme/layout';
import TwitterBanner from '../components/ui/TwitterBanner';
import {
  CLASSES_DETAIL,
  PREPROCESSING_DETAILS,
  PIPELINE_STEPS,
} from '../constants/education';
import SectionHeader from '../components/ui/SectionHeader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function VariablesScreen() {
  const [openSection, setOpenSection] = useState('classes');

  const toggle = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <TwitterBanner variant="nlp" style={styles.hero} height={160} />
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Guide complet</Text>
        <Text style={styles.introText}>
          Comprendre la détection de sentiment sur Twitter : classes, nettoyage de texte,
          vectorisation TF-IDF et modèle de classification.
        </Text>
      </View>

      <Accordion
        id="classes"
        title="Classes de sentiment"
        open={openSection === 'classes'}
        onPress={() => toggle('classes')}
      >
        {CLASSES_DETAIL.map((c) => (
          <View key={c.name} style={[styles.classCard, { borderColor: COLORS[c.name] }]}>
            <View style={[styles.classImg, { backgroundColor: COLORS[c.name] + '18' }]}>
              <Ionicons name={c.icon} size={36} color={COLORS[c.name]} />
            </View>
            <View style={styles.classBody}>
              <Ionicons name={c.icon} size={28} color={COLORS[c.name]} />
              <Text style={[styles.className, { color: COLORS[c.name] }]}>{c.name}</Text>
              <Text style={styles.classDesc}>{c.desc}</Text>
              <Text style={styles.exLabel}>Exemples :</Text>
              {c.examples.map((ex) => (
                <Text key={ex} style={styles.example}>
                  « {ex} »
                </Text>
              ))}
            </View>
          </View>
        ))}
      </Accordion>

      <Accordion
        id="preprocess"
        title="Prétraitement du tweet"
        open={openSection === 'preprocess'}
        onPress={() => toggle('preprocess')}
      >
        <TwitterBanner variant="feed" style={styles.sectionBanner} height={100} />
        {PREPROCESSING_DETAILS.map((p) => (
          <View key={p.step} style={styles.stepRow}>
            <View style={styles.stepIcon}>
              <Ionicons name={p.icon} size={20} color="#1DA1F2" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{p.step}</Text>
              <Text style={styles.stepEx}>{p.example}</Text>
            </View>
          </View>
        ))}
        <View style={styles.rawBox}>
          <Text style={styles.rawLabel}>Avant</Text>
          <Text style={styles.rawText}>OMG!! Check https://t.co/xyz @brand #love it!!!</Text>
        </View>
        <View style={[styles.rawBox, styles.rawAfter]}>
          <Text style={styles.rawLabel}>Après</Text>
          <Text style={styles.rawText}>omg check brand love it</Text>
        </View>
      </Accordion>

      <Accordion
        id="tfidf"
        title="TF-IDF & Modèle ML"
        open={openSection === 'tfidf'}
        onPress={() => toggle('tfidf')}
      >
        <View style={styles.tfCard}>
          <Text style={styles.tfTitle}>TF-IDF</Text>
          <Text style={styles.tfText}>
            Term Frequency – Inverse Document Frequency transforme le texte en vecteurs
            numériques. Uni-grammes et bi-grammes · max 50 000 features · sous-échantillonnage
            sublinear.
          </Text>
        </View>
        <View style={styles.tfCard}>
          <Text style={styles.tfTitle}>Linear SVC (notebook)</Text>
          <Text style={styles.tfText}>
            Meilleur modèle après HalvingGridSearchCV — F1 macro test ~97,8 %, CV ~89,9 %.
            Baseline CV : Linear SVC ~89,7 %.
          </Text>
        </View>
        {PIPELINE_STEPS.map((s) => (
          <View key={s.id} style={styles.miniPipeline}>
            <Ionicons name={s.icon} size={20} color="#1DA1F2" style={{ marginRight: 8 }} />
            <Text style={styles.miniTitle}>{s.title}</Text>
          </View>
        ))}
      </Accordion>

      <Accordion
        id="metrics"
        title="Métriques d'évaluation"
        open={openSection === 'metrics'}
        onPress={() => toggle('metrics')}
      >
        {[
          { k: 'Accuracy', d: 'Proportion de prédictions correctes sur le jeu de test.' },
          { k: 'F1 Macro', d: 'Moyenne harmonique précision/rappel — toutes classes égales.' },
          { k: 'F1 Weighted', d: 'F1 pondéré par le nombre d\'exemples par classe.' },
          { k: 'Matrice de confusion', d: 'Tableau réel vs prédit — voir onglet Analyse.' },
        ].map((m) => (
          <View key={m.k} style={styles.metricRow}>
            <Text style={styles.metricKey}>{m.k}</Text>
            <Text style={styles.metricDesc}>{m.d}</Text>
          </View>
        ))}
      </Accordion>

      <TwitterBanner variant="feed" style={styles.footerImg} height={100} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Accordion({ title, open, onPress, children }) {
  return (
    <View style={styles.accordion}>
      <TouchableOpacity style={styles.accordionHead} onPress={onPress}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={20} color="#657786" />
      </TouchableOpacity>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  intro: { paddingVertical: 16 },
  hero: { width: '100%', height: 160, borderRadius: 16, marginTop: 8 },
  introTitle: { fontSize: 22, fontWeight: '800', color: '#0f1419' },
  introText: { fontSize: 14, color: '#657786', marginTop: 8, lineHeight: 21 },
  accordion: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  accordionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: '#0f1419' },
  accordionChevron: { color: '#1DA1F2', fontSize: 12 },
  accordionBody: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#E8EFF5' },
  classCard: {
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  classImg: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classBody: { padding: 12 },
  className: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  classDesc: { fontSize: 13, color: '#657786', marginTop: 4 },
  exLabel: { fontSize: 11, fontWeight: '700', marginTop: 10, color: '#1DA1F2' },
  example: { fontSize: 12, color: '#0f1419', fontStyle: 'italic', marginTop: 2 },
  sectionBanner: { height: 100, borderRadius: 12, marginBottom: 12 },
  stepRow: { flexDirection: 'row', marginBottom: 12 },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconText: { fontWeight: '800', color: '#1DA1F2' },
  stepContent: { flex: 1 },
  stepTitle: { fontWeight: '700', fontSize: 14 },
  stepEx: { fontSize: 12, color: '#657786', marginTop: 2 },
  rawBox: { backgroundColor: '#FFF3E0', padding: 12, borderRadius: 10, marginBottom: 8 },
  rawAfter: { backgroundColor: '#E8F5E9' },
  rawLabel: { fontSize: 10, fontWeight: '700', color: '#657786' },
  rawText: { fontSize: 13, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  tfCard: { backgroundColor: '#F5F8FA', padding: 12, borderRadius: 12, marginBottom: 10 },
  tfTitle: { fontWeight: '800', fontSize: 15, color: '#1DA1F2' },
  tfText: { fontSize: 13, color: '#657786', marginTop: 6, lineHeight: 19 },
  miniPipeline: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  miniIcon: { fontSize: 18, marginRight: 10 },
  miniTitle: { fontSize: 14, fontWeight: '600' },
  metricRow: { marginBottom: 12 },
  metricKey: { fontWeight: '800', fontSize: 14, color: '#0f1419' },
  metricDesc: { fontSize: 13, color: '#657786', marginTop: 4, lineHeight: 18 },
  footerImg: { height: 100, borderRadius: 16, marginTop: 8 },
});
