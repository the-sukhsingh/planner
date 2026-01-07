
"use client"
import React from 'react'
import { ThemeProvider } from './theme/ThemeProvider'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { PlanProvider } from '@/context/PlanContext';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);


const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <SessionProvider>
                <ConvexProvider client={convex}>
                    <AuthProvider>
                        <PlanProvider>
                            <ChatProvider>
                                <ThemeProvider>
                                    {children}
                                </ThemeProvider>
                            </ChatProvider>
                        </PlanProvider>
                    </AuthProvider>
                </ConvexProvider>
            </SessionProvider>

        </>
    )
}

export default Providers