import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../../constants/colors';
import { useStore } from '../../../store';
import { Step } from '../../../db/schema';
import * as Storage from '../../../db/storage';
import * as Haptics from 'expo-haptics';
import { getStepFallbackImage } from '../../../lib/stepImages';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.38;

// Resolve the image to show for a step
function stepImage(step: Step): string {
  return step.imageUri || getStepFallbackImage(step.instruction);
}

export default function CookMode() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { recipes } = useStore();
  const recipe = recipes.find(r => r.id === id);

  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (id) Storage.getStepsByRecipe(id).then(setSteps);
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

  const imgUri = stepImage(step);

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
              <View style={styles.listThumb}>
                <Image
                  source={{ uri: stepImage(s) }}
                  style={styles.listThumbImg}
                  contentFit="cover"
                />
                <View style={[styles.listNumOverlay, i === currentStep && styles.listNumOverlayActive]}>
                  <Text style={styles.listNumText}>{s.order}</Text>
                </View>
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
              transition={300}
            />
            {/* Step counter pill over image */}
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
    flexDirection: 'row', gap: 14, padding: 12,
    borderRadius: 14, marginBottom: 8, backgroundColor: Colors.background,
    alignItems: 'flex-start',
  },
  listItemActive: { backgroundColor: Colors.primaryLight },
  listThumb: { width: 64, height: 64, borderRadius: 10, overflow: 'hidden', position: 'relative', flexShrink: 0 },
  listThumbImg: { width: '100%', height: '100%' },
  listNumOverlay: {
    position: 'absolute', bottom: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  listNumOverlayActive: { backgroundColor: Colors.primary },
  listNumText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  listText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text, paddingTop: 2 },
  listTextActive: { color: Colors.text, fontWeight: '500' },
});
