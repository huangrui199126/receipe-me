import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { useStore } from '../../store';
import { GroceryItem } from '../../db/schema';

const CATEGORIES = ['FRESH PRODUCE', 'MEAT & SEAFOOD', 'DAIRY', 'BAKERY', 'PANTRY'];

export default function GroceriesTab() {
  const { t } = useTranslation();
  const { groceryItems, activeGroceryList, toggleGroceryItem, deleteGroceryItem, addToGroceryList } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState('');

  const grouped = CATEGORIES.reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const items = groceryItems.filter(i => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const uncategorized = groceryItems.filter(i => !CATEGORIES.includes(i.category));
  if (uncategorized.length > 0) grouped['OTHER'] = uncategorized;

  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    const item: GroceryItem = {
      id: `gi_${Date.now()}`,
      listId: activeGroceryList?.id ?? '',
      recipeId: null,
      name: newItem.trim(),
      amount: '',
      unit: '',
      category: 'PANTRY',
      emoji: '🛒',
      checked: false,
      order: groceryItems.length,
    };
    await addToGroceryList([item]);
    setNewItem('');
    setShowAdd(false);
  };

  const isEmpty = groceryItems.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('grocery_title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>↑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>•••</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowAdd(true)}>
            <Text style={styles.addFirstText}>{t('add_first')}</Text>
          </TouchableOpacity>
          <View style={styles.emptyIllustration}>
            <Text style={{ fontSize: 80 }}>🌿</Text>
          </View>
          <Text style={styles.emptyText}>{t('no_ingredients')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Count + order online */}
          <Text style={styles.itemCount}>{t('items', { count: groceryItems.length })}</Text>
          <TouchableOpacity style={styles.orderOnlineBtn}>
            <Text style={styles.orderOnlineText}>{t('order_online')}</Text>
          </TouchableOpacity>

          {/* Grouped items */}
          {Object.entries(grouped).map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.categoryLabel}>{category}</Text>
              {items.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, item.checked && styles.itemChecked]}>{item.name}</Text>
                    {(item.amount || item.unit) && (
                      <Text style={styles.itemAmount}>{item.amount} {item.unit}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                    onPress={() => toggleGroceryItem(item.id)}
                  >
                    {item.checked && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add item modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Ingredient</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2 cups flour"
              placeholderTextColor={Colors.muted}
              value={newItem}
              onChangeText={setNewItem}
              autoFocus
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
              <Text style={styles.addBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 16, color: Colors.muted, fontWeight: '500' },
  emptyState: { flex: 1, paddingHorizontal: 24 },
  addFirstBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginVertical: 16 },
  addFirstText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyIllustration: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: Colors.muted, fontSize: 16, paddingBottom: 80 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  itemCount: { fontSize: 15, color: Colors.muted, marginBottom: 10 },
  orderOnlineBtn: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  orderOnlineText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  section: { marginBottom: 20 },
  categoryLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary, letterSpacing: 0.8, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemEmoji: { fontSize: 22, width: 36 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500', color: Colors.text },
  itemChecked: { textDecorationLine: 'line-through', color: Colors.muted },
  itemAmount: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.muted },
  modalBody: { padding: 24 },
  modalInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, marginBottom: 16 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
