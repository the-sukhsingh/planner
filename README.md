# 🎯 Planner - AI-Powered Learning Orchestration Platform

> Transform scattered learning resources into structured, actionable roadmaps with the power of AI

Planner is an intelligent learning orchestration engine that eliminates "tutorial hell" by converting unstructured educational content—YouTube playlists, PDFs, course materials, or simple learning goals—into personalized, day-by-day learning roadmaps. Built with cutting-edge AI technology, Planner serves as both your curriculum designer and personal tutor.

## ✨ Why Planner?

**The Problem**: Learners today face information overload. With countless YouTube tutorials, scattered PDFs, and fragmented resources, creating a coherent learning path is overwhelming and time-consuming.

**The Solution**: Planner uses advanced AI to automatically structure your learning journey, breaking down complex goals into manageable daily tasks while providing contextual support throughout your learning process.

## 🚀 Core Features

### 📚 Intelligent Roadmap Generation
- **Text-to-Curriculum**: Describe what you want to learn, and our AI generates a comprehensive, multi-day structured roadmap
- **YouTube Integration**: Paste any YouTube playlist URL to automatically convert videos into scheduled learning tasks with durations and resources
- **Document Processing**: Upload PDFs or images, and AI extracts key concepts to build a customized curriculum

### 🏪 Learning Marketplace
- **Discover Plans**: Browse community-created learning roadmaps across various topics
- **Publish & Earn**: Share your original plans and help others learn
- **Fork & Customize**: Clone existing plans and adapt them to your needs
- **Credit Economy**: Integrated credit system for premium features and marketplace transactions

### 📊 Advanced Task Management
- **Progress Tracking**: Visual dashboard showing completion status and learning streaks
- **Smart Scheduling**: Bulk date shifting maintains task dependencies when your schedule changes
- **Daily Tasks**: Organized view of what to learn each day with clear objectives
- **Completion Analytics**: Track your learning velocity and consistency

### 🔒 Privacy & Security
- **Auto-Cleanup**: Uploaded documents are automatically deleted after AI processing
- **Secure Authentication**: Google OAuth integration for seamless, secure access
- **Data Protection**: All user data encrypted and securely stored

## 🛠 Technology Stack

### Frontend & UI
- **[Next.js 14+](https://nextjs.org/)** - React framework with App Router
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon set

### Backend & Database
- **[Convex](https://www.convex.dev/)** - Real-time backend platform

### AI & Processing
- **[Google Gemini API](https://ai.google.dev/)** - Advanced language model for curriculum generation
- **[YouTube Data API](https://developers.google.com/youtube)** - Playlist and video metadata extraction

### Infrastructure
- **[Auth.js](https://authjs.dev/)** - Authentication with Google OAuth

## 🏁 Getting Started

### Prerequisites

Before running Planner locally, ensure you have:

- **Node.js 18+** and npm/yarn installed
- **Convex account** with a project set up
- **Google Cloud project** with OAuth2 credentials
- **Google Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **YouTube Data API v3** enabled in Google Cloud Console

### Environment Configuration

Create a `.env.local` file in the project root:

```env
# Authentication (Auth.js)
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google AI Services
GEMINI_API_KEY="your-gemini-api-key"
YOUTUBE_API_KEY="your-youtube-data-api-key"

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/the-sukhsingh/processor.git
   cd processor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push  # Push schema to database
   npm run db:studio  # (Optional) Open Drizzle Studio
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: [http://localhost:3000](http://localhost:3000)

## 📁 Project Architecture

```
processor/
├── convex/                    # Convex backend functions
│   ├── schema.ts             # Database schema definitions
│   ├── chats.ts              # Chat message handlers
│   ├── plans.ts              # Learning plan operations
│   └── users.ts              # User management
|   └── ...                     # Other Convex functions
│
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── dashboard/       # User dashboard & stats
│   │   ├── marketplace/     # Plan marketplace
│   │   ├── conversations/   # AI chat interface
│   │   └── api/            # API routes & webhooks
│   │
│   ├── components/          # Reusable React components
│   │   ├── chat/           # Chat UI components
│   │   ├── Plan/           # Plan management UI
│   │   ├── dashboard/      # Dashboard widgets
│   │   └── ui/             # shadcn/ui components
│   │
│   ├── actions/            # Server actions
│   │   └── youtube.ts      # YouTube API integration
│   │
│   ├── context/            # React context providers
│   │   ├── ChatContext.tsx # Chat state management
│   │   └── PlanContext.tsx # Plan state management
│   │
│   └── types/              # TypeScript type definitions
│
├── public/                 # Static assets
└── scripts/               # Utility scripts
```

## 🔧 Key Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Recommended Platforms

- **Frontend**: [Vercel](https://vercel.com) (optimized for Next.js)
- **Database**: [Convex](https://www.convex.dev)

### Environment Variables in Production

Ensure all environment variables from `.env.local` are configured in your deployment platform, with production URLs and keys.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Google Gemini](https://ai.google.dev/) for advanced AI capabilities
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/the-sukhsingh/processor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/the-sukhsingh/processor/discussions)

---

<p align="center">Made with ❤️ by <a href="https://github.com/the-sukhsingh">Sukh Singh</a></p>
