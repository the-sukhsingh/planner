"use client"
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { Flame, Clock, TrendingUp, Target } from 'lucide-react'

export default function StatsCard() {
  const { user } = useAuth()
  
  const userStats = useQuery(api.userStats.getUserStats, 
    user ? { userId: user._id } : "skip"
  )

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const stats = [
    {
      label: 'Current Streak',
      value: userStats?.currentStreak ?? 0,
      unit: 'days',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Weekly Time',
      value: formatTime(userStats?.weeklyLearningTimeMs ?? 0),
      unit: '',
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Monthly Time',
      value: formatTime(userStats?.monthlyLearningTimeMs ?? 0),
      unit: '',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Longest Streak',
      value: userStats?.longestStreak ?? 0,
      unit: 'days',
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-sm text-muted-foreground">
                    {stat.unit}
                  </span>
                )}
              </div>
            </div>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
