/**
 * More tab — Pillar 5: Export, Guides, Account & Settings
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { Analytics } from '@/lib/analytics';
import { getAllSongs } from '@/lib/db/songs';
import { getAllSetlists, getSetlistEntries } from '@/lib/db/setlists';
import { signOutUser } from '@/lib/supabase/auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserStore } from '@/store/user-store';

const PRIVACY_POLICY_URL = 'https://onsra.app/privacy';

export default function MoreScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];
  const user = useUserStore((s) => s.user);
  const syncStatus = useUserStore((s) => s.syncStatus);

  // Local state so the opt-out toggle updates immediately without a re-render of the store
  const [analyticsOptIn, setAnalyticsOptIn] = useState(() => Analytics.isOptedIn());

  const handleSignInOut = useCallback(() => {
    if (user) {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => { await signOutUser(); },
        },
      ]);
    } else {
      router.push('/auth');
    }
  }, [user]);

  const handleToggleAnalytics = useCallback(() => {
    if (analyticsOptIn) {
      Analytics.optOut();
      setAnalyticsOptIn(false);
    } else {
      Analytics.optIn();
      setAnalyticsOptIn(true);
    }
  }, [analyticsOptIn]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account & Data',
      'This feature is coming soon. Contact support@onsra.app to request account deletion.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleExport = useCallback(async (type: 'chord-chart' | 'lyric-sheet' | 'setlist' | 'split-sheet') => {
    try {
      let html = '';
      const songs = await getAllSongs();

      if (type === 'chord-chart') {
        const songsWithChords = songs.filter((s) => s.chord_chart);
        if (songsWithChords.length === 0) {
          Alert.alert('No Data', 'Add chord charts to your songs first.');
          return;
        }
        html = buildChordChartHTML(songsWithChords);
      } else if (type === 'lyric-sheet') {
        const songsWithLyrics = songs.filter((s) => s.lyrics);
        if (songsWithLyrics.length === 0) {
          Alert.alert('No Data', 'Add lyrics to your songs first.');
          return;
        }
        html = buildLyricSheetHTML(songsWithLyrics);
      } else if (type === 'setlist') {
        const setlists = await getAllSetlists();
        if (setlists.length === 0) {
          Alert.alert('No Data', 'Create a setlist in the Compose tab first.');
          return;
        }
        const entries = await getSetlistEntries(setlists[0].id);
        html = buildSetlistHTML(setlists[0].name, entries);
      } else {
        html = buildSplitSheetHTML(songs[0]);
      }

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (err) {
      Alert.alert('Export Failed', String(err));
    }
  }, []);

  // ─── Row helpers ──────────────────────────────────────────────────────────

  const ComingSoon = () => (
    <View style={[styles.chip, { backgroundColor: C.card }]}>
      <Text style={[styles.chipText, { color: C.muted }]}>Soon</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.tabTitle, { color: C.text }]}>More</Text>
        <View style={[styles.badge, { backgroundColor: user ? C.accentMuted : C.card }]}>
          <Text style={[styles.badgeText, { color: user ? C.accent : C.muted }]}>
            {user ? user.displayName ?? user.email : 'Guest mode'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Export ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: C.muted }]}>Export</Text>
        <View style={[styles.group, { backgroundColor: C.surface, borderColor: C.border }]}>
          {([
            ['📄', 'Chord Chart PDF', 'chord-chart'],
            ['📝', 'Lyric Sheet PDF', 'lyric-sheet'],
            ['📋', 'Setlist PDF', 'setlist'],
            ['📊', 'Split Sheet PDF', 'split-sheet'],
          ] as [string, string, 'chord-chart' | 'lyric-sheet' | 'setlist' | 'split-sheet'][]).map(([icon, label, type], i, arr) => (
            <Pressable
              key={label}
              onPress={() => handleExport(type)}
              style={({ pressed }) => [
                styles.row,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                pressed && { backgroundColor: C.card },
              ]}
            >
              <Text style={styles.rowIcon}>{icon}</Text>
              <Text style={[styles.rowLabel, { color: C.text }]}>{label}</Text>
              <Text style={[styles.rowArrow, { color: C.muted }]}>↗</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Guides ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: C.muted }]}>Guides</Text>
        <View style={[styles.group, { backgroundColor: C.surface, borderColor: C.border }]}>
          {([
            ['🎵', 'Platform Publishing Guide', 'platform-publishing'],
            ['💿', 'Distributor Comparison', 'distributors'],
            ['⚖️', 'Copyright Registration', 'copyright'],
            ['🎨', 'Artwork Spec Checker', 'artwork-checker'],
          ] as [string, string, string][]).map(([icon, label, guideId], i, arr) => (
            <Pressable
              key={label}
              onPress={() => router.push({ pathname: '/guide', params: { id: guideId } })}
              style={({ pressed }) => [
                styles.row,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                pressed && { backgroundColor: C.card },
              ]}
            >
              <Text style={styles.rowIcon}>{icon}</Text>
              <Text style={[styles.rowLabel, { color: C.text }]}>{label}</Text>
              <Text style={[styles.rowArrow, { color: C.muted }]}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Account ────────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: C.muted }]}>Account</Text>
        <View style={[styles.group, { backgroundColor: C.surface, borderColor: C.border }]}>

          {/* Sign in / Sign out */}
          <Pressable
            style={({ pressed }) => [
              styles.row,
              { borderBottomWidth: 1, borderBottomColor: C.border },
              pressed && { backgroundColor: C.card },
            ]}
            onPress={handleSignInOut}
            accessibilityRole="button"
          >
            <Text style={styles.rowIcon}>{user ? '🚪' : '👤'}</Text>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: user ? C.danger : C.accent }]}>
                {user ? 'Sign Out' : 'Sign In / Create Account'}
              </Text>
              {user && (
                <Text style={[styles.rowSub, { color: C.muted }]}>
                  Signed in as {user.email}
                </Text>
              )}
            </View>
            <Text style={[styles.rowArrow, { color: C.muted }]}>›</Text>
          </Pressable>

          {/* Sync status */}
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
            <Text style={styles.rowIcon}>🔄</Text>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: C.text }]}>Sync Status</Text>
              <Text style={[styles.rowSub, { color: user ? C.success : C.muted }]}>
                {user
                  ? syncStatus === 'syncing'
                    ? 'Syncing…'
                    : syncStatus === 'error'
                      ? 'Sync error — tap to retry'
                      : 'Up to date'
                  : 'Sign in to enable sync'}
              </Text>
            </View>
          </View>

          {/* Delete account */}
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.card }]}
            onPress={handleDeleteAccount}
            accessibilityRole="button"
          >
            <Text style={styles.rowIcon}>🗑️</Text>
            <Text style={[styles.rowLabel, { color: user ? C.danger : C.muted }]}>
              Delete Account & Data
            </Text>
            <Text style={[styles.rowArrow, { color: C.muted }]}>›</Text>
          </Pressable>
        </View>

        {/* ── Settings ───────────────────────────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: C.muted }]}>Settings</Text>
        <View style={[styles.group, { backgroundColor: C.surface, borderColor: C.border }]}>

          {/* Practice reminder — coming soon */}
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
            <Text style={styles.rowIcon}>🔔</Text>
            <Text style={[styles.rowLabel, { color: C.muted }]}>Practice Reminder</Text>
            <ComingSoon />
          </View>

          {/* Analytics toggle */}
          <Pressable
            style={({ pressed }) => [
              styles.row,
              { borderBottomWidth: 1, borderBottomColor: C.border },
              pressed && { backgroundColor: C.card },
            ]}
            onPress={handleToggleAnalytics}
            accessibilityRole="switch"
            accessibilityState={{ checked: analyticsOptIn }}
          >
            <Text style={styles.rowIcon}>📊</Text>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: C.text }]}>
                {analyticsOptIn ? 'Analytics On' : 'Analytics Off'}
              </Text>
              <Text style={[styles.rowSub, { color: C.muted }]}>
                {analyticsOptIn ? 'Tap to opt out' : 'Tap to opt back in'}
              </Text>
            </View>
            <View style={[styles.togglePill, { backgroundColor: analyticsOptIn ? C.accent : C.card }]}>
              <Text style={[styles.toggleText, { color: analyticsOptIn ? '#FFF' : C.muted }]}>
                {analyticsOptIn ? 'ON' : 'OFF'}
              </Text>
            </View>
          </Pressable>

          {/* Privacy policy */}
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.card }]}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
          >
            <Text style={styles.rowIcon}>🔒</Text>
            <Text style={[styles.rowLabel, { color: C.text }]}>Privacy Policy</Text>
            <Text style={[styles.rowArrow, { color: C.muted }]}>↗</Text>
          </Pressable>
        </View>

        <Text style={[styles.version, { color: C.muted }]}>
          Onsra v1.0.0 · 100% free · No paywall
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

const PDF_CSS = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 40px; }
  h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
  h2 { font-size: 18px; font-weight: 700; margin-top: 32px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
  pre { font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
  p { font-size: 14px; line-height: 1.6; }
  .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
`;

import type { Song } from '@/lib/db/songs';
import type { SetlistEntry } from '@/lib/db/setlists';

function buildChordChartHTML(songs: Song[]): string {
  const body = songs.map((s) => `
    <h2>${s.title}${s.artist ? ` — ${s.artist}` : ''}</h2>
    <div class="meta">${s.song_key} ${s.mode} · Capo ${s.capo} · ${s.tuning} · ${s.time_sig}${s.tempo ? ` · ${s.tempo} BPM` : ''}</div>
    <pre>${s.chord_chart ?? ''}</pre>
  `).join('<hr class="divider">');
  return `<html><head><style>${PDF_CSS}</style></head><body><h1>Chord Charts</h1>${body}</body></html>`;
}

function buildLyricSheetHTML(songs: Song[]): string {
  const body = songs.map((s) => `
    <h2>${s.title}${s.artist ? ` — ${s.artist}` : ''}</h2>
    <div class="meta">${s.song_key} ${s.mode} · ${s.time_sig}</div>
    <pre>${s.lyrics ?? ''}</pre>
  `).join('<hr class="divider">');
  return `<html><head><style>${PDF_CSS}</style></head><body><h1>Lyric Sheets</h1>${body}</body></html>`;
}

function buildSetlistHTML(setlistName: string, entries: SetlistEntry[]): string {
  const rows = entries.map((e, i) => `
    <tr>
      <td style="padding:8px;font-weight:700;color:#666;">${i + 1}</td>
      <td style="padding:8px;font-weight:600;">${e.title ?? 'Unknown'}</td>
      <td style="padding:8px;color:#888;">${e.artist ?? ''}</td>
      <td style="padding:8px;color:#888;">${e.song_key ?? ''}</td>
      <td style="padding:8px;color:#888;">${e.override_tuning ?? e.tuning ?? ''}</td>
      <td style="padding:8px;color:#888;">${e.override_tempo ? `${e.override_tempo} BPM` : ''}</td>
    </tr>
  `).join('');
  return `<html><head><style>${PDF_CSS} table{width:100%;border-collapse:collapse;} th{text-align:left;padding:8px;border-bottom:2px solid #eee;font-size:11px;color:#666;} td{border-bottom:1px solid #f5f5f5;}</style></head><body>
    <h1>${setlistName}</h1>
    <p class="meta">${entries.length} songs · Generated ${new Date().toLocaleDateString()}</p>
    <table><thead><tr><th>#</th><th>Title</th><th>Artist</th><th>Key</th><th>Tuning</th><th>Tempo</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;
}

function buildSplitSheetHTML(song?: Song): string {
  const title = song?.title || 'Untitled Song';
  return `<html><head><style>${PDF_CSS}</style></head><body>
    <h1>Split Sheet — ${title}</h1>
    <p class="meta">Generated ${new Date().toLocaleDateString()}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:24px;">
      <thead><tr style="border-bottom:2px solid #eee;">
        <th style="padding:8px;text-align:left;">Contributor</th>
        <th style="padding:8px;text-align:left;">Role</th>
        <th style="padding:8px;text-align:center;">Split %</th>
        <th style="padding:8px;text-align:left;">PRO / IPI</th>
        <th style="padding:8px;text-align:left;">Signature</th>
        <th style="padding:8px;text-align:left;">Date</th>
      </tr></thead>
      <tbody>${Array.from({ length: 4 }).map(() => `
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:12px;">&nbsp;</td>
          <td style="padding:12px;">&nbsp;</td>
          <td style="padding:12px;">&nbsp;</td>
          <td style="padding:12px;">&nbsp;</td>
          <td style="padding:12px;border-bottom:1px solid #aaa;width:160px;">&nbsp;</td>
          <td style="padding:12px;">&nbsp;</td>
        </tr>
      `).join('')}
      </tbody>
    </table>
    <p style="font-size:11px;color:#999;margin-top:32px;">
      By signing above, each contributor confirms their agreed share of ownership for this composition.
      This document is for reference only and does not constitute a legal agreement.
    </p>
  </body></html>`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: Spacing.md,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  tabTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    minHeight: 52,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  rowLabel: { fontSize: 14 },
  rowSub: { fontSize: 12 },
  rowArrow: { fontSize: 20 },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  chipText: { fontSize: 11, fontWeight: '600' },
  togglePill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    minWidth: 38,
    alignItems: 'center',
  },
  toggleText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  version: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
