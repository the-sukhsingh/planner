import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { usersTable, conversationsTable, messagesTable } from "@/schema";
import { eq, desc, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user ID
        const [user] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.email, session.user.email))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Get the latest conversation
        const [conversation] = await db
            .select()
            .from(conversationsTable)
            .where(eq(conversationsTable.userId, user.id))
            .orderBy(desc(conversationsTable.updatedAt))
            .limit(1);

        if (!conversation) {
            return NextResponse.json({ messages: [] });
        }

        // Get all messages for the conversation
        const messages = await db
            .select()
            .from(messagesTable)
            .where(eq(messagesTable.conversationId, conversation.id))
            .orderBy(messagesTable.createdAt);

        return NextResponse.json({ 
            messages: messages.map(msg => ({
                id: msg.id.toString(),
                content: msg.content,
                sender: msg.role === 'user' ? 'user' : 'ai',
                timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                metadata: msg.metadata,
            }))
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
