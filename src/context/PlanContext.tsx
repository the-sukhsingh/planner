'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from './AuthContext';

// ========= Types =========
export interface Plan {
    _id: Id<"plans">;
    userId: Id<"users">;
    title: string;
    description?: string;
    difficulty: "easy" | "medium" | "hard";
    estimatedDuration?: number;
    status: "draft" | "active" | "completed" | "archived";
    isForked: boolean;
    createdAt: number;
    updatedAt: number;
    progress?: number;
}

export interface Todo {
    _id: Id<"todos">;
    planId: Id<"plans">;
    title: string;
    description?: string;
    status: string;
    priority?: "low" | "medium" | "high";
    dueDate: number;
    completedAt?: number;
    estimatedTime?: number;
    resources?: string[];
    order: number;
    createdAt: number;
    updatedAt: number;
}

interface PlanContextType {
    plans: Plan[];
    todos: Record<string, Todo[]>;
    todayTodos: Todo[];
    loading: boolean;
    error: string | null;
    createPlan: (data: any) => Promise<Id<"plans"> | null>;
    updatePlan: (planId: Id<"plans">, data: any) => Promise<void>;
    deletePlan: (planId: Id<"plans">) => Promise<void>;
    createTodo: (planId: Id<"plans">, data: any) => Promise<Id<"todos"> | null>;
    updateTodo: (todoId: Id<"todos">, data: any) => Promise<void>;
    deleteTodo: (todoId: Id<"todos">) => Promise<void>;
    getTodosForPlan: (planId: Id<"plans">) => Todo[];
    shiftPendingTodos: (days: number, planId?: Id<"plans">) => Promise<void>;
    fetchPlans: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

// ========= Provider =========
export function PlanProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    // Convex hooks
    const convexPlans = useQuery(api.plans.listUserPlans, user ? { userId: user._id } : "skip");
    const allUserTodos = useQuery(api.todos.listAllUserTodos, user ? { userId: user._id } : "skip");

    const createPlanMutation = useMutation(api.plans.createPlan);
    const updatePlanMutation = useMutation(api.plans.updatePlan);
    const deletePlanMutation = useMutation(api.plans.deletePlan);
    const createTodoMutation = useMutation(api.todos.createTodo);
    const updateTodoMutation = useMutation(api.todos.updateTodo);
    const deleteTodoMutation = useMutation(api.todos.deleteTodo);
    const shiftPendingTodosMutation = useMutation(api.todos.shiftPendingTodos);

    const todosByPlan = useMemo(() => {
        const mapping: Record<string, Todo[]> = {};
        if (!allUserTodos) return mapping;

        allUserTodos.forEach((todo: any) => {
            const pid = todo.planId.toString();
            if (!mapping[pid]) mapping[pid] = [];
            mapping[pid].push(todo as Todo);
        });

        // Sort each plan's todos by order
        Object.values(mapping).forEach(list => {
            list.sort((a, b) => a.order - b.order);
        });

        return mapping;
    }, [allUserTodos]);

    const plans = useMemo(() => {
        if (!convexPlans) return [];
        return convexPlans.map(p => {
            const planTodos = todosByPlan[p._id.toString()] || [];
            const total = planTodos.length;
            const completed = planTodos.filter(t => t.status === "completed").length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            return {
                ...p,
                progress
            } as Plan;
        });
    }, [convexPlans, todosByPlan]);

    const getTodosForPlan = useCallback((planId: Id<"plans">): Todo[] => {
        return todosByPlan[planId.toString()] || [];
    }, [todosByPlan]);

    const todayTodos = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const list: Todo[] = [];
        if (!allUserTodos) return list;

        allUserTodos.forEach((todo: any) => {
            const d = new Date(todo.dueDate);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() === today.getTime()) list.push(todo as Todo);
        });
        return list;
    }, [allUserTodos]);

    const createPlan = async (data: any) => {
        if (!user) return null;
        try {
            return await createPlanMutation({
                userId: user._id,
                title: data.title,
                description: data.description,
                difficulty: data.difficulty || "medium",
                estimatedDuration: data.estimatedDuration,
                status: data.status || "active",
            });
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const updatePlan = async (planId: Id<"plans">, data: any) => {
        if (!user) return;
        await updatePlanMutation({
            userId: user._id,
            planId,
            ...data
        });
    };

    const deletePlan = async (planId: Id<"plans">) => {
        if (!user) return;
        await deletePlanMutation({
            userId: user._id,
            planId
        });
    };

    const createTodo = async (planId: Id<"plans">, data: any) => {
        if (!user) return null;
        try {
            return await createTodoMutation({
                planId,
                title: data.title,
                description: data.description,
                order: data.order || 0,
                priority: data.priority,
                status: data.status || "pending",
                dueDate: data.dueDate ? new Date(data.dueDate).getTime() : Date.now(),
                estimatedTime: data.estimatedTime,
                resources: data.resources,
            });
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const updateTodo = async (todoId: Id<"todos">, data: any) => {
        if (!user) return;
        await updateTodoMutation({
            userId: user._id,
            todoId,
            ...data,
            dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined
        });
    };

    const deleteTodo = async (todoId: Id<"todos">) => {
        if (!user) return;
        await deleteTodoMutation({
            userId: user._id,
            todoId
        });
    };

    const shiftPendingTodos = async (days: number, planId?: Id<"plans">) => {
        if (!user) return;
        try {
            await shiftPendingTodosMutation({
                userId: user._id,
                days,
                planId
            });
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPlans = async () => {
        // Plans are automatically synced by Convex
    };

    const value = useMemo(
        () => ({
            plans,
            todos: todosByPlan,
            todayTodos,
            loading: convexPlans === undefined || allUserTodos === undefined,
            error: null,
            createPlan,
            updatePlan,
            deletePlan,
            createTodo,
            updateTodo,
            deleteTodo,
            getTodosForPlan,
            shiftPendingTodos,
            fetchPlans,
        }),
        [plans, todosByPlan, todayTodos, convexPlans, allUserTodos, user]
    );

    return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export const usePlan = () => {
    const ctx = useContext(PlanContext);
    if (!ctx) throw new Error('usePlan must be used within PlanProvider');
    return ctx;
};
