import { View, Text, TouchableOpacity } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface SetlistTimerProps {
  totalSeconds: number;
  onComplete?: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function SetlistTimer({ totalSeconds, onComplete }: SetlistTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= totalSeconds) {
            setRunning(false);
            onComplete?.();
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, totalSeconds]);

  const remaining = totalSeconds - elapsed;
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
          Setlist Timer
        </Text>
        <TouchableOpacity
          onPress={() => { setElapsed(0); setRunning(false); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="refresh" size={18} color={colors.mutedDark} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 12 }}>
        <View
          style={{
            height: 4,
            width: `${progress * 100}%`,
            backgroundColor: progress >= 1 ? colors.danger : colors.accent,
            borderRadius: 2,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.foreground, fontSize: 28, fontWeight: '800' }}>
            {formatTime(remaining)}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {formatTime(elapsed)} elapsed / {formatTime(totalSeconds)} total
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setRunning((v) => !v)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: running ? colors.danger : colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name={running ? 'pause' : 'play-arrow'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
