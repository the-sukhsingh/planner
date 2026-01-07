import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new purchase
export const createPurchase = mutation({
    args: {
        userId: v.id("users"),
        planId: v.id("marketplaceplans"),
        price: v.number(),
    },
    returns: v.id("purchases"),
    handler: async (ctx, args) => {
        // Verify user has enough credits if not free
        if (args.price > 0) {
            const user = await ctx.db.get(args.userId);
            if (!user) {
                throw new Error("User not found");
            }
            if (user.credits < args.price) {
                throw new Error("Insufficient credits");
            }

            // Deduct credits from buyer
            await ctx.db.patch(args.userId, {
                credits: user.credits - args.price,
            });

            // Add 90% of credits to the publisher
            const marketplacePlan = await ctx.db.get(args.planId);
            if (marketplacePlan) {
                const author = await ctx.db.get(marketplacePlan.authorId);
                if (author) {
                    const publisherRevenue = Math.floor(args.price * 0.9);
                    await ctx.db.patch(marketplacePlan.authorId, {
                        credits: author.credits + publisherRevenue
                    });
                }
            }
        }

        // Create purchase record
        const purchaseId = await ctx.db.insert("purchases", {
            userId: args.userId,
            planId: args.planId,
            price: args.price,
            purchasedAt: Date.now(),
        });

        // Increment install count on marketplace plan
        const marketplacePlanRecord = await ctx.db.get(args.planId);
        if (marketplacePlanRecord) {
            await ctx.db.patch(args.planId, {
                installs: marketplacePlanRecord.installs + 1,
                updatedAt: Date.now(),
            });
        }

        return purchaseId;
    },
});

// Get a purchase by ID
export const getPurchase = query({
    args: { purchaseId: v.id("purchases") },
    returns: v.union(
        v.object({
            _id: v.id("purchases"),
            _creationTime: v.number(),
            userId: v.id("users"),
            planId: v.id("marketplaceplans"),
            price: v.number(),
            purchasedAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        return await ctx.db.get(args.purchaseId);
    },
});

// List all purchases for a user
export const listUserPurchases = query({
    args: { userId: v.id("users") },
    returns: v.array(
        v.object({
            _id: v.id("purchases"),
            _creationTime: v.number(),
            userId: v.id("users"),
            planId: v.id("marketplaceplans"),
            price: v.number(),
            purchasedAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("purchases")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

// Get user purchases with plan details
export const getUserPurchasesWithDetails = query({
    args: { userId: v.id("users") },
    returns: v.array(
        v.object({
            _id: v.id("purchases"),
            _creationTime: v.number(),
            userId: v.id("users"),
            planId: v.id("marketplaceplans"),
            price: v.number(),
            purchasedAt: v.number(),
            plan: v.union(
                v.object({
                    _id: v.id("marketplaceplans"),
                    _creationTime: v.number(),
                    sourcePlanId: v.id("plans"),
                    authorId: v.id("users"),
                    snapshot: v.object({
                        title: v.string(),
                        description: v.optional(v.string()),
                        difficulty: v.string(),
                        estimatedDuration: v.optional(v.number()),
                        todos: v.array(
                            v.object({
                                title: v.string(),
                                description: v.optional(v.string()),
                                order: v.number(),
                                priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
                                estimatedTime: v.optional(v.number()),
                                resources: v.optional(v.array(v.string())),
                            })
                        ),
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
                }),
                v.null()
            ),
        })
    ),
    handler: async (ctx, args) => {
        const purchases = await ctx.db
            .query("purchases")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        const purchasesWithDetails = [];
        for (const purchase of purchases) {
            const plan = await ctx.db.get(purchase.planId);
            purchasesWithDetails.push({
                ...purchase,
                plan,
            });
        }

        return purchasesWithDetails;
    },
});

// Check if user has purchased a plan
export const hasPurchased = query({
    args: {
        userId: v.id("users"),
        planId: v.id("marketplaceplans"),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const purchases = await ctx.db
            .query("purchases")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        return purchases.some(purchase => purchase.planId === args.planId);
    },
});

// Get total spent by user
export const getUserTotalSpent = query({
    args: { userId: v.id("users") },
    returns: v.number(),
    handler: async (ctx, args) => {
        const purchases = await ctx.db
            .query("purchases")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        return purchases.reduce((total, purchase) => total + purchase.price, 0);
    },
});

// Get purchase count for user
export const getUserPurchaseCount = query({
    args: { userId: v.id("users") },
    returns: v.number(),
    handler: async (ctx, args) => {
        const purchases = await ctx.db
            .query("purchases")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        return purchases.length;
    },
});

// Delete a purchase (refund)
export const deletePurchase = mutation({
    args: {
        purchaseId: v.id("purchases"),
        refund: v.optional(v.boolean()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const purchase = await ctx.db.get(args.purchaseId);
        if (!purchase) {
            throw new Error("Purchase not found");
        }

        // Refund credits if requested
        if (args.refund && purchase.price > 0) {
            const user = await ctx.db.get(purchase.userId);
            if (user) {
                await ctx.db.patch(purchase.userId, {
                    credits: user.credits + purchase.price,
                });
            }

            // Decrement install count
            const marketplacePlan = await ctx.db.get(purchase.planId);
            if (marketplacePlan && marketplacePlan.installs > 0) {
                await ctx.db.patch(purchase.planId, {
                    installs: marketplacePlan.installs - 1,
                    updatedAt: Date.now(),
                });
            }
        }

        await ctx.db.delete(args.purchaseId);
        return null;
    },
});

// Get purchases for a specific marketplace plan (author only) (author only)
export const getPlanPurchases = query({
    args: {
        userId: v.id("users"),
        planId: v.id("marketplaceplans")
    },
    returns: v.array(
        v.object({
            _id: v.id("purchases"),
            _creationTime: v.number(),
            userId: v.id("users"),
            planId: v.id("marketplaceplans"),
            price: v.number(),
            purchasedAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        // Verify user is the author of the marketplace plan
        const marketplacePlan = await ctx.db.get(args.planId);
        if (!marketplacePlan || marketplacePlan.authorId !== args.userId) {
            return [];
        }

        const allPurchases = await ctx.db.query("purchases").collect();
        return allPurchases.filter(purchase => purchase.planId === args.planId);
    },
});

// Get revenue for a specific marketplace plan (author only)
export const getPlanRevenue = query({
    args: {
        userId: v.id("users"),
        planId: v.id("marketplaceplans")
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        // Verify user is the author of the marketplace plan
        const marketplacePlan = await ctx.db.get(args.planId);
        if (!marketplacePlan || marketplacePlan.authorId !== args.userId) {
            return 0;
        }

        const allPurchases = await ctx.db.query("purchases").collect();
        const planPurchases = allPurchases.filter(purchase => purchase.planId === args.planId);
        return planPurchases.reduce((total, purchase) => total + purchase.price, 0);
    },
});
