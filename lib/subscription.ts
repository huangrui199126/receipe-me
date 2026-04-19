import { Platform } from 'react-native';
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  type SubscriptionPurchase,
  type PurchaseError,
} from 'react-native-iap';

// Product IDs configured in App Store Connect
export const PRODUCT_IDS = {
  monthly: 'com.ruihuang.recipeme.monthly',   // $0.99 / month
  annual: 'com.ruihuang.recipeme.annual',     // $5.99 / year
} as const;

export type SubscriptionTier = 'free' | 'monthly' | 'annual';

export const FREE_LIMITS = {
  importsPerMonth: 5,
  previewsPerMonth: 5,
} as const;

export async function initIAP(): Promise<boolean> {
  try {
    await initConnection();
    return true;
  } catch {
    return false;
  }
}

export async function fetchProducts() {
  try {
    return await getSubscriptions({ skus: [PRODUCT_IDS.monthly, PRODUCT_IDS.annual] });
  } catch {
    return [];
  }
}

export async function purchaseSubscription(productId: string): Promise<void> {
  await requestSubscription({ sku: productId });
}

// Restore purchases — returns the active tier or 'free'
export async function restorePurchases(): Promise<SubscriptionTier> {
  try {
    const purchases = await getAvailablePurchases();
    for (const p of purchases) {
      if (p.productId === PRODUCT_IDS.annual) return 'annual';
      if (p.productId === PRODUCT_IDS.monthly) return 'monthly';
    }
  } catch {}
  return 'free';
}

export function listenPurchaseUpdates(
  onSuccess: (purchase: SubscriptionPurchase) => void,
  onError: (error: PurchaseError) => void,
) {
  const successSub = purchaseUpdatedListener(async (purchase) => {
    await finishTransaction({ purchase, isConsumable: false });
    onSuccess(purchase as SubscriptionPurchase);
  });
  const errorSub = purchaseErrorListener(onError);
  return () => {
    successSub.remove();
    errorSub.remove();
  };
}

export function tierFromProductId(productId: string): SubscriptionTier {
  if (productId === PRODUCT_IDS.annual) return 'annual';
  if (productId === PRODUCT_IDS.monthly) return 'monthly';
  return 'free';
}

export function isPro(tier: SubscriptionTier): boolean {
  return tier === 'monthly' || tier === 'annual';
}

// Returns current "YYYY-MM" string for monthly usage reset
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
