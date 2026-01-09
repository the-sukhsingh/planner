# 🎯 Planner - AI-Powered Learning Platform

> Transform scattered learning resources into structured, actionable roadmaps

Planner eliminates "tutorial hell" by converting YouTube playlists, PDFs, documents, or text goals into personalized day-by-day learning roadmaps. Built with Google Gemini AI and real-time Convex backend.

## ✨ Why Planner?

**Problem**: Information overload. Learners drown in YouTube tutorials, PDFs, and courses without a coherent learning path.

**Solution**: AI-powered automatic structuring that breaks complex goals into daily actionable tasks with integrated tutoring.

## 🚀 Features

### 📚 AI Roadmap Generation
- **Text-to-Curriculum**: Describe your goal → Get a complete multi-day structured roadmap
- **YouTube Import**: Paste playlist URL → Auto-schedule videos with durations
- **Document Processing**: Upload PDFs/images → AI extracts concepts and builds curriculum
- **RAG Chat**: Ask questions about your uploaded materials with AI-powered contextual answers

### 🏪 Marketplace
- **Discover & Fork**: Browse and clone community roadmaps
- **Publish & Earn**: Share plans and earn credits from learners
- **Credit System**: Earn through completion streaks, spend on premium features

### 📊 Task Management
- **Visual Dashboard**: Track completion rates and learning streaks
- **Smart Scheduling**: Bulk date-shift feature maintains task sequences
- **Progress Analytics**: Monitor velocity and consistency
- **Daily View**: Clear daily task organization

## 🛠 Tech Stack

### Core
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router & Server Actions
- **[Convex](https://www.convex.dev/)** - Real-time serverless database & backend
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development

### AI & APIs
- **[Google Gemini](https://ai.google.dev/)** - Curriculum generation & RAG chat
- **[YouTube Data API](https://developers.google.com/youtube)** - Playlist import

### UI & Styling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible component system (Radix UI + Tailwind)
- **[Lucide](https://lucide.dev/)** - Icon library

### Auth & Payments
- **[Auth.js](https://authjs.dev/)** - Google OAuth authentication
- **Dodo Payments** - Credit purchase system

## 🏁 Getting Started

### Prerequisites

- **Node.js 18+** and npm/pnpm/yarn
- **[Convex account](https://www.convex.dev/)** (free tier available)
- **[Google Cloud project](https://console.cloud.google.com/)** with:
  - OAuth2 credentials configured
  - Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey)
  - YouTube Data API v3 enabled

### Environment Setup

Create `.env.local` in project root:

```env
# Auth.js (Google OAuth)
AUTH_SECRET="generate-with: openssl rand -base64 32"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google APIs
GEMINI_API_KEY="your-gemini-api-key"
YOUTUBE_API_KEY="your-youtube-api-key"

# Convex (automatically populated by Convex CLI)
NEXT_PUBLIC_CONVEX_URL="your-convex-deployment-url"
CONVEX_DEPLOYMENT="your-convex-deployment"
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/the-sukhsingh/processor.git
cd processor

# 2. Install dependencies
npm install

# 3. Set up Convex backend
npx convex dev  # Creates new project or links existing

# 4. Start Next.js dev server (in new terminal)
npm run dev
```

Access at [http://localhost:3000](http://localhost:3000)

## 📁 Architecture

```
processor/
├── convex/                        # Convex Backend (Serverless)
│   ├── schema.ts                 # Database schema & indexes
│   ├── chats.ts                  # Chat queries & mutations
│   ├── plans.ts                  # Plan CRUD operations
│   ├── todos.ts                  # Task management
│   ├── messages.ts               # Chat message handlers
│   ├── ai.ts                     # Gemini AI integration
│   ├── ai_tools.ts               # AI tool definitions
│   ├── uploads.ts                # Document upload handling
│   └── _generated/               # Auto-generated types
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── dashboard/           # Main dashboard + stats
│   │   ├── marketplace/         # Plan marketplace
│   │   ├── conversations/       # AI chat interface
│   │   ├── plans/               # User's plans view
│   │   ├── uploads/             # Document management
│   │   └── api/                 # API routes (webhooks, auth)
│   │
│   ├── components/              # React Components
│   │   ├── chat/               # Chat UI (messages, input)
│   │   ├── Plan/               # Plan & todo components
│   │   ├── dashboard/          # Dashboard widgets
│   │   └── ui/                 # shadcn/ui base components
│   │
│   ├── context/                # React Context
│   │   ├── ChatContext.tsx    # Chat state
│   │   └── PlanContext.tsx    # Plan state
│   │
│   ├── actions/                # Server Actions
│   │   └── youtube.ts         # YouTube API calls
│   │
│   ├── lib/                    # Utilities
│   │   ├── credits.ts         # Credit system logic
│   │   └── utils.ts           # Helper functions
│   │
│   └── types/                  # TypeScript types
│
├── public/                      # Static assets
└── .github/instructions/        # AI coding instructions
```

## 🔧 Scripts

```bash
npm run dev          # Start Next.js dev server
npx convex dev       # Start Convex backend (separate terminal)
npm run build        # Build for production
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Recommended Setup
- **Frontend**: [Vercel](https://vercel.com) (one-click Next.js deployment)
- **Backend**: [Convex](https://dashboard.convex.dev) (auto-deploys on push)

### Production Checklist
1. Deploy Convex backend: `npx convex deploy`
2. Add all `.env.local` variables to Vercel
3. Set `NEXT_PUBLIC_CONVEX_URL` to production Convex URL
4. Configure Google OAuth redirect URIs for production domain

## 🤝 Contributing

Contributions welcome! Open issues for bugs/features or submit PRs.

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Built With

- [Google Gemini](https://ai.google.dev/) - AI curriculum generation
- [Convex](https://www.convex.dev/) - Real-time backend
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Lucide](https://lucide.dev/) - Icons

## 📧 Contact

- **GitHub**: [@the-sukhsingh](https://github.com/the-sukhsingh)
- **Issues**: [Report bugs](https://github.com/the-sukhsingh/processor/issues)

---

<p align="center">Built with ❤️ by <a href="https://github.com/the-sukhsingh">Sukh Singh</a></p>
