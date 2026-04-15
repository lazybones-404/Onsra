/**
 * AccountPrompt — a bottom-sheet modal that nudges guest users to create an account.
 *
 * When to show:
 *   Phase 2+: call triggerAccountPrompt() after the first tuning session completes
 *             or when the user tries to save a tone profile / song.
 *
 * The prompt is shown AT MOST ONCE — after the user dismisses it (either by
 * choosing "Maybe later" or navigating to auth) the ACCOUNT_PROMPT_DISMISSED flag
 * is set in MMKV and the prompt never appears again.
 *
 * Usage:
 *   import { AccountPrompt, triggerAccountPrompt } from '@/components/account-prompt';
 *
 *   // In any screen or hook:
 *   triggerAccountPrompt(); // schedules a show if eligible
 *
 *   // In the root _layout or wherever it should appear:
 *   <AccountPrompt />
 */
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Storage, STORAGE_KEYS } from '@/lib/storage/mmkv';
import { useUserStore } from '@/store/user-store';

const C = Colors.dark;

// Module-level callback so triggerAccountPrompt() can communicate with the component
let _showFn: (() => void) | null = null;

/** Call from anywhere to request the account prompt be shown (if eligible). */
export function triggerAccountPrompt(): void {
  try {
    const user = useUserStore.getState().user;
    if (user) return; // Already signed in

    const dismissed = Storage.getBoolean(STORAGE_KEYS.ACCOUNT_PROMPT_DISMISSED);
    if (dismissed) return;
  } catch {
    return;
  }
  _showFn?.();
}

export function AccountPrompt() {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const user = useUserStore((s) => s.user);

  // Register show function on mount
  useEffect(() => {
    _showFn = () => {
      if (!visible) setVisible(true);
    };
    return () => { _showFn = null; };
  }, [visible]);

  // Slide in when visible becomes true
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    }
  }, [visible, slideAnim]);

  // Hide automatically if the user signs in while prompt is open
  useEffect(() => {
    if (user && visible) dismiss();
  }, [user]);

  const dismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      try {
        Storage.setBoolean(STORAGE_KEYS.ACCOUNT_PROMPT_DISMISSED, true);
      } catch {}
    });
  }, [slideAnim]);

  const handleCreateAccount = useCallback(() => {
    dismiss();
    // Small delay so the sheet animates out before navigation
    setTimeout(() => router.push('/auth'), 300);
  }, [dismiss]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={dismiss}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={dismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Content */}
        <Text style={styles.headline}>Save your progress 💾</Text>
        <Text style={styles.body}>
          Create a free account to save tone profiles, your song library, and setlists — and sync
          them across all your devices.
        </Text>

        {/* Benefit pills */}
        <View style={styles.pills}>
          {['Tone profiles', 'Song library', 'Setlists', 'Cloud sync'].map((label) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.btnPrimary}
            onPress={handleCreateAccount}
            accessibilityRole="button"
          >
            <Text style={styles.btnPrimaryText}>Create Free Account →</Text>
          </Pressable>

          <Pressable style={styles.btnSecondary} onPress={dismiss} accessibilityRole="button">
            <Text style={styles.btnSecondaryText}>Maybe later</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  pill: {
    backgroundColor: C.accentMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  pillText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btnPrimary: {
    backgroundColor: C.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  btnSecondaryText: {
    color: C.muted,
    fontSize: 14,
  },
});
