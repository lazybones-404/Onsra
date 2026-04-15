import { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TapTempo } from '@/lib/audio/metronome';

const MIN_BPM = 40;
const MAX_BPM = 240;

interface Props {
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export function BpmWheel({ bpm, onBpmChange }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];
  const tapTempo = useRef(new TapTempo());
  const startY = useRef(0);
  const startBpm = useRef(bpm);

  const clamp = (v: number) => Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)));

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => {
      startY.current = e.absoluteY;
      startBpm.current = bpm;
    })
    .onUpdate((e) => {
      const delta = startY.current - e.absoluteY;
      onBpmChange(clamp(startBpm.current + delta * 0.5));
    });

  const handleTap = useCallback(() => {
    const detected = tapTempo.current.tap();
    if (detected !== null) {
      onBpmChange(clamp(detected));
    }
  }, [onBpmChange]);

  const step = (amount: number) => onBpmChange(clamp(bpm + amount));

  return (
    <View style={styles.container}>
      {/* Drag wheel */}
      <GestureDetector gesture={panGesture}>
        <View style={[styles.wheel, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.hint, { color: C.muted }]}>drag</Text>
          <Text style={[styles.bpmValue, { color: C.text }]}>{bpm}</Text>
          <Text style={[styles.bpmUnit, { color: C.muted }]}>BPM</Text>
        </View>
      </GestureDetector>

      {/* ± buttons */}
      <View style={styles.stepRow}>
        <Pressable
          onPress={() => step(-10)}
          onLongPress={() => step(-1)}
          style={[styles.stepBtn, { backgroundColor: C.surface, borderColor: C.border }]}
        >
          <Text style={[styles.stepText, { color: C.text }]}>-10</Text>
        </Pressable>
        <Pressable
          onPress={() => step(-1)}
          style={[styles.stepBtn, { backgroundColor: C.surface, borderColor: C.border }]}
        >
          <Text style={[styles.stepText, { color: C.text }]}>-1</Text>
        </Pressable>
        <Pressable
          onPress={() => step(1)}
          style={[styles.stepBtn, { backgroundColor: C.surface, borderColor: C.border }]}
        >
          <Text style={[styles.stepText, { color: C.text }]}>+1</Text>
        </Pressable>
        <Pressable
          onPress={() => step(10)}
          onLongPress={() => step(1)}
          style={[styles.stepBtn, { backgroundColor: C.surface, borderColor: C.border }]}
        >
          <Text style={[styles.stepText, { color: C.text }]}>+10</Text>
        </Pressable>
      </View>

      {/* Tap tempo */}
      <Pressable
        onPress={handleTap}
        style={[styles.tapBtn, { backgroundColor: C.accentMuted, borderColor: C.accent }]}
      >
        <Text style={[styles.tapText, { color: C.accent }]}>TAP TEMPO</Text>
      </Pressable>

      {/* Common presets */}
      <View style={styles.presets}>
        {[60, 80, 100, 120, 140].map((preset) => (
          <Pressable
            key={preset}
            onPress={() => onBpmChange(preset)}
            style={[
              styles.preset,
              { borderColor: C.border, backgroundColor: C.surface },
              bpm === preset && { borderColor: C.accent, backgroundColor: C.accentMuted },
            ]}
          >
            <Text style={[styles.presetText, { color: bpm === preset ? C.accent : C.muted }]}>
              {preset}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  wheel: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  hint: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    position: 'absolute',
    top: 20,
  },
  bpmValue: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -2,
  },
  bpmUnit: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    position: 'absolute',
    bottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stepBtn: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tapBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  tapText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  presets: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  preset: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
