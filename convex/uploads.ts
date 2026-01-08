import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new upload record
export const createUpload = mutation({
    args: {
        userId: v.id("users"),
        chatId: v.optional(v.id("chats")),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        const uploadId = await ctx.db.insert("uploads", {
            userId: args.userId,
            chatId: args.chatId,
            fileName: args.fileName,
            fileType: args.fileType,
            fileSize: args.fileSize,
            storageId: args.storageId,
            createdAt: Date.now(),
        });

        return uploadId;
    },
});

// Get uploads by user
export const getUserUploads = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const uploads = await ctx.db
            .query("uploads")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        return uploads;
    },
});

// Get uploads by chat
export const getChatUploads = query({
    args: {
        chatId: v.id("chats"),
    },
    handler: async (ctx, args) => {
        const uploads = await ctx.db
            .query("uploads")
            .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
            .collect();

        return uploads;
    },
});

// Get upload by ID
export const getUpload = query({
    args: {
        uploadId: v.id("uploads"),
    },
    handler: async (ctx, args) => {
        const upload = await ctx.db.get(args.uploadId);
        return upload;
    },
});

// Delete upload
export const deleteUpload = mutation({
    args: {
        uploadId: v.id("uploads"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.uploadId);
    },
});

export const deleteFromStorage = mutation({
    args: {
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.storage.delete(args.storageId);
    },
});

// Generate upload URL for a file
export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

// Get file URL from storage
export const getFileUrl = query({
    args: {
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
