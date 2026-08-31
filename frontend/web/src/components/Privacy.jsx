import Header from "./Header"
const Privacy = () => {
  return (
    <div>
      <Header/>
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'left' }}>
      <h1>Privacy Policy</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>
        Last updated: August 2026
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2>1. Introduction</h2>
        <p>
          Welcome to <strong>Food AI</strong>. This Privacy Policy explains how we collect,
          use, store, and protect your personal information when you use our service.
          Food AI is an academic project developed as part of the 42 school curriculum.
          By using this application, you agree to the practices described in this policy.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>2. Information We Collect</h2>
        <p>We collect the following types of data when you use Food AI:</p>
        <ul>
          <li>
            <strong>Account information:</strong> Your username and email address,
            provided at registration.
          </li>
          <li>
            <strong>Authentication data:</strong> Your password, which is stored
            exclusively as a salted cryptographic hash (bcrypt/PBKDF2). We never
            store your password in plain text.
          </li>
          <li>
            <strong>Images you upload:</strong> Food photos you submit to the
            application for analysis and generation. These images are stored on
            our server and linked to your account.
          </li>
          <li>
            <strong>Generated images:</strong> The AI-generated versions of your
            food photos, stored as URLs referencing the generation service.
          </li>
          <li>
            <strong>Usage data:</strong> Metadata about your generations, including
            timestamps, processing status, and AI analysis results.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>3. How We Use Your Information</h2>
        <p>Your data is used exclusively to operate the Food AI service:</p>
        <ul>
          <li>
            <strong>Image analysis:</strong> Uploaded images are sent to an
            object detection model (RT-DETR) to verify they contain food, and
            then to a vision AI model (Gemini) to extract visual details.
          </li>
          <li>
            <strong>Image generation:</strong> Analysis results are used to
            build a prompt and generate an enhanced food photo via a generative
            AI model (Flux).
          </li>
          <li>
            <strong>History and personalization:</strong> We store your past
            generations so you can review them in the History page.
          </li>
          <li>
            <strong>Authentication:</strong> Your credentials are used solely to
            identify you and protect your data from unauthorized access.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell, rent, or share your personal data with
          third parties for marketing purposes. Images are transmitted to third-party
          AI providers (Replicate API) only for processing purposes and in accordance
          with their own privacy policies.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>4. Data Retention</h2>
        <p>
          Your data is retained for as long as your account is active. Specifically:
        </p>
        <ul>
          <li>
            <strong>Account data</strong> (username, email, hashed password) is kept
            until you request account deletion.
          </li>
          <li>
            <strong>Uploaded and generated images</strong> are stored indefinitely
            unless you delete individual generations or your account.
          </li>
          <li>
            <strong>AI analysis results</strong> (text descriptions of your food
            images) are stored as part of each generation record.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>5. Your Rights</h2>
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li>
            <strong>Access:</strong> You may view all data associated with your
            account by using the application (History page shows all your generations).
          </li>
          <li>
            <strong>Deletion:</strong> You may request deletion of your account
            and all associated data by contacting us at the address below.
            Individual generations can be deleted from the History page.
          </li>
          <li>
            <strong>Correction:</strong> You may update your account information
            through your profile settings.
          </li>
          <li>
            <strong>Data portability:</strong> You may request an export of your
            data in a readable format by contacting us.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>6. Data Security</h2>
        <p>
          We implement standard security practices to protect your data:
        </p>
        <ul>
          <li>All connections use HTTPS with TLS encryption.</li>
          <li>Passwords are hashed using Django's built-in PBKDF2 algorithm with a salt.</li>
          <li>The database is not exposed to the public internet.</li>
          <li>Authentication tokens are required for all protected endpoints.</li>
        </ul>
        <p>
          As this is an academic project, it uses a self-signed SSL certificate.
          While we make every effort to protect your data, we cannot guarantee
          absolute security.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>7. Third-Party Services</h2>
        <p>
          Food AI uses the following third-party services for AI processing:
        </p>
        <ul>
          <li>
            <strong>Replicate API</strong> — used to run the Gemini vision model
            and the Flux image generation model. Images are transmitted to their
            servers for processing. See{' '}
            <a href="https://replicate.com/privacy" target="_blank" rel="noreferrer">
              Replicate's Privacy Policy
            </a>.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>8. Cookies and Local Storage</h2>
        <p>
          Food AI uses browser <strong>sessionStorage</strong> to store your
          authentication token and basic user information (username and ID).
          This data is stored only on your device and is cleared when you log out.
          We do not use tracking cookies or third-party analytics.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>9. Contact</h2>
        <p>
          If you have any questions about this Privacy Policy or wish to exercise
          your data rights, please contact the development team through the
          42 school project platform or open an issue in the project repository.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy as the project evolves. Any significant
          changes will be reflected in the "Last updated" date at the top of this page.
          Continued use of the application after changes constitutes acceptance of
          the updated policy.
        </p>
      </section>
    </main>
    </div>
  )
}

export default Privacy