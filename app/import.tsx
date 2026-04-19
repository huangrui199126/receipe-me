import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Image, Modal, FlatList,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useStore } from '../store';
import { importFromUrl, parseRecipeText, ImportedRecipe, getIngredientEmoji } from '../lib/importRecipe';
import { Recipe, Ingredient, Step } from '../db/schema';
import * as ImagePicker from 'expo-image-picker';

type ImportStep = 'method' | 'url' | 'paste' | 'camera' | 'importing' | 'preview';

export default function ImportScreen() {
  const router = useRouter();
  const { cookbooks, saveRecipe, canImportUrl, consumeImport } = useStore();

  const [step, setStep] = useState<ImportStep>('method');
  const [url, setUrl] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [cameraImage, setCameraImage] = useState<string | null>(null);
  const [imported, setImported] = useState<ImportedRecipe | null>(null);
  const [error, setError] = useState('');
  const [selectedCookbook, setSelectedCookbook] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCookbookPicker, setShowCookbookPicker] = useState(false);

  // ── Method handlers ─────────────────────────────────────────────────────────
  const handleBrowser = () => { setError(''); setStep('url'); };
  const handlePaste = () => { setError(''); setStep('paste'); };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      // Try photo library instead
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (lib.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera or photo library access to import from a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!result.canceled && result.assets[0]) { setCameraImage(result.assets[0].uri); setStep('camera'); }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) { setCameraImage(result.assets[0].uri); setStep('camera'); }
  };

  // ── URL import ───────────────────────────────────────────────────────────────
  const handleUrlImport = async () => {
    if (!url.trim()) return;
    if (!canImportUrl()) {
      router.push('/paywall');
      return;
    }
    setStep('importing');
    setError('');
    try {
      const result = await importFromUrl(url.trim());
      await consumeImport();
      setImported(result);
      setStep('preview');
    } catch (e: any) {
      setError(e.message ?? 'Could not import from this URL. Try a recipe website link instead.');
      setStep('url');
    }
  };

  // ── Text paste parse ─────────────────────────────────────────────────────────
  const handleParseText = (text: string) => {
    if (!text.trim()) return;
    try {
      const result = parseRecipeText(text.trim());
      setImported(result);
      setStep('preview');
    } catch (e: any) {
      setError(e.message ?? 'Could not parse this text.');
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!imported) return;
    setSaving(true);
    const cookbookId = selectedCookbook || cookbooks[0]?.id || 'uncategorized';
    const recipeId = `recipe_${Date.now()}`;

    const recipe: Recipe = {
      id: recipeId, cookbookId,
      title: imported.title, imageUri: imported.imageUri,
      servings: imported.servings, prepTime: imported.prepTime, cookTime: imported.cookTime,
      sourceUrl: imported.sourceUrl || null, sourcePlatform: imported.sourcePlatform,
      nutrition: imported.nutrition, tags: [], createdAt: new Date().toISOString(),
    };
    const ingredients: Ingredient[] = imported.ingredients.map((ing, i) => ({
      id: `ing_${recipeId}_${i}`, recipeId, section: ing.section,
      name: ing.name, amount: ing.amount, unit: ing.unit,
      emoji: ing.emoji || getIngredientEmoji(ing.name), order: i,
    }));
    const steps: Step[] = imported.steps.map((s, i) => ({
      id: `step_${recipeId}_${i}`, recipeId,
      order: s.order, instruction: s.instruction,
    }));

    await saveRecipe(recipe, ingredients, steps);
    setSaving(false);
    router.replace(`/recipe/${recipeId}`);
  };

  const reset = () => {
    setStep('method'); setUrl(''); setPasteText(''); setCameraImage(null);
    setImported(null); setError(''); setSelectedCookbook('');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 'method' ? router.back() : reset())}>
          <Text style={styles.cancel}>{step === 'method' ? 'Cancel' : '‹ Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import recipe</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Method picker ── */}
      {step === 'method' && (
        <View style={styles.content}>
          <View style={styles.methodGrid}>
            <MethodBtn icon="🌐" label="Browser" onPress={handleBrowser} />
            <MethodBtn icon="📷" label="Camera" onPress={handleCamera} />
            <MethodBtn icon="📋" label="Paste Text" onPress={handlePaste} />
          </View>
          <View style={styles.orRow}>
            <View style={styles.orLine} /><Text style={styles.orText}>or</Text><View style={styles.orLine} />
          </View>
          <TouchableOpacity style={styles.scratchBtn} onPress={() => router.push('/recipe/new/edit')}>
            <Text style={styles.scratchIcon}>✏</Text>
            <Text style={styles.scratchLabel}>Write from scratch</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Browser / URL ── */}
      {step === 'url' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Paste a recipe link</Text>
            <Text style={styles.stepSub}>Works with AllRecipes, Food Network, NYT Cooking, and most recipe websites. Pinterest links may redirect to the original site.</Text>
            <View style={styles.socialHint}>
              <Text style={styles.hintTitle}>Instagram / TikTok tip</Text>
              <Text style={styles.hintBody}>These apps don't share recipe data publicly. Instead, copy the recipe text from the caption and use <Text style={{ color: Colors.primary }} onPress={() => { setStep('paste'); }}>Paste Text</Text> instead.</Text>
            </View>
            <TextInput
              style={styles.urlInput}
              placeholder="https://..."
              placeholderTextColor={Colors.muted}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoFocus
              onSubmitEditing={handleUrlImport}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={[styles.importBtn, !url.trim() && { opacity: 0.5 }]} onPress={handleUrlImport} disabled={!url.trim()}>
              <Text style={styles.importBtnText}>Import Recipe</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Paste Text ── */}
      {step === 'paste' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Paste recipe text</Text>
            <Text style={styles.stepSub}>Copy the recipe from Instagram/TikTok captions, websites, or type it out. The app will automatically detect ingredients and steps.</Text>
            <TextInput
              style={styles.pasteInput}
              placeholder={'e.g.\n\nChocolate Chip Cookies\n\nIngredients:\n2 cups flour\n1 cup butter\n1 cup sugar\n2 eggs\n\nInstructions:\n1. Preheat oven to 375°F\n2. Mix butter and sugar...'}
              placeholderTextColor={Colors.muted}
              value={pasteText}
              onChangeText={setPasteText}
              multiline
              autoFocus
              textAlignVertical="top"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={[styles.importBtn, !pasteText.trim() && { opacity: 0.5 }]} onPress={() => handleParseText(pasteText)} disabled={!pasteText.trim()}>
              <Text style={styles.importBtnText}>Parse Recipe</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Camera ── */}
      {step === 'camera' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {cameraImage && <Image source={{ uri: cameraImage }} style={styles.capturedImage} resizeMode="contain" />}
            <Text style={styles.stepTitle}>Recipe text</Text>
            <Text style={styles.stepSub}>
              Tap and hold text in the photo above to copy it (iOS Live Text), then paste below. Or type the recipe manually.
            </Text>
            <TextInput
              style={styles.pasteInput}
              placeholder="Paste or type the recipe text from the photo…"
              placeholderTextColor={Colors.muted}
              value={pasteText}
              onChangeText={setPasteText}
              multiline
              textAlignVertical="top"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={[styles.importBtn, !pasteText.trim() && { opacity: 0.5 }]} onPress={() => handleParseText(pasteText)} disabled={!pasteText.trim()}>
              <Text style={styles.importBtnText}>Parse Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleCamera}>
              <Text style={styles.retakeBtnText}>📷 Retake photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── Importing spinner ── */}
      {step === 'importing' && (
        <View style={styles.importingState}>
          <Text style={{ fontSize: 64 }}>🍊</Text>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 16 }} />
          <Text style={styles.importingText}>Importing recipe…</Text>
        </View>
      )}

      {/* ── Preview ── */}
      {step === 'preview' && imported && (
        <ScrollView contentContainerStyle={styles.preview}>
          {imported.imageUri ? (
            <Image source={{ uri: imported.imageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : null}
          <Text style={styles.previewTitle}>{imported.title}</Text>

          {imported.ingredients.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>INGREDIENTS</Text>
              {imported.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text style={styles.ingredientEmoji}>{ing.emoji}</Text>
                  <Text style={styles.ingredientText}>
                    <Text style={styles.ingredientAmount}>{ing.amount} {ing.unit} </Text>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                  </Text>
                </View>
              ))}
            </>
          )}

          {imported.steps.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>INSTRUCTIONS</Text>
              {imported.steps.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNumCircle}><Text style={styles.stepNumText}>{s.order}</Text></View>
                  <Text style={styles.stepText} numberOfLines={3}>{s.instruction}</Text>
                </View>
              ))}
              {imported.steps.length > 3 && <Text style={styles.moreSteps}>+ {imported.steps.length - 3} more steps</Text>}
            </>
          )}

          {imported.ingredients.length === 0 && imported.steps.length === 0 && (
            <View style={styles.noDataBox}>
              <Text style={styles.noDataTitle}>Couldn't detect structure</Text>
              <Text style={styles.noDataBody}>The recipe was saved with your text as notes. You can edit it after saving to add ingredients and steps.</Text>
            </View>
          )}

          {/* Cookbook picker */}
          <TouchableOpacity style={styles.cookbookPicker} onPress={() => setShowCookbookPicker(true)}>
            <Text style={styles.cookbookPickerLabel}>Save to</Text>
            <Text style={styles.cookbookPickerValue}>
              {selectedCookbook ? cookbooks.find(c => c.id === selectedCookbook)?.name : cookbooks[0]?.name ?? 'Favorites'}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Recipe</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.reportLink} onPress={reset}>
            <Text style={styles.reportLinkText}>Start over</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Cookbook picker modal */}
      <Modal visible={showCookbookPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Cookbook</Text>
            <TouchableOpacity onPress={() => setShowCookbookPicker(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <FlatList
            data={cookbooks}
            keyExtractor={c => c.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cookbookOption} onPress={() => { setSelectedCookbook(item.id); setShowCookbookPicker(false); }}>
                <Text style={styles.cookbookOptionEmoji}>{item.emoji || '📖'}</Text>
                <Text style={styles.cookbookOptionName}>{item.name}</Text>
                {selectedCookbook === item.id && <Text style={{ color: Colors.primary }}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function MethodBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.methodBtn} onPress={onPress}>
      <View style={styles.methodIconWrap}><Text style={styles.methodIcon}>{icon}</Text></View>
      <Text style={styles.methodLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: '#fff' },
  cancel: { fontSize: 16, color: Colors.muted, fontWeight: '500', width: 60 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },

  content: { flex: 1, padding: 24 },

  methodGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
  methodBtn: { flex: 1, alignItems: 'center', gap: 8 },
  methodIconWrap: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#FEF3E8', borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  methodIcon: { fontSize: 32 },
  methodLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { fontSize: 14, color: Colors.muted },

  scratchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  scratchIcon: { fontSize: 18 },
  scratchLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },

  stepTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  stepSub: { fontSize: 14, color: Colors.muted, lineHeight: 20, marginBottom: 16 },

  socialHint: { backgroundColor: '#FEF3E8', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FDDCB5' },
  hintTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  hintBody: { fontSize: 13, color: Colors.text, lineHeight: 18 },

  urlInput: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.text, marginBottom: 12 },
  pasteInput: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.text, height: 240, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  capturedImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  retakeBtn: { marginTop: 12, alignItems: 'center' },
  retakeBtnText: { fontSize: 15, color: Colors.muted },

  importBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  importBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 12 },

  importingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  importingText: { fontSize: 18, color: Colors.text, fontWeight: '600', marginTop: 12 },

  preview: { padding: 20, paddingBottom: 60 },
  previewImage: { width: '100%', height: 220, borderRadius: 14, marginBottom: 16 },
  previewTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.accent, letterSpacing: 0.8, marginBottom: 10 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  ingredientEmoji: { fontSize: 20, width: 32 },
  ingredientText: { flex: 1, fontSize: 15 },
  ingredientAmount: { color: Colors.muted },
  ingredientName: { fontWeight: '600', color: Colors.text },
  stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  stepNumCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  moreSteps: { fontSize: 14, color: Colors.muted, marginTop: 8 },

  noDataBox: { backgroundColor: '#FEF3E8', borderRadius: 12, padding: 16, marginVertical: 16 },
  noDataTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  noDataBody: { fontSize: 14, color: Colors.text, lineHeight: 20 },

  cookbookPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginVertical: 16, borderWidth: 1, borderColor: Colors.border },
  cookbookPickerLabel: { fontSize: 15, color: Colors.muted, marginRight: 8 },
  cookbookPickerValue: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  chevron: { fontSize: 20, color: Colors.muted },

  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  reportLink: { alignItems: 'center', paddingVertical: 16 },
  reportLinkText: { fontSize: 14, color: Colors.muted },

  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalClose: { fontSize: 18, color: Colors.muted, padding: 4 },
  cookbookOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cookbookOptionEmoji: { fontSize: 22, width: 36 },
  cookbookOptionName: { flex: 1, fontSize: 16, color: Colors.text },
});
