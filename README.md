# Planner - AI Learning Roadmap Generator

Planner is a powerful web application designed to help users create, manage, and share personalized learning roadmaps. Leveraging state-of-the-art AI, Planner transforms your goals, documents, and even YouTube playlists into structured daily tasks.

## 🚀 Key Features

- **AI-Generated Plans**: Simply describe what you want to learn, and our AI creates a comprehensive roadmap for you.
- **YouTube to Plan**: Import any YouTube playlist URL, and Planner will convert each video into a scheduled task with integrated resources.
- **Interactive Chat**: Chat with an AI assistant that has context of your uploaded documents (PDFs, Images) to refine your learning journey.
- **Marketplace**: Publish your original learning plans to the marketplace or discover plans created by others.
- **Plan Management**:
  - Fork and remix existing plans.
  - Track progress with a smart task dashboard.
  - Bulk shift task dates to fit your changing schedule.
- **Credit System**: A built-in credit system for premium actions like YouTube imports and complex AI interactions.
- **Privacy First**: Uploaded documents are automatically deleted from storage and database once the AI processing is complete.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Background Processing**: [Inngest](https://www.inngest.com/)
- **Authentication**: [Auth.js](https://authjs.dev/) (Google Auth)
- **Storage**: [Supabase Storage](https://supabase.com/storage)
- **AI**: [Google Gemini API](https://ai.google.dev/)
- **UI Components**: Radix UI, Lucide Icons, and Tailwind CSS

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Google Cloud project (for Auth and YouTube API)
- An Inngest account (or run locally)
- A Gemini API key

### Environment Setup

Create a `.env.local` file in the root directory and add the following:

```env
# Database
DATABASE_URL=your_postgresql_url

# Auth.js
AUTH_SECRET=your_auth_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Supabase (Storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/the-sukhsingh/processor.git
   cd processor
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Run Inngest dev server (in a separate terminal):
   ```bash
   npm run inngest
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Project Structure

- `src/actions`: Server actions for database operations and YouTube integration.
- `src/app`: Next.js pages and API routes.
- `src/components`: Reusable UI components.
- `src/context`: React contexts for global state management (Plans, Chat).
- `src/inngest`: AI agents and background job definitions.
- `src/schema`: Database schema definitions using Drizzle.

## ⚖ License

This project is licensed under the MIT License.
