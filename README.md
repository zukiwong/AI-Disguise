# AI Disguiser

## Project Overview
An AI-powered text transformation web application that helps users disguise and restyle their text using different styles and purposes. Transform your writing to match various contexts, audiences, and communication goals.

## Features

### Core Transformation Modes
- **Style Mode**: Transform text into different writing styles
  - Chat: Casual, conversational tone for messaging
  - Poetry: Artistic, expressive style with rhythm
  - Social: Engaging content optimized for social media
  - Story: Narrative format for storytelling
- **Purpose + Audience Mode**: Tailor communication based on intent and target
  - Multiple purposes: Explain, Persuade, Comfort, Inform, Request, etc.
  - Various audiences: Friends, Boss, Children, Colleagues, Family, etc.

### User Experience
- **Random Transform**: Surprise yourself with unexpected style combinations
- **Real-time Progress**: GSAP-powered animations during transformation
- **History Management**: Save and revisit your transformations
- **User Authentication**: Login via Google or GitHub
- **Community Features**: Share and explore public transformations

### Multi-language Support
- **Input Languages**: Chinese, English, Japanese, German, Spanish
- **Auto-detection**: Automatically recognizes input language
- **Localized Interface**: English UI with multi-language processing

## Tech Stack
- **Frontend**: React 19 + Vite + React Router DOM
- **Backend**: Vercel Serverless Functions
- **AI Engine**: Google Gemini API (gemini-2.0-flash-exp model)
- **Animations**: GSAP (GreenSock Animation Platform)
- **Database**: Firebase (Authentication, Firestore, Hosting)
- **Styling**: CSS3 with modern design patterns
- **Build Tools**: Vite with React plugin
- **Deployment**: Vercel for seamless CI/CD

## Live Demo
**[Try AI Disguiser](https://ai-disguiser.vercel.app)**

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account (optional for full features)
- Google Gemini API key

### Setup
```bash
# Clone the repository
git clone https://github.com/zukiwong/AI-Disguiser.git
cd AI-Disguiser/ai-disguiser

# Install dependencies
npm install

# Create environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start development server
npm run dev
```

### Available Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure
```
ai-disguiser/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Main application pages
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API and external services
│   ├── styles/        # CSS stylesheets
│   └── assets/        # Static assets
├── api/               # Vercel serverless functions
├── public/            # Public static files
└── docs-private/      # Private documentation
```

## License
MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
- **Repository**: [GitHub Issues](https://github.com/zukiwong/AI-Disguiser/issues)
- **Live Demo**: [ai-disguiser.vercel.app](https://ai-disguiser.vercel.app)

---
Built with React and powered by Google Gemini AI