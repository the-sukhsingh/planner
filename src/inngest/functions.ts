import { inngest } from "./client";
import generateContent from "./ai";
import { db } from "@/db";
import { usersTable, learningPlansTable, todosTable, messagesTable, conversationsTable, uploadsTable } from "@/schema";
import { eq, and, isNotNull, sql, asc } from "drizzle-orm";
import { gemini } from "inngest";
import { createClient } from '@supabase/supabase-js';

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
        const getUserId = await step.run("get-user-id", async () => {
            const [user] = await db
                .select({ id: usersTable.id })
                .from(usersTable)
                .where(eq(usersTable.email, userEmail))
                .limit(1);

            if (!user) {
                throw new Error(`User not found with email: ${userEmail}`);
            }
            return user.id;
        });


        // Save Files to Supabase Storage and get URLs
        const fileUrls = await step.run("save-files", async () => {
            if (!files || files.length === 0) return [];

            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

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
                    // Convert base64 to buffer
                    const buffer = Buffer.from(file.data, 'base64');

                    // Generate unique filename
                    const timestamp = Date.now();
                    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const fileName = `${getUserId}/${timestamp}-${sanitizedName}`;

                    // Upload to Supabase Storage
                    const { data, error } = await supabase.storage
                        .from('user-files')
                        .upload(fileName, buffer, {
                            contentType: file.type,
                            upsert: false
                        });

                    if (error) {
                        console.error(`Error uploading file ${file.name}:`, error);
                        continue;
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('user-files')
                        .getPublicUrl(fileName);

                    uploadedUrls.push(publicUrl);

                    // Store upload metadata in database
                    await db.insert(uploadsTable).values({
                        userId: getUserId,
                        conversationId,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: buffer.length,
                        fileUrl: publicUrl,
                        metadata: {
                            originalName: file.name,
                            sanitizedName,
                            uploadPath: fileName
                        }
                    });

                    console.log(`Successfully uploaded ${file.name} to ${publicUrl}`);
                } catch (error) {
                    console.error(`Error processing file ${file.name}:`, error);
                }
            }

            return uploadedUrls;
        });

        // const history = await step.run("get-conversation-history", async () => {
        //     const messages = await db
        //         .select()
        //         .from(messagesTable)
        //         .where(eq(messagesTable.conversationId, conversationId))
        //         .orderBy(asc(messagesTable.createdAt));
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

            await db.insert(messagesTable).values({
                conversationId,
                role: 'assistant',
                content: String(result.output),
                metadata: { planGenerated: true },
            });

            storeResult = {
                status: "success",
                message: "Planner created successfully",
                output: result.output
            };
        } else {
            const error = result && 'error' in result ? result.error : "Failed to generate planner";
            console.error("Failed to generate planner:", error);

            await db.insert(messagesTable).values({
                conversationId,
                role: 'assistant',
                content: `I encountered an error while creating your learning plan: ${String(error)}. Please try again.`,
                metadata: { error: true },
            });

            storeResult = {
                status: "error",
                message: error
            };
        }

        // Delete the uploaded files
        // Delete from the storage also
        const filesd = await db.select().from(uploadsTable).where(eq(uploadsTable.conversationId, conversationId));
        for (const file of filesd) {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );
            const { error } = await supabase.storage
            .from('user-files')
            .remove([file.fileName]);
            if (error) {
                console.error(`Error deleting file ${file.fileName} from storage:`, error);
            }
        }
        await db.delete(uploadsTable).where(eq(uploadsTable.conversationId, conversationId));

        return { status: "completed", storeResult };
    },
);

