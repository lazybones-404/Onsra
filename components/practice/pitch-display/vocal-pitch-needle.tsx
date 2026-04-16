import { View, Text } from 'react-native';
import { useEffect } from 'react';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import { useAudioStore } from '@/store/audio-store';
import { colors } from '@/constants/theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const SIZE = 260;
const CX = SIZE / 2;
const CY = SIZE * 0.7;
const R = SIZE * 0.38;

function centsToAngle(cents: number): number {
  return (Math.max(-50, Math.min(50, cents)) / 50) * 80;
}

interface VocalPitchNeedleProps {
  showHint?: boolean;
}

export function VocalPitchNeedle({ showHint = true }: VocalPitchNeedleProps) {
  const { pitchResult, micActive } = useAudioStore();

  const hasSignal = pitchResult !== null;
  const cents = pitchResult?.cents ?? 0;
  const note = pitchResult?.note ?? '';
  const octave = pitchResult?.octave ?? 0;
  const frequency = pitchResult?.frequency ?? 0;

  const angle = useSharedValue(0);

  const color =
    !hasSignal ? colors.border
    : Math.abs(cents) <= 5 ? colors.inTune
    : cents > 0 ? colors.sharp
    : colors.flat;

  useEffect(() => {
    angle.value = withSpring(hasSignal ? centsToAngle(cents) : 0, {
      damping: 12,
      stiffness: 100,
    });
  }, [cents, hasSignal]);

  const animatedNeedle = useAnimatedProps(() => {
    const rad = ((angle.value - 90) * Math.PI) / 180;
    return {
      x2: CX + R * 0.82 * Math.cos(rad),
      y2: CY + R * 0.82 * Math.sin(rad),
    };
  });

  return (
    <View className="items-center">
      {/* Mic status pill */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 20,
          backgroundColor: micActive ? `${colors.success}18` : colors.surface,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: micActive ? colors.success : colors.mutedDark,
          }}
        />
        <Text style={{ color: micActive ? colors.success : colors.muted, fontSize: 12, fontWeight: '600' }}>
          {micActive ? 'Listening' : 'Mic off'}
        </Text>
      </View>

      <Svg width={SIZE} height={SIZE * 0.55} viewBox={`0 0 ${SIZE} ${SIZE * 0.55}`}>
        {/* Arc */}
        <Path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={colors.border}
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Center tick (in-tune marker) */}
        <Line
          x1={CX}
          y1={CY - R * 0.78}
          x2={CX}
          y2={CY - R * 0.92}
          stroke={colors.inTune}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* ±25¢ ticks */}
        {[-25, 25].map((c) => {
          const a = ((centsToAngle(c) - 90) * Math.PI) / 180;
          return (
            <Line
              key={c}
              x1={CX + R * 0.78 * Math.cos(a)}
              y1={CY + R * 0.78 * Math.sin(a)}
              x2={CX + R * 0.9 * Math.cos(a)}
              y2={CY + R * 0.9 * Math.sin(a)}
              stroke={colors.border}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle */}
        <AnimatedLine
          animatedProps={animatedNeedle}
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - R * 0.82}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Circle cx={CX} cy={CY} r={5} fill={color} />
      </Svg>

      {/* Note name */}
      <View className="items-center -mt-2">
        {hasSignal ? (
          <>
            <Text style={{ color, fontSize: 72, fontWeight: '800', lineHeight: 80 }}>
              {note}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 18, marginTop: 2 }}>
              Octave {octave} · {frequency.toFixed(1)} Hz
            </Text>
            <Text
              style={{
                color,
                fontSize: 16,
                fontWeight: '700',
                marginTop: 6,
              }}
            >
              {Math.abs(cents) <= 5
                ? '✓ On pitch'
                : cents > 0
                ? `▲ ${cents}¢ sharp`
                : `▼ ${Math.abs(cents)}¢ flat`}
            </Text>
          </>
        ) : (
          <>
            <Text style={{ color: colors.border, fontSize: 48, fontWeight: '800' }}>–</Text>
            {showHint && (
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
                Sing or hum a note
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}
