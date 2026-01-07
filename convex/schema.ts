import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users table - stores user information from Google OAuth
    users: defineTable({
        email: v.string(),
        name: v.string(),
        imageUrl: v.optional(v.string()),
        createdAt: v.number(),
        credits: v.number(),
    }).index("by_email", ["email"]),

    chats: defineTable({
        userId: v.id("users"),
        title: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    messages: defineTable({
        chatId: v.id("chats"),
        role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
        content: v.string(),
        createdAt: v.number(),
    }).index("by_chatId", ["chatId"])
        .index("by_chat_created", ["chatId", "createdAt"]),

    plans: defineTable({
        userId: v.id("users"),
        chatId: v.optional(v.id("chats")),
        title: v.string(),
        description: v.optional(v.string()),
        difficulty: v.union(
            v.literal("easy"),
            v.literal("medium"),
            v.literal("hard")
        ),
        estimatedDuration: v.optional(v.number()),
        status: v.union(
            v.literal("draft"),
            v.literal("active"),
            v.literal("completed"),
            v.literal("archived")
        ),
        isForked: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_user", ["userId"])
        .index("by_status", ["status"]),

    todos: defineTable({
        planId: v.id("plans"),
        title: v.string(),
        description: v.optional(v.string()),
        order: v.number(),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        status: v.string(),
        dueDate: v.number(),
        completedAt: v.optional(v.number()),
        estimatedTime: v.optional(v.number()),
        resources: v.optional(v.array(v.string())),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_plan", ["planId"])
        .index("by_plan_status", ["planId", "status"])
        .index("by_dueDate", ["dueDate"]),

    marketplaceplans: defineTable({
        sourcePlanId: v.id("plans"),   // reference only for attribution
        authorId: v.id("users"),

        snapshot: v.object({
            title: v.string(),
            description: v.optional(v.string()),
            difficulty: v.string(),
            estimatedDuration: v.optional(v.number()),

            todos: v.array(v.object({
                title: v.string(),
                description: v.optional(v.string()),
                order: v.number(),
                priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
                estimatedTime: v.optional(v.number()),
                resources: v.optional(v.array(v.string())),
            }))
        }),
        visibility: v.union(v.literal("public"), v.literal("private")),
        tags: v.optional(v.array(v.string())),
        price: v.optional(v.number()),
        isFree: v.boolean(),
        rating: v.number(),
        installs: v.number(),
        version: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_author", ["authorId"])
        .index("by_visibility", ["visibility"])
        .index("by_installs", ["installs"])
        .index("by_rating", ["rating"]),

    purchases: defineTable({
        userId: v.id("users"),
        planId: v.id("marketplaceplans"),
        price: v.number(),
        purchasedAt: v.number(),
    }).index("by_userId", ["userId"]),

    planforks: defineTable({
        userId: v.id("users"),
        originalPlanId: v.id("plans"),
        forkedPlanId: v.id("plans"),
        createdAt: v.number(),
    }).index("by_user", ["userId"])
        .index("by_forked_plan", ["forkedPlanId"]),

    uploads: defineTable({
        userId: v.id("users"),
        chatId: v.optional(v.id("chats")),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        storageId: v.string(), // Convex storage ID
        createdAt: v.number(),
    }).index("by_user", ["userId"])
        .index("by_chat", ["chatId"]),

});
