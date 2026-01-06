import { pgTable, serial, text, integer, timestamp, boolean, json, index, primaryKey, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const usersTable = pgTable('users_table', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    imageUrl: text('image_url'),
    plan: text('plan').notNull().default('free'),
    credits: integer('credits').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Conversations table - stores chat sessions between user and AI
export const conversationsTable = pgTable('conversations_table', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('New Conversation'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Messages table - stores individual chat messages
export const messagesTable = pgTable('messages_table', {
    id: serial('id').primaryKey(),
    conversationId: integer('conversation_id').notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' or 'assistant'
    content: text('content').notNull(),
    metadata: json('metadata'), // store additional data like model used, tokens, etc.
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Learning Plans table - AI-generated plans to learn something
export const learningPlansTable = pgTable('learning_plans_table', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    conversationId: integer('conversation_id').references(() => conversationsTable.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    goal: text('goal').notNull(), // What the user wants to learn
    difficulty: text('difficulty').default('intermediate'), // 'beginner', 'intermediate', 'advanced'
    estimatedDuration: integer('estimated_duration'), // in days
    status: text('status').notNull().default('active'), // 'active', 'completed', 'paused', 'archived'
    progress: integer('progress').notNull().default(0), // percentage 0-100
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Todos/Tasks table - individual tasks within a learning plan
export const todosTable = pgTable('todos_table', {
    id: serial('id').primaryKey(),
    planId: integer('plan_id').notNull().references(() => learningPlansTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0), // for ordering tasks
    priority: text('priority').default('medium'), // 'low', 'medium', 'high'
    status: text('status').notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'skipped'
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    estimatedTime: integer('estimated_time'), // in minutes
    actualTime: integer('actual_time'), // in minutes
    notes: text('notes'), // user or AI notes about the task
    resources: json('resources'), // links, references, etc.
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Uploads table - store file uploads related to conversations or plans
export const uploadsTable = pgTable('uploads_table', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    conversationId: integer('conversation_id').references(() => conversationsTable.id, { onDelete: 'set null' }),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').notNull(),
    fileSize: integer('file_size').notNull(), // in bytes
    fileUrl: text('file_url').notNull(), // URL to access the file
    metadata: json('metadata'), // additional info like extracted text, embeddings, etc.
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Milestones table - major checkpoints in a learning plan
export const milestonesTable = pgTable('milestones_table', {
    id: serial('id').primaryKey(),
    planId: integer('plan_id').notNull().references(() => learningPlansTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    isCompleted: boolean('is_completed').notNull().default(false),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Marketplace Plans table - plans published to the marketplace
export const marketplacePlansTable = pgTable('marketplace_plans', {
    id: serial('id').primaryKey(),
    planId: integer('plan_id').notNull().references(() => learningPlansTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('draft'), // 'draft', 'published', 'archived'
    visibility: text('visibility').notNull().default('public'), // 'public', 'private'
    price: integer('price').notNull().default(0), // price in cents
    isFree: boolean('is_free').notNull().default(true),
    rating: doublePrecision('rating').notNull().default(0),
    installs: integer('installs').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
    planIdIdx: index('mp_plan_id_idx').on(table.planId),
    userIdIdx: index('mp_user_id_idx').on(table.userId),
    statusIdx: index('mp_status_idx').on(table.status),
    priceIdx: index('mp_price_idx').on(table.price),
    visibilityIdx: index('mp_visibility_idx').on(table.visibility),
}));

// Plan Forks table - tracking when users copy a marketplace plan
export const planForksTable = pgTable('plan_forks', {
    id: serial('id').primaryKey(),
    originalPlanId: integer('original_plan_id').notNull().references(() => learningPlansTable.id, { onDelete: 'cascade' }),
    forkedPlanId: integer('forked_plan_id').notNull().references(() => learningPlansTable.id, { onDelete: 'cascade' }),
    userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
    originalIdx: index('fork_original_idx').on(table.originalPlanId),
    userIdx: index('fork_user_idx').on(table.userId),
}));

// Plan Purchases table - tracking paid plan acquisitions
export const planPurchasesTable = pgTable('plan_purchases', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    marketplacePlanId: integer('marketplace_plan_id').notNull().references(() => marketplacePlansTable.id, { onDelete: 'cascade' }),
    price: integer('price').notNull().default(0),
    purchasedAt: timestamp('purchased_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
    userMPIdx: index('purchase_user_mp_idx').on(table.userId, table.marketplacePlanId),
}));

// Tags table
export const planTagsTable = pgTable('plan_tags', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Marketplace Plan Tags (Junction)
export const marketplacePlanTagsTable = pgTable('marketplace_plan_tags', {
    planId: integer('plan_id').notNull().references(() => marketplacePlansTable.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').notNull().references(() => planTagsTable.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.planId, table.tagId] }),
}));

// Activity Log table - track user progress and interactions
export const activityLogTable = pgTable('activity_log_table', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
    planId: integer('plan_id').references(() => learningPlansTable.id, { onDelete: 'set null' }),
    todoId: integer('todo_id').references(() => todosTable.id, { onDelete: 'set null' }),
    activityType: text('activity_type').notNull(), // 'plan_created', 'todo_completed', 'message_sent', etc.
    description: text('description'),
    metadata: json('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
    conversations: many(conversationsTable),
    learningPlans: many(learningPlansTable),
    activityLogs: many(activityLogTable),
    uploads: many(uploadsTable),
}));

export const conversationsRelations = relations(conversationsTable, ({ one, many }) => ({
    user: one(usersTable, {
        fields: [conversationsTable.userId],
        references: [usersTable.id],
    }),
    messages: many(messagesTable),
    learningPlans: many(learningPlansTable),
    uploads: many(uploadsTable),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
    conversation: one(conversationsTable, {
        fields: [messagesTable.conversationId],
        references: [conversationsTable.id],
    }),
}));

export const learningPlansRelations = relations(learningPlansTable, ({ one, many }) => ({
    user: one(usersTable, {
        fields: [learningPlansTable.userId],
        references: [usersTable.id],
    }),
    conversation: one(conversationsTable, {
        fields: [learningPlansTable.conversationId],
        references: [conversationsTable.id],
    }),
    todos: many(todosTable),
    milestones: many(milestonesTable),
    activityLogs: many(activityLogTable),
}));

export const todosRelations = relations(todosTable, ({ one, many }) => ({
    plan: one(learningPlansTable, {
        fields: [todosTable.planId],
        references: [learningPlansTable.id],
    }),
    activityLogs: many(activityLogTable),
}));

export const milestonesRelations = relations(milestonesTable, ({ one }) => ({
    plan: one(learningPlansTable, {
        fields: [milestonesTable.planId],
        references: [learningPlansTable.id],
    }),
}));

export const activityLogRelations = relations(activityLogTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [activityLogTable.userId],
        references: [usersTable.id],
    }),
    plan: one(learningPlansTable, {
        fields: [activityLogTable.planId],
        references: [learningPlansTable.id],
    }),
    todo: one(todosTable, {
        fields: [activityLogTable.todoId],
        references: [todosTable.id],
    }),
}));

export const uploadsRelations = relations(uploadsTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [uploadsTable.userId],
        references: [usersTable.id],
    }),
    conversation: one(conversationsTable, {
        fields: [uploadsTable.conversationId],
        references: [conversationsTable.id],
    }),
}));

export const marketplacePlansRelations = relations(marketplacePlansTable, ({ one, many }) => ({
    plan: one(learningPlansTable, {
        fields: [marketplacePlansTable.planId],
        references: [learningPlansTable.id],
    }),
    user: one(usersTable, {
        fields: [marketplacePlansTable.userId],
        references: [usersTable.id],
    }),
    tags: many(marketplacePlanTagsTable),
    purchases: many(planPurchasesTable),
}));

export const planForksRelations = relations(planForksTable, ({ one }) => ({
    originalPlan: one(learningPlansTable, {
        fields: [planForksTable.originalPlanId],
        references: [learningPlansTable.id],
    }),
    forkedPlan: one(learningPlansTable, {
        fields: [planForksTable.forkedPlanId],
        references: [learningPlansTable.id],
    }),
    user: one(usersTable, {
        fields: [planForksTable.userId],
        references: [usersTable.id],
    }),
}));

export const planPurchasesRelations = relations(planPurchasesTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [planPurchasesTable.userId],
        references: [usersTable.id],
    }),
    marketplacePlan: one(marketplacePlansTable, {
        fields: [planPurchasesTable.marketplacePlanId],
        references: [marketplacePlansTable.id],
    }),
}));

export const planTagsRelations = relations(planTagsTable, ({ many }) => ({
    plans: many(marketplacePlanTagsTable),
}));

export const marketplacePlanTagsRelations = relations(marketplacePlanTagsTable, ({ one }) => ({
    plan: one(marketplacePlansTable, {
        fields: [marketplacePlanTagsTable.planId],
        references: [marketplacePlansTable.id],
    }),
    tag: one(planTagsTable, {
        fields: [marketplacePlanTagsTable.tagId],
        references: [planTagsTable.id],
    }),
}));


