import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  size?: number;
}

export default function ReciMeLogo({ size = 28 }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.cloud, { fontSize: size }]}>🍽</Text>
      <Text style={[styles.text, { fontSize: size }]}> ReciMe</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  cloud: { marginRight: -2 },
  text: { color: '#3B82F6', fontStyle: 'italic', fontWeight: '700', letterSpacing: -0.5 },
});
