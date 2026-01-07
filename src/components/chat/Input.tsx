"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, X} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
    onSubmit: (message: string) => void;
    placeholder?: string;
    disabled?: boolean;
    handleFiles?: (files: FileList) => void;
}

const ChatInput = ({ onSubmit, placeholder = "Ask me anything...", disabled, handleFiles }: ChatInputProps) => {
    const [message, setMessage] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = () => {
        if (message.trim() || files.length > 0) {
            onSubmit(message)
            setMessage('')
            setFiles([])
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && handleFiles) {
            const newFiles = Array.from(e.target.files)
            if (newFiles[0].size > 5 * 1024 * 1024) {
                alert('File size exceeds 5MB limit')
                return
            }
            setFiles(prev => [...prev, ...newFiles])
            handleFiles(e.target.files)
        }
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        // Note: This won't update the FileList in ChatInterface but for UI it's okay
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }, [message])

    return (
        <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-2">
            {/* File Previews */}
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-2">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 bg-primary/5 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-medium animate-in zoom-in-50 duration-200">
                            <span className="truncate max-w-37.5">{file.name}</span>
                            <button onClick={() => removeFile(i)} className="hover:text-primary/70 transition-colors">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Container */}
            <div className={cn(
                "relative flex flex-col bg-background/50 backdrop-blur-md rounded-2xl border transition-all duration-300 ring-offset-background",
                isFocused ? "border-primary/50 shadow-[0_0_25px_-5px_rgba(var(--primary),0.15)] ring-1 ring-primary/20" : "border-border shadow-sm",
                disabled && "opacity-60 grayscale cursor-not-allowed"
            )}>
                <div className="flex items-end p-1 gap-0">
                    <input
                        type="file"
                        multiple={false}
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>

                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="flex-1 min-h-11 max-h-50 border-none focus-visible:ring-0 bg-transparent resize-none py-3 text-sm leading-relaxed noscroll"
                    />

                    <div className="flex items-center gap-1 pr-1 pb-1">
                        <div className="hidden sm:flex items-center mr-2 text-[10px] font-bold text-muted-foreground/40 gap-1 px-1.5 py-1 rounded bg-accent/50">
                            <span>ENTER</span>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={disabled || (!message.trim() && (files.length === 0)) || (!message.trim() && (files.length > 0))}
                            size="icon"
                            className={cn(
                                "h-10 w-10 rounded-xl transition-all duration-300 active:scale-90",
                                (message.trim() || files.length > 0) ? "bg-primary shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground"
                            )}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}
export default ChatInput    