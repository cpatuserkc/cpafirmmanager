import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyName: text("company_name"),
  role: text("role").default("free").notNull(), // "free", "professional", "enterprise"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Clients schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  industry: text("industry"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
});

// Projects schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  estimatedHours: numeric("estimated_hours"),
  status: text("status").default("active").notNull(), // "active", "completed", "pending"
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// Time entries schema
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  date: timestamp("date").defaultNow().notNull(),
  hours: numeric("hours").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(), // "pending", "billed", "in_progress"
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
});

// Proposals schema
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  title: text("title").notNull(),
  content: text("content"),
  estimatedHours: numeric("estimated_hours"),
  estimatedCost: numeric("estimated_cost"),
  status: text("status").default("draft").notNull(), // "draft", "sent", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
});

// Resources schema
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "template", "guide", "tool", etc.
  accessLevel: text("access_level").default("free").notNull(), // "free", "premium"
  downloadUrl: text("download_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

// Classifications schema
export const classifications = pgTable("classifications", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  details: jsonb("details"),
  accessLevel: text("access_level").default("free").notNull(), // "free", "premium"
});

export const insertClassificationSchema = createInsertSchema(classifications).omit({
  id: true,
});

// Deadlines schema
export const deadlines = pgTable("deadlines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  title: text("title").notNull(),
  dueDate: timestamp("due_date").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false).notNull(),
});

export const insertDeadlineSchema = createInsertSchema(deadlines).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Classification = typeof classifications.$inferSelect;
export type InsertClassification = z.infer<typeof insertClassificationSchema>;

export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = z.infer<typeof insertDeadlineSchema>;
