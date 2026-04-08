import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../../../store';
import { Ingredient, Step, NutritionInfo } from '../../../db/schema';
import * as Storage from '../../../db/storage';
import { Colors } from '../../../constants/colors';

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipes, cookbooks, saveRecipe } = useStore();

  const isNew = id === 'new';
  const recipe = isNew ? null : recipes.find(r => r.id === id);

  // Recipe fields
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [imageUri, setImageUri] = useState(recipe?.imageUri ?? '');
  const [cookbookId, setCookbookId] = useState(recipe?.cookbookId ?? '');
  const [servings, setServings] = useState(String(recipe?.servings ?? 4));
  const [prepTime, setPrepTime] = useState(String(recipe?.prepTime ?? 0));
  const [cookTime, setCookTime] = useState(String(recipe?.cookTime ?? 0));
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl ?? '');

  // Nutrition
  const [calories, setCalories] = useState(String(recipe?.nutrition?.calories ?? ''));
  const [protein, setProtein] = useState(String(recipe?.nutrition?.protein ?? ''));
  const [carbs, setCarbs] = useState(String(recipe?.nutrition?.carbs ?? ''));
  const [fat, setFat] = useState(String(recipe?.nutrition?.fat ?? ''));

  // Ingredients & steps
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);

  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'info' | 'nutrition' | 'cookbooks' | null>(null);

  useEffect(() => {
    if (id) {
      Storage.getIngredientsByRecipe(id).then(setIngredients);
      Storage.getStepsByRecipe(id).then(setSteps);
    }
  }, [id]);

  if (!isNew && !recipe) return null;

  // ── Image picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
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
      setImageUri(result.assets[0].uri);
    }
  };

  // ── Step image picker ─────────────────────────────────────────────────────
  const pickStepImage = async (stepIdx: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to add a step photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const updated = [...steps];
      updated[stepIdx] = { ...updated[stepIdx], imageUri: result.assets[0].uri };
      setSteps(updated);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Title required'); return; }
    setSaving(true);
    try {
      const nutrition: NutritionInfo | null = (calories || protein || carbs || fat) ? {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      } : recipe.nutrition;

      const newId = isNew ? `recipe_${Date.now()}` : (recipe?.id ?? `recipe_${Date.now()}`);
      const updated = {
        id: newId,
        cookbookId: cookbookId || cookbooks[0]?.id || `cb_default`,
        title: title.trim(),
        imageUri,
        servings: Number(servings) || 4,
        prepTime: Number(prepTime) || 0,
        cookTime: Number(cookTime) || 0,
        sourceUrl: sourceUrl || null,
        sourcePlatform: recipe?.sourcePlatform ?? null,
        nutrition,
        tags: recipe?.tags ?? [],
        createdAt: recipe?.createdAt ?? new Date().toISOString(),
      };
      await saveRecipe(updated, ingredients.map(ing => ({ ...ing, recipeId: newId })), steps.map(s => ({ ...s, recipeId: newId })));
      if (isNew) router.replace(`/recipe/${newId}`); else
      router.back();
    } catch (e) {
      Alert.alert('Save failed', String(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Ingredient helpers ────────────────────────────────────────────────────
  const updateIngredient = (idx: number, patch: Partial<Ingredient>) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], ...patch };
    setIngredients(updated);
  };

  const addIngredient = () => {
    const newIng: Ingredient = {
      id: `ing_${Date.now()}`,
      recipeId: id!,
      section: '',
      name: '',
      amount: '',
      unit: '',
      emoji: '',
      order: ingredients.length,
    };
    setIngredients([...ingredients, newIng]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  // ── Step helpers ──────────────────────────────────────────────────────────
  const updateStep = (idx: number, patch: Partial<Step>) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], ...patch };
    setSteps(updated);
  };

  const addStep = () => {
    const newStep: Step = {
      id: `step_${Date.now()}`,
      recipeId: id!,
      order: steps.length + 1,
      instruction: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Edit Recipe'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.headerSave}>Save</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <View style={styles.row}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Recipe title"
              placeholderTextColor={Colors.muted}
            />
          </View>

          {/* Image */}
          <TouchableOpacity style={styles.row} onPress={pickImage}>
            <Text style={styles.rowLabel}>Image</Text>
            <View style={styles.rowRight}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.thumb} />
              ) : (
                <Text style={styles.rowMuted}>Tap to add photo</Text>
              )}
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Cookbooks */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setExpandedSection(expandedSection === 'cookbooks' ? null : 'cookbooks')}
          >
            <Text style={styles.rowLabel}>Cookbooks</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>
                {cookbooks.find(c => c.id === cookbookId)?.name ?? 'Uncategorized'}
              </Text>
              <Text style={styles.chevron}>{expandedSection === 'cookbooks' ? '⌄' : '›'}</Text>
            </View>
          </TouchableOpacity>
          {expandedSection === 'cookbooks' && (
            <View style={styles.expandedBox}>
              {cookbooks.map(cb => (
                <TouchableOpacity key={cb.id} style={styles.pickRow} onPress={() => { setCookbookId(cb.id); setExpandedSection(null); }}>
                  <Text style={[styles.pickLabel, cookbookId === cb.id && styles.pickLabelSelected]}>
                    {cb.emoji} {cb.name}
                  </Text>
                  {cookbookId === cb.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Info */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setExpandedSection(expandedSection === 'info' ? null : 'info')}
          >
            <Text style={styles.rowLabel}>Info</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowMuted} numberOfLines={1}>
                {servings} serves{sourceUrl ? `, ${sourceUrl.slice(0, 20)}…` : ''}
              </Text>
              <Text style={styles.chevron}>{expandedSection === 'info' ? '⌄' : '›'}</Text>
            </View>
          </TouchableOpacity>
          {expandedSection === 'info' && (
            <View style={styles.expandedBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Servings</Text>
                <TextInput style={styles.infoInput} value={servings} onChangeText={setServings} keyboardType="number-pad" placeholder="4" placeholderTextColor={Colors.muted} />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Prep time (min)</Text>
                <TextInput style={styles.infoInput} value={prepTime} onChangeText={setPrepTime} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.muted} />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cook time (min)</Text>
                <TextInput style={styles.infoInput} value={cookTime} onChangeText={setCookTime} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.muted} />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Source URL</Text>
                <TextInput style={[styles.infoInput, { flex: 1 }]} value={sourceUrl} onChangeText={setSourceUrl} placeholder="https://..." placeholderTextColor={Colors.muted} autoCapitalize="none" />
              </View>
            </View>
          )}

          {/* Nutrition */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setExpandedSection(expandedSection === 'nutrition' ? null : 'nutrition')}
          >
            <Text style={styles.rowLabel}>Nutrition</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowMuted}>{calories ? `${calories} cal` : 'Tap to edit'}</Text>
              <Text style={styles.chevron}>{expandedSection === 'nutrition' ? '⌄' : '›'}</Text>
            </View>
          </TouchableOpacity>
          {expandedSection === 'nutrition' && (
            <View style={styles.expandedBox}>
              {[
                { label: 'Calories', value: calories, set: setCalories },
                { label: 'Protein (g)', value: protein, set: setProtein },
                { label: 'Carbs (g)', value: carbs, set: setCarbs },
                { label: 'Fat (g)', value: fat, set: setFat },
              ].map(({ label, value, set }) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <TextInput style={styles.infoInput} value={value} onChangeText={set} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.muted} />
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>INGREDIENTS</Text>
            <TouchableOpacity onPress={addIngredient}>
              <Text style={styles.addBtn}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {ingredients.map((ing, idx) => (
            <View key={ing.id} style={styles.ingRow}>
              <View style={styles.ingFields}>
                <TextInput
                  style={[styles.ingInput, { width: 44 }]}
                  value={ing.emoji}
                  onChangeText={v => updateIngredient(idx, { emoji: v })}
                  placeholder="🥑"
                  placeholderTextColor={Colors.muted}
                />
                <TextInput
                  style={[styles.ingInput, { width: 56 }]}
                  value={ing.amount}
                  onChangeText={v => updateIngredient(idx, { amount: v })}
                  placeholder="200"
                  placeholderTextColor={Colors.muted}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.ingInput, { width: 60 }]}
                  value={ing.unit}
                  onChangeText={v => updateIngredient(idx, { unit: v })}
                  placeholder="g"
                  placeholderTextColor={Colors.muted}
                />
                <TextInput
                  style={[styles.ingInput, { flex: 1 }]}
                  value={ing.name}
                  onChangeText={v => updateIngredient(idx, { name: v })}
                  placeholder="Ingredient name"
                  placeholderTextColor={Colors.muted}
                />
              </View>
              <TouchableOpacity onPress={() => removeIngredient(idx)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Steps */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>INSTRUCTIONS</Text>
            <TouchableOpacity onPress={addStep}>
              <Text style={styles.addBtn}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {steps.map((step, idx) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepTop}>
                <View style={styles.stepNumBadge}><Text style={styles.stepNum}>{idx + 1}</Text></View>
                <TouchableOpacity onPress={() => removeStep(idx)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.stepInput}
                value={step.instruction}
                onChangeText={v => updateStep(idx, { instruction: v })}
                placeholder="Describe this step…"
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={3}
              />
              {/* Step image */}
              <TouchableOpacity style={styles.stepImgPicker} onPress={() => pickStepImage(idx)}>
                {step.imageUri ? (
                  <Image source={{ uri: step.imageUri }} style={styles.stepImg} />
                ) : (
                  <View style={styles.stepImgPlaceholder}>
                    <Text style={styles.stepImgIcon}>📷</Text>
                    <Text style={styles.stepImgLabel}>Add photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  headerCancel: { fontSize: 16, color: Colors.muted },
  headerTitle: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 12 },
  headerSave: { fontSize: 16, fontWeight: '600', color: Colors.primary },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowLabel: { fontSize: 16, color: Colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 16, color: Colors.muted },
  rowMuted: { fontSize: 14, color: Colors.muted, maxWidth: 180 },
  chevron: { fontSize: 20, color: Colors.muted },
  thumb: { width: 44, height: 44, borderRadius: 6 },

  titleInput: {
    flex: 1, fontSize: 17, fontWeight: '600', color: Colors.text,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },

  expandedBox: {
    backgroundColor: '#FAFAF8', borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickLabel: { fontSize: 16, color: Colors.text },
  pickLabelSelected: { color: Colors.primary, fontWeight: '600' },
  checkmark: { fontSize: 18, color: Colors.primary },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: 15, color: Colors.text },
  infoInput: {
    fontSize: 15, color: Colors.text, textAlign: 'right',
    minWidth: 80, padding: 4,
  },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.accent, letterSpacing: 0.8 },
  addBtn: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  ingRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  ingFields: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  ingInput: {
    fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 6, backgroundColor: '#fff',
  },
  deleteBtn: { padding: 8, marginLeft: 4 },
  deleteBtnText: { fontSize: 16, color: '#EF4444' },

  stepCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  stepTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  stepNumBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stepInput: {
    fontSize: 15, color: Colors.text, lineHeight: 22,
    textAlignVertical: 'top', minHeight: 60, marginBottom: 10,
  },
  stepImgPicker: { borderRadius: 8, overflow: 'hidden' },
  stepImg: { width: '100%', height: 160, borderRadius: 8 },
  stepImgPlaceholder: {
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: 8, height: 72, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  stepImgIcon: { fontSize: 18 },
  stepImgLabel: { fontSize: 14, color: Colors.muted },
});
