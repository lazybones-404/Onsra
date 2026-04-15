import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  rootNote: string;
  scaleNotes: string[];
  /** Number of frets to display */
  frets?: number;
  /** Open string notes low-to-high */
  openStrings?: string[];
}

const GUITAR_STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'];
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FRET_MARKERS = [3, 5, 7, 9, 12];

function noteAtFret(openNote: string, fret: number): string {
  const idx = CHROMATIC.indexOf(openNote);
  if (idx === -1) return '';
  return CHROMATIC[(idx + fret) % 12];
}

export function FretboardDiagram({ rootNote, scaleNotes, frets = 12, openStrings = GUITAR_STRINGS }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];

  const FRET_WIDTH = 36;
  const STRING_HEIGHT = 24;
  const NUT_WIDTH = 8;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: C.muted }]}>FRETBOARD</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.board}>
        {/* Nut */}
        <View style={[styles.nut, { backgroundColor: C.muted, height: openStrings.length * STRING_HEIGHT }]} />

        {/* Fret markers */}
        <View style={[styles.fretMarkersRow, { left: NUT_WIDTH }]}>
          {Array.from({ length: frets }).map((_, f) => (
            <View key={f} style={[styles.fretMarkerCell, { width: FRET_WIDTH }]}>
              {FRET_MARKERS.includes(f + 1) && (
                <View style={[styles.fretMarkerDot, { backgroundColor: C.border }]} />
              )}
            </View>
          ))}
        </View>

        {/* Strings */}
        {[...openStrings].reverse().map((open, si) => (
          <View key={si} style={[styles.stringRow, { height: STRING_HEIGHT }]}>
            {/* String line */}
            <View style={[styles.stringLine, { backgroundColor: C.border }]} />

            {/* Open string note */}
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: scaleNotes.includes(open)
                    ? open === rootNote ? C.accent : C.success
                    : 'transparent',
                  borderColor: scaleNotes.includes(open) ? C.accent : C.border,
                  width: NUT_WIDTH + 4,
                  left: -2,
                },
              ]}
            >
              <Text style={[styles.dotText, { color: '#FFF' }]}>
                {scaleNotes.includes(open) ? open : ''}
              </Text>
            </View>

            {/* Fret dots */}
            {Array.from({ length: frets }).map((_, f) => {
              const note = noteAtFret(open, f + 1);
              const inScale = scaleNotes.includes(note);
              const isRoot = note === rootNote;
              return (
                <View
                  key={f}
                  style={[styles.fretCell, { width: FRET_WIDTH }]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: inScale
                          ? isRoot ? C.accent : C.success + 'CC'
                          : 'transparent',
                        borderColor: inScale ? (isRoot ? C.accent : C.success) : 'transparent',
                      },
                    ]}
                  >
                    {inScale && (
                      <Text style={styles.dotText}>{note}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Fret number labels */}
        <View style={[styles.fretNumbers, { left: NUT_WIDTH }]}>
          {Array.from({ length: frets }).map((_, f) => (
            <View key={f} style={[styles.fretNumberCell, { width: FRET_WIDTH }]}>
              {[1, 3, 5, 7, 9, 12].includes(f + 1) && (
                <Text style={[styles.fretNumber, { color: C.muted }]}>{f + 1}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.md,
  },
  board: {
    paddingHorizontal: Spacing.md,
  },
  nut: {
    width: 8,
    position: 'absolute',
    left: Spacing.md,
    top: 0,
    borderRadius: 2,
    zIndex: 2,
  },
  fretMarkersRow: {
    position: 'absolute',
    flexDirection: 'row',
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  fretMarkerCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#333',
  },
  fretMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.4,
  },
  stringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    zIndex: 1,
  },
  stringLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.5,
  },
  fretCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 2,
  },
  dotText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFF',
  },
  fretNumbers: {
    flexDirection: 'row',
    marginTop: 4,
  },
  fretNumberCell: {
    alignItems: 'center',
  },
  fretNumber: {
    fontSize: 10,
  },
});
