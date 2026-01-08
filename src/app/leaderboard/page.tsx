"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Clock, Trophy, CheckCircle, Loader2, Medal, Crown, Award } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function LeaderboardPage() {
  const { user } = useAuth();

  // Calculate current periods
  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = getWeekNumber(now);
  const weekPeriod = `${year}-W${String(weekNumber).padStart(2, '0')}`;
  const monthPeriod = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const generalPeriod = "current"; // 'YYYY-MM-DD' for all-time or current day

  const weeklyLeaderboard = useQuery(api.leaderboards.getLeaderboardWithUsers, {
    type: "weekly_time",
    period: weekPeriod,
  });

  const monthlyLeaderboard = useQuery(api.leaderboards.getLeaderboardWithUsers, {
    type: "monthly_time",
    period: monthPeriod,
  });

  const streakLeaderboard = useQuery(api.leaderboards.getLeaderboardWithUsers, {
    type: "streak",
    period: generalPeriod,
  });

  const todosLeaderboard = useQuery(api.leaderboards.getLeaderboardWithUsers, {
    type: "todos_completed",
    period: generalPeriod,
  });

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return null;
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    return "outline";
  };

  const LeaderboardTable = ({
    data,
    formatScore,
    scoreUnit = "",
    emptyMessage = "No entries yet"
  }: {
    data: any;
    formatScore: (score: number) => string;
    scoreUnit?: string;
    emptyMessage?: string;
  }) => {
    if (!data) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!data.entries || data.entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    const userEntry = user ? data.entries.find((e: any) => e.userId === user._id) : null;

    return (
      <div className="space-y-2">
        {data.entries.map((entry: any, index: number) => {
          const isCurrentUser = user && entry.userId === user._id;
          const initials = entry.user?.name
            ?.split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${isCurrentUser
                ? 'bg-primary/5 border-primary/20 shadow-sm'
                : 'bg-card hover:bg-muted/30'
                }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-12 shrink-0">
                {getRankIcon(entry.rank) || (
                  <span className="text-sm font-medium text-muted-foreground">
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.user?.imageUrl} alt={entry.user?.name} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {entry.user?.name || 'Anonymous'}
                  </p>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="font-semibold tabular-nums">
                  {formatScore(entry.score)}
                  {scoreUnit && <span className="text-xs text-muted-foreground ml-1">{scoreUnit}</span>}
                </p>
              </div>
            </div>
          );
        })}

        {/* Show user's position if not in top entries */}
        {user && userEntry && userEntry.rank > 10 && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-primary/5 border-primary/20">
              <div className="flex items-center justify-center w-12 shrink-0">
                <span className="text-sm font-medium text-muted-foreground">
                  #{userEntry.rank}
                </span>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={userEntry.user?.imageUrl} alt={userEntry.user?.name} />
                <AvatarFallback className="text-xs">
                  {userEntry.user?.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {userEntry.user?.name || 'You'}
                  </p>
                  <Badge variant="secondary" className="text-xs">You</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">
                  {formatScore(userEntry.score)}
                  {scoreUnit && <span className="text-xs text-muted-foreground ml-1">{scoreUnit}</span>}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:px-6 py-6">
      {/* Header */}
      <div className="p-2">
        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-muted-foreground text-lg">
          See who’s leading in learning time and streaks
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-fit grid grid-cols-3">
          <TabsTrigger value="weekly" className="rounded-lg">
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">This Week</span>
            <span className="sm:hidden">Week</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg">
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">This Month</span>
            <span className="sm:hidden">Month</span>
          </TabsTrigger>
          <TabsTrigger value="streak" className="rounded-lg">
            <Flame className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Streak</span>
            <span className="sm:hidden">Streak</span>
          </TabsTrigger>
          {/* <TabsTrigger value="todos" className="rounded-lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Tasks</span>
            <span className="sm:hidden">Tasks</span>
          </TabsTrigger> */}
        </TabsList>

        {/* Weekly Leaderboard */}
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Learning Time
              </CardTitle>
              <CardDescription>
                Top learners by study time this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                data={weeklyLeaderboard}
                formatScore={formatTime}
                emptyMessage="Start learning to appear on the leaderboard"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Leaderboard */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Monthly Learning Time
              </CardTitle>
              <CardDescription>
                Top learners by study time this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                data={monthlyLeaderboard}
                formatScore={formatTime}
                emptyMessage="Start learning to appear on the leaderboard"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Streak Leaderboard */}
        <TabsContent value="streak">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5" />
                Current Streaks
              </CardTitle>
              <CardDescription>
                Top learners by consecutive days of learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                data={streakLeaderboard}
                formatScore={(score) => score.toString()}
                scoreUnit="days"
                emptyMessage="Build a streak to appear on the leaderboard"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Todos Leaderboard */}
        {/* <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Tasks Completed
              </CardTitle>
              <CardDescription>
                Top learners by total tasks completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                data={todosLeaderboard}
                formatScore={(score) => score.toString()}
                scoreUnit="tasks"
                emptyMessage="Complete tasks to appear on the leaderboard"
              />
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}
