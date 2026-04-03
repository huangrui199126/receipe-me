import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, Image, ActivityIndicator, Platform, ActionSheetIOS,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, MealTypeColors, MealTypeLabels } from '../../constants/colors';
import { useStore } from '../../store';
import { MealPlanEntry, Recipe, Ingredient, Step } from '../../db/schema';
import Badge from '../../components/ui/Badge';
import { TRENDING_RECIPES, TrendingRecipe } from '../../lib/trendingRecipes';
import * as Storage from '../../db/storage';
import { scaleAmount } from '../../lib/importRecipe';

function getWeekDates(offset: number) {
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

function fmt(d: Date) { return d.toISOString().split('T')[0]; }
function formatWeekRange(start: Date, end: Date) {
  const mo = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${mo(start)} ${start.getFullYear()} - ${mo(end)} ${end.getFullYear()}`;
}
function dayLabel(d: Date) {
  return `${'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ')[d.getDay()]} ${d.getDate()}`;
}
function isToday(d: Date) { return d.toDateString() === new Date().toDateString(); }

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

// ── Multi-recipe grocery picker ───────────────────────────────────────────────
interface RecipeIngredients {
  recipe: Recipe;
  ingredients: Ingredient[];
  servings: number;
  checkedIds: Set<string>;
}

function GroceryPickerSheet({
  visible,
  entries,
  recipes,
  onClose,
  onAdd,
}: {
  visible: boolean;
  entries: MealPlanEntry[];
  recipes: Recipe[];
  onClose: () => void;
  onAdd: (items: { ingredient: Ingredient; servings: number; recipeId: string }[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const [recipeData, setRecipeData] = useState<RecipeIngredients[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    // Deduplicate recipes (same recipe may appear multiple days)
    const seen = new Set<string>();
    const uniqueEntries = entries.filter(e => { if (seen.has(e.recipeId)) return false; seen.add(e.recipeId); return true; });

    Promise.all(
      uniqueEntries.map(async (entry) => {
        const recipe = recipes.find(r => r.id === entry.recipeId);
        if (!recipe) return null;
        const ingredients = await Storage.getIngredientsByRecipe(recipe.id);
        return {
          recipe,
          ingredients,
          servings: recipe.servings ?? 4,
          checkedIds: new Set(ingredients.map(i => i.id)),
        } as RecipeIngredients;
      })
    ).then(results => {
      setRecipeData(results.filter(Boolean) as RecipeIngredients[]);
      setLoading(false);
    });
  }, [visible]);

  const totalChecked = recipeData.reduce((sum, rd) => sum + rd.checkedIds.size, 0);

  const toggleIngredient = (recipeIdx: number, ingId: string) => {
    setRecipeData(prev => prev.map((rd, i) => {
      if (i !== recipeIdx) return rd;
      const next = new Set(rd.checkedIds);
      if (next.has(ingId)) next.delete(ingId); else next.add(ingId);
      return { ...rd, checkedIds: next };
    }));
  };

  const setServings = (recipeIdx: number, s: number) => {
    setRecipeData(prev => prev.map((rd, i) => i === recipeIdx ? { ...rd, servings: Math.max(1, s) } : rd));
  };

  const deselectAll = () => {
    setRecipeData(prev => prev.map(rd => ({ ...rd, checkedIds: new Set() })));
  };

  const handleAdd = () => {
    const items: { ingredient: Ingredient; servings: number; recipeId: string }[] = [];
    for (const rd of recipeData) {
      for (const ing of rd.ingredients) {
        if (rd.checkedIds.has(ing.id)) {
          items.push({ ingredient: ing, servings: rd.servings, recipeId: rd.recipe.id });
        }
      }
    }
    onAdd(items);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={[gs.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={gs.headerBack}>
            <Text style={gs.headerBackText}>‹</Text>
          </TouchableOpacity>
          <Text style={gs.headerTitle}>Add items</Text>
          <TouchableOpacity onPress={onClose}><Text style={gs.headerClose}>✕</Text></TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View style={gs.toolbar}>
          <TouchableOpacity style={gs.convertBtn}>
            <Text style={gs.convertBtnText}>👑 Convert</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deselectAll}>
            <Text style={gs.deselectAll}>Deselect all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {recipeData.map((rd, recipeIdx) => {
              const ratio = rd.servings / (rd.recipe.servings || 1);
              return (
                <View key={rd.recipe.id}>
                  {/* Recipe header */}
                  <View style={gs.recipeHeader}>
                    {rd.recipe.imageUri ? (
                      <Image source={{ uri: rd.recipe.imageUri }} style={gs.recipeThumb} resizeMode="cover" />
                    ) : <View style={[gs.recipeThumb, { backgroundColor: Colors.border }]} />}
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={gs.recipeTitle} numberOfLines={2}>{rd.recipe.title}</Text>
                      <View style={gs.servingsRow}>
                        <TouchableOpacity onPress={() => setServings(recipeIdx, rd.servings - 1)} style={gs.servBtn}>
                          <Text style={gs.servBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={gs.servCount}>{rd.servings}</Text>
                        <TouchableOpacity onPress={() => setServings(recipeIdx, rd.servings + 1)} style={gs.servBtn}>
                          <Text style={gs.servBtnText}>+</Text>
                        </TouchableOpacity>
                        <Text style={gs.servLabel}>servings</Text>
                      </View>
                    </View>
                  </View>

                  {/* Ingredients */}
                  {rd.ingredients.map(ing => (
                    <TouchableOpacity
                      key={ing.id}
                      style={gs.ingRow}
                      onPress={() => toggleIngredient(recipeIdx, ing.id)}
                    >
                      <Text style={gs.ingEmoji}>{ing.emoji}</Text>
                      <Text style={gs.ingText} numberOfLines={2}>
                        <Text style={gs.ingAmount}>{scaleAmount(ing.amount, ratio)} {ing.unit} </Text>
                        {ing.name}
                      </Text>
                      <View style={[gs.checkbox, rd.checkedIds.has(ing.id) && gs.checkboxChecked]}>
                        {rd.checkedIds.has(ing.id) && <Text style={gs.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  ))}

                  <View style={gs.sectionDivider} />
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Fixed bottom button */}
        <View style={[gs.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[gs.addBtn, totalChecked === 0 && { opacity: 0.5 }]}
            onPress={handleAdd}
            disabled={totalChecked === 0}
          >
            <Text style={gs.addBtnText}>Add {totalChecked} items</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MealPlanTab() {
  const router = useRouter();
  const { mealPlanEntries, recipes, cookbooks, saveRecipe, saveMealPlanEntry, deleteMealPlanEntry, addToGroceryList } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [pickingFor, setPickingFor] = useState<{ date: string; mealType: string } | null>(null);
  const [showGroceryPicker, setShowGroceryPicker] = useState(false);

  const { start, end, days } = getWeekDates(weekOffset);
  const entriesThisWeek = mealPlanEntries.filter(e => e.date >= fmt(start) && e.date <= fmt(end));

  const handlePickRecipe = async (recipe: Recipe) => {
    if (!pickingFor) return;
    await saveMealPlanEntry({ id: `mp_${Date.now()}`, date: pickingFor.date, mealType: pickingFor.mealType as any, recipeId: recipe.id });
    setPickingFor(null);
  };

  const handlePickTrending = async (item: TrendingRecipe) => {
    if (!pickingFor) return;
    const cookbookId = cookbooks[0]?.id ?? 'uncategorized';
    const recipeId = `recipe_${item.id}_${Date.now()}`;
    const recipe: Recipe = { id: recipeId, cookbookId, title: item.title, imageUri: item.image, servings: item.servings, prepTime: item.prepTime, cookTime: item.cookTime, sourceUrl: null, sourcePlatform: item.sourcePlatform, nutrition: item.nutrition, tags: item.tags, createdAt: new Date().toISOString() };
    const ingredients: Ingredient[] = item.ingredients.map((ing, i) => ({ id: `ing_${recipeId}_${i}`, recipeId, section: ing.section, name: ing.name, amount: ing.amount, unit: ing.unit, emoji: ing.emoji, order: i }));
    const steps: Step[] = item.steps.map(s => ({ id: `step_${recipeId}_${s.order}`, recipeId, order: s.order, instruction: s.instruction, imageUri: s.imageUri }));
    await saveRecipe(recipe, ingredients, steps);
    await saveMealPlanEntry({ id: `mp_${Date.now()}`, date: pickingFor.date, mealType: pickingFor.mealType as any, recipeId });
    setPickingFor(null);
  };

  const handleGroceryAdd = async (items: { ingredient: Ingredient; servings: number; recipeId: string }[]) => {
    const groceryItems = items.map((item, i) => {
      const recipe = recipes.find(r => r.id === item.recipeId);
      const ratio = item.servings / (recipe?.servings || 1);
      return {
        id: `gi_${Date.now()}_${i}`,
        listId: '',
        recipeId: item.recipeId,
        name: item.ingredient.name,
        amount: scaleAmount(item.ingredient.amount, ratio),
        unit: item.ingredient.unit,
        category: categorize(item.ingredient.name),
        emoji: item.ingredient.emoji,
        checked: false,
        order: i,
      };
    });
    await addToGroceryList(groceryItems);
    setShowGroceryPicker(false);
    router.push('/(tabs)/groceries');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Meal Plan</Text>
        <TouchableOpacity><Text style={styles.dots}>•••</Text></TouchableOpacity>
      </View>

      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOffset(o => o - 1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekRange}>{formatWeekRange(start, end)}</Text>
        <TouchableOpacity onPress={() => setWeekOffset(o => o + 1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {entriesThisWeek.length > 0 && (
        <TouchableOpacity style={styles.groceryBtn} onPress={() => setShowGroceryPicker(true)}>
          <Text style={styles.groceryBtnText}>🛒 Add to groceries</Text>
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
                  {today ? 'Today • ' : ''}{dayLabel(day)}
                </Text>
                <View style={styles.dayActions}>
                  <TouchableOpacity><Text style={styles.dots}>•••</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setPickingFor({ date: dateStr, mealType: 'dinner' })} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {dayEntries.length === 0 ? (
                <Text style={styles.noRecipes}>No recipes yet</Text>
              ) : (
                dayEntries.map(entry => {
                  const recipe = recipes.find(r => r.id === entry.recipeId);
                  if (!recipe) return null;
                  return (
                    // Tap recipe row → navigate to recipe detail
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.mealRow}
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.mealImage}>
                        {recipe.imageUri
                          ? <Image source={{ uri: recipe.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                          : <Text style={{ fontSize: 24 }}>🍽</Text>}
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealTitle} numberOfLines={2}>{recipe.title}</Text>
                        <Badge mealType={entry.mealType} />
                      </View>
                      <TouchableOpacity onPress={(e) => { e.stopPropagation(); deleteMealPlanEntry(entry.id); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
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
            data={recipes}
            keyExtractor={r => r.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.recipePickItem} onPress={() => handlePickRecipe(item)}>
                <View style={styles.recipePickImage}>
                  {item.imageUri ? <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Text style={{ fontSize: 24 }}>🍽</Text>}
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

      {/* Grocery picker sheet */}
      <GroceryPickerSheet
        visible={showGroceryPicker}
        entries={entriesThisWeek}
        recipes={recipes}
        onClose={() => setShowGroceryPicker(false)}
        onAdd={handleGroceryAdd}
      />
    </SafeAreaView>
  );
}

function categorize(name: string): string {
  const l = name.toLowerCase();
  if (['lettuce','tomato','onion','spinach','broccoli','carrot','garlic','avocado','lemon','lime','pepper','mushroom'].some(k => l.includes(k))) return 'FRESH PRODUCE';
  if (['chicken','beef','pork','bacon','salmon','shrimp','turkey','fish'].some(k => l.includes(k))) return 'MEAT & SEAFOOD';
  if (['milk','cheese','butter','cream','yogurt','egg'].some(k => l.includes(k))) return 'DAIRY';
  if (['bread','flour','wrap','tortilla','bun'].some(k => l.includes(k))) return 'BAKERY';
  return 'PANTRY';
}

// Grocery picker styles
const gs = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerBack: { width: 40, justifyContent: 'center' },
  headerBackText: { fontSize: 28, color: Colors.text, fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  headerClose: { fontSize: 18, color: Colors.muted, width: 40, textAlign: 'right' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  convertBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  convertBtnText: { fontSize: 14, color: Colors.purple ?? '#7C3AED', fontWeight: '600' },
  deselectAll: { fontSize: 14, color: Colors.muted },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.background },
  recipeThumb: { width: 60, height: 60, borderRadius: 10, overflow: 'hidden' },
  recipeTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 20 },
  servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  servBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  servBtnText: { fontSize: 16, color: Colors.primary, lineHeight: 20 },
  servCount: { fontSize: 15, fontWeight: '700', color: Colors.text, minWidth: 20, textAlign: 'center' },
  servLabel: { fontSize: 13, color: Colors.muted },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  ingEmoji: { fontSize: 20, width: 28 },
  ingText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
  ingAmount: { fontWeight: '700' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionDivider: { height: 8, backgroundColor: Colors.background },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  addBtn: { height: 52, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  dots: { fontSize: 18, color: Colors.muted },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: Colors.text },
  weekRange: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'center' },
  groceryBtn: { marginHorizontal: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  groceryBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  daySection: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 12 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  dayLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  dayLabelToday: { color: Colors.accent, fontWeight: '700' },
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
  recipePickItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  recipePickImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: Colors.border, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  recipePickTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  trendingHeader: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  trendingMeta: { fontSize: 12, color: Colors.muted, marginTop: 2 },
});
