# AI Disguise

*Find the right words, right away.*

**[Try AI Disguise →](https://wordshelf.vercel.app)**

## What is AI Disguise?

AI Disguise is your personal communication assistant. Whether you need to explain something clearly, write a quick message, or handle an awkward moment, just open AI Disguise and find the right words.

## Screenshots

![Homepage](ai-disguise/docs/screenshots/Homepage.png)
![Text Transformation](ai-disguise/docs/screenshots/transformation.png)
![Variants](ai-disguise/docs/screenshots/Variants.png)

## Features

###  Style Transformation
Transform your text into different writing styles (Chat, Poetry, Social, Story) or tailor it based on purpose and audience.

###  Personal Library
Save custom writing styles, templates, and frequently used phrases. Build your personal communication toolkit.

###  Community Sharing
Browse and share responses with the community. Discover new ways to express yourself.

###  Flexible API Options
- **Free mode**: 20 conversions per day
- **Custom mode**: Use your own API key (Gemini, OpenAI, Claude, DeepSeek)
- No usage limits with your own key

###  Multi-language Support
 English, Chinese (中文), Japanese (日本語), German (Deutsch), Spanish (Español) with automatic language detection.

###  History & Management
Save and revisit your transformations with smart history management.

## Tech Stack

- **Frontend**: React + Vite + React Router DOM
- **Backend**: Vercel Serverless Functions
- **AI**: Multi-provider support (Gemini, OpenAI, Claude, DeepSeek)
- **Database**: Firebase (Auth, Firestore)

## Local Development

```bash
# Clone the repository
git clone 

# Install dependencies
cd ai-disguise
npm install

# Configure environment
cp .env.example .env
# Add your API key to .env

# Start development server
npm run dev
```

## Security

User API keys are Base64-encoded and stored securely with Firestore security rules. See [SECURITY.md](SECURITY.md) for details.

## License

MIT License 


