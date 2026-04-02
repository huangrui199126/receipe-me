import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../../constants/colors';
import { useStore } from '../../../store';
import { Step } from '../../../db/schema';
import * as Storage from '../../../db/storage';
import * as Haptics from 'expo-haptics';
import { generateStepImages, StepImageResult } from '../../../lib/stepImages';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.36;

export default function CookMode() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { recipes } = useStore();
  const recipe = recipes.find(r => r.id === id);

  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showList, setShowList] = useState(false);
  const [stepImages, setStepImages] = useState<StepImageResult[]>([]);
  const [generatingImages, setGeneratingImages] = useState(false);

  useEffect(() => {
    if (!id) return;
    Storage.getStepsByRecipe(id).then(async (loaded) => {
      setSteps(loaded);
      // Kick off image generation in background (uses cache after first run)
      if (recipe?.imageUri && loaded.length > 0) {
        setGeneratingImages(true);
        const imgs = await generateStepImages(id, recipe.imageUri, loaded);
        setStepImages(imgs);
        setGeneratingImages(false);
      }
    });
  }, [id]);

  const step = steps[currentStep];
  const total = steps.length;

  const goNext = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < total - 1) setCurrentStep(s => s + 1);
    else router.back();
  }, [currentStep, total]);

  const goBack = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  if (!step) return null;

  // Highlight ingredient names in instruction text
  const renderInstruction = (text: string) => {
    const words = text.split(/\b/);
    return words.map((word, i) => {
      if (word.length > 4 && /^[a-zA-Z]+$/.test(word) &&
        !['then', 'with', 'until', 'from', 'into', 'over', 'that', 'this',
          'them', 'their', 'while', 'about', 'after', 'before'].includes(word.toLowerCase())) {
        return <Text key={i} style={styles.highlightedWord}>{word}</Text>;
      }
      return <Text key={i}>{word}</Text>;
    });
  };

  // Priority: AI-generated (or scraped) step image → recipe's main photo
  const generatedImg = stepImages.find(s => s.stepId === step.id)?.imageUri;
  const imgUri = generatedImg || step.imageUri || recipe?.imageUri || '';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowList(v => !v)} style={styles.listBtn}>
          <Text style={styles.listBtnText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.recipeTitle} numberOfLines={1}>{recipe?.title ?? ''}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              { backgroundColor: i <= currentStep ? Colors.primary : Colors.border },
            ]}
          />
        ))}
      </View>

      {showList ? (
        // All steps list view
        <ScrollView contentContainerStyle={styles.listContent}>
          {steps.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.listItem, i === currentStep && styles.listItemActive]}
              onPress={() => { setCurrentStep(i); setShowList(false); }}
            >
              <View style={[styles.listNum, i === currentStep && styles.listNumActive]}>
                <Text style={[styles.listNumText, i === currentStep && { color: '#fff' }]}>{s.order}</Text>
              </View>
              <Text style={[styles.listText, i === currentStep && styles.listTextActive]} numberOfLines={3}>
                {s.instruction}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        // Single step view with image
        <View style={styles.stepView}>
          {/* Step image */}
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: imgUri }}
              style={styles.stepImage}
              contentFit="cover"
              transition={400}
            />
            {/* Generating indicator (shown while AI generates images) */}
            {generatingImages && !generatedImg && (
              <View style={styles.generatingBadge}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.generatingText}>Generating step images…</Text>
              </View>
            )}
            {/* Step counter pill */}
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>
                {t('step_of', { current: currentStep + 1, total })}
              </Text>
            </View>
          </View>

          {/* Instruction text */}
          <ScrollView
            style={styles.instructionScroll}
            contentContainerStyle={styles.instructionContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.instruction}>
              {renderInstruction(step.instruction)}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Navigation */}
      {!showList && (
        <View style={styles.navBar}>
          {currentStep > 0 ? (
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>‹ {t('back')}</Text>
            </TouchableOpacity>
          ) : <View style={{ flex: 1 }} />}
          <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>
              {currentStep < total - 1 ? `${t('next')} ›` : '🎉 Done!'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  listBtn: { padding: 8, width: 40 },
  listBtnText: { fontSize: 20, color: Colors.muted },
  recipeTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: Colors.muted, paddingHorizontal: 8 },
  closeBtn: { padding: 8, width: 40, alignItems: 'flex-end' },
  closeBtnText: { fontSize: 18, color: Colors.muted },

  progressTrack: { flexDirection: 'row', paddingHorizontal: 20, gap: 4, marginBottom: 0 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },

  stepView: { flex: 1 },

  imageWrap: {
    width: width,
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  stepImage: { width: '100%', height: '100%' },
  stepPill: {
    position: 'absolute', bottom: 14, left: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  stepPillText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  generatingBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  generatingText: { color: '#fff', fontSize: 11, fontWeight: '500' },

  instructionScroll: { flex: 1 },
  instructionContent: { padding: 24, paddingBottom: 16 },
  instruction: { fontSize: 20, lineHeight: 34, color: Colors.text, fontWeight: '400' },
  highlightedWord: { color: Colors.accent, fontWeight: '600' },

  navBar: {
    flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8, gap: 12,
  },
  backBtn: {
    flex: 1, height: 54, borderRadius: 14, borderWidth: 1.5,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  nextBtn: {
    flex: 2, height: 54, borderRadius: 14, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  nextBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // List view
  listContent: { padding: 16, paddingBottom: 40 },
  listItem: {
    flexDirection: 'row', gap: 14, padding: 14,
    borderRadius: 14, marginBottom: 8, backgroundColor: Colors.background,
    alignItems: 'flex-start',
  },
  listItemActive: { backgroundColor: Colors.primaryLight },
  listNum: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  listNumActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  listNumText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  listText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text, paddingTop: 6 },
  listTextActive: { color: Colors.text, fontWeight: '500' },
});
