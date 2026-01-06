"use client"
import React, { memo, useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils';
import { Todo, usePlan } from '@/context/PlanContext';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Link as LinkIcon, CheckCircle2, Circle } from 'lucide-react';

const PlanItem = memo(({ plan, planTitle, onToggle }: { plan: Todo; planTitle?: string; onToggle: (id: number) => void }) => {
    const handleClick = useCallback(() => onToggle(plan.id), [plan.id, onToggle]);

    const formatDate = (date: Date | null) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatTime = (minutes: number | null) => {
        if (!minutes) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const isCompleted = plan.status === 'completed';

    return (
        <div
            className={cn(
                'group flex items-start gap-3 p-3 border transition-all duration-200 cursor-pointer mb-2 rounded-lg',
                isCompleted ? 'opacity-60' : 'hover:shadow-sm'
            )}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <button
                className={cn(
                    "h-5 w-5 rounded flex items-center justify-center shrink-0 border-2 transition-all mt-0.5",
                    isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary"
                )}
            >
                {isCompleted && <CheckCircle2 className="h-3 w-3" />}
            </button>

            <div className='flex-1 flex flex-col gap-1 min-w-0'>
                <div className='flex items-start justify-between gap-2'>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        {planTitle && (
                            <span className="text-xs text-muted-foreground leading-none">
                                {planTitle}
                            </span>
                        )}
                        <span className={cn(
                            'text-sm font-medium leading-snug',
                            isCompleted && 'line-through text-muted-foreground'
                        )}>
                            {plan.title}
                        </span>
                    </div>
                </div>

                {plan.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {plan.description}
                    </p>
                )}

                <div className='flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground'>
                    {plan.priority && plan.priority !== 'low' && (
                        <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            plan.priority === 'high'
                                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                        )}>{plan.priority}</span>
                    )}
                    {plan.dueDate && (
                        <span className='flex items-center gap-1'>
                            <CalendarIcon className='h-3 w-3' />
                            {formatDate(plan.dueDate)}
                        </span>
                    )}
                    {plan.estimatedTime && (
                        <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {formatTime(plan.estimatedTime)}
                        </span>
                    )}
                </div>

                {plan.resources && plan.resources.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                        {plan.resources.map((res, index) => {
                            let hostname = '';
                            try {
                                hostname = new URL(res).hostname.replace('www.', '');
                            } catch (e) {
                                hostname = res.slice(0, 15);
                            }
                            return (
                                <Link
                                    key={index}
                                    href={res}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <LinkIcon className="h-3 w-3" />
                                    {hostname}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});

PlanItem.displayName = 'PlanItem';

const List = () => {
    const { fetchTodosByDate, updateTodo, plans } = usePlan();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const todos = useMemo(() => {
        return fetchTodosByDate(selectedDate);
    }, [fetchTodosByDate, selectedDate]);

    const getPlanTitle = useCallback((planId: number) => {
        return plans.find(p => p.id === planId)?.title;
    }, [plans]);

    const handleToggle = (id: number) => {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
            updateTodo(id, { status: newStatus });
        }
    }

    const handlePreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const handleNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            setIsCalendarOpen(false);
        }
    };

    const formatDisplayDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const { activePlans, completedPlans } = useMemo(() => ({
        activePlans: todos.filter(todo => todo.status !== 'completed'),
        completedPlans: todos.filter(todo => todo.status === 'completed')
    }), [todos]);

    const progress = todos.length > 0 ? (completedPlans.length / todos.length) * 100 : 0;

    return (
        <div className='w-full h-full flex flex-col bg-background'>
            {/* Header */}
            <div className='p-4 flex flex-col gap-4 border-b'>
                <div className='flex items-center justify-between'>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePreviousDay}
                            className='h-8 w-8'
                        >
                            <ChevronLeft className='h-4 w-4' />
                        </Button>

                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className='px-3 h-8 text-sm font-medium'
                                >
                                    {formatDisplayDate(selectedDate)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='center'>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    autoFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNextDay}
                            className='h-8 w-8'
                        >
                            <ChevronRight className='h-4 w-4' />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">Today's Progress</div>
                        <div className="text-sm text-muted-foreground">{Math.round(progress)}%</div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* List Body */}
            <div className='flex-1 overflow-y-auto p-4'>
                {activePlans.length > 0 && (
                    <div className="mb-6">
                        <div className='text-xs font-medium text-muted-foreground mb-3'>Active Tasks</div>
                        {activePlans.map(todo => (
                            <PlanItem
                                key={todo.id}
                                plan={todo}
                                planTitle={getPlanTitle(todo.planId)}
                                onToggle={handleToggle}
                            />
                        ))}
                    </div>
                )}

                {completedPlans.length > 0 && (
                    <div>
                        <div className='text-xs font-medium text-muted-foreground mb-3'>Completed</div>
                        {completedPlans.map(todo => (
                            <PlanItem
                                key={todo.id}
                                plan={todo}
                                planTitle={getPlanTitle(todo.planId)}
                                onToggle={handleToggle}
                            />
                        ))}
                    </div>
                )}

                {todos.length === 0 && (
                    <div className='flex flex-col items-center justify-center py-16 text-center'>
                        <Circle className="h-12 w-12 text-muted-foreground/20 mb-3" />
                        <h3 className="text-sm font-medium mb-1">No tasks</h3>
                        <p className='text-xs text-muted-foreground max-w-[200px]'>
                            No tasks scheduled for this day.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
};

export default List
