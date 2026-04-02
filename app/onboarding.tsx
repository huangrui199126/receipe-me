import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Animated, Dimensions, Image, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useStore } from '../store';
import Button from '../components/ui/Button';
import ReciMeLogo from '../components/ReciMeLogo';
import { UserProfile } from '../db/schema';

const { width } = Dimensions.get('window');

const TOTAL_STEPS = 10;

export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { saveUserProfile, completeOnboarding } = useStore();

  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState('');
  const [referral, setReferral] = useState('');
  const [recipeSources, setRecipeSources] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'paid'>('free');
  const [remindMe, setRemindMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
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
      trialStartDate: selectedPlan === 'free' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(profile);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const requestNotifications = async () => {
    goNext();
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
      case 6: return <ChartStep onNext={goNext} t={t} />;
      case 7: return <OrganizeStep onNext={goNext} t={t} />;
      case 8: return <TrialInfoStep onNext={goNext} t={t} />;
      case 9: return <PaywallStep
        selected={selectedPlan}
        onSelect={setSelectedPlan}
        remindMe={remindMe}
        onToggleRemind={setRemindMe}
        onRedeem={handleComplete}
        loading={loading}
        t={t}
      />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        {step > 0 && step < 9 && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        )}
        <ReciMeLogo size={22} />
        {step < 8 && (
          <TouchableOpacity onPress={() => setStep(9)} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Step Components ───────────────────────────────────────────────────────────

function GoalsStep({ goals, toggle, onNext, t }: any) {
  const options = [
    { key: 'healthy', label: t('onboarding_goal_healthy'), emoji: '🥗' },
    { key: 'money', label: t('onboarding_goal_money'), emoji: '💰' },
    { key: 'cooking', label: t('onboarding_goal_cooking'), emoji: '🍳' },
    { key: 'organize', label: t('onboarding_goal_organize'), emoji: '📚' },
    { key: 'plan', label: t('onboarding_goal_plan'), emoji: '📅' },
    { key: 'cuisine', label: t('onboarding_goal_cuisine'), emoji: '✈️' },
  ];
  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.title}>{t('onboarding_goals_title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding_goals_subtitle')}</Text>
      {options.map(o => (
        <TouchableOpacity
          key={o.key}
          style={[styles.optionRow, goals.includes(o.key) && styles.optionSelected]}
          onPress={() => toggle(o.key)}
        >
          <Text style={styles.optionEmoji}>{o.emoji}</Text>
          <Text style={[styles.optionText, goals.includes(o.key) && styles.optionTextSelected]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
      <Button label={t('continue_btn')} onPress={onNext} style={styles.cta} disabled={goals.length === 0} />
    </ScrollView>
  );
}

function ThatsGreatStep({ onNext, t }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.title}>{t('onboarding_thats_great')}</Text>
      <Text style={styles.bodyCenter}>{t('onboarding_stat')}</Text>
      <View style={styles.imageCircle}>
        <Text style={{ fontSize: 80 }}>👩‍🍳</Text>
      </View>
      <Text style={styles.bodyCenter}>{t('onboarding_help')}</Text>
      <Button label={t('continue_btn')} onPress={onNext} style={styles.cta} />
    </View>
  );
}

function RecipeSourceStep({ sources, toggle, onNext, t }: any) {
  const options = [
    { key: 'social', label: t('onboarding_social'), icons: '📱' },
    { key: 'websites', label: t('onboarding_websites'), icons: '🌐' },
    { key: 'printed', label: t('onboarding_printed'), icons: '📖' },
  ];
  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.title}>{t('onboarding_recipe_source_title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding_goals_subtitle')}</Text>
      {options.map(o => (
        <TouchableOpacity
          key={o.key}
          style={[styles.optionRow, sources.includes(o.key) && styles.optionSelected]}
          onPress={() => toggle(o.key)}
        >
          <Text style={styles.optionEmoji}>{o.icons}</Text>
          <Text style={[styles.optionText, sources.includes(o.key) && styles.optionTextSelected]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
      <Button label={t('continue_btn')} onPress={onNext} style={styles.cta} disabled={sources.length === 0} />
    </ScrollView>
  );
}

function HowDidYouHearStep({ selected, onSelect, t }: any) {
  const options = [
    { key: 'friend', label: t('onboarding_source_friend') },
    { key: 'facebook', label: t('onboarding_source_facebook') },
    { key: 'appstore', label: t('onboarding_source_appstore') },
    { key: 'instagram', label: t('onboarding_source_instagram') },
    { key: 'google', label: t('onboarding_source_google') },
    { key: 'tiktok', label: t('onboarding_source_tiktok') },
    { key: 'youtube', label: t('onboarding_source_youtube') },
    { key: 'youtubead', label: t('onboarding_source_youtubead') },
    { key: 'influencer', label: t('onboarding_source_influencer') },
    { key: 'other', label: t('onboarding_source_other') },
  ];
  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.title}>{t('onboarding_hear_title')}</Text>
      {options.map(o => (
        <TouchableOpacity key={o.key} style={styles.optionRow} onPress={() => onSelect(o.key)}>
          <Text style={styles.optionText}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function AgeStep({ selected, onSelect, t }: any) {
  const ranges = ['24 and under', '25-34', '35-44', '45-54', '55+'];
  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.title}>{t('onboarding_age_title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding_age_subtitle')}</Text>
      {ranges.map(r => (
        <TouchableOpacity key={r} style={[styles.optionRow, selected === r && styles.optionSelected]} onPress={() => onSelect(r)}>
          <Text style={[styles.optionText, selected === r && styles.optionTextSelected]}>{r}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function LoadingStep({ text, onDone, t }: any) {
  React.useEffect(() => {
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <View style={[styles.stepContent, styles.centered]}>
      <Text style={styles.bodyCenter}>{t('onboarding_setting_up')}</Text>
      <View style={styles.logoAnim}>
        <Text style={{ fontSize: 60 }}>🍊</Text>
        <Text style={{ fontSize: 50, position: 'absolute', top: -10, right: -10 }}>🍃</Text>
        <Text style={{ fontSize: 40, position: 'absolute', bottom: -5, left: -10 }}>🌸</Text>
        <Text style={{ fontSize: 45, position: 'absolute', bottom: 0, right: -15 }}>🎀</Text>
      </View>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function ChartStep({ onNext, t }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.title}>{t('onboarding_chart_title')}</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chartBadge}>
          <Text style={styles.chartBadgeText}>Organized recipes</Text>
        </View>
        <View style={styles.chartLine} />
        <View style={[styles.chartBadge, { backgroundColor: Colors.primaryLight, alignSelf: 'flex-start', marginTop: 40 }]}>
          <Text style={[styles.chartBadgeText, { color: Colors.primary }]}>Scattered recipes</Text>
        </View>
        <View style={styles.chartXLabels}>
          <Text style={styles.chartLabel}>Now</Text>
          <Text style={[styles.chartLabel, { color: Colors.accent }]}>Your goal</Text>
        </View>
      </View>
      <Text style={styles.bodyCenter}>{t('onboarding_chart_body')}</Text>
      <Button label={t('continue_btn')} onPress={onNext} style={styles.cta} />
    </View>
  );
}

function OrganizeStep({ onNext, t }: any) {
  return (
    <View style={[styles.stepContent, styles.centered]}>
      <Text style={styles.title}>{t('onboarding_organize_title')}</Text>
      <View style={styles.phonePreview}>
        <Text style={styles.phonePreviewText}>📱 ReciMe App Preview</Text>
        <View style={styles.previewGrid}>
          {['🥗', '🍝', '🍕', '🥘', '🍜', '🥧'].map((e, i) => (
            <View key={i} style={styles.previewCell}>
              <Text style={{ fontSize: 28 }}>{e}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.socialRow}>
        {['📌', '📘', '▶️', '🎵', '📷'].map((e, i) => <Text key={i} style={styles.socialIcon}>{e}</Text>)}
      </View>
      <Button label={t('onboarding_ready')} onPress={onNext} variant="purple" style={styles.cta} />
    </View>
  );
}

function TrialInfoStep({ onNext, t }: any) {
  return (
    <View style={[styles.stepContent, styles.centered]}>
      <View style={styles.trialText}>
        <Text style={styles.trialLine}>We offer</Text>
        <Text style={[styles.trialLine, { color: Colors.accent }]}>7 Days for free</Text>
        <Text style={styles.trialLine}>so everyone can cook</Text>
        <Text style={styles.trialLine}>with ReciMe.</Text>
      </View>
      <Button label={t('continue_btn')} onPress={onNext} variant="purple" style={styles.cta} />
    </View>
  );
}

function PaywallStep({ selected, onSelect, remindMe, onToggleRemind, onRedeem, loading, t }: any) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent}>
      <Text style={styles.title}>{t('onboarding_paywall_title')}</Text>

      {/* Plan options */}
      <TouchableOpacity
        style={[styles.planCard, selected === 'free' && styles.planCardSelected]}
        onPress={() => onSelect('free')}
      >
        <View style={styles.planTextWrap}>
          <Text style={styles.planTitle}>FREE</Text>
          <Text style={styles.planSub}>7 Day Trial</Text>
        </View>
        <View style={[styles.planRadio, selected === 'free' && styles.planRadioSelected]}>
          {selected === 'free' && <View style={styles.planRadioInner} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.planCard, selected === 'paid' && styles.planCardSelected]}
        onPress={() => onSelect('paid')}
      >
        <View style={styles.planTextWrap}>
          <Text style={styles.planTitle}>$1.99</Text>
          <Text style={styles.planSub}>30 Day Trial</Text>
        </View>
        <View style={[styles.planRadio, selected === 'paid' && styles.planRadioSelected]}>
          {selected === 'paid' && <View style={styles.planRadioInner} />}
        </View>
      </TouchableOpacity>

      {/* Remind toggle */}
      <View style={styles.remindRow}>
        <Text style={styles.remindText}>{t('onboarding_remind_toggle')}</Text>
        <Switch
          value={remindMe}
          onValueChange={onToggleRemind}
          trackColor={{ true: Colors.purple, false: Colors.border }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity><Text style={[styles.linkText, { textAlign: 'center', marginBottom: 16 }]}>{t('onboarding_view_plans')}</Text></TouchableOpacity>

      {/* Social proof */}
      <View style={styles.proofRow}>
        <View style={styles.proofItem}>
          <Text style={styles.proofNumber}>10M+</Text>
          <Text style={styles.proofLabel}>{t('onboarding_happy_cooks')}</Text>
        </View>
        <View style={styles.proofItem}>
          <Text style={styles.proofNumber}>⭐⭐⭐⭐⭐</Text>
          <Text style={styles.proofLabel}>{t('onboarding_star_rating')}</Text>
        </View>
      </View>
      <Text style={[styles.muted, { textAlign: 'center', marginBottom: 20 }]}>{t('onboarding_made_in_usa')}</Text>

      <Text style={[styles.muted, { textAlign: 'center', marginBottom: 8 }]}>{t('onboarding_no_payment')}</Text>
      <Button label={t('onboarding_redeem')} onPress={onRedeem} loading={loading} variant="purple" style={styles.cta} />
      <Text style={[styles.muted, { textAlign: 'center', marginTop: 10, fontSize: 12 }]}>{t('onboarding_price_note')}</Text>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { position: 'absolute', left: 20 },
  backArrow: { fontSize: 28, color: Colors.text, fontWeight: '300' },
  skipBtn: { position: 'absolute', right: 20 },
  skipText: { fontSize: 16, color: Colors.accent, fontWeight: '600' },
  progressTrack: { height: 4, backgroundColor: Colors.border, marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
  content: { flex: 1 },
  stepContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8, lineHeight: 34 },
  subtitle: { fontSize: 15, color: Colors.muted, textAlign: 'center', marginBottom: 28 },
  bodyCenter: { fontSize: 16, color: Colors.muted, textAlign: 'center', lineHeight: 24, marginVertical: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: Colors.primary },
  optionEmoji: { fontSize: 22, marginRight: 14 },
  optionText: { fontSize: 16, color: Colors.text, fontWeight: '500', flex: 1 },
  optionTextSelected: { color: Colors.primary, fontWeight: '700' },
  cta: { marginTop: 24 },
  imageCircle: { width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginVertical: 24, overflow: 'hidden' },
  logoAnim: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginVertical: 32 },
  muted: { color: Colors.muted, fontSize: 14 },
  chartContainer: { marginVertical: 24, height: 160, justifyContent: 'flex-end' },
  chartBadge: { backgroundColor: Colors.accentLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-end' },
  chartBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  chartLine: { height: 3, backgroundColor: Colors.accent, marginVertical: 8, borderRadius: 2 },
  chartXLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabel: { fontSize: 13, color: Colors.muted },
  phonePreview: { width: '80%', backgroundColor: Colors.card, borderRadius: 20, padding: 16, marginVertical: 24, alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  phonePreviewText: { fontSize: 13, color: Colors.accent, fontWeight: '600', marginBottom: 12 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  previewCell: { width: '33%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: Colors.background, marginBottom: 4 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
  socialIcon: { fontSize: 28 },
  trialText: { alignItems: 'center', marginBottom: 40 },
  trialLine: { fontSize: 28, fontWeight: '700', color: Colors.text, textAlign: 'center', lineHeight: 42 },
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: Colors.border },
  planCardSelected: { borderColor: Colors.purple },
  planTextWrap: { flex: 1 },
  planTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  planSub: { fontSize: 14, color: Colors.muted, marginTop: 2 },
  planRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  planRadioSelected: { borderColor: Colors.purple },
  planRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.purple },
  remindRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 12 },
  remindText: { flex: 1, fontSize: 15, color: Colors.text },
  linkText: { color: Colors.accent, fontSize: 15, fontWeight: '500' },
  proofRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16 },
  proofItem: { alignItems: 'center' },
  proofNumber: { fontSize: 20, fontWeight: '700', color: Colors.text },
  proofLabel: { fontSize: 12, color: Colors.muted, marginTop: 4, textAlign: 'center' },
  purple: { color: Colors.purple },
});
