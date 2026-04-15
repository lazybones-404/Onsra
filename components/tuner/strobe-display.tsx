import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  note: string | null;
  octave: number | null;
  cents: number;
  active: boolean;
}

const NUM_BARS = 20;
const BAR_WIDTH = 8;
const BAR_GAP = 4;
const STRIPE_WIDTH = (BAR_WIDTH + BAR_GAP) * NUM_BARS;
const MAX_SPEED = 800; // ms for full cycle at 50 cents

function centsToSpeedMs(cents: number): number {
  if (Math.abs(cents) < 0.5) return 0;
  return Math.max(100, MAX_SPEED - Math.abs(cents) * 14);
}

export function StrobeDisplay({ note, octave, cents, active }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const offset = useSharedValue(0);
  const prevCents = useRef(0);

  useEffect(() => {
    if (!active || Math.abs(cents) < 0.5) {
      cancelAnimation(offset);
      offset.value = 0;
      return;
    }

    const speed = centsToSpeedMs(cents);
    const direction = cents > 0 ? 1 : -1;

    cancelAnimation(offset);
    offset.value = withRepeat(
      withTiming(direction * (BAR_WIDTH + BAR_GAP), {
        duration: speed,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    prevCents.current = cents;
  }, [cents, active, offset]);

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value % (BAR_WIDTH + BAR_GAP) }],
  }));

  const inTune = Math.abs(cents) <= 5;
  const close = Math.abs(cents) <= 15;
  const barColor = !active ? C.border : inTune ? C.success : close ? '#F0A500' : C.danger;

  return (
    <View style={styles.container}>
      <View style={[styles.viewport, { borderColor: C.border, backgroundColor: C.surface }]}>
        <View style={styles.clip}>
          <Animated.View style={[styles.stripe, stripStyle]}>
            {Array.from({ length: NUM_BARS * 3 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { backgroundColor: i % 2 === 0 ? barColor : 'transparent' },
                ]}
              />
            ))}
          </Animated.View>
        </View>

        {/* In-tune lock overlay */}
        {active && inTune && (
          <View style={[styles.lockOverlay, { backgroundColor: C.success + '22' }]}>
            <Text style={[styles.lockText, { color: C.success }]}>● IN TUNE</Text>
          </View>
        )}
      </View>

      {/* Note name */}
      <View style={styles.noteRow}>
        {active && note ? (
          <Text style={[styles.noteName, { color: barColor }]}>
            {note}<Text style={[styles.octave, { color: C.muted }]}>{octave}</Text>
          </Text>
        ) : (
          <Text style={[styles.idle, { color: C.muted }]}>— —</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  viewport: {
    width: 280,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  clip: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  stripe: {
    flexDirection: 'row',
    width: STRIPE_WIDTH * 3,
  },
  bar: {
    width: BAR_WIDTH,
    height: 60,
    marginRight: BAR_GAP,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  noteRow: {
    height: 48,
    justifyContent: 'center',
  },
  noteName: {
    fontSize: 36,
    fontWeight: '700',
  },
  octave: {
    fontSize: 20,
    fontWeight: '400',
  },
  idle: {
    fontSize: 28,
    fontWeight: '300',
  },
});
