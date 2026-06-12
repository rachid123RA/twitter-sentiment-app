import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';

const WELCOME = {
  role: 'bot',
  text: "Bonjour ! Analysez un tweet puis posez vos questions : pourquoi ce sentiment, quels mots comptent, prétraitement NLP, etc.",
};

export default function SentimentChatbot({ context, onContextUpdate }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const chatCtx = context
        ? {
            tweet_raw: context.tweet_raw,
            tweet_clean: context.tweet_clean,
            label: context.label,
            probabilities: context.probabilities,
            nlp: context.nlp,
          }
        : null;
      const res = await api.chat(msg, chatCtx);
      if (res.context && onContextUpdate) {
        onContextUpdate(res.context);
      }
      setMessages((m) => [...m, { role: 'bot', text: res.reply, suggestions: res.suggestions }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: e.message }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const lastBot = [...messages].reverse().find((m) => m.role === 'bot');
  const suggestions = lastBot?.suggestions || [
    'Pourquoi ce sentiment ?',
    'Quels mots ont influencé ?',
    'Montre le prétraitement NLP',
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Ionicons name="chatbubbles-outline" size={22} color="#794BC4" />
        <Text style={styles.title}>Assistant NLP</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        nestedScrollEnabled
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.botBubble]}
          >
            {m.role === 'bot' ? (
              <Ionicons name="sparkles-outline" size={14} color="#794BC4" style={styles.bubbleIcon} />
            ) : null}
            <Text style={[styles.bubbleText, m.role === 'user' && styles.userText]}>{m.text}</Text>
          </View>
        ))}
        {loading ? (
          <ActivityIndicator size="small" color="#794BC4" style={{ marginVertical: 8 }} />
        ) : null}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestRow}>
        {suggestions.map((s) => (
          <TouchableOpacity key={s} style={styles.suggestChip} onPress={() => send(s)}>
            <Text style={styles.suggestText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Posez une question sur le sentiment…"
            placeholderTextColor="#AAB8C2"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => send()} disabled={loading}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EFF5',
    overflow: 'hidden',
    marginBottom: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8FA',
    backgroundColor: '#FAF5FF',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0f1419' },
  messages: { maxHeight: 220, padding: 12 },
  bubble: {
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    maxWidth: '92%',
  },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#F5F8FA' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1DA1F2' },
  bubbleIcon: { marginBottom: 4 },
  bubbleText: { fontSize: 13, color: '#0f1419', lineHeight: 19 },
  userText: { color: '#fff' },
  suggestRow: { paddingHorizontal: 10, paddingBottom: 8, maxHeight: 40 },
  suggestChip: {
    backgroundColor: '#E8F5FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestText: { fontSize: 11, color: '#1DA1F2', fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8EFF5',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 80,
    color: '#0f1419',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#794BC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
