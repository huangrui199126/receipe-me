// Generate emoji at runtime from code points to avoid file encoding issues
const cp = (...points: number[]) => points.map(p => String.fromCodePoint(p)).join('');

export const E = {
  // Goals
  salad:    cp(0x1F957),           // 🥗
  money:    cp(0x1F4B0),           // 💰
  cooking:  cp(0x1F373),           // 🍳
  books:    cp(0x1F4DA),           // 📚
  calendar: cp(0x1F4C5),          // 📅
  globe:    cp(0x1F30D),           // 🌍
  chef:     cp(0x1F9D1, 0x200D, 0x1F373), // 🧑‍🍳
  // Sources
  phone:    cp(0x1F4F1),           // 📱
  web:      cp(0x1F310),           // 🌐
  book:     cp(0x1F4D6),           // 📖
  // Food
  orange:   cp(0x1F34A),           // 🍊
  leaf:     cp(0x1F343),           // 🍃
  blossom:  cp(0x1F338),           // 🌸
  pizza:    cp(0x1F355),           // 🍕
  pasta:    cp(0x1F35D),           // 🍝
  soup:     cp(0x1F372),           // 🍲
  cake:     cp(0x1F967),           // 🥧
  ramen:    cp(0x1F35C),           // 🍜
  plate:    cp(0x1F37D),           // 🍽
  // UI
  fire:     cp(0x1F525),           // 🔥
  star:     cp(0x2B50),            // ⭐
  cart:     cp(0x1F6D2),           // 🛒
  gear:     cp(0x2699, 0xFE0F),   // ⚙️
  lang:     cp(0x1F30D),           // 🌐
  helpIcon: cp(0x2753),            // ❓
  check:    cp(0x2705),            // ✅
  sparkle:  cp(0x2728),            // ✨
  wave:     cp(0x1F44B),           // 👋
  camera:   cp(0x1F4F7),           // 📷
  pin:      cp(0x1F4CC),           // 📌
  // Referral sources
  friends:  cp(0x1F91D),           // 🤝
  facebook: cp(0x1F4D8),          // 📘
  appStore: cp(0x1F4F1),          // 📱
  instagram:cp(0x1F4F8),          // 📸
  google:   cp(0x1F50D),           // 🔍
  tiktok:   cp(0x1F3B5),          // 🎵
  youtube:  cp(0x25B6, 0xFE0F),  // ▶️
  influencer:cp(0x2B50),           // ⭐
  other:    cp(0x2754),            // ❔
};
