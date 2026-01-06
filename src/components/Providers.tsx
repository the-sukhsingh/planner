"use client"
import { AuthProvider } from '@/context/AuthContext'
import { PlanProvider } from '@/context/PlanContext'
import { ChatProvider } from '@/context/ChatContext'
import { SessionProvider } from 'next-auth/react'
import React from 'react'
import { ThemeProvider } from './theme/ThemeProvider'

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <SessionProvider>
            <AuthProvider>
                <ThemeProvider>
                    <PlanProvider>
                        <ChatProvider>
                            {children}
                        </ChatProvider>
                    </PlanProvider>
                </ThemeProvider>
            </AuthProvider>
        </SessionProvider>
    )
}

export default Providers