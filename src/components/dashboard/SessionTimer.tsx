"use client"
import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Play, Pause, Square, Clock, Timer } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Id } from '../../../convex/_generated/dataModel'

export default function SessionTimer() {
  const { user } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<Id<"plans">>()
  const [selectedTodo, setSelectedTodo] = useState<Id<"todos">>()

  const activeSession = useQuery(api.learningSessions.getActiveSession, 
    user ? { userId: user._id } : "skip"
  )
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
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Timer className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Learning Session</h3>
      </div>

      {/* Timer Display */}
      <div className="text-center space-y-2">
        <div className="text-5xl font-bold font-mono tracking-wider text-primary">
          {formatTime(elapsedTime)}
        </div>
        {activeSession && (
          <p className="text-sm text-muted-foreground">
            Started at {new Date(activeSession.startedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Plan Selection */}
      {!isRunning && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan">Select Plan (Optional)</Label>
            <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as Id<"plans">)}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Choose a plan..." />
              </SelectTrigger>
              <SelectContent>
                {plans?.map((plan) => (
                  <SelectItem key={plan._id} value={plan._id}>
                    {plan.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan && selectedPlanData && (
            <div className="space-y-2">
              <Label htmlFor="todo">Select Todo (Optional)</Label>
              <Select value={selectedTodo} onValueChange={(value) => setSelectedTodo(value as Id<"todos">)}>
                <SelectTrigger id="todo">
                  <SelectValue placeholder="Choose a todo..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedPlanData.todos?.map((todo) => (
                    <SelectItem key={todo._id} value={todo._id}>
                      {todo.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isRunning ? (
          <Button 
            onClick={handleStart} 
            className="flex-1 gap-2"
            size="lg"
          >
            <Play className="h-4 w-4" />
            Start Session
          </Button>
        ) : (
          <Button 
            onClick={handleStop} 
            variant="destructive"
            className="flex-1 gap-2"
            size="lg"
          >
            <Square className="h-4 w-4" />
            End Session
          </Button>
        )}
      </div>

      {isRunning && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Session in progress
          </div>
        </div>
      )}
    </Card>
  )
}
