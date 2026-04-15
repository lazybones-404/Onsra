import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  beatsPerBar: number;
  currentBeat: number;
  isActive: boolean;
  onTimeSigChange?: (beats: number, unit: number) => void;
  beatUnit: number;
}

const TIME_SIGS = [
  { beats: 2, unit: 4, label: '2/4' },
  { beats: 3, unit: 4, label: '3/4' },
  { beats: 4, unit: 4, label: '4/4' },
  { beats: 6, unit: 8, label: '6/8' },
];

function BeatDot({
  index,
  currentBeat,
  beatsPerBar,
  isActive,
}: {
  index: number;
  currentBeat: number;
  beatsPerBar: number;
  isActive: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];
  const isAccent = index === 0;
  const isActive_ = isActive && index === currentBeat;

  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive_) {
      scale.value = withSequence(
        withTiming(isAccent ? 1.4 : 1.2, { duration: 40 }),
        withTiming(1, { duration: 120 }),
      );
    }
  }, [isActive_, isAccent, scale, currentBeat]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotColor = isActive_
    ? isAccent ? C.accent : C.tint
    : isActive ? C.border : C.surface;

  const size = isAccent ? 22 : 18;

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dotColor,
          borderWidth: 1.5,
          borderColor: isActive_ ? dotColor : C.border,
          marginHorizontal: 3,
        },
      ]}
    />
  );
}

export function BeatRow({ beatsPerBar, currentBeat, isActive, onTimeSigChange, beatUnit }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  return (
    <View style={styles.container}>
      {/* Beat dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: beatsPerBar }).map((_, i) => (
          <BeatDot
            key={i}
            index={i}
            currentBeat={currentBeat}
            beatsPerBar={beatsPerBar}
            isActive={isActive}
          />
        ))}
      </View>

      {/* Time signature selector */}
      {onTimeSigChange && (
        <View style={styles.timeSigRow}>
          <Text style={[styles.timeSigLabel, { color: C.muted }]}>TIME SIG</Text>
          <View style={styles.timeSigButtons}>
            {TIME_SIGS.map((ts) => {
              const selected = ts.beats === beatsPerBar && ts.unit === beatUnit;
              return (
                <Text
                  key={ts.label}
                  onPress={() => onTimeSigChange(ts.beats, ts.unit)}
                  style={[
                    styles.timeSigBtn,
                    { color: selected ? C.accent : C.muted, borderColor: selected ? C.accent : C.border },
                    selected && { backgroundColor: C.accentMuted },
                  ]}
                >
                  {ts.label}
                </Text>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
  },
  timeSigRow: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeSigLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  timeSigButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  timeSigBtn: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
