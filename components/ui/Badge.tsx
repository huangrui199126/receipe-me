import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MealTypeColors, MealTypeLabels } from '../../constants/colors';

interface BadgeProps {
  mealType: string;
}

export default function Badge({ mealType }: BadgeProps) {
  const color = MealTypeColors[mealType] ?? '#6B7280';
  const label = MealTypeLabels[mealType] ?? mealType;
  return (
    <View style={[styles.badge, { backgroundColor: color + '28' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
