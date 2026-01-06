'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';

// ========= Types =========
export interface Plan {
    id: number;
    userId: number;
    title: string;
    description: string | null;
    goal: string;
    difficulty: string | null;
    estimatedDuration: number | null;
    status: string;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Todo {
    id: number;
    planId: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    estimatedTime: number | null;
    resources?: string[] | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

interface PlanContextType {
    plans: Plan[];
    todos: Record<number, Todo[]>;
    todayTodos: Todo[];
    loading: boolean;
    error: string | null;
    fetchPlans: (refresh?: boolean) => Promise<void>;
    fetchTodos: (planId: number, refresh?: boolean) => Promise<void>;
    fetchTodosByDate: (date: Date | string) => Todo[];
    createPlan: (data: Partial<Plan>) => Promise<Plan | null>;
    updatePlan: (planId: number, data: Partial<Plan>) => Promise<Plan | null>;
    deletePlan: (planId: number) => Promise<boolean>;
    createTodo: (planId: number, data: Partial<Todo>) => Promise<Todo | null>;
    updateTodo: (todoId: number, data: Partial<Todo>) => Promise<Todo | null>;
    deleteTodo: (todoId: number) => Promise<boolean>;
    shiftPendingTodos: (days: number, planId?: number) => Promise<boolean>;
    getTodosForPlan: (planId: number) => Todo[];
    clearCache: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

// ========= Provider =========
export function PlanProvider({ children }: { children: React.ReactNode }) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [todos, setTodos] = useState<Record<number, Todo[]>>({});
    const [todayTodos, setTodayTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ========= Get Todos for Plan ID =========

    const getTodosForPlan = useCallback((planId: number): Todo[] => {
        return todos[planId] || [];
    }, [todos]);




    // ========= Derived Today-Todos =========
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const list: Todo[] = [];
        Object.values(todos).forEach(todoList => {
            todoList.forEach(todo => {
                if (!todo.dueDate) return;
                const d = new Date(todo.dueDate);
                d.setHours(0, 0, 0, 0);
                if (d.getTime() === today.getTime()) list.push(todo);
            });
        });
        setTodayTodos(list);
    }, [todos]);

    // ========= Fetch Plans =========
    const fetchPlans = useCallback(async (refresh = false) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/plans');
            if (!res.ok) throw new Error('Failed to fetch plans');

            const { plans: fetched = [] } = await res.json();
            setPlans(fetched);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    // ========= Fetch Todos =========
    const fetchTodos = useCallback(async (planId: number, refresh = false) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/todos?planId=${planId}`);
            if (!res.ok) throw new Error('Failed to fetch todos');

            const { todos: fetched = [] } = await res.json();
            setTodos(prev => ({ ...prev, [planId]: fetched }));
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    // ========= Fetch Todos by Date =========
    const fetchTodosByDate = useCallback((date: Date | string): Todo[] => {
        const targetDate = typeof date === 'string' ? new Date(date) : date;
        targetDate.setHours(0, 0, 0, 0);

        const filtered: Todo[] = [];
        Object.values(todos).forEach(todoList => {
            todoList.forEach(todo => {
                if (!todo.dueDate) return;
                const todoDate = new Date(todo.dueDate);
                todoDate.setHours(0, 0, 0, 0);
                if (todoDate.getTime() === targetDate.getTime()) {
                    filtered.push(todo);
                }
            });
        });

        return filtered;
    }, [todos]);

    // ========= CRUD =========
    const createPlan = async (data: Partial<Plan>) => {
        // Optimistic update: Create temporary plan with negative ID
        const tempId = -Date.now();
        const optimisticPlan: Plan = {
            id: tempId,
            userId: 0,
            title: data.title || '',
            description: data.description || null,
            goal: data.goal || '',
            difficulty: data.difficulty || 'intermediate',
            estimatedDuration: data.estimatedDuration || null,
            status: data.status || 'active',
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        setPlans(prev => [optimisticPlan, ...prev]);

        try {
            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create plan');

            const { plan } = await res.json();
            // Replace optimistic plan with real one
            setPlans(prev => prev.map(p => p.id === tempId ? plan : p));
            return plan;
        } catch (e) {
            // Rollback: Remove optimistic plan
            setPlans(prev => prev.filter(p => p.id !== tempId));
            setError((e as Error).message);
            return null;
        }
    };

    const updatePlan = async (planId: number, data: Partial<Plan>) => {
        // Optimistic update: Store previous state for rollback
        const previousPlan = plans.find(p => p.id === planId);
        if (!previousPlan) return null;
        
        const optimisticPlan = { ...previousPlan, ...data, updatedAt: new Date() };
        setPlans(prev => prev.map(p => (p.id === planId ? optimisticPlan : p)));

        try {
            const res = await fetch(`/api/plans/${planId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update plan');

            const { plan } = await res.json();
            setPlans(prev => prev.map(p => (p.id === planId ? plan : p)));
            return plan;
        } catch (e) {
            // Rollback: Restore previous plan
            setPlans(prev => prev.map(p => (p.id === planId ? previousPlan : p)));
            setError((e as Error).message);
            return null;
        }
    };

    const deletePlan = async (planId: number) => {
        // Optimistic delete: Store previous state for rollback
        const previousPlan = plans.find(p => p.id === planId);
        const previousTodos = todos[planId];
        
        setPlans(prev => prev.filter(p => p.id !== planId));
        setTodos(prev => {
            const clone = { ...prev };
            delete clone[planId];
            return clone;
        });

        try {
            const res = await fetch(`/api/plans/${planId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete plan');
            return true;
        } catch (e) {
            // Rollback: Restore plan and todos
            if (previousPlan) {
                setPlans(prev => [...prev, previousPlan]);
            }
            if (previousTodos) {
                setTodos(prev => ({ ...prev, [planId]: previousTodos }));
            }
            setError((e as Error).message);
            return false;
        }
    };

    const createTodo = async (planId: number, data: Partial<Todo>) => {
        // Optimistic update: Create temporary todo with negative ID
        const tempId = -Date.now();
        const optimisticTodo: Todo = {
            id: tempId,
            planId,
            title: data.title || '',
            description: data.description || null,
            status: data.status || 'pending',
            priority: data.priority || 'medium',
            dueDate: data.dueDate || null,
            estimatedTime: data.estimatedTime || null,
            order: data.order || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        
        setTodos(prev => ({
            ...prev,
            [planId]: [...(prev[planId] ?? []), optimisticTodo],
        }));

        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, planId }),
            });
            if (!res.ok) throw new Error('Failed to create todo');

            const { todo } = await res.json();
            // Replace optimistic todo with real one
            setTodos(prev => ({
                ...prev,
                [planId]: prev[planId].map(t => t.id === tempId ? todo : t),
            }));
            return todo;
        } catch (e) {
            // Rollback: Remove optimistic todo
            setTodos(prev => ({
                ...prev,
                [planId]: prev[planId].filter(t => t.id !== tempId),
            }));
            setError((e as Error).message);
            return null;
        }
    };

    const updateTodo = async (todoId: number, data: Partial<Todo>) => {
        // Optimistic update: Find and store previous state
        let previousTodo: Todo | undefined;
        let planId: number | undefined;
        
        for (const [pid, todoList] of Object.entries(todos)) {
            const found = todoList.find(t => t.id === todoId);
            if (found) {
                previousTodo = found;
                planId = parseInt(pid);
                break;
            }
        }
        
        if (!previousTodo || planId === undefined) return null;
        
        const optimisticTodo = { ...previousTodo, ...data, updatedAt: new Date() };
        setTodos(prev => ({
            ...prev,
            [planId]: prev[planId].map(t => (t.id === todoId ? optimisticTodo : t)),
        }));

        try {
            const res = await fetch(`/api/todos/${todoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update todo');

            const { todo } = await res.json();
            setTodos(prev => ({
                ...prev,
                [todo.planId]: prev[todo.planId].map(t => (t.id === todoId ? todo : t)),
            }));
            return todo;
        } catch (e) {
            // Rollback: Restore previous todo
            setTodos(prev => ({
                ...prev,
                [planId]: prev[planId].map(t => (t.id === todoId ? previousTodo : t)),
            }));
            setError((e as Error).message);
            return null;
        }
    };

    const deleteTodo = async (todoId: number) => {
        // Optimistic delete: Find and store previous state
        let previousTodo: Todo | undefined;
        let planId: number | undefined;
        
        for (const [pid, todoList] of Object.entries(todos)) {
            const found = todoList.find(t => t.id === todoId);
            if (found) {
                previousTodo = found;
                planId = parseInt(pid);
                break;
            }
        }
        
        setTodos(prev => {
            const clone = { ...prev };
            Object.keys(clone).forEach(pid => {
                clone[+pid] = clone[+pid].filter(t => t.id !== todoId);
            });
            return clone;
        });

        try {
            const res = await fetch(`/api/todos/${todoId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete todo');
            return true;
        } catch (e) {
            // Rollback: Restore todo
            if (previousTodo && planId !== undefined) {
                setTodos(prev => ({
                    ...prev,
                    [planId]: [...(prev[planId] ?? []), previousTodo],
                }));
            }
            setError((e as Error).message);
            return false;
        }
    };

    const shiftPendingTodos = async (days: number, planId?: number) => {
        // Find all pending todos with due dates
        const todosToShift: { todo: Todo; planId: number }[] = [];
        const previousTodos: Record<number, Todo[]> = {};
        
        if (planId !== undefined) {
            // Shift todos for specific plan
            const planTodos = todos[planId] || [];
            previousTodos[planId] = [...planTodos];
            planTodos.forEach(todo => {
                if (todo.status !== 'completed' && todo.dueDate) {
                    todosToShift.push({ todo, planId });
                }
            });
        } else {
            // Shift all pending todos across all plans
            Object.entries(todos).forEach(([pid, todoList]) => {
                const numPlanId = parseInt(pid);
                previousTodos[numPlanId] = [...todoList];
                todoList.forEach(todo => {
                    if (todo.status !== 'completed' && todo.dueDate) {
                        todosToShift.push({ todo, planId: numPlanId });
                    }
                });
            });
        }

        if (todosToShift.length === 0) {
            return true; // Nothing to shift
        }

        // Optimistic update: shift dates locally
        setTodos(prev => {
            const newTodos = { ...prev };
            todosToShift.forEach(({ todo, planId: pid }) => {
                newTodos[pid] = newTodos[pid].map(t => {
                    if (t.id === todo.id && t.dueDate) {
                        const newDate = new Date(t.dueDate);
                        newDate.setDate(newDate.getDate() + days);
                        return { ...t, dueDate: newDate, updatedAt: new Date() };
                    }
                    return t;
                });
            });
            return newTodos;
        });

        try {
            // Call bulk-shift endpoint
            const res = await fetch('/api/todos/shift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days, planId }),
            });

            if (!res.ok) throw new Error('Failed to shift todos');

            const { todos: updated = [] } = await res.json();

            // Merge updated todos into local state
            setTodos(prev => {
                const next = { ...prev };
                updated.forEach((t: any) => {
                    const pid = t.planId;
                    if (!next[pid]) return;
                    next[pid] = next[pid].map(existing => (existing.id === t.id ? { ...existing, ...t } : existing));
                });
                return next;
            });

            return true;
        } catch (e) {
            // Rollback: restore previous todos
            setTodos(previousTodos);
            setError((e as Error).message);
            return false;
        }
    };

    // ========= Clear Cache =========
    const clearCache = () => {
        // No-op: cache functionality removed
    };

    // ========= Initialize on Mount =========
    useEffect(() => {
        // Fetch fresh data on mount
        fetchPlans(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch todos for all plans when plans change
    useEffect(() => {
        if (plans.length > 0) {
            plans.forEach(plan => {
                // Check if we already have todos for this plan
                if (!todos[plan.id]) {
                    fetchTodos(plan.id);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plans]);

    const value = useMemo(
        () => ({
            plans,
            todos,
            todayTodos,
            loading,
            error,
            fetchPlans,
            fetchTodos,
            fetchTodosByDate,
            createPlan,
            updatePlan,
            deletePlan,
            createTodo,
            updateTodo,
            deleteTodo,
            shiftPendingTodos,
            getTodosForPlan,
            clearCache,
        }),
        [plans, todos, todayTodos, loading, error, fetchPlans, fetchTodos, fetchTodosByDate, createPlan, updatePlan, deletePlan, createTodo, updateTodo, deleteTodo, shiftPendingTodos, clearCache]
    );

    return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

// ========= Hook =========
export const usePlan = () => {
    const ctx = useContext(PlanContext);
    if (!ctx) throw new Error('usePlan must be used within PlanProvider');
    return ctx;
};
