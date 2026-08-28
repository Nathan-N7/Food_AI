const Terms = () => {
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'left' }}>
      <h1>Terms of Service</h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>
        Last updated: August 2026
      </p>

      <section style={{ marginBottom: '32px' }}>
        <h2>1. About This Service</h2>
        <p>
          <strong>Food AI</strong> is a web application that allows users to upload
          photos of food and receive AI-enhanced versions of those images, suitable
          for use in delivery menus, food blogs, or promotional materials.
        </p>
        <p style={{ marginTop: '12px' }}>
          Food AI is an <strong>academic project</strong> developed as part of the
          42 school curriculum. It is not a commercial product. The service is
          provided free of charge and on an "as-is" basis, with no guarantees
          regarding availability, performance, or output quality.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>2. Eligibility</h2>
        <p>
          By creating an account and using Food AI, you confirm that:
        </p>
        <ul>
          <li>You are at least 13 years of age.</li>
          <li>You have the legal capacity to agree to these Terms.</li>
          <li>You will use the service in compliance with applicable laws.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>3. User Accounts</h2>
        <ul>
          <li>
            You are responsible for maintaining the confidentiality of your account
            credentials. Do not share your password with others.
          </li>
          <li>
            You are responsible for all activity that occurs under your account.
          </li>
          <li>
            You must provide accurate information when registering. Using a false
            identity or creating accounts on behalf of others is prohibited.
          </li>
          <li>
            You may only hold one account. Creating multiple accounts to bypass
            rate limits or other restrictions is prohibited.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>4. Acceptable Use</h2>
        <p>You agree to use Food AI only for its intended purpose: uploading food
          images to receive AI-enhanced versions. You must <strong>not</strong>:</p>
        <ul>
          <li>Upload images that do not contain food (the system will reject them).</li>
          <li>
            Upload images that contain illegal, offensive, hateful, or sexually
            explicit content.
          </li>
          <li>
            Attempt to bypass the food validation system by submitting manipulated
            or deceptive images.
          </li>
          <li>
            Use the service to process images you do not own or have rights to use.
          </li>
          <li>
            Attempt to reverse-engineer, decompile, or exploit the application or
            its AI pipeline.
          </li>
          <li>
            Use automated scripts or bots to generate excessive numbers of requests.
          </li>
          <li>
            Attempt to access other users' data, accounts, or generated images.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>5. Content and Intellectual Property</h2>
        <ul>
          <li>
            <strong>Your uploads:</strong> You retain ownership of any images you
            upload to Food AI. By uploading, you grant us a limited license to
            process those images through our AI pipeline for the purpose of
            generating the enhanced version.
          </li>
          <li>
            <strong>Generated images:</strong> AI-generated images produced from
            your uploads are provided to you for personal, non-commercial use.
            Since this is an academic project, we make no guarantees about the
            copyright status of generated images. Use them at your own discretion.
          </li>
          <li>
            <strong>The application itself:</strong> All source code for Food AI
            is developed by the project team. The application uses third-party
            AI models and libraries, each subject to their own licenses.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>6. Limitation of Liability</h2>
        <p>
          Because Food AI is an academic project with no commercial intent, we
          provide it with the following limitations of liability:
        </p>
        <ul>
          <li>
            <strong>No warranty:</strong> The service is provided "as-is" without
            any warranty of any kind, express or implied. We do not guarantee that
            the service will be available at all times or that generated images
            will meet your expectations.
          </li>
          <li>
            <strong>No liability for damages:</strong> We are not liable for any
            direct, indirect, incidental, or consequential damages arising from
            your use of or inability to use the service.
          </li>
          <li>
            <strong>Third-party services:</strong> We use third-party AI APIs
            (Replicate) for image processing. We are not responsible for any
            failures, inaccuracies, or costs arising from those services.
          </li>
          <li>
            <strong>Data loss:</strong> As an academic project, we cannot guarantee
            the persistence of your data. We recommend saving any generated images
            you wish to keep.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>7. Service Availability</h2>
        <p>
          Food AI may be unavailable at any time without prior notice, including
          for maintenance, updates, or because the academic project period has ended.
          We do not guarantee any specific uptime or level of service.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>8. Account Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at any time if
          you violate these Terms of Service, particularly the Acceptable Use
          policy (Section 4). You may also delete your own account at any time
          by contacting the development team.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>9. Changes to These Terms</h2>
        <p>
          We may revise these Terms of Service as the project evolves. Continued
          use of the application after changes constitutes acceptance of the
          updated Terms. The "Last updated" date at the top of this page reflects
          the most recent revision.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>10. Contact</h2>
        <p>
          For questions about these Terms, please contact the development team
          through the 42 school project platform or open an issue in the project
          repository.
        </p>
      </section>
    </main>
  )
}

export default Terms