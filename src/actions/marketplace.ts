"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
    learningPlansTable,
    todosTable,
    milestonesTable,
    marketplacePlansTable,
    planForksTable,
    planPurchasesTable,
    usersTable,
    activityLogTable
} from "@/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.email) return null;
    const users = await db.select().from(usersTable).where(eq(usersTable.email, session.user.email)).limit(1);
    return users[0] || null;
}

export async function publishPlan(planId: number, data: {
    price?: number;
    isFree?: boolean;
    visibility?: 'public' | 'private';
    tags?: string[];
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Check if plan exists and belongs to user
    const plan = await db.query.learningPlansTable.findFirst({
        where: and(eq(learningPlansTable.id, planId), eq(learningPlansTable.userId, user.id))
    });

    if (!plan) throw new Error("Plan not found or access denied");

    // Check if this plan is a fork/remix - if so, prevent publishing
    const isFork = await db.query.planForksTable.findFirst({
        where: eq(planForksTable.forkedPlanId, planId)
    });

    if (isFork) {
        throw new Error("Cannot publish remixed or forked plans. Only original plans can be published to the marketplace.");
    }

    // Create or update marketplace entry
    const existingMP = await db.query.marketplacePlansTable.findFirst({
        where: eq(marketplacePlansTable.planId, planId)
    });

    if (existingMP) {
        await db.update(marketplacePlansTable)
            .set({
                price: data.price ?? 0,
                isFree: data.isFree ?? true,
                visibility: data.visibility ?? 'public',
                status: 'published',
                updatedAt: new Date(),
            })
            .where(eq(marketplacePlansTable.id, existingMP.id));
    } else {
        await db.insert(marketplacePlansTable).values({
            planId,
            userId: user.id,
            price: data.price ?? 0,
            isFree: data.isFree ?? true,
            visibility: data.visibility ?? 'public',
            status: 'published',
        });
    }

    await db.insert(activityLogTable).values({
        userId: user.id,
        planId,
        activityType: 'plan_published',
        description: `Published plan "${plan.title}" to marketplace`,
    });

    revalidatePath("/marketplace");
    revalidatePath("/dashboard/marketplace");
    return { success: true };
}

export async function unpublishPlan(planId: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await db.update(marketplacePlansTable)
        .set({ status: 'draft' })
        .where(and(eq(marketplacePlansTable.planId, planId), eq(marketplacePlansTable.userId, user.id)));

    revalidatePath("/marketplace");
    revalidatePath("/dashboard/marketplace");
    return { success: true };
}

export async function forkPlan(marketplacePlanId: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Get marketplace plan details
    const mpPlan = await db.query.marketplacePlansTable.findFirst({
        where: eq(marketplacePlansTable.id, marketplacePlanId),
        with: {
            plan: {
                with: {
                    todos: true,
                    milestones: true,
                }
            }
        }
    });

    if (!mpPlan || !mpPlan.plan) throw new Error("Marketplace plan not found");

    // Check if paid and if user has purchased it
    if (!mpPlan.isFree && mpPlan.userId !== user.id) {
        const purchase = await db.query.planPurchasesTable.findFirst({
            where: and(
                eq(planPurchasesTable.marketplacePlanId, marketplacePlanId),
                eq(planPurchasesTable.userId, user.id)
            )
        });
        if (!purchase) throw new Error("Purchase required for this plan");
    }

    // Create new learning plan copy
    const [newPlan] = await db.insert(learningPlansTable).values({
        userId: user.id,
        title: `${mpPlan.plan.title} (Remix)`,
        description: mpPlan.plan.description,
        goal: mpPlan.plan.goal,
        difficulty: mpPlan.plan.difficulty,
        estimatedDuration: mpPlan.plan.estimatedDuration,
        status: 'active',
        progress: 0,
    }).returning();

    // Copy todos
    if (mpPlan.plan.todos.length > 0) {

        const sortedTodos = [...mpPlan.plan.todos].sort((a, b) => a.order - b.order);
        const planStartDate = new Date();
        let currentDay = 0;
        let lastOrder = -1;
        const orderToDayMap = new Map<number, number>();

        await db.insert(todosTable).values(
            sortedTodos.map(todo => {
                if (todo.order !== lastOrder) {
                    if (lastOrder !== -1) currentDay++;
                    lastOrder = todo.order;
                    orderToDayMap.set(todo.order, currentDay);
                }
                const dueDate = new Date(planStartDate);
                dueDate.setDate(dueDate.getDate() + (orderToDayMap.get(todo.order) || 0));
                return {
                    planId: newPlan.id,
                    title: todo.title,
                    description: todo.description,
                    order: todo.order,
                    priority: todo.priority,
                    status: 'pending',
                    estimatedTime: todo.estimatedTime,
                    resources: todo.resources,
                    dueDate,
                };
            })
        );
    }

    // Copy milestones
    if (mpPlan.plan.milestones.length > 0) {
        await db.insert(milestonesTable).values(
            mpPlan.plan.milestones.map(m => ({
                planId: newPlan.id,
                title: m.title,
                description: m.description,
                order: m.order,
                isCompleted: false,
            }))
        );
    }

    // Track fork
    await db.insert(planForksTable).values({
        originalPlanId: mpPlan.planId,
        forkedPlanId: newPlan.id,
        userId: user.id,
    });

    // Increment installs
    await db.update(marketplacePlansTable)
        .set({ installs: sql`${marketplacePlansTable.installs} + 1` })
        .where(eq(marketplacePlansTable.id, marketplacePlanId));

    await db.insert(activityLogTable).values({
        userId: user.id,
        planId: newPlan.id,
        activityType: 'plan_forked',
        description: `Forked "${mpPlan.plan.title}" from marketplace`,
    });

    revalidatePath("/plans");
    return { success: true, newPlanId: newPlan.id };
}

export async function purchasePlan(marketplacePlanId: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const mpPlan = await db.query.marketplacePlansTable.findFirst({
        where: eq(marketplacePlansTable.id, marketplacePlanId)
    });

    if (!mpPlan) throw new Error("Plan not found");
    if (mpPlan.isFree) return { success: true, message: "Plan is free" };

    // Check if user has enough credits
    if (user.credits < mpPlan.price) {
        throw new Error("Insufficient credits");
    }

    // Deduct credits from buyer
    await db.update(usersTable)
        .set({ credits: user.credits - mpPlan.price })
        .where(eq(usersTable.id, user.id));

    // Add 90% of credits to the publisher
    const publisherRevenue = Math.floor(mpPlan.price * 0.9);
    await db.update(usersTable)
        .set({ credits: sql`${usersTable.credits} + ${publisherRevenue}` })
        .where(eq(usersTable.id, mpPlan.userId));

    // Track purchase
    await db.insert(planPurchasesTable).values({
        userId: user.id,
        marketplacePlanId,
        price: mpPlan.price,
    });

    revalidatePath("/marketplace");
    revalidatePath("/plans");
    return { success: true };
}

export async function deleteMarketplacePlan(mpId: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await db.delete(marketplacePlansTable)
        .where(and(eq(marketplacePlansTable.id, mpId), eq(marketplacePlansTable.userId, user.id)));

    revalidatePath("/marketplace");
    revalidatePath("/dashboard/marketplace");
    return { success: true };
}

export async function updateMarketplacePlan(mpId: number, data: {
    price?: number;
    isFree?: boolean;
    visibility?: 'public' | 'private';
    status?: 'published' | 'draft' | 'archived';
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    await db.update(marketplacePlansTable)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(and(eq(marketplacePlansTable.id, mpId), eq(marketplacePlansTable.userId, user.id)));

    revalidatePath("/marketplace");
    revalidatePath(`/marketplace/${mpId}`);
    revalidatePath("/dashboard/marketplace");
    return { success: true };
}
