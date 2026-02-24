import type { Locale } from "@/i18n/config";

const localeMap: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

export function formatDate(dateString: string, locale: Locale = "fr"): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(localeMap[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
