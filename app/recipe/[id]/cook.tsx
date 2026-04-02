import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../../constants/colors';
import { useStore } from '../../../store';
import { Step } from '../../../db/schema';
import * as Storage from '../../../db/storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

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

  const goNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < total - 1) setCurrentStep(s => s + 1);
    else router.back();
  };

  const goBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  if (!step) return null;

  // Highlight ingredient names (simple: any word over 4 chars that's capitalized)
  const renderInstruction = (text: string) => {
    const words = text.split(/\b/);
    return words.map((word, i) => {
      const isIngredient = /^[A-Z][a-z]{3,}$/.test(word) || /^[a-z]{4,}$/.test(word);
      if (isIngredient && word.length > 4) {
        return <Text key={i} style={styles.highlightedWord}>{word}</Text>;
      }
      return <Text key={i}>{word}</Text>;
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowList(v => !v)} style={styles.listBtn}>
          <Text style={styles.listBtnText}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[styles.progressSegment, { backgroundColor: i <= currentStep ? Colors.primary : Colors.border }]}
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
              <Text style={styles.listText}>{s.instruction}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        // Step view
        <View style={styles.stepView}>
          <Text style={styles.stepCounter}>{t('step_of', { current: currentStep + 1, total })}</Text>
          <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.instruction}>
              {renderInstruction(step.instruction)}
            </Text>
          </ScrollView>
        </View>
      )}

      {/* Navigation */}
      {!showList && (
        <View style={styles.navBar}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>{t('back')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>
              {currentStep < total - 1 ? t('next') : '🎉 Done'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  listBtn: { padding: 8 },
  listBtnText: { fontSize: 20, color: Colors.muted },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 18, color: Colors.muted },
  progressTrack: { flexDirection: 'row', paddingHorizontal: 20, gap: 4, marginBottom: 32 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  stepView: { flex: 1, paddingHorizontal: 24 },
  stepCounter: { fontSize: 17, fontWeight: '600', color: Colors.text, marginBottom: 24 },
  stepContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  instruction: { fontSize: 22, lineHeight: 36, color: Colors.text, fontWeight: '400' },
  highlightedWord: { color: Colors.accent, fontWeight: '600' },
  navBar: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  backBtn: { flex: 1, height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 17, fontWeight: '600', color: Colors.text },
  nextBtn: { flex: 2, height: 54, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  listContent: { padding: 20 },
  listItem: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: Colors.background },
  listItemActive: { backgroundColor: Colors.primaryLight },
  listNum: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  listNumActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  listNumText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  listText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text },
});
