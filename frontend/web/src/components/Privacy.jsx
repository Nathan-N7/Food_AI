import Header from "./Header"
import { useTranslation } from 'react-i18next'

const Privacy = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Header/>
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'left' }}>
      <h1>{t('privacy.title')}</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>
        {t('privacy.lastUpdated')}
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.introTitle')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('privacy.introText1') }} />
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.collectTitle')}</h2>
        <p>{t('privacy.collectIntro')}</p>
        <ul>
          <li dangerouslySetInnerHTML={{ __html: t('privacy.collectAccount') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.collectAuth') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.collectImages') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.collectGenerated') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.collectUsage') }} />
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.useTitle')}</h2>
        <p>{t('privacy.useIntro')}</p>
        <ul>
          <li dangerouslySetInnerHTML={{ __html: t('privacy.useAnalysis') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.useGeneration') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.useHistory') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.useAuth') }} />
        </ul>
        <p dangerouslySetInnerHTML={{ __html: t('privacy.useNoSell') }} />
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.retentionTitle')}</h2>
        <p>{t('privacy.retentionIntro')}</p>
        <ul>
          <li dangerouslySetInnerHTML={{ __html: t('privacy.retentionAccount') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.retentionImages') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.retentionResults') }} />
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.rightsTitle')}</h2>
        <p>{t('privacy.rightsIntro')}</p>
        <ul>
          <li dangerouslySetInnerHTML={{ __html: t('privacy.rightsAccess') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.rightsDeletion') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.rightsCorrection') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacy.rightsPortability') }} />
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.securityTitle')}</h2>
        <p>{t('privacy.securityIntro')}</p>
        <ul>
          <li>{t('privacy.securityTls')}</li>
          <li>{t('privacy.securityHash')}</li>
          <li>{t('privacy.securityDb')}</li>
          <li>{t('privacy.securityCookies')}</li>
        </ul>
        <p>{t('privacy.securityAcademic')}</p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.thirdPartyTitle')}</h2>
        <p>{t('privacy.thirdPartyIntro')}</p>
        <ul>
          <li dangerouslySetInnerHTML={{ __html: t('privacy.thirdPartyReplicate') }} />
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.cookiesTitle')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('privacy.cookiesText1') }} />
        <p>{t('privacy.cookiesText2')}</p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.contactTitle')}</h2>
        <p>{t('privacy.contactText')}</p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>{t('privacy.changesTitle')}</h2>
        <p>{t('privacy.changesText')}</p>
      </section>
    </main>
    </div>
  )
}

export default Privacy