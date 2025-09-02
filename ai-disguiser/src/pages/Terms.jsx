// 服务条款页面
import React from 'react'
import CollapsibleSection from '../components/CollapsibleSection'
import '../styles/Legal.css'

const Terms = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <div className="legal-content">
          <CollapsibleSection title="Service Description">
            <p>AI Disguiser is a web application that transforms text using artificial intelligence technology. Our service allows you to:</p>
            <ul>
              <li>Convert text between different writing styles (chat, poetry, social, story)</li>
              <li>Adjust text for different purposes and target audiences</li>
              <li>Save and manage your transformation history</li>
              <li>Share public transformations with the community</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Acceptable Use">
            <p>You agree NOT to use our service to:</p>
            <ul>
              <li><strong>Illegal Content:</strong> Generate or transform content that violates any laws or regulations</li>
              <li><strong>Harmful Content:</strong> Create harassment, threats, hate speech, or content that promotes violence</li>
              <li><strong>Inappropriate Content:</strong> Generate adult content, spam, or misleading information</li>
              <li><strong>Copyright Infringement:</strong> Transform copyrighted text without proper authorization</li>
              <li><strong>System Abuse:</strong> Attempt to overload, hack, or disrupt our service infrastructure</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="AI-Generated Content Disclaimer">
            <ul>
              <li><strong>Accuracy:</strong> AI-generated content may contain errors, inaccuracies, or unintended meanings</li>
              <li><strong>Responsibility:</strong> You are responsible for reviewing and verifying all generated content before use</li>
              <li><strong>No Warranties:</strong> We do not guarantee the quality, accuracy, or suitability of generated content</li>
              <li><strong>Use at Your Own Risk:</strong> Any consequences from using generated content are your responsibility</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Intellectual Property">
            <ul>
              <li><strong>Your Content:</strong> You retain ownership of text you input into our service</li>
              <li><strong>Generated Content:</strong> AI-transformed text is provided as-is without ownership claims from either party</li>
              <li><strong>Service Code:</strong> Our application code and design remain our intellectual property</li>
              <li><strong>Fair Use:</strong> You may use generated content under fair use principles, subject to applicable laws</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Account Management">
            <p>We reserve the right to:</p>
            <ul>
              <li>Suspend or terminate accounts that violate these terms</li>
              <li>Remove content that violates our acceptable use policy</li>
              <li>Limit access during maintenance or technical issues</li>
              <li>Update our service features and availability</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Service Availability">
            <ul>
              <li><strong>No Guarantee:</strong> We strive for high availability but cannot guarantee 100% uptime</li>
              <li><strong>Maintenance:</strong> Service may be temporarily unavailable for updates and maintenance</li>
              <li><strong>Third-Party Dependencies:</strong> Our service relies on external APIs that may affect availability</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Limitation of Liability">
            <p>To the maximum extent permitted by law:</p>
            <ul>
              <li>We provide this service "as is" without warranties of any kind</li>
              <li>We are not liable for any damages arising from your use of our service</li>
              <li>You agree to use our service at your own risk</li>
              <li>Our liability is limited to the amount you paid for our service (which is currently free)</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Changes to Terms">
            <p>We may modify these terms at any time. Continued use of our service after changes constitutes acceptance of the new terms.</p>
            <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
          </CollapsibleSection>

          <CollapsibleSection title="Contact Information">
            <p>Questions about these terms? Contact us through our GitHub repository or the feedback options in the application.</p>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}

export default Terms