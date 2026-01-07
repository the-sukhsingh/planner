"use client"
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { FileText, User, Bot, Clock } from 'lucide-react'
import Markdown from 'react-markdown'

interface MessageProps {
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
    avatarUrl?: string;
    userName?: string;
    type?: 'text' | 'document';
}

const Message = ({ content, sender, timestamp, avatarUrl, userName, type = 'text' }: MessageProps) => {
    const isAi = sender === 'ai';

    return (
        <div className={cn(
            "flex w-full mb-6 group animate-in fade-in slide-in-from-bottom-2 duration-300",
            isAi ? "justify-start" : "justify-end"
        )}>
            <div className={cn(
                "flex max-w-[85%] md:max-w-[75%] gap-3",
                isAi ? "flex-row" : "flex-row-reverse"
            )}>
                <Avatar className={cn(
                    "h-8 w-8 shrink-0 border mt-1 shadow-sm",
                    isAi ? "bg-primary/10 text-primary border-primary/20" : "bg-accent border-border"
                )}>
                    {avatarUrl ? (
                        <AvatarImage src={avatarUrl} />
                    ) : (
                        <AvatarFallback className="text-[10px] font-bold">
                            {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </AvatarFallback>
                    )}
                </Avatar>

                <div className={cn(
                    "flex flex-col gap-1.5",
                    isAi ? "items-start" : "items-end"
                )}>
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-tighter">
                            {userName}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {timestamp}
                        </span>
                    </div>

                    <div className={cn(
                        "relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs transition-colors",
                        isAi
                            ? "bg-background border border-border/50 text-foreground rounded-tl-none"
                            : "bg-primary text-primary-foreground rounded-tr-none font-medium"
                    )}>
                        {type === 'document' ? (
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    isAi ? "bg-accent text-accent-foreground" : "bg-primary-foreground/20 text-primary-foreground"
                                )}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <span className="font-medium underline underline-offset-4 decoration-current/30 cursor-pointer">
                                    <Markdown>{content}</Markdown>
                                </span>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap wrap-break-word">
                                {<Markdown>{content}</Markdown>}
                            </div>
                        )}

                        {/* Decorative tail */}
                        <div className={cn(
                            "absolute top-0 w-2 h-2",
                            isAi
                                ? "-left-2 border-r border-t border-border/50 bg-background [clip-path:polygon(100%_0,0_0,100%_100%)]"
                                : "-right-2 bg-primary [clip-path:polygon(0_0,100%_0,0_100%)]"
                        )} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Message