/**
 * Tone tab — AI amp/tone advisor with streaming Gemini responses.
 * Users pick an amp model, then chat for iterative tone advice.
 * Saved tone profiles are shown below the chat.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Crypto from 'expo-crypto';

import { AmpModelPicker } from '@/components/tone/amp-model-picker';
import { ChatBubble, type Message } from '@/components/tone/chat-bubble';
import { ToneProfileCard } from '@/components/tone/tone-profile-card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getAmpModelsForInstrument, getDefaultAmpModel } from '@/constants/amp-models';
import type { AmpModel } from '@/constants/amp-models';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { streamAiResponse, type ChatMessage } from '@/lib/ai/tone-chat';
import { getAllToneProfiles, createToneProfile, deleteToneProfile, type ToneProfile } from '@/lib/db/tone-profiles';
import { useInstrumentStore } from '@/store/instrument-store';
import { useUserStore } from '@/store/user-store';

const FEATURE_OPTIONS = [
  { id: 'tone-advisor' as const, label: 'Tone Advisor', icon: '🎛' },
  { id: 'troubleshooter' as const, label: 'Troubleshooter', icon: '🔧' },
];

export default function ToneScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const instrument = useInstrumentStore((s) => s.instrument);
  const user = useUserStore((s) => s.user);

  const ampModels = getAmpModelsForInstrument(instrument);
  const [selectedAmp, setSelectedAmp] = useState<AmpModel>(() => getDefaultAmpModel(instrument));
  const [activeFeature, setActiveFeature] = useState<'tone-advisor' | 'troubleshooter'>('tone-advisor');

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const [profiles, setProfiles] = useState<ToneProfile[]>([]);
  const [showProfiles, setShowProfiles] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    setSelectedAmp(getDefaultAmpModel(instrument));
    setMessages([]);
  }, [instrument]);

  const loadProfiles = async () => {
    const all = await getAllToneProfiles();
    setProfiles(all.filter((p) => p.instrument === instrument));
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    if (!user) {
      Alert.alert(
        'Sign In Required',
        'AI features require an account. Sign in from the More tab.',
        [{ text: 'OK' }],
      );
      return;
    }

    setInputText('');
    setIsStreaming(true);

    const userMsg: Message = { id: Crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();

    const aiMsgId = Crypto.randomUUID();
    setMessages((prev) => [...prev, { id: aiMsgId, role: 'assistant', content: '', streaming: true }]);

    const history: ChatMessage[] = messages
      .filter((m) => m.content.length > 0)
      .map((m) => ({ role: m.role, content: m.content }));

    const contextPrefix = `Using a ${selectedAmp.brand} ${selectedAmp.name} (${selectedAmp.character}): `;
    const fullMessage = messages.length === 0 ? contextPrefix + text : text;

    try {
      let accumulated = '';
      for await (const chunk of streamAiResponse({
        message: fullMessage,
        feature: activeFeature,
        conversationHistory: history,
      })) {
        accumulated += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: accumulated } : m,
          ),
        );
        scrollToBottom();
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, streaming: false } : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: 'Something went wrong. Try again.', streaming: false }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }, [inputText, isStreaming, messages, selectedAmp, activeFeature, user, scrollToBottom]);

  const handleSaveTone = useCallback(async () => {
    if (messages.length < 2) return;
    const lastAi = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAi) return;

    Alert.prompt(
      'Save Tone Profile',
      'Give this tone a name:',
      async (name) => {
        if (!name?.trim()) return;
        await createToneProfile({
          name: name.trim(),
          instrument,
          amp_model: selectedAmp.name,
          settings_json: { lastResponse: lastAi.content.slice(0, 500) },
        });
        await loadProfiles();
        Alert.alert('Saved!', 'Tone profile saved.');
      },
      'plain-text',
    );
  }, [messages, instrument, selectedAmp]);

  const handleLoadProfile = (profile: ToneProfile) => {
    const loadMsg: Message = {
      id: Crypto.randomUUID(),
      role: 'user',
      content: `Load my saved tone: "${profile.name}" — ${profile.settings_json?.lastResponse ?? ''}`,
    };
    setMessages([loadMsg]);
    setShowProfiles(false);
    handleSend();
  };

  const handleDeleteProfile = async (id: string) => {
    await deleteToneProfile(id);
    await loadProfiles();
  };

  const handleClear = () => {
    Alert.alert('Clear Chat', 'Start a new conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>TONE</Text>
        <View style={styles.headerActions}>
          {messages.length > 0 && (
            <Pressable onPress={handleSaveTone} style={[styles.headerBtn, { backgroundColor: C.accentMuted }]}>
              <Text style={[styles.headerBtnText, { color: C.accent }]}>Save</Text>
            </Pressable>
          )}
          <Pressable onPress={handleClear} style={[styles.headerBtn, { backgroundColor: C.surface }]}>
            <Text style={[styles.headerBtnText, { color: C.muted }]}>Clear</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowProfiles((v) => !v)}
            style={[styles.headerBtn, { backgroundColor: C.surface }]}
          >
            <Text style={[styles.headerBtnText, { color: C.muted }]}>
              {showProfiles ? 'Chat' : `Saved (${profiles.length})`}
            </Text>
          </Pressable>
        </View>
      </View>

      {showProfiles ? (
        // ─── Profiles view ───────────────────────────────────────
        <ScrollView style={styles.profilesList} contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.md }}>
          {profiles.length === 0 ? (
            <Text style={[styles.emptyText, { color: C.muted }]}>
              No saved tone profiles yet.{'\n'}Start a chat and tap Save.
            </Text>
          ) : (
            profiles.map((p) => (
              <ToneProfileCard
                key={p.id}
                profile={p}
                onLoad={handleLoadProfile}
                onDelete={handleDeleteProfile}
              />
            ))
          )}
        </ScrollView>
      ) : (
        // ─── Chat view ───────────────────────────────────────────
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={88}
        >
          {/* Feature tabs */}
          <View style={styles.featureTabs}>
            {FEATURE_OPTIONS.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => setActiveFeature(f.id)}
                style={[
                  styles.featureTab,
                  { borderColor: C.border },
                  activeFeature === f.id && { borderColor: C.accent, backgroundColor: C.accentMuted },
                ]}
              >
                <Text style={[styles.featureTabText, { color: activeFeature === f.id ? C.accent : C.muted }]}>
                  {f.icon} {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amp picker */}
          <AmpModelPicker
            ampModels={ampModels}
            selectedId={selectedAmp.id}
            onSelect={setSelectedAmp}
          />

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.emptyChat}>
                <Text style={[styles.emptyChatTitle, { color: C.text }]}>
                  {activeFeature === 'tone-advisor' ? '🎛 Tone Advisor' : '🔧 Troubleshooter'}
                </Text>
                <Text style={[styles.emptyChatSub, { color: C.muted }]}>
                  {activeFeature === 'tone-advisor'
                    ? `Ask about settings for your ${selectedAmp.brand} ${selectedAmp.name}.`
                    : 'Describe your gear problem for step-by-step diagnostics.'}
                </Text>
              </View>
            )}
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputRow, { backgroundColor: C.surface, borderTopColor: C.border }]}>
            <TextInput
              style={[styles.input, { color: C.text, backgroundColor: C.card }]}
              placeholder={activeFeature === 'tone-advisor' ? 'Ask about your tone…' : 'Describe your problem…'}
              placeholderTextColor={C.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isStreaming}
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() && !isStreaming ? C.accent : C.border },
              ]}
            >
              {isStreaming ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.sendIcon}>↑</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  headerActions: { flexDirection: 'row', gap: Spacing.xs },
  headerBtn: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  headerBtnText: { fontSize: 13, fontWeight: '600' },
  featureTabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  featureTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  featureTabText: { fontSize: 13, fontWeight: '600' },
  messages: { flex: 1 },
  messagesContent: { paddingVertical: Spacing.sm, gap: 2 },
  emptyChat: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyChatTitle: { fontSize: 20, fontWeight: '700' },
  emptyChatSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  profilesList: { flex: 1 },
  emptyText: {
    textAlign: 'center',
    paddingTop: Spacing.xxl,
    lineHeight: 24,
    fontSize: 15,
  },
});
