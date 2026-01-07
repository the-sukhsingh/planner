"use client"
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { Clock, Calendar } from 'lucide-react'

export default function RecentSessions() {
  const { user } = useAuth()
  
  const sessions = useQuery(api.learningSessions.getUserSessions, 
    user ? { userId: user._id, limit: 5 } : "skip"
  )

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Recent Sessions</h3>
      </div>

      <div className="space-y-3">
        {sessions && sessions.length > 0 ? (
          sessions
            .filter(s => s.endedAt && s.durationMs)
            .map((session) => (
              <div 
                key={session._id} 
                className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(session.startedAt)}
                  </div>
                  <div className="text-sm font-medium mt-1 capitalize">
                    {session.source} session
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {formatDuration(session.durationMs!)}
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sessions yet</p>
            <p className="text-xs mt-1">Start your first learning session!</p>
          </div>
        )}
      </div>
    </Card>
  )
}
