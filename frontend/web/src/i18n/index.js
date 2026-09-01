import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/common.json'
import pt from './locales/pt/common.json'
import es from './locales/es/common.json'

export const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
]

function initialLanguage() {
  const saved = window.localStorage.getItem('language')
  if (supportedLanguages.some(({ code }) => code === saved)) return saved
  const browserLanguage = (navigator.language || '').toLowerCase()
  if (browserLanguage.startsWith('pt')) return 'pt'
  if (browserLanguage.startsWith('es')) return 'es'
  return 'en'
}

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { common: en }, pt: { common: pt }, es: { common: es } },
    lng: initialLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (language) => {
  window.localStorage.setItem('language', language)
})

export default i18n
