import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client"; // Import our client
import { auth } from "@/auth";
import { db } from "@/db";
import { usersTable, conversationsTable, messagesTable } from "@/schema";
import { eq, desc, and } from "drizzle-orm";

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

// Create a simple async Next.js API route handler
export async function POST(request: Request) {
    try {
        // Get authenticated user
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const question = formData.get('question') as string;
        const chatIdStr = formData.get('chatId') as string | null;
        const chatId = chatIdStr ? parseInt(chatIdStr) : null;
        const files = formData.getAll('file');


        if (!question) {
            return NextResponse.json(
                { error: "Question is required" },
                { status: 400 }
            );
        }

        // Get user ID and credits
        const [user] = await db
            .select({ id: usersTable.id, credits: usersTable.credits })
            .from(usersTable)
            .where(eq(usersTable.email, session.user.email))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check credits
        if (user.credits < 5) {
            return NextResponse.json(
                { error: "Insufficient credits" },
                { status: 403 }
            );
        }

        const fileCount = files.length;

        if (fileCount > 0) {
            if (user.credits < 10) {
                return NextResponse.json(
                    { error: "Insufficient credits" },
                    { status: 403 }
                );
            } 
        }

        const deductCredits = fileCount > 0 ? 10 : 5;

        // Deduct 5 credit
        await db
            .update(usersTable)
            .set({ credits: user.credits - deductCredits })
            .where(eq(usersTable.id, user.id));

        // Get or create conversation based on chatId
        let conversation;

        if (chatId) {
            // Use existing conversation
            [conversation] = await db
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
                return NextResponse.json(
                    { error: "Conversation not found" },
                    { status: 404 }
                );
            }

            // Update conversation timestamp
            await db
                .update(conversationsTable)
                .set({ updatedAt: new Date() })
                .where(eq(conversationsTable.id, conversation.id));
        } else {
            // Create new conversation
            [conversation] = await db
                .insert(conversationsTable)
                .values({
                    userId: user.id,
                    title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
                })
                .returning();
        }

        // Store user message
        const [userMessage] = await db
            .insert(messagesTable)
            .values({
                conversationId: conversation.id,
                role: 'user',
                content: question,
                metadata: files.length > 0 ? { filesCount: files.length } : null,
            })
            .returning();

        // Process files to get their metadata
        const fileData = await Promise.all(
            files.map(async (file) => {
                if (file instanceof File) {
                    const arrayBuffer = await file.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    return {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: base64,
                    };
                }
                return null;
            })
        );

        const filteredFileData = fileData.filter(f => f !== null);

        // Persist uploaded files to uploads_table and add their ids to message metadata
        const uploadedFiles: any[] = [];
        if (filteredFileData.length > 0) {
            // import uploadsTable above
            const { uploadsTable } = await import('@/schema');
            for (const f of filteredFileData) {
                if (!f) continue;
                const [upload] = await db
                    .insert(uploadsTable)
                    .values({
                        userId: user.id,
                        conversationId: conversation.id,
                        fileName: f.name,
                        fileType: f.type || 'application/octet-stream',
                        fileSize: f.size,
                        fileUrl: '',
                        metadata: { base64: f.data },
                    })
                    .returning();

                // update fileUrl to the download route
                await db
                    .update(uploadsTable)
                    .set({ fileUrl: `/api/uploads/${upload.id}/download` })
                    .where(eq(uploadsTable.id, upload.id));

                uploadedFiles.push({ id: upload.id, fileName: f.name, fileUrl: `/api/uploads/${upload.id}/download` });
            }
        }

        // update user message metadata with uploads info
        if (uploadedFiles.length > 0) {
            await db
                .update(messagesTable)
                .set({ metadata: { uploads: uploadedFiles, previous: userMessage.metadata || null } })
                .where(eq(messagesTable.id, userMessage.id));
        }

        // Send an event to Inngest
        await inngest.send({
            name: "question/asked",
            data: {
                question,
                files: filteredFileData,
                userEmail: session.user.email,
                conversationId: conversation.id,
                messageId: userMessage.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Question received and being processed",
            conversationId: conversation.id,
            messageId: userMessage.id,
            uploads: uploadedFiles,
        });

    } catch (error) {
        console.error("Error in ask route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}