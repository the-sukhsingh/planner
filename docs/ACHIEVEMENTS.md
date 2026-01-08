# Achievements (Badges)

This project now includes a lightweight badge system designed to reward meaningful behavior (consistency, time invested, execution, AI engagement, and learning intelligence) without gating functionality.

## Design principles

- **Meaningful**: badges are tied to measurable behaviors (streaks, learning time, completed todos/plans, AI usage, focused session lengths).
- **Static definitions**: badge definitions and tier thresholds live in `convex/badgeDefinitions.ts` and in the frontend `src/components/badges/definitions.ts` for display.
- **Tiers instead of duplicates**: each badge supports levels: **bronze**, **silver**, **gold**. Awarding upgrades the level when appropriate.
- **Non-gating**: badges do not unlock or gate features or require spending credits.
- **Subtle UI**: badges are surfaced in the dashboard and a dedicated achievements section; they are informative and encouraging rather than gamified spam.

## Where logic lives

- Backend evaluator: `convex/badgeDefinitions.ts` (static definitions + `evaluateBadgesForUser` internal mutation)
- Awarding/upgrading: `convex/badges.ts` (mutation `awardBadge` updated to support `level`, `category`, and upgrades)
- Trigger points: `learningSessions.endSession`, `todos.completeTodo`, and `chats.createChat` call the evaluator in real-time.
- Frontend display: `src/components/dashboard/BadgesDisplay.tsx`, `src/components/badges/getBadge.tsx`, and `src/components/badges/BadgeItem.tsx`.

## Badge categories & examples

- **Consistency**: streak-based tier (e.g., 1/7/30-day levels)
- **Time investment**: total learning hours (1/10/50 hours)
- **Execution**: todos/plans completed
- **AI engagement**: initial chat and milestones
- **Learning intelligence**: average session length, weekly learning time

## Notes for maintainers

- To add/adjust badges, update `convex/badgeDefinitions.ts` (server-side authoritative) and the frontend definitions for presentation if needed.
- To trigger re-evaluation manually for a user, call `badgeDefinitions.evaluateBadgesForUser` with `{ userId }`.

