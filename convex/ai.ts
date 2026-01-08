import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { GoogleGenAI, Type } from '@google/genai';

// Tool handlers for AI functions
const createToolHandlers = (ctx: any) => ({
    create_planner: async ({ userId, title, difficulty, estimatedDuration, startDate, steps }: any) => {
        try {
            const planId = await ctx.runMutation(api.ai_tools.createPlanWithSteps, {
                userId: userId as Id<"users">,
                title,
                description: `This planner is created to help the user achieve the goal: ${title}`,
                difficulty: (difficulty === 'beginner' ? 'easy' : (difficulty === 'advanced' ? 'hard' : 'medium')) as "easy" | "medium" | "hard",
                estimatedDuration: estimatedDuration || steps.length,
                startDate: startDate ? new Date(startDate).getTime() : Date.now(),
                steps: steps.map((s: any) => ({
                    ...s,
                    priority: (s.priority || 'medium') as "low" | "medium" | "high"
                }))
            });

            return { success: true, planId, message: `Created plan with ${steps.length} steps` };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },
    read_planners: async ({ userId, includeCompleted = false }: any) => {
        try {
            const planners = await ctx.runQuery(api.plans.listUserPlans, {
                userId: userId as Id<"users">
            });

            const filteredPlanners = includeCompleted
                ? planners
                : planners.filter((p: any) => p.status !== 'completed');

            return { success: true, planners: filteredPlanners };
        } catch (error) {
            return { success: false, error: 'Failed to read planners' };
        }
    },
    shift_planner_steps: async ({ plannerId, shiftBy }: any) => {
        try {
            await ctx.runMutation(api.ai_tools.shiftTodosOfPlan, {
                planId: plannerId as Id<"plans">,
                shiftBy
            });

            return { success: true, message: `Shifted steps by ${shiftBy} positions` };
        } catch (error) {
            return { success: false, error: 'Failed to shift planner steps' };
        }
    },
    edit_planner_steps: async ({ plannerId, steps }: any) => {
        try {
            await ctx.runMutation(api.ai_tools.editPlanSteps, {
                planId: plannerId as Id<"plans">,
                steps: steps.map((s: any) => ({
                    ...s,
                    priority: (s.priority || 'medium') as "low" | "medium" | "high"
                }))
            });

            return { success: true, message: `Updated planner with ${steps.length} steps` };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to edit planner steps' };
        }
    },
    append_steps_to_planner: async ({ plannerId, steps }: any) => {
        try {
            await ctx.runMutation(api.ai_tools.appendSteps, {
                planId: plannerId as Id<"plans">,
                steps: steps.map((s: any) => ({
                    ...s,
                    priority: (s.priority || 'medium') as "low" | "medium" | "high"
                }))
            });

            return { success: true, message: `Appended ${steps.length} steps to planner` };
        } catch (error: any) {
            return { success: false, error: error.message || 'Failed to append steps to planner' };
        }
    },
    get_today_tasks: async ({ userId }: any) => {
        try {
            const tasks = await ctx.runQuery(api.todos.getTodosBySpecificDate, {
                userId: userId as Id<"users">,
                specificDate: new Date().getTime()
            });

            return { success: true, tasks };
        } catch (error) {
            return { success: false, error: 'Failed to retrieve today\'s tasks' };
        }
    }
});

// Tool declarations for Gemini
const toolDeclarations = [
    {
        name: "create_planner",
        description: "Create a detailed planner with actionable steps.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                userId: {
                    type: Type.STRING,
                    description: 'ID of the user creating the planner.',
                },
                title: {
                    type: Type.STRING,
                    description: 'Title of the planner.',
                },
                difficulty: {
                    type: Type.STRING,
                    description: 'Difficulty level of the planner (e.g., "beginner", "intermediate", "advanced").',
                },
                steps: {
                    type: Type.ARRAY,
                    description: 'Array of steps in the planner.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: 'Title of the step.',
                            },
                            order: {
                                type: Type.NUMBER,
                                description: 'Order of the step in the planner.',
                            },
                            priority: {
                                type: Type.STRING,
                                description: 'Priority of the step (e.g., "low", "medium", "high").',
                            },
                            description: {
                                type: Type.STRING,
                                description: 'Detailed description of the step.',
                            },
                            resources: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'List of resources (links) for the step.',
                            },
                            estimatedTime: {
                                type: Type.NUMBER,
                                description: 'Estimated time in minutes to complete this step.',
                            }
                        }
                    }
                }
            },
            required: ['userId', 'title', 'steps'],
        },
    } as const,
    {
        name: "read_planners",
        description: "Reads existing planners from the database or storage system.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                userId: {
                    type: Type.STRING,
                    description: "The ID of the user whose planners are to be read",
                },
                includeCompleted: {
                    type: Type.BOOLEAN,
                    description: "Whether to include completed planners",
                },
            },
            required: ["userId"],
        },
    } as const,
    {
        name: "shift_planner_steps",
        description: "Shifts the order of planner steps based on user input or changes in priority.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                plannerId: {
                    type: Type.STRING,
                    description: "The ID of the planner to be modified",
                },
                shiftBy: {
                    type: Type.NUMBER,
                    description: "The number of positions to shift the steps by (positive or negative)",
                },
            },
            required: ["plannerId", "shiftBy"],
        },
    } as const,
    {
        name: "edit_planner_steps",
        description: "Edits the details of specific planner steps based on user input.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                plannerId: {
                    type: Type.STRING,
                    description: "The ID of the planner containing the step to be edited",
                },
                steps: {
                    type: Type.ARRAY,
                    description: "Array of steps to be edited",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: "Title of the planner step",
                            },
                            description: {
                                type: Type.STRING,
                                description: "Detailed description of the planner step",
                            },
                            order: {
                                type: Type.NUMBER,
                                description: "Order of the task in the planner",
                            },
                            priority: {
                                type: Type.STRING,
                                description: "Priority level of the task",
                            },
                            notes: {
                                type: Type.STRING,
                                description: 'Additional notes for the step.',
                            },
                            resources: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'List of resources (links, files) for the step.',
                            },
                            estimatedTime: {
                                type: Type.NUMBER,
                                description: 'Estimated time in minutes to complete this step.',
                            },
                        },
                    },
                },
            },
            required: ["plannerId", "steps"],
        },
    } as const,
    {
        name: "append_steps_to_planner",
        description: "Appends new steps to an existing planner.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                plannerId: {
                    type: Type.STRING,
                    description: "The ID of the planner to which steps will be appended",
                },
                steps: {
                    type: Type.ARRAY,
                    description: "Array of steps to be appended",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: "Title of the planner step",
                            },
                            description: {
                                type: Type.STRING,
                                description: "Detailed description of the planner step",
                            },
                            order: {
                                type: Type.NUMBER,
                                description: "Order of the task in the planner",
                            },
                            priority: {
                                type: Type.STRING,
                                description: "Priority level of the task",
                            },
                            notes: {
                                type: Type.STRING,
                                description: 'Additional notes for the step.',
                            },
                            resources: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: 'List of resources (links, files) for the step.',
                            },
                            estimatedTime: {
                                type: Type.NUMBER,
                                description: 'Estimated time in minutes to complete this step.',
                            },
                        },
                    },
                },
            },
            required: ["plannerId", "steps"],
        },
    } as const,
    {
        name: "get_today_tasks",
        description: "Retrieves the list of tasks scheduled for today from the user's planners.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                userId: {
                    type: Type.STRING,
                    description: "The ID of the user whose today's tasks are to be retrieved",
                },
            },
            required: ["userId"],
        },
    } as const,
];

export const generate = action({
    args: {
        question: v.string(),
        files: v.optional(v.array(v.object({
            name: v.string(),
            type: v.string(),
            size: v.number(),
            data: v.string(),
        }))),
        userEmail: v.string(),
        conversationId: v.id("chats"),
        messageId: v.id("messages")
    },
    returns: v.object({
        status: v.string(),
        message: v.optional(v.string()),
        output: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const { question, files, userEmail, conversationId, messageId } = args;

        try {
            // Get user ID
            const user = await ctx.runQuery(api.users.getUserByEmail, { email: userEmail });
            if (!user) {
                throw new Error(`User not found with email: ${userEmail}`);
            }
            const userId = user._id;

            // Save files to Convex Storage and get URLs
            const fileUrls: string[] = [];
            if (files && files.length > 0) {
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                
                for (const file of files) {
                    if (!file) continue;

                    // Filter: only allow PDF and images
                    if (!allowedTypes.includes(file.type)) {
                        console.log(`Skipping file ${file.name} - type ${file.type} not allowed`);
                        continue;
                    }

                    try {
                        // Convert base64 to blob
                        const buffer = Buffer.from(file.data, 'base64');
                        const blob = new Blob([buffer], { type: file.type });

                        // Generate upload URL from Convex
                        const uploadUrl = await ctx.runMutation(api.uploads.generateUploadUrl);

                        // Upload file to Convex storage
                        const result = await fetch(uploadUrl, {
                            method: "POST",
                            headers: { "Content-Type": file.type },
                            body: blob,
                        });

                        const { storageId } = await result.json();

                        // Create upload record in Convex
                        await ctx.runMutation(api.uploads.createUpload, {
                            userId,
                            chatId: conversationId,
                            fileName: file.name,
                            fileType: file.type,
                            fileSize: buffer.length,
                            storageId,
                        });

                        // Get file URL from Convex storage
                        const fileUrl = await ctx.runQuery(api.uploads.getFileUrl, {
                            storageId,
                        });

                        if (fileUrl) {
                            fileUrls.push(fileUrl);
                        }

                        console.log(`Successfully uploaded ${file.name} to Convex storage`);
                    } catch (error) {
                        console.error(`Error processing file ${file.name}:`, error);
                    }
                }
            }

            // Get conversation history
            const messages = await ctx.runQuery(api.messages.listChatMessages, {
                userId,
                chatId: conversationId
            });
            
            const history = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })).slice(-5); // last 5 messages

            // Generate AI content
            const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
            const TodayDate = new Date();

            const systemInstruction = `You are a helpful assistant that generates learning planners for users.

Tool Usage Guidelines:
    - Use create_planner to save plans to the database
    - Each step should have: title, description, order (day number), priority, estimatedTime, notes, resources
    - Order represents the day number (1 for Day 1, 2 for Day 2, etc.)
    - Multiple tasks per day should use the same order number
    - Include file URLs in the resources array if files were provided
    - Set difficulty based on content complexity (beginner/intermediate/advanced)
    - Provide realistic estimatedTime in minutes for each step
    - For large number of steps (more than 10), first create a planner with initial steps, then append more using append_steps_to_planner tool
    - Run multiple tool calls if needed to complete the planner
    - Dont send ids of plans, todos etc in the response until asked

    Example structure for a 10-day plan:
    - Step 1: order=1, title="Introduction",
    - Step 2: order=2, title="Core Concepts"
    - And so on...


You can use the following tools to answer the user's request:
    create_planner: Create a new learning planner with structured steps.
    read_file: Read and extract content from uploaded files.
    read_planners: Retrieve existing planners for reference.
    shift_planner_steps: Adjust the order of planner steps as needed.
    edit_planner_steps: Edit details of specific planner steps.
    append_steps_to_planner: Append new steps to an existing planner.
    get_today_tasks: Retrieve tasks scheduled for today.

Current Date: ${TodayDate}`;

            let prompt = `User query is- ${question}`;

            if (fileUrls.length > 0) {
                prompt += `\n\nThe user has uploaded ${fileUrls.length} file(s). You can reference these files in your planner steps as resources:\n`;
                fileUrls.forEach((url, index) => {
                    prompt += `File ${index + 1}: ${url}\n`;
                });
            }

            prompt += `\n\nThe user ID is: ${userId}. Use this where needed.`;

            // Initialize contents with history and current prompt
            const contents: any[] = [];

            // Map history to proper Gemini format
            if (history && history.length > 0) {
                history.forEach((entry) => {
                    contents.push({
                        role: entry.role === 'user' ? 'user' : 'model',
                        parts: [{ text: entry.content }]
                    });
                });
            }

            // Add current user prompt
            contents.push({
                role: 'user',
                parts: [{ text: prompt }]
            });

            const modelConfig = {
                model: "gemini-2.0-flash",
                config: {
                    tools: [{
                        functionDeclarations: toolDeclarations as any,
                    }],
                    systemInstruction: systemInstruction,
                    automaticFunctionCalling: { disable: false },
                }
            };

            // Generate content with tool calling loop
            const toolHandlers = createToolHandlers(ctx);
            let result = await genAI.models.generateContent({
                ...modelConfig,
                contents: contents
            });

            // Tool Loop: Handle multiple function calls until Gemini provides a text response
            let loopCount = 0;
            const MAX_LOOPS = 10;

            while (result.functionCalls && result.functionCalls.length > 0 && loopCount < MAX_LOOPS) {
                loopCount++;
                
                // Add the model's response (with function calls) to history
                const modelContent = result.candidates?.[0]?.content;
                if (!modelContent) break;
                contents.push(modelContent);

                const toolResponses = [];

                for (const call of result.functionCalls) {
                    if (!call.name) continue;
                    const handler = toolHandlers[call.name as keyof typeof toolHandlers];

                    const output = handler
                        ? await handler(call.args)
                        : { error: `Tool ${call.name} not found` };

                    toolResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: output
                        }
                    });
                }

                // Add tool responses to history
                contents.push({
                    role: 'function',
                    parts: toolResponses
                });

                // Send structured history back to the model
                result = await genAI.models.generateContent({
                    ...modelConfig,
                    contents: contents,
                });
            }

            // Extract token usage
            let inputTokens: number | null = null;
            let outputTokens: number | null = null;

            try {
                const rAny = result as any;
                const candidates = result?.candidates || [];
                const cAny = candidates[0] as any;
                
                if (rAny && rAny.metadata && rAny.metadata.tokenUsage) {
                    const meta = rAny.metadata.tokenUsage;
                    inputTokens = meta?.promptTokens ?? null;
                    outputTokens = meta?.completionTokens ?? null;
                } else if (cAny && cAny.metadata && cAny.metadata.tokenUsage) {
                    const meta = cAny.metadata.tokenUsage;
                    inputTokens = meta?.promptTokens ?? null;
                    outputTokens = meta?.completionTokens ?? null;
                }
            } catch (e) {
                // ignore parsing errors
                console.error("Error extracting token usage:", e);
            }

            // Fallback: estimate based on characters
            const fullPrompt = contents.map(c => (c.parts || []).map((p: any) => p.text).join('\n')).join('\n');
            const estimatedInput = Math.max(1, Math.ceil((fullPrompt.length || 0) / 4));
            const estimatedOutput = Math.max(1, Math.ceil(((result.text || "").length || 0) / 4));

            inputTokens = inputTokens || estimatedInput;
            outputTokens = outputTokens || estimatedOutput;

            // Store assistant response
            await ctx.runMutation(api.messages.createMessage, {
                chatId: conversationId,
                role: "assistant",
                content: String(result.text ?? "Planner Created Successfully."),
            });

            // Charge user credits
            try {
                const effectiveTokens = inputTokens + (4 * outputTokens);
                const creditsUsed = Math.min(8, Math.max(1, Math.ceil(effectiveTokens / 2000)));

                await ctx.runMutation(api.users.chargeCredits, {
                    userId,
                    amount: creditsUsed,
                    reason: 'chat',
                    metadata: {
                        inputTokens,
                        outputTokens,
                        effectiveTokens,
                        creditsUsed
                    }
                });
            } catch (err) {
                console.error('Failed to charge credits after successful chat:', err);
            }

            // Delete uploaded files from Convex storage after content generation
            if (files && files.length > 0) {
                const uploads = await ctx.runQuery(api.uploads.getChatUploads, {
                    chatId: conversationId,
                });

                for (const upload of uploads) {
                    try {
                        await ctx.runMutation(api.uploads.deleteUpload, {
                            uploadId: upload._id,
                        });
                        await ctx.runMutation(api.uploads.deleteFromStorage, {
                            storageId: upload.storageId,
                        });
                        console.log(`Deleted upload ${upload.fileName} from Convex storage`);
                    } catch (error) {
                        console.error(`Error deleting upload ${upload.fileName}:`, error);
                    }
                }

                console.log(`Cleaned up ${uploads.length} uploaded files`);
            }

            return {
                status: "success",
                message: "Planner created successfully",
                output: result.text
            };

        } catch (error: any) {
            console.error("Error in generate action:", error);
            
            // Store error message
            await ctx.runMutation(api.messages.createMessage, {
                chatId: conversationId,
                role: "assistant",
                content: `I encountered an error while creating your learning plan: ${String(error.message)}. Please try again.`,
            });

            return {
                status: "error",
                message: error.message
            };
        }
    }
})