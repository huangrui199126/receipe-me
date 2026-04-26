import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Dimensions, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, RefreshControl, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { useStore } from '../../store';
import ReciMeLogo from '../../components/ReciMeLogo';
import Button from '../../components/ui/Button';
import { E } from '../../constants/emoji';
import EmojiIcon, { EmojiImage } from '../../components/EmojiIcon';
import { IndexRecipe, fetchTrendingPage, fetchTrendingMeta, fetchRecipeDetail, fetchSearchIndex, clearTrendingCache } from '../../lib/trendingApi';
import { TrendingRecipe } from '../../lib/trendingRecipes';
import { Cookbook, Recipe, Ingredient, Step } from '../../db/schema';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

function hasCuisineKeyword(r: IndexRecipe, keywords: string[]): boolean {
  const haystack = [...(r.tags ?? []), r.title].join(' ').toLowerCase();
  return keywords.some(k => haystack.includes(k));
}

const FILTER_CHIPS = [
  { id: 'all',          label: 'All',          emoji: '🔥', match: (_: IndexRecipe) => true },
  { id: 'healthy',      label: 'Healthy',       emoji: '💚', match: (r: IndexRecipe) => r.healthScore >= 8 },
  { id: 'high-protein', label: 'High Protein',  emoji: '💪', match: (r: IndexRecipe) => (r.nutrition?.protein ?? 0) >= 30 },
  { id: 'low-cal',      label: 'Low Cal',       emoji: '🥗', match: (r: IndexRecipe) => (r.nutrition?.calories ?? 999) <= 400 },
  { id: 'chicken',      label: 'Chicken',       emoji: '🍗', match: (r: IndexRecipe) => r.tags?.some(t => t.toLowerCase().includes('chicken')) },
  { id: 'beef',         label: 'Beef',          emoji: '🥩', match: (r: IndexRecipe) => r.tags?.some(t => t.toLowerCase().includes('beef') || t.toLowerCase().includes('pork')) },
  { id: 'pasta',        label: 'Pasta',         emoji: '🍝', match: (r: IndexRecipe) => r.tags?.some(t => t.toLowerCase().includes('pasta') || t.toLowerCase().includes('noodle')) },
  { id: 'seafood',      label: 'Seafood',       emoji: '🐟', match: (r: IndexRecipe) => r.tags?.some(t => ['salmon','tuna','shrimp','fish','seafood'].some(k => t.toLowerCase().includes(k))) },
  { id: 'vegetarian',   label: 'Vegetarian',    emoji: '🥦', match: (r: IndexRecipe) => r.tags?.some(t => ['vegetarian','vegan','plant'].some(k => t.toLowerCase().includes(k))) },
  { id: 'chocolate',    label: 'Chocolate',     emoji: '🍫', match: (r: IndexRecipe) => r.tags?.some(t => t.toLowerCase().includes('chocolate')) },
  { id: 'spicy',        label: 'Spicy',         emoji: '🌶️', match: (r: IndexRecipe) => r.tags?.some(t => t.toLowerCase().includes('spicy') || t.toLowerCase().includes('chili')) },
  { id: 'breakfast',    label: 'Breakfast',     emoji: '🍳', match: (r: IndexRecipe) => r.tags?.some(t => ['breakfast','pancake','egg','waffle'].some(k => t.toLowerCase().includes(k))) },
  { id: 'dessert',      label: 'Dessert',       emoji: '🍰', match: (r: IndexRecipe) => r.tags?.some(t => ['dessert','cake','cookie','brownie','ice cream','fudge'].some(k => t.toLowerCase().includes(k))) },
];

const CUISINE_CHIPS = [
  { id: 'all',           label: 'All',           emoji: '🌍', match: (_: IndexRecipe) => true },
  { id: 'chinese',       label: 'Chinese',        emoji: '🥢', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['chinese','dim sum','wonton','fried rice','kung pao','mapo','dumplings','char siu','hotpot','congee','chow mein','peking']) },
  { id: 'indian',        label: 'Indian',         emoji: '🫓', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['indian','curry','masala','tikka','biryani','naan','dal','paneer','tandoori','samosa','chutney','vindaloo']) },
  { id: 'mexican',       label: 'Mexican',        emoji: '🌮', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['mexican','taco','burrito','enchilada','quesadilla','guacamole','salsa','fajita','tamale','nacho','tex-mex']) },
  { id: 'american',      label: 'American',       emoji: '🍔', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['american','burger','bbq','barbecue','mac and cheese','fried chicken','buffalo','biscuit','cornbread','chili']) },
  { id: 'italian',       label: 'Italian',        emoji: '🍕', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['italian','pizza','risotto','tiramisu','carbonara','bolognese','gnocchi','bruschetta','pesto','cannoli']) },
  { id: 'japanese',      label: 'Japanese',       emoji: '🍱', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['japanese','sushi','ramen','miso','teriyaki','tempura','soba','udon','onigiri','katsu','yakitori']) },
  { id: 'thai',          label: 'Thai',           emoji: '🍜', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['thai','pad thai','green curry','red curry','tom yum','satay','larb','som tum']) },
  { id: 'mediterranean', label: 'Mediterranean',  emoji: '🫒', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['mediterranean','greek','hummus','falafel','shawarma','kebab','tzatziki','pita','tabouleh','moussaka']) },
  { id: 'french',        label: 'French',         emoji: '🥐', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['french','croissant','quiche','ratatouille','baguette','crepe','boeuf','bouillabaisse','soufflé','coq au vin']) },
  { id: 'korean',        label: 'Korean',         emoji: '🥘', match: (r: IndexRecipe) => hasCuisineKeyword(r, ['korean','kimchi','bibimbap','bulgogi','tteok','japchae','doenjang','kimbap','gochujang']) },
];

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

function TrendingSegment({ searchQuery = '' }: { searchQuery?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cookbooks, recipes: savedRecipes, saveRecipe, addCookbook, userProfile, canPreviewRecipe, consumePreview } = useStore();
  const [items, setItems] = useState<IndexRecipe[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<TrendingRecipe | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [activeIngChip, setActiveIngChip] = useState('all');
  const [activeCuisineChip, setActiveCuisineChip] = useState('all');
  const [chipMode, setChipMode] = useState<'diet' | 'cuisine'>('diet');
  const [searchResults, setSearchResults] = useState<IndexRecipe[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const saved = new Set(
    savedRecipes
      .map(r => r.id.match(/^recipe_(tr_\d+)_/)?.[1])
      .filter((id): id is string => !!id)
  );

  useEffect(() => {
    (async () => {
      const [meta, page1] = await Promise.all([fetchTrendingMeta(), fetchTrendingPage(1)]);
      setTotalPages(meta.totalPages);
      setItems(page1);
      setCurrentPage(1);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    const q = searchQuery.toLowerCase();
    fetchSearchIndex().then(all => {
      const matches = all.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q)) ||
        r.sourcePlatform?.toLowerCase().includes(q)
      );
      setSearchResults(matches.slice(0, 200));
      setSearchLoading(false);
    });
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await clearTrendingCache();
    const { fetchTrendingMeta } = await import('../../lib/trendingApi');
    const [meta, page1] = await Promise.all([fetchTrendingMeta(), fetchTrendingPage(1)]);
    setTotalPages(meta.totalPages);
    setItems(page1);
    setCurrentPage(1);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || currentPage >= totalPages) return;
    setLoadingMore(true);
    const next = currentPage + 1;
    const newItems = await fetchTrendingPage(next);
    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
      setCurrentPage(next);
    }
    setLoadingMore(false);
  };

  const openPreview = (entry: IndexRecipe) => {
    if (!canPreviewRecipe()) { router.push('/paywall'); return; }
    consumePreview();
    setSavedRecipeId(null);
    setDetailError(false);
    setPreviewItem({ ...entry, servings: 0, prepTime: 0, cookTime: 0, ingredients: [], steps: [] });
    setDetailLoading(true);
    fetchRecipeDetail(entry.id).then(detail => {
      if (detail) setPreviewItem(detail); else setDetailError(true);
      setDetailLoading(false);
    });
  };

  const closePreview = () => {
    setPreviewItem(null);
    setSavedRecipeId(null);
    setImporting(null);
    setDetailLoading(false);
    setDetailError(false);
  };

  const handleSave = async () => {
    if (!previewItem || importing || detailLoading || detailError) return;
    setImporting(previewItem.id);
    let cookbookId = cookbooks[0]?.id ?? 'favorites';
    if (!cookbooks.find(c => c.id === cookbookId)) {
      const fav: Cookbook = {
        id: `cb_${Date.now()}`, name: 'Favorites', emoji: E.star,
        coverImages: [], createdAt: new Date().toISOString(),
      };
      await addCookbook(fav);
      cookbookId = fav.id;
    }
    const recipeId = `recipe_${previewItem.id}_${Date.now()}`;
    const recipe: Recipe = {
      id: recipeId, cookbookId, title: previewItem.title, imageUri: previewItem.image,
      servings: previewItem.servings, prepTime: previewItem.prepTime, cookTime: previewItem.cookTime,
      sourceUrl: null, sourcePlatform: previewItem.sourcePlatform,
      nutrition: previewItem.nutrition, tags: previewItem.tags, createdAt: new Date().toISOString(),
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

  const goals = userProfile?.goals ?? [];
  const ingChip = FILTER_CHIPS.find(c => c.id === activeIngChip) ?? FILTER_CHIPS[0];
  const cuisineChip = CUISINE_CHIPS.find(c => c.id === activeCuisineChip) ?? CUISINE_CHIPS[0];
  const displayItems = searchQuery.trim()
    ? searchResults
    : items.filter(r => ingChip.match(r) && cuisineChip.match(r));
  const ranked = goals.length > 0 && !searchQuery.trim()
    ? [...displayItems].sort((a, b) => {
        let sA = 0, sB = 0;
        if (goals.includes('healthy')) { sA += a.healthScore; sB += b.healthScore; }
        if (goals.includes('high-protein')) { sA += a.nutrition.protein / 10; sB += b.nutrition.protein / 10; }
        if (goals.includes('low-calorie')) { sA += (600 - a.nutrition.calories) / 100; sB += (600 - b.nutrition.calories) / 100; }
        return sB - sA;
      })
    : displayItems;

  if (loading) {
    return (
      <View style={tStyles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={tStyles.loadingText}>Loading trending...</Text>
      </View>
    );
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      {/* Compact filter area — hidden during search */}
      {!isSearching && (
        <View style={tStyles.filterWrap}>
          {/* Mode toggle */}
          <View style={tStyles.modeToggle}>
            <TouchableOpacity
              style={[tStyles.modeBtn, chipMode === 'diet' && tStyles.modeBtnActive]}
              onPress={() => setChipMode('diet')}
              activeOpacity={0.8}
            >
              <Text style={[tStyles.modeBtnText, chipMode === 'diet' && tStyles.modeBtnTextActive]}>Diet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[tStyles.modeBtn, chipMode === 'cuisine' && tStyles.modeBtnActive]}
              onPress={() => setChipMode('cuisine')}
              activeOpacity={0.8}
            >
              <Text style={[tStyles.modeBtnText, chipMode === 'cuisine' && tStyles.modeBtnTextActive]}>Cuisine</Text>
            </TouchableOpacity>
          </View>

          {/* Active filter summary — always visible when anything is selected */}
          {(activeIngChip !== 'all' || activeCuisineChip !== 'all') && (
            <View style={tStyles.activeSummaryRow}>
              {activeIngChip !== 'all' && (() => {
                const chip = FILTER_CHIPS.find(c => c.id === activeIngChip)!;
                return (
                  <TouchableOpacity
                    style={tStyles.activeTag}
                    onPress={() => setActiveIngChip('all')}
                    activeOpacity={0.75}
                  >
                    <Text style={tStyles.activeTagText}>{chip.emoji} {chip.label}</Text>
                    <Text style={tStyles.activeTagX}>×</Text>
                  </TouchableOpacity>
                );
              })()}
              {activeCuisineChip !== 'all' && (() => {
                const chip = CUISINE_CHIPS.find(c => c.id === activeCuisineChip)!;
                return (
                  <TouchableOpacity
                    style={tStyles.activeTag}
                    onPress={() => setActiveCuisineChip('all')}
                    activeOpacity={0.75}
                  >
                    <Text style={tStyles.activeTagText}>{chip.emoji} {chip.label}</Text>
                    <Text style={tStyles.activeTagX}>×</Text>
                  </TouchableOpacity>
                );
              })()}
              <TouchableOpacity
                onPress={() => { setActiveIngChip('all'); setActiveCuisineChip('all'); }}
              >
                <Text style={tStyles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Single chip row — swaps based on mode */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tStyles.chipsRow}
            style={tStyles.chipsScroll}
          >
            {(chipMode === 'diet' ? FILTER_CHIPS : CUISINE_CHIPS).map(chip => {
              const isActive = chipMode === 'diet'
                ? activeIngChip === chip.id
                : activeCuisineChip === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[tStyles.chip, isActive && tStyles.chipActive]}
                  onPress={() => chipMode === 'diet' ? setActiveIngChip(chip.id) : setActiveCuisineChip(chip.id)}
                  activeOpacity={0.75}
                >
                  <Text style={tStyles.chipEmoji}>{chip.emoji}</Text>
                  <Text style={[tStyles.chipLabel, isActive && tStyles.chipLabelActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Status row — search result count OR active filter count */}
      {isSearching ? (
        <View style={tStyles.searchStatusRow}>
          {searchLoading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={tStyles.searchStatusText}>
                {searchResults.length === 0 ? 'No results' : `${searchResults.length} recipes found`}
              </Text>
          }
        </View>
      ) : (activeIngChip !== 'all' || activeCuisineChip !== 'all') && (
        <View style={tStyles.searchStatusRow}>
          <Text style={tStyles.searchStatusText}>{ranked.length} recipes match</Text>
        </View>
      )}

      <FlatList
        data={ranked}
        keyExtractor={item => item.id}
        numColumns={2}
        style={tStyles.flatList}
        contentContainerStyle={tStyles.list}
        columnWrapperStyle={tStyles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={tStyles.emptyWrap}>
            <Text style={tStyles.emptyEmoji}>🔍</Text>
            <Text style={tStyles.emptyText}>No recipes found</Text>
            <Text style={tStyles.emptySubtext}>Try a different filter combination or scroll down to load more</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            : <View style={{ height: 20 }} />
        }
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        renderItem={({ item }) => {
          const isSaved = saved.has(item.id);
          return (
            <TouchableOpacity
              style={tStyles.card}
              onPress={() => openPreview(item)}
              activeOpacity={0.85}
            >
              <View style={tStyles.imageWrap}>
                <Image source={{ uri: item.image }} style={tStyles.image} contentFit="cover" />
                {isSaved && (
                  <View style={tStyles.savedOverlay}>
                    <Text style={tStyles.savedCheck}>✓ Saved</Text>
                  </View>
                )}
              </View>
              <View style={tStyles.cardBody}>
                <Text style={tStyles.source}>{item.sourcePlatform}</Text>
                <Text style={tStyles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <HealthBadge score={item.healthScore} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Inline preview modal */}
      <Modal
        visible={!!previewItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closePreview}
      >
        {previewItem && (
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={[tStyles.modalHeader, { paddingTop: insets.top + 8 }]}>
              <ReciMeLogo size={20} />
              <TouchableOpacity onPress={closePreview}>
                <Text style={tStyles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={tStyles.sourceBanner}>
              <Text style={tStyles.sourceBannerText}>From {previewItem.sourcePlatform}  ↗</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
              <View style={tStyles.heroRow}>
                <Image source={{ uri: previewItem.image }} style={tStyles.heroImg} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={tStyles.heroTitle}>{previewItem.title.toUpperCase()}</Text>
                  <View style={tStyles.heroMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <EmojiIcon name="timer" size={12} />
                      <Text style={tStyles.heroMetaText}>{detailLoading ? '…' : `${previewItem.prepTime + previewItem.cookTime} min`}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <EmojiIcon name="plate" size={12} />
                      <Text style={tStyles.heroMetaText}>{detailLoading ? '…' : `${previewItem.servings} servings`}</Text>
                    </View>
                  </View>
                  <HealthBadge score={previewItem.healthScore} />
                </View>
              </View>

              <View style={tStyles.divider} />
              <View style={tStyles.nutritionBand}>
                {[
                  { label: 'Calories', value: `${previewItem.nutrition.calories}` },
                  { label: 'Protein', value: `${previewItem.nutrition.protein}g` },
                  { label: 'Carbs', value: `${previewItem.nutrition.carbs}g` },
                  { label: 'Fat', value: `${previewItem.nutrition.fat}g` },
                ].map(n => (
                  <View key={n.label} style={tStyles.nutritionCell}>
                    <Text style={tStyles.nutritionVal}>{n.value}</Text>
                    <Text style={tStyles.nutritionLbl}>{n.label}</Text>
                  </View>
                ))}
              </View>
              <View style={tStyles.divider} />

              <Text style={tStyles.sectionLabel}>INGREDIENTS</Text>
              {detailLoading ? (
                <View style={tStyles.detailPlaceholder}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={tStyles.detailPlaceholderText}>Loading recipe…</Text>
                </View>
              ) : detailError ? (
                <View style={tStyles.detailPlaceholder}>
                  <Text style={tStyles.detailErrorText}>Couldn't load recipe details.</Text>
                </View>
              ) : previewItem.ingredients.map((ing, i) => (
                <View key={i} style={tStyles.ingRow}>
                  <View style={{ width: 28, alignItems: 'center' }}><EmojiImage emoji={ing.emoji} size={20} /></View>
                  <Text style={tStyles.ingAmount}>{ing.amount} {ing.unit}</Text>
                  <Text style={tStyles.ingName}>{ing.name}</Text>
                </View>
              ))}

              <View style={tStyles.divider} />
              <Text style={tStyles.sectionLabel}>STEPS</Text>
              {!detailLoading && !detailError && previewItem.steps.map((s, i) => (
                <View key={i} style={tStyles.stepRow}>
                  <View style={tStyles.stepNum}>
                    <Text style={tStyles.stepNumText}>{s.order}</Text>
                  </View>
                  <Text style={tStyles.stepText}>{s.instruction}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={[tStyles.saveBar, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity
                style={[tStyles.modalSaveBtn, (importing === previewItem.id || detailLoading || detailError) && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={importing !== null || !!savedRecipeId || detailLoading || detailError}
              >
                {importing === previewItem.id
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={tStyles.modalSaveBtnText}>{savedRecipeId ? 'Saved!' : detailLoading ? 'Loading…' : 'Save recipe'}</Text>}
              </TouchableOpacity>
            </View>

            {savedRecipeId && (
              <View style={tStyles.successOverlay}>
                <View style={tStyles.successCard}>
                  <EmojiIcon name="chef" size={64} />
                  <Text style={tStyles.successTitle}>Recipe saved!</Text>
                  <TouchableOpacity style={tStyles.openBtn} onPress={() => { closePreview(); router.push(`/recipe/${savedRecipeId}`); }}>
                    <Text style={tStyles.openBtnText}>{String.fromCodePoint(0x2197)}  Open recipe</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={tStyles.doneBtn} onPress={closePreview}>
                    <Text style={tStyles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </Modal>
    </>
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
        <EmojiIcon name="search" size={18} />
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
              <EmojiIcon name="fire" size={16} /> {t('trending_tab')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content area */}
      {search.length > 0 ? (
        <View style={styles.flex}>
          <TrendingSegment searchQuery={search} />
        </View>
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
        <View style={styles.flex}>
          <TrendingSegment />
        </View>
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
  flatList: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.muted, fontSize: 15 },
  filterWrap: { marginBottom: 8 },
  modeToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 6 },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#E8E4DC',
  },
  modeBtnActive: { backgroundColor: Colors.text },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  modeBtnTextActive: { color: '#fff' },
  activeSummaryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 8, flexWrap: 'wrap' },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 1.5, borderColor: Colors.primary },
  activeTagText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  activeTagX: { fontSize: 14, fontWeight: '700', color: Colors.primary, lineHeight: 16 },
  clearAllText: { fontSize: 12, fontWeight: '600', color: Colors.muted },
  chipsScroll: { flexGrow: 0, marginBottom: 4 },
  chipsRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: Colors.text },
  chipLabelActive: { color: '#fff' },
  searchStatusRow: { paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  searchStatusText: { fontSize: 13, color: Colors.muted },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 8 },
  emptyEmoji: { fontSize: 40, marginBottom: 4 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySubtext: { fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
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
  // Preview modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalCancel: { fontSize: 16, color: Colors.text },
  sourceBanner: { backgroundColor: '#FEFCE8', paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
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
  detailPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 24 },
  detailPlaceholderText: { fontSize: 14, color: Colors.muted },
  detailErrorText: { fontSize: 14, color: '#EF4444' },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, gap: 10 },
  ingEmoji: { fontSize: 20, width: 28 },
  ingAmount: { fontSize: 14, fontWeight: '700', color: Colors.text, minWidth: 60 },
  ingName: { flex: 1, fontSize: 14, color: Colors.text },
  stepRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 14, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22, color: Colors.text },
  saveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  modalSaveBtn: { height: 48, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  modalSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  successCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 32, paddingTop: 32, paddingBottom: 48, alignItems: 'center' },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 24, marginTop: 8 },
  openBtn: { width: '100%', height: 52, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  openBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBtn: { paddingVertical: 8 },
  doneBtnText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
});
