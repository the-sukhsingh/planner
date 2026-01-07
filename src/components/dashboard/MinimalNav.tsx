"use client"
import { useAuth } from '@/context/AuthContext'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Award } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function MinimalNav() {
  const { user } = useAuth()
  
  const badgeCount = useQuery(api.badges.getUserBadgeCount, 
    user ? { userId: user._id } : "skip"
  )

  return (
    <div className="flex items-center justify-between py-6">
      <h1 className="text-xl font-medium tracking-tight">Dashboard</h1>
      
      <div className="flex items-center gap-6">
        {/* Secondary Navigation Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground">
              Menu
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Navigation
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/plans" className="text-sm cursor-pointer">
                Plans
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/marketplace" className="text-sm cursor-pointer">
                Marketplace
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/pricing" className="text-sm cursor-pointer">
                Credits
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/conversations" className="text-sm cursor-pointer">
                Conversations
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Achievements Indicator */}
        {badgeCount !== undefined && badgeCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Award className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{badgeCount}</span>
          </div>
        )}

        {/* User Avatar */}
        {user?.imageUrl && (
          <img 
            src={user.imageUrl} 
            alt={user.name || 'User'} 
            className="h-7 w-7 rounded-full ring-1 ring-border"
          />
        )}
      </div>
    </div>
  )
}
