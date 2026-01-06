"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { usersTable } from "@/schema";
import { eq } from "drizzle-orm";

export async function getUserProfile() {
    const session = await auth();
    if (!session?.user?.email) return null;

    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, session.user.email))
        .limit(1);

    return user || null;
}

export async function getUserCredits() {
    const session = await auth();
    if (!session?.user?.email) return null;

    const [user] = await db
        .select({ credits: usersTable.credits })
        .from(usersTable)
        .where(eq(usersTable.email, session.user.email))
        .limit(1);

    return user?.credits ?? 0;
}
