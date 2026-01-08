import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
// Removed unused import

/**
 * Initialize user stats for a new user
 */
export const initializeUserStats = internalMutation({
    args: {
        userId: v.id("users"),
    },
    returns: v.id("userStats"),
    handler: async (ctx, args) => {
        // Check if stats already exist
        const existing = await ctx.db
            .query("userStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();

        if (existing) {
            return existing._id;
        }

        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];

        const statsId = await ctx.db.insert("userStats", {
            userId: args.userId,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: today,
            totalLearningTimeMs: 0,
            weeklyLearningTimeMs: 0,
            monthlyLearningTimeMs: 0,
            updatedAt: now,
        });

        return statsId;
    },
});



/**
 * Get user stats
 */
export const getUserStats = query({
    args: {
        userId: v.id("users"),
    },
    returns: v.union(
        v.object({
            _id: v.id("userStats"),
            _creationTime: v.number(),
            userId: v.id("users"),
            currentStreak: v.number(),
            longestStreak: v.number(),
            lastActiveDate: v.string(),
            totalLearningTimeMs: v.number(),
            weeklyLearningTimeMs: v.number(),
            monthlyLearningTimeMs: v.number(),
            updatedAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const stats = await ctx.db
            .query("userStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();

        return stats ?? null;
    },
});

/**
 * Update user learning time
 */
export const updateLearningTime = mutation({
    args: {
        userId: v.id("users"),
        durationMs: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const stats = await ctx.db
            .query("userStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();

        if (!stats) {
            throw new Error("User stats not found. Initialize stats first.");
        }

        const now = Date.now();

        await ctx.db.patch(stats._id, {
            totalLearningTimeMs: stats.totalLearningTimeMs + args.durationMs,
            weeklyLearningTimeMs: stats.weeklyLearningTimeMs + args.durationMs,
            monthlyLearningTimeMs: stats.monthlyLearningTimeMs + args.durationMs,
            updatedAt: now,
        });

        // Evaluate badges after learning time update
        // await ctx.runMutation("badgeDefinitions.evaluateBadgesForUser", { userId: args.userId });

        return null;
    },
});

/**
 * Update user streak
 */
export const updateStreak = mutation({
    args: {
        userId: v.id("users"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const stats = await ctx.db
            .query("userStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();

        if (!stats) {
            throw new Error("User stats not found. Initialize stats first.");
        }

        const today = new Date().toISOString().split('T')[0];
        const lastActive = new Date(stats.lastActiveDate);
        const todayDate = new Date(today);
        
        const diffDays = Math.floor(
            (todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
        );

        let newStreak = stats.currentStreak;

        if (diffDays === 0) {
            // Same day, no change
            return null;
        } else if (diffDays === 1) {
            // Consecutive day
            newStreak = stats.currentStreak + 1;
        } else {
            // Streak broken
            newStreak = 1;
        }

        const longestStreak = Math.max(stats.longestStreak, newStreak);
        const now = Date.now();

        await ctx.db.patch(stats._id, {
            currentStreak: newStreak,
            longestStreak: longestStreak,
            lastActiveDate: today,
            updatedAt: now,
        });

        // Evaluate badges after streak update
        // await ctx.runMutation("badgeDefinitions.evaluateBadgesForUser", { userId: args.userId });

        return null;
    },
});

/**
 * Reset weekly stats (internal, called by cron)
 */
export const resetWeeklyStats = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx, args) => {
        const allStats = await ctx.db.query("userStats").collect();
        const now = Date.now();

        for (const stats of allStats) {
            await ctx.db.patch(stats._id, {
                weeklyLearningTimeMs: 0,
                updatedAt: now,
            });
        }

        return null;
    },
});

/**
 * Reset monthly stats (internal, called by cron)
 */
export const resetMonthlyStats = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx, args) => {
        const allStats = await ctx.db.query("userStats").collect();
        const now = Date.now();

        for (const stats of allStats) {
            await ctx.db.patch(stats._id, {
                monthlyLearningTimeMs: 0,
                updatedAt: now,
            });
        }

        return null;
    },
});

/**
 * Get top users by streak
 */
export const getTopStreaks = query({
    args: {
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("userStats"),
        _creationTime: v.number(),
        userId: v.id("users"),
        currentStreak: v.number(),
        longestStreak: v.number(),
        lastActiveDate: v.string(),
        totalLearningTimeMs: v.number(),
        weeklyLearningTimeMs: v.number(),
        monthlyLearningTimeMs: v.number(),
        updatedAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        
        const allStats = await ctx.db.query("userStats").collect();
        
        // Sort by current streak descending
        const sorted = allStats.sort((a, b) => b.currentStreak - a.currentStreak);
        
        return sorted.slice(0, limit);
    },
});
