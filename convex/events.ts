import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Log an event
 */
export const logEvent = mutation({
    args: {
        userId: v.optional(v.id("users")),
        type: v.string(),
        payload: v.any(),
    },
    returns: v.id("events"),
    handler: async (ctx, args) => {
        const now = Date.now();
        
        const eventId = await ctx.db.insert("events", {
            userId: args.userId,
            type: args.type,
            payload: args.payload,
            createdAt: now,
        });

        return eventId;
    },
});

/**
 * Get events by type
 */
export const getEventsByType = query({
    args: {
        type: v.string(),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("events"),
        _creationTime: v.number(),
        userId: v.optional(v.id("users")),
        type: v.string(),
        payload: v.any(),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;
        
        const events = await ctx.db
            .query("events")
            .withIndex("by_type", (q) => q.eq("type", args.type))
            .order("desc")
            .take(limit);

        return events;
    },
});

/**
 * Get recent events
 */
export const getRecentEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("events"),
        _creationTime: v.number(),
        userId: v.optional(v.id("users")),
        type: v.string(),
        payload: v.any(),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        
        const events = await ctx.db
            .query("events")
            .order("desc")
            .take(limit);

        return events;
    },
});

/**
 * Get events for a user
 */
export const getUserEvents = query({
    args: {
        userId: v.id("users"),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("events"),
        _creationTime: v.number(),
        userId: v.optional(v.id("users")),
        type: v.string(),
        payload: v.any(),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;
        
        const allEvents = await ctx.db
            .query("events")
            .order("desc")
            .take(1000);

        const userEvents = allEvents
            .filter((e) => e.userId === args.userId)
            .slice(0, limit);

        return userEvents;
    },
});

/**
 * Get events in a date range
 */
export const getEventsInRange = query({
    args: {
        startDate: v.number(),
        endDate: v.number(),
        type: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("events"),
        _creationTime: v.number(),
        userId: v.optional(v.id("users")),
        type: v.string(),
        payload: v.any(),
        createdAt: v.number(),
    })),
    handler: async (ctx, args) => {
        const limit = args.limit ?? 1000;
        
        const allEvents = await ctx.db
            .query("events")
            .order("desc")
            .take(limit);

        let filtered = allEvents.filter((e) => 
            e.createdAt >= args.startDate && e.createdAt <= args.endDate
        );

        if (args.type) {
            filtered = filtered.filter((e) => e.type === args.type);
        }

        return filtered;
    },
});

/**
 * Count events by type
 */
export const countEventsByType = query({
    args: {
        type: v.string(),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query("events")
            .withIndex("by_type", (q) => q.eq("type", args.type))
            .collect();

        if (args.startDate && args.endDate) {
            const filtered = events.filter((e) => 
                e.createdAt >= args.startDate! && e.createdAt <= args.endDate!
            );
            return filtered.length;
        }

        return events.length;
    },
});
