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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { H_PADDING } from '../theme/layout';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    setLoading(true);
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        password_confirm: confirm,
      });
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#1DA1F2', '#0f1419']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.sub}>Nom, prénom, email et mot de passe</Text>
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="Prénom" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Vérification mot de passe"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />
          <TouchableOpacity onPress={onRegister} disabled={loading}>
            <LinearGradient colors={['#17BF63', '#0d9e4f']} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? 'Création…' : "S'inscrire"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, padding: H_PADDING, paddingTop: 56, paddingBottom: 32 },
  back: { marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.85)', marginBottom: 20, marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F5F8FA',
  },
  btn: { borderRadius: 24, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#fff', textAlign: 'center', marginTop: 20, fontWeight: '600' },
});
