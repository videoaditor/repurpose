import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  username: text('username').notNull(),
  api_key: text('api_key').notNull(),
  color: text('color').notNull().default('#6366f1'),
  platforms: text('platforms', { mode: 'json' }).$type<string[]>().notNull(),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  account_id: integer('account_id').notNull().references(() => accounts.id),
  request_id: text('request_id'),
  title: text('title').notNull(),
  base_caption: text('base_caption'),
  platforms: text('platforms', { mode: 'json' }).$type<string[]>().notNull(),
  status: text('status').notNull().default('pending'),
  posted_at: text('posted_at'),
  created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  post_urls: text('post_urls', { mode: 'json' }).$type<Record<string, string>>(),
});

export const captions = sqliteTable('captions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  post_id: integer('post_id').notNull().references(() => posts.id),
  platform: text('platform').notNull(),
  caption: text('caption').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
});

export type Account = typeof accounts.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Caption = typeof captions.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type NewPost = typeof posts.$inferInsert;
export type NewCaption = typeof captions.$inferInsert;
