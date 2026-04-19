import React from 'react';
import { Image } from 'expo-image';

const BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@17.0.2/assets/72x72';

export const TWEMOJI: Record<string, string> = {
  // Goals
  salad:    `${BASE}/1f957.png`,
  money:    `${BASE}/1f4b0.png`,
  cooking:  `${BASE}/1f373.png`,
  books:    `${BASE}/1f4da.png`,
  calendar: `${BASE}/1f4c5.png`,
  globe:    `${BASE}/1f30d.png`,
  chef:     `${BASE}/1f9d1-200d-1f373.png`,
  // Food
  pizza:    `${BASE}/1f355.png`,
  pasta:    `${BASE}/1f35d.png`,
  soup:     `${BASE}/1f372.png`,
  ramen:    `${BASE}/1f35c.png`,
  cake:     `${BASE}/1f967.png`,
  plate:    `${BASE}/1f37d.png`,
  // UI
  wave:     `${BASE}/1f44b.png`,
  sparkle:  `${BASE}/2728.png`,
  fire:     `${BASE}/1f525.png`,
  star:     `${BASE}/2b50.png`,
  cart:     `${BASE}/1f6d2.png`,
  gear:     `${BASE}/2699.png`,
  check:    `${BASE}/2705.png`,
  camera:   `${BASE}/1f4f7.png`,
  pin:      `${BASE}/1f4cc.png`,
  book:     `${BASE}/1f4d6.png`,
  books2:   `${BASE}/1f4da.png`,
  // Referral
  friends:  `${BASE}/1f91d.png`,
  helpIcon: `${BASE}/2753.png`,
  other:    `${BASE}/2754.png`,
  phone:    `${BASE}/1f4f1.png`,
};

interface Props {
  name: string;
  size?: number;
}

export default function EmojiIcon({ name, size = 24 }: Props) {
  const uri = TWEMOJI[name];
  if (!uri) return null;
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
    />
  );
}
