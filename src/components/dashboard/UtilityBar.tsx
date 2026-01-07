"use client"
import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Play, Square, Timer, ChevronDown } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Id } from '../../../convex/_generated/dataModel'

export default function UtilityBar() {
  const { user } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<Id<"plans">>()
  const [selectedTodo, setSelectedTodo] = useState<Id<"todos">>()
  const [showOptions, setShowOptions] = useState(false)

  const activeSession = useQuery(api.learningSessions.getActiveSession, 
    user ? { userId: user._id } : "skip"
  )

  const todaysSessions = useQuery(api.learningSessions.getSessionsInRange, 
    user ? { 
      userId: user._id,
        startDate: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)).getTime(),
    } : "skip"
  );

  const totalTimeToday = todaysSessions?.reduce((acc, session) => acc + (session.endedAt ? session.endedAt - session.startedAt : 0), 0) ?? 0;

  const startSession = useMutation(api.learningSessions.startSession)
  const endSession = useMutation(api.learningSessions.endSession)
  
  const plans = useQuery(api.plans.listUserPlans, user ? { userId: user._id } : "skip")
  const selectedPlanData = useQuery(
    api.plans.getPlanWithTodos,
    selectedPlan && user ? { userId: user._id, planId: selectedPlan } : "skip"
  )

  useEffect(() => {
    if (activeSession) {
      setIsRunning(true)
      setElapsedTime(Date.now() - activeSession.startedAt)
    }
  }, [activeSession])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        if (activeSession) {
          setElapsedTime(Date.now() - activeSession.startedAt)
        } else {
          setElapsedTime((prev) => prev + 1000)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, activeSession])

  const handleStart = async () => {
    if (!user) return
    
    try {
      await startSession({
        userId: user._id,
        planId: selectedPlan,
        todoId: selectedTodo,
        source: "timer",
      })
      setIsRunning(true)
      setElapsedTime(0)
      setShowOptions(false)
    } catch (error) {
      console.error("Failed to start session:", error)
    }
  }

  const handleStop = async () => {
    if (!activeSession) return
    
    try {
      await endSession({ sessionId: activeSession._id })
      setIsRunning(false)
      setElapsedTime(0)
      setSelectedPlan(undefined)
      setSelectedTodo(undefined)
    } catch (error) {
      console.error("Failed to end session:", error)
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Timer Display */}
      <div className="text-center space-y-3">
        <div className="font-mono text-4xl font-medium tracking-wider tabular-nums">
          {formatTime(elapsedTime)}
        </div>
        {isRunning && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Session Active</span>
          </div>
        )}
      </div>


      {/* Controls */}
      <div className="space-y-3">
        {!isRunning ? (
          <>
            <Popover open={showOptions} onOpenChange={setShowOptions}>
              <PopoverTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full gap-2 h-9 text-sm"
                >
                  <Play className="h-4 w-4" />
                  Start Session
                  <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start" sideOffset={8}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan" className="text-xs">Link to Plan</Label>
                    <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as Id<"plans">)}>
                      <SelectTrigger id="plan" className="h-8 text-xs">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans?.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id} className="text-xs">
                            {plan.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPlan && selectedPlanData && (
                    <div className="space-y-2">
                      <Label htmlFor="todo" className="text-xs">Link to Task</Label>
                      <Select value={selectedTodo} onValueChange={(value) => setSelectedTodo(value as Id<"todos">)}>
                        <SelectTrigger id="todo" className="h-8 text-xs">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedPlanData.todos?.map((todo) => (
                            <SelectItem key={todo._id} value={todo._id} className="text-xs">
                              {todo.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button 
                    onClick={handleStart}
                    size="sm"
                    className="w-full h-8 text-xs gap-2"
                  >
                    <Play className="h-3 w-3" />
                    Start
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        ) : (
          <Button 
            onClick={handleStop}
            size="sm"
            variant="outline"
            className="w-full gap-2 h-9 text-sm border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <Square className="h-4 w-4" />
            Stop Session
          </Button>
        )}
      </div>

          {/* Today's Stats */}
          <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Today's Sessions</span>
                  <span className="font-medium">{todaysSessions?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Time Today</span>
                  <span className="font-medium font-mono tabular-nums">{formatTime(totalTimeToday)}</span>
              </div>
          </div>

    </div>
  )
}
