// 用户指南页面
import React from 'react'
import CollapsibleSection from '../components/CollapsibleSection'
import '../styles/Legal.css'

const Guide = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>User Guide</h1>
        <div className="legal-content">
          <CollapsibleSection title="Getting Started">
            <p>Welcome to AI Disguise! Here's how to get the most out of our text transformation tool:</p>
            <ul>
              <li><strong>No Registration Required:</strong> You can start using the tool immediately</li>
              <li><strong>Optional Login:</strong> Sign in with Google or GitHub to save your history</li>
              <li><strong>Free to Use:</strong> All features are completely free</li>
              <li><strong>No Downloads:</strong> Works entirely in your web browser</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Understanding the Interface">
            <p>The main interface has several key areas:</p>
            <ul>
              <li><strong>Text Input Area:</strong> Large text box where you enter your original text</li>
              <li><strong>Mode Selection:</strong> Toggle between Style Mode and Purpose+Audience Mode</li>
              <li><strong>Style Options:</strong> Choose from Chat, Poetry, Social, or Story styles</li>
              <li><strong>Transform Buttons:</strong> "Disguise" for manual selection or "Random Transform" for surprise results</li>
              <li><strong>Results Area:</strong> Shows your transformed text with share and copy options</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Style Mode Deep Dive">
            <p>Each style serves different purposes:</p>
            <ul>
              <li><strong>Chat Style:</strong> Perfect for casual conversations, messages to friends, informal emails. Makes text sound natural and conversational.</li>
              <li><strong>Poetry Style:</strong> Adds artistic flair, metaphors, and rhythm. Great for creative writing, social media captions, or adding elegance to your words.</li>
              <li><strong>Social Style:</strong> Optimized for social media with hashtags, engaging language, and shareable content. Ideal for posts, tweets, and online content.</li>
              <li><strong>Story Style:</strong> Transforms information into narrative format. Perfect for making presentations, reports, or explanations more engaging.</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Purpose + Audience Mode">
            <p>This advanced mode gives you precise control:</p>
            <ul>
              <li><strong>Purpose Selection:</strong> Choose from Explain, Persuade, Comfort, Inform, Request, Apologize, Congratulate, and more</li>
              <li><strong>Audience Selection:</strong> Tailor your message for Friends, Boss, Children, Colleagues, Family, Clients, etc.</li>
              <li><strong>Smart Combinations:</strong> The AI understands context and adjusts tone, formality, and language accordingly</li>
              <li><strong>Professional Use:</strong> Great for business communication, customer service, or any situation requiring specific tone</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Best Practices for Great Results">
            <p>Follow these tips to get the best transformations:</p>
            <ul>
              <li><strong>Clear Input:</strong> Use complete sentences and clear ideas for better results</li>
              <li><strong>Appropriate Length:</strong> 50-500 characters usually work best (10-2000 limit)</li>
              <li><strong>Context Matters:</strong> Include enough context so the AI understands your intent</li>
              <li><strong>Experiment:</strong> Try different styles with the same text to see various results</li>
              <li><strong>Review Output:</strong> Always review and edit the generated text before using it</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Managing Your History">
            <p>When logged in, you can manage your transformations:</p>
            <ul>
              <li><strong>Automatic Saving:</strong> Every transformation is saved automatically</li>
              <li><strong>History Page:</strong> Access all your past transformations</li>
              <li><strong>Search and Filter:</strong> Find specific transformations quickly</li>
              <li><strong>Public Sharing:</strong> Mark transformations as public to share with the community</li>
              <li><strong>Export Options:</strong> Copy or share individual results</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Exploring Community Content">
            <p>Discover what others are creating:</p>
            <ul>
              <li><strong>Explore Page:</strong> Browse public transformations from other users</li>
              <li><strong>Inspiration:</strong> See creative ways others use different styles</li>
              <li><strong>Learn Techniques:</strong> Discover new approaches to text transformation</li>
              <li><strong>Share Your Work:</strong> Contribute your best transformations to inspire others</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Advanced Tips and Tricks">
            <p>Power user techniques:</p>
            <ul>
              <li><strong>Random Transform:</strong> Use when you're stuck or want creative inspiration</li>
              <li><strong>Chain Transformations:</strong> Take output from one style and transform it again with another</li>
              <li><strong>A/B Testing:</strong> Try the same text with different audiences to see tone variations</li>
              <li><strong>Template Creation:</strong> Save successful transformation patterns for future use</li>
              <li><strong>Multilingual Input:</strong> The tool works with various languages automatically</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection title="Technical Requirements">
            <p>System requirements and compatibility:</p>
            <ul>
              <li><strong>Browsers:</strong> Works on Chrome, Firefox, Safari, and Edge (latest versions)</li>
              <li><strong>Internet:</strong> Requires stable internet connection for AI processing</li>
              <li><strong>Mobile:</strong> Fully responsive design works on phones and tablets</li>
              <li><strong>JavaScript:</strong> Must be enabled for full functionality</li>
              <li><strong>Cookies:</strong> Required for login and saving preferences</li>
            </ul>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}

export default Guide