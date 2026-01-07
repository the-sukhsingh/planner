"use client"
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { Award, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function BadgesDisplay() {
  const { user } = useAuth()
  
  const badges = useQuery(api.badges.getUserBadges, 
    user ? { userId: user._id } : "skip"
  )

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Achievements</h3>
        {badges && badges.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {badges.length}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {badges && badges.length > 0 ? (
          badges.slice(0, 6).map((badge) => (
            <div 
              key={badge._id} 
              className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{badge.name}</div>
                <div className="text-xs text-muted-foreground">
                  {badge.description}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No achievements yet</p>
            <p className="text-xs mt-1">Complete goals to earn badges!</p>
          </div>
        )}
      </div>
    </Card>
  )
}
