// 隐私政策页面
import React from 'react'
import CollapsibleSection from '../components/CollapsibleSection'
import '../styles/Legal.css'

const Privacy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <div className="legal-content">
          <CollapsibleSection title="Information We Collect">
            <p>We collect the following types of information when you use AI Disguiser:</p>
            <ul>
              <li><strong>Text Content:</strong> The original text you input and the transformed text we generate</li>
              <li><strong>Account Information:</strong> When you log in via Google or GitHub, we collect your name, email, and profile picture</li>
              <li><strong>Usage Data:</strong> Your transformation history, style preferences, and saved configurations</li>
              <li><strong>Technical Data:</strong> Browser type, device information, and access logs for security purposes</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="How We Use Your Information">
            <p>Your information is used to:</p>
            <ul>
              <li><strong>Provide AI Services:</strong> Your text is sent to Google Gemini API for transformation processing</li>
              <li><strong>Save Your History:</strong> Store your transformations and preferences in Firebase for future access</li>
              <li><strong>Improve Experience:</strong> Analyze usage patterns to enhance our service quality</li>
              <li><strong>Account Management:</strong> Authenticate your identity and manage your personal settings</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Data Storage and Retention">
            <ul>
              <li><strong>Firebase Database:</strong> Your account information and transformation history are stored in Google Firebase</li>
              <li><strong>Retention Period:</strong> Data is kept until you delete your account or request data removal</li>
              <li><strong>Security:</strong> All data is protected with industry-standard encryption and access controls</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Third-Party Services">
            <p>We share your data with the following services:</p>
            <ul>
              <li><strong>Google Gemini API:</strong> Your input text is sent to Google for AI processing</li>
              <li><strong>Google Firebase:</strong> Stores your account data and usage history</li>
              <li><strong>Authentication Providers:</strong> Google and GitHub for login services</li>
            </ul>
            <p>These services have their own privacy policies that govern how they handle your data.</p>
          </CollapsibleSection>

          <CollapsibleSection title="Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access and download your personal data</li>
              <li>Correct or update your information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of data collection by not using our service</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Contact Us">
            <p>For privacy-related questions or to request data deletion, please contact us through:</p>
            <ul>
              <li>GitHub Issues: Report concerns on our project repository</li>
              <li>The settings page in your account to manage your data</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Changes to This Policy">
            <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date.</p>
            <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}

export default Privacy