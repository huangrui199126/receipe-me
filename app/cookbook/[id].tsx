import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { useStore } from '../../store';
import RecipeCard from '../../components/RecipeCard';
import { getRecommendedRecipes } from '../../lib/recommendations';

export default function CookbookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { cookbooks, recipes, userProfile, deleteCookbook } = useStore();

  const cookbook = cookbooks.find(c => c.id === id);
  const cookbookRecipes = recipes.filter(r => r.cookbookId === id);
  const recommended = getRecommendedRecipes(cookbookRecipes, userProfile);

  if (!cookbook) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {cookbook.emoji ? `${cookbook.emoji} ` : ''}{cookbook.name}
        </Text>
        <TouchableOpacity onPress={() => router.push('/import')} style={styles.addBtn}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recommended}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽</Text>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptySub}>Tap + to import a recipe</Text>
            <TouchableOpacity style={styles.importBtn} onPress={() => router.push('/import')}>
              <Text style={styles.importBtnText}>Import Recipe</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  backText: { fontSize: 28, color: Colors.text, fontWeight: '300' },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.text },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  addText: { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 26 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 15, color: Colors.muted, marginBottom: 24 },
  importBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  importBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
