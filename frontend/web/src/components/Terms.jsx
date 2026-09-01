import Header from "./Header"
import { useTranslation } from 'react-i18next'

const Terms = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Header/>
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'left' }}>
      <h1>{t('terms.title')}</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>
        {t('terms.lastUpdated')}
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.aboutTitle')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('terms.aboutText1') }} />
        <p style={{ marginTop: '12px' }} dangerouslySetInnerHTML={{ __html: t('terms.aboutText2') }} />
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.eligibilityTitle')}</h2>
        <p>{t('terms.eligibilityIntro')}</p>
        <ul>
          <li>{t('terms.eligibilityAge')}</li>
          <li>{t('terms.eligibilityCapacity')}</li>
          <li>{t('terms.eligibilityCompliance')}</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.accountsTitle')}</h2>
        <ul>
          <li>{t('terms.accountsConfidentiality')}</li>
          <li>{t('terms.accountsResponsibility')}</li>
          <li>{t('terms.accountsAccuracy')}</li>
          <li>{t('terms.accountsSingle')}</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.useTitle')}</h2>
        <p>{t('terms.useIntro1')}</p>
        <p dangerouslySetInnerHTML={{ __html: t('terms.useIntro2') }} />
        <ul>
          <li>{t('terms.useNoFood')}</li>
          <li>{t('terms.useNoExplicit')}</li>
          <li>{t('terms.useNoBypass')}</li>
          <li>{t('terms.useNoRights')}</li>
          <li>{t('terms.useNoReverse')}</li>
          <li>{t('terms.useNoBots')}</li>
          <li>{t('terms.useNoAccess')}</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.ipTitle')}</h2>
        <ul>
          <li dangerouslySetInnerHTML={{ __html: t('terms.ipUploads') }} />
          <li dangerouslySetInnerHTML={{ __html: t('terms.ipGenerated') }} />
          <li dangerouslySetInnerHTML={{ __html: t('terms.ipApp') }} />
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.liabilityTitle')}</h2>
        <p>{t('terms.liabilityIntro')}</p>
        <ul>
          <li dangerouslySetInnerHTML={{ __html: t('terms.liabilityNoWarranty') }} />
          <li dangerouslySetInnerHTML={{ __html: t('terms.liabilityNoDamages') }} />
          <li dangerouslySetInnerHTML={{ __html: t('terms.liabilityThirdParty') }} />
          <li dangerouslySetInnerHTML={{ __html: t('terms.liabilityDataLoss') }} />
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.availabilityTitle')}</h2>
        <p>{t('terms.availabilityText')}</p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.terminationTitle')}</h2>
        <p>{t('terms.terminationText')}</p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.changesTitle')}</h2>
        <p>{t('terms.changesText')}</p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('terms.contactTitle')}</h2>
        <p>{t('terms.contactText')}</p>
      </section>
    </main>
    </div>
  )
}

export default Terms