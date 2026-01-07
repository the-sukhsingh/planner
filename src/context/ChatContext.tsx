'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from './AuthContext';

export interface Conversation {
    _id: Id<"chats">;
    _creationTime: number;
    userId: Id<"users">;
    title: string;
    createdAt: number;
    updatedAt: number;
}

interface ChatContextType {
    conversations: Conversation[];
    selectedConversationId: Id<"chats"> | null;
    loading: boolean;
    error: string | null;
    setSelectedConversationId: (id: Id<"chats"> | null) => void;
    deleteConversation: (id: Id<"chats">) => Promise<boolean>;
    updateConversation: (id: Id<"chats">, title: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [selectedConversationId, setSelectedConversationId] = useState<Id<"chats"> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    
    // Fetch conversations from Convex
    const conversations = useQuery(
        api.chats.listUserChats,
        user?._id ? { userId: user._id } : "skip"
    ) || [];

    const deleteChatMutation = useMutation(api.chats.deleteChat);
    const updateChatMutation = useMutation(api.chats.updateChat);

    const deleteConversation = async (id: Id<"chats">) => {
        if (!user?._id) return false;
        
        try {
            await deleteChatMutation({ userId: user._id, chatId: id });
            if (selectedConversationId === id) setSelectedConversationId(null);
            return true;
        } catch (e) {
            setError((e as Error).message);
            return false;
        }
    };

    const updateConversation = async (id: Id<"chats">, title: string) => {
        if (!user?._id) return;
        
        try {
            await updateChatMutation({ userId: user._id, chatId: id, title });
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const value = useMemo(() => ({
        conversations,
        selectedConversationId,
        loading: conversations === undefined,
        error,
        setSelectedConversationId,
        deleteConversation,
        updateConversation,
    }), [conversations, selectedConversationId, error]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within ChatProvider');
    return ctx;
};
