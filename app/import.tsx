import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Image, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';
import { useStore } from '../store';
import { importFromUrl, ImportedRecipe, getIngredientEmoji } from '../lib/importRecipe';
import ReciMeLogo from '../components/ReciMeLogo';
import { Recipe, Ingredient, Step } from '../db/schema';

type ImportStep = 'platform' | 'url' | 'importing' | 'preview';

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', emoji: '📷' },
  { key: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { key: 'pinterest', label: 'Pinterest', emoji: '📌' },
  { key: 'safari', label: 'Safari', emoji: '🧭' },
  { key: 'chrome', label: 'Google Chrome', emoji: '🌐' },
];

export default function ImportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { cookbooks, saveRecipe } = useStore();

  const [step, setStep] = useState<ImportStep>('platform');
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [imported, setImported] = useState<ImportedRecipe | null>(null);
  const [error, setError] = useState('');
  const [selectedCookbook, setSelectedCookbook] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCookbookPicker, setShowCookbookPicker] = useState(false);

  const handleSelectPlatform = (p: string) => {
    setPlatform(p);
    setStep('url');
  };

  const handleImport = async () => {
    if (!url.trim()) return;
    setStep('importing');
    setError('');
    try {
      const result = await importFromUrl(url.trim());
      setImported(result);
      setStep('preview');
    } catch (e: any) {
      setError(e.message ?? 'Import failed. Please try a recipe website URL.');
      setStep('url');
    }
  };

  const handleSave = async () => {
    if (!imported) return;
    setSaving(true);
    const cookbookId = selectedCookbook || cookbooks[0]?.id || 'uncategorized';
    const recipeId = `recipe_${Date.now()}`;

    const recipe: Recipe = {
      id: recipeId,
      cookbookId,
      title: imported.title,
      imageUri: imported.imageUri,
      servings: imported.servings,
      prepTime: imported.prepTime,
      cookTime: imported.cookTime,
      sourceUrl: imported.sourceUrl,
      sourcePlatform: imported.sourcePlatform,
      nutrition: imported.nutrition,
      tags: [],
      createdAt: new Date().toISOString(),
    };

    const ingredients: Ingredient[] = imported.ingredients.map((ing, i) => ({
      id: `ing_${recipeId}_${i}`,
      recipeId,
      section: ing.section,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      emoji: ing.emoji || getIngredientEmoji(ing.name),
      order: i,
    }));

    const steps: Step[] = imported.steps.map((s, i) => ({
      id: `step_${recipeId}_${i}`,
      recipeId,
      order: s.order,
      instruction: s.instruction,
    }));

    await saveRecipe(recipe, ingredients, steps);
    setSaving(false);
    router.replace(`/recipe/${recipeId}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <ReciMeLogo size={20} />
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>

      {step === 'platform' && (
        <View style={styles.content}>
          <Text style={styles.title}>{t('import_title')}</Text>
          <Text style={styles.subtitle}>{t('follow_steps')}</Text>
          {PLATFORMS.map(p => (
            <TouchableOpacity key={p.key} style={styles.platformRow} onPress={() => handleSelectPlatform(p.key)}>
              <Text style={styles.platformEmoji}>{p.emoji}</Text>
              <Text style={styles.platformLabel}>{p.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>or paste URL directly</Text><View style={styles.dividerLine} />
          </View>
          <TextInput
            style={styles.urlInput}
            placeholder="https://..."
            placeholderTextColor={Colors.muted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
            onSubmitEditing={handleImport}
          />
          {url.length > 0 && (
            <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
              <Text style={styles.importBtnText}>Import</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === 'url' && (
        <View style={styles.content}>
          <Text style={styles.title}>Share from {platform}</Text>
          <Text style={styles.subtitle}>Open the recipe in {platform} and share the link here</Text>
          <TextInput
            style={styles.urlInput}
            placeholder="Paste link here..."
            placeholderTextColor={Colors.muted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
            autoFocus
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.importBtn, !url.trim() && { opacity: 0.5 }]}
            onPress={handleImport}
            disabled={!url.trim()}
          >
            <Text style={styles.importBtnText}>Import Recipe</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('platform')} style={styles.backLink}>
            <Text style={styles.backLinkText}>‹ Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'importing' && (
        <View style={styles.importingState}>
          <View style={styles.logoAnim}>
            <Text style={{ fontSize: 60 }}>🍊</Text>
            <Text style={{ fontSize: 50, position: 'absolute', top: -10, right: -10 }}>🍃</Text>
            <Text style={{ fontSize: 40, position: 'absolute', bottom: -5, left: -10 }}>🌸</Text>
            <Text style={{ fontSize: 45, position: 'absolute', bottom: 0, right: -15 }}>🎀</Text>
          </View>
          <Text style={styles.importingText}>{t('importing')}</Text>
        </View>
      )}

      {step === 'preview' && imported && (
        <ScrollView contentContainerStyle={styles.preview}>
          {/* Source banner */}
          <View style={styles.sourceBanner}>
            <Text style={styles.sourceBannerText}>{t('view_on')} {imported.sourcePlatform} ↗</Text>
          </View>

          {/* Image + title */}
          {imported.imageUri ? (
            <Image source={{ uri: imported.imageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : null}
          <Text style={styles.previewTitle}>{imported.title}</Text>

          {/* Edit recipe */}
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>✏ {t('edit_recipe')}</Text>
          </TouchableOpacity>

          {/* Servings row */}
          <View style={styles.servingsRow}>
            <Text style={styles.sectionLabel}>{t('ingredients')}</Text>
            <View style={styles.servingsControl}>
              <TouchableOpacity style={styles.servBtn}><Text style={styles.servBtnText}>−</Text></TouchableOpacity>
              <Text style={styles.servCount}>{imported.servings}</Text>
              <TouchableOpacity style={styles.servBtn}><Text style={styles.servBtnText}>+</Text></TouchableOpacity>
              <Text style={styles.servLabel}>{t('servings')}</Text>
              <TouchableOpacity style={styles.convertBtn}><Text style={styles.convertBtnText}>👑 {t('convert')}</Text></TouchableOpacity>
            </View>
          </View>

          {imported.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.ingredientEmoji}>{ing.emoji}</Text>
              <Text style={styles.ingredientText}>
                <Text style={styles.ingredientAmount}>{ing.amount} {ing.unit} </Text>
                <Text style={styles.ingredientName}>{ing.name}</Text>
              </Text>
            </View>
          ))}

          {imported.steps.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t('instructions')}</Text>
              {imported.steps.slice(0, 3).map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <Text style={styles.stepNum}>{step.order}</Text>
                  <Text style={styles.stepText} numberOfLines={3}>{step.instruction}</Text>
                </View>
              ))}
              {imported.steps.length > 3 && (
                <Text style={styles.moreSteps}>+ {imported.steps.length - 3} more steps</Text>
              )}
            </>
          )}

          {/* Cookbook picker */}
          <TouchableOpacity style={styles.cookbookPicker} onPress={() => setShowCookbookPicker(true)}>
            <Text style={[styles.cookbookPickerText, !selectedCookbook && { color: Colors.muted }]}>
              {selectedCookbook
                ? cookbooks.find(c => c.id === selectedCookbook)?.name
                : t('select_cookbook')}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportLink}>
            <Text style={styles.reportLinkText}>{t('report_mistake')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Cookbook picker modal */}
      <Modal visible={showCookbookPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Cookbook</Text>
            <TouchableOpacity onPress={() => setShowCookbookPicker(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={cookbooks}
            keyExtractor={c => c.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cookbookOption}
                onPress={() => { setSelectedCookbook(item.id); setShowCookbookPicker(false); }}
              >
                <Text style={styles.cookbookOptionEmoji}>{item.emoji || '📖'}</Text>
                <Text style={styles.cookbookOptionName}>{item.name}</Text>
                {selectedCookbook === item.id && <Text style={{ color: Colors.primary }}>✓</Text>}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ color: Colors.muted, textAlign: 'center', marginTop: 40 }}>No cookbooks yet. Create one first.</Text>}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { fontSize: 16, color: Colors.muted, fontWeight: '500' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.muted, marginBottom: 24 },
  platformRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  platformEmoji: { fontSize: 24, width: 40 },
  platformLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.text },
  chevron: { fontSize: 18, color: Colors.muted },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.muted },
  urlInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: Colors.text, marginBottom: 12 },
  importBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  importBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: Colors.red ?? '#EF4444', fontSize: 14, marginBottom: 12 },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { fontSize: 15, color: Colors.muted },
  importingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoAnim: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  importingText: { fontSize: 18, color: Colors.muted, fontWeight: '500' },
  preview: { padding: 20, paddingBottom: 60 },
  sourceBanner: { backgroundColor: '#FFF9E6', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FED7AA' },
  sourceBannerText: { color: Colors.accent, fontSize: 14, fontWeight: '500' },
  previewImage: { width: '100%', height: 200, borderRadius: 14, marginBottom: 16 },
  previewTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  editBtn: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  editBtnText: { fontSize: 13, color: Colors.muted, fontWeight: '500' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.accent, letterSpacing: 0.8, marginBottom: 12 },
  servingsRow: { marginBottom: 12 },
  servingsControl: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  servBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  servBtnText: { fontSize: 16, color: Colors.text },
  servCount: { fontSize: 16, fontWeight: '700', color: Colors.text, minWidth: 24, textAlign: 'center' },
  servLabel: { fontSize: 14, color: Colors.muted, flex: 1 },
  convertBtn: { backgroundColor: Colors.purpleLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  convertBtnText: { color: Colors.purple, fontSize: 13, fontWeight: '600' },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  ingredientEmoji: { fontSize: 20, width: 32 },
  ingredientText: { flex: 1, fontSize: 15, lineHeight: 22 },
  ingredientAmount: { fontWeight: '400', color: Colors.muted },
  ingredientName: { fontWeight: '600', color: Colors.text },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, color: '#fff', textAlign: 'center', lineHeight: 24, fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20, color: Colors.text },
  moreSteps: { color: Colors.muted, fontSize: 13, marginBottom: 12 },
  cookbookPicker: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, paddingVertical: 16, marginVertical: 16 },
  cookbookPickerText: { flex: 1, fontSize: 16, color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  reportLink: { alignItems: 'center' },
  reportLinkText: { color: Colors.muted, fontSize: 13, textDecorationLine: 'underline' },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.muted },
  cookbookOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  cookbookOptionEmoji: { fontSize: 24 },
  cookbookOptionName: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.text },
});
