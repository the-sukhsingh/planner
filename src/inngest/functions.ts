import { inngest } from "./client";
import generateContent from "./ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { message: `Hello ${event.data.email}!` };
    },
);

export const ask = inngest.createFunction(
    { id: "ask" },
    { event: "question/asked" },
    async ({ event, step }) => {
        const { question, files, userEmail, conversationId, messageId } = event.data;
        console.log("Got", question, files, userEmail, conversationId);
        const getUserId = await step.run("get-user-id", async () => {
            const user = await convex.query(api.users.getUserByEmail, { email: userEmail });

            if (!user) {
                throw new Error(`User not found with email: ${userEmail}`);
            }
            return user._id;
        });


        // Save Files to Convex Storage and get URLs
        const fileUrls = await step.run("save-files", async () => {
            if (!files || files.length === 0) return [];

            const uploadedUrls: string[] = [];

            for (const file of files) {
                if (!file) continue;

                // Filter: only allow PDF and images
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    console.log(`Skipping file ${file.name} - type ${file.type} not allowed`);
                    continue;
                }

                try {
                    // Convert base64 to blob
                    const buffer = Buffer.from(file.data, 'base64');
                    const blob = new Blob([buffer], { type: file.type });

                    // Generate upload URL from Convex
                    const uploadUrl = await convex.mutation(api.uploads.generateUploadUrl);

                    // Upload file to Convex storage
                    const result = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: blob,
                    });

                    const { storageId } = await result.json();

                    // Create upload record in Convex
                    await convex.mutation(api.uploads.createUpload, {
                        userId: getUserId as Id<"users">,
                        chatId: conversationId as Id<"chats">,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: buffer.length,
                        storageId,
                    });

                    // Get file URL from Convex storage
                    const fileUrl = await convex.query(api.uploads.getFileUrl, {
                        storageId,
                    });

                    if (fileUrl) {
                        uploadedUrls.push(fileUrl);
                    }

                    console.log(`Successfully uploaded ${file.name} to Convex storage`);
                } catch (error) {
                    console.error(`Error processing file ${file.name}:`, error);
                }
            }

            return uploadedUrls;
        });

        // Get conversation history
        // const history = await step.run("get-conversation-history", async () => {
        //     const chatIdTyped = conversationId as Id<"chats">;
        //     const userIdTyped = getUserId as Id<"users">;
            
        //     const messages = await convex.query(api.messages.listChatMessages, {
        //         userId: userIdTyped,
        //         chatId: chatIdTyped
        //     });
            
        //     return messages.map(msg => ({
        //         role: msg.role,
        //         content: msg.content
        //     }));
        // });


        const result = await step.ai.wrap('generate-content', async () => {
            return await generateContent({
                question,
                fileUrls,
                userId: getUserId.toString(),
                // history
            })
        })
        // Store response in database
        let storeResult;
        if (result && result.success && 'output' in result) {
            console.log("Successfully generated planner:", result.output);

            const chatIdTyped = conversationId as Id<"chats">;
            await convex.mutation(api.messages.createMessage, {
                chatId: chatIdTyped,
                role: "assistant",
                content: String(result.output),
            });

            storeResult = {
                status: "success",
                message: "Planner created successfully",
                output: result.output
            };
        } else {
            const error = result && 'error' in result ? result.error : "Failed to generate planner";
            console.error("Failed to generate planner:", error);

            const chatIdTyped = conversationId as Id<"chats">;
            await convex.mutation(api.messages.createMessage, {
                chatId: chatIdTyped,
                role: "assistant",
                content: `I encountered an error while creating your learning plan: ${String(error)}. Please try again.`,
            });

            storeResult = {
                status: "error",
                message: error
            };
        }

        // Delete the uploaded files from Convex storage after content generation
        await step.run("cleanup-files", async () => {
            if (!files || files.length === 0) return;

            const chatIdTyped = conversationId as Id<"chats">;
            
            // Get all uploads for this chat
            const uploads = await convex.query(api.uploads.getChatUploads, {
                chatId: chatIdTyped,
            });

            // Delete each upload
            for (const upload of uploads) {
                try {
                    await convex.mutation(api.uploads.deleteUpload, {
                        uploadId: upload._id,
                    });
                    console.log(`Deleted upload: ${upload.fileName}`);
                } catch (error) {
                    console.error(`Error deleting upload ${upload.fileName}:`, error);
                }
            }

            console.log(`Cleaned up ${uploads.length} uploaded files`);
        });

        return { status: "completed", storeResult };
    },
);

