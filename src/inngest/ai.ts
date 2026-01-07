import { GoogleGenAI, Type } from '@google/genai';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type Step = {
    title: string;
    description?: string;
    order: number;
    priority?: string;
    estimatedTime?: number;
    notes?: string;
    resources?: string[];

}

// 1. Define the Tool Logic (Handled internally now)
const toolHandlers: Record<string, (args: any) => Promise<any>> = {
    create_planner: async ({ userId, title, difficulty, estimatedDuration, startDate, steps }) => {
        try {
            const planId = await convex.mutation(api.ai_tools.createPlanWithSteps, {
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
    read_file: async ({ fileName, fileData, fileType }) => {
        try {
            const buffer = Buffer.from(fileData, 'base64');

            if (fileType.startsWith('text/') || fileType === 'application/json') {
                return { success: true, content: buffer.toString('utf-8') };
            }

            if (fileType === 'application/pdf') {
                return { success: false, error: 'PDF parsing not implemented' };
            }

            if (fileType.startsWith('image/')) {
                return { success: false, error: 'Image parsing not implemented' };
            }

            return { success: false, error: `Unsupported file type: ${fileType}` };
        } catch (error) {
            return { success: false, error: 'Failed to read file' };
        }
    },
    read_planners: async ({ userId, includeCompleted = false }) => {
        try {
            const planners = await convex.query(api.plans.listUserPlans, {
                userId: userId as Id<"users">
            });

            const filteredPlanners = includeCompleted
                ? planners
                : planners.filter(p => p.status !== 'completed');

            return { success: true, planners: filteredPlanners };
        } catch (error) {
            return { success: false, error: 'Failed to read planners' };
        }
    },
    shift_planner_steps: async ({ plannerId, stepId, shiftBy }) => {
        try {
            await convex.mutation(api.ai_tools.shiftStepsByTodo, {
                planId: plannerId as Id<"plans">,
                todoId: stepId as Id<"todos">,
                shiftBy
            });

            return { success: true, message: `Shifted steps starting from ${stepId} by ${shiftBy} positions` };
        } catch (error) {
            return { success: false, error: 'Failed to shift planner steps' };
        }
    },
    edit_planner_steps: async ({ plannerId, steps }) => {
        try {
            await convex.mutation(api.ai_tools.editPlanSteps, {
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
    append_steps_to_planner: async ({ plannerId, steps }) => {
        try {
            await convex.mutation(api.ai_tools.appendSteps, {
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
    get_today_tasks: async ({ userId }) => {
        try {
            const tasks = await convex.query(api.ai_tools.getTodayTasks, {
                userId: userId as Id<"users">
            });

            return { success: true, tasks };
        } catch (error) {
            return { success: false, error: 'Failed to retrieve today\'s tasks' };
        }
    }
};



// Define the function declaration for the model
const createPlanner = {
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
                        }
                    }
                }
            }
        },
        required: ['userId', 'title', 'steps'],
    },
};

// Function to handle read_file tool
const readFileTool = {
    name: "read_file",
    description: "Reads the content of an uploaded file and returns its text content.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            fileName: {
                type: Type.STRING,
                description: "The name of the file to be read",
            },
            fileData: {
                type: Type.STRING,
                description: "The base64 encoded file data",
            },
            fileType: {
                type: Type.STRING,
                description: "The MIME type of the file",
            },
        },
        required: ["fileName", "fileData", "fileType"],
    },
};

// Function to handle read_planners tool
const readPlannersTool = {
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
};

// Function to handle shift_planner_steps tool
const shiftPlannerStepsTool = {
    name: "shift_planner_steps",
    description: "Shifts the order of planner steps based on user input or changes in priority.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            plannerId: {
                type: Type.STRING,
                description: "The ID of the planner to be modified",
            },
            stepId: {
                type: Type.STRING,
                description: "The ID of the step from which to start shifting",
            },
            shiftBy: {
                type: Type.NUMBER,
                description: "The number of positions to shift the steps by (positive or negative)",
            },
        },
        required: ["plannerId", "stepId", "shiftBy"],
    },
};

// Function to handle edit_planner_steps tool
const editPlannerStepsTool = {
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
};

// Function to handle append_steps_to_planner tool
const appendStepsToPlannerTool = {
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
};

// Function to handle get_today_tasks tool
const getTodayTasksTool = {
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
};

const generateContent = async ({ question, fileUrls, userId, history }: { question: string, fileUrls: string[], userId: string, history?: { role: string, content: string }[] }) => {
    const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
    const TodayDate = new Date().toISOString().split('T')[0];

    const systemInstruction = `You are a helpful assistant that generates learning planners for users.

Tool Usage Guidelines:
    - Use create_planner to save plans to the database
    - Each step should have: title, description, order (day number), priority, estimatedTime, notes, resources
    - Order represents the day number (1 for Day 1, 2 for Day 2, etc.)
    - Multiple tasks per day should use the same order number
    - Include file URLs in the resources array if files were provided
    - Set difficulty based on content complexity (beginner/intermediate/advanced)
    - Provide realistic estimatedTime in minutes for each step
    - For large number of steps (more than 30), first create a planner with initial steps, then append more using append_steps_to_planner tool
    - Run multiple tool calls if needed to complete the planner

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

    if (fileUrls && fileUrls.length > 0) {
        prompt += `\n\nThe user has uploaded ${fileUrls.length} file(s). You can reference these files in your planner steps as resources:\n`;
        fileUrls.forEach((url, index) => {
            prompt += `File ${index + 1}: ${url}\n`;
        });
    }

    prompt += `\n\nThe user ID is: ${userId}. Use this where needed.`;

    console.log("prompt", prompt)

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
        model: "gemini-2.0-flash-exp",
        config: {
            tools: [{
                functionDeclarations: [createPlanner, readFileTool, readPlannersTool, shiftPlannerStepsTool, editPlannerStepsTool, appendStepsToPlannerTool, getTodayTasksTool],
            }],
            systemInstruction: systemInstruction,
            automaticFunctionCalling: { disable: false },
        }
    };

    try {
        let result = await genAI.models.generateContent({
            ...modelConfig,
            contents: contents
        });


        // Tool Loop: Handle multiple function calls until Gemini provides a text response
        let loopCount = 0;
        const MAX_LOOPS = 10;

        while (result.functionCalls && result.functionCalls.length > 0 && loopCount < MAX_LOOPS) {
            loopCount++;
            // 1. Add the model's response (with function calls) to history
            const modelContent = result.candidates?.[0]?.content;
            if (!modelContent) break;
            contents.push(modelContent);

            const toolResponses = [];

            for (const call of result.functionCalls) {
                if (!call.name) continue;
                const handler = toolHandlers[call.name];
                console.log("Calling", handler.name, JSON.stringify(call.args, null, 2))
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

            // 2. Add tool responses to history
            // In the unified SDK, function response parts are added with role 'function' or 'tool'
            // For Gemini API compatibility, 'function' is common in many turn-based patterns.
            contents.push({
                role: 'function',
                parts: toolResponses
            });

            // 3. Send structured history back to the model
            result = await genAI.models.generateContent({
                ...modelConfig,
                contents: contents,
            });
        }


        return {
            success: true,
            output: result.text || "",
        };

    } catch (error: any) {
        console.error("Error in generateContent", error);
        return { success: false, error: error.message };
    }
};

export default generateContent;