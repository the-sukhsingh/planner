import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Atomic plan creation with initial steps.
 */
export const createPlanWithSteps = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        description: v.optional(v.string()),
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
        estimatedDuration: v.optional(v.number()),
        startDate: v.optional(v.number()),
        steps: v.array(v.object({
            title: v.string(),
            description: v.optional(v.string()),
            order: v.number(),
            priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
            estimatedTime: v.optional(v.number()),
            notes: v.optional(v.string()),
            resources: v.optional(v.array(v.string())),
        })),
    },
    returns: v.id("plans"),
    handler: async (ctx, args) => {
        const planId = await ctx.db.insert("plans", {
            userId: args.userId,
            title: args.title,
            description: args.description,
            difficulty: args.difficulty,
            estimatedDuration: args.estimatedDuration || args.steps.length,
            status: "active",
            isForked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        if (args.steps.length > 0) {
            const planStartDate = args.startDate ? new Date(args.startDate) : new Date();
            const orderToDayMap = new Map<number, number>();
            let currentDay = 0;
            let lastOrder = -1;
            const sortedSteps = [...args.steps].sort((a, b) => a.order - b.order);

            for (const step of sortedSteps) {
                if (step.order !== lastOrder) {
                    if (lastOrder !== -1) currentDay++;
                    lastOrder = step.order;
                    orderToDayMap.set(step.order, currentDay);
                }
                const dueDate = new Date(planStartDate);
                dueDate.setDate(dueDate.getDate() + (orderToDayMap.get(step.order) ?? 0));

                await ctx.db.insert("todos", {
                    planId,
                    title: step.title,
                    description: step.description || "",
                    order: step.order,
                    priority: step.priority || "medium",
                    estimatedTime: step.estimatedTime,
                    resources: step.resources || [],
                    status: "pending",
                    dueDate: dueDate.getTime(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
        }

        return planId;
    },
});

/**
 * Replaces pending steps in a plan.
 */
export const editPlanSteps = mutation({
    args: {
        planId: v.id("plans"),
        steps: v.array(v.object({
            title: v.string(),
            description: v.optional(v.string()),
            order: v.number(),
            priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
            estimatedTime: v.optional(v.number()),
            resources: v.optional(v.array(v.string())),
        })),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const pendingTodos = await ctx.db
            .query("todos")
            .withIndex("by_plan_status", (q) => q.eq("planId", args.planId).eq("status", "pending"))
            .collect();

        for (const todo of pendingTodos) {
            await ctx.db.delete(todo._id);
        }

        for (const step of args.steps) {
            await ctx.db.insert("todos", {
                planId: args.planId,
                title: step.title,
                description: step.description || "",
                order: step.order,
                priority: step.priority || "medium",
                estimatedTime: step.estimatedTime,
                resources: step.resources || [],
                status: "pending",
                dueDate: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
        return null;
    },
});

/**
 * Appends new steps to a plan.
 */
export const appendSteps = mutation({
    args: {
        planId: v.id("plans"),
        steps: v.array(v.object({
            title: v.string(),
            description: v.optional(v.string()),
            order: v.number(),
            priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
            estimatedTime: v.optional(v.number()),
            resources: v.optional(v.array(v.string())),
        })),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        for (const step of args.steps) {
            await ctx.db.insert("todos", {
                planId: args.planId,
                title: step.title,
                description: step.description || "",
                order: step.order,
                priority: step.priority || "medium",
                estimatedTime: step.estimatedTime,
                resources: step.resources || [],
                status: "pending",
                dueDate: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
        return null;
    },
});

/**
 * Retrieves pending tasks for today across active plans.
 */
export const getTodayTasks = query({
    args: { userId: v.id("users") },
    returns: v.array(v.object({
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
    })),
    handler: async (ctx, args) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const plans = await ctx.db
            .query("plans")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();

        if (plans.length === 0) return [];

        const planIds = plans.map(p => p._id);
        const tasks = [];

        for (const planId of planIds) {
            const planTasks = await ctx.db
                .query("todos")
                .withIndex("by_plan_status", (q) => q.eq("planId", planId).eq("status", "pending"))
                .filter((q) => q.lt(q.field("dueDate"), tomorrow.getTime()) && q.gte(q.field("dueDate"), today.getTime()))
                .collect();
            tasks.push(...planTasks);
        }

        return tasks;
    },
});

/**
 * Shifts orders of planner steps starting from a specific todo.
 */
export const shiftStepsByTodo = mutation({
    args: {
        planId: v.id("plans"),
        todoId: v.id("todos"),
        shiftBy: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const todos = await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.planId))
            .order("asc")
            .collect();

        const startIndex = todos.findIndex(t => t._id === args.todoId);
        if (startIndex === -1) throw new Error("Todo not found");

        for (let i = startIndex; i < todos.length; i++) {
            await ctx.db.patch(todos[i]._id, {
                order: todos[i].order + args.shiftBy,
                updatedAt: Date.now(),
            });
        }
        return null;
    },
});



export const shiftTodosOfPlan = mutation({
    args: {
        planId: v.id("plans"),
        shiftBy: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Get all pending todos
        const todos = await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.planId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .order("asc")
            .collect();

        // Shift their Dates
        for (const todo of todos) {
            await ctx.db.patch(todo._id, {
                dueDate: todo.dueDate + args.shiftBy * 24 * 60 * 60 * 1000, // shiftBy days in ms
                updatedAt: Date.now(),
            });
        }
        return null;
    }
})