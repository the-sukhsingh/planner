"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Flame,
  Clock,
  Trophy,
  Award,
  TrendingUp,
  ShoppingBag,
  Loader2,
  Calendar as CalendarIcon,
  Target,
  Zap,
  Crown,
  Activity
} from "lucide-react";
import { useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch user stats
  const userStats = useQuery(api.userStats.getUserStats,
    user ? { userId: user._id } : "skip"
  );

  // Fetch badges
  // const badges = useQuery(api.badges.getUserBadges,
  //   user ? { userId: user._id } : "skip"
  // );

  // Fetch purchases
  const purchases = useQuery(api.purchases.listUserPurchases,
    user ? { userId: user._id } : "skip"
  );

  // Fetch recent sessions
  const recentSessions = useQuery(api.learningSessions.getUserSessions,
    user ? { userId: user._id, limit: 10 } : "skip"
  );

  // Fetch sessions for selected date
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const daySessionsData = useQuery(api.learningSessions.getSessionsInRange,
    user ? {
      userId: user._id,
      startDate: startOfDay.getTime(),
      endDate: endOfDay.getTime(),
    } : "skip"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    redirect("/");
    return null;
  }

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalDayTime = daySessionsData?.reduce((sum, session) =>
    sum + (session.durationMs ?? 0), 0
  ) ?? 0;

  const completedSessionsCount = recentSessions?.filter(s => s.endedAt).length ?? 0;

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={user.imageUrl} alt={user.name} />
              <AvatarFallback className="text-xl">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user.name?.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground">
                Here's your learning journey
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-4 py-2">
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              {user.credits} Credits
            </Badge>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">

        {/* Streak Card - Highlight */}
        <Card className="lg:col-span-2 lg:row-span-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Flame className="h-6 w-6 text-orange-500" />
              Current Streak
            </CardTitle>
            <CardDescription>Keep the fire burning!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="text-7xl font-black text-primary mb-2">
                  {userStats?.currentStreak ?? 0}
                </div>
                <div className="text-xl text-muted-foreground">days in a row</div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-card">
                  <Trophy className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                  <div className="text-2xl font-bold">
                    {userStats?.longestStreak ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Best Streak</div>
                </div>

                <div className="text-center p-4 rounded-lg bg-card">
                  <Activity className="h-5 w-5 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">
                    {completedSessionsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Sessions</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Last active: {userStats?.lastActiveDate || 'Never'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Time Stats */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Learning Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-accent/50">
                <div className="text-lg font-bold text-blue-500">
                  {formatTime(userStats?.weeklyLearningTimeMs ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">This Week</div>
              </div>

              <div className="text-center p-3 rounded-lg bg-accent/50">
                <div className="text-lg font-bold text-purple-500">
                  {formatTime(userStats?.monthlyLearningTimeMs ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">This Month</div>
              </div>

              <div className="text-center p-3 rounded-lg bg-accent/50">
                <div className="text-lg font-bold text-green-500">
                  {formatTime(userStats?.totalLearningTimeMs ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">All Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        {/* <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
              <Badge variant="secondary">
                {badges?.length ?? 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {badges && badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {badges.slice(0, 4).map((badge) => (
                  <div
                    key={badge._id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{badge.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {badge.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No achievements yet</p>
                <p className="text-xs mt-1">Complete goals to earn badges!</p>
              </div>
            )}
            {badges && badges.length > 4 && (
              <div className="mt-3 text-center">
                <Link href="/dashboard/achievements" className="text-xs text-primary hover:underline">
                  View all {badges.length} achievements →
                </Link>
              </div>
            )}
          </CardContent>
        </Card> */}

        {/* Daily Activity Calendar */}
        <Card className="lg:col-span-2 lg:row-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Daily Activity
            </CardTitle>
            <CardDescription>
              {formatDate(selectedDate.getTime())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border mx-auto"
              />

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Time</span>
                  <span className="text-lg font-bold text-primary">
                    {formatTime(totalDayTime)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sessions</span>
                  <span className="text-lg font-bold">
                    {daySessionsData?.length ?? 0}
                  </span>
                </div>

                {daySessionsData && daySessionsData.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      Session Details
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {daySessionsData.map((session) => (
                        <div
                          key={session._id}
                          className="flex items-center justify-between p-2 rounded-md bg-accent/30 text-xs"
                        >
                          <span className="text-muted-foreground">
                            {new Date(session.startedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="font-medium">
                            {formatTime(session.durationMs ?? 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Recent Purchases
              </CardTitle>
              <Badge variant="secondary">
                {purchases?.length ?? 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {purchases && purchases.length > 0 ? (
              <div className="space-y-2">
                {purchases.slice(0, 5).map((purchase) => (
                  <div
                    key={purchase._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">Plan Purchase</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(purchase.purchasedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {purchase.price === 0 ? 'Free' : `${purchase.price} credits`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No purchases yet</p>
                <p className="text-xs mt-1">
                  <Button asChild variant="link" className="p-0">
                    <Link href="/marketplace" className="text-primary hover:underline">
                      Browse marketplace →
                    </Link>
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        {/* <Card className="border-green-500/20 bg-linear-to-br from-green-500/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-500">
                {Math.floor(((userStats?.weeklyLearningTimeMs ?? 0) / (7 * 60 * 60 * 1000)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(userStats?.weeklyLearningTimeMs ?? 0)} / 7h goal
              </div>
              <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((userStats?.weeklyLearningTimeMs ?? 0) / (7 * 60 * 60 * 1000)) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-linear-to-br from-blue-500/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-500">
                #--
              </div>
              <div className="text-xs text-muted-foreground">
                Global ranking
              </div>
              <Link href="/leaderboard" className="text-xs text-primary hover:underline inline-block">
                View leaderboard →
              </Link>
            </div>
          </CardContent>
        </Card> */}

      </div>
    </div>
  );
}
