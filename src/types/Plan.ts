
export type PlanStatus = "draft" | "active" | "completed" | "archived";
export type PlanDifficulty = "easy" | "medium" | "hard";

export type Plan = {
    _id: string;
    _creationTime: number;
    userId: string;
    chatId?: string;
    title: string;
    description?: string;
    difficulty: PlanDifficulty;
    estimatedDuration?: number;
    status: PlanStatus;
    isForked: boolean;
    createdAt: number;
    updatedAt: number;
};

export type Todo = {
    _id: string;
    _creationTime: number;
    planId: string;
    title: string;
    description?: string;
    order: number;
    priority?: number;
    status: string;
    dueDate: number;
    completedAt?: number;
    estimatedTime?: number;
    resources?: string[];
    createdAt: number;
    updatedAt: number;
};

export type MessageRole = "user" | "assistant" | "system";

export type Chat = {
    _id: string;
    _creationTime: number;
    userId: string;
    title: string;
    createdAt: number;
    updatedAt: number;
};

export type Message = {
    _id: string;
    _creationTime: number;
    chatId: string;
    role: MessageRole;
    content: string;
    createdAt: number;
};