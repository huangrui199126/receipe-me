import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { setLanguage } from '../../constants/i18n';
import ReciMeLogo from '../../components/ReciMeLogo';
import EmojiIcon from '../../components/EmojiIcon';
import { useStore } from '../../store';
import { isPro } from '../../lib/subscription';

const LANGUAGES = [
  { code: 'en', name: 'English', flagIcon: 'flagUS' },
  { code: 'zh', name: '\u4E2D\u6587', flagIcon: 'flagCN' },
  { code: 'es', name: 'Espa\u00F1ol', flagIcon: 'flagES' },
];

const HELP_URL = 'https://huangrui199126.github.io/receipe-me/help';

export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { subscription, setTier } = useStore();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Dev unlock: tap version row 5 times
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVersionTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setShowDevPanel(true);
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSelectLanguage = async (code: string) => {
    setShowLangPicker(false);
    await setLanguage(code);
  };

  const handleHelp = () => {
    Linking.openURL(HELP_URL).catch(() =>
      Alert.alert('Cannot open', 'Please visit our help center at ' + HELP_URL)
    );
  };

  const pro = isPro(subscription.tier);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <ReciMeLogo size={24} />
        </View>
        <Text style={styles.pageTitle}>{t('settings')}</Text>

        {/* Subscription status / upgrade */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => !pro && router.push('/paywall')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: pro ? '#D1FAE5' : '#FEE2E2' }]}>
                <EmojiIcon name={pro ? 'sparkle' : 'star'} size={20} />
              </View>
              <View>
                <Text style={styles.rowLabel}>{pro ? 'RecipeMe Pro' : 'Free Plan'}</Text>
                {!pro && (
                  <Text style={styles.subLabel}>
                    {subscription.previewsUsed}/5 previews · {subscription.importsUsed}/5 imports
                  </Text>
                )}
              </View>
            </View>
            {!pro && (
              <View style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>Upgrade</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={() => setShowLangPicker(true)}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: '#DBEAFE' }]}>
                <EmojiIcon name="gear" size={20} />
              </View>
              <Text style={styles.rowLabel}>{t('language')}</Text>
            </View>
            <View style={styles.rowRight}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <EmojiIcon name={(currentLang as any).flagIcon} size={20} />
                <Text style={styles.rowValue}>{currentLang.name}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Help */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleHelp}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
                <EmojiIcon name="helpIcon" size={20} />
              </View>
              <Text style={styles.rowLabel}>{t('help')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.versionRow} onPress={handleVersionTap} activeOpacity={1}>
          <ReciMeLogo size={16} />
          <Text style={styles.version}> v1.0.0</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language picker modal */}
      <Modal visible={showLangPicker} transparent animationType="slide" onRequestClose={() => setShowLangPicker(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowLangPicker(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('language')}</Text>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={styles.langRow}
              onPress={() => handleSelectLanguage(lang.code)}
            >
              <EmojiIcon name={(lang as any).flagIcon} size={28} />
              <Text style={styles.langName}>{lang.name}</Text>
              {i18n.language === lang.code && (
                <EmojiIcon name="check" size={22} />
              )}
            </TouchableOpacity>
          ))}
          <View style={styles.sheetFooter} />
        </View>
      </Modal>

      {/* Developer panel — hidden, unlocked by tapping version 5 times */}
      <Modal visible={showDevPanel} transparent animationType="slide" onRequestClose={() => setShowDevPanel(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowDevPanel(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.devTitle}>🛠 Dev Mode</Text>
          <Text style={styles.devCurrent}>
            Current: <Text style={{ fontWeight: '700', color: Colors.primary }}>{pro ? 'Pro' : 'Free'}</Text>
          </Text>
          <TouchableOpacity
            style={[styles.devBtn, pro ? styles.devBtnFree : null]}
            onPress={async () => {
              await setTier(pro ? 'free' : 'annual');
              setShowDevPanel(false);
            }}
          >
            <Text style={[styles.devBtnText, pro ? { color: '#EF4444' } : null]}>
              {pro ? 'Switch to Free user' : 'Switch to Pro user'}
            </Text>
          </TouchableOpacity>
          <View style={styles.sheetFooter} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 30, fontWeight: '800', color: Colors.text, marginTop: 12, marginBottom: 28 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 18 },
  rowLabel: { fontSize: 16, fontWeight: '500', color: Colors.text },
  subLabel: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  rowValue: { fontSize: 15, color: Colors.muted },
  chevron: { fontSize: 20, color: Colors.muted },
  upgradeBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  upgradeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  headerRow: { paddingBottom: 4 },
  versionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  version: { color: Colors.muted, fontSize: 13 },
  // Language picker
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 16, marginTop: 8 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  langFlag: { fontSize: 28, width: 44 },
  langName: { flex: 1, fontSize: 17, fontWeight: '500', color: Colors.text },
  langCheck: { fontSize: 22 },
  sheetFooter: { height: 24 },
  // Dev panel
  devTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginTop: 8, marginBottom: 8 },
  devCurrent: { fontSize: 13, color: Colors.muted, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  devBtn: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  devBtnFree: { backgroundColor: '#FEF2F2' },
  devBtnText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
});
