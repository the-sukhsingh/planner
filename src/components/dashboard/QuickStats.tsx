"use client"
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { TrendingUp, Award, Clock } from 'lucide-react'

export default function QuickStats() {
  const { user } = useAuth()
  
  const userStats = useQuery(api.userStats.getUserStats, 
    user ? { userId: user._id } : "skip"
  )
  
  const badgeCount = useQuery(api.badges.getUserBadgeCount, 
    user ? { userId: user._id } : "skip"
  )

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    return `${hours}h`
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Card className="px-4 py-3 flex items-center gap-3 whitespace-nowrap">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <TrendingUp className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Streak</p>
          <p className="text-lg font-bold">{userStats?.currentStreak ?? 0} days</p>
        </div>
      </Card>
      
      <Card className="px-4 py-3 flex items-center gap-3 whitespace-nowrap">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Clock className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">This Week</p>
          <p className="text-lg font-bold">{formatTime(userStats?.weeklyLearningTimeMs ?? 0)}</p>
        </div>
      </Card>
      
      <Card className="px-4 py-3 flex items-center gap-3 whitespace-nowrap">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Award className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Badges</p>
          <p className="text-lg font-bold">{badgeCount ?? 0}</p>
        </div>
      </Card>
    </div>
  )
}
