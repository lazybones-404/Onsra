/**
 * Tip Jar — in-app purchase for supporting Onsra development.
 *
 * Uses expo-iap (or RevenueCat for more robust cross-platform handling).
 *
 * Products (set up in App Store Connect and Google Play Console):
 *   com.onsra.app.tip.small   — $0.99 / £0.99 "Buy us a coffee"
 *   com.onsra.app.tip.medium  — $2.99 / £2.99 "Buy us lunch"
 *   com.onsra.app.tip.large   — $9.99 / £9.99 "Buy us dinner"
 *
 * Install: npm install expo-iap
 * This file is a stub — IAP is initialized in Sprint 6 final polish.
 */

export const TIP_PRODUCTS = [
  {
    id: 'com.onsra.app.tip.small',
    label: 'Buy us a coffee ☕',
    price: '$0.99',
    emoji: '☕',
  },
  {
    id: 'com.onsra.app.tip.medium',
    label: 'Buy us lunch 🥗',
    price: '$2.99',
    emoji: '🥗',
  },
  {
    id: 'com.onsra.app.tip.large',
    label: 'Buy us dinner 🍕',
    price: '$9.99',
    emoji: '🍕',
  },
] as const;

export type TipProductId = (typeof TIP_PRODUCTS)[number]['id'];

export async function initializeIAP(): Promise<void> {
  // await InAppPurchases.connectAsync();
}

export async function purchaseTip(productId: TipProductId): Promise<{ success: boolean; message: string }> {
  try {
    // const result = await InAppPurchases.purchaseItemAsync(productId);
    // if (result.responseCode === InAppPurchases.IAPResponseCode.OK) {
    //   return { success: true, message: "Thank you for supporting Onsra! 🎸" };
    // }
    return { success: false, message: 'IAP not yet configured. Coming in the final build!' };
  } catch {
    return { success: false, message: 'Purchase failed. Please try again.' };
  }
}
