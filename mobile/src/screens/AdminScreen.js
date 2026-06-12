import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { H_PADDING } from '../theme/layout';

const TABS = [
  { id: 'users', label: 'Utilisateurs', icon: 'people-outline' },
  { id: 'history', label: 'Historique', icon: 'time-outline' },
  { id: 'notif', label: 'Notifications', icon: 'notifications-outline' },
  { id: 'subs', label: 'Abonnements', icon: 'card-outline' },
];

export default function AdminScreen({ navigation }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [subs, setSubs] = useState([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  const load = async () => {
    try {
      const [u, p, s] = await Promise.all([
        api.adminUsers(),
        api.adminPredictions(),
        api.adminSubscriptions(),
      ]);
      setUsers(u);
      setPredictions(p);
      setSubs(s);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sendNotif = async () => {
    try {
      await api.adminCreateNotification(notifTitle.trim(), notifMsg.trim());
      Alert.alert('OK', 'Notification envoyée à tous les utilisateurs.');
      setNotifTitle('');
      setNotifMsg('');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#0f1419" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Administration</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons name={t.icon} size={18} color={tab === t.id ? '#1DA1F2' : '#657786'} />
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: H_PADDING, paddingBottom: 40 }}>
        {tab === 'users' &&
          users.map((u) => (
            <View key={u.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {u.first_name} {u.last_name}
              </Text>
              <Text style={styles.muted}>{u.email}</Text>
              <Text style={styles.meta}>
                {u.role} · {u.prediction_count} prédiction(s)
              </Text>
            </View>
          ))}

        {tab === 'history' &&
          predictions.map((p) => (
            <View key={p.id} style={styles.card}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {p.tweet_raw}
              </Text>
              <Text style={styles.muted}>
                {p.first_name} {p.last_name} ({p.email})
              </Text>
              <Text style={styles.meta}>
                {p.label} · {p.created_at}
              </Text>
            </View>
          ))}

        {tab === 'notif' && (
          <View style={styles.card}>
            <Text style={styles.section}>Nouvelle notification</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre"
              value={notifTitle}
              onChangeText={setNotifTitle}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Message"
              multiline
              value={notifMsg}
              onChangeText={setNotifMsg}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={sendNotif}>
              <Text style={styles.primaryBtnText}>Publier</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'subs' &&
          subs.map((s) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {s.first_name} {s.last_name}
              </Text>
              <Text style={styles.muted}>{s.email}</Text>
              <Text style={styles.meta}>
                Plan : {s.plan} · {s.is_active ? 'actif' : 'inactif'}
              </Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F8FA' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFF5',
  },
  topTitle: { fontSize: 18, fontWeight: '800' },
  tabs: { backgroundColor: '#fff', maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#E8EFF5' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1DA1F2' },
  tabText: { fontSize: 13, color: '#657786' },
  tabTextActive: { color: '#1DA1F2', fontWeight: '700' },
  body: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EFF5',
  },
  cardTitle: { fontWeight: '700', fontSize: 14, color: '#0f1419' },
  muted: { fontSize: 12, color: '#657786', marginTop: 4 },
  meta: { fontSize: 11, color: '#1DA1F2', marginTop: 6, fontWeight: '600' },
  section: { fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#F5F8FA',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
