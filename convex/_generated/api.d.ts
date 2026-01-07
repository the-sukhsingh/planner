/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_tools from "../ai_tools.js";
import type * as badges from "../badges.js";
import type * as chats from "../chats.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as leaderboards from "../leaderboards.js";
import type * as learningSessions from "../learningSessions.js";
import type * as marketplaceplans from "../marketplaceplans.js";
import type * as messages from "../messages.js";
import type * as plans from "../plans.js";
import type * as purchases from "../purchases.js";
import type * as todos from "../todos.js";
import type * as uploads from "../uploads.js";
import type * as userStats from "../userStats.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai_tools: typeof ai_tools;
  badges: typeof badges;
  chats: typeof chats;
  crons: typeof crons;
  events: typeof events;
  leaderboards: typeof leaderboards;
  learningSessions: typeof learningSessions;
  marketplaceplans: typeof marketplaceplans;
  messages: typeof messages;
  plans: typeof plans;
  purchases: typeof purchases;
  todos: typeof todos;
  uploads: typeof uploads;
  userStats: typeof userStats;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
