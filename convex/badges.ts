import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Award a badge to a user
 */
export const awardBadge = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
        description: v.string(),
        iconUrl: v.string(),
    },
    returns: v.id("badges"),
    handler: async (ctx, args) => {
        // Check if user already has this badge
        const existingBadges = await ctx.db
            .query("badges")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const hasBadge = existingBadges.some((b) => b.name === args.name);
        
        if (hasBadge) {
            throw new Error("User already has this badge");
        }

        const now = Date.now();
        
        const badgeId = await ctx.db.insert("badges", {
            userId: args.userId,
            name: args.name,
            description: args.description,
            iconUrl: args.iconUrl,
            createdAt: now,
        });

        return badgeId;
    },
});

/**
 * Get all badges for a user
 */
export const getUserBadges = query({
    args: {
        userId: v.id("users"),
    },
    returns: v.array(v.object({
        _id: v.id("badges"),
        _creationTime: v.number(),
        userId: v.id("users"),
        name: v.string(),
        description: v.string(),
        iconUrl: v.string(),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const badges = await ctx.db
            .query("badges")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        return badges;
    },
});

/**
 * Check if user has a specific badge
 */
export const hasUserBadge = query({
    args: {
        userId: v.id("users"),
        badgeName: v.string(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const badges = await ctx.db
            .query("badges")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        return badges.some((b) => b.name === args.badgeName);
    },
});

/**
 * Get badge count for a user
 */
export const getUserBadgeCount = query({
    args: {
        userId: v.id("users"),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        const badges = await ctx.db
            .query("badges")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        return badges.length;
    },
});

/**
 * Get recent badges across all users
 */
export const getRecentBadges = query({
    args: {
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("badges"),
        _creationTime: v.number(),
        userId: v.id("users"),
        name: v.string(),
        description: v.string(),
        iconUrl: v.string(),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;
        
        const badges = await ctx.db
            .query("badges")
            .order("desc")
            .take(limit);

        return badges;
    },
});

/**
 * Remove a badge from a user
 */
export const removeBadge = mutation({
    args: {
        badgeId: v.id("badges"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const badge = await ctx.db.get(args.badgeId);
        
        if (!badge) {
            throw new Error("Badge not found");
        }

        await ctx.db.delete(args.badgeId);

        return null;
    },
});
