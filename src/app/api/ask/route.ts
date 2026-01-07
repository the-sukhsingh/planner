import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client"; // Import our client
import { auth } from "@/auth";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from '../../../../convex/_generated/dataModel';

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
        const user = await convex.query(api.users.getUserByEmail, { email: session.user.email });

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

        const deductCreditsAmount = fileCount > 0 ? 10 : 5;

        // Deduct credits
        await convex.mutation(api.users.deductCredits, {
            userId: user._id,
            amount: deductCreditsAmount,
        });

        // Get or create conversation based on chatId
        let conversation: { _id: Id<"chats">; title: string };

        if (chatId) {
            // Convert chatId string to Id<"chats">
            const chatIdTyped = chatId.toString() as Id<"chats">;
            
            // Get existing conversation
            const existingChat = await convex.query(api.chats.getChat, {
                userId: user._id,
                chatId: chatIdTyped,
            });

            if (!existingChat) {
                return NextResponse.json(
                    { error: "Conversation not found" },
                    { status: 404 }
                );
            }

            // Update conversation timestamp happens automatically in Convex
            conversation = { _id: existingChat._id, title: existingChat.title };
        } else {
            // Create new conversation (this also creates the first message)
            const newChatId = await convex.mutation(api.chats.createChat, {
                userId: user._id,
                message: question,
            });
            
            conversation = {
                _id: newChatId,
                title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
            };
        }

        // Store user message (only for existing conversations)
        let userMessageId: Id<"messages">;
        if (chatId) {
            userMessageId = await convex.mutation(api.messages.createMessage, {
                chatId: conversation._id,
                role: "user",
                content: question,
            });
        } else {
            // For new chats, get the message ID that was created with the chat
            const chatMessages = await convex.query(api.messages.listChatMessages, {
                userId: user._id,
                chatId: conversation._id,
            });
            userMessageId = chatMessages[0]._id;
        }

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

        // Note: File uploads are now handled in the Inngest function
        // We'll just track that files were attached
        const uploadedFiles: any[] = [];

        // Send an event to Inngest
        await inngest.send({
            name: "question/asked",
            data: {
                question,
                files: filteredFileData,
                userEmail: session.user.email,
                conversationId: conversation._id,
                messageId: userMessageId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Question received and being processed",
            conversationId: conversation._id,
            messageId: userMessageId,
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