import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import EmojiIcon from './EmojiIcon';

interface Props {
  size?: number;
}

export default function ReciMeLogo({ size = 28 }: Props) {
  return (
    <View style={styles.row}>
      <EmojiIcon name="plate" size={size} />
      <Text style={[styles.text, { fontSize: size }]}> RecipeMe</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { color: '#3B82F6', fontStyle: 'italic', fontWeight: '700', letterSpacing: -0.5 },
});
