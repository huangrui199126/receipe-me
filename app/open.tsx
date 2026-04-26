import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { fetchRecipeDetail } from '../lib/trendingApi';
import { TrendingRecipe } from '../lib/trendingRecipes';
import { useStore } from '../store';
import { Cookbook, Recipe, Ingredient, Step } from '../db/schema';
import { E } from '../constants/emoji';
import EmojiIcon, { EmojiImage } from '../components/EmojiIcon';
import ReciMeLogo from '../components/ReciMeLogo';

export default function OpenRecipe() {
  const { recipe: recipeId } = useLocalSearchParams<{ recipe: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cookbooks, saveRecipe, addCookbook, canPreviewRecipe, consumePreview } = useStore();

  const [detail, setDetail] = useState<TrendingRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (!recipeId) { setError(true); setLoading(false); return; }
    fetchRecipeDetail(recipeId).then(r => {
      if (r) setDetail(r); else setError(true);
      setLoading(false);
    });
  }, [recipeId]);

  const handleSave = async () => {
    if (!detail || saving) return;
    if (!canPreviewRecipe()) { router.push('/paywall'); return; }
    consumePreview();
    setSaving(true);
    let cookbookId = cookbooks[0]?.id ?? 'favorites';
    if (!cookbooks.find(c => c.id === cookbookId)) {
      const fav: Cookbook = {
        id: `cb_${Date.now()}`, name: 'Favorites', emoji: E.star,
        coverImages: [], createdAt: new Date().toISOString(),
      };
      await addCookbook(fav);
      cookbookId = fav.id;
    }
    const id = `recipe_${detail.id}_${Date.now()}`;
    const recipe: Recipe = {
      id, cookbookId, title: detail.title, imageUri: detail.image,
      servings: detail.servings, prepTime: detail.prepTime, cookTime: detail.cookTime,
      sourceUrl: null, sourcePlatform: detail.sourcePlatform,
      nutrition: detail.nutrition, tags: detail.tags, createdAt: new Date().toISOString(),
    };
    const ingredients: Ingredient[] = detail.ingredients.map((ing, i) => ({
      id: `ing_${id}_${i}`, recipeId: id, section: ing.section,
      name: ing.name, amount: ing.amount, unit: ing.unit, emoji: ing.emoji, order: i,
    }));
    const steps: Step[] = detail.steps.map(s => ({
      id: `step_${id}_${s.order}`, recipeId: id,
      order: s.order, instruction: s.instruction, imageUri: s.imageUri,
    }));
    await saveRecipe(recipe, ingredients, steps);
    setSavedId(id);
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading recipe…</Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={styles.errorTitle}>Recipe not found</Text>
        <Text style={styles.errorSub}>This link may be expired or unavailable.</Text>
        <TouchableOpacity style={styles.storeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.storeBtnText}>Go to RecipeMe</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalTime = detail.prepTime + detail.cookTime;
  const healthColor = detail.healthScore >= 8 ? '#16A34A' : detail.healthScore >= 5 ? '#F59E0B' : '#EF4444';
  const healthLabel = detail.healthScore >= 8 ? 'Healthy' : detail.healthScore >= 5 ? 'Balanced' : 'Indulgent';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ReciMeLogo size={20} />
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Text style={styles.closeBtn}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.sourceBanner}>
          <Text style={styles.sourceBannerText}>From {detail.sourcePlatform}  ↗</Text>
        </View>

        <View style={styles.heroRow}>
          <Image source={{ uri: detail.image }} style={styles.heroImg} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{detail.title.toUpperCase()}</Text>
            <View style={styles.heroMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <EmojiIcon name="timer" size={12} />
                <Text style={styles.heroMetaText}>{totalTime} min</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <EmojiIcon name="plate" size={12} />
                <Text style={styles.heroMetaText}>{detail.servings} servings</Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: healthColor }]}>
              <Text style={styles.badgeText}>{healthLabel} {detail.healthScore}/10</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.nutritionBand}>
          {[
            { label: 'Calories', value: `${detail.nutrition.calories}` },
            { label: 'Protein', value: `${detail.nutrition.protein}g` },
            { label: 'Carbs', value: `${detail.nutrition.carbs}g` },
            { label: 'Fat', value: `${detail.nutrition.fat}g` },
          ].map(n => (
            <View key={n.label} style={styles.nutritionCell}>
              <Text style={styles.nutritionVal}>{n.value}</Text>
              <Text style={styles.nutritionLbl}>{n.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>INGREDIENTS</Text>
        {detail.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingRow}>
            <View style={{ width: 28, alignItems: 'center' }}><EmojiImage emoji={ing.emoji} size={20} /></View>
            <Text style={styles.ingAmount}>{ing.amount} {ing.unit}</Text>
            <Text style={styles.ingName}>{ing.name}</Text>
          </View>
        ))}

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>STEPS</Text>
        {detail.steps.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{s.order}</Text>
            </View>
            <Text style={styles.stepText}>{s.instruction}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.saveBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || !!savedId) && { opacity: 0.6 }]}
          onPress={savedId ? () => router.replace(`/recipe/${savedId}`) : handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{savedId ? '✓ Open saved recipe' : 'Save to my cookbooks'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32, backgroundColor: '#fff' },
  loadingText: { color: Colors.muted, fontSize: 15, marginTop: 8 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  errorSub: { fontSize: 14, color: Colors.muted, textAlign: 'center' },
  storeBtn: { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  storeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { fontSize: 16, color: Colors.text },
  sourceBanner: { backgroundColor: '#FEFCE8', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  sourceBannerText: { fontSize: 13, color: '#92400E', fontWeight: '500' },
  heroRow: { flexDirection: 'row', padding: 20, gap: 14, alignItems: 'flex-start' },
  heroImg: { width: 100, height: 100, borderRadius: 12 },
  heroTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, lineHeight: 22, flex: 1 },
  heroMeta: { flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 6 },
  heroMetaText: { fontSize: 12, color: Colors.muted },
  badge: { flexDirection: 'row', alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 20, marginVertical: 4 },
  nutritionBand: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 20 },
  nutritionCell: { flex: 1, alignItems: 'center' },
  nutritionVal: { fontSize: 16, fontWeight: '700', color: Colors.text },
  nutritionLbl: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.accent, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, letterSpacing: 0.8 },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, gap: 10 },
  ingAmount: { fontSize: 14, fontWeight: '700', color: Colors.text, minWidth: 60 },
  ingName: { flex: 1, fontSize: 14, color: Colors.text },
  stepRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 14, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text },
  saveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  saveBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
