import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const gainModeEnum = pgEnum('gain_mode', ['auto', 'manual', 'projects'])

// ─── Timestamps helper ────────────────────────────────────────────────────────

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}

// ─── Account types ────────────────────────────────────────────────────────────

export const accountTypes = pgTable('account_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366F1'),
  icon: text('icon').notNull().default('wallet'),
  ...timestamps,
})

// ─── Asset classes ────────────────────────────────────────────────────────────

export const assetClasses = pgTable('asset_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#10B981'),
  ...timestamps,
})

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  accountTypeId: uuid('account_type_id').references(() => accountTypes.id),
  assetClassId: uuid('asset_class_id').references(() => assetClasses.id),
  parentAccountId: uuid('parent_account_id'),
  gainMode: gainModeEnum('gain_mode').notNull().default('auto'),
  color: text('color').notNull().default('#6366F1'),
  icon: text('icon').notNull().default('wallet'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  parentCategoryId: uuid('parent_category_id'),
  color: text('color').notNull().default('#6366F1'),
  icon: text('icon').notNull().default('tag'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

// ─── Groups ───────────────────────────────────────────────────────────────────

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  parentGroupId: uuid('parent_group_id'),
  color: text('color').notNull().default('#06B6D4'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#8B5CF6'),
  ...timestamps,
})

// ─── Income sources ───────────────────────────────────────────────────────────

export const incomeSources = pgTable('income_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#10B981'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
})

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  groupId: uuid('group_id').references(() => groups.id),
  accountId: uuid('account_id').references(() => accounts.id),
  description: text('description'),
  prescindible: boolean('prescindible').notNull().default(false),
  ...timestamps,
})

// ─── Transaction tags ─────────────────────────────────────────────────────────

export const transactionTags = pgTable('transaction_tags', {
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id),
  tagId: uuid('tag_id').notNull().references(() => tags.id),
})

// ─── Incomes ──────────────────────────────────────────────────────────────────

export const incomes = pgTable('incomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  budgetMonth: timestamp('budget_month', { withTimezone: true }).notNull(),
  incomeSourceId: uuid('income_source_id').references(() => incomeSources.id),
  description: text('description'),
  ...timestamps,
})

// ─── Account movements ────────────────────────────────────────────────────────

export const accountMovements = pgTable('account_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromAccountId: uuid('from_account_id').references(() => accounts.id),
  toAccountId: uuid('to_account_id').references(() => accounts.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  description: text('description'),
  ...timestamps,
})

// ─── Monthly snapshots ────────────────────────────────────────────────────────

export const monthlySnapshots = pgTable('monthly_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  month: timestamp('month', { withTimezone: true }).notNull(),
  openingBalance: numeric('opening_balance', { precision: 12, scale: 2 }).notNull(),
  closingBalance: numeric('closing_balance', { precision: 12, scale: 2 }).notNull(),
  contributions: numeric('contributions', { precision: 12, scale: 2 }).notNull().default('0'),
  gainManual: numeric('gain_manual', { precision: 12, scale: 2 }),
  ...timestamps,
})

// ─── Budgets ──────────────────────────────────────────────────────────────────

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  month: timestamp('month', { withTimezone: true }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  assetClassId: uuid('asset_class_id').references(() => assetClasses.id),
  plannedAmount: numeric('planned_amount', { precision: 12, scale: 2 }).notNull(),
  ...timestamps,
})

// ─── Civislend projects ───────────────────────────────────────────────────────

export const civislendProjects = pgTable('civislend_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  capital: numeric('capital', { precision: 12, scale: 2 }).notNull(),
  returnedCapital: numeric('returned_capital', { precision: 12, scale: 2 }),
  interest: numeric('interest', { precision: 12, scale: 2 }),
  ...timestamps,
})
