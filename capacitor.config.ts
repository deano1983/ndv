import type { CapacitorConfig } from "@capacitor/cli";

// NDV - native shell for the TanStack Start SPA build (npm run build:app).
// The storefront runs client-side against the Shopify Storefront API,
// so no hosted backend is required for catalog/cart/checkout.
const config: CapacitorConfig = {
  appId: "au.com.ndvluxury", // TODO: confirm final ID before store submission (immutable after first store upload)
  appName: "NDV",
  webDir: "dist/client",
  server: {
    // https scheme keeps Shopify fetch/CORS and storage behavior consistent in the WebView
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#1A1616", // noir brand base
  },
  ios: {
    backgroundColor: "#1A1616",
  },
};

export default config;
