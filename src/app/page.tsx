"use client"
import { useState } from 'react'
import ChatInterface from '@/components/chat/ChatInterface'
import List from '@/components/Plan/List'
import { useAuth } from '@/context/AuthContext'
import { Sparkles, MessageSquare, X, Target, Brain, Trophy, Zap, Clock, CheckCircle2, BarChart3, FileText, MessageCircle, Shield, Star, ArrowRight, Users } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MinimalStats from '@/components/dashboard/MinimalStats'
import UtilityBar from '@/components/dashboard/UtilityBar'

const Home = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showChat, setShowChat] = useState(false);


  if (!isAuthenticated) {
    return (
      <main className="flex flex-col items-center min-h-screen bg-background">
        {/* Hero Section */}
        <section className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-linear-to-b from-background to-accent/20 px-4 text-center">
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Learning Planns
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

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>50,000+ Goals Achieved</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Everything You Need to <span className="text-primary">Succeed</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to help you plan, learn, and achieve your goals faster than ever before.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>AI-Powered Planning</CardTitle>
                  <CardDescription>
                    Let AI break down complex goals into manageable, actionable steps tailored to your learning style.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Smart Chat Assistant</CardTitle>
                  <CardDescription>
                    Chat with your AI assistant anytime for guidance, explanations, and personalized learning support.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Document Analysis</CardTitle>
                  <CardDescription>
                    Upload PDFs, notes, and study materials. AI analyzes and creates structured learning plans from them.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription>
                    Monitor your learning journey with detailed analytics, streaks, and visual progress indicators.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
                  </div>
                  <CardTitle>Youtube Playlist</CardTitle>
                  <CardDescription>
                    Create Plans directly from Youtube videos and playlists to streamline your learning experience.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Plan Marketplace</CardTitle>
                  <CardDescription>
                    Browse and purchase curated learning plans created by experts and top learners.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-20 px-4 bg-accent/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                How It <span className="text-primary">Works</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get started in minutes and transform the way you learn
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold">Set Your Goals</h3>
                <p className="text-muted-foreground">
                  Tell us what you want to learn or achieve. Be as specific or general as you like.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold">Get Your Plan</h3>
                <p className="text-muted-foreground">
                  AI creates a customized, step-by-step plan with tasks, resources, and timelines.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold">Track & Achieve</h3>
                <p className="text-muted-foreground">
                  Follow your plan, track progress, and get AI support whenever you need it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full py-20 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Simple, <span className="text-primary">Transparent</span> Pricing
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Pay only for what you use. No subscriptions, no hidden fees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Starter Pack */}
              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Starter Pack</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$1.10</span>
                    <span className="text-muted-foreground ml-2">one-time</span>
                  </div>
                  <CardDescription className="mt-4">Perfect for trying out AI features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>100 AI Credits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>$0.011 per credit</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Pay as you go</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>No expiration</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline" onClick={() => signIn("google")}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              {/* Value Pack */}
              <Card className="border-4 border-primary relative hover:shadow-2xl transition-all scale-105">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </div>
                <CardHeader>
                  <CardTitle>Value Pack</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$3.33</span>
                    <span className="text-muted-foreground ml-2">one-time</span>
                  </div>
                  <CardDescription className="mt-4">Best value for regular learners</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>400 AI Credits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>$0.0083 per credit</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Pay as you go</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>No expiration</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" onClick={() => signIn("google")}>
                    Get Credits
                  </Button>
                </CardContent>
              </Card>

              {/* Power Pack */}
              <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle>Power Pack</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$6.67</span>
                    <span className="text-muted-foreground ml-2">one-time</span>
                  </div>
                  <CardDescription className="mt-4">Maximum credits at the best rate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>1000 AI Credits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>$0.0067 per credit</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Pay as you go</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>No expiration</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline" onClick={() => signIn("google")}>
                    Get Credits
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Credit Usage Examples */}
            <div className="mt-12 max-w-3xl mx-auto">
              <h3 className="text-center text-lg font-semibold mb-6">Credit Usage Examples</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">1-2</div>
                  <div className="text-sm text-muted-foreground">Credits</div>
                  <div className="text-sm font-medium">Short chat response</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">3-5</div>
                  <div className="text-sm text-muted-foreground">Credits</div>
                  <div className="text-sm font-medium">Long explanation</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">8-15</div>
                  <div className="text-sm text-muted-foreground">Credits</div>
                  <div className="text-sm font-medium">Playlist generation</div>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Credits are only deducted after successful AI responses. Failed or partial responses are not charged.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 px-4 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your <span className="text-primary">Learning Journey?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of learners who are achieving their goals faster with AI-powered planning.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" className="rounded-full px-8 text-lg font-bold shadow-xl shadow-primary/20 h-14" onClick={() => signIn("google")}>
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-8 px-4 border-t bg-background">
          <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Planner. All rights reserved.</p>
          </div>
        </footer>
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
      <main id="main-content" className='w-full h-[calc(100vh-4rem)] bg-background relative flex flex-col xl:overflow-hidden'>
        {/* Main Bento Grid Layout */}
        <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[340px_1fr_450px] gap-4 p-4 sm:overflow-hidden'>
          {/* Left Sidebar - Stats & Session */}
          <div className='flex flex-col gap-4 overflow-y-auto row-start-2 sm:row-start-1'>
            {/* Stats Card */}
            <div className='border rounded-2xl p-4'>
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
          <div className='hidden border rounded-2xl overflow-hidden xl:flex flex-col relative'>
            <div className='flex items-center justify-between px-6 py-4 border-b'>
              <h2 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                Chat
              </h2>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <ChatInterface showHeader={true} />
            </div>
          </div>

          {/* Chat Dialog */}
          {showChat && (
            <div className="fixed inset-0 bg-background backdrop-blur-sm flex flex-col z-50 animate-in fade-in duration-300">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
                  Chat
                </h2>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 rounded-full hover:bg-accent/50 transition"
                  aria-label="Close Chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <ChatInterface showHeader={false} />
              </div>
            </div>
          )}
        </div>
        {/* Chat Toggle Button for smaller screens */}
        {!showChat && (
          <Button
            variant="default"
            size="icon-lg"
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 rounded-full right-6 z-50 xl:hidden"
            aria-label="Open Chat"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        )}
      </main>
    )
  }

}

export default Home