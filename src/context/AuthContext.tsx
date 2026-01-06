"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";

interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    credits?: number;
}

// Auth context type
interface AuthContextType {
    user: User | null;
    credits: number;
    isLoading: boolean;
    isAuthenticated: boolean;
    session: Session | null;
    refreshCredits: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Import the user action
import { getUserCredits } from "@/actions/user";

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [credits, setCredits] = useState<number>(0);

    const isLoading = status === "loading";

    const refreshCredits = async () => {
        if (session?.user?.email) {
            const fetchedCredits = await getUserCredits();
            if (fetchedCredits !== null) {
                setCredits(fetchedCredits);
            }
        }
    };

    // Extract user from session and fetch credits
    useEffect(() => {
        if (session?.user) {
            setUser({
                id: session.user.email || undefined,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
            });
            refreshCredits();
        } else {
            setUser(null);
            setCredits(0);
        }
    }, [session]);

    // Update user object with credits when credits state changes
    useEffect(() => {
        if (user) {
            setUser(prev => prev ? { ...prev, credits } : null);
        }
    }, [credits]);

    const value: AuthContextType = {
        user,
        credits,
        isLoading,
        isAuthenticated: !!session,
        session,
        refreshCredits,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
