import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useStore } from '../../store';
import ReciMeLogo from '../../components/ReciMeLogo';

export default function MoreTab() {
  const { t } = useTranslation();
  const { userProfile } = useStore();
  const router = useRouter();

  type MenuItem = { icon: string; label: string; accent?: boolean };
  const sections: { items: MenuItem[] }[] = [
    {
      items: [
        { icon: '🔥', label: t('trending') },
        { icon: '⚡', label: t('shortcut') },
        { icon: '📖', label: t('import_guides') },
        { icon: '💻', label: t('desktop') },
      ],
    },
    {
      items: [
        { icon: '👥', label: t('invite') },
        { icon: '❓', label: t('help') },
      ],
    },
    {
      items: [
        { icon: '⚙️', label: t('settings') },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* User */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.username}>{userProfile?.username ?? 'Guest'}</Text>
          <TouchableOpacity>
            <Text style={styles.createAccount}>{t('create_account')}</Text>
          </TouchableOpacity>
        </View>

        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={ii}
                style={[styles.row, item.accent && styles.rowAccent]}
                onPress={() => {
                  if (item.label === t('trending')) router.push('/trending');
                }}
              >
                <Text style={styles.rowIcon}>{item.icon}</Text>
                <Text style={[styles.rowLabel, item.accent && styles.rowLabelAccent]}>{item.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  userSection: { paddingVertical: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarIcon: { fontSize: 24 },
  username: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1 },
  createAccount: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  section: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowAccent: { backgroundColor: Colors.purpleLight + '40' },
  rowIcon: { fontSize: 20, width: 36 },
  rowLabel: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '500' },
  rowLabelAccent: { color: '#7C3AED', fontWeight: '600' },
  chevron: { fontSize: 18, color: Colors.muted },
  version: { textAlign: 'center', color: Colors.muted, fontSize: 13, marginTop: 16 },
});
