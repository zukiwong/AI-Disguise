# WordShelf

*Find the right words, right away.*

## Project Overview
WordShelf is like a personal shelf for your everyday messages. Whether you need to explain something clearly, write a quick excuse, or handle an awkward moment without overthinking — just open WordShelf and pick the right words.

## Features

### With WordShelf, you can:

**Store your own responses**: Build a personal library you can always come back to.
- Create custom writing styles and templates
- Save frequently used phrases and responses
- Build your personal communication toolkit

**Explore shared shelves**: See how others handle real-life situations and borrow their ideas.
- Browse community-shared responses
- Discover new ways to express yourself
- Learn from different communication styles

**Generate variants**: Create multiple versions of the same idea — consistent in meaning, different in tone.
- Transform text into different writing styles (Chat, Poetry, Social, Story)
- Tailor communication based on purpose and audience
- Multiple purposes: Explain, Persuade, Comfort, Inform, Request, etc.
- Various audiences: Friends, Boss, Children, Colleagues, Family, etc.

### User Experience
- **Smart Suggestions**: AI-powered text transformation
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
- **AI Engine**: Configurable AI service integration
- **Animations**: GSAP (GreenSock Animation Platform)
- **Database**: Firebase (Authentication, Firestore, Hosting)
- **Styling**: CSS3 with modern design patterns
- **Build Tools**: Vite with React plugin
- **Deployment**: Vercel for seamless CI/CD

WordShelf makes it easier to say the right thing, in the right way, every time.

## Live Demo
**[Try WordShelf](https://wordshelf.vercel.app)**

## Getting Started

### Try Online (Easiest)

**[Launch WordShelf →](https://wordshelf.vercel.app)**

No setup required! WordShelf runs securely in your browser with all processing handled through encrypted API calls.

### Deploy Your Own

**Option 1: Quick Deploy**
- One-click deploy to Vercel (fastest setup)
- Perfect for personal use

**Option 2: Fork & Deploy** 
- Fork this repository to your GitHub
- Import to Vercel from your fork
- Benefits: track updates, customize freely
- Required: Set your AI service API key in Vercel environment variables

### Local Development

**Requirements:** Node.js 18+, AI service API key

**Setup:** Clone, install dependencies, configure `.env` with your API key, then `npm run dev`

For enhanced features like user auth and history, configure Firebase integration.

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
wordshelf/
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


---
Built with React and powered by AI  
*Find the right words, right away.*