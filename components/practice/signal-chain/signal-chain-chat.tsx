import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { streamAiResponse, type Message } from '@/lib/ai/ai-client';
import { Card } from '@/components/ui/card';
import { colors } from '@/constants/theme';

interface ChatBubbleProps {
  message: Message;
}

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        marginBottom: 8,
      }}
    >
      {!isUser && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <MaterialIcons name="auto-awesome" size={12} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600' }}>Signal Chain AI</Text>
        </View>
      )}
      <View
        style={{
          backgroundColor: isUser ? colors.accent : colors.surface,
          borderRadius: isUser ? 18 : 12,
          borderBottomRightRadius: isUser ? 4 : 12,
          borderBottomLeftRadius: isUser ? 12 : 4,
          padding: 12,
          paddingHorizontal: 14,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const QUICK_PROMPTS = [
  'Best pedal order for my board?',
  'How to reduce hum in my signal chain?',
  'What gain staging should I use?',
  'How do I use an effects loop?',
];

export function SignalChainChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! I'm your signal chain advisor. Ask me anything about your gear setup, pedal order, amp settings, or noise issues.",
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setStreaming(true);

    let assistantText = '';
    const assistantIndex = updatedMessages.length;

    setMessages((prev) => [...prev, { role: 'assistant', content: '...' }]);

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      for await (const token of streamAiResponse('signal-chain', userMessage.content, {}, history)) {
        assistantText += token;
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIndex] = { role: 'assistant', content: assistantText };
          return next;
        });
        scrollRef.current?.scrollToEnd({ animated: false });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong.';
      setMessages((prev) => {
        const next = [...prev];
        next[assistantIndex] = { role: 'assistant', content: errMsg };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      {/* Quick prompts */}
      {messages.length <= 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          style={{ maxHeight: 64 }}
        >
          {QUICK_PROMPTS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => sendMessage(p)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 13 }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {streaming && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={{ color: colors.muted, fontSize: 12 }}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your signal chain..."
          placeholderTextColor={colors.mutedDark}
          multiline
          maxLength={500}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: colors.foreground,
            fontSize: 14,
            maxHeight: 100,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
        <TouchableOpacity
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: input.trim() && !streaming ? colors.accent : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="send" size={18} color={input.trim() && !streaming ? '#fff' : colors.mutedDark} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
