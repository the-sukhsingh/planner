import { auth } from "@/auth";
import { db } from "@/db";
import { usersTable, conversationsTable, messagesTable } from "@/schema";
import { eq,  gt, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Get parameters
    const { searchParams } = new URL(request.url);
    const chatIdStr = searchParams.get("chatId");
    const lastMessageId = searchParams.get("lastMessageId");

    if (!chatIdStr) {
        return new Response("Chat ID is required", { status: 400 });
    }

    const chatId = parseInt(chatIdStr);

    // Get user ID
    const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, session.user.email))
        .limit(1);

    if (!user) {
        return new Response("User not found", { status: 404 });
    }

    // Get the specific conversation
    const [conversation] = await db
        .select()
        .from(conversationsTable)
        .where(
            and(
                eq(conversationsTable.id, chatId),
                eq(conversationsTable.userId, user.id)
            )
        )
        .limit(1);

    if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
    }

    // Set up SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            let currentLastMessageId = lastMessageId ? parseInt(lastMessageId) : null;
            let isPolling = true;
            
            const sendMessage = (data: any) => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                );
            };

            // Poll for new messages
            const poll = async () => {
                if (!isPolling) return;
                
                try {
                    let messages;
                    
                    if (currentLastMessageId) {
                        // Get messages newer than currentLastMessageId
                        messages = await db
                            .select()
                            .from(messagesTable)
                            .where(
                                and(
                                    eq(messagesTable.conversationId, conversation.id),
                                    gt(messagesTable.id, currentLastMessageId)
                                )
                            )
                            .orderBy(messagesTable.createdAt);
                    } else {
                        // Get all messages (only on first poll if no lastMessageId)
                        messages = await db
                            .select()
                            .from(messagesTable)
                            .where(eq(messagesTable.conversationId, conversation.id))
                            .orderBy(messagesTable.createdAt);
                    }

                    if (messages.length > 0) {
                        messages.forEach((msg: typeof messagesTable.$inferSelect) => {
                            sendMessage({
                                id: msg.id.toString(),
                                content: msg.content,
                                sender: msg.role === 'user' ? 'user' : 'ai',
                                timestamp: new Date(msg.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                }),
                                metadata: msg.metadata,
                            });
                            // Update the last seen message ID
                            currentLastMessageId = msg.id;
                        });
                    }
                } catch (error) {
                    console.error("Stream error:", error);
                    // Don't close connection on error, just continue polling
                }
                
                // Schedule next poll if still active
                if (isPolling) {
                    setTimeout(poll, 1000);
                }
            };

            // Start polling
            poll();

            // Clean up on close
            request.signal.addEventListener("abort", () => {
                isPolling = false;
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
