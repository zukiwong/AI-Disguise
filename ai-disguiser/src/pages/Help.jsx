// 帮助和FAQ页面
import React from 'react'
import CollapsibleSection from '../components/CollapsibleSection'
import '../styles/Legal.css'

const Help = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Help & FAQ</h1>
        <div className="legal-content">
          <CollapsibleSection title="How to Use AI Disguiser">
            <p>AI Disguiser is simple to use:</p>
            <ul>
              <li><strong>Enter Your Text:</strong> Type or paste your original text in the input area</li>
              <li><strong>Choose Style Mode:</strong> Select from Chat, Poetry, Social, or Story styles</li>
              <li><strong>Or Choose Purpose Mode:</strong> Select what you want to achieve and who you're talking to</li>
              <li><strong>Click Transform:</strong> Hit the "Disguise" button to transform your text</li>
              <li><strong>Use Random:</strong> Try the "Random Transform" for a surprise style</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="What Are the Different Styles?">
            <ul>
              <li><strong>Chat:</strong> Casual, conversational tone perfect for messaging and informal communication</li>
              <li><strong>Poetry:</strong> Artistic, expressive style with rhythm and creative language</li>
              <li><strong>Social:</strong> Engaging, shareable content optimized for social media platforms</li>
              <li><strong>Story:</strong> Narrative format that turns your content into an engaging tale</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="How Does Purpose + Audience Mode Work?">
            <p>This mode lets you specify your communication goal and target audience:</p>
            <ul>
              <li><strong>Purpose:</strong> What you want to achieve (explain, persuade, comfort, inform, etc.)</li>
              <li><strong>Audience:</strong> Who you're communicating with (friends, boss, children, etc.)</li>
              <li><strong>Result:</strong> Text tailored specifically for your situation</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Can I Save My Transformations?">
            <p>Yes! When you log in with Google or GitHub:</p>
            <ul>
              <li>Your transformation history is automatically saved</li>
              <li>Access your history from the History page</li>
              <li>Share interesting transformations publicly</li>
              <li>Your data is stored securely in Firebase</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="What Languages Are Supported?">
            <p>AI Disguiser supports multiple languages:</p>
            <ul>
              <li><strong>Input:</strong> Chinese, English, Japanese, German, Spanish</li>
              <li><strong>Auto-Detection:</strong> The system automatically detects your input language</li>
              <li><strong>Output:</strong> Transformed text maintains the original language</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Why Is My Text Not Transforming?">
            <p>Common issues and solutions:</p>
            <ul>
              <li><strong>Text Too Short:</strong> Minimum 10 characters required</li>
              <li><strong>Text Too Long:</strong> Maximum 2000 characters allowed</li>
              <li><strong>Network Issues:</strong> Check your internet connection</li>
              <li><strong>API Limits:</strong> Try again in a few moments if you get errors</li>
              <li><strong>Inappropriate Content:</strong> Ensure your text follows our guidelines</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Is My Data Safe?">
            <p>We take your privacy seriously:</p>
            <ul>
              <li>Text is processed securely through Google Gemini API</li>
              <li>No data is stored permanently on our servers</li>
              <li>Account data is encrypted and stored in Firebase</li>
              <li>You can delete your account and data anytime</li>
              <li>Read our Privacy Policy for full details</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="The App Is Not Working Properly">
            <p>Troubleshooting steps:</p>
            <ul>
              <li><strong>Refresh the Page:</strong> Try reloading the browser</li>
              <li><strong>Clear Cache:</strong> Clear your browser cache and cookies</li>
              <li><strong>Different Browser:</strong> Try using Chrome, Firefox, or Safari</li>
              <li><strong>Check Console:</strong> Open browser developer tools to check for errors</li>
              <li><strong>Report Issues:</strong> Contact us through GitHub if problems persist</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="How to Contact Support">
            <p>Need more help? Here's how to reach us:</p>
            <ul>
              <li><strong>GitHub Issues:</strong> Report bugs or request features on our repository</li>
              <li><strong>Open Source:</strong> View our code and contribute on GitHub</li>
              <li><strong>Response Time:</strong> We typically respond within 24-48 hours</li>
            </ul>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}

export default Help