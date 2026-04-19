import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useStore } from '../store';
import Button from '../components/ui/Button';
import ReciMeLogo from '../components/ReciMeLogo';
import { UserProfile } from '../db/schema';
import { E } from '../constants/emoji';

const TOTAL_STEPS = 7;

function BrandLogo({ url, size = 28 }: { url: string; size?: number }) {
  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius: size / 5 }}
      contentFit="contain"
      cachePolicy="memory-disk"
    />
  );
}

export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { saveUserProfile, completeOnboarding } = useStore();

  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState('');
  const [referral, setReferral] = useState('');
  const [recipeSources, setRecipeSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setStep(s => s + 1);
  };

  const goBack = () => setStep(s => Math.max(0, s - 1));

  const toggleGoal = (g: string) =>
    setGoals((prev: string[]) => prev.includes(g) ? prev.filter((x: string) => x !== g) : [...prev, g]);

  const toggleSource = (s: string) =>
    setRecipeSources((prev: string[]) => prev.includes(s) ? prev.filter((x: string) => x !== s) : [...prev, s]);

  const handleComplete = async () => {
    setLoading(true);
    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      username: `cook-${Math.floor(Math.random() * 9000) + 1000}`,
      goals,
      recipeSources,
      ageRange,
      referralSource: referral,
      isPlusMember: false,
      trialStartDate: null,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(profile);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const progress = (step + 1) / TOTAL_STEPS;

  const renderStep = () => {
    switch (step) {
      case 0: return <GoalsStep goals={goals} toggle={toggleGoal} onNext={goNext} t={t} />;
      case 1: return <ThatsGreatStep onNext={goNext} t={t} />;
      case 2: return <RecipeSourceStep sources={recipeSources} toggle={toggleSource} onNext={goNext} t={t} />;
      case 3: return <HowDidYouHearStep selected={referral} onSelect={(r: string) => { setReferral(r); goNext(); }} t={t} />;
      case 4: return <AgeStep selected={ageRange} onSelect={(a: string) => { setAgeRange(a); goNext(); }} t={t} />;
      case 5: return <LoadingStep text={t('onboarding_customizing')} onDone={goNext} t={t} />;
      case 6: return <OrganizeStep onNext={handleComplete} t={t} loading={loading} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
        )}
        <ReciMeLogo size={22} />
        {step < TOTAL_STEPS - 1 && (
          <TouchableOpacity onPress={handleComplete} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Step 1: Goals ─────────────────────────────────────────────────────────────

function GoalsStep({ goals, toggle, onNext, t }: any) {
  const options = [
    { key: 'healthy', label: t('onboarding_goal_healthy'), emoji: E.salad },
    { key: 'money', label: t('onboarding_goal_money'), emoji: E.money },
    { key: 'cooking', label: t('onboarding_goal_cooking'), emoji: E.cooking },
    { key: 'organize', label: t('onboarding_goal_organize'), emoji: E.books },
    { key: 'plan', label: t('onboarding_goal_plan'), emoji: E.calendar },
    { key: 'cuisine', label: t('onboarding_goal_cuisine'), emoji: E.globe },
  ];
  return (
    <View style={styles.stepOuter}>
      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{t('onboarding_goals_title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding_goals_subtitle')}</Text>
        {options.map(o => {
          const selected = goals.includes(o.key);
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.optionRow, selected && styles.optionSelected]}
              onPress={() => toggle(o.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.emojiCircle, selected && styles.emojiCircleSelected]}>
                <Text style={styles.optionEmoji}>{o.emoji}</Text>
              </View>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {o.label}
              </Text>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.ctaBar}>
        <Button label={t('continue_btn')} onPress={onNext} disabled={goals.length === 0} />
      </View>
    </View>
  );
}

// ─── Step 2: That's great ──────────────────────────────────────────────────────

function ThatsGreatStep({ onNext, t }: any) {
  return (
    <View style={[styles.stepOuter, { justifyContent: 'space-between' }]}>
      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.stepTitle, { textAlign: 'center' }]}>{t('onboarding_thats_great')}</Text>
        <Text style={styles.statText}>{t('onboarding_stat')}</Text>

        <View style={styles.blobWrap}>
          <View style={styles.blobOuter}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=600&q=80&fit=crop' }}
              style={styles.blobImage}
              contentFit="cover"
              placeholder={{ color: Colors.border }}
            />
          </View>
        </View>

        <Text style={styles.helpText}>
          {t('onboarding_help')} {E.wave}
        </Text>
      </ScrollView>
      <View style={styles.ctaBar}>
        <Button label={t('continue_btn')} onPress={onNext} />
      </View>
    </View>
  );
}

// ─── Step 3: Recipe sources ────────────────────────────────────────────────────

function RecipeSourceStep({ sources, toggle, onNext, t }: any) {
  const options = [
    {
      key: 'social',
      label: t('onboarding_social'),
      logos: [
        'https://logo.clearbit.com/instagram.com',
        'https://logo.clearbit.com/tiktok.com',
        'https://logo.clearbit.com/facebook.com',
        'https://logo.clearbit.com/pinterest.com',
      ],
    },
    {
      key: 'websites',
      label: t('onboarding_websites'),
      logos: [
        'https://logo.clearbit.com/google.com',
        'https://logo.clearbit.com/allrecipes.com',
      ],
    },
    {
      key: 'printed',
      label: t('onboarding_printed'),
      logos: [],
      icons: ['📖', '✍️'],
    },
  ];
  return (
    <View style={styles.stepOuter}>
      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{t('onboarding_recipe_source_title')}</Text>
        <Text style={styles.stepSubtitle}>{t('onboarding_goals_subtitle')}</Text>
        {options.map(o => {
          const selected = sources.includes(o.key);
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.optionRow, selected && styles.optionSelected]}
              onPress={() => toggle(o.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected, { flex: 1 }]}>
                {o.label}
              </Text>
              <View style={styles.logoRow}>
                {o.logos.length > 0
                  ? o.logos.map((url, i) => <BrandLogo key={i} url={url} size={26} />)
                  : (o as any).icons?.map((ic: string, i: number) => (
                      <Text key={i} style={{ fontSize: 22 }}>{ic}</Text>
                    ))
                }
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.ctaBar}>
        <Button label={t('continue_btn')} onPress={onNext} disabled={sources.length === 0} />
      </View>
    </View>
  );
}

// ─── Step 4: How did you hear ──────────────────────────────────────────────────

function HowDidYouHearStep({ selected, onSelect, t }: any) {
  const options = [
    { key: 'friend',    label: t('onboarding_source_friend'),   logo: null, emoji: '🤝' },
    { key: 'facebook',  label: t('onboarding_source_facebook'),  logo: 'https://logo.clearbit.com/facebook.com' },
    { key: 'appstore',  label: t('onboarding_source_appstore'),  logo: 'https://logo.clearbit.com/apple.com' },
    { key: 'instagram', label: t('onboarding_source_instagram'), logo: 'https://logo.clearbit.com/instagram.com' },
    { key: 'google',    label: t('onboarding_source_google'),    logo: 'https://logo.clearbit.com/google.com' },
    { key: 'tiktok',   label: t('onboarding_source_tiktok'),    logo: 'https://logo.clearbit.com/tiktok.com' },
    { key: 'youtube',  label: t('onboarding_source_youtube'),   logo: 'https://logo.clearbit.com/youtube.com' },
    { key: 'other',    label: t('onboarding_source_other'),     logo: null, emoji: '💬' },
  ];

  return (
    <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 48 }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{t('onboarding_hear_title')}</Text>

      {options.map(o => {
        const isSelected = selected === o.key;
        return (
          <TouchableOpacity
            key={o.key}
            style={[styles.optionRow, isSelected && styles.optionSelected]}
            onPress={() => onSelect(o.key)}
            activeOpacity={0.7}
          >
            <View style={styles.referralIconWrap}>
              {o.logo ? (
                <BrandLogo url={o.logo} size={30} />
              ) : (
                <Text style={{ fontSize: 26 }}>{(o as any).emoji}</Text>
              )}
            </View>
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {o.label}
            </Text>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Step 5: Age ───────────────────────────────────────────────────────────────

function AgeStep({ selected, onSelect, t }: any) {
  const ranges = ['24 and under', '25–34', '35–44', '45–54', '55+'];
  return (
    <ScrollView contentContainerStyle={[styles.stepContent, { paddingBottom: 48 }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{t('onboarding_age_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding_age_subtitle')}</Text>
      {ranges.map(r => {
        const isSelected = selected === r;
        return (
          <TouchableOpacity
            key={r}
            style={[styles.optionRow, isSelected && styles.optionSelected]}
            onPress={() => onSelect(r)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{r}</Text>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Step 6: Loading ───────────────────────────────────────────────────────────

function LoadingStep({ text, onDone, t }: any) {
  React.useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.stepContent, styles.centered]}>
      <Text style={styles.loadingTitle}>{t('onboarding_setting_up')}</Text>

      <View style={styles.loadingIcons}>
        {['🍕', '🍝', '🍲', '🍜', '🥧'].map((emoji, i) => (
          <View key={i} style={[styles.loadingIconBadge, { transform: [{ rotate: `${(i - 2) * 8}deg` }] }]}>
            <Text style={{ fontSize: 32 }}>{emoji}</Text>
          </View>
        ))}
      </View>

      <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
      <Text style={styles.loadingSubtext}>{text}</Text>
    </View>
  );
}

// ─── Step 7: Organize (final) ──────────────────────────────────────────────────

function OrganizeStep({ onNext, t, loading }: any) {
  const socialLogos = [
    'https://logo.clearbit.com/instagram.com',
    'https://logo.clearbit.com/tiktok.com',
    'https://logo.clearbit.com/youtube.com',
    'https://logo.clearbit.com/pinterest.com',
  ];

  return (
    <View style={[styles.stepOuter, styles.centered]}>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { textAlign: 'center' }]}>{t('onboarding_organize_title')}</Text>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <ReciMeLogo size={18} />
          </View>
          <View style={styles.previewGrid}>
            {['🍕', '🍝', '🍲', '🍜', '🥧', '🥗'].map((emoji, i) => (
              <View key={i} style={styles.previewCell}>
                <Text style={{ fontSize: 28 }}>{emoji}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.importLabel}>Import from anywhere</Text>
        <View style={styles.importRow}>
          {socialLogos.map((url, i) => (
            <BrandLogo key={i} url={url} size={38} />
          ))}
        </View>
      </View>

      <View style={styles.ctaBar}>
        {loading
          ? <ActivityIndicator color={Colors.primary} size="large" />
          : <Button label={t('onboarding_ready')} onPress={onNext} variant="purple" />}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { position: 'absolute', left: 20 },
  backArrow: { fontSize: 22, color: Colors.text, fontWeight: '400', paddingHorizontal: 4 },
  skipBtn: { position: 'absolute', right: 20 },
  skipText: { fontSize: 16, color: Colors.accent, fontWeight: '600' },
  progressTrack: { height: 4, backgroundColor: Colors.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  content: { flex: 1 },
  stepOuter: { flex: 1 },
  stepContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ctaBar: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  // Typography
  stepTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8, lineHeight: 36 },
  stepSubtitle: { fontSize: 15, color: Colors.muted, marginBottom: 24 },
  statText: { fontSize: 16, color: Colors.muted, lineHeight: 24, marginBottom: 8, textAlign: 'center' },
  helpText: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center', marginTop: 8, lineHeight: 26 },
  // Option rows
  optionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 2, borderColor: Colors.card,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  emojiCircle: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  emojiCircleSelected: { backgroundColor: '#DBEAFE' },
  optionEmoji: { fontSize: 22 },
  optionText: { fontSize: 16, color: Colors.text, fontWeight: '500', flex: 1 },
  optionTextSelected: { color: Colors.primary, fontWeight: '700' },
  checkmark: { fontSize: 16, color: Colors.primary, fontWeight: '700', marginLeft: 8 },
  // Logo row (recipe source)
  logoRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  // Referral icon
  referralIconWrap: { width: 38, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  // That's great photo
  blobWrap: { alignItems: 'center', marginVertical: 24 },
  blobOuter: {
    width: 260, height: 260, borderRadius: 130,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  blobImage: { width: '100%', height: '100%' },
  // Loading step
  loadingTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  loadingIcons: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 32 },
  loadingIconBadge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  loadingSubtext: { color: Colors.muted, fontSize: 14, marginTop: 16, textAlign: 'center' },
  // Final step preview
  previewCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 16,
    marginVertical: 20, alignSelf: 'stretch',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  previewHeader: { marginBottom: 12 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  previewCell: {
    width: '31%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, backgroundColor: Colors.background,
  },
  importLabel: { fontSize: 13, color: Colors.muted, textAlign: 'center', marginBottom: 12, fontWeight: '500' },
  importRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
});
