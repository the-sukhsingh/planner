import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user (upsert pattern for OAuth)
export const upsertUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        imageUrl: args.imageUrl,
      });

      const userStat = await ctx.db
        .query("userStats")
        .withIndex("by_user", (q) => q.eq("userId", existing._id))
        .unique();

      if (!userStat) {
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];
        await ctx.db.insert("userStats", {
          userId: existing._id,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: today,
          totalLearningTimeMs: 0,
          weeklyLearningTimeMs: 0,
          monthlyLearningTimeMs: 0,
          updatedAt: now,
        });
      }

      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
      credits: 50
    });

    // Initialize user stats for new users
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    await ctx.db.insert("userStats", {
      userId: userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: today,
      totalLearningTimeMs: 0,
      weeklyLearningTimeMs: 0,
      monthlyLearningTimeMs: 0,
      updatedAt: now,
    });

    return userId;
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.string(),
      imageUrl: v.optional(v.string()),
      createdAt: v.number(),
      credits: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

      
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.string(),
      imageUrl: v.optional(v.string()),
      createdAt: v.number(),
      credits: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});



// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;

    await ctx.db.patch(args.userId, updates);
    return null;
  },
});

// Update user credits
export const updateCredits = mutation({
  args: {
    userId: v.id("users"),
    credits: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { credits: args.credits });
    return null;
  },
});

// Add credits to user
export const addCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.patch(args.userId, { credits: user.credits + args.amount });

    // Log transaction
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      amount: args.amount,
      reason: args.reason,
      metadata: null,
      createdAt: Date.now(),
    });

    // Log it
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      amount: args.amount,
      reason: "topup",
      metadata: null,
      createdAt: Date.now(),
    });

    return null;
  },
});

// Deduct credits from user (simple, not recommended for external use)
export const deductCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.patch(args.userId, { credits: Math.max(0, user.credits - args.amount) });
    return null;
  },
});

// Atomically charge credits and log transaction. Throws if insufficient balance.
export const chargeCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(), // positive amount to charge
    reason: v.string(),
    metadata: v.optional(v.any()),
  },
  returns: v.object({ remaining: v.number() }),
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Charge amount must be positive");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < args.amount) {
      throw new Error("Insufficient credits");
    }

    const newBalance = user.credits - args.amount;

    await ctx.db.patch(args.userId, { credits: newBalance });

    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      amount: -args.amount,
      reason: args.reason,
      metadata: args.metadata || null,
      createdAt: Date.now(),
    });

    return { remaining: newBalance };
  },
});

// Get recent credit transactions for a user
export const listCreditTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("creditTransactions"),
    _creationTime: v.number(),
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const transactions = await ctx.db.query("creditTransactions").withIndex("by_user", (q) => q.eq("userId", args.userId)).take(limit);
    return transactions;
  },
});

// Delete user
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
    return null;
  },
});
