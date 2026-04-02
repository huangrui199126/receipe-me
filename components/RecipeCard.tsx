import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants/colors';
import { Recipe } from '../db/schema';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export default function RecipeCard({ recipe, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {recipe.imageUri ? (
          <Image source={{ uri: recipe.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
            <Text style={styles.placeholderText}>🍽</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        {(recipe.prepTime > 0 || recipe.cookTime > 0) && (
          <Text style={styles.time}>⏱ {recipe.prepTime + recipe.cookTime} min</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: Colors.card,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  imageWrap: { width: '100%', height: 180, backgroundColor: Colors.border },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.border },
  placeholderText: { fontSize: 48 },
  info: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  time: { fontSize: 13, color: Colors.muted, marginTop: 4 },
});
