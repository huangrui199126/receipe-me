import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { setLanguage } from '../../constants/i18n';
import { E } from '../../constants/emoji';
import ReciMeLogo from '../../components/ReciMeLogo';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: String.fromCodePoint(0x1F1FA, 0x1F1F8) },
  { code: 'zh', name: '\u4E2D\u6587', flag: String.fromCodePoint(0x1F1E8, 0x1F1F3) },
  { code: 'es', name: 'Espa\u00F1ol', flag: String.fromCodePoint(0x1F1EA, 0x1F1F8) },
];

const HELP_URL = 'https://huangrui199126.github.io/receipe-me/help';

export default function SettingsTab() {
  const { t, i18n } = useTranslation();
  const [showLangPicker, setShowLangPicker] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <ReciMeLogo size={24} />
        </View>
        <Text style={styles.pageTitle}>{t('settings')}</Text>

        {/* Language */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={() => setShowLangPicker(true)}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.iconText}>{E.lang}</Text>
              </View>
              <Text style={styles.rowLabel}>{t('language')}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{currentLang.flag} {currentLang.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Help */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={handleHelp}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.iconText}>{E.helpIcon}</Text>
              </View>
              <Text style={styles.rowLabel}>{t('help')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionRow}>
          <ReciMeLogo size={16} />
          <Text style={styles.version}> v1.0.0</Text>
        </View>
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
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={styles.langName}>{lang.name}</Text>
              {i18n.language === lang.code && (
                <Text style={styles.langCheck}>{E.check}</Text>
              )}
            </TouchableOpacity>
          ))}
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
  rowValue: { fontSize: 15, color: Colors.muted },
  chevron: { fontSize: 20, color: Colors.muted },
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
});
