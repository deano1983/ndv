export type Locale = "US" | "UK" | "EU" | "AU" | "JP";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "US", label: "United States" },
  { code: "UK", label: "United Kingdom" },
  { code: "EU", label: "European Union" },
  { code: "AU", label: "Australia" },
  { code: "JP", label: "Japan" },
];

// Apparel (dress/top) size conversion — anchored to common luxe RTW grading.
export const APPAREL_SIZES: Record<Locale, string[]> = {
  US: ["00", "0", "2", "4", "6", "8", "10", "12", "14"],
  UK: ["2", "4", "6", "8", "10", "12", "14", "16", "18"],
  EU: ["30", "32", "34", "36", "38", "40", "42", "44", "46"],
  AU: ["4", "6", "8", "10", "12", "14", "16", "18", "20"],
  JP: ["3", "5", "7", "9", "11", "13", "15", "17", "19"],
};

// Intimates — band sizes (UK/AU share, EU separate, JP cm).
export const BAND_SIZES: Record<Locale, string[]> = {
  US: ["30", "32", "34", "36", "38", "40"],
  UK: ["30", "32", "34", "36", "38", "40"],
  EU: ["65", "70", "75", "80", "85", "90"],
  AU: ["8", "10", "12", "14", "16", "18"],
  JP: ["65", "70", "75", "80", "85", "90"],
};

export const CUP_SIZES = ["A", "B", "C", "D", "DD/E", "F", "G"];

const LOCALE_KEY = "ndv-locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "US";
  const v = window.localStorage.getItem(LOCALE_KEY);
  return (v as Locale) ?? "US";
}

export function setStoredLocale(loc: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_KEY, loc);
  window.dispatchEvent(new CustomEvent("ndv-locale-change", { detail: loc }));
}
