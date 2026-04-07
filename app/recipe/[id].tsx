import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Linking, Share, Modal, FlatList, ActionSheetIOS, Platform, Alert, TextInput, KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { useStore } from '../../store';
import { Cookbook, Ingredient, MealPlanEntry, Step } from '../../db/schema';
import * as Storage from '../../db/storage';
import { scaleAmount, groupIngredientsBySections } from '../../lib/importRecipe';

const { width } = Dimensions.get('window');

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_COLORS: Record<string, string> = {
  breakfast: '#FEF08A', lunch: '#BFDBFE', dinner: '#DDD6FE', snack: '#BBF7D0',
};
const MEAL_TEXT: Record<string, string> = {
  breakfast: '#92400E', lunch: '#1D4ED8', dinner: '#6D28D9', snack: '#15803D',
};

function getWeekDates(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
function fmt(d: Date) { return d.toISOString().split('T')[0]; }
function isToday(d: Date) { return d.toDateString() === new Date().toDateString(); }
function weekLabel(days: Date[]) {
  const s = days[0], e = days[6];
  const mo = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${mo(s)} ${s.getFullYear()} - ${mo(e)} ${e.getFullYear()}`;
}

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes, cookbooks, userProfile, addToGroceryList, addCookbook, saveMealPlanEntry, mealPlanEntries, updateRecipe } = useStore();

  const recipe = recipes.find(r => r.id === id);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [servings, setServings] = useState(recipe?.servings ?? 4);

  // Cookbooks sheet
  const [showCookbooks, setShowCookbooks] = useState(false);
  const [selectedCookbookIds, setSelectedCookbookIds] = useState<Set<string>>(new Set());

  // Meal plan sheet
  const [showMealPlan, setShowMealPlan] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Groceries sheet
  const [showGroceries, setShowGroceries] = useState(false);
  const [groceryServings, setGroceryServings] = useState(recipe?.servings ?? 4);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  // Rate & review sheet
  const [showReview, setShowReview] = useState(false);
  const [draftRating, setDraftRating] = useState(recipe?.rating ?? 0);
  const [draftNote, setDraftNote] = useState(recipe?.note ?? '');

  useEffect(() => {
    if (id) {
      Storage.getIngredientsByRecipe(id).then(ings => {
        setIngredients(ings);
        setCheckedIngredients(new Set(ings.map(i => i.id)));
      });
      Storage.getStepsByRecipe(id).then(setSteps);
    }
  }, [id]);

  useEffect(() => {
    if (recipe) {
      const ids = new Set(cookbooks.filter(c => c.id === recipe.cookbookId).map(c => c.id));
      setSelectedCookbookIds(ids);
      setDraftNote(recipe.note ?? '');
    }
  }, [recipe, cookbooks]);

  if (!recipe) return null;

  const ratio = servings / (recipe.servings || 1);
  const groceryRatio = groceryServings / (recipe.servings || 1);
  const grouped = groupIngredientsBySections(ingredients);
  const isPlusUser = userProfile?.isPlusMember ?? false;

  const cal = recipe.nutrition ? Math.round(recipe.nutrition.calories * ratio) : null;
  const protein = recipe.nutrition ? Math.round(recipe.nutrition.protein * ratio) : null;
  const carbs = recipe.nutrition ? Math.round(recipe.nutrition.carbs * ratio) : null;
  const fat = recipe.nutrition ? Math.round(recipe.nutrition.fat * ratio) : null;

  // ── Cover photo ──────────────────────────────────────────────────────────
  const handlePickCoverPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to change the recipe image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateRecipe(recipe.id, { imageUri: result.assets[0].uri });
    }
  };

  // ── Share ────────────────────────────────────────────────────────────────
  // Trending recipes have a static GitHub Pages page with og: tags for rich preview
  const isTrending = id?.startsWith('recipe_tr_');
  const trendingId = isTrending ? id?.split('_')[2] : null; // e.g. 'recipe_tr_1_...' → 'tr_1'
  const shareUrl = trendingId
    ? `https://huangrui199126.github.io/receipe-me/recipe/${trendingId}/`
    : `https://huangrui199126.github.io/receipe-me/`;

  const handleShare = () => {
    const msg = `Check out this recipe: ${recipe.title}\n\n${shareUrl}`;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Share recipe link', 'Export PDF 👑', 'Print 👑', 'Cancel'], cancelButtonIndex: 3 },
        (idx) => {
          if (idx === 0) Share.share({ title: recipe.title, message: msg, url: shareUrl });
        }
      );
    } else {
      Share.share({ title: recipe.title, message: msg });
    }
  };

  // ── Meal plan ────────────────────────────────────────────────────────────
  const days = getWeekDates(weekOffset);
  const handleAddToMealPlan = async (date: string, mealType: string) => {
    const entry: MealPlanEntry = {
      id: `mp_${Date.now()}`,
      date,
      mealType: mealType as any,
      recipeId: recipe.id,
    };
    await saveMealPlanEntry(entry);
    setShowMealPlan(false);
  };

  // ── Groceries ────────────────────────────────────────────────────────────
  const handleAddToGroceries = async () => {
    const selected = ingredients.filter(i => checkedIngredients.has(i.id));
    const items = selected.map((ing, i) => ({
      id: `gi_${Date.now()}_${i}`,
      listId: '',
      recipeId: recipe.id,
      name: ing.name,
      amount: scaleAmount(ing.amount, groceryRatio),
      unit: ing.unit,
      category: categorize(ing.name),
      emoji: ing.emoji,
      checked: false,
      order: i,
    }));
    await addToGroceryList(items, recipe.id);
    setShowGroceries(false);
    router.push('/(tabs)/groceries');
  };

  // ── Cookbooks assignment ─────────────────────────────────────────────────
  const toggleCookbook = (id: string) => {
    setSelectedCookbookIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          {recipe.imageUri ? (
            <Image source={{ uri: recipe.imageUri }} style={styles.hero} resizeMode="cover" />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}><Text style={{ fontSize: 64 }}>🍽</Text></View>
          )}
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]}>
            <Text style={styles.backArrow}>‹ Back</Text>
          </TouchableOpacity>
          <View style={[styles.topRight, { top: insets.top + 8 }]}>
            <TouchableOpacity style={styles.topRightBtn} onPress={() => router.push(`/recipe/${id}/edit`)}>
              <Text style={styles.topRightText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.topRightBtn} onPress={handleShare}>
              <Text style={styles.topRightText}>•••</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cameraBtn} onPress={handlePickCoverPhoto}>
            <Text style={styles.cameraBtnText}>📷</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Title */}
          <Text style={styles.title}>{recipe.title}</Text>

          {/* 4 Action buttons */}
          <View style={styles.actionRow}>
            <ActionBtn icon="🔖" label="Cookbooks" onPress={() => setShowCookbooks(true)} />
            <ActionBtn icon="📅" label="Meal Plan" onPress={() => setShowMealPlan(true)} />
            <ActionBtn icon="🛒" label="Groceries" onPress={() => { setGroceryServings(servings); setShowGroceries(true); }} />
            <ActionBtn icon="↑" label="Share" onPress={handleShare} />
          </View>

          <View style={styles.divider} />

          {/* Recipe Notes */}
          <Text style={styles.sectionLabel}>RECIPE NOTES</Text>
          {recipe.sourceUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(recipe.sourceUrl!)} style={styles.sourceLink}>
              <Text style={styles.sourceLinkText}>Open {recipe.sourcePlatform} ↗</Text>
            </TouchableOpacity>
          )}

          {/* Cookbooks tags */}
          {(() => {
            const recipeCookbooks = cookbooks.filter(c => c.id === recipe.cookbookId);
            if (recipeCookbooks.length === 0) return null;
            return (
              <View style={styles.cbTagsSection}>
                <Text style={styles.sectionLabel}>COOKBOOKS</Text>
                <View style={styles.cbTags}>
                  {recipeCookbooks.map(c => (
                    <View key={c.id} style={styles.cbTag}>
                      <Text style={styles.cbTagText}>{c.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          <View style={styles.divider} />
          {/* Mark as Cooked + inline stars */}
          <View style={styles.cookedRow}>
            <TouchableOpacity onPress={() => updateRecipe(recipe.id, { cookedAt: recipe.cookedAt ? undefined : new Date().toISOString() })} style={styles.cookedCheckBtn}>
              <View style={[styles.cookedCheckCircle, recipe.cookedAt && styles.cookedCheckCircleActive]}>
                <Text style={styles.cookedCheckMark}>✓</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.cookedLabel}>Mark as Cooked</Text>
            <View style={styles.stars}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => updateRecipe(recipe.id, { rating: n === recipe.rating ? 0 : n })}>
                  <Text style={[styles.star, (recipe.rating ?? 0) >= n && styles.starFilled]}>
                    {(recipe.rating ?? 0) >= n ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Inline note input */}
          <TextInput
            style={styles.noteInput}
            value={draftNote}
            onChangeText={setDraftNote}
            onBlur={() => { if (draftNote !== (recipe.note ?? '')) updateRecipe(recipe.id, { note: draftNote }); }}
            placeholder="Add note"
            placeholderTextColor={Colors.muted}
            multiline
          />

          <View style={styles.divider} />

          {/* Ingredients */}
          <Text style={styles.sectionLabel}>{t('ingredients').toUpperCase()}</Text>
          <View style={styles.servingsRow}>
            <TouchableOpacity onPress={() => setServings(s => Math.max(1, s - 1))} style={styles.servBtn}>
              <Text style={styles.servBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.servCount}>{servings}</Text>
            <TouchableOpacity onPress={() => setServings(s => s + 1)} style={styles.servBtn}>
              <Text style={styles.servBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.servLabel}>{t('servings')}</Text>
            <TouchableOpacity style={styles.convertBtn}>
              <Text style={styles.convertBtnText}>👑 {t('convert')}</Text>
            </TouchableOpacity>
          </View>

          {Object.entries(grouped).map(([section, ings]) => (
            <View key={section}>
              {section !== '' && <Text style={styles.ingredientSection}>{section}</Text>}
              {ings.map(ing => (
                <View key={ing.id} style={styles.ingredientRow}>
                  <Text style={styles.ingredientEmoji}>{ing.emoji}</Text>
                  <Text style={styles.ingredientText}>
                    <Text style={styles.ingredientAmount}>{scaleAmount(ing.amount, ratio)} {ing.unit} </Text>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                  </Text>
                </View>
              ))}
            </View>
          ))}
          {ingredients.length === 0 && <Text style={styles.empty}>No ingredients added</Text>}

          <View style={styles.divider} />

          {/* Steps */}
          {steps.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('instructions').toUpperCase()}</Text>
              {steps.map(step => (
                <View key={step.id} style={styles.stepRow}>
                  <View style={styles.stepNumCircle}>
                    <Text style={styles.stepNumText}>{step.order}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.instruction}</Text>
                </View>
              ))}
            </>
          )}

          {/* Nutrition */}
          <Text style={styles.sectionLabel}>{t('nutrition').toUpperCase()}</Text>
          <Text style={styles.nutritionPer}>{t('per_serving')}</Text>
          {!isPlusUser ? (
            <View style={styles.nutritionLocked}>
              <NutritionWidget cal={250} protein={20} carbs={30} fat={10} blurred />
              <View style={styles.nutritionOverlay}>
                <Text style={styles.nutritionLockedText}>👑 Subscribe to unlock nutrition</Text>
              </View>
            </View>
          ) : cal !== null ? (
            <NutritionWidget cal={cal} protein={protein!} carbs={carbs!} fat={fat!} />
          ) : (
            <Text style={styles.empty}>Nutrition info not available</Text>
          )}

          {/* Start cooking */}
          {steps.length > 0 && (
            <TouchableOpacity style={styles.startBtn} onPress={() => router.push(`/recipe/${id}/cook`)}>
              <Text style={styles.startBtnText}>👨‍🍳 {t('start_cooking')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── Rate & Review sheet ── */}
      <Modal visible={showReview} transparent animationType="slide" onRequestClose={() => setShowReview(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowReview(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.sheetHeader}>
              <View style={{ width: 60 }} />
              <Text style={styles.sheetTitle}>Rate & review</Text>
              <TouchableOpacity onPress={async () => {
                await updateRecipe(recipe.id, { rating: draftRating || undefined, note: draftNote.trim() || undefined, cookedAt: new Date().toISOString() });
                setShowReview(false);
              }}>
                <Text style={[styles.sheetDone, { color: Colors.primary, fontWeight: '700', width: 60, textAlign: 'right' }]}>Update</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.reviewStars}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setDraftRating(prev => prev === n ? 0 : n)}>
                  <Text style={[styles.reviewStar, draftRating >= n && styles.reviewStarFilled]}>
                    {draftRating >= n ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setDraftRating(0)}>
              <Text style={styles.clearRating}>Clear rating</Text>
            </TouchableOpacity>
            <TextInput
              placeholder="Add a note (optional)"
              placeholderTextColor={Colors.muted}
              multiline
              value={draftNote}
              onChangeText={setDraftNote}
              style={styles.reviewNoteInput}
              textAlignVertical="top"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Cookbooks sheet ── */}
      <Modal visible={showCookbooks} transparent animationType="slide" onRequestClose={() => setShowCookbooks(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowCookbooks(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Save to</Text>
            <TouchableOpacity onPress={() => setShowCookbooks(false)}><Text style={styles.sheetClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity style={styles.newCbRow}>
              <View style={styles.newCbIcon}><Text style={styles.newCbPlus}>+</Text></View>
              <Text style={styles.newCbLabel}>New cookbook</Text>
              <Text style={styles.cbArrow}>›</Text>
            </TouchableOpacity>
            {cookbooks.map(cb => (
              <TouchableOpacity key={cb.id} style={styles.cbPickRow} onPress={() => toggleCookbook(cb.id)}>
                <View style={styles.cbThumb}>
                  {cb.coverImages?.[0]
                    ? <Image source={{ uri: cb.coverImages[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <Text style={{ fontSize: 20 }}>{cb.emoji ?? '📖'}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cbPickName}>{cb.name}</Text>
                  <Text style={styles.cbPickCount}>{cb.coverImages?.length ?? 0} Recipes</Text>
                </View>
                <View style={[styles.checkbox, selectedCookbookIds.has(cb.id) && styles.checkboxChecked]}>
                  {selectedCookbookIds.has(cb.id) && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.updateBtn, selectedCookbookIds.size === 0 && styles.updateBtnDisabled]}
            onPress={() => setShowCookbooks(false)}
          >
            <Text style={[styles.updateBtnText, selectedCookbookIds.size === 0 && { color: Colors.muted }]}>Update</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Meal Plan sheet ── */}
      <Modal visible={showMealPlan} transparent animationType="slide" onRequestClose={() => setShowMealPlan(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowMealPlan(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={() => setShowMealPlan(false)}><Text style={styles.sheetClose}>✕</Text></TouchableOpacity>
            <Text style={styles.sheetTitle}>Add to meal plan</Text>
            <TouchableOpacity onPress={() => setShowMealPlan(false)}><Text style={styles.sheetDone}>Done</Text></TouchableOpacity>
          </View>
          {/* Week navigation */}
          <View style={styles.weekNav}>
            <TouchableOpacity onPress={() => setWeekOffset(o => o - 1)}><Text style={styles.weekArrow}>‹</Text></TouchableOpacity>
            <Text style={styles.weekLabel}>{weekLabel(days)}</Text>
            <TouchableOpacity onPress={() => setWeekOffset(o => o + 1)}><Text style={styles.weekArrow}>›</Text></TouchableOpacity>
          </View>
          <ScrollView>
            {days.map(day => {
              const dateStr = fmt(day);
              const today = isToday(day);
              const dayName = day.toLocaleDateString('en-US', { weekday: 'long' });
              const dayEntries = mealPlanEntries.filter(e => e.date === dateStr);
              return (
                <View key={dateStr} style={styles.mealDaySection}>
                  <View style={styles.mealDayHeader}>
                    <Text style={[styles.mealDayLabel, today && styles.mealDayLabelToday]}>
                      {today ? 'Today • ' : ''}{dayName} {day.getDate()}
                    </Text>
                    <TouchableOpacity style={styles.mealDayAdd} onPress={() => {
                      // Show meal type picker
                      if (Platform.OS === 'ios') {
                        ActionSheetIOS.showActionSheetWithOptions(
                          { options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Cancel'], cancelButtonIndex: 4 },
                          (idx) => { if (idx < 4) handleAddToMealPlan(dateStr, MEAL_TYPES[idx]); }
                        );
                      }
                    }}>
                      <Text style={styles.mealDayAddText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  {dayEntries.map(entry => {
                    const r = recipes.find(r => r.id === entry.recipeId);
                    if (!r) return null;
                    return (
                      <View key={entry.id} style={styles.mealEntryRow}>
                        {r.imageUri ? <Image source={{ uri: r.imageUri }} style={styles.mealEntryImg} /> : null}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mealEntryTitle} numberOfLines={1}>{r.title}</Text>
                          <View style={[styles.mealTypeBadge, { backgroundColor: MEAL_COLORS[entry.mealType] ?? '#eee' }]}>
                            <Text style={[styles.mealTypeBadgeText, { color: MEAL_TEXT[entry.mealType] ?? '#333' }]}>
                              {entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  {dayEntries.length === 0 && <Text style={styles.noRecipes}>No recipes yet</Text>}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Groceries sheet ── */}
      <Modal visible={showGroceries} transparent animationType="slide" onRequestClose={() => setShowGroceries(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowGroceries(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={() => setShowGroceries(false)}><Text style={styles.sheetClose}>✕</Text></TouchableOpacity>
            <Text style={styles.sheetTitle}>Add to groceries</Text>
            <View style={{ width: 40 }} />
          </View>
          {/* Servings adjuster */}
          <View style={styles.grocServRow}>
            <Text style={styles.grocServLabel}>Servings</Text>
            <TouchableOpacity onPress={() => setGroceryServings(s => Math.max(1, s - 1))} style={styles.servBtn}>
              <Text style={styles.servBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.servCount}>{groceryServings}</Text>
            <TouchableOpacity onPress={() => setGroceryServings(s => s + 1)} style={styles.servBtn}>
              <Text style={styles.servBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {/* Ingredient checklist */}
          <ScrollView style={{ maxHeight: 320 }}>
            {ingredients.map(ing => (
              <TouchableOpacity
                key={ing.id}
                style={styles.grocIngRow}
                onPress={() => setCheckedIngredients(prev => {
                  const next = new Set(prev);
                  if (next.has(ing.id)) next.delete(ing.id); else next.add(ing.id);
                  return next;
                })}
              >
                <View style={[styles.checkbox, checkedIngredients.has(ing.id) && styles.checkboxChecked]}>
                  {checkedIngredients.has(ing.id) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.ingEmoji}>{ing.emoji}</Text>
                <Text style={styles.grocIngText}>
                  <Text style={styles.grocIngAmount}>{scaleAmount(ing.amount, groceryRatio)} {ing.unit} </Text>
                  {ing.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.addGrocBtn, checkedIngredients.size === 0 && { opacity: 0.4 }]}
            onPress={handleAddToGroceries}
            disabled={checkedIngredients.size === 0}
          >
            <Text style={styles.addGrocBtnText}>Add {checkedIngredients.size} items to grocery list</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function ActionBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <View style={styles.actionBtnCircle}>
        <Text style={styles.actionBtnIcon}>{icon}</Text>
      </View>
      <Text style={styles.actionBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function NutritionWidget({ cal, protein, carbs, fat, blurred }: { cal: number; protein: number; carbs: number; fat: number; blurred?: boolean }) {
  const { t } = useTranslation();
  const total = protein + carbs + fat || 1;
  const proteinDeg = (protein / total) * 283;
  const carbsDeg = (carbs / total) * 283;
  const SIZE = 100, R = 40;
  const circumference = 2 * Math.PI * R;
  return (
    <View style={[styles.nutritionCard, blurred && { opacity: 0.25 }]}>
      <View style={styles.nutritionLeft}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={50} cy={50} r={R} stroke={Colors.border} strokeWidth={10} fill="none" />
          <Circle cx={50} cy={50} r={R} stroke={Colors.purple} strokeWidth={10} fill="none"
            strokeDasharray={`${proteinDeg} ${circumference - proteinDeg}`}
            strokeDashoffset={circumference * 0.25} strokeLinecap="round" />
          <Circle cx={50} cy={50} r={R} stroke="#F59E0B" strokeWidth={10} fill="none"
            strokeDasharray={`${carbsDeg} ${circumference - carbsDeg}`}
            strokeDashoffset={circumference * 0.25 - proteinDeg} strokeLinecap="round" />
        </Svg>
        <View style={styles.nutritionCalCenter}>
          <Text style={styles.nutritionCal}>{cal}</Text>
          <Text style={styles.nutritionCalLabel}>{t('calories')}</Text>
        </View>
      </View>
      <View style={styles.nutritionRight}>
        {[
          { color: Colors.purple, label: t('protein'), value: `${protein}g` },
          { color: '#F59E0B', label: t('carbs'), value: `${carbs}g` },
          { color: '#10B981', label: t('fat'), value: `${fat}g` },
        ].map(m => (
          <View key={m.label} style={styles.macroRow}>
            <View style={[styles.macroDot, { backgroundColor: m.color }]} />
            <Text style={styles.macroLabel}>{m.label}:</Text>
            <Text style={styles.macroValue}>{m.value}</Text>
          </View>
        ))}
      </View>
    </View>
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

const styles = StyleSheet.create({
  heroWrap: { position: 'relative' },
  hero: { width, height: 280 },
  heroPlaceholder: { backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', left: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  backArrow: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  topRight: { position: 'absolute', right: 16, flexDirection: 'row', gap: 8 },
  topRightBtn: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  topRightText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  cameraBtn: { position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center' },
  cameraBtnText: { fontSize: 18 },

  body: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 16, lineHeight: 30 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionBtnCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  actionBtnIcon: { fontSize: 22 },
  actionBtnLabel: { fontSize: 12, color: Colors.text, fontWeight: '500' },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.accent, letterSpacing: 0.8, marginBottom: 12 },

  sourceLink: { marginBottom: 12 },
  sourceLinkText: { fontSize: 14, color: Colors.muted },
  cbTagsSection: { marginBottom: 12 },
  cbTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  cbTag: { backgroundColor: '#4ADE80', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  cbTagText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cookedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cookedCheckBtn: { padding: 2 },
  cookedCheckCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
  cookedCheckCircleActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  cookedCheckMark: { fontSize: 13, color: '#fff', fontWeight: '700' },
  cookedLabel: { fontSize: 15, fontWeight: '500', color: Colors.text, flex: 1 },
  cookedCheck: { fontSize: 16, color: Colors.muted },
  stars: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 22, color: '#D1D5DB' },
  starFilled: { color: '#F59E0B' },
  noteInput: {
    backgroundColor: Colors.background, borderRadius: 10, padding: 14,
    minHeight: 52, fontSize: 14, color: Colors.text, marginBottom: 4,
    textAlignVertical: 'top',
  },
  noteText: { fontSize: 14, color: Colors.text },
  notePlaceholder: { fontSize: 14, color: Colors.muted },
  reviewStars: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 16 },
  reviewStar: { fontSize: 44, color: Colors.border },
  reviewStarFilled: { color: '#F59E0B' },
  clearRating: { textAlign: 'center', fontSize: 14, color: Colors.muted, marginBottom: 20 },
  reviewNoteInput: { marginHorizontal: 20, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 15, color: Colors.text, minHeight: 160, maxHeight: 300 },

  servingsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  servBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  servBtnText: { fontSize: 18, color: Colors.primary, lineHeight: 22 },
  servCount: { fontSize: 18, fontWeight: '700', color: Colors.text, minWidth: 28, textAlign: 'center' },
  servLabel: { fontSize: 15, color: Colors.muted, flex: 1 },
  convertBtn: { backgroundColor: Colors.purpleLight ?? '#F3F0FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  convertBtnText: { color: Colors.purple ?? '#7C3AED', fontSize: 14, fontWeight: '600' },

  ingredientSection: { fontSize: 15, fontWeight: '700', color: Colors.text, marginVertical: 10 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  ingredientEmoji: { fontSize: 20, width: 32 },
  ingredientText: { flex: 1, fontSize: 15, lineHeight: 22 },
  ingredientAmount: { fontWeight: '400', color: Colors.muted },
  ingredientName: { fontWeight: '600', color: Colors.text },
  empty: { color: Colors.muted, fontSize: 14, marginBottom: 16 },

  stepRow: { flexDirection: 'row', marginBottom: 16, gap: 12, alignItems: 'flex-start' },
  stepNumCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 15, color: Colors.text, lineHeight: 24 },

  nutritionPer: { fontSize: 13, color: Colors.muted, marginBottom: 12 },
  nutritionLocked: { position: 'relative', marginBottom: 16 },
  nutritionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  nutritionLockedText: { fontSize: 14, fontWeight: '600', color: Colors.text, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  nutritionCard: { backgroundColor: Colors.card ?? '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  nutritionLeft: { width: 100, height: 100, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  nutritionCalCenter: { position: 'absolute', alignItems: 'center' },
  nutritionCal: { fontSize: 22, fontWeight: '700', color: Colors.text },
  nutritionCalLabel: { fontSize: 11, color: Colors.muted },
  nutritionRight: { flex: 1, paddingLeft: 20, gap: 8 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroDot: { width: 10, height: 10, borderRadius: 5 },
  macroLabel: { fontSize: 14, color: Colors.muted, flex: 1 },
  macroValue: { fontSize: 14, fontWeight: '600', color: Colors.text },

  startBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // Sheets
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  sheetClose: { fontSize: 18, color: Colors.muted, width: 40 },
  sheetDone: { fontSize: 15, color: Colors.muted, textAlign: 'right', width: 40 },

  // Cookbooks sheet
  newCbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  newCbIcon: { width: 52, height: 52, borderRadius: 10, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  newCbPlus: { fontSize: 24, color: Colors.primary, fontWeight: '300' },
  newCbLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  cbArrow: { fontSize: 20, color: Colors.muted },
  cbPickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  cbThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: Colors.border, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  cbPickName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  cbPickCount: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  updateBtn: { margin: 20, height: 50, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  updateBtnDisabled: {},
  updateBtnText: { fontSize: 16, fontWeight: '600', color: Colors.text },

  // Meal plan sheet
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  weekArrow: { fontSize: 24, color: Colors.text, fontWeight: '300', paddingHorizontal: 8 },
  weekLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  mealDaySection: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  mealDayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mealDayLabel: { fontSize: 14, fontWeight: '600', color: Colors.muted },
  mealDayLabelToday: { color: Colors.accent, fontWeight: '700' },
  mealDayAdd: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  mealDayAddText: { fontSize: 18, color: Colors.muted, lineHeight: 22 },
  mealEntryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  mealEntryImg: { width: 44, height: 44, borderRadius: 8 },
  mealEntryTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  mealTypeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  mealTypeBadgeText: { fontSize: 12, fontWeight: '600' },
  noRecipes: { fontSize: 13, color: Colors.muted },

  // Groceries sheet
  grocServRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  grocServLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  grocIngRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  ingEmoji: { fontSize: 18, width: 24 },
  grocIngText: { flex: 1, fontSize: 14, color: Colors.text },
  grocIngAmount: { fontWeight: '700' },
  addGrocBtn: { margin: 20, height: 52, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  addGrocBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
