import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import type { TimeSignature } from '@/store/metronome-store';
import { colors } from '@/constants/theme';

interface BeatRowProps {
  timeSignature: TimeSignature;
  currentBeat: number;
  isPlaying: boolean;
}

function beatsForSig(sig: TimeSignature): number {
  const map: Record<TimeSignature, number> = {
    '2/4': 2, '3/4': 3, '4/4': 4, '5/4': 5, '6/8': 6, '7/8': 7,
  };
  return map[sig] ?? 4;
}

function BeatDot({ index, currentBeat, isPlaying }: { index: number; currentBeat: number; isPlaying: boolean }) {
  const isAccent = index === 0;
  const isActive = isPlaying && index === currentBeat;

  const animStyle = useAnimatedStyle(() => {
    if (isActive) {
      return {
        transform: [{ scale: withSequence(withTiming(1.25, { duration: 60 }), withTiming(1, { duration: 120 })) }],
        opacity: withTiming(1, { duration: 60 }),
      };
    }
    return {
      transform: [{ scale: withTiming(1, { duration: 100 }) }],
      opacity: withTiming(isPlaying ? 0.35 : 0.5, { duration: 100 }),
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: isAccent ? 20 : 16,
          height: isAccent ? 20 : 16,
          borderRadius: isAccent ? 10 : 8,
          backgroundColor: isActive
            ? isAccent ? colors.accent : colors.accentLight
            : colors.border,
        },
        animStyle,
      ]}
    />
  );
}

export function BeatRow({ timeSignature, currentBeat, isPlaying }: BeatRowProps) {
  const beats = beatsForSig(timeSignature);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      {Array.from({ length: beats }).map((_, i) => (
        <BeatDot key={i} index={i} currentBeat={currentBeat} isPlaying={isPlaying} />
      ))}
    </View>
  );
}
