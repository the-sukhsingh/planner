"use client"

import React, { useState, useEffect } from 'react'
import { usePlan } from '@/context/PlanContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { createPlanFromYouTubePlaylist } from '@/actions/youtube'
import { TodoCreationDialog } from './TodoCreationDialog'
import {
  Plus,
  Trash2,
  CalendarIcon,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  LayoutDashboard,
  Zap,
  CheckCircle2,
  Circle,
  MoreVertical,
  Activity,
  Layers,
  ArrowRight,
  Link as LinkIcon,
  X,
  UploadIcon,
  Youtube
} from 'lucide-react'

const PlanInterface = ({ setId }: { setId: (id: string) => void }) => {
  const {
    plans,
    todos: contextTodos,
    loading,
    createPlan: contextCreatePlan,
    updatePlan: contextUpdatePlan,
    deletePlan: contextDeletePlan,
    createTodo: contextCreateTodo,
    updateTodo: contextUpdateTodo,
    deleteTodo: contextDeleteTodo,
    shiftPendingTodos: contextShiftPendingTodos,
    fetchPlans: contextFetchPlans,
    getTodosForPlan
  } = usePlan();


  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [filterDate, setFilterDate] = useState<Date>()
  const [statusFilter, setStatusFilter] = useState<string>('active')



  // Dialog states
  const [createPlanOpen, setCreatePlanOpen] = useState(false)
  const [createTodoOpen, setCreateTodoOpen] = useState(false)
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const [editTodoOpen, setEditTodoOpen] = useState<any>(null)
  const [bulkShiftOpen, setBulkShiftOpen] = useState(false)
  const [shiftDays, setShiftDays] = useState('')
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false)
  const [youtubeLoading, setYoutubeLoading] = useState(false)

  // Form states
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    goal: '',
    difficulty: 'intermediate',
    estimatedDuration: ''
  })

  const [youtubeData, setYoutubeData] = useState({
    playlistUrl: '',
    title: '',
    description: '',
    difficulty: 'intermediate'
  })

  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    estimatedTime: '',
    resources: [] as string[]
  })

  const [editTodo, setEditTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    estimatedTime: '',
    resources: [] as string[]
  })

  const [editPlan, setEditPlan] = useState({
    id: '' as any,
    title: '',
    description: '',
    goal: '',
    difficulty: 'intermediate',
    estimatedDuration: ''
  })

  // Handlers using context
  const handleCreatePlan = async () => {
    const result = await contextCreatePlan({
      ...newPlan,
      estimatedDuration: newPlan.estimatedDuration ? parseInt(newPlan.estimatedDuration) : null
    })

    if (result) {
      setCreatePlanOpen(false)
      setNewPlan({ title: '', description: '', goal: '', difficulty: 'intermediate', estimatedDuration: '' })
    }
  }


  const openEditPlan = (plan: any) => {
    setEditPlan({
      id: plan._id,
      title: plan.title,
      description: plan.description || '',
      goal: plan.goal || '',
      difficulty: plan.difficulty,
      estimatedDuration: plan.estimatedDuration?.toString() || ''
    })
    setEditPlanOpen(true)
  }

  const handleSaveEditPlan = async () => {
    await contextUpdatePlan(editPlan.id as any, {
      title: editPlan.title,
      description: editPlan.description,
      goal: editPlan.goal,
      difficulty: editPlan.difficulty as any,
      estimatedDuration: editPlan.estimatedDuration ? parseInt(editPlan.estimatedDuration) : undefined
    })

    setEditPlanOpen(false)
  }

  const [planToDelete, setPlanToDelete] = useState<string | null>(null)
  const [todoToDelete, setTodoToDelete] = useState<string | null>(null)

  const confirmDeletePlan = async () => {
    if (!planToDelete) return
    const idToDelete = planToDelete;
    setPlanToDelete(null)
    await contextDeletePlan(idToDelete as any)
    if (selectedPlan?._id === idToDelete) {
      setSelectedPlan(null)
    }
  }

  const handleCreateTodo = async () => {
    if (!selectedPlan) return

    const result = await contextCreateTodo(selectedPlan._id, {
      title: newTodo.title,
      description: newTodo.description || null,
      priority: newTodo.priority,
      dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : null,
      estimatedTime: newTodo.estimatedTime ? parseInt(newTodo.estimatedTime) : null,
      resources: newTodo.resources
    })

    if (result) {
      setCreateTodoOpen(false)
      setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '', estimatedTime: '', resources: [] })
    }
  }

  const handleUpdateTodo = async (todoId: string, updates: any) => {
    await contextUpdateTodo(todoId as any, updates)
    setEditTodoOpen(null)
  }

  const handleSaveEditTodo = async () => {
    if (!editTodoOpen) return

    await contextUpdateTodo(editTodoOpen._id, {
      title: editTodo.title,
      description: editTodo.description || undefined,
      priority: editTodo.priority as any,
      dueDate: editTodo.dueDate ? new Date(editTodo.dueDate).getTime() : Date.now(),
      estimatedTime: editTodo.estimatedTime ? parseInt(editTodo.estimatedTime) : undefined,
      resources: editTodo.resources
    })

    setEditTodoOpen(null)
    setEditTodo({ title: '', description: '', priority: 'medium', dueDate: '', estimatedTime: '', resources: [] })
  }

  const openEditTodo = (todo: any) => {
    setEditTodoOpen(todo)
    setEditTodo({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      estimatedTime: todo.estimatedTime?.toString() || '',
      resources: todo.resources || []
    })
  }

  const toggleTodoStatus = async (todo: any) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
    await handleUpdateTodo(todo._id, { status: newStatus })
  }


  const handleBulkShift = async () => {
    const days = parseInt(shiftDays)
    if (isNaN(days) || days === 0) return

    await contextShiftPendingTodos(days, selectedPlan?._id)
    setBulkShiftOpen(false)
    setShiftDays('')
  }


  useEffect(() => {
    if (selectedPlan) {
      getTodosForPlan(selectedPlan._id);
      setId(selectedPlan._id.toString());
    }
  }, [selectedPlan, getTodosForPlan, setId])

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      setSelectedPlan(plans[0])
    }
  }, [plans, selectedPlan])

  const downloadExampleCsv = () => {
    const exampleCsv = `Title,Description,Priority,Due Date,Resources,Order
    `;
    const blob = new Blob([exampleCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'example.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleYouTubePlaylist = async () => {
    if (!youtubeData.playlistUrl) return;

    setYoutubeLoading(true);
    try {
      const result = await createPlanFromYouTubePlaylist(youtubeData.playlistUrl, {
        title: youtubeData.title,
        description: youtubeData.description,
        difficulty: youtubeData.difficulty
      });

      if (result.success) {
        setYoutubeDialogOpen(false);
        setYoutubeData({ playlistUrl: '', title: '', description: '', difficulty: 'intermediate' });
        await contextFetchPlans();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to import YouTube playlist');
    } finally {
      setYoutubeLoading(false);
    }
  };

  // Get todos for selected plan
  const currentTodos = selectedPlan ? (contextTodos[selectedPlan._id.toString()] || []) : []

  // Filter todos locally
  const filteredTodos = React.useMemo(() => {
    if (!filterDate) return currentTodos

    return currentTodos.filter(todo => {
      if (!todo.dueDate) return false
      const todoDate = new Date(todo.dueDate)
      const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate())
      const todoDateOnly = new Date(todoDate.getFullYear(), todoDate.getMonth(), todoDate.getDate())
      return todoDateOnly.getTime() === filterDateOnly.getTime()
    })
  }, [currentTodos, filterDate])


  const formatDate = (date: Date | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const handlePreviousDay = () => {
    if (!filterDate) return
    const newDate = new Date(filterDate)
    newDate.setDate(newDate.getDate() - 1)
    setFilterDate(newDate)
  }

  const handleNextDay = () => {
    if (!filterDate) return
    const newDate = new Date(filterDate)
    newDate.setDate(newDate.getDate() + 1)
    setFilterDate(newDate)
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  };

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvDialog, setCsvDialog] = useState(false);

  const handleCsvTodos = async () => {
    const csvData = await csvFile?.text();
    if (!csvData) return
    parseTodosFromCsv(csvData)
  }


  const parseTodosFromCsv = async (csvData: string) => {
    const lines = csvData.split('\n');
    const todos = lines.slice(1).map(line => {
      const [title, description, priority, dueDate, resources, order] = line.split(',');
      const dueDateObj = dueDate ? new Date(dueDate) : null
      const resourcesArr = resources ? resources.split(',') : []
      return {
        title,
        description,
        priority,
        dueDate: dueDateObj,
        order: parseInt(order),
        resources: resourcesArr
      }
    })

    // Add todos to the current plan
    todos.forEach(todo => {
      contextCreateTodo(selectedPlan._id, todo)
    })
    setCsvDialog(false);
    setCsvFile(null);
    contextFetchPlans();
  }



  if (loading) {
    return <div className="flex flex-col items-center justify-center min-h-125 gap-4">
      <Activity className="h-10 w-10 text-primary animate-pulse" />
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Dashboard...</p>
    </div>
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-0">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

        {/* Sidebar Panel */}
        <div className="lg:col-span-4 lg:px-4 space-y-6 border-x h-screen sticky top-16 lg:pt-4">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight mb-2 ">
                Plans
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your learning roadmaps</p>
            </div>

            <div className="flex gap-2">
              <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1 h-11 rounded-lg font-medium gap-2">
                    <Plus className="h-4 w-4" />
                    New Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Create Plan</DialogTitle>
                    <DialogDescription>Define your learning objectives and timeline.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                      <Input id="title" value={newPlan.title} onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })} placeholder="e.g., Master React Development" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal" className="text-sm font-medium">Goal</Label>
                      <Input id="goal" value={newPlan.goal} onChange={(e) => setNewPlan({ ...newPlan, goal: e.target.value })} placeholder="What do you want to achieve?" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Difficulty</Label>
                        <select className="w-full h-10 px-3 border rounded-md bg-background text-sm" value={newPlan.difficulty} onChange={(e) => setNewPlan({ ...newPlan, difficulty: e.target.value })}>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Duration (Days)</Label>
                        <Input type="number" value={newPlan.estimatedDuration} onChange={(e) => setNewPlan({ ...newPlan, estimatedDuration: e.target.value })} placeholder="30" />
                      </div>
                    </div>
                    <Button onClick={handleCreatePlan} className="w-full">Create Plan</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 h-11 rounded-lg font-medium gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
                    YouTube
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Import from YouTube Playlist</DialogTitle>
                    <DialogDescription>Create a learning plan from a YouTube playlist. Each video will become a task. It will cost you 10 credits.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="youtube-url" className="text-sm font-medium">Playlist URL or ID</Label>
                      <Input
                        id="youtube-url"
                        value={youtubeData.playlistUrl}
                        onChange={(e) => setYoutubeData({ ...youtubeData, playlistUrl: e.target.value })}
                        placeholder="https://www.youtube.com/playlist?list=..."
                      />
                      <p className="text-xs text-muted-foreground">Paste a YouTube playlist URL or playlist ID</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube-title" className="text-sm font-medium">Plan Title (Optional)</Label>
                      <Input
                        id="youtube-title"
                        value={youtubeData.title}
                        onChange={(e) => setYoutubeData({ ...youtubeData, title: e.target.value })}
                        placeholder="Leave empty to use playlist name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube-description" className="text-sm font-medium">Description (Optional)</Label>
                      <Textarea
                        id="youtube-description"
                        value={youtubeData.description}
                        onChange={(e) => setYoutubeData({ ...youtubeData, description: e.target.value })}
                        placeholder="Add a custom description"
                        className="min-h-15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Difficulty</Label>
                      <select
                        className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        value={youtubeData.difficulty}
                        onChange={(e) => setYoutubeData({ ...youtubeData, difficulty: e.target.value })}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <Button
                      onClick={handleYouTubePlaylist}
                      className="w-full"
                      disabled={!youtubeData.playlistUrl || youtubeLoading}
                    >
                      {youtubeLoading ? 'Importing...' : 'Import Playlist'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Your Plans</h2>
              <span className="text-xs text-muted-foreground">{plans.length}</span>
            </div>

            <div className="space-y-2">
              {plans.map((plan) => (
                <Card
                  key={plan._id}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "cursor-pointer transition-all duration-200 border overflow-hidden relative group",
                    selectedPlan?._id === plan._id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "hover:border-border/80 hover:shadow-sm"
                  )}
                >
                  <CardContent className="px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate mb-1">{plan.title}</h3>
                        <div className={cn(
                          "text-xs mb-3",
                          selectedPlan?._id === plan._id ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {plan.difficulty} • {plan.progress}% complete
                        </div>
                        <div className="h-1.5 w-full bg-current/10 rounded-full overflow-hidden">
                          <div className="h-full bg-current/60 transition-all duration-500" style={{ width: `${plan.progress}%` }} />
                        </div>
                      </div>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-1" align="end">
                          <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-xs font-semibold" onClick={() => openEditPlan(plan)}><Pencil className="h-3 w-3" /> Edit</Button>
                          <Button variant="ghost" className="w-full justify-start gap-2 h-8 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setPlanToDelete(plan._id)}><Trash2 className="h-3 w-3" /> Delete</Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 lg:pt-4 lg:px-4 border-r">
          {selectedPlan ? (
            <div className="space-y-6">
              {/* Plan Header */}
              <div className="border-b pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-md capitalize">{selectedPlan.difficulty}</span>

                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {selectedPlan.estimatedDuration || currentTodos.length} days
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight mb-2">{selectedPlan.title}</h2>
                    {selectedPlan.description && (
                      <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <TodoCreationDialog
                    mode="plan"
                    planId={selectedPlan._id}
                    onSuccess={() => {
                      // Refresh todos after creation
                      getTodosForPlan(selectedPlan._id)
                    }}
                  >
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </TodoCreationDialog>
                  {/* 
                    <Button variant="outline" className="gap-2" onClick={() => setCsvDialog(true)}>
                      <UploadIcon className="h-4 w-4" />
                      Import Todos
                    </Button> */}

                  <Button variant="outline" className="gap-2" onClick={() => setBulkShiftOpen(true)}>
                    <CalendarIcon className="h-4 w-4" />
                    Shift Dates
                  </Button>
                </div>
              </div>
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b pr-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handlePreviousDay} disabled={!filterDate} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-8 px-3 text-sm font-medium">
                        <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                        {filterDate ? formatDisplayDate(filterDate) : 'All Tasks'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar mode="single" selected={filterDate} onSelect={setFilterDate} autoFocus />
                    </PopoverContent>
                  </Popover>
                  <Button variant="ghost" size="icon" onClick={handleNextDay} disabled={!filterDate} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {filterDate && <Button variant="ghost" onClick={() => setFilterDate(undefined)} className="h-8 text-xs text-muted-foreground">Clear</Button>}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Circle className="h-3 w-3" />
                    <span>{filteredTodos.filter(t => t.status !== 'completed').length} Pending</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{filteredTodos.filter(t => t.status === 'completed').length} Completed</span>
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-6 pb-6">
                {filteredTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Circle className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <h3 className="text-sm font-medium text-foreground mb-1">No tasks found</h3>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {filterDate ? "No tasks scheduled for this date." : "Add your first task to get started."}
                    </p>
                  </div>
                ) : (
                  ['pending', 'completed'].map((status) => {
                    const statusTodos = filteredTodos.filter(todo => status === 'completed' ? todo.status === 'completed' : todo.status
                      !== 'completed')
                    if (statusTodos.length === 0) return null

                    return (
                      <div key={status} className="space-y-3">
                        <h3 className="text-xs font-medium text-muted-foreground px-1">
                          {status === 'completed' ? 'Completed' : 'Active Tasks'}
                        </h3>
                        <div className="space-y-2">
                          {statusTodos.map((todo) => (
                            <Card key={todo._id} className={cn("transition-all duration-200 group/card relative", todo.status === 'completed'
                              ? "opacity-60" : "hover:shadow-sm")}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <button onClick={(e) => { e.stopPropagation(); toggleTodoStatus(todo); }}
                                    className={cn(
                                      "h-5 w-5 rounded flex items-center justify-center shrink-0 border-2 transition-all mt-0.5",
                                      todo.status === 'completed'
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/30 hover:border-primary"
                                    )}
                                  >
                                    {todo.status === 'completed' &&
                                      <CheckCircle2 className="h-3 w-3" />}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <h4 className={cn("font-medium text-sm leading-snug mb-1", todo.status === 'completed'
                                      && "line-through text-muted-foreground")}>{todo.title}</h4>
                                    {todo.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{todo.description}</p>
                                    }

                                    {todo.resources && todo.resources.length > 0 && (
                                      <div className='flex flex-wrap gap-1.5 mb-2'>
                                        {todo.resources.map((res: string, index: number) => {
                                          let hostname = '';
                                          try {
                                            hostname = new URL(res).hostname.replace('www.', '');
                                          } catch (e) {
                                            hostname = res.slice(0, 15);
                                          }
                                          return (
                                            <a key={index} href={res} target="_blank" rel="noopener noreferrer"
                                              className='inline-flex items-center gap-1 text-xs text-primary hover:underline' onClick={(e) =>
                                                e.stopPropagation()}
                                            >
                                              <LinkIcon className="h-3 w-3" />
                                              {hostname}
                                            </a>
                                          );
                                        })}
                                      </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      {todo.priority && todo.priority !== 'low' && (
                                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", todo.priority === 'high'
                                          ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                          : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300")}>{todo.priority}</span>
                                      )}
                                      {todo.dueDate && (
                                        <span className="flex items-center gap-1">
                                          <CalendarIcon className="h-3 w-3" /> {formatDate(new Date(todo.dueDate))}
                                        </span>
                                      )}
                                      {todo.estimatedTime && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" /> {formatTime(todo.estimatedTime)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditTodo(todo)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => contextDeleteTodo(todo._id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
              <LayoutDashboard className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Plan Selected</h2>
              <p className="text-sm text-muted-foreground max-w-md">Select a plan from the sidebar or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>{/* Delete Plan Dialog */}
      <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Delete Plan</DialogTitle>
            <DialogDescription>This will permanently delete this plan and all associated tasks.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setPlanToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDeletePlan}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Todo Dialog */}
      <Dialog open={!!todoToDelete} onOpenChange={(open) => !open && setTodoToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Delete Task</DialogTitle>
            <DialogDescription>Are you sure you want to delete this task?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setTodoToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={async () => { if (todoToDelete) { await contextDeleteTodo(todoToDelete as any); setTodoToDelete(null); } }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Todo Dialog */}
      <Dialog open={!!editTodoOpen} onOpenChange={(open) => !open && setEditTodoOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Task</DialogTitle>
            <DialogDescription>Update task details and resources.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-todo-title" className="text-sm font-medium">Title</Label>
              <Input
                id="edit-todo-title"
                value={editTodo.title}
                onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-todo-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="edit-todo-description"
                value={editTodo.description}
                onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-todo-priority" className="text-sm font-medium">Priority</Label>
                <select
                  id="edit-todo-priority"
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  value={editTodo.priority}
                  onChange={(e) => setEditTodo({ ...editTodo, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-todo-time" className="text-sm font-medium">Est. Time (min)</Label>
                <Input
                  id="edit-todo-time"
                  type="number"
                  value={editTodo.estimatedTime}
                  onChange={(e) => setEditTodo({ ...editTodo, estimatedTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-todo-date" className="text-sm font-medium">Due Date</Label>
              <Input
                id="edit-todo-date"
                type="date"
                value={editTodo.dueDate}
                onChange={(e) => setEditTodo({ ...editTodo, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Resources</Label>
              <div className="space-y-2">
                {editTodo.resources.map((res, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={res}
                      onChange={(e) => {
                        const updated = [...editTodo.resources]
                        updated[index] = e.target.value
                        setEditTodo({ ...editTodo, resources: updated })
                      }}
                      placeholder="https://..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = [...editTodo.resources]
                        updated.splice(index, 1)
                        setEditTodo({ ...editTodo, resources: updated })
                      }}
                      className="h-9 w-9 text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTodo({ ...editTodo, resources: [...editTodo.resources, ''] })}
                  className="w-full border-dashed gap-2 text-xs"
                >
                  <Plus className="h-3 w-3" /> Add Resource
                </Button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveEditTodo} className="flex-1">Save Changes</Button>
              <Button variant="outline" onClick={() => setEditTodoOpen(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Plan Dialog */}
      <Dialog open={editPlanOpen} onOpenChange={setEditPlanOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Plan</DialogTitle>
            <DialogDescription>Update your plan details and timeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium">Title</Label>
              <Input id="edit-title" value={editPlan.title} onChange={(e) => setEditPlan({ ...editPlan, title: e.target.value })} placeholder="e.g., Master React Development" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
              <Textarea id="edit-description" value={editPlan.description} onChange={(e) => setEditPlan({ ...editPlan, description: e.target.value })} placeholder="What is this plan about?" className="min-h-20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal" className="text-sm font-medium">Goal</Label>
              <Input id="edit-goal" value={editPlan.goal} onChange={(e) => setEditPlan({ ...editPlan, goal: e.target.value })} placeholder="What do you want to achieve?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Difficulty</Label>
                <select className="w-full h-10 px-3 border rounded-md bg-background text-sm" value={editPlan.difficulty} onChange={(e) => setEditPlan({ ...editPlan, difficulty: e.target.value })}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration (Days)</Label>
                <Input type="number" value={editPlan.estimatedDuration} onChange={(e) => setEditPlan({ ...editPlan, estimatedDuration: e.target.value })} placeholder="30" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditPlanOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEditPlan} className="flex-1">Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Shift Dialog */}
      <Dialog open={bulkShiftOpen} onOpenChange={setBulkShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Shift Dates</DialogTitle>
            <DialogDescription>Move all pending tasks forward or backward by a number of days.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="shift-days" className="text-sm font-medium">Number of Days</Label>
              <Input
                id="shift-days"
                type="number"
                value={shiftDays}
                onChange={(e) => setShiftDays(e.target.value)}
                placeholder="e.g., 1 for tomorrow, -1 for yesterday"
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              This will update the due dates for all incomplete tasks in this plan.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setBulkShiftOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkShift} className="flex-1">Shift Dates</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={csvDialog} onOpenChange={setCsvDialog} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Import Todos</DialogTitle>
            <DialogDescription>Import todos from a CSV file.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">

            <div className="space-y-2">
              <Label htmlFor="csv-file" className="text-sm font-medium">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                accept=".csv"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadExampleCsv} variant="ghost">
                Download Example CSV
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setCsvFile(null); setCsvDialog(false) }}>Cancel</Button>
              <Button onClick={handleCsvTodos} className="flex-1">Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>





    </div>
  )
}

export default PlanInterface;
