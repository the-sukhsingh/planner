"use client"
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/context/AuthContext'
import { Flame, Clock, Trophy, TrendingUp } from 'lucide-react'

export default function MinimalStats() {
  const { user } = useAuth()
  
  const userStats = useQuery(api.userStats.getUserStats, 
    user ? { userId: user._id } : "skip"
  )

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const stats = [
    {
      label: 'Streak',
      value: `${userStats?.currentStreak ?? 0}`,
      unit: 'days',
      icon: Flame,
    },
    {
      label: 'This Week',
      value: formatTime(userStats?.weeklyLearningTimeMs ?? 0),
      unit: '',
      icon: Clock,
    },
    {
      label: 'This Month',
      value: formatTime(userStats?.monthlyLearningTimeMs ?? 0),
      unit: '',
      icon: TrendingUp,
    },
    {
      label: 'Best Streak',
      value: `${userStats?.longestStreak ?? 0}`,
      unit: 'days',
      icon: Trophy,
    },
  ]

  return (
    <div className="space-y-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <stat.icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-medium tabular-nums text-sm">{stat.value}</span>
            {stat.unit && <span className="text-xs text-muted-foreground/60">{stat.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}