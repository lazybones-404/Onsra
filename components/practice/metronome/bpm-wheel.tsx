/**
 * BPM Wheel — iPod-style circular gesture to adjust tempo.
 *
 * The user rotates their finger around the wheel center to increase/decrease BPM.
 * Clockwise = increase, counter-clockwise = decrease.
 * Sensitivity: ~1 BPM per 3 degrees of rotation.
 */

import { View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';

interface BpmWheelProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  size?: number;
}

const DEGREES_PER_BPM = 3;

export function BpmWheel({ bpm, onBpmChange, size = 220 }: BpmWheelProps) {
  const rotation = useSharedValue(0);
  const lastAngle = useSharedValue(0);
  const accumulated = useSharedValue(0);

  function getAngle(x: number, y: number, cx: number, cy: number): number {
    return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
  }

  const gesture = Gesture.Pan()
    .onBegin((e) => {
      const cx = size / 2;
      const cy = size / 2;
      lastAngle.value = getAngle(e.x, e.y, cx, cy);
      accumulated.value = 0;
    })
    .onUpdate((e) => {
      const cx = size / 2;
      const cy = size / 2;
      const currentAngle = getAngle(e.x, e.y, cx, cy);
      let delta = currentAngle - lastAngle.value;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      lastAngle.value = currentAngle;
      rotation.value += delta;
      accumulated.value += delta;

      const bpmDelta = Math.round(accumulated.value / DEGREES_PER_BPM);
      if (bpmDelta !== 0) {
        accumulated.value -= bpmDelta * DEGREES_PER_BPM;
        runOnJS(onBpmChange)(Math.max(20, Math.min(300, bpm + bpmDelta)));
      }
    });

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const r = size / 2;
  const outerR = r - 8;
  const innerR = r * 0.55;

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute', width: size, height: size }, wheelStyle]}>
          {/* Outer ring */}
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              right: 8,
              bottom: 8,
              borderRadius: outerR,
              borderWidth: 2.5,
              borderColor: colors.accentMuted,
              backgroundColor: colors.surface,
            }}
          />

          {/* Grip dots around the wheel */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const dotR = outerR - 16;
            const x = r + dotR * Math.cos(angle) - 3;
            const y = r + dotR * Math.sin(angle) - 3;
            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.border,
                }}
              />
            );
          })}
        </Animated.View>

        {/* Center display (non-rotating) */}
        <View
          style={{
            width: innerR * 2,
            height: innerR * 2,
            borderRadius: innerR,
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 52, fontWeight: '800', lineHeight: 58 }}>
            {bpm}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600', letterSpacing: 2 }}>
            BPM
          </Text>
        </View>
      </View>
    </GestureDetector>
  );
}
