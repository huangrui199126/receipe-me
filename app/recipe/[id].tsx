import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { useStore } from '../../store';
import { Ingredient, Step } from '../../db/schema';
import * as Storage from '../../db/storage';
import { scaleAmount, groupIngredientsBySections } from '../../lib/importRecipe';

const { width } = Dimensions.get('window');

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes, userProfile, addToGroceryList } = useStore();

  const recipe = recipes.find(r => r.id === id);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [servings, setServings] = useState(recipe?.servings ?? 4);

  useEffect(() => {
    if (id) {
      Storage.getIngredientsByRecipe(id).then(setIngredients);
      Storage.getStepsByRecipe(id).then(setSteps);
    }
  }, [id]);

  if (!recipe) return null;

  const ratio = servings / (recipe.servings || 1);
  const grouped = groupIngredientsBySections(ingredients);
  const isPlusUser = userProfile?.isPlusMember ?? false;

  const handleAddToGroceries = async () => {
    const items = ingredients.map((ing, i) => ({
      id: `gi_${Date.now()}_${i}`,
      listId: '',
      recipeId: recipe.id,
      name: ing.name,
      amount: scaleAmount(ing.amount, ratio),
      unit: ing.unit,
      category: categorize(ing.name),
      emoji: ing.emoji,
      checked: false,
      order: i,
    }));
    await addToGroceryList(items, recipe.id);
    router.push('/(tabs)/groceries');
  };

  const cal = recipe.nutrition ? Math.round(recipe.nutrition.calories * ratio) : null;
  const protein = recipe.nutrition ? Math.round(recipe.nutrition.protein * ratio) : null;
  const carbs = recipe.nutrition ? Math.round(recipe.nutrition.carbs * ratio) : null;
  const fat = recipe.nutrition ? Math.round(recipe.nutrition.fat * ratio) : null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          {recipe.imageUri ? (
            <Image source={{ uri: recipe.imageUri }} style={styles.hero} resizeMode="cover" />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <Text style={{ fontSize: 64 }}>🍽</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Source banner */}
          {recipe.sourceUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(recipe.sourceUrl!)} style={styles.sourceBanner}>
              <Text style={styles.sourceBannerText}>{t('view_on')} {recipe.sourcePlatform} ↗</Text>
            </TouchableOpacity>
          )}

          {/* Title + Edit */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏ {t('edit_recipe')}</Text>
            </TouchableOpacity>
          </View>

          {/* Servings + Convert */}
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

          {/* Ingredients */}
          <Text style={styles.sectionLabel}>{t('ingredients')}</Text>
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
          {ingredients.length === 0 && (
            <Text style={styles.emptySection}>No ingredients added</Text>
          )}

          {/* Add to grocery */}
          {ingredients.length > 0 && (
            <TouchableOpacity style={styles.groceryBtn} onPress={handleAddToGroceries}>
              <Text style={styles.groceryBtnText}>🛒 Add to Grocery List</Text>
            </TouchableOpacity>
          )}

          {/* Instructions */}
          {steps.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('instructions')}</Text>
              {steps.map(step => (
                <View key={step.id} style={styles.stepRow}>
                  <Text style={styles.stepNum}>{step.order}</Text>
                  <Text style={styles.stepText}>{step.instruction}</Text>
                </View>
              ))}
            </>
          )}

          {/* Nutrition */}
          <Text style={styles.sectionLabel}>{t('nutrition')}</Text>
          <Text style={styles.nutritionPer}>{t('per_serving')}</Text>
          {!isPlusUser ? (
            <View style={styles.nutritionLocked}>
              <Text style={styles.nutritionLockedIcon}>👑</Text>
              <Text style={styles.nutritionLockedText}>
                {t('nutrition_plus').replace('Subscribe', '')}
                <Text style={styles.subscribeLink}>{t('subscribe')}</Text>
                {' to unlock ReciMe\'s nutrition calculator!'}
              </Text>
              <NutritionWidget cal={250} protein={20} carbs={30} fat={10} blurred />
            </View>
          ) : cal !== null ? (
            <NutritionWidget cal={cal} protein={protein!} carbs={carbs!} fat={fat!} />
          ) : (
            <Text style={styles.emptySection}>Nutrition info not available</Text>
          )}

          {/* Start cooking */}
          {steps.length > 0 && (
            <TouchableOpacity
              style={styles.startCookingBtn}
              onPress={() => router.push(`/recipe/${id}/cook`)}
            >
              <Text style={styles.startCookingText}>👨‍🍳 {t('start_cooking')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.reportLink}>
            <Text style={styles.reportLinkText}>{t('report_mistake')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function NutritionWidget({ cal, protein, carbs, fat, blurred }: { cal: number; protein: number; carbs: number; fat: number; blurred?: boolean }) {
  const { t } = useTranslation();
  const total = protein + carbs + fat || 1;
  const proteinDeg = (protein / total) * 283;
  const carbsDeg = (carbs / total) * 283;
  const SIZE = 100;
  const R = 40;
  const circumference = 2 * Math.PI * R;

  return (
    <View style={[styles.nutritionCard, blurred && { opacity: 0.3 }]}>
      <View style={styles.nutritionLeft}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={50} cy={50} r={R} stroke={Colors.border} strokeWidth={10} fill="none" />
          <Circle
            cx={50} cy={50} r={R}
            stroke={Colors.purple}
            strokeWidth={10} fill="none"
            strokeDasharray={`${proteinDeg} ${circumference - proteinDeg}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />
          <Circle
            cx={50} cy={50} r={R}
            stroke="#F59E0B"
            strokeWidth={10} fill="none"
            strokeDasharray={`${carbsDeg} ${circumference - carbsDeg}`}
            strokeDashoffset={circumference * 0.25 - proteinDeg}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.nutritionCalCenter}>
          <Text style={styles.nutritionCal}>{cal}</Text>
          <Text style={styles.nutritionCalLabel}>{t('calories')}</Text>
        </View>
      </View>
      <View style={styles.nutritionRight}>
        <MacroRow color={Colors.purple} label={t('protein')} value={`${protein}g`} />
        <MacroRow color="#F59E0B" label={t('carbs')} value={`${carbs}g`} />
        <MacroRow color="#10B981" label={t('fat')} value={`${fat}g`} />
      </View>
    </View>
  );
}

function MacroRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.macroRow}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroLabel}>{label}:</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

function categorize(name: string): string {
  const lower = name.toLowerCase();
  if (['lettuce','tomato','onion','spinach','broccoli','carrot','garlic','avocado','lemon','lime','pepper','mushroom'].some(k => lower.includes(k))) return 'FRESH PRODUCE';
  if (['chicken','beef','pork','bacon','salmon','shrimp','turkey','fish','pancetta'].some(k => lower.includes(k))) return 'MEAT & SEAFOOD';
  if (['milk','cheese','butter','cream','yogurt','egg'].some(k => lower.includes(k))) return 'DAIRY';
  if (['bread','flour','wrap','tortilla','bun'].some(k => lower.includes(k))) return 'BAKERY';
  return 'PANTRY';
}

const styles = StyleSheet.create({
  heroWrap: { position: 'relative' },
  hero: { width, height: 280 },
  heroPlaceholder: { backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 24, color: Colors.text, fontWeight: '300', lineHeight: 28 },
  body: { padding: 20, paddingBottom: 60 },
  sourceBanner: { backgroundColor: '#FFF9E6', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FED7AA' },
  sourceBannerText: { color: Colors.accent, fontSize: 14, fontWeight: '500' },
  titleRow: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  editBtnText: { fontSize: 13, color: Colors.muted, fontWeight: '500' },
  servingsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 8 },
  servBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  servBtnText: { fontSize: 18, color: Colors.text, lineHeight: 22 },
  servCount: { fontSize: 18, fontWeight: '700', color: Colors.text, minWidth: 28, textAlign: 'center' },
  servLabel: { fontSize: 15, color: Colors.muted, flex: 1 },
  convertBtn: { backgroundColor: Colors.purpleLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  convertBtnText: { color: Colors.purple, fontSize: 14, fontWeight: '600' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.accent, letterSpacing: 0.8, marginTop: 24, marginBottom: 12 },
  ingredientSection: { fontSize: 15, fontWeight: '700', color: Colors.text, marginVertical: 10 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  ingredientEmoji: { fontSize: 20, width: 32 },
  ingredientText: { flex: 1, fontSize: 15, lineHeight: 22 },
  ingredientAmount: { fontWeight: '400', color: Colors.muted },
  ingredientName: { fontWeight: '600', color: Colors.text },
  emptySection: { color: Colors.muted, fontSize: 14, marginBottom: 16 },
  groceryBtn: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, marginVertical: 12 },
  groceryBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  stepRow: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, color: '#fff', textAlign: 'center', lineHeight: 24, fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 15, color: Colors.text, lineHeight: 24 },
  nutritionPer: { fontSize: 13, color: Colors.muted, marginBottom: 12 },
  nutritionLocked: { marginBottom: 16 },
  nutritionLockedIcon: { fontSize: 20, marginBottom: 6 },
  nutritionLockedText: { fontSize: 14, color: Colors.muted, lineHeight: 20, marginBottom: 12 },
  subscribeLink: { color: Colors.accent, fontWeight: '600' },
  nutritionCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  nutritionLeft: { width: 100, height: 100, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  nutritionCalCenter: { position: 'absolute', alignItems: 'center' },
  nutritionCal: { fontSize: 22, fontWeight: '700', color: Colors.text },
  nutritionCalLabel: { fontSize: 11, color: Colors.muted },
  nutritionRight: { flex: 1, paddingLeft: 20, gap: 8 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroDot: { width: 10, height: 10, borderRadius: 5 },
  macroLabel: { fontSize: 14, color: Colors.muted, flex: 1 },
  macroValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
  startCookingBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 12 },
  startCookingText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  reportLink: { alignItems: 'center', marginTop: 8 },
  reportLinkText: { color: Colors.muted, fontSize: 13, textDecorationLine: 'underline' },
});
