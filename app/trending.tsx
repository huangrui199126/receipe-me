import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Dimensions, RefreshControl, Modal,
  ScrollView, KeyboardAvoidingView, Platform, TextInput, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { TrendingRecipe } from '../lib/trendingRecipes';
import { fetchTrendingRecipes, refreshTrendingRecipes } from '../lib/trendingApi';
import { useStore } from '../store';
import { Cookbook, Recipe, Ingredient, Step } from '../db/schema';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

function HealthBadge({ score }: { score: number }) {
  const color = score >= 8 ? '#16A34A' : score >= 5 ? '#F59E0B' : '#EF4444';
  const label = score >= 8 ? 'Healthy' : score >= 5 ? 'Balanced' : 'Indulgent';
  return (
    <View style={[styles.healthBadge, { backgroundColor: color }]}>
      <Text style={styles.healthText}>{label} {score}/10</Text>
    </View>
  );
}

// ── Cookbook picker sheet ─────────────────────────────────────────────────────
function CookbookPickerSheet({
  visible, cookbooks, onSelect, onNewCookbook, onClose,
}: {
  visible: boolean;
  cookbooks: Cookbook[];
  onSelect: (id: string, name: string) => void;
  onNewCookbook: (name: string) => void;
  onClose: () => void;
}) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [name, setName] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.pickerTitle}>Save to cookbook</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {cookbooks.map(cb => (
              <TouchableOpacity
                key={cb.id}
                style={styles.cbRow}
                onPress={() => { onSelect(cb.id, cb.name); setCreatingNew(false); setName(''); }}
              >
                <Text style={styles.cbEmoji}>{cb.emoji ?? '📖'}</Text>
                <Text style={styles.cbName}>{cb.name}</Text>
                <Text style={styles.cbArrow}>›</Text>
              </TouchableOpacity>
            ))}
            {!creatingNew ? (
              <TouchableOpacity style={[styles.cbRow, { borderBottomWidth: 0 }]} onPress={() => setCreatingNew(true)}>
                <Text style={styles.cbEmoji}>＋</Text>
                <Text style={[styles.cbName, { color: Colors.primary }]}>New cookbook</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.newCbWrap}>
                <TextInput
                  style={styles.newCbInput}
                  placeholder="Cookbook name…"
                  placeholderTextColor={Colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => { if (name.trim()) { onNewCookbook(name.trim()); setName(''); setCreatingNew(false); } }}
                />
                <TouchableOpacity
                  style={[styles.newCbSave, !name.trim() && { opacity: 0.4 }]}
                  onPress={() => { if (name.trim()) { onNewCookbook(name.trim()); setName(''); setCreatingNew(false); } }}
                  disabled={!name.trim()}
                >
                  <Text style={styles.newCbSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Success overlay ──────────────────────────────────────────────────────────
function SavedSheet({ onOpenRecipe, onDone }: { onOpenRecipe: () => void; onDone: () => void }) {
  return (
    <View style={styles.savedSheet}>
      <View style={styles.savedCard}>
        <View style={styles.savedIconWrap}>
          <Text style={styles.savedIconEmoji}>👨‍🍳</Text>
          <View style={styles.savedCheckCircle}>
            <Text style={styles.savedCheckMark}>✓</Text>
          </View>
        </View>
        <Text style={styles.savedTitle}>Recipe saved!</Text>
        <TouchableOpacity style={styles.openBtn} onPress={onOpenRecipe}>
          <Text style={styles.openBtnText}>↗  Open recipe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function TrendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cookbooks, recipes: savedRecipes, saveRecipe, addCookbook, userProfile } = useStore();
  const [importing, setImporting] = useState<string | null>(null);
  // Derive which trending IDs are already saved from the store (persists across navigations)
  const saved = new Set(
    savedRecipes
      .map(r => r.id.match(/^recipe_(tr_\d+)_/)?.[1])
      .filter((id): id is string => !!id)
  );
  const [recipes, setRecipes] = useState<TrendingRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Preview modal state
  const [previewItem, setPreviewItem] = useState<TrendingRecipe | null>(null);
  const [selectedCookbook, setSelectedCookbook] = useState<{ id: string; name: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null); // set after save → triggers success

  useEffect(() => {
    fetchTrendingRecipes().then(r => { setRecipes(r); setLoading(false); });
  }, []);

  // Default cookbook = first one, or "Favorites" if none
  const defaultCookbook = cookbooks[0]
    ? { id: cookbooks[0].id, name: cookbooks[0].name }
    : { id: 'favorites', name: 'Favorites' };

  const openPreview = (item: TrendingRecipe) => {
    setSavedRecipeId(null);
    setSelectedCookbook(null);
    setPreviewItem(item);
  };

  const closePreview = () => {
    setPreviewItem(null);
    setSavedRecipeId(null);
    setSelectedCookbook(null);
    setShowPicker(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const r = await refreshTrendingRecipes();
    setRecipes(r);
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!previewItem || importing) return;
    setImporting(previewItem.id);

    // Save to first existing cookbook, or create "Favorites" if none exist
    let cookbookId = cookbooks[0]?.id ?? 'favorites';
    if (!cookbooks.find(c => c.id === cookbookId)) {
      const fav: Cookbook = {
        id: `cb_${Date.now()}`,
        name: 'Favorites',
        emoji: '❤️',
        coverImages: [],
        createdAt: new Date().toISOString(),
      };
      await addCookbook(fav);
      cookbookId = fav.id;
    }

    const recipeId = `recipe_${previewItem.id}_${Date.now()}`;
    const recipe: Recipe = {
      id: recipeId, cookbookId,
      title: previewItem.title, imageUri: previewItem.image,
      servings: previewItem.servings, prepTime: previewItem.prepTime, cookTime: previewItem.cookTime,
      sourceUrl: null, sourcePlatform: previewItem.sourcePlatform,
      nutrition: previewItem.nutrition, tags: previewItem.tags,
      createdAt: new Date().toISOString(),
    };
    const ingredients: Ingredient[] = previewItem.ingredients.map((ing, i) => ({
      id: `ing_${recipeId}_${i}`, recipeId, section: ing.section,
      name: ing.name, amount: ing.amount, unit: ing.unit, emoji: ing.emoji, order: i,
    }));
    const steps: Step[] = previewItem.steps.map(s => ({
      id: `step_${recipeId}_${s.order}`, recipeId,
      order: s.order, instruction: s.instruction, imageUri: s.imageUri,
    }));

    await saveRecipe(recipe, ingredients, steps);
    setSavedRecipeId(recipeId);
    setImporting(null);
  };

  const handleSelectCookbook = (id: string, name: string) => {
    setSelectedCookbook({ id, name });
    setShowPicker(false);
  };

  const handleNewCookbook = async (name: string) => {
    const newCb: Cookbook = {
      id: `cb_${Date.now()}`, name, emoji: '📖', coverImages: [],
      createdAt: new Date().toISOString(),
    };
    await addCookbook(newCb);
    setSelectedCookbook({ id: newCb.id, name });
    setShowPicker(false);
  };

  // User goals ranking
  const goals = userProfile?.goals ?? [];
  const ranked = [...recipes].sort((a, b) => {
    let sA = 0, sB = 0;
    if (goals.includes('healthy')) { sA += a.healthScore; sB += b.healthScore; }
    if (goals.includes('high-protein')) { sA += a.nutrition.protein / 10; sB += b.nutrition.protein / 10; }
    if (goals.includes('low-calorie')) { sA += (600 - a.nutrition.calories) / 100; sB += (600 - b.nutrition.calories) / 100; }
    if (sA !== sB) return sB - sA;
    // Stable fallback: sort by numeric ID (tr_1 < tr_2 < ...)
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const displayCookbook = selectedCookbook ?? (cookbooks[0] ? { id: cookbooks[0].id, name: cookbooks[0].name } : { id: '', name: 'Favorites' });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.fireIcon}>🔥</Text>
          <Text style={styles.title}>Trending recipes</Text>
        </View>
        <Text style={styles.count}>{recipes.length} recipes</Text>
      </View>

      {goals.length > 0 && (
        <View style={styles.goalBanner}>
          <Text style={styles.goalText}>Sorted for your goals: {goals.join(', ')}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => {
            const isSaved = saved.has(item.id);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => openPreview(item)}
                activeOpacity={0.85}
              >
                <View style={styles.imageWrap}>
                  <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>↑ {item.importCount} saves</Text>
                  </View>
                  {isSaved && (
                    <View style={styles.savedOverlay}>
                      <Text style={styles.savedCheck}>✓ Saved</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.source}>{item.sourcePlatform}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.nutritionRow}>
                  <Text style={styles.cal}>{item.nutrition.calories} cal</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.pro}>{item.nutrition.protein}g protein</Text>
                </View>
                <HealthBadge score={item.healthScore} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Full recipe preview modal */}
      <Modal
        visible={!!previewItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePreview}
      >
        {previewItem && (
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Modal header */}
            <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
              <Text style={styles.modalLogo}>ReciMe</Text>
              <TouchableOpacity onPress={closePreview}>
                <Text style={styles.cancelBtn}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Source banner */}
            <View style={styles.sourceBanner}>
              <Text style={styles.sourceBannerText}>
                From {previewItem.sourcePlatform}  ↗
              </Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
              {/* Recipe hero row */}
              <View style={styles.heroRow}>
                <Image source={{ uri: previewItem.image }} style={styles.heroImg} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>{previewItem.title.toUpperCase()}</Text>
                  <View style={styles.heroMeta}>
                    <Text style={styles.heroMetaText}>⏱ {previewItem.prepTime + previewItem.cookTime} min</Text>
                    <Text style={styles.heroMetaText}>🍽 {previewItem.servings} servings</Text>
                  </View>
                  <HealthBadge score={previewItem.healthScore} />
                </View>
              </View>

              <View style={styles.divider} />

              {/* Nutrition row */}
              <View style={styles.nutritionBand}>
                {[
                  { label: 'Calories', value: `${previewItem.nutrition.calories}` },
                  { label: 'Protein', value: `${previewItem.nutrition.protein}g` },
                  { label: 'Carbs', value: `${previewItem.nutrition.carbs}g` },
                  { label: 'Fat', value: `${previewItem.nutrition.fat}g` },
                ].map(n => (
                  <View key={n.label} style={styles.nutritionCell}>
                    <Text style={styles.nutritionVal}>{n.value}</Text>
                    <Text style={styles.nutritionLbl}>{n.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Ingredients */}
              <Text style={styles.sectionLabel}>INGREDIENTS</Text>
              {previewItem.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingRow}>
                  <Text style={styles.ingEmoji}>{ing.emoji}</Text>
                  <Text style={styles.ingAmount}>{ing.amount} {ing.unit}</Text>
                  <Text style={styles.ingName}>{ing.name}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Steps */}
              <Text style={styles.sectionLabel}>STEPS</Text>
              {previewItem.steps.map((s, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{s.order}</Text>
                  </View>
                  <Text style={styles.stepText}>{s.instruction}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Bottom save bar */}
            <View style={[styles.saveBar, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity
                style={[styles.saveBtn, importing === previewItem.id && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={importing !== null}
              >
                {importing === previewItem.id
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Save recipe</Text>}
              </TouchableOpacity>
            </View>

            {/* Success overlay */}
            {savedRecipeId && (
              <SavedSheet
                onOpenRecipe={() => {
                  closePreview();
                  router.push(`/recipe/${savedRecipeId}`);
                }}
                onDone={closePreview}
              />
            )}
          </View>
        )}
      </Modal>

      {/* Cookbook picker sheet (shown on top of preview modal) */}
      <CookbookPickerSheet
        visible={showPicker}
        cookbooks={cookbooks}
        onSelect={handleSelectCookbook}
        onNewCookbook={handleNewCookbook}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Grid
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 28, color: Colors.text, fontWeight: '300' },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4 },
  fireIcon: { fontSize: 20 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  count: { fontSize: 13, color: Colors.muted },
  goalBanner: { backgroundColor: Colors.primaryLight ?? '#FFF7ED', paddingHorizontal: 16, paddingVertical: 8 },
  goalText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  row: { gap: 12, marginBottom: 16 },
  card: { width: CARD_WIDTH },
  imageWrap: { width: CARD_WIDTH, height: CARD_WIDTH * 0.85, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.border },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  savedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22,163,74,0.7)', justifyContent: 'center', alignItems: 'center' },
  savedCheck: { color: '#fff', fontSize: 16, fontWeight: '700' },
  source: { fontSize: 11, color: Colors.muted, marginTop: 6, marginLeft: 2 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 2, marginLeft: 2, lineHeight: 18 },
  nutritionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 2, gap: 4 },
  cal: { fontSize: 11, color: Colors.muted },
  dot: { fontSize: 11, color: Colors.muted },
  pro: { fontSize: 11, color: Colors.accent },
  healthBadge: { alignSelf: 'flex-start', marginTop: 4, marginLeft: 2, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  healthText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  // Preview modal
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalLogo: { fontSize: 20, fontWeight: '800', color: Colors.primary, fontStyle: 'italic' },
  cancelBtn: { fontSize: 16, color: Colors.text },
  sourceBanner: { backgroundColor: '#FEFCE8', paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center' },
  sourceBannerText: { fontSize: 13, color: '#92400E', fontWeight: '500' },
  heroRow: { flexDirection: 'row', padding: 20, gap: 14, alignItems: 'flex-start' },
  heroImg: { width: 100, height: 100, borderRadius: 12 },
  heroTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, lineHeight: 22, flex: 1 },
  heroMeta: { flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 6 },
  heroMetaText: { fontSize: 12, color: Colors.muted },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 20, marginVertical: 4 },
  nutritionBand: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 20 },
  nutritionCell: { flex: 1, alignItems: 'center' },
  nutritionVal: { fontSize: 16, fontWeight: '700', color: Colors.text },
  nutritionLbl: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.accent, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, letterSpacing: 0.8 },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, gap: 10 },
  ingEmoji: { fontSize: 20, width: 28 },
  ingAmount: { fontSize: 14, fontWeight: '700', color: Colors.text, minWidth: 60 },
  ingName: { flex: 1, fontSize: 14, color: Colors.text },
  stepRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 14, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text },

  // Save bar
  saveBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  cbSelector: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  cbSelectorPlain: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  cbSelectorEmoji: { fontSize: 16 },
  cbSelectorName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  cbSelectorArrow: { fontSize: 18, color: Colors.muted },
  saveBtn: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Success sheet
  savedSheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  savedCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 32, paddingTop: 32, paddingBottom: 48,
    alignItems: 'center',
  },
  savedIconWrap: { position: 'relative', marginBottom: 16 },
  savedIconEmoji: { fontSize: 72 },
  savedCheckCircle: {
    position: 'absolute', bottom: 0, right: -4,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  savedCheckMark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  savedTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 24 },
  openBtn: {
    width: '100%', height: 52, borderRadius: 14,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  openBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBtn: { paddingVertical: 8 },
  doneBtnText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },

  // Cookbook picker
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 48, maxHeight: 480,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 4 },
  cbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  cbEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  cbName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  cbArrow: { fontSize: 20, color: Colors.muted },
  newCbWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  newCbInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary, paddingHorizontal: 14, fontSize: 15, color: Colors.text },
  newCbSave: { height: 44, paddingHorizontal: 18, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center' },
  newCbSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
