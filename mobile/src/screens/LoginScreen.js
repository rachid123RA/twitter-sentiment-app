import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TwitterBanner from '../components/ui/TwitterBanner';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { H_PADDING } from '../theme/layout';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@twitter.local');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TwitterBanner
        variant="hero"
        style={[StyleSheet.absoluteFill, { borderRadius: 0, height: '100%' }]}
      />
      <LinearGradient colors={['rgba(29,161,242,0.75)', 'rgba(15,20,25,0.92)']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Ionicons name="logo-twitter" size={56} color="#fff" style={styles.logoIcon} />
        <Text style={styles.title}>Twitter Sentiment</Text>
        <Text style={styles.sub}>Détection ML · Positive · Negative · Neutral · Irrelevant</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8899A6"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#8899A6"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={onLogin} disabled={loading}>
            <LinearGradient colors={['#17BF63', '#0d9e4f']} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Serveur : {API_URL}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: H_PADDING },
  logoIcon: { alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#fff', marginTop: 8 },
  sub: { fontSize: 14, textAlign: 'center', color: 'rgba(255,255,255,0.85)', marginBottom: 28, lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F5F8FA',
  },
  btn: { borderRadius: 24, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  registerLink: { marginTop: 14, alignItems: 'center' },
  registerText: { color: '#1DA1F2', fontWeight: '700', fontSize: 15 },
  hint: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 16 },
});
