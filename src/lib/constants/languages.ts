export const LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  ar: { name: 'العربية', flag: '🇩🇿' }
} as const;

export type Language = keyof typeof LANGUAGES;
