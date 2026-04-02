import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors, MealTypeColors, MealTypeLabels } from '../../constants/colors';
import { useStore } from '../../store';
import { MealPlanEntry, Recipe, Ingredient, Step } from '../../db/schema';
import Badge from '../../components/ui/Badge';
import { TRENDING_RECIPES, TrendingRecipe } from '../../lib/trendingRecipes';

function getWeekDates(offset: number): { start: Date; end: Date; days: Date[] } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  return { start: monday, end: sunday, days };
}

function fmt(d: Date): string { return d.toISOString().split('T')[0]; }
function formatWeekRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${start.getFullYear()} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${end.getFullYear()}`;
}
function dayLabel(d: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[d.getDay()]} ${d.getDate()}`;
}
function isToday(d: Date): boolean {
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealPlanTab() {
  const { t } = useTranslation();
  const { mealPlanEntries, recipes, cookbooks, saveRecipe, saveMealPlanEntry, deleteMealPlanEntry, addMealPlanToGroceries } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [pickingFor, setPickingFor] = useState<{ date: string; mealType: string } | null>(null);

  const { start, end, days } = getWeekDates(weekOffset);

  const entriesThisWeek = mealPlanEntries.filter(e => e.date >= fmt(start) && e.date <= fmt(end));

  const handleAddToGroceries = async () => {
    await addMealPlanToGroceries(entriesThisWeek);
  };

  const handlePickRecipe = async (recipe: Recipe) => {
    if (!pickingFor) return;
    const entry: MealPlanEntry = {
      id: `mp_${Date.now()}`,
      date: pickingFor.date,
      mealType: pickingFor.mealType as any,
      recipeId: recipe.id,
    };
    await saveMealPlanEntry(entry);
    setPickingFor(null);
  };

  // Save a trending recipe then add to meal plan
  const handlePickTrending = async (item: TrendingRecipe) => {
    if (!pickingFor) return;
    const cookbookId = cookbooks[0]?.id ?? 'uncategorized';
    const recipeId = `recipe_${item.id}_${Date.now()}`;
    const recipe: Recipe = {
      id: recipeId, cookbookId, title: item.title, imageUri: item.image,
      servings: item.servings, prepTime: item.prepTime, cookTime: item.cookTime,
      sourceUrl: null, sourcePlatform: item.sourcePlatform,
      nutrition: item.nutrition, tags: item.tags, createdAt: new Date().toISOString(),
    };
    const ingredients: Ingredient[] = item.ingredients.map((ing, i) => ({
      id: `ing_${recipeId}_${i}`, recipeId, section: ing.section, name: ing.name,
      amount: ing.amount, unit: ing.unit, emoji: ing.emoji, order: i,
    }));
    const steps: Step[] = item.steps.map(s => ({
      id: `step_${recipeId}_${s.order}`, recipeId, order: s.order, instruction: s.instruction,
    }));
    await saveRecipe(recipe, ingredients, steps);
    const entry: MealPlanEntry = {
      id: `mp_${Date.now()}`,
      date: pickingFor.date,
      mealType: pickingFor.mealType as any,
      recipeId: recipe.id,
    };
    await saveMealPlanEntry(entry);
    setPickingFor(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('meal_plan_title')}</Text>
        <TouchableOpacity><Text style={styles.dots}>•••</Text></TouchableOpacity>
      </View>

      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOffset(o => o - 1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekRange}>{formatWeekRange(start, end)}</Text>
        <TouchableOpacity onPress={() => setWeekOffset(o => o + 1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Add to groceries */}
      {entriesThisWeek.length > 0 && (
        <TouchableOpacity style={styles.groceryBtn} onPress={handleAddToGroceries}>
          <Text style={styles.groceryBtnText}>🛒 {t('add_to_groceries')}</Text>
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {days.map(day => {
          const dateStr = fmt(day);
          const dayEntries = mealPlanEntries.filter(e => e.date === dateStr);
          const today = isToday(day);

          return (
            <View key={dateStr} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabel, today && styles.dayLabelToday]}>
                  {today ? '📍 Today • ' : ''}{dayLabel(day)}
                </Text>
                <View style={styles.dayActions}>
                  <TouchableOpacity><Text style={styles.dots}>•••</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setPickingFor({ date: dateStr, mealType: 'dinner' })} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {dayEntries.length === 0 ? (
                <Text style={styles.noRecipes}>{t('no_recipes_yet')}</Text>
              ) : (
                dayEntries.map(entry => {
                  const recipe = recipes.find(r => r.id === entry.recipeId);
                  if (!recipe) return null;
                  return (
                    <View key={entry.id} style={styles.mealRow}>
                      <View style={styles.mealImage}>
                        {recipe.imageUri ? (
                          <Image source={{ uri: recipe.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        ) : (
                          <Text style={{ fontSize: 24 }}>🍽</Text>
                        )}
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealTitle} numberOfLines={2}>{recipe.title}</Text>
                        <Badge mealType={entry.mealType} />
                      </View>
                      <TouchableOpacity onPress={() => deleteMealPlanEntry(entry.id)}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Recipe Picker Modal */}
      <Modal visible={!!pickingFor} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pick a Recipe</Text>
            <TouchableOpacity onPress={() => setPickingFor(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Meal type selector */}
          {pickingFor && (
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map(mt => (
                <TouchableOpacity
                  key={mt}
                  style={[styles.mealTypeBtn, pickingFor.mealType === mt && { backgroundColor: MealTypeColors[mt] }]}
                  onPress={() => setPickingFor(p => p ? { ...p, mealType: mt } : p)}
                >
                  <Text style={[styles.mealTypeBtnText, pickingFor.mealType === mt && { color: '#fff' }]}>
                    {MealTypeLabels[mt]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <FlatList
            data={recipes.length > 0 ? recipes : []}
            keyExtractor={r => r.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.recipePickItem} onPress={() => handlePickRecipe(item)}>
                <View style={styles.recipePickImage}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : <Text style={{ fontSize: 24 }}>🍽</Text>}
                </View>
                <Text style={styles.recipePickTitle} numberOfLines={2}>{item.title}</Text>
              </TouchableOpacity>
            )}
            ListHeaderComponent={recipes.length === 0 ? (
              <View>
                <Text style={styles.trendingHeader}>🔥 Popular recipes to get started</Text>
                {TRENDING_RECIPES.map(tr => (
                  <TouchableOpacity key={tr.id} style={styles.recipePickItem} onPress={() => handlePickTrending(tr)}>
                    <View style={styles.recipePickImage}>
                      <Image source={{ uri: tr.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recipePickTitle} numberOfLines={2}>{tr.title}</Text>
                      <Text style={styles.trendingMeta}>{tr.nutrition.calories} cal · {tr.nutrition.protein}g protein</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  dots: { fontSize: 18, color: Colors.muted },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: Colors.text },
  weekRange: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'center' },
  groceryBtn: { marginHorizontal: 20, marginBottom: 8, backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  groceryBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  daySection: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 12 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  dayLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  dayLabelToday: { color: Colors.accent },
  dayActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.muted, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 18, color: Colors.muted, lineHeight: 22 },
  noRecipes: { color: Colors.muted, fontSize: 14, paddingBottom: 8 },
  mealRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  mealImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: Colors.border, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  mealInfo: { flex: 1, gap: 4 },
  mealTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  removeBtn: { fontSize: 16, color: Colors.muted, padding: 4 },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.muted },
  mealTypeRow: { flexDirection: 'row', gap: 8, padding: 16 },
  mealTypeBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  mealTypeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  recipePickItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  recipePickImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: Colors.border, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  recipePickTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  emptyText: { textAlign: 'center', color: Colors.muted, marginTop: 40, fontSize: 15 },
  trendingHeader: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  trendingMeta: { fontSize: 12, color: Colors.muted, marginTop: 2 },
});
