import { createTool, createAgent, gemini } from "@inngest/agent-kit"
import { z } from "zod";
import { db } from "@/db";
import { learningPlansTable, todosTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import {GoogleGenerativeAI} from "@google/generative-ai"

const createPlanner = createTool({
    name: 'create_planner',
    description:
        "Create a detailed planner based on the user's question and any provided files. The planner should consist of actionable steps that the user can follow to address their question effectively.",
    parameters: z.object({
        userId: z.string().describe("User ID who owns this planner"),
        title: z.string().describe("Title of the learning plan"),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate').describe("Difficulty level"),
        estimatedDuration: z.number().optional().describe("Estimated duration in days"),
        startDate: z.string().optional().describe("Start date of the planner in ISO format"),
        steps: z.array(
            z.object({
                title: z.string().describe("Title of the planner step"),
                description: z.string().optional().describe("Detailed description of the planner step"),
                order: z.number().default(0).describe("Order of the task in the planner"),
                priority: z.enum(['low', 'medium', 'high']).default('medium').describe("Priority level of the task"),
                estimatedTime: z.number().optional().describe("Estimated time to complete in minutes"),
                notes: z.string().optional().describe("Additional notes about the task"),
                resources: z.array(z.string()).optional().describe("Links, references, and other resources"),
                question: z.string().optional().describe("Question to be answered to check for accuracy"),
            })
        ),
    }),
    handler: async ({ userId, title, difficulty, estimatedDuration, startDate, steps }) => {
        try {
            // Create the learning plan
            const [plan] = await db.insert(learningPlansTable).values({
                userId: parseInt(userId),
                title,
                goal: `Generate a learning plan to ${title}`,
                description: `This planner is created to help the user achieve the goal: ${title}`,
                difficulty,
                estimatedDuration,
                status: 'active',
                progress: 0,
            }).returning();


            // Create todos for each step
            if (steps && steps.length > 0) {
                const planStartDate = startDate ? new Date(startDate) : new Date();

                // Group steps by order to handle same-day tasks
                const orderToDayMap = new Map<number, number>();
                let currentDay = 0;
                let lastOrder = -1;

                // Sort steps by order first
                const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

                await db.insert(todosTable).values(
                    sortedSteps.map(step => {
                        // If order changed, increment day counter
                        if (step.order !== lastOrder) {
                            if (lastOrder !== -1) {
                                currentDay++;
                            }
                            lastOrder = step.order;
                            orderToDayMap.set(step.order, currentDay);
                        }

                        const dueDate = new Date(planStartDate);
                        dueDate.setDate(dueDate.getDate() + orderToDayMap.get(step.order)! + 1);

                        return {
                            planId: plan.id,
                            title: step.title,
                            description: step.description || '',
                            order: step.order,
                            priority: step.priority,
                            estimatedTime: step.estimatedTime,
                            notes: step.notes || '',
                            resources: step.resources || [],
                            question: step.question || '',
                            answer: '',
                            status: 'pending',
                            dueDate: dueDate,
                        };
                    })
                );
            }

            return {
                success: true,
                planId: plan.id,
                message: `Successfully created planner "${title}" with ${steps.length} steps`,
            };
        } catch (error) {
            console.error('Error creating planner:', error);
            return {
                success: false,
                error: 'Failed to create planner',
            };
        }
    },
});



const readFileTool = createTool({
    name: 'read_file',
    description: 'Reads the content of an uploaded file and returns its text content.',
    parameters: z.object({
        fileName: z.string().describe('The name of the file to be read'),
        fileData: z.string().describe('The base64 encoded file data'),
        fileType: z.string().describe('The MIME type of the file'),
    }),
    handler: async ({ fileName, fileData, fileType }) => {
        try {
            // Decode base64 data
            const buffer = Buffer.from(fileData, 'base64');

            // Handle text files
            if (fileType.startsWith('text/') || fileType === 'application/json') {
                const content = buffer.toString('utf-8');
                return {
                    success: true,
                    fileName,
                    content,
                    type: 'text',
                };
            }

            // For PDF files, return metadata (would need pdf-parse library for full parsing)
            if (fileType === 'application/pdf') {
                return {
                    success: true,
                    fileName,
                    message: 'PDF file detected. Content extraction requires pdf-parse library.',
                    type: 'pdf',
                    size: buffer.length,
                };
            }

            // For images, return metadata
            if (fileType.startsWith('image/')) {
                return {
                    success: true,
                    fileName,
                    message: 'Image file detected.',
                    type: 'image',
                    mimeType: fileType,
                    size: buffer.length,
                };
            }

            return {
                success: false,
                error: `Unsupported file type: ${fileType}`,
            };
        } catch (error) {
            console.error('Error reading file:', error);
            return {
                success: false,
                error: 'Failed to read file',
            };
        }
    },
});


const readPlanners = createTool({
    name: 'read_planners',
    description: 'Reads existing planners from the database or storage system.',
    parameters: z.object({
        userId: z.string().describe('The ID of the user whose planners are to be read'),
        includeCompleted: z.boolean().optional().default(false).describe('Whether to include completed planners'),
    }),
    handler: async ({ userId, includeCompleted }) => {
        try {
            let query = db
                .select({
                    id: learningPlansTable.id,
                    title: learningPlansTable.title,
                    description: learningPlansTable.description,
                    goal: learningPlansTable.goal,
                    difficulty: learningPlansTable.difficulty,
                    estimatedDuration: learningPlansTable.estimatedDuration,
                    status: learningPlansTable.status,
                    progress: learningPlansTable.progress,
                    createdAt: learningPlansTable.createdAt,
                })
                .from(learningPlansTable)
                .where(eq(learningPlansTable.userId, parseInt(userId)));

            const planners = await query;

            if (planners.length === 0) {
                return {
                    success: true,
                    count: 0,
                    planners: [],
                    message: 'No planners found for this user',
                };
            }

            // Filter out completed ones if needed
            const filteredPlanners = includeCompleted
                ? planners
                : planners.filter(p => p.status !== 'completed');


            return {
                success: true,
                count: filteredPlanners.length,
                planners: filteredPlanners,
            };
        } catch (error) {
            console.error('Error reading planners:', error);
            return {
                success: false,
                error: 'Failed to read planners',
            };
        }
    },
});

const shiftPlannerSteps = createTool({
    name: 'shift_planner_steps',
    description: 'Shifts the order of planner steps based on user input or changes in priority. By Default shifts all the pending steps to down the list.',
    parameters: z.object({
        plannerId: z.string().describe('The ID of the planner to be modified'),
        stepId: z.string().describe('The ID of the step from which to start shifting'),
        shiftBy: z.number().describe('The number of positions to shift the steps by (positive or negative)'),
    }),
    handler: async ({ plannerId, stepId, shiftBy }) => {
        try {
            // Get all todos for this planner
            const todos = await db
                .select()
                .from(todosTable)
                .where(eq(todosTable.planId, parseInt(plannerId)))
                .orderBy(todosTable.order);

            // Find the step to start shifting from
            const startIndex = todos.findIndex(t => t.id === parseInt(stepId));
            if (startIndex === -1) {
                return {
                    success: false,
                    error: 'Step not found',
                };
            }

            // Update orders for all steps from startIndex onwards
            const updates = todos.slice(startIndex).map(todo => ({
                id: todo.id,
                newOrder: todo.order + shiftBy,
            }));

            // Execute updates
            for (const update of updates) {
                await db
                    .update(todosTable)
                    .set({ order: update.newOrder })
                    .where(eq(todosTable.id, update.id));
            }

            return {
                success: true,
                message: `Shifted ${updates.length} steps by ${shiftBy} positions`,
                updatedCount: updates.length,
            };
        } catch (error) {
            console.error('Error shifting planner steps:', error);
            return {
                success: false,
                error: 'Failed to shift planner steps',
            };
        }
    },
});

const editPlannerSteps = createTool({
    name: 'edit_planner_steps',
    description: 'Edits the details of specific planner steps based on user input.',
    parameters: z.object({
        plannerId: z.string().describe('The ID of the planner containing the step to be edited'),
        steps: z.array(
            z.object({
                title: z.string().describe("Title of the planner step"),
                description: z.string().optional().describe("Detailed description of the planner step"),
                order: z.number().default(0).describe("Order of the task in the planner"),
                priority: z.enum(['low', 'medium', 'high']).default('medium').describe("Priority level of the task"),
                estimatedTime: z.number().optional().describe("Estimated time to complete in minutes"),
                notes: z.string().optional().describe("Additional notes about the task"),
                resources: z.array(z.string()).optional().describe("Links, references, and other resources"),
            })
        ),
    }),
    handler: async ({ plannerId, steps }) => {
        try {
            // First, delete all existing pending steps of the planner
            await db
                .delete(todosTable)
                .where(
                    and(
                        eq(todosTable.planId, parseInt(plannerId)),
                        eq(todosTable.status, 'pending')
                    )
                );

            // Then add the new steps
            if (steps && steps.length > 0) {
                await db.insert(todosTable).values(
                    steps.map(step => ({
                        planId: parseInt(plannerId),
                        title: step.title,
                        description: step.description || '',
                        order: step.order,
                        priority: step.priority,
                        estimatedTime: step.estimatedTime,
                        notes: step.notes || '',
                        resources: step.resources || [],
                        status: 'pending',
                    }))
                );
            }

            return {
                success: true,
                message: `Successfully updated planner with ${steps.length} new steps`,
                stepCount: steps.length,
            };
        } catch (error) {
            console.error('Error editing planner steps:', error);
            return {
                success: false,
                error: 'Failed to edit planner steps',
            };
        }
    },
});

const appendStepsToPlanner = createTool({
    name: 'append_steps_to_planner',
    description: 'Appends new steps to an existing planner.',
    parameters: z.object({
        plannerId: z.string().describe('The ID of the planner to which steps will be appended'),
        steps: z.array(
            z.object({
                title: z.string().describe("Title of the planner step"),
                description: z.string().optional().describe("Detailed description of the planner step"),
                order: z.number().default(0).describe("Order of the task in the planner"),
                priority: z.enum(['low', 'medium', 'high']).default('medium').describe("Priority level of the task"),
                estimatedTime: z.number().optional().describe("Estimated time to complete in minutes"),
                notes: z.string().optional().describe("Additional notes about the task"),
                resources: z.array(z.string()).optional().describe("Links, references, and other resources"),
            })
        ),
    }),
    handler: async ({ plannerId, steps }) => {
        try {
            // Append new steps to the planner
            if (steps && steps.length > 0) {
                // Get the plan to access its start date
                const [plan] = await db
                    .select()
                    .from(learningPlansTable)
                    .where(eq(learningPlansTable.id, parseInt(plannerId)))
                    .limit(1);

                const planStartDate = plan?.createdAt ? new Date(plan.createdAt) : new Date();

                // Group steps by order to handle same-day tasks
                const orderToDayMap = new Map<number, number>();
                let currentDay = 0;
                let lastOrder = -1;

                // Sort steps by order first
                const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

                await db.insert(todosTable).values(
                    sortedSteps.map(step => {
                        // If order changed, increment day counter
                        if (step.order !== lastOrder) {
                            if (lastOrder !== -1) {
                                currentDay++;
                            }
                            lastOrder = step.order;
                            orderToDayMap.set(step.order, currentDay);
                        }

                        const dueDate = new Date(planStartDate);
                        dueDate.setDate(dueDate.getDate() + orderToDayMap.get(step.order)! + 1);

                        return {
                            planId: parseInt(plannerId),
                            title: step.title,
                            description: step.description || '',
                            order: step.order,
                            priority: step.priority,
                            estimatedTime: step.estimatedTime,
                            notes: step.notes || '',
                            resources: step.resources || [],
                            status: 'pending',
                            dueDate: dueDate,
                        };
                    })
                );
            }
            return {
                success: true,
                message: `Successfully appended ${steps.length} steps to planner`,
                stepCount: steps.length,
            };
        } catch (error) {
            console.error('Error appending steps to planner:', error);
            return {
                success: false,
                error: 'Failed to append steps to planner',
            };
        }
    },
});


const getTodayTasks = createTool({
    name: 'get_today_tasks',
    description: 'Retrieves the list of tasks scheduled for today from the user\'s planners.',
    parameters: z.object({
        userId: z.string().describe('The ID of the user whose today\'s tasks are to be retrieved'),
    }),
    handler: async ({ userId }) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get all active planners for the user
            const plans = await db
            .select({ id: learningPlansTable.id })
            .from(learningPlansTable)
            .where(
                and(
                eq(learningPlansTable.userId, parseInt(userId)),
                eq(learningPlansTable.status, 'active')
                )
            );

            if (plans.length === 0) {
            return {
                success: true,
                tasks: [],
                message: 'No active planners found',
            };
            }

            // Fetch tasks for all active plans (collect pending tasks per plan and flatten)
            const tasksPerPlan = await Promise.all(plans.map(plan =>
                db
                    .select({
                        id: todosTable.id,
                        planId: todosTable.planId,
                        title: todosTable.title,
                        description: todosTable.description,
                        priority: todosTable.priority,
                        status: todosTable.status,
                        estimatedTime: todosTable.estimatedTime,
                        order: todosTable.order,
                        dueDate: todosTable.dueDate,
                    })
                    .from(todosTable)
                    .where(
                        and(
                            eq(todosTable.planId, plan.id),
                            eq(todosTable.status, 'pending') // keep existing behavior; in_progress will be included in JS filtering
                        )
                    )
                    .orderBy(todosTable.order)
            ));

            const tasksRaw = tasksPerPlan.flat();

            // Filter to only tasks whose dueDate is today (local date) and include in_progress if present
            const todayTasks = (tasksRaw || [])
            .filter(t => {
                if (!t.dueDate) return false;
                const d = new Date(t.dueDate);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime() && (t.status === 'pending' || t.status === 'in_progress');
            })
            .slice(0, 5); // limit to top 5

            return {
            success: true,
            count: todayTasks.length,
            tasks: todayTasks,
            };
        } catch (error) {
            console.error('Error getting today tasks:', error);
            return {
            success: false,
            error: 'Failed to get today tasks',
            };
        }
    },
});



const generateContent = async ({
    question,
    fileUrls,
    userId
}: {
    question: string,
    fileUrls: string[],
    userId: string
}) => {
    try {
        const TodayDate = new Date().toISOString().split('T')[0];
        let recur = 0;
        const supportAgent = createAgent({
            model: gemini({
                model: "gemini-2.0-flash-exp",
                apiKey: process.env.GOOGLE_API_KEY || "",
            }),
            name: `AI Generator`,
            system: `You are a helpful assistant that generates learning planners for users.

Tool Usage Guidelines:
    - Use create_planner to save plans to the database
    - Each step should have: title, description, order (day number), priority, estimatedTime
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

Current Date: ${TodayDate}`,
            tools: [createPlanner, readFileTool, readPlanners, shiftPlannerSteps, editPlannerSteps, appendStepsToPlanner, getTodayTasks],
        });

        let prompt = `User query is- ${question}`;

        if (fileUrls && fileUrls.length > 0) {
            prompt += `\\n\\n The user has uploaded ${fileUrls.length} file(s). You can reference these files in your planner steps as resources:\\n`;
            fileUrls.forEach((url, index) => {
                prompt += `File ${index + 1}: ${url}\\n`;
            });
        }

        prompt += `\\n\\nThe user ID is: ${userId}. Use this where needed.`;

        let response = await supportAgent.run(prompt);

        const toolsByName: Record<string, any> = {
            create_planner: createPlanner,
            read_file: readFileTool,
            read_planners: readPlanners,
            shift_planner_steps: shiftPlannerSteps,
            edit_planner_steps: editPlannerSteps,
            append_steps_to_planner: appendStepsToPlanner,
            get_today_tasks: getTodayTasks,
        };

        // // Continue running the agent until it signals 'stop'
        while (response.output && response.output[0] && response.output[0].type === 'tool_call') {
            const out = response.output[0];
            recur += 1;
            // Ensure this is a tool message (some message types don't have 'tools')
            if (out.stop_reason === 'tool' && 'tools' in out && Array.isArray((out as any).tools)) {
                for (const toolCall of (out as any).tools) {
                    const tool = toolsByName[toolCall.name];
                    if (!tool) {
                        console.warn(`Unknown tool requested: ${toolCall.name}`);
                        continue;
                    }

                    let toolResult;
                    try {
                        toolResult = await tool.handler(toolCall.input);
                    } catch (err) {
                        toolResult = { success: false, error: err instanceof Error ? err.message : String(err) };
                    }



                    // Feed the tool result back into the agent to continue the conversation
                    const toolResponsePrompt = `Tool ${toolCall.name} (id: ${toolCall.id}) returned:\n${JSON.stringify(toolResult)}\n\nPlease continue.`;
                    response = await supportAgent.run(toolResponsePrompt);
                }
            } else {
                // Unhandled stop_reason; break to avoid infinite loop
                console.warn("Unhandled stop_reason:", JSON.stringify(out));
                break;
            }
        }

        return {
            success: true,
            output: response.output,
        };

    } catch (error) {
        console.error("Error in generateContent", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }

}

export default generateContent;