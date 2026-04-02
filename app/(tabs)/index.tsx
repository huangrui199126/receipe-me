import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Dimensions, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { useStore } from '../../store';
import CookbookCard from '../../components/CookbookCard';
import ReciMeLogo from '../../components/ReciMeLogo';
import Button from '../../components/ui/Button';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function CookbooksTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { cookbooks, recipes, addCookbook } = useStore();
  const [search, setSearch] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');

  const filteredRecipes = search
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleCreateCookbook = async () => {
    if (!newName.trim()) return;
    await addCookbook({
      id: `cb_${Date.now()}`,
      name: newName.trim(),
      emoji: '',
      coverImages: [],
      createdAt: new Date().toISOString(),
    });
    setNewName('');
    setShowNewModal(false);
  };

  const getRecipeCount = (cookbookId: string) =>
    recipes.filter(r => r.cookbookId === cookbookId).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <ReciMeLogo size={22} />
        <View style={styles.headerRight}>
          <Text style={styles.badge}>⚡</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tutorial banner */}
        {showBanner && (
          <TouchableOpacity style={styles.banner} onPress={() => setShowBanner(false)}>
            <View>
              <Text style={styles.bannerTitle}>{t('import_faster')}</Text>
              <Text style={styles.bannerSub}>⏱ {t('import_tutorial')}</Text>
            </View>
            <Text style={styles.bannerChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.search}
            placeholder={t('search_recipes')}
            placeholderTextColor={Colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Search results */}
        {search.length > 0 && (
          <View>
            {filteredRecipes.length === 0 ? (
              <Text style={styles.noResults}>No recipes found</Text>
            ) : (
              filteredRecipes.map(r => (
                <TouchableOpacity key={r.id} style={styles.searchResult} onPress={() => router.push(`/recipe/${r.id}`)}>
                  <Text style={styles.searchResultText}>{r.title}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Cookbooks section */}
        {!search && (
          <>
            <TouchableOpacity style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('cookbooks_title')} ∨</Text>
            </TouchableOpacity>

            <View style={styles.grid}>
              {/* New cookbook card */}
              <TouchableOpacity
                style={[styles.newCard, { width: CARD_WIDTH }]}
                onPress={() => setShowNewModal(true)}
              >
                <Text style={styles.newPlus}>+</Text>
                <Text style={styles.newLabel}>{t('new_cookbook')}</Text>
              </TouchableOpacity>

              {/* Cookbook cards */}
              {cookbooks.map(cb => (
                <View key={cb.id} style={{ width: CARD_WIDTH }}>
                  <CookbookCard
                    cookbook={cb}
                    recipeCount={getRecipeCount(cb.id)}
                    onPress={() => router.push(`/cookbook/${cb.id}`)}
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* New Cookbook Modal */}
      {showNewModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Cookbook</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Cookbook name (e.g. Dinner)"
              placeholderTextColor={Colors.muted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowNewModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Button label="Create" onPress={handleCreateCookbook} style={styles.modalCreate} disabled={!newName.trim()} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 18 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  banner: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: Colors.primaryLight },
  bannerTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  bannerSub: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  bannerChevron: { fontSize: 20, color: Colors.muted },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { fontSize: 16, marginRight: 8 },
  search: { flex: 1, height: 44, fontSize: 15, color: Colors.text },
  noResults: { color: Colors.muted, textAlign: 'center', marginVertical: 24, fontSize: 15 },
  searchResult: { backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 8 },
  searchResultText: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  newCard: { aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card },
  newPlus: { fontSize: 32, color: Colors.primary, fontWeight: '300' },
  newLabel: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modalInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, height: 54, justifyContent: 'center', alignItems: 'center', borderRadius: 14, backgroundColor: Colors.border },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: Colors.muted },
  modalCreate: { flex: 1 },
});
