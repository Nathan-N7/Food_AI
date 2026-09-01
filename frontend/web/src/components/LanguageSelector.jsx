import { useTranslation } from 'react-i18next'
import { supportedLanguages } from '../i18n'

const LanguageSelector = () => {
  const { t, i18n } = useTranslation()
  return (
    <label className="language-selector">
      <span>{t('language')}</span>
      <select value={i18n.resolvedLanguage || i18n.language} onChange={(event) => i18n.changeLanguage(event.target.value)} aria-label={t('language')}>
        {supportedLanguages.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>
  )
}

export default LanguageSelector
