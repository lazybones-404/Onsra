/**
 * TipJarSheet — a bottom sheet allowing users to support Onsra
 * by making a one-time in-app purchase.
 */

import { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TIP_PRODUCTS, purchaseTip, TipProductId } from '@/lib/iap/tip-jar';
import { colors, spacing } from '@/constants/theme';

interface TipJarSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function TipJarSheet({ visible, onClose }: TipJarSheetProps) {
  const [loading, setLoading] = useState<TipProductId | null>(null);
  const [message, setMessage] = useState('');

  async function handleTip(productId: TipProductId) {
    setLoading(productId);
    setMessage('');
    const result = await purchaseTip(productId);
    setMessage(result.message);
    setLoading(null);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xl,
              gap: spacing.md,
            }}
          >
            {/* Handle */}
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />

            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ fontSize: 28 }}>🎸</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground }}>
                Support Onsra
              </Text>
              <Text
                style={{
                  textAlign: 'center',
                  color: colors.muted,
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                Onsra is free and always will be. If it helps your playing,{'\n'}
                a tip keeps the servers on and features coming.
              </Text>
            </View>

            <View style={{ gap: spacing.sm }}>
              {TIP_PRODUCTS.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => handleTip(product.id)}
                  disabled={!!loading}
                  activeOpacity={0.7}
                >
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Text style={{ fontSize: 28, width: 36, textAlign: 'center' }}>
                      {product.emoji}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 16 }}>
                        {product.label}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 13 }}>
                        One-time purchase
                      </Text>
                    </View>
                    {loading === product.id ? (
                      <ActivityIndicator color={colors.accent} />
                    ) : (
                      <View
                        style={{
                          backgroundColor: colors.accentMuted,
                          borderRadius: 12,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 15 }}>
                          {product.price}
                        </Text>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              ))}
            </View>

            {message ? (
              <Text
                style={{
                  textAlign: 'center',
                  color: colors.accent,
                  fontSize: 14,
                  marginTop: spacing.xs,
                }}
              >
                {message}
              </Text>
            ) : null}

            <Button title="Not now" variant="ghost" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
