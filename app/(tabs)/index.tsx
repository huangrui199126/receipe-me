import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Dimensions, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, RefreshControl, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { useStore } from '../../store';
import ReciMeLogo from '../../components/ReciMeLogo';
import Button from '../../components/ui/Button';
import { E } from '../../constants/emoji';
import { fetchTrendingRecipes, refreshTrendingRecipes } from '../../lib/trendingApi';
import { TrendingRecipe } from '../../lib/trendingRecipes';
import { Cookbook, Recipe, Ingredient, Step } from '../../db/schema';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ── Cookbook Card (ML Challenges style) ─────────────────────────────────────

const COOKBOOK_COLORS = [
  Colors.primary, Colors.accent, '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
];

function CookbookCard({
  cookbook, recipeCount, onPress, index,
}: {
  cookbook: Cookbook; recipeCount: number; onPress: () => void; index: number;
}) {
  const color = COOKBOOK_COLORS[index % COOKBOOK_COLORS.length];
  const barWidth = Math.min(100, Math.max(10, recipeCount * 15));

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.75}>
      <Text style={cardStyles.emoji}>{cookbook.emoji || E.books}</Text>
      <Text style={cardStyles.name} numberOfLines={2}>{cookbook.name}</Text>
      <Text style={cardStyles.count}>{recipeCount} {recipeCount === 1 ? 'Recipe' : 'Recipes'}</Text>
      <View style={cardStyles.barTrack}>
        <View style={[cardStyles.barFill, { width: `${barWidth}%`, backgroundColor: color }]} />
      </View>
    </TouchableOpacity>
  );
}

function NewCookbookCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={[cardStyles.card, cardStyles.newCard]} onPress={onPress} activeOpacity={0.75}>
      <View style={cardStyles.plusCircle}>
        <Text style={cardStyles.plusText}>+</Text>
      </View>
      <Text style={cardStyles.newLabel}>New cookbook</Text>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 18,
    padding: 16, minHeight: 140,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    marginBottom: 12,
  },
  emoji: { fontSize: 38, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6, lineHeight: 22 },
  count: { fontSize: 13, color: Colors.muted, marginBottom: 12 },
  barTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  barFill: { height: 4, borderRadius: 2 },
  newCard: { justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', backgroundColor: '#fff' },
  plusCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  plusText: { fontSize: 26, color: Colors.primary, fontWeight: '300', lineHeight: 28 },
  newLabel: { fontSize: 14, color: Colors.muted, fontWeight: '600' },
});

// ── Trending Segment ─────────────────────────────────────────────────────────

function HealthBadge({ score }: { score: number }) {
  const color = score >= 8 ? '#16A34A' : score >= 5 ? '#F59E0B' : '#EF4444';
  const label = score >= 8 ? 'Healthy' : score >= 5 ? 'Balanced' : 'Indulgent';
  return (
    <View style={[tStyles.badge, { backgroundColor: color }]}>
      <Text style={tStyles.badgeText}>{label} {score}/10</Text>
    </View>
  );
}

function TrendingSegment() {
  const router = useRouter();
  const { cookbooks, recipes: savedRecipes, saveRecipe, addCookbook, userProfile } = useStore();
  const [recipes, setRecipes] = useState<TrendingRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const saved = new Set(
    savedRecipes
      .map(r => r.id.match(/^recipe_(tr_\d+)_/)?.[1])
      .filter((id): id is string => !!id)
  );

  useEffect(() => {
    fetchTrendingRecipes().then(r => { setRecipes(r); setLoading(false); });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    const r = await refreshTrendingRecipes();
    setRecipes(r);
    setRefreshing(false);
  };

  const handleSave = async (item: TrendingRecipe) => {
    if (importing) return;
    setImporting(item.id);
    let cookbookId = cookbooks[0]?.id ?? 'favorites';
    if (!cookbooks.find(c => c.id === cookbookId)) {
      const fav: Cookbook = {
        id: `cb_${Date.now()}`, name: 'Favorites', emoji: E.star,
        coverImages: [], createdAt: new Date().toISOString(),
      };
      await addCookbook(fav);
      cookbookId = fav.id;
    }
    const recipeId = `recipe_${item.id}_${Date.now()}`;
    const recipe: Recipe = {
      id: recipeId, cookbookId, title: item.title, imageUri: item.image,
      servings: item.servings, prepTime: item.prepTime, cookTime: item.cookTime,
      sourceUrl: null, sourcePlatform: item.sourcePlatform,
      nutrition: item.nutrition, tags: item.tags, createdAt: new Date().toISOString(),
    };
    const ingredients: Ingredient[] = item.ingredients.map((ing, i) => ({
      id: `ing_${recipeId}_${i}`, recipeId, section: ing.section,
      name: ing.name, amount: ing.amount, unit: ing.unit, emoji: ing.emoji, order: i,
    }));
    const steps: Step[] = item.steps.map(s => ({
      id: `step_${recipeId}_${s.order}`, recipeId,
      order: s.order, instruction: s.instruction, imageUri: s.imageUri,
    }));
    await saveRecipe(recipe, ingredients, steps);
    setImporting(null);
    Alert.alert('Saved!', `"${item.title}" added to your cookbook.`);
  };

  const goals = userProfile?.goals ?? [];
  const ranked = [...recipes].sort((a, b) => {
    let sA = 0, sB = 0;
    if (goals.includes('healthy')) { sA += a.healthScore; sB += b.healthScore; }
    if (sA !== sB) return sB - sA;
    return (parseInt(a.id.replace(/\D/g, '')) || 0) - (parseInt(b.id.replace(/\D/g, '')) || 0);
  });

  if (loading) {
    return (
      <View style={tStyles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={tStyles.loadingText}>Loading trending...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={ranked}
      keyExtractor={item => item.id}
      numColumns={2}
      contentContainerStyle={tStyles.list}
      columnWrapperStyle={tStyles.row}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      renderItem={({ item }) => {
        const isSaved = saved.has(item.id);
        const isImporting = importing === item.id;
        return (
          <TouchableOpacity
            style={tStyles.card}
            onPress={() => router.push('/trending')}
            activeOpacity={0.85}
          >
            <View style={tStyles.imageWrap}>
              <Image source={{ uri: item.image }} style={tStyles.image} contentFit="cover" />
              {isSaved && (
                <View style={tStyles.savedOverlay}>
                  <Text style={tStyles.savedCheck}>{E.check} Saved</Text>
                </View>
              )}
            </View>
            <View style={tStyles.cardBody}>
              <Text style={tStyles.source}>{item.sourcePlatform}</Text>
              <Text style={tStyles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <HealthBadge score={item.healthScore} />
              <TouchableOpacity
                style={[tStyles.saveBtn, (isSaved || isImporting) && { opacity: 0.5 }]}
                onPress={() => handleSave(item)}
                disabled={isSaved || isImporting}
              >
                {isImporting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={tStyles.saveBtnText}>{isSaved ? 'Saved' : '+ Save'}</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ── Main Cookbooks Tab ────────────────────────────────────────────────────────

export default function CookbooksTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { cookbooks, recipes, addCookbook } = useStore();
  const [search, setSearch] = useState('');
  const [activeSegment, setActiveSegment] = useState<'collection' | 'trending'>('collection');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');

  const filteredRecipes = search
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleCreateCookbook = async () => {
    if (!newName.trim()) return;
    await addCookbook({
      id: `cb_${Date.now()}`,
      name: newName.trim(),
      emoji: newEmoji.trim() || E.books,
      coverImages: [],
      createdAt: new Date().toISOString(),
    });
    setNewName('');
    setNewEmoji('');
    setShowNewModal(false);
  };

  const getRecipeCount = (cookbookId: string) =>
    recipes.filter(r => r.cookbookId === cookbookId).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <ReciMeLogo size={22} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>{String.fromCodePoint(0x1F50D)}</Text>
        <TextInput
          style={styles.search}
          placeholder={t('search_recipes')}
          placeholderTextColor={Colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>{String.fromCodePoint(0x2715)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented control */}
      {!search && (
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segment, activeSegment === 'collection' && styles.segmentActive]}
            onPress={() => setActiveSegment('collection')}
          >
            <Text style={[styles.segmentText, activeSegment === 'collection' && styles.segmentTextActive]}>
              {t('collection')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, activeSegment === 'trending' && styles.segmentActive]}
            onPress={() => setActiveSegment('trending')}
          >
            <Text style={[styles.segmentText, activeSegment === 'trending' && styles.segmentTextActive]}>
              {E.fire} {t('trending_tab')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search results */}
      {search.length > 0 ? (
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          {filteredRecipes.length === 0 ? (
            <Text style={styles.noResults}>No recipes found for "{search}"</Text>
          ) : (
            filteredRecipes.map(r => (
              <TouchableOpacity key={r.id} style={styles.searchResult} onPress={() => router.push(`/recipe/${r.id}`)}>
                <Text style={styles.searchResultText}>{r.title}</Text>
                <Text style={styles.chevron}>{'\u203A'}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : activeSegment === 'collection' ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            <NewCookbookCard onPress={() => setShowNewModal(true)} />
            {cookbooks.map((cb, i) => (
              <CookbookCard
                key={cb.id}
                cookbook={cb}
                recipeCount={getRecipeCount(cb.id)}
                index={i}
                onPress={() => router.push(`/cookbook/${cb.id}`)}
              />
            ))}
          </View>

          {cookbooks.length === 0 && (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyHintText}>
                Tap + to create your first cookbook, then import recipes using the button below
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <TrendingSegment />
      )}

      {/* New Cookbook Modal */}
      {showNewModal && (
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>New Cookbook</Text>

              <TextInput
                style={[styles.modalInput, { marginBottom: 10 }]}
                placeholder="Emoji (e.g. pasta)"
                placeholderTextColor={Colors.muted}
                value={newEmoji}
                onChangeText={setNewEmoji}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Cookbook name (e.g. Dinner Favorites)"
                placeholderTextColor={Colors.muted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={() => { setShowNewModal(false); setNewName(''); setNewEmoji(''); }} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Button label="Create" onPress={handleCreateCookbook} style={styles.createBtn} disabled={!newName.trim()} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0EDE8' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8E4DC', borderRadius: 14,
    paddingHorizontal: 14, marginHorizontal: 16, marginBottom: 10,
  },
  searchIcon: { fontSize: 15, marginRight: 8, color: Colors.muted },
  search: { flex: 1, height: 44, fontSize: 15, color: Colors.text },
  clearBtn: { fontSize: 16, color: Colors.muted, padding: 4 },
  // Segment
  segmentWrap: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#E2DDD5', borderRadius: 12, padding: 3, marginBottom: 12,
  },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.muted },
  segmentTextActive: { color: Colors.text, fontWeight: '700' },
  // Grid
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  emptyHint: { marginTop: 12, paddingHorizontal: 8 },
  emptyHintText: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
  // Search results
  noResults: { color: Colors.muted, textAlign: 'center', marginTop: 40, fontSize: 15 },
  searchResult: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 8, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  searchResultText: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  chevron: { fontSize: 18, color: Colors.muted },
  // Modal
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  modalInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: Colors.border },
  cancelText: { fontSize: 16, fontWeight: '600', color: Colors.muted },
  createBtn: { flex: 1 },
});

const tStyles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.muted, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  imageWrap: { aspectRatio: 1.2, position: 'relative' },
  image: { width: '100%', height: '100%' },
  savedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22,163,74,0.65)', justifyContent: 'center', alignItems: 'center' },
  savedCheck: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cardBody: { padding: 10 },
  source: { fontSize: 10, color: Colors.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, lineHeight: 18, marginBottom: 5 },
  badge: { flexDirection: 'row', alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, marginBottom: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
