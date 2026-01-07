"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { useAuth } from '@/context/AuthContext'

interface TodoCreationDialogProps {
  mode?: 'today' | 'plan' // Default is today
  planId?: Id<"plans"> // Required when mode is 'plan'
  children?: React.ReactNode // Custom trigger button
  onSuccess?: () => void
}

export function TodoCreationDialog({ 
  mode = 'today', 
  planId,
  children,
  onSuccess 
}: TodoCreationDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
  const [estimatedTime, setEstimatedTime] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [resourceInput, setResourceInput] = useState('')
  const [resources, setResources] = useState<string[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<Id<"plans"> | undefined>(planId)

  // Mutations
  const createTodoForToday = useMutation(api.todos.createTodoForToday)
  const createTodoForPlan = useMutation(api.todos.createTodo)

  // Query for user's plans (only when mode is 'today' to allow selection)
  const userPlans = useQuery(
    api.plans.listUserPlans,
    user && mode === 'today' ? { userId: user._id } : "skip"
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddResource = () => {
    if (resourceInput.trim()) {
      setResources([...resources, resourceInput.trim()])
      setResourceInput('')
    }
  }

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return

    setIsSubmitting(true)

    try {
      if (mode === 'today') {
        // Create todo for today
        await createTodoForToday({
          userId: user._id,
          title: title.trim(),
          description: description.trim() || undefined,
          resources: resources.length > 0 ? resources : undefined,
        })
      } else {
        // Create todo for specific plan
        const targetPlanId = selectedPlanId || planId
        if (!targetPlanId || !dueDate) {
          console.error('Plan ID or due date missing')
          return
        }

        // Calculate order (you might want to fetch existing todos count)
        const order = Date.now() // Simple ordering by creation time

        await createTodoForPlan({
          planId: targetPlanId,
          title: title.trim(),
          description: description.trim() || undefined,
          order,
          priority,
          dueDate: dueDate.getTime(),
          estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
          resources: resources.length > 0 ? resources : undefined,
        })
      }

      // Reset form
      setTitle('')
      setDescription('')
      setDueDate(new Date())
      setEstimatedTime('')
      setPriority('medium')
      setResources([])
      setResourceInput('')
      setSelectedPlanId(planId)
      
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create todo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add {mode === 'today' ? 'Today\'s Task' : 'Task'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>
            {mode === 'today' ? 'Add Today\'s Task' : 'Add Task to Plan'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'today' 
              ? 'Create a new task for today. It will be added to your daily tasks list.'
              : 'Create a new task for your plan with details and resources.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          {/* Plan selection (only for today mode) */}
          {mode === 'today' && userPlans && userPlans.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="plan">Assign to Plan (Optional)</Label>
              <Select
                value={selectedPlanId}
                onValueChange={(value) => setSelectedPlanId(value as Id<"plans">)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan (Today only)</SelectItem>
                  {userPlans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due Date and Estimated Time - only for plan mode */}
          {mode === 'plan' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Est. Time (min)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="60"
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Priority - only for plan mode */}
          {mode === 'plan' && (
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Resources */}
          <div className="space-y-2">
            <Label htmlFor="resource">Resources (Links)</Label>
            <div className="flex gap-2">
              <Input
                id="resource"
                value={resourceInput}
                onChange={(e) => setResourceInput(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddResource()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddResource}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {resources.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {resources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                  >
                    <span className="max-w-50 truncate">{resource}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
