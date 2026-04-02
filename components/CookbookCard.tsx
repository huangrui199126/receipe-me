import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants/colors';
import { Cookbook } from '../db/schema';
import { useTranslation } from 'react-i18next';

interface Props {
  cookbook: Cookbook;
  recipeCount: number;
  onPress: () => void;
}

export default function CookbookCard({ cookbook, recipeCount, onPress }: Props) {
  const { t } = useTranslation();
  const images = cookbook.coverImages ?? [];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        {images.length === 0 ? (
          <View style={styles.emptyImage}>
            <Text style={styles.emptyEmoji}>{cookbook.emoji || '📖'}</Text>
          </View>
        ) : images.length === 1 ? (
          <Image source={{ uri: images[0] }} style={styles.singleImage} resizeMode="cover" />
        ) : (
          <View style={styles.collage}>
            {[0,1,2,3].map(i => (
              <View key={i} style={styles.collageCell}>
                {images[i] ? (
                  <Image source={{ uri: images[i] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.border }]} />
                )}
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{cookbook.emoji ? `${cookbook.emoji} ` : ''}{cookbook.name}</Text>
        <Text style={styles.count}>{t('recipes', { count: recipeCount })}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, borderRadius: 16, backgroundColor: Colors.card, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  imageContainer: { width: '100%', aspectRatio: 1 },
  emptyImage: { flex: 1, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 40 },
  singleImage: { width: '100%', height: '100%' },
  collage: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  collageCell: { width: '50%', height: '50%', overflow: 'hidden' },
  info: { padding: 10 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  count: { fontSize: 12, color: Colors.muted, marginTop: 2 },
});
