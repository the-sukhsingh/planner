"use client"
import React, { useEffect, useState, useMemo } from 'react'
import ConversationManager from '@/components/ConversationManager'
import ChatInterface from '@/components/chat/ChatInterface'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, Search, Calendar, ChevronRight, Hash, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChat, Conversation } from '@/context/ChatContext'
import { Id } from '../../../convex/_generated/dataModel'

const ConversationsPage = () => {
  const { conversations, selectedConversationId, setSelectedConversationId, loading } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const selectedConversation = useMemo(() =>
    conversations.find(c => c._id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const filteredConversations = useMemo(() =>
    conversations.filter(c =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [conversations, searchQuery]
  );

  const handleSelectConversation = (id: Id<"chats">) => {
    setSelectedConversationId(id);
    // On mobile, open the dialog
    if (window.innerWidth < 768) {
      setIsMobileChatOpen(true);
    }
  };

  const handleNewChat = () => {
    setSelectedConversationId(null);
    setIsMobileChatOpen(true);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-6xl mx-auto border-x bg-background overflow-hidden animate-in fade-in duration-500 relative">
      {/* Sidebar - Full width on mobile, w-96 on desktop */}
      <aside className="w-full md:w-96 border-r flex flex-col bg-accent/5 backdrop-blur-xl">
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight mb-2 ">
                Chats
              </h1>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full border hidden md:flex" onClick={() => handleNewChat()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Search history..."
              className="pl-10 h-10 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-bold text-muted-foreground/40">No records found</p>
            </div>
          ) : (
            filteredConversations.map((c: Conversation) => (
              <div
                key={c._id}
                className={cn(
                  "group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-start gap-4 mb-2 border",
                  selectedConversationId === c._id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary"
                    : "bg-background/40 hover:bg-accent/50 text-foreground border-border/10 hover:border-border/50"
                )}
                onClick={() => handleSelectConversation(c._id)}
              >
                <div className={cn(
                  "mt-1 p-2 rounded-xl transition-colors shrink-0",
                  selectedConversationId === c._id ? "bg-primary-foreground/20" : "bg-primary/5 text-primary group-hover:bg-primary/10"
                )}>
                  <Hash className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate leading-tight mb-1">{c.title}</div>
                  <div className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-60",
                    selectedConversationId === c._id ? "text-primary-foreground" : "text-muted-foreground"
                  )}>
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                <ChevronRight className={cn(
                  "h-4 w-4 self-center transition-transform",
                  selectedConversationId === c._id ? "opacity-100 translate-x-1" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 outline-hidden"
                )} />
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat View - Hidden on mobile */}
      <main className="hidden md:flex flex-1 flex-col bg-background/50 relative overflow-hidden">
        {selectedConversationId ? (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight leading-none">{selectedConversation?.title}</h1>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Active Session</p>
                </div>
              </div>
              <ConversationManager id={selectedConversationId} />
            </div>

            <div className="flex-1 overflow-hidden p-4 md:p-8">
              <ChatInterface
                initialChatId={selectedConversationId}
                showHeader={false}
                key={selectedConversationId}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative h-24 w-24 bg-background border rounded-[2rem] shadow-2xl flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter">Your Conversations</h2>
            <p className="text-muted-foreground mt-3 max-w-sm font-medium">Select a thread from the history or start a new learning journey.</p>
            <Button className="mt-8 h-12 px-8 rounded-full font-bold shadow-xl shadow-primary/20 gap-2" onClick={handleNewChat}>
              <Plus className="h-5 w-5" />
              New Chat
            </Button>
          </div>
        )}
      </main>

      {/* Mobile Chat FAB */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <Button size="lg" className="rounded-full h-14 w-14 shadow-2xl p-0 flex items-center justify-center animate-in zoom-in slide-in-from-bottom-10 duration-500" onClick={() => handleNewChat()}>
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Chat Dialog */}
      <Dialog open={isMobileChatOpen} onOpenChange={setIsMobileChatOpen}>
        <DialogContent className="h-[92vh] w-[95vw] max-w-2xl p-0 flex flex-col gap-0 overflow-hidden rounded-2xl border-primary/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="p-4 border-b bg-muted/20">
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold tracking-tight leading-none">
                    {selectedConversation?.title || "New Chat"}
                  </DialogTitle>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">AI Assistant</p>
                </div>
              </div>
              {selectedConversation && <ConversationManager id={selectedConversation._id} />}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-4">
            <ChatInterface
              initialChatId={selectedConversation?._id}
              showHeader={false}
              key={selectedConversation?._id || 'new'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConversationsPage;