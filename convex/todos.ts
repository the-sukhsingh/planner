import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create a new todo
export const createTodo = mutation({
    args: {
        planId: v.id("plans"),
        title: v.string(),
        description: v.optional(v.string()),
        order: v.number(),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        status: v.optional(v.string()),
        dueDate: v.number(),
        estimatedTime: v.optional(v.number()),
        resources: v.optional(v.array(v.string())),
    },
    returns: v.id("todos"),
    handler: async (ctx, args) => {
        return await ctx.db.insert("todos", {
            planId: args.planId,
            title: args.title,
            description: args.description,
            order: args.order,
            priority: args.priority,
            status: args.status ?? "pending",
            dueDate: args.dueDate,
            estimatedTime: args.estimatedTime,
            resources: args.resources,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Get a todo by ID
export const getTodo = query({
    args: {
        userId: v.id("users"),
        todoId: v.id("todos")
    },
    returns: v.union(
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
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const todo = await ctx.db.get(args.todoId);
        if (!todo) {
            return null;
        }

        // Verify todo's plan belongs to user
        const plan = await ctx.db.get(todo.planId);
        if (!plan || plan.userId !== args.userId) {
            return null;
        }

        return todo;
    },
});

// List all todos for a plan
export const listPlanTodos = query({
    args: {
        userId: v.id("users"),
        planId: v.id("plans")
    },
    returns: v.array(
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
    handler: async (ctx, args) => {
        // Verify plan belongs to user
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            return [];
        }

        return await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.planId))
            .order("asc")
            .collect();
    },
});

// List todos by status
export const listTodosByStatus = query({
    args: {
        userId: v.id("users"),
        planId: v.id("plans"),
        status: v.string(),
    },
    returns: v.array(
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
    handler: async (ctx, args) => {
        // Verify plan belongs to user
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            return [];
        }

        return await ctx.db
            .query("todos")
            .withIndex("by_plan_status", (q) =>
                q.eq("planId", args.planId).eq("status", args.status)
            )
            .collect();
    },
});

// List todos by due date
export const listTodosByDueDate = query({
    args: {
        userId: v.id("users"),
        startDate: v.number(),
        endDate: v.number(),
    },
    returns: v.array(
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
    handler: async (ctx, args) => {
        // Get user's plans first
        const userPlans = await ctx.db
            .query("plans")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const planIds = new Set(userPlans.map(p => p._id));

        const todos = await ctx.db
            .query("todos")
            .withIndex("by_dueDate")
            .collect();

        return todos.filter(
            todo => planIds.has(todo.planId) &&
                todo.dueDate >= args.startDate &&
                todo.dueDate <= args.endDate
        );
    },
});

// Get overdue todos
export const getOverdueTodos = query({
    args: {
        planId: v.id("plans"),
    },
    returns: v.array(
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
    handler: async (ctx, args) => {
        const now = Date.now();
        let todos;

        if (args.planId) {
            todos = await ctx.db
                .query("todos")
                .withIndex("by_plan", (q) => q.eq("planId", args.planId))
                .collect();
        } else {
            todos = await ctx.db.query("todos").collect();
        }

        return todos.filter(
            todo => todo.dueDate < now && todo.status !== "completed" && !todo.completedAt
        );
    },
});

// Update a todo
export const updateTodo = mutation({
    args: {
        userId: v.id("users"),
        todoId: v.id("todos"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        order: v.optional(v.number()),
        priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        status: v.optional(v.string()),
        dueDate: v.optional(v.number()),
        estimatedTime: v.optional(v.number()),
        resources: v.optional(v.array(v.string())),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const todo = await ctx.db.get(args.todoId);
        if (!todo) {
            throw new Error("Todo not found");
        }

        // Verify todo's plan belongs to user
        const plan = await ctx.db.get(todo.planId);
        if (!plan || plan.userId !== args.userId) {
            throw new Error("Unauthorized");
        }

        const updates: Record<string, string | number | string[] | undefined> = {};
        if (args.title !== undefined) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.order !== undefined) updates.order = args.order;
        if (args.priority !== undefined) updates.priority = args.priority;
        if (args.status !== undefined) updates.status = args.status;
        if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
        if (args.estimatedTime !== undefined) updates.estimatedTime = args.estimatedTime;
        if (args.resources !== undefined) updates.resources = args.resources;

        updates.updatedAt = Date.now();

        await ctx.db.patch(args.todoId, updates);
        return null;
    },
});

// Update todo status
export const updateTodoStatus = mutation({
    args: {
        userId: v.id("users"),
        todoId: v.id("todos"),
        status: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const todo = await ctx.db.get(args.todoId);
        if (!todo) {
            throw new Error("Todo not found");
        }

        // Verify todo's plan belongs to user
        const plan = await ctx.db.get(todo.planId);
        if (!plan || plan.userId !== args.userId) {
            throw new Error("Unauthorized");
        }

        const updates: Record<string, string | number | undefined> = {
            status: args.status,
            updatedAt: Date.now(),
        };

        // If marking as completed, set completedAt
        if (args.status === "completed") {
            updates.completedAt = Date.now();
        }

        await ctx.db.patch(args.todoId, updates);
        return null;
    },
});

// Complete a todo
export const completeTodo = mutation({
    args: {
        userId: v.id("users"),
        todoId: v.id("todos")
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const todo = await ctx.db.get(args.todoId);
        if (!todo) {
            throw new Error("Todo not found");
        }

        // Verify todo's plan belongs to user
        const plan = await ctx.db.get(todo.planId);
        if (!plan || plan.userId !== args.userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.todoId, {
            status: "completed",
            completedAt: Date.now(),
            updatedAt: Date.now(),
        });
        return null;
    },
});

// Reorder todos
export const reorderTodos = mutation({
    args: {
        todoUpdates: v.array(
            v.object({
                todoId: v.id("todos"),
                order: v.number(),
            })
        ),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        for (const update of args.todoUpdates) {
            await ctx.db.patch(update.todoId, {
                order: update.order,
                updatedAt: Date.now(),
            });
        }
        return null;
    },
});

// Delete a todo
export const deleteTodo = mutation({
    args: {
        userId: v.id("users"),
        todoId: v.id("todos")
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const todo = await ctx.db.get(args.todoId);
        if (!todo) {
            throw new Error("Todo not found");
        }

        // Verify todo's plan belongs to user
        const plan = await ctx.db.get(todo.planId);
        if (!plan || plan.userId !== args.userId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.todoId);
        return null;
    },
});

// Delete all completed todos in a plan
export const deleteCompletedTodos = mutation({
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

        const todos = await ctx.db
            .query("todos")
            .withIndex("by_plan_status", (q) =>
                q.eq("planId", args.planId).eq("status", "completed")
            )
            .collect();

        for (const todo of todos) {
            await ctx.db.delete(todo._id);
        }

        return null;
    },
});

// Get todo count for plan
export const getPlanTodoCount = query({
    args: {
        userId: v.id("users"),
        planId: v.id("plans")
    },
    returns: v.object({
        total: v.number(),
        completed: v.number(),
        pending: v.number(),
    }),
    handler: async (ctx, args) => {
        // Verify plan belongs to user
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            return { total: 0, completed: 0, pending: 0 };
        }

        const todos = await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.planId))
            .collect();

        return {
            total: todos.length,
            completed: todos.filter(t => t.status === "completed").length,
            pending: todos.filter(t => t.status !== "completed").length,
        };
    },
});

// Shift due dates for all todos in a plan
export const shiftTodoDueDates = mutation({
    args: {
        userId: v.id("users"),
        planId: v.id("plans"),
        days: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Verify plan belongs to user
        const plan = await ctx.db.get(args.planId);
        if (!plan || plan.userId !== args.userId) {
            throw new Error("Unauthorized");
        }

        const todos = await ctx.db
            .query("todos")
            .withIndex("by_plan", (q) => q.eq("planId", args.planId))
            .collect();

        const millisecondsToShift = args.days * 24 * 60 * 60 * 1000;

        for (const todo of todos) {
            await ctx.db.patch(todo._id, {
                dueDate: todo.dueDate + millisecondsToShift,
                updatedAt: Date.now(),
            });
        }

        return null;
    },
});

export const getTodosBySpecificDate = query({
    args: {
        specificDate: v.number(),
        userId: v.id("users")
    },
    returns: v.array(
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
    handler: async (ctx, args) => {
        const plans = await ctx.db.query("plans").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
        const startOfDay = new Date(args.specificDate).setHours(0, 0, 0, 0);
        const endOfDay = new Date(args.specificDate).setHours(23, 59, 59, 999);

        const allTodos = await Promise.all(
            plans.map(async (plan) => {
                return (await ctx.db.query("todos").withIndex("by_plan", (q) => q.eq("planId", plan._id)).collect())
                    .filter((todo) => todo.dueDate >= startOfDay && todo.dueDate <= endOfDay);
            })
        );

        return allTodos.flat();
    },
});

// Shift due dates for all pending todos (optionally filtered by plan)
export const shiftPendingTodos = mutation({
    args: {
        userId: v.id("users"),
        days: v.number(),
        planId: v.optional(v.id("plans")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const millisecondsToShift = args.days * 24 * 60 * 60 * 1000;

        let planIds: Id<"plans">[] = [];

        if (args.planId) {
            // Verify plan belongs to user
            const plan = await ctx.db.get(args.planId);
            if (!plan || plan.userId !== args.userId) {
                throw new Error("Unauthorized or plan not found");
            }
            planIds = [args.planId];
        } else {
            // Get all user's plans
            const plans = await ctx.db
                .query("plans")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .collect();
            planIds = plans.map(p => p._id);
        }

        for (const planId of planIds) {
            const pendingTodos = await ctx.db
                .query("todos")
                .withIndex("by_plan_status", (q) =>
                    q.eq("planId", planId).eq("status", "pending")
                )
                .collect();

            for (const todo of pendingTodos) {
                await ctx.db.patch(todo._id, {
                    dueDate: todo.dueDate + millisecondsToShift,
                    updatedAt: Date.now(),
                });
            }
        }

        return null;
    },
});

// List all todos for a user across all plans
export const listAllUserTodos = query({
    args: { userId: v.id("users") },
    returns: v.array(
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
    handler: async (ctx, args) => {
        const plans = await ctx.db
            .query("plans")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const planIds = plans.map(p => p._id);

        // This is still a bit inefficient if there are many plans/todos
        // Ideally we'd have a userId on the todo or a way to query by planIds
        const allTodos = await Promise.all(
            planIds.map(async (planId) => {
                return await ctx.db
                    .query("todos")
                    .withIndex("by_plan", (q) => q.eq("planId", planId))
                    .collect();
            })
        );

        return allTodos.flat();
    },
});

// Create multiple todos at once (bulk create)
export const createMultipleTodos = mutation({
    args: {
        todos: v.array(v.object({
            planId: v.id("plans"),
            title: v.string(),
            description: v.optional(v.string()),
            order: v.number(),
            priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
            status: v.optional(v.string()),
            dueDate: v.number(),
            estimatedTime: v.optional(v.number()),
            resources: v.optional(v.array(v.string())),
        }))
    },
    returns: v.array(v.id("todos")),
    handler: async (ctx, args) => {
        const todoIds: Id<"todos">[] = [];
        
        for (const todo of args.todos) {
            const todoId = await ctx.db.insert("todos", {
                planId: todo.planId,
                title: todo.title,
                description: todo.description,
                order: todo.order,
                priority: todo.priority,
                status: todo.status ?? "pending",
                dueDate: todo.dueDate,
                estimatedTime: todo.estimatedTime,
                resources: todo.resources,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            todoIds.push(todoId);
        }
        
        return todoIds;
    },
});