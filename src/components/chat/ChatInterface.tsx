"use client"
import React, { useState, useRef, useEffect } from 'react'
import Message from './Message'
import ChatInput from './Input'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChat } from '@/context/ChatContext'
import { useAuth } from '@/context/AuthContext'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
    type?: 'text' | 'document';
    fileName?: string;
}

interface ChatInterfaceProps {
    initialChatId?: string | null;  // Changed to string to match Convex Id<"chats">
    initialMessages?: ChatMessage[];
    showHeader?: boolean;
    showInput?: boolean;
}


const ChatInterface = ({ initialChatId = null, initialMessages = [], showHeader = true, showInput = true }: ChatInterfaceProps) => {
    const { data: session } = useSession()
    const { setSelectedConversationId } = useChat()
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const filesRef = useRef<FileList | null>(null)
    const eventSourceRef = useRef<EventSource | null>(null)
    const lastMessageIdRef = useRef<string | null>(null)
    const seenMessageIdsRef = useRef<Set<string>>(new Set())
    const [chatId, setChatId] = useState<string | null>(initialChatId)

    // Fetch messages from Convex when chatId is available
    const convexMessages = useQuery(
        api.messages.listChatMessages,
        chatId && user?._id ? { userId: user._id, chatId: chatId as Id<"chats"> } : "skip"
    );

    // Sync Convex messages to local state
    useEffect(() => {
        if (convexMessages && convexMessages.length > 0) {
            const formattedMessages: ChatMessage[] = convexMessages.map((msg) => ({
                id: msg._id,
                content: msg.content,
                sender: msg.role === 'user' ? 'user' : 'ai',
                timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'text',
            }));
            setMessages(formattedMessages);
        }
    }, [convexMessages]);

    const handleNewChat = () => {
        setMessages([])
        setChatId(null)
        lastMessageIdRef.current = null
        seenMessageIdsRef.current.clear()
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])


    const handleSendMessage = async (message: string) => {
        if (!message.trim() && !filesRef.current) return

        const userMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            content: message,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text',
        }
        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.append('question', message)
            if (chatId) {
                formData.append('chatId', chatId.toString())
            }

            if (filesRef.current) {
                Array.from(filesRef.current).forEach(file => {
                    formData.append('file', file)
                    const documentMessage: ChatMessage = {
                        id: `doc-${Date.now()}`,
                        content: `Uploaded document: ${file.name}`,
                        sender: 'user',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: 'document',
                        fileName: file.name,
                    }
                    setMessages(prev => [...prev, documentMessage])
                })
                filesRef.current = null
            }

            const response = await fetch('/api/ask', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                const errorMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    content: `Error: ${data.error || 'Failed to send message'}`,
                    sender: 'ai',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
                setMessages(prev => [...prev, errorMessage])
                setIsLoading(false)
            } else {
                if (data.conversationId && !chatId) {
                    setChatId(data.conversationId)
                    // Sync with global chat context - Convex will auto-update
                    setSelectedConversationId(data.conversationId as Id<"chats">);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error)
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                content: 'Failed to send message. Please try again.',
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            setMessages(prev => [...prev, errorMessage])
            setIsLoading(false)
        }
    }

    const handleFiles = (files: FileList) => {
        filesRef.current = files
    }

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto ">
            {
                showHeader && <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={handleNewChat} aria-label="Start new chat">+ New Chat</Button>
                        <div className="text-sm text-muted-foreground">{messages.length} messages</div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoading && (
                            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Processing...</span>
                            </div>
                        )}
                    </div>
                </div>
            }


            <div className="flex-1 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-400 dark:text-neutral-500">
                        <p className="text-center max-w-md">
                            Ask AI to plan your learning
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <Message
                                key={msg.id}
                                content={msg.type === 'document' ? msg.content : msg.content}
                                sender={msg.sender}
                                timestamp={msg.timestamp}
                                avatarUrl={msg.sender === 'user' ? session?.user?.image || undefined : undefined}
                                userName={msg.sender === 'user' ? session?.user?.name || 'You' : 'AI Assistant'}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
            {
                showInput && <div className="">
                    <ChatInput
                        onSubmit={handleSendMessage}
                        placeholder="Ask a question..."
                        disabled={isLoading}
                        handleFiles={handleFiles}
                    />
                </div>
            }

        </div>
    )
}

export default ChatInterface