import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Reset weekly stats every Monday at midnight
crons.interval(
    "reset weekly stats",
    { hours: 24 * 7 }, // Run weekly
    internal.userStats.resetWeeklyStats,
    {}
);

// Reset monthly stats on the first day of each month
crons.interval(
    "reset monthly stats",
    { hours: 24 * 30 }, // Approximate monthly
    internal.userStats.resetMonthlyStats,
    {}
);

// Generate weekly leaderboard every Sunday at 11:59 PM
crons.interval(
    "generate weekly leaderboard",
    { hours: 24 * 7 },
    internal.leaderboards.generateWeeklyTimeLeaderboard,
    { period: getCurrentWeekPeriod() }
);

// Generate monthly leaderboard on the last day of each month
crons.interval(
    "generate monthly leaderboard",
    { hours: 24 * 30 },
    internal.leaderboards.generateMonthlyTimeLeaderboard,
    { period: getCurrentMonthPeriod() }
);

// Generate streak leaderboard daily
crons.interval(
    "generate streak leaderboard",
    { hours: 24 },
    internal.leaderboards.generateStreakLeaderboard,
    { period: "current" }
);

export default crons;

// Helper functions
function getCurrentWeekPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = getWeekNumber(now);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

function getCurrentMonthPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}
