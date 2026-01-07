"use client"
import ChatInterface from '@/components/chat/ChatInterface'
import List from '@/components/Plan/List'
import { useAuth } from '@/context/AuthContext'
import { Rocket, Sparkles, MessageSquare } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const Home = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isAuthenticated) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-linear-to-b from-background to-accent/20 px-4 text-center">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            AI-Powered Learning Mastery
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground via-foreground/80 to-foreground/40 leading-tight">
            Design Your Future, <br />
            <span className="text-primary">Step by Step.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Planner uses advanced AI to transform your learning goals into actionable, organized plans.
            Upload documents, chat with your assistant, and track your progress in real-time.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full px-8 text-lg font-bold shadow-xl shadow-primary/20 h-14" onClick={() => signIn("google")}>
              Start Planning Now
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 text-lg font-bold h-14">
              View Demo
            </Button>
          </div>
        </div>
      </main>
    )
  }
  else if (isLoading) {
    return (
      <div className='w-full h-full flex justify-center items-center'>
        Loading...
      </div>
    )
  }
   else {

    return (
      <main id="main-content" className='w-full h-[calc(100vh-4rem)] bg-background/50 relative'>
        <div className='max-w-6xl border-x mx-auto h-full flex flex-col md:flex-row divide-x divide-border overflow-hidden'>
          {/* Sidebar/Todo Section - Visible on desktop (side) and mobile (main) */}
          <aside className='w-full md:w-112.5 bg-accent/5 overflow-hidden transition-all duration-300'>
            <div className='h-full flex flex-col p-2 md:p-3'>
              <div className="flex items-center gap-2 mb-2 px-4 py-1 md:px-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Today's Focus</h2>
              </div>
              <div className="flex-1 overflow-hidden rounded-b-none md:rounded-xl border-x border-t md:border bg-background/40 backdrop-blur-md shadow-2xl shadow-primary/5">
                <List />
              </div>
            </div>
          </aside>
          {/* Chat Section - Hidden on mobile, flex-1 on desktop */}
          <section className='hidden md:flex flex-1 min-w-0 bg-background/30 backdrop-blur-sm overflow-hidden'>
            <div className='h-full w-full flex flex-col p-4 md:p-2'>
              <ChatInterface />
            </div>
          </section>


        </div>

        {/* Floating Chat Button for Mobile */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full h-14 w-14 shadow-2xl p-0 flex items-center justify-center animate-in zoom-in slide-in-from-bottom-10 duration-500">
                <MessageSquare className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="h-[92vh] w-[95vw] max-w-2xl p-0 flex flex-col gap-0 overflow-hidden rounded-2xl border-primary/20 bg-background/95 backdrop-blur-xl">
              <DialogHeader className="p-4 border-b bg-muted/20">
                <DialogTitle className="flex items-center gap-2 text-primary font-bold">
                  <Sparkles className="h-5 w-5" />
                  AI Assistant
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden p-4">
                <ChatInterface showHeader={false} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    )
  }

}

export default Home