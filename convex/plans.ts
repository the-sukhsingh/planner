import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new plan
export const createPlan = mutation({
    args: {
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
        status: v.optional(v.union(
            v.literal("draft"),
            v.literal("active"),
            v.literal("completed"),
            v.literal("archived")
        )),
        isForked: v.optional(v.boolean()),
    },
    returns: v.id("plans"),
    handler: async (ctx, args) => {
        return await ctx.db.insert("plans", {
            userId: args.userId,
            chatId: args.chatId,
            title: args.title,
            description: args.description,
            difficulty: args.difficulty,
            estimatedDuration: args.estimatedDuration,
            status: args.status ?? "draft",
            isForked: args.isForked ?? false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Get a plan by ID
export const getPlan = query({
    args: {
        userId: v.id("users"),
        planId: v.id("plans")
    },
    returns: v.union(
        v.object({
            _id: v.id("plans"),
            _creationTime: v.number(),
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
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            return null;
        }
        return plan;
    },
});

// List all plans for a user
export const listUserPlans = query({
    args: { userId: v.id("users") },
    returns: v.array(
        v.object({
            _id: v.id("plans"),
            _creationTime: v.number(),
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
        })
    ),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("plans")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

// List plans by status
export const listPlansByStatus = query({
    args: {
        userId: v.id("users"),
        status: v.union(
            v.literal("draft"),
            v.literal("active"),
            v.literal("completed"),
            v.literal("archived")
        ),
    },
    returns: v.array(
        v.object({
            _id: v.id("plans"),
            _creationTime: v.number(),
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
        })
    ),
    handler: async (ctx, args) => {
        const allPlans = await ctx.db
            .query("plans")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        return allPlans.filter(plan => plan.status === args.status);
    },
});

// Update a plan
export const updatePlan = mutation({
    args: {
        userId: v.id("users"),
        planId: v.id("plans"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        difficulty: v.optional(v.union(
            v.literal("easy"),
            v.literal("medium"),
            v.literal("hard")
        )),
        estimatedDuration: v.optional(v.number()),
        status: v.optional(v.union(
            v.literal("draft"),
            v.literal("active"),
            v.literal("completed"),
            v.literal("archived")
        )),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Verify plan belongs to user
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            throw new Error("Unauthorized");
        }

        const updates: Record<string, string | number | undefined> = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.difficulty !== undefined) updates.difficulty = args.difficulty;
        if (args.estimatedDuration !== undefined) updates.estimatedDuration = args.estimatedDuration;
        if (args.status !== undefined) updates.status = args.status;

        updates.updatedAt = Date.now();

        await ctx.db.patch(args.planId, updates);
        return null;
    },
});

// Update plan status
export const updatePlanStatus = mutation({
    args: {
        userId: v.id("users"),
        planId: v.id("plans"),
        status: v.union(
            v.literal("draft"),
            v.literal("active"),
            v.literal("completed"),
            v.literal("archived")
        ),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Verify plan belongs to user
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.planId, {
            status: args.status,
            updatedAt: Date.now(),
        });
        return null;
    },
});

// Delete a plan and all its todos
export const deletePlan = mutation({
    args: {
        userId: v.id("users"),
        planId: v.id("plans")
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Verify plan belongs to user
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            throw new Error("Unauthorized");
        }

        // Delete all todos for this plan
        const todos = await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.planId))
            .collect();

        for (const todo of todos) {
            await ctx.db.delete(todo._id);
        }

        // Delete the plan
        await ctx.db.delete(args.planId);
        return null;
    },
});

// Get plan with todos
export const getPlanWithTodos = query({
    args: {
        userId: v.id("users"),
        planId: v.id("plans")
    },
    returns: v.union(
        v.object({
            _id: v.id("plans"),
            _creationTime: v.number(),
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
            todos: v.array(
                v.object({
                    _id: v.id("todos"),
                    _creationTime: v.number(),
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
                })
            ),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            return null;
        }

        const todos = await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.planId))
            .collect();

        return {
            ...plan,
            todos,
        };
    },
});

// Fork a plan
export const forkPlan = mutation({
    args: {
        planId: v.id("plans"),
        userId: v.id("users"),
    },
    returns: v.id("plans"),
    handler: async (ctx, args) => {
        const originalPlan = await ctx.db.get(args.planId);
        if (!originalPlan) {
            throw new Error("Plan not found");
        }

        // Create forked plan
        const newPlanId = await ctx.db.insert("plans", {
            userId: args.userId,
            chatId: undefined,
            title: `${originalPlan.title} (Forked)`,
            description: originalPlan.description,
            difficulty: originalPlan.difficulty,
            estimatedDuration: originalPlan.estimatedDuration,
            status: "draft",
            isForked: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Copy todos
        const originalTodos = await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.planId))
            .collect();

        for (const todo of originalTodos) {
            await ctx.db.insert("todos", {
                planId: newPlanId,
                title: todo.title,
                description: todo.description,
                order: todo.order,
                priority: todo.priority,
                status: "pending",
                dueDate: Date.now() + (todo.dueDate - todo.createdAt),
                estimatedTime: todo.estimatedTime,
                resources: todo.resources,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return newPlanId;
    },
});

// Get plan count for user
export const getUserPlanCount = query({
    args: { userId: v.id("users") },
    returns: v.number(),
    handler: async (ctx, args) => {
        const plans = await ctx.db
            .query("plans")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        return plans.length;
    },
});
