import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
]

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={i18n.t('languageSwitcher.label')}
    >
      {LANGUAGES.map((lang) => {
        const isActive = i18n.resolvedLanguage === lang.code
        return (
          <button
            key={lang.code}
            type="button"
            className={`language-switcher-btn ${isActive ? 'is-active' : ''}`}
            onClick={() => i18n.changeLanguage(lang.code)}
            aria-current={isActive ? 'true' : undefined}
          >
            {lang.label}
          </button>
        )
      })}
    </div>
  )
}

export default LanguageSwitcher
