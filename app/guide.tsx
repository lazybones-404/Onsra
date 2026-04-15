/**
 * Guide screen — static content for platform publishing, distributors,
 * copyright, and an AI-powered artwork spec checker.
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchAiResponse } from '@/lib/ai/tone-chat';
import { useUserStore } from '@/store/user-store';

type GuideId = 'platform-publishing' | 'distributors' | 'copyright' | 'artwork-checker';

interface GuideSection {
  heading: string;
  body: string;
}

interface GuideContent {
  title: string;
  icon: string;
  sections: GuideSection[];
}

const GUIDES: Record<GuideId, GuideContent> = {
  'platform-publishing': {
    title: 'Platform Publishing Guide',
    icon: '🎵',
    sections: [
      {
        heading: 'Spotify',
        body: 'You cannot upload directly to Spotify. You need a music distributor (see Distributor Comparison).\n\n• Royalty: ~$0.003–$0.005 per stream\n• Artwork: 3000×3000 px JPEG/PNG, RGB, no text in bottom 20%\n• Release lead time: 5–7 days minimum\n• ISRC codes: Required per track (your distributor provides these)',
      },
      {
        heading: 'Apple Music',
        body: 'Delivered via distributor or Apple Music for Artists (direct, for qualifying artists).\n\n• Royalty: ~$0.01 per stream (higher than Spotify)\n• Artwork: 3000×3000 px min, 72 DPI, JPEG or PNG\n• Audio: 16-bit/44.1kHz WAV or higher (24-bit/96kHz preferred)\n• Metadata: Clean ISRC + ISWC for publishing royalties',
      },
      {
        heading: 'YouTube Music',
        body: 'Delivered via distributor. YouTube also has Content ID for claiming ad revenue.\n\n• Royalty: ~$0.002–$0.008 per stream (varies)\n• Register songs with a performing rights organisation (PRO) for publishing royalties\n• Content ID: Enable via your distributor to claim fan covers',
      },
      {
        heading: 'TikTok / Instagram',
        body: 'Most distributors include TikTok and Meta (Instagram/Facebook) distribution.\n\n• TikTok pays a flat fee per clip (~$0.01–$0.03) rather than per stream\n• Ensure your distributor opts you into these platforms\n• Short clips (15–60s) drive discovery — choose a hook moment carefully',
      },
      {
        heading: 'Bandcamp',
        body: 'Artist-direct platform. You keep 80–85% of revenue.\n\n• Artwork: any resolution; 1400×1400 px minimum recommended\n• Formats: WAV, FLAC, MP3, AAC, Ogg Vorbis — Bandcamp transcodes for fans\n• Bandcamp Fridays: waives their fee on first Fridays; best for direct sales',
      },
    ],
  },
  'distributors': {
    title: 'Distributor Comparison',
    icon: '💿',
    sections: [
      {
        heading: 'DistroKid',
        body: '• Pricing: ~$22.99/year unlimited releases\n• Royalty split: keeps 100% (minus their fee)\n• Platforms: Spotify, Apple, YouTube, TikTok, 150+ others\n• Speed: Usually 2–5 business days\n• Best for: High-volume artists, labels releasing often\n• Note: Annual fee — you must keep paying or music comes down',
      },
      {
        heading: 'TuneCore',
        body: '• Pricing: ~$14.99/year per single, ~$29.99/year per album\n• Royalty split: keeps 100%\n• Platforms: 150+ including Spotify, Apple, Amazon, TikTok\n• Best for: Artists releasing occasionally who want per-release pricing\n• Publishing admin: Available as an add-on (TuneCore Publishing)',
      },
      {
        heading: 'CD Baby',
        body: '• Pricing: $9.95 per single (one-time), $29 per album (one-time)\n• Royalty split: takes 9% commission\n• Platforms: 150+ including SoundCloud and sync licensing\n• Best for: Artists who want to pay once and forget\n• Publishing: CD Baby Pro includes publishing registration',
      },
      {
        heading: 'Amuse',
        body: '• Pricing: Free tier available; Pro ~$24.99/year\n• Royalty split: 100% on Pro, 80% on free\n• Best for: New artists testing distribution for free\n• Note: Free tier has slower delivery and fewer platforms',
      },
      {
        heading: 'Ditto Music',
        body: '• Pricing: £19/year (around $24) — unlimited releases\n• Royalty split: keeps 100%\n• Label account: available for managing multiple artists\n• Best for: UK-based artists or those running small indie labels',
      },
    ],
  },
  'copyright': {
    title: 'Copyright Registration',
    icon: '⚖️',
    sections: [
      {
        heading: 'Automatic Copyright',
        body: 'In most countries, copyright exists automatically the moment you create an original work. You do not need to register — but registration creates a public record and is required to sue for infringement in the US.',
      },
      {
        heading: 'US Copyright Office',
        body: 'Register at copyright.gov\n\n• Cost: $45–$65 per work (online)\n• Group registration: Up to 10 unpublished songs for one fee\n• Timing: Register before publishing, or within 3 months of first publication, to qualify for statutory damages\n• Benefits: Legal proof of ownership, ability to sue, potential to collect statutory damages ($750–$150,000 per infringement)',
      },
      {
        heading: 'Performing Rights Organisations (PROs)',
        body: 'Register with your PRO to collect public performance royalties:\n\n• 🇺🇸 US: ASCAP ($50 lifetime), BMI (free for songwriters), SESAC (invitation-only)\n• 🇬🇧 UK: PRS for Music\n• 🇦🇺 AU: APRA AMCOS\n• 🇩🇪 DE: GEMA\n\nRegister each song with your PRO using ISRC (recordings) and ISWC (compositions) codes.',
      },
      {
        heading: 'Sound Recording vs. Composition',
        body: 'There are TWO copyrights in every song:\n\n1. Composition copyright — the melody + lyrics (owned by songwriter/publisher)\n2. Sound recording copyright (master) — the actual recording (owned by whoever paid for it)\n\nMake sure you know which you own. If you self-funded your recording, you own the master.',
      },
      {
        heading: 'Sync Licensing',
        body: 'Sync = licensing music for TV, film, ads, games.\n\nTo license a song for sync, the licensee needs clearance from BOTH the composition owner and the master owner. If you wrote and recorded it yourself, you control both — this is a major advantage for indie artists in sync deals.',
      },
    ],
  },
  'artwork-checker': {
    title: 'Artwork Spec Checker',
    icon: '🎨',
    sections: [
      {
        heading: 'How it works',
        body: 'Describe your artwork specs (dimensions, file size, colour mode, text placement) and the AI will check them against Spotify, Apple Music, YouTube Music, SoundCloud, and Bandcamp requirements.',
      },
    ],
  },
};

export default function GuideScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const C = Colors[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useUserStore((s) => s.user);

  const guideId = (id ?? 'platform-publishing') as GuideId;
  const guide = GUIDES[guideId] ?? GUIDES['platform-publishing'];
  const isArtworkChecker = guideId === 'artwork-checker';

  const [artworkDesc, setArtworkDesc] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = useCallback(async () => {
    if (!artworkDesc.trim()) return;
    if (!user) {
      Alert.alert('Sign In Required', 'AI features require an account.');
      return;
    }
    setIsLoading(true);
    const result = await fetchAiResponse({
      message: artworkDesc.trim(),
      feature: 'artwork-checker',
    });
    setAiResult(result);
    setIsLoading(false);
  }, [artworkDesc, user]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: C.accent }]}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
          {guide.icon} {guide.title}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {guide.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionHeading, { color: C.accent }]}>{section.heading}</Text>
            <Text style={[styles.sectionBody, { color: C.text }]}>{section.body}</Text>
          </View>
        ))}

        {/* Artwork checker AI input */}
        {isArtworkChecker && (
          <View style={[styles.checkerCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.checkerTitle, { color: C.text }]}>Describe Your Artwork</Text>
            <TextInput
              value={artworkDesc}
              onChangeText={setArtworkDesc}
              placeholder="e.g. 3000×3000 JPEG, RGB, text covers top 30%, file is 2.4MB"
              placeholderTextColor={C.muted}
              style={[styles.checkerInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]}
              multiline
              numberOfLines={4}
            />
            <Pressable
              onPress={handleCheck}
              disabled={!artworkDesc.trim() || isLoading}
              style={[styles.checkBtn, { backgroundColor: !artworkDesc.trim() || isLoading ? C.border : C.accent }]}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={styles.checkBtnText}>✦ Check Artwork Specs</Text>
              }
            </Pressable>
            {aiResult ? (
              <View style={[styles.resultCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={[styles.resultText, { color: C.text }]}>{aiResult}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionHeading: { fontSize: 16, fontWeight: '800' },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  checkerCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  checkerTitle: { fontSize: 16, fontWeight: '700' },
  checkerInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  checkBtn: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  checkBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  resultCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  resultText: { fontSize: 14, lineHeight: 22 },
});
