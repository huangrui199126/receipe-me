// Fix for Expo SDK 54 new architecture with Jest
global.__ExpoImportMetaRegistry = {};

// Expo SDK 54 tries to polyfill structuredClone via its winter runtime
// which breaks jest — provide it directly
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Silence noisy warnings in tests
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', regionCode: 'US' }],
  locale: 'en-US',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

jest.mock('i18next', () => ({
  use: () => ({ init: jest.fn() }),
  t: (key) => key,
}));
