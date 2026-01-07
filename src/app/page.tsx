"use client"
import { useState } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import List from '@/components/Plan/List'
import { useAuth } from '@/context/AuthContext'
import { Sparkles, MessageSquare, X } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import MinimalStats from '@/components/dashboard/MinimalStats'
import UtilityBar from '@/components/dashboard/UtilityBar'

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
      <main id="main-content" className='w-full h-[calc(100vh-4rem)] bg-background relative flex flex-col overflow-hidden'>
        {/* Main Bento Grid Layout */}
        <div className='flex-1 grid grid-cols-[340px_1fr_450px] gap-4 p-4 overflow-hidden'>
          {/* Left Sidebar - Stats & Session */}
          <div className='flex flex-col gap-4 overflow-y-auto'>
            {/* Stats Card */}
            <div className='border rounded-2xl p-6'>
              <h3 className='text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide'>Stats</h3>
              <div className='space-y-4'>
                <MinimalStats />
              </div>
            </div>

            {/* Session Timer Card */}
            <div className='border rounded-2xl p-4 flex-1'>
              <h3 className='text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide'>Session</h3>
              <div className='relative'>
                <UtilityBar />
              </div>
            </div>
          </div>

          {/* Center - Todo List */}
          <div className='border rounded-2xl overflow-hidden flex flex-col'>
            <div className='p-4 border-b'>
              <h2 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                Todo List
              </h2>
            </div>
            <div className='flex-1 overflow-hidden'>
              <List />
            </div>
          </div>

          {/* Right - Chat Interface */}
          <div className='border rounded-2xl overflow-hidden flex flex-col relative'>
            <div className='flex items-center justify-between px-6 py-4 border-b'>
              <h2 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                Chat
              </h2>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <ChatInterface showHeader={true} />
            </div>
          </div>
        </div>
      </main>
    )
  }

}

export default Home