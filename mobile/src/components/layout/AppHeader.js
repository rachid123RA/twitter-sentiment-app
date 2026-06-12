import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { H_PADDING } from '../../theme/layout';

export default function AppHeader({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const loadNotifs = async () => {
    try {
      const rows = await api.notifications();
      setNotifs(rows);
    } catch {
      setNotifs([]);
    }
  };

  useEffect(() => {
    if (user) refreshUser?.();
  }, [user?.id]);

  const openNotifs = async () => {
    await loadNotifs();
    setNotifOpen(true);
  };

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      refreshUser?.();
    } catch {
      /* ignore */
    }
  };

  const unread = user?.unread_notifications ?? 0;
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <View style={[styles.wrap, { paddingTop: insets.top + 6, paddingHorizontal: H_PADDING }]}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#1DA1F2" />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.full_name || user?.email}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn} onPress={openNotifs}>
            <Ionicons name="notifications-outline" size={24} color="#0f1419" />
            {unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          {isAdmin ? (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => navigation.navigate('Admin')}
            >
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.adminBtnText}>Admin</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#657786" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={notifOpen} animationType="slide" transparent>
        <Pressable style={styles.modalBg} onPress={() => setNotifOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifOpen(false)}>
                <Ionicons name="close" size={26} color="#657786" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={notifs}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={
                <Text style={styles.empty}>Aucune notification pour le moment.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.notifRow, !item.is_read && styles.notifUnread]}
                  onPress={() => markRead(item.id)}
                >
                  <Ionicons
                    name={item.is_read ? 'mail-open-outline' : 'mail-unread-outline'}
                    size={22}
                    color="#1DA1F2"
                  />
                  <View style={styles.notifBody}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifMsg}>{item.message}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFF5',
  },
  profile: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { marginLeft: 10, flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f1419' },
  email: { fontSize: 12, color: '#657786', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E0245E',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#794BC4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  adminBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFF5',
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  empty: { textAlign: 'center', color: '#657786', padding: 24 },
  notifRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8FA',
    gap: 12,
  },
  notifUnread: { backgroundColor: '#F0F9FF' },
  notifBody: { flex: 1 },
  notifTitle: { fontWeight: '700', fontSize: 14 },
  notifMsg: { fontSize: 13, color: '#657786', marginTop: 4, lineHeight: 18 },
});
