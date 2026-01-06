'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';

export interface Conversation {
    id: number;
    userId: number;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastMessage?: string;
}

interface ChatContextType {
    conversations: Conversation[];
    selectedConversationId: number | null;
    loading: boolean;
    error: string | null;
    fetchConversations: (refresh?: boolean) => Promise<void>;
    setSelectedConversationId: (id: number | null) => void;
    deleteConversation: (id: number) => Promise<boolean>;
    updateConversation: (id: number, data: Partial<Conversation>) => Promise<Conversation | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConversations = useCallback(async (refresh = false) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/conversations');
            if (!res.ok) throw new Error('Failed to fetch conversations');

            const data = await res.json();
            setConversations(data.conversations || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteConversation = async (id: number) => {
        // Optimistic delete
        const previousConversations = [...conversations];
        setConversations(prev => prev.filter(c => c.id !== id));
        if (selectedConversationId === id) setSelectedConversationId(null);

        try {
            const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete conversation');
            return true;
        } catch (e) {
            setConversations(previousConversations);
            setError((e as Error).message);
            return false;
        }
    };

    const updateConversation = async (id: number, data: Partial<Conversation>) => {
        const previousConversations = [...conversations];
        const optimisticConversations = conversations.map(c =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
        );
        setConversations(optimisticConversations);

        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update conversation');

            const updated = await res.json();
            setConversations(prev => prev.map(c => c.id === id ? updated.conversation : c));
            return updated.conversation;
        } catch (e) {
            setConversations(previousConversations);
            setError((e as Error).message);
            return null;
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const value = useMemo(() => ({
        conversations,
        selectedConversationId,
        loading,
        error,
        fetchConversations,
        setSelectedConversationId,
        deleteConversation,
        updateConversation,
    }), [conversations, selectedConversationId, loading, error, fetchConversations]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within ChatProvider');
    return ctx;
};
