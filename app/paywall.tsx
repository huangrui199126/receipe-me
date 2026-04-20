import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import ReciMeLogo from '../components/ReciMeLogo';
import EmojiIcon from '../components/EmojiIcon';
import {
  initIAP, fetchProducts, purchaseSubscription, restorePurchases,
  listenPurchaseUpdates, tierFromProductId, PRODUCT_IDS,
} from '../lib/subscription';
import { useStore } from '../store';

const FEATURES = [
  { icon: 'cooking', text: 'Unlimited recipe previews' },
  { icon: 'web', text: 'Unlimited URL imports from any website' },
  { icon: 'sparkle', text: 'Priority access to trending recipes' },
  { icon: 'chef', text: 'Full nutrition info on every recipe' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setTier, subscription } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [iapReady, setIapReady] = useState(false);

  useEffect(() => {
    initIAP().then(ok => {
      if (ok) setIapReady(true);
      fetchProducts().then(setProducts);
    });
    const cleanup = listenPurchaseUpdates(
      async (purchase) => {
        const tier = tierFromProductId(purchase.productId);
        await setTier(tier);
        setLoading(false);
        router.back();
      },
      (err) => {
        setLoading(false);
        if ((err as any).code !== 'E_USER_CANCELLED') {
          Alert.alert('Purchase failed', err.message);
        }
      },
    );
    return cleanup;
  }, []);

  const getPrice = (productId: string) => {
    const p = products.find(p => p.productId === productId);
    return p?.localizedPrice ?? (productId === PRODUCT_IDS.monthly ? '$0.99' : '$5.99');
  };

  const handleSubscribe = async () => {
    if (!iapReady) {
      Alert.alert('Store unavailable', 'In-app purchases are not available right now. Please try again later.');
      return;
    }
    setLoading(true);
    try {
      await purchaseSubscription(selected === 'monthly' ? PRODUCT_IDS.monthly : PRODUCT_IDS.annual);
    } catch (e: any) {
      setLoading(false);
      if (e.code === 'E_USER_CANCELLED') return;
      // Invalid product ID = products not yet approved/live in App Store Connect
      if (e.message?.includes('Invalid product') || e.message?.includes('product identifier')) {
        Alert.alert('Coming soon', 'Subscriptions are being set up. Please check back soon!');
      } else {
        Alert.alert('Purchase failed', e.message);
      }
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const tier = await restorePurchases();
    await setTier(tier);
    setLoading(false);
    if (tier !== 'free') {
      Alert.alert('Restored!', 'Your subscription has been restored.');
      router.back();
    } else {
      Alert.alert('Nothing to restore', 'No active subscription found.');
    }
  };

  const monthlyPrice = getPrice(PRODUCT_IDS.monthly);
  const annualPrice = getPrice(PRODUCT_IDS.annual);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>{String.fromCodePoint(0x2715)}</Text>
        </TouchableOpacity>
        <ReciMeLogo size={22} />
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}><EmojiIcon name="sparkle" size={52} /></View>
        <Text style={styles.title}>Unlock RecipeMe Pro</Text>
        <Text style={styles.subtitle}>
          Free plan: {subscription.previewsUsed}/5 previews · {subscription.importsUsed}/5 imports used this month
        </Text>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <EmojiIcon name={f.icon} size={22} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan picker */}
        <TouchableOpacity
          style={[styles.planCard, selected === 'annual' && styles.planCardActive]}
          onPress={() => setSelected('annual')}
          activeOpacity={0.8}
        >
          <View style={styles.planLeft}>
            <View style={styles.planRadio}>
              {selected === 'annual' && <View style={styles.planRadioDot} />}
            </View>
            <View>
              <Text style={styles.planName}>Annual</Text>
              <Text style={styles.planSave}>Save vs monthly</Text>
            </View>
          </View>
          <View style={styles.planRight}>
            <Text style={styles.planPrice}>{annualPrice}</Text>
            <Text style={styles.planPer}>/year</Text>
          </View>
          {selected === 'annual' && (
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>BEST VALUE</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, selected === 'monthly' && styles.planCardActive]}
          onPress={() => setSelected('monthly')}
          activeOpacity={0.8}
        >
          <View style={styles.planLeft}>
            <View style={styles.planRadio}>
              {selected === 'monthly' && <View style={styles.planRadioDot} />}
            </View>
            <Text style={styles.planName}>Monthly</Text>
          </View>
          <View style={styles.planRight}>
            <Text style={styles.planPrice}>{monthlyPrice}</Text>
            <Text style={styles.planPer}>/month</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Subscription auto-renews. Cancel anytime in iPhone Settings.
        </Text>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.subscribeBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.subscribeBtnText}>Start RecipeMe Pro</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestore} disabled={loading} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore purchase</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  closeBtn: { width: 36, height: 36, justifyContent: 'center' },
  closeText: { fontSize: 18, color: Colors.muted },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  emoji: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  featuresCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  featureIcon: { fontSize: 22, width: 30 },
  featureText: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  planCard: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: 16,
    padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', position: 'relative', overflow: 'hidden',
  },
  planCardActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  planLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  planRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  planRadioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.primary },
  planName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  planSave: { fontSize: 12, color: Colors.primary, fontWeight: '500', marginTop: 2 },
  planRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: 20, fontWeight: '800', color: Colors.text },
  planPer: { fontSize: 13, color: Colors.muted },
  bestBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10 },
  bestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  legal: { fontSize: 12, color: Colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 4 },
  cta: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  subscribeBtn: { height: 52, borderRadius: 14, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  subscribeBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  restoreBtn: { alignItems: 'center', paddingVertical: 4 },
  restoreText: { fontSize: 14, color: Colors.muted },
});
