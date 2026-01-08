import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Start a new learning session
 */
export const startSession = mutation({
    args: {
        userId: v.id("users"),
        planId: v.optional(v.id("plans")),
        todoId: v.optional(v.id("todos")),
        source: v.union(v.literal("manual"), v.literal("timer"), v.literal("auto")),
    },
    returns: v.id("learningSessions"),
    handler: async (ctx, args) => {
        const now = Date.now();
        
        const sessionId = await ctx.db.insert("learningSessions", {
            userId: args.userId,
            planId: args.planId,
            todoId: args.todoId,
            startedAt: now,
            source: args.source,
            createdAt: now,
        });

        return sessionId;
    },
});

/**
 * End an active learning session
 */
export const endSession = mutation({
    args: {
        sessionId: v.id("learningSessions"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const session = await ctx.db.get(args.sessionId);
        if (!session) {
            throw new Error("Session not found");
        }

        if (session.endedAt) {
            throw new Error("Session already ended");
        }

        const now = Date.now();
        const durationMs = now - session.startedAt;

        await ctx.db.patch(args.sessionId, {
            endedAt: now,
            durationMs,
        });

        // Update user stats with the learning time
        const stats = await ctx.db
            .query("userStats")
            .withIndex("by_user", (q) => q.eq("userId", session.userId))
            .unique();

        if (stats) {
            await ctx.db.patch(stats._id, {
                totalLearningTimeMs: stats.totalLearningTimeMs + durationMs,
                weeklyLearningTimeMs: stats.weeklyLearningTimeMs + durationMs,
                monthlyLearningTimeMs: stats.monthlyLearningTimeMs + durationMs,
                updatedAt: now,
            });

            // Update streak
            const today = new Date().toISOString().split('T')[0];
            const lastActive = new Date(stats.lastActiveDate);
            const todayDate = new Date(today);
            
            const diffDays = Math.floor(
                (todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
            );

            let newStreak = stats.currentStreak;

            if (diffDays === 0) {
                // Same day, no change
            } else if (diffDays === 1) {
                // Consecutive day
                newStreak = stats.currentStreak + 1;
            } else {
                // Streak broken
                newStreak = 1;
            }

            const longestStreak = Math.max(stats.longestStreak, newStreak);

            await ctx.db.patch(stats._id, {
                currentStreak: newStreak,
                longestStreak: longestStreak,
                lastActiveDate: today,
                updatedAt: now,
            });
        }

        // Log the event
        await ctx.db.insert("events", {
            userId: session.userId,
            type: "session_completed",
            payload: {
                sessionId: args.sessionId,
                durationMs,
                planId: session.planId,
                todoId: session.todoId,
            },
            createdAt: now,
        });

        // Evaluate badges for this user (non-blocking for callers is fine, but run here)
        // await ctx.runMutation("badgeDefinitions.evaluateBadgesForUser", { userId: session.userId });

        return null;
    },
});

/**
 * Get all sessions for a user
 */
export const getUserSessions = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("learningSessions"),
        _creationTime: v.number(),
        userId: v.id("users"),
        planId: v.optional(v.id("plans")),
        todoId: v.optional(v.id("todos")),
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
        durationMs: v.optional(v.number()),
        source: v.union(v.literal("manual"), v.literal("timer"), v.literal("auto")),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        
        const sessions = await ctx.db
            .query("learningSessions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);

        return sessions;
    },
});

/**
 * Get active session for a user
 */
export const getActiveSession = query({
    args: {
        userId: v.id("users"),
    },
    returns: v.union(
        v.object({
            _id: v.id("learningSessions"),
            _creationTime: v.number(),
            userId: v.id("users"),
            planId: v.optional(v.id("plans")),
            todoId: v.optional(v.id("todos")),
            startedAt: v.number(),
            endedAt: v.optional(v.number()),
            durationMs: v.optional(v.number()),
            source: v.union(v.literal("manual"), v.literal("timer"), v.literal("auto")),
            createdAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query("learningSessions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(10);

        // Find the first session without endedAt
        const activeSession = sessions.find((s) => !s.endedAt);
        return activeSession ?? null;
    },
});

/**
 * Get sessions in a date range
 */
export const getSessionsInRange = query({
    args: {
        userId: v.id("users"),
        startDate: v.number(),
        endDate: v.number(),
    },
    returns: v.array(v.object({
        _id: v.id("learningSessions"),
        _creationTime: v.number(),
        userId: v.id("users"),
        planId: v.optional(v.id("plans")),
        todoId: v.optional(v.id("todos")),
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
        durationMs: v.optional(v.number()),
        source: v.union(v.literal("manual"), v.literal("timer"), v.literal("auto")),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const allSessions = await ctx.db
            .query("learningSessions")
            .withIndex("by_user_startedAt", (q) => 
                q.eq("userId", args.userId)
                 .gte("startedAt", args.startDate)
                 .lte("startedAt", args.endDate)
            )
            .collect();

        return allSessions;
    },
});

/**
 * Get total learning time for a user
 */
export const getTotalLearningTime = query({
    args: {
        userId: v.id("users"),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query("learningSessions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const totalMs = sessions.reduce((sum, session) => {
            return sum + (session.durationMs ?? 0);
        }, 0);

        return totalMs;
    },
});
