import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Dimensions, RefreshControl, Modal,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function TrendingScreen() {
  const router = useRouter();
  const { cookbooks, saveRecipe, addCookbook, userProfile } = useStore();
  const [importing, setImporting] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [recipes, setRecipes] = useState<TrendingRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cookbook picker state
  const [pendingItem, setPendingItem] = useState<TrendingRecipe | null>(null);
  const [newCookbookName, setNewCookbookName] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    fetchTrendingRecipes().then(r => { setRecipes(r); setLoading(false); });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const r = await refreshTrendingRecipes();
    setRecipes(r);
    setRefreshing(false);
  };

  // Filter by user goals if available
  const goals = userProfile?.goals ?? [];
  const ranked = [...recipes].sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    if (goals.includes('healthy')) { scoreA += a.healthScore; scoreB += b.healthScore; }
    if (goals.includes('high-protein')) { scoreA += a.nutrition.protein / 10; scoreB += b.nutrition.protein / 10; }
    if (goals.includes('low-calorie')) { scoreA += (600 - a.nutrition.calories) / 100; scoreB += (600 - b.nutrition.calories) / 100; }
    return scoreB - scoreA;
  });

  const doSave = async (item: TrendingRecipe, cookbookId: string) => {
    setImporting(item.id);
    setPendingItem(null);
    setNewCookbookName('');
    setCreatingNew(false);

    const recipeId = `recipe_${item.id}_${Date.now()}`;

    const recipe: Recipe = {
      id: recipeId,
      cookbookId,
      title: item.title,
      imageUri: item.image,
      servings: item.servings,
      prepTime: item.prepTime,
      cookTime: item.cookTime,
      sourceUrl: null,
      sourcePlatform: item.sourcePlatform,
      nutrition: item.nutrition,
      tags: item.tags,
      createdAt: new Date().toISOString(),
    };

    const ingredients: Ingredient[] = item.ingredients.map((ing, i) => ({
      id: `ing_${recipeId}_${i}`,
      recipeId,
      section: ing.section,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      emoji: ing.emoji,
      order: i,
    }));

    const steps: Step[] = item.steps.map((s) => ({
      id: `step_${recipeId}_${s.order}`,
      recipeId,
      order: s.order,
      instruction: s.instruction,
      imageUri: s.imageUri,
    }));

    await saveRecipe(recipe, ingredients, steps);
    setSaved(prev => new Set([...prev, item.id]));
    setImporting(null);
    router.push(`/recipe/${recipeId}`);
  };

  const handleSaveToExisting = (cookbookId: string) => {
    if (pendingItem) doSave(pendingItem, cookbookId);
  };

  const handleSaveToNew = async () => {
    if (!pendingItem || !newCookbookName.trim()) return;
    const newCookbook: Cookbook = {
      id: `cb_${Date.now()}`,
      name: newCookbookName.trim(),
      emoji: '📖',
      coverImages: [],
      createdAt: new Date().toISOString(),
    };
    await addCookbook(newCookbook);
    doSave(pendingItem, newCookbook.id);
  };

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

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      <FlatList
        data={ranked}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => {
          const isSaving = importing === item.id;
          const isSaved = saved.has(item.id);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => !isSaved && setPendingItem(item)}
              disabled={importing !== null || isSaved}
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
                {isSaving && (
                  <View style={styles.importingOverlay}>
                    <ActivityIndicator color="#fff" />
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

      {/* Cookbook picker bottom sheet */}
      <Modal
        visible={!!pendingItem}
        transparent
        animationType="slide"
        onRequestClose={() => { setPendingItem(null); setCreatingNew(false); setNewCookbookName(''); }}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => { setPendingItem(null); setCreatingNew(false); setNewCookbookName(''); }}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            {/* Recipe preview */}
            <View style={styles.previewRow}>
              {pendingItem && (
                <Image source={{ uri: pendingItem.image }} style={styles.previewImg} contentFit="cover" />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle} numberOfLines={2}>{pendingItem?.title}</Text>
                <Text style={styles.previewSub}>Save to cookbook</Text>
              </View>
            </View>

            <ScrollView style={styles.cbList} showsVerticalScrollIndicator={false}>
              {cookbooks.map(cb => (
                <TouchableOpacity
                  key={cb.id}
                  style={styles.cbRow}
                  onPress={() => handleSaveToExisting(cb.id)}
                >
                  <Text style={styles.cbEmoji}>{cb.emoji ?? '📖'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cbName}>{cb.name}</Text>
                    <Text style={styles.cbCount}>
                      {cb.coverImages?.length ?? 0} recipe{(cb.coverImages?.length ?? 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.cbArrow}>›</Text>
                </TouchableOpacity>
              ))}

              {/* New cookbook row */}
              {!creatingNew ? (
                <TouchableOpacity style={[styles.cbRow, styles.cbRowNew]} onPress={() => setCreatingNew(true)}>
                  <Text style={styles.cbEmoji}>＋</Text>
                  <Text style={[styles.cbName, { color: Colors.primary }]}>New cookbook</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.newCbWrap}>
                  <TextInput
                    style={styles.newCbInput}
                    placeholder="Cookbook name…"
                    placeholderTextColor={Colors.muted}
                    value={newCookbookName}
                    onChangeText={setNewCookbookName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveToNew}
                  />
                  <TouchableOpacity
                    style={[styles.newCbSave, !newCookbookName.trim() && { opacity: 0.4 }]}
                    onPress={handleSaveToNew}
                    disabled={!newCookbookName.trim()}
                  >
                    <Text style={styles.newCbSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  goalBanner: {
    backgroundColor: Colors.primaryLight ?? '#FFF7ED',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  goalText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  row: { gap: 12, marginBottom: 16 },
  card: { width: CARD_WIDTH },
  imageWrap: {
    width: CARD_WIDTH, height: CARD_WIDTH * 0.85,
    borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.border,
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  savedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22,163,74,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  savedCheck: { color: '#fff', fontSize: 16, fontWeight: '700' },
  importingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  source: { fontSize: 11, color: Colors.muted, marginTop: 6, marginLeft: 2 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 2, marginLeft: 2, lineHeight: 18 },
  nutritionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 2, gap: 4 },
  cal: { fontSize: 11, color: Colors.muted },
  dot: { fontSize: 11, color: Colors.muted },
  pro: { fontSize: 11, color: Colors.accent },
  healthBadge: { alignSelf: 'flex-start', marginTop: 4, marginLeft: 2, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  healthText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  // Bottom sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { backgroundColor: 'transparent' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  previewImg: { width: 52, height: 52, borderRadius: 10 },
  previewTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 20 },
  previewSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },

  cbList: { paddingHorizontal: 20, paddingTop: 8 },
  cbRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  cbRowNew: { borderBottomWidth: 0 },
  cbEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  cbName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  cbCount: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  cbArrow: { fontSize: 20, color: Colors.muted },

  newCbWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12,
  },
  newCbInput: {
    flex: 1, height: 44, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.primary,
    paddingHorizontal: 14, fontSize: 15, color: Colors.text,
    backgroundColor: '#fff',
  },
  newCbSave: {
    height: 44, paddingHorizontal: 18, borderRadius: 10,
    backgroundColor: Colors.primary, justifyContent: 'center',
  },
  newCbSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
