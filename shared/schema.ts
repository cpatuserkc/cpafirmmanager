import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema - Individual CPA/accountant users of the platform
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  profilePicture: text("profile_picture"),
  role: text("role").default("free").notNull(), // "free", "professional", "enterprise"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Firms schema - CPA practice entities (one user can be associated with multiple firms)
export const firms = pgTable("firms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ein: text("ein"), // Federal Employer Identification Number
  address: text("address"),
  city: text("city"),
  state: text("state"), 
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logo: text("logo"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertFirmSchema = createInsertSchema(firms).omit({
  id: true,
  createdAt: true,
});

// UserFirmRelationships - Many-to-many relationship between users and firms
export const userFirmRelationships = pgTable("user_firm_relationships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  role: text("role").default("owner").notNull(), // "owner", "manager", "employee"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserFirmRelationshipSchema = createInsertSchema(userFirmRelationships).omit({
  id: true,
  createdAt: true,
});

// Contacts schema - Individual people a firm interacts with
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  contactType: text("contact_type").default("client").notNull(), // "client", "prospect", "referral", etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

// Client Companies schema - Business entities that receive services
export const clientCompanies = pgTable("client_companies", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id), // Primary contact/owner
  name: text("name").notNull(),
  ein: text("ein"), // Federal Employer Identification Number
  industry: text("industry"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertClientCompanySchema = createInsertSchema(clientCompanies).omit({
  id: true,
  createdAt: true,
});

// Projects schema - Work performed for client companies
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  clientCompanyId: integer("client_company_id").notNull().references(() => clientCompanies.id),
  name: text("name").notNull(),
  description: text("description"),
  estimatedHours: numeric("estimated_hours"),
  status: text("status").default("active").notNull(), // "active", "completed", "pending"
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

// Time entries schema - Time recorded against projects (aggregate totals)
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  clientCompanyId: integer("client_company_id").notNull().references(() => clientCompanies.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  serviceId: integer("service_id").references(() => services.id),
  professionalRoleId: integer("professional_role_id").references(() => professionalRoles.id),
  tier: text("tier").default("mid"), // "top", "mid", "low"
  performedById: integer("performed_by_id").references(() => users.id), // Person who performed the work
  periodStart: timestamp("period_start"), // For reporting period
  periodEnd: timestamp("period_end"), // For reporting period
  dateEntered: timestamp("date_entered").defaultNow().notNull(),
  hours: numeric("hours").notNull(),
  rate: numeric("rate"), // Actual rate used
  cost: numeric("cost"), // hours × rate
  description: text("description"),
  status: text("status").default("recorded").notNull(), // "recorded", "billed", "reconciled"
  createdById: integer("created_by_id").notNull().references(() => users.id), // Person who entered the data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

// Professional Roles schema - Staff roles in the firm
export const professionalRoles = pgTable("professional_roles", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  name: text("name").notNull(), // "Accountant", "Tax Specialist", "Auditor", etc.
  description: text("description"),
  topTierRate: numeric("top_tier_rate").notNull(), // Base hourly rate for top tier
  midTierRatePercent: numeric("mid_tier_rate_percent").default("75").notNull(), // % of top tier (e.g., 75%)
  lowTierRatePercent: numeric("low_tier_rate_percent").default("50").notNull(), // % of top tier (e.g., 50%)
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertProfessionalRoleSchema = createInsertSchema(professionalRoles).omit({
  id: true,
  createdAt: true,
});

// Services schema - Services offered by the firm
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // "tax", "audit", "advisory", etc.
  defaultRoleId: integer("default_role_id").references(() => professionalRoles.id), // Default professional role
  defaultTier: text("default_tier").default("mid"), // "top", "mid", "low"
  jurisdictionFederal: boolean("jurisdiction_federal").default(false),
  jurisdictionState: text("jurisdiction_state"), // State code if applicable
  estimatedHours: numeric("estimated_hours"),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

// Proposals schema - Service proposals for client companies
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id), // Primary client contact
  clientCompanyId: integer("client_company_id").notNull().references(() => clientCompanies.id),
  title: text("title").notNull(),
  content: text("content"),
  estimatedHours: numeric("estimated_hours"),
  estimatedCost: numeric("estimated_cost"),
  status: text("status").default("draft").notNull(), // "draft", "sent", "accepted", "rejected"
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
});

// Proposal Services - Many-to-many between proposals and services
export const proposalServices = pgTable("proposal_services", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  professionalRoleId: integer("professional_role_id").references(() => professionalRoles.id),
  tier: text("tier").default("mid"), // "top", "mid", "low"
  quantity: numeric("quantity").default("1").notNull(),
  rate: numeric("rate"), // Calculated rate based on role and tier
  description: text("description"),
  estimatedHours: numeric("estimated_hours"),
  estimatedCost: numeric("estimated_cost"), // Pre-calculated hours × rate
  jurisdictionFederal: boolean("jurisdiction_federal").default(false),
  jurisdictionState: text("jurisdiction_state"), // State code if applicable
});

export const insertProposalServiceSchema = createInsertSchema(proposalServices).omit({
  id: true,
});

// Resources schema - Knowledge resources available on the platform
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

// Classifications schema - Classification systems
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

// Deadlines schema - Important dates for client work
export const deadlines = pgTable("deadlines", {
  id: serial("id").primaryKey(),
  firmId: integer("firm_id").notNull().references(() => firms.id),
  contactId: integer("contact_id").references(() => contacts.id),
  clientCompanyId: integer("client_company_id").references(() => clientCompanies.id),
  title: text("title").notNull(),
  dueDate: timestamp("due_date").notNull(),
  description: text("description"),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
});

export const insertDeadlineSchema = createInsertSchema(deadlines).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Firm = typeof firms.$inferSelect;
export type InsertFirm = z.infer<typeof insertFirmSchema>;

export type UserFirmRelationship = typeof userFirmRelationships.$inferSelect;
export type InsertUserFirmRelationship = z.infer<typeof insertUserFirmRelationshipSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type ClientCompany = typeof clientCompanies.$inferSelect;
export type InsertClientCompany = z.infer<typeof insertClientCompanySchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

export type ProfessionalRole = typeof professionalRoles.$inferSelect;
export type InsertProfessionalRole = z.infer<typeof insertProfessionalRoleSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type ProposalService = typeof proposalServices.$inferSelect;
export type InsertProposalService = z.infer<typeof insertProposalServiceSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Classification = typeof classifications.$inferSelect;
export type InsertClassification = z.infer<typeof insertClassificationSchema>;

export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = z.infer<typeof insertDeadlineSchema>;
