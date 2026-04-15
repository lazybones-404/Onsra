import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  note: string | null;
  octave: number | null;
  cents: number;
  frequency: number | null;
  active: boolean;
}

const NEEDLE_LENGTH = 90;
const ARC_RADIUS = 110;
const WIDTH = 260;
const HEIGHT = 160;
const CX = WIDTH / 2;
const CY = HEIGHT - 20;

function centsToAngle(cents: number): number {
  return (cents / 50) * 55;
}

function polarToXY(angle: number, r: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function describeArc(r: number, startAngle: number, endAngle: number): string {
  const start = polarToXY(startAngle, r);
  const end = polarToXY(endAngle, r);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function NeedleDisplay({ note, octave, cents, frequency, active }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withSpring(active ? centsToAngle(cents) : 0, {
      damping: 12,
      stiffness: 100,
      mass: 0.5,
    });
  }, [cents, active, angle]);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  const inTune = Math.abs(cents) <= 5;
  const close = Math.abs(cents) <= 15;
  const indicatorColor = !active ? C.muted : inTune ? C.success : close ? '#F0A500' : C.danger;

  const tipPos = polarToXY(0, NEEDLE_LENGTH);

  return (
    <View style={styles.container}>
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {/* Background arc */}
        <Path
          d={describeArc(ARC_RADIUS, -55 - 90 + 90, 55 - 90 + 90)}
          fill="none"
          stroke={C.border}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* In-tune zone arc */}
        <Path
          d={describeArc(ARC_RADIUS, -8 - 90 + 90, 8 - 90 + 90)}
          fill="none"
          stroke={C.success}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.5}
        />
        {/* Tick marks */}
        {[-50, -25, 0, 25, 50].map((c) => {
          const a = centsToAngle(c);
          const outer = polarToXY(a, ARC_RADIUS + 6);
          const inner = polarToXY(a, ARC_RADIUS - 6);
          return (
            <Line
              key={c}
              x1={outer.x} y1={outer.y}
              x2={inner.x} y2={inner.y}
              stroke={c === 0 ? C.success : C.muted}
              strokeWidth={c === 0 ? 2 : 1}
            />
          );
        })}
      </Svg>

      {/* Animated needle */}
      <Animated.View style={[styles.needleContainer, needleStyle]}>
        <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={StyleSheet.absoluteFill}>
          <Line
            x1={CX} y1={CY}
            x2={tipPos.x} y2={tipPos.y}
            stroke={indicatorColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Circle cx={CX} cy={CY} r={5} fill={indicatorColor} />
        </Svg>
      </Animated.View>

      {/* Note display */}
      <View style={styles.noteContainer}>
        {active && note ? (
          <>
            <Text style={[styles.noteName, { color: indicatorColor }]}>{note}</Text>
            <Text style={[styles.noteOctave, { color: C.muted }]}>{octave}</Text>
          </>
        ) : (
          <Text style={[styles.noSignal, { color: C.muted }]}>—</Text>
        )}
      </View>

      {/* Cents / Hz */}
      {active && frequency && (
        <View style={styles.infoRow}>
          <Text style={[styles.hzText, { color: C.muted }]}>{frequency.toFixed(1)} Hz</Text>
          <Text style={[styles.centsText, { color: indicatorColor }]}>
            {cents > 0 ? '+' : ''}{cents}¢
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    height: 200,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  needleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 260,
    height: 160,
    transformOrigin: `${CX}px ${CY}px`,
  },
  noteContainer: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  noteName: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  noteOctave: {
    fontSize: 20,
    fontWeight: '500',
  },
  noSignal: {
    fontSize: 36,
    fontWeight: '300',
  },
  infoRow: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  hzText: {
    fontSize: 13,
  },
  centsText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
