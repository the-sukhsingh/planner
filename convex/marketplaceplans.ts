import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new marketplace plan
export const createMarketplacePlan = mutation({
    args: {
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
        visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
        tags: v.optional(v.array(v.string())),
        price: v.optional(v.number()),
        isFree: v.optional(v.boolean()),
    },
    returns: v.id("marketplaceplans"),
    handler: async (ctx, args) => {
        return await ctx.db.insert("marketplaceplans", {
            sourcePlanId: args.sourcePlanId,
            authorId: args.authorId,
            snapshot: args.snapshot,
            visibility: args.visibility ?? "private",
            tags: args.tags,
            price: args.price,
            isFree: args.isFree ?? true,
            rating: 0,
            installs: 0,
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Get a marketplace plan by ID with author details
export const getMarketplacePlan = query({
    args: { planId: v.id("marketplaceplans") },
    returns: v.union(
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
            author: v.union(v.null(), v.object({
                _id: v.id("users"),
                _creationTime: v.number(),
                email: v.string(),
                name: v.string(),
                imageUrl: v.optional(v.string()),
                createdAt: v.number(),
                credits: v.float64(),
            })),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.planId);
        if (!plan) return null;
        const author = await ctx.db.get(plan.authorId);
        return { ...plan, author };
    },
});

// List all public marketplace plans
export const listPublicMarketplacePlans = query({
    args: {},
    returns: v.array(
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
            author: v.union(v.null(), v.object({
                _id: v.id("users"),
                _creationTime: v.number(),
                email: v.string(),
                name: v.string(),
                imageUrl: v.optional(v.string()),
                createdAt: v.number(),
                credits: v.number(),
            })),
        })
    ),
    handler: async (ctx) => {
        const plans = await ctx.db
            .query("marketplaceplans")
            .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
            .order("desc")
            .collect();

        return await Promise.all(
            plans.map(async (plan) => {
                const author = await ctx.db.get(plan.authorId);
                return { ...plan, author };
            })
        );
    },
});

// List marketplace plans by author
export const listAuthorMarketplacePlans = query({
    args: { authorId: v.id("users") },
    returns: v.array(
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
            author: v.union(v.null(), v.object({
                _id: v.id("users"),
                _creationTime: v.number(),
                email: v.string(),
                name: v.string(),
                imageUrl: v.optional(v.string()),
                createdAt: v.number(),
                credits: v.number(),
            })),
        })
    ),
    handler: async (ctx, args) => {
        const plans = await ctx.db
            .query("marketplaceplans")
            .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
            .order("desc")
            .collect();

        return await Promise.all(
            plans.map(async (plan) => {
                const author = await ctx.db.get(plan.authorId);
                return { ...plan, author };
            })
        );
    },
});

// List top rated marketplace plans
export const listTopRatedPlans = query({
    args: { limit: v.optional(v.number()) },
    returns: v.array(
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
            author: v.union(v.null(), v.object({
                _id: v.id("users"),
                _creationTime: v.number(),
                email: v.string(),
                name: v.string(),
                imageUrl: v.optional(v.string()),
                createdAt: v.number(),
                credits: v.number(),
            })),
        })
    ),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        const plans = await ctx.db
            .query("marketplaceplans")
            .withIndex("by_rating")
            .order("desc")
            .take(limit);

        return await Promise.all(
            plans.map(async (plan) => {
                const author = await ctx.db.get(plan.authorId);
                return { ...plan, author };
            })
        );
    },
});

// List most installed marketplace plans
export const listMostInstalledPlans = query({
    args: { limit: v.optional(v.number()) },
    returns: v.array(
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
            author: v.union(v.null(), v.object({
                _id: v.id("users"),
                _creationTime: v.number(),
                email: v.string(),
                name: v.string(),
                imageUrl: v.optional(v.string()),
                createdAt: v.number(),
                credits: v.number(),
            })),
        })
    ),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        const plans = await ctx.db
            .query("marketplaceplans")
            .withIndex("by_installs")
            .order("desc")
            .take(limit);

        return await Promise.all(
            plans.map(async (plan) => {
                const author = await ctx.db.get(plan.authorId);
                return { ...plan, author };
            })
        );
    },
});

// Update a marketplace plan
export const updateMarketplacePlan = mutation({
    args: {
        authorId: v.id("users"),
        planId: v.id("marketplaceplans"),
        snapshot: v.optional(
            v.object({
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
            })
        ),
        visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
        tags: v.optional(v.array(v.string())),
        price: v.optional(v.number()),
        isFree: v.optional(v.boolean()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Marketplace plan not found");
        }

        // Verify user is the author
        if (plan.authorId !== args.authorId) {
            throw new Error("Unauthorized");
        }

        const updates: Record<string, any> = { updatedAt: Date.now() };

        if (args.snapshot !== undefined) {
            updates.snapshot = args.snapshot;
            updates.version = plan.version + 1;
        }
        if (args.visibility !== undefined) updates.visibility = args.visibility;
        if (args.tags !== undefined) updates.tags = args.tags;
        if (args.price !== undefined) updates.price = args.price;
        if (args.isFree !== undefined) updates.isFree = args.isFree;

        await ctx.db.patch(args.planId, updates);
        return null;
    },
});

// Increment install count
export const incrementInstalls = mutation({
    args: { planId: v.id("marketplaceplans") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Marketplace plan not found");
        }

        await ctx.db.patch(args.planId, {
            installs: plan.installs + 1,
            updatedAt: Date.now(),
        });
        return null;
    },
});

// List forked plans for a user
export const listAuthorForkedPlans = query({
    args: { userId: v.id("users") },
    returns: v.array(
        v.object({
            _id: v.id("planforks"),
            _creationTime: v.number(),
            userId: v.id("users"),
            originalPlanId: v.id("plans"),
            forkedPlanId: v.id("plans"),
            createdAt: v.number(),
            originalPlan: v.union(v.null(), v.object({
                _id: v.id("plans"),
                title: v.string(),
                author: v.union(v.null(), v.object({
                    _id: v.id("users"),
                    name: v.string(),
                })),
            })),
            forkedPlan: v.union(v.null(), v.object({
                _id: v.id("plans"),
                title: v.string(),
            })),
        })
    ),
    handler: async (ctx, args) => {
        const forks = await ctx.db
            .query("planforks")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        return await Promise.all(
            forks.map(async (fork) => {
                const originalPlan = await ctx.db.get(fork.originalPlanId);
                const forkedPlan = await ctx.db.get(fork.forkedPlanId);
                let author = null;
                if (originalPlan) {
                    author = await ctx.db.get(originalPlan.userId);
                }
                return {
                    ...fork,
                    originalPlan: originalPlan ? {
                        _id: originalPlan._id,
                        title: originalPlan.title,
                        author: author ? {
                            _id: author._id,
                            name: author.name,
                        } : null,
                    } : null,
                    forkedPlan: forkedPlan ? {
                        _id: forkedPlan._id,
                        title: forkedPlan.title,
                    } : null,
                };
            })
        );
    },
});

// Update rating
export const updateRating = mutation({
    args: {
        planId: v.id("marketplaceplans"),
        rating: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.planId, {
            rating: args.rating,
            updatedAt: Date.now(),
        });
        return null;
    },
});

// Publish a plan (takes a snapshot of the current plan)
export const publishPlanWithSnapshot = mutation({
    args: {
        sourcePlanId: v.id("plans"),
        authorId: v.id("users"),
        visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
        tags: v.optional(v.array(v.string())),
        price: v.optional(v.number()),
        isFree: v.optional(v.boolean()),
    },
    returns: v.id("marketplaceplans"),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.sourcePlanId);
        if (!plan) throw new Error("Plan not found");
        if (plan.userId !== args.authorId) throw new Error("Unauthorized");

        const todos = await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.sourcePlanId))
            .collect();

        const snapshot = {
            title: plan.title,
            description: plan.description,
            difficulty: plan.difficulty,
            estimatedDuration: plan.estimatedDuration,
            todos: todos.map(t => ({
                title: t.title,
                description: t.description,
                order: t.order,
                priority: t.priority,
                estimatedTime: t.estimatedTime,
                resources: t.resources,
            }))
        };

        // Check if already published
        const existing = await ctx.db
            .query("marketplaceplans")
            .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
            .filter((q) => q.eq(q.field("sourcePlanId"), args.sourcePlanId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                snapshot,
                visibility: args.visibility ?? existing.visibility,
                tags: args.tags ?? existing.tags,
                price: args.price ?? existing.price,
                isFree: args.isFree ?? existing.isFree,
                updatedAt: Date.now(),
                version: existing.version + 1,
            });
            return existing._id;
        }

        return await ctx.db.insert("marketplaceplans", {
            sourcePlanId: args.sourcePlanId,
            authorId: args.authorId,
            snapshot,
            visibility: args.visibility ?? "public",
            tags: args.tags,
            price: args.price,
            isFree: args.isFree ?? true,
            rating: 0,
            installs: 0,
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Publish a plan (set to public)
export const publishPlan = mutation({
    args: {
        authorId: v.id("users"),
        planId: v.id("marketplaceplans")
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Marketplace plan not found");
        }

        // Verify user is the author
        if (plan.authorId !== args.authorId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.planId, {
            visibility: "public",
            updatedAt: Date.now(),
        });
        return null;
    },
});

// Unpublish a plan (set to private)
export const unpublishPlan = mutation({
    args: {
        authorId: v.id("users"),
        planId: v.id("marketplaceplans")
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Marketplace plan not found");
        }

        // Verify user is the author
        if (plan.authorId !== args.authorId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.planId, {
            visibility: "private",
            updatedAt: Date.now(),
        });
        return null;
    },
});

// Delete a marketplace plan
export const deleteMarketplacePlan = mutation({
    args: {
        authorId: v.id("users"),
        planId: v.id("marketplaceplans")
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.planId);
        if (!plan) {
            throw new Error("Marketplace plan not found");
        }

        // Verify user is the author
        if (plan.authorId !== args.authorId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.planId);
        return null;
    },
});

// Search marketplace plans by tags
export const searchByTags = query({
    args: { tags: v.array(v.string()) },
    returns: v.array(
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
        })
    ),
    handler: async (ctx, args) => {
        const allPlans = await ctx.db
            .query("marketplaceplans")
            .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
            .collect();

        // Filter plans that have at least one matching tag
        return allPlans.filter(plan => {
            if (!plan.tags) return false;
            return args.tags.some(tag => plan.tags?.includes(tag));
        });
    },
});

// Get free marketplace plans
export const listFreePlans = query({
    args: {},
    returns: v.array(
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
        })
    ),
    handler: async (ctx) => {
        const allPlans = await ctx.db
            .query("marketplaceplans")
            .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
            .collect();

        return allPlans.filter(plan => plan.isFree);
    },
});

// Fork a marketplace plan (create a new plan from snapshot)
export const forkMarketplacePlan = mutation({
    args: {
        marketplacePlanId: v.id("marketplaceplans"),
        userId: v.id("users"),
    },
    returns: v.id("plans"),
    handler: async (ctx, args) => {
        const mpPlan = await ctx.db.get(args.marketplacePlanId);
        if (!mpPlan) {
            throw new Error("Marketplace plan not found");
        }

        // Check if free or if user has purchased it
        if (!mpPlan.isFree) {
            const purchase = await ctx.db
                .query("purchases")
                .withIndex("by_userId", (q) => q.eq("userId", args.userId))
                .filter((q) => q.eq(q.field("planId"), args.marketplacePlanId))
                .unique();

            if (!purchase && mpPlan.authorId !== args.userId) {
                throw new Error("Purchase required for this plan");
            }
        }

        // Create new learning plan from snapshot
        const newPlanId = await ctx.db.insert("plans", {
            userId: args.userId,
            title: `${mpPlan.snapshot.title} (Remix)`,
            description: mpPlan.snapshot.description,
            difficulty: mpPlan.snapshot.difficulty as "easy" | "medium" | "hard",
            estimatedDuration: mpPlan.snapshot.estimatedDuration,
            status: "active",
            isForked: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Track the fork
        await ctx.db.insert("planforks", {
            userId: args.userId,
            originalPlanId: mpPlan.sourcePlanId,
            forkedPlanId: newPlanId,
            createdAt: Date.now(),
        });

        // Copy todos from snapshot
        for (const todo of mpPlan.snapshot.todos) {
            await ctx.db.insert("todos", {
                planId: newPlanId,
                title: todo.title,
                description: todo.description,
                order: todo.order,
                priority: todo.priority,
                status: "pending",
                dueDate: Date.now() + (todo.order * 24 * 60 * 60 * 1000), // Simple heuristic: 1 day per order unit
                estimatedTime: todo.estimatedTime,
                resources: todo.resources,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        // Increment installs
        await ctx.db.patch(args.marketplacePlanId, {
            installs: mpPlan.installs + 1,
            updatedAt: Date.now(),
        });

        return newPlanId;
    },
});
