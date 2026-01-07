import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new message
export const createMessage = mutation({
    args: {
        chatId: v.id("chats"),
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
    },
    returns: v.id("messages"),
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert("messages", {
            chatId: args.chatId,
            role: args.role,
            content: args.content,
            createdAt: Date.now(),
        });
        
        // Update chat's updatedAt timestamp
        await ctx.db.patch(args.chatId, {
            updatedAt: Date.now(),
        });
        
        return messageId;
    },
});

// Get a single message by ID
export const getMessage = query({
    args: { 
        userId: v.id("users"),
        messageId: v.id("messages") 
    },
    returns: v.union(
        v.object({
            _id: v.id("messages"),
            _creationTime: v.number(),
            chatId: v.id("chats"),
            role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
            content: v.string(),
            createdAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            return null;
        }
        
        // Verify message's chat belongs to user
        const chat = await ctx.db.get(message.chatId);
        if (!chat || chat.userId !== args.userId) {
            return null;
        }
        
        return message;
    },
});

// List all messages for a chat
export const listChatMessages = query({
    args: { 
        userId: v.id("users"),
        chatId: v.id("chats") 
    },
    returns: v.array(
        v.object({
            _id: v.id("messages"),
            _creationTime: v.number(),
            chatId: v.id("chats"),
            role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
            content: v.string(),
            createdAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        // Verify chat belongs to user
        const chat = await ctx.db.get(args.chatId);
        if (!chat || chat.userId !== args.userId) {
            return [];
        }
        
        return await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .order("asc")
            .collect();
    },
});

// List messages with pagination
export const listChatMessagesPaginated = query({
    args: {
        userId: v.id("users"),
        chatId: v.id("chats"),
        limit: v.optional(v.number()),
    },
    returns: v.array(
        v.object({
            _id: v.id("messages"),
            _creationTime: v.number(),
            chatId: v.id("chats"),
            role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
            content: v.string(),
            createdAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        // Verify chat belongs to user
        const chat = await ctx.db.get(args.chatId);
        if (!chat || chat.userId !== args.userId) {
            return [];
        }
        
        const limit = args.limit ?? 50;
        return await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .order("desc")
            .take(limit);
    },
});

// Get the latest messages from a chat
export const getLatestMessages = query({
    args: {
        userId: v.id("users"),
        chatId: v.id("chats"),
        count: v.number(),
    },
    returns: v.array(
        v.object({
            _id: v.id("messages"),
            _creationTime: v.number(),
            chatId: v.id("chats"),
            role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
            content: v.string(),
            createdAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        // Verify chat belongs to user
        const chat = await ctx.db.get(args.chatId);
        if (!chat || chat.userId !== args.userId) {
            return [];
        }
        
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .order("desc")
            .take(args.count);
        
        // Reverse to get chronological order
        return messages.reverse();
    },
});

// Update message content
export const updateMessage = mutation({
    args: {
        userId: v.id("users"),
        messageId: v.id("messages"),
        content: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error("Message not found");
        }
        
        // Verify message's chat belongs to user
        const chat = await ctx.db.get(message.chatId);
        if (!chat || chat.userId !== args.userId) {
            throw new Error("Unauthorized");
        }
        
        await ctx.db.patch(args.messageId, {
            content: args.content,
        });
        return null;
    },
});

// Delete a message
export const deleteMessage = mutation({
    args: { 
        userId: v.id("users"),
        messageId: v.id("messages") 
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error("Message not found");
        }
        
        // Verify message's chat belongs to user
        const chat = await ctx.db.get(message.chatId);
        if (!chat || chat.userId !== args.userId) {
            throw new Error("Unauthorized");
        }
        
        await ctx.db.delete(args.messageId);
        return null;
    },
});

// Delete all messages in a chat
export const deleteAllChatMessages = mutation({
    args: { 
        userId: v.id("users"),
        chatId: v.id("chats") 
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Verify chat belongs to user
        const chat = await ctx.db.get(args.chatId);
        if (!chat || chat.userId !== args.userId) {
            throw new Error("Unauthorized");
        }
        
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .collect();
        
        for (const message of messages) {
            await ctx.db.delete(message._id);
        }
        
        return null;
    },
});

// Get message count for a chat
export const getChatMessageCount = query({
    args: { 
        userId: v.id("users"),
        chatId: v.id("chats") 
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        // Verify chat belongs to user
        const chat = await ctx.db.get(args.chatId);
        if (!chat || chat.userId !== args.userId) {
            return 0;
        }
        
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
            .collect();
        return messages.length;
    },
});
