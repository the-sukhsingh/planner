import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get leaderboard for a specific type and period
 */
export const getLeaderboard = query({
    args: {
        type: v.union(
            v.literal("weekly_time"),
            v.literal("monthly_time"),
            v.literal("streak"),
            v.literal("todos_completed")
        ),
        period: v.string(),
    },
    returns: v.union(
        v.object({
            _id: v.id("leaderboards"),
            _creationTime: v.number(),
            type: v.union(
                v.literal("weekly_time"),
                v.literal("monthly_time"),
                v.literal("streak"),
                v.literal("todos_completed")
            ),
            period: v.string(),
            entries: v.array(v.object({
                userId: v.id("users"),
                score: v.number(),
                rank: v.number(),
            })),
            generatedAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const leaderboard = await ctx.db
            .query("leaderboards")
            .withIndex("by_type_period", (q) => 
                q.eq("type", args.type).eq("period", args.period)
            )
            .unique();

        return leaderboard ?? null;
    },
});

/**
 * Get current week leaderboard
 */
export const getCurrentWeekLeaderboard = query({
    args: {},
    returns: v.union(
        v.object({
            _id: v.id("leaderboards"),
            _creationTime: v.number(),
            type: v.union(
                v.literal("weekly_time"),
                v.literal("monthly_time"),
                v.literal("streak"),
                v.literal("todos_completed")
            ),
            period: v.string(),
            entries: v.array(v.object({
                userId: v.id("users"),
                score: v.number(),
                rank: v.number(),
            })),
            generatedAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        // Calculate current week period (e.g., "2026-W02")
        const now = new Date();
        const year = now.getFullYear();
        const weekNumber = getWeekNumber(now);
        const period = `${year}-W${String(weekNumber).padStart(2, '0')}`;

        const leaderboard = await ctx.db
            .query("leaderboards")
            .withIndex("by_type_period", (q) => 
                q.eq("type", "weekly_time").eq("period", period)
            )
            .unique();

        return leaderboard ?? null;
    },
});

/**
 * Get leaderboard with user information
 */
export const getLeaderboardWithUsers = query({
    args: {
        type: v.union(
            v.literal("weekly_time"),
            v.literal("monthly_time"),
            v.literal("streak"),
            v.literal("todos_completed")
        ),
        period: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const leaderboard = await ctx.db
            .query("leaderboards")
            .withIndex("by_type_period", (q) => 
                q.eq("type", args.type).eq("period", args.period)
            )
            .unique();

        if (!leaderboard) {
            return null;
        }

        // Get user information for each entry
        const limit = args.limit ?? 100;
        const entriesWithUsers = await Promise.all(
            leaderboard.entries.slice(0, limit).map(async (entry) => {
                const user = await ctx.db.get(entry.userId);
                return {
                    ...entry,
                    user: user ? {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        imageUrl: user.imageUrl,
                    } : null,
                };
            })
        );

        return {
            ...leaderboard,
            entries: entriesWithUsers,
        };
    },
});

/**
 * Get user rank in leaderboard
 */
export const getUserRank = query({
    args: {
        userId: v.id("users"),
        type: v.union(
            v.literal("weekly_time"),
            v.literal("monthly_time"),
            v.literal("streak"),
            v.literal("todos_completed")
        ),
        period: v.string(),
    },
    returns: v.union(
        v.object({
            rank: v.number(),
            score: v.number(),
            total: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const leaderboard = await ctx.db
            .query("leaderboards")
            .withIndex("by_type_period", (q) => 
                q.eq("type", args.type).eq("period", args.period)
            )
            .unique();

        if (!leaderboard) {
            return null;
        }

        const entry = leaderboard.entries.find((e) => e.userId === args.userId);
        if (!entry) {
            return null;
        }

        return {
            rank: entry.rank,
            score: entry.score,
            total: leaderboard.entries.length,
        };
    },
});

/**
 * Generate weekly time leaderboard (internal)
 */
export const generateWeeklyTimeLeaderboard = internalMutation({
    args: {
        period: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const allStats = await ctx.db.query("userStats").collect();
        
        // Sort by weekly learning time descending
        const sorted = allStats
            .filter((s) => s.weeklyLearningTimeMs > 0)
            .sort((a, b) => b.weeklyLearningTimeMs - a.weeklyLearningTimeMs);

        const entries = sorted.map((stats, index) => ({
            userId: stats.userId,
            score: stats.weeklyLearningTimeMs,
            rank: index + 1,
        }));

        // Check if leaderboard already exists
        const existing = await ctx.db
            .query("leaderboards")
            .withIndex("by_type_period", (q) => 
                q.eq("type", "weekly_time").eq("period", args.period)
            )
            .unique();

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                entries,
                generatedAt: now,
            });
        } else {
            await ctx.db.insert("leaderboards", {
                type: "weekly_time",
                period: args.period,
                entries,
                generatedAt: now,
            });
        }

        return null;
    },
});

/**
 * Generate monthly time leaderboard (internal)
 */
export const generateMonthlyTimeLeaderboard = internalMutation({
    args: {
        period: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const allStats = await ctx.db.query("userStats").collect();
        
        const sorted = allStats
            .filter((s) => s.monthlyLearningTimeMs > 0)
            .sort((a, b) => b.monthlyLearningTimeMs - a.monthlyLearningTimeMs);

        const entries = sorted.map((stats, index) => ({
            userId: stats.userId,
            score: stats.monthlyLearningTimeMs,
            rank: index + 1,
        }));

        const existing = await ctx.db
            .query("leaderboards")
            .withIndex("by_type_period", (q) => 
                q.eq("type", "monthly_time").eq("period", args.period)
            )
            .unique();

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                entries,
                generatedAt: now,
            });
        } else {
            await ctx.db.insert("leaderboards", {
                type: "monthly_time",
                period: args.period,
                entries,
                generatedAt: now,
            });
        }

        return null;
    },
});

/**
 * Generate streak leaderboard (internal)
 */
export const generateStreakLeaderboard = internalMutation({
    args: {
        period: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const allStats = await ctx.db.query("userStats").collect();
        
        const sorted = allStats
            .filter((s) => s.currentStreak > 0)
            .sort((a, b) => b.currentStreak - a.currentStreak);

        const entries = sorted.map((stats, index) => ({
            userId: stats.userId,
            score: stats.currentStreak,
            rank: index + 1,
        }));

        const existing = await ctx.db
            .query("leaderboards")
            .withIndex("by_type_period", (q) => 
                q.eq("type", "streak").eq("period", args.period)
            )
            .unique();

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                entries,
                generatedAt: now,
            });
        } else {
            await ctx.db.insert("leaderboards", {
                type: "streak",
                period: args.period,
                entries,
                generatedAt: now,
            });
        }

        return null;
    },
});

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}
