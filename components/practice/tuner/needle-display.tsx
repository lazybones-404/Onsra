/**
 * Tuner needle display.
 * SVG semicircle arc with an animated needle showing cents deviation.
 * Color transitions: blue (flat) → green (in tune) → red (sharp).
 */

import { View, Text } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { clampCents, tuningStatus, STATUS_COLORS } from '@/lib/audio/tuner-utils';

interface NeedleDisplayProps {
  cents: number | null;
  note: string;
  octave: number;
  frequency: number;
  targetNote?: string;
  targetOctave?: number;
}

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE * 0.72;
const R = SIZE * 0.42;

function arcPath(r: number, cx: number, cy: number): string {
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;
  return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
}

function centsToAngle(cents: number): number {
  return (cents / 50) * 85;
}

const AnimatedLine = Animated.createAnimatedComponent(Line);

export function NeedleDisplay({
  cents,
  note,
  octave,
  frequency,
  targetNote,
  targetOctave,
}: NeedleDisplayProps) {
  const clamped = cents !== null ? clampCents(cents) : 0;
  const status = cents !== null ? tuningStatus(clamped) : 'in-tune';
  const color = STATUS_COLORS[status];
  const angle = centsToAngle(clamped);
  const hasSignal = cents !== null;

  const needleAngle = useSharedValue(0);

  useEffect(() => {
    needleAngle.value = withSpring(hasSignal ? angle : 0, {
      damping: 14,
      stiffness: 120,
    });
  }, [angle, hasSignal]);

  const animatedNeedleProps = useAnimatedProps(() => {
    const rad = ((needleAngle.value - 90) * Math.PI) / 180;
    return {
      x2: CX + R * 0.85 * Math.cos(rad),
      y2: CY + R * 0.85 * Math.sin(rad),
    };
  });

  return (
    <View className="items-center">
      <Svg width={SIZE} height={SIZE * 0.6} viewBox={`0 0 ${SIZE} ${SIZE * 0.6}`}>
        {/* Arc background */}
        <Path
          d={arcPath(R, CX, CY)}
          fill="none"
          stroke="#2A2A3A"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Arc active (colored) */}
        {hasSignal && (
          <Path
            d={arcPath(R * 0.95, CX, CY)}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.3}
          />
        )}

        {/* Tick marks */}
        {[-50, -25, 0, 25, 50].map((tick) => {
          const tickAngle = ((centsToAngle(tick) - 90) * Math.PI) / 180;
          const isMajor = tick === 0;
          const inner = isMajor ? R * 0.72 : R * 0.78;
          const outer = R * 0.88;
          return (
            <Line
              key={tick}
              x1={CX + inner * Math.cos(tickAngle)}
              y1={CY + inner * Math.sin(tickAngle)}
              x2={CX + outer * Math.cos(tickAngle)}
              y2={CY + outer * Math.sin(tickAngle)}
              stroke={tick === 0 ? '#22C55E' : '#2A2A3A'}
              strokeWidth={isMajor ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Needle */}
        <AnimatedLine
          animatedProps={animatedNeedleProps}
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - R * 0.85}
          stroke={hasSignal ? color : '#3A3A4A'}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Center pivot */}
        <Circle cx={CX} cy={CY} r={5} fill={hasSignal ? color : '#3A3A4A'} />
      </Svg>

      {/* Note display */}
      <View className="items-center -mt-4">
        {hasSignal ? (
          <>
            <Text style={{ color, fontSize: 64, fontWeight: '800', lineHeight: 72 }}>
              {note}
              <Text style={{ color, fontSize: 28, fontWeight: '600' }}>{octave}</Text>
            </Text>
            <Text className="text-muted text-base mt-1">
              {frequency.toFixed(1)} Hz
            </Text>
            <Text style={{ color, fontSize: 15, fontWeight: '600', marginTop: 4 }}>
              {Math.abs(clamped) <= 5
                ? '✓ In tune'
                : clamped > 0
                ? `▲ +${clamped}¢ sharp`
                : `▼ ${clamped}¢ flat`}
            </Text>
          </>
        ) : (
          <>
            <Text className="text-foreground text-4xl font-bold opacity-20">–</Text>
            <Text className="text-muted text-sm mt-2">Play a note</Text>
          </>
        )}

        {targetNote && (
          <Text className="text-muted-dark text-xs mt-2">
            Target: {targetNote}{targetOctave}
          </Text>
        )}
      </View>
    </View>
  );
}
