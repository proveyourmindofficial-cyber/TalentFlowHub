import { sql } from "drizzle-orm";
import { pgTable, varchar, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Fresh Roles & Permissions Schema - Zoho Creator Style

// Custom Roles Table
export const customRoles = pgTable("custom_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366f1"), // hex color for UI
  isActive: boolean("is_active").default(true),
  userCount: varchar("user_count").default("0"), // cached count for performance
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Module Permissions - Granular control for each module
export const modulePermissions = pgTable("module_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => customRoles.id, { onDelete: "cascade" }),
  module: varchar("module", { length: 50 }).notNull(), // candidates, jobs, applications, etc.
  permissions: jsonb("permissions").$type<{
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
    bulk_actions: boolean;
  }>().default({
    view: false,
    add: false,
    edit: false,
    delete: false,
    export: false,
    import: false,
    bulk_actions: false,
  }),
  fieldRestrictions: jsonb("field_restrictions").$type<{
    restricted_fields: string[]; // for future field-level restrictions
    read_only_fields: string[];
  }>().default({
    restricted_fields: [],
    read_only_fields: [],
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Roles - Support multiple roles per user
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => customRoles.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
});

// Permission Templates - Predefined permission sets
export const permissionTemplates = pgTable("permission_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  template: jsonb("template").$type<{
    [module: string]: {
      view: boolean;
      add: boolean;
      edit: boolean;
      delete: boolean;
      export: boolean;
      import: boolean;
      bulk_actions: boolean;
    };
  }>(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas
export const insertCustomRoleSchema = createInsertSchema(customRoles);
export const insertModulePermissionSchema = createInsertSchema(modulePermissions);
export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertPermissionTemplateSchema = createInsertSchema(permissionTemplates);

// Types
export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = z.infer<typeof insertCustomRoleSchema>;
export type ModulePermission = typeof modulePermissions.$inferSelect;
export type InsertModulePermission = z.infer<typeof insertModulePermissionSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type PermissionTemplate = typeof permissionTemplates.$inferSelect;
export type InsertPermissionTemplate = z.infer<typeof insertPermissionTemplateSchema>;

// Module definitions for the application
export const APP_MODULES = {
  DASHBOARD: "dashboard",
  CANDIDATES: "candidates", 
  JOBS: "jobs",
  APPLICATIONS: "applications",
  INTERVIEWS: "interviews",
  OFFER_LETTERS: "offer_letters",
  CLIENTS: "clients",
  CLIENT_REQUIREMENTS: "client_requirements",
  REPORTS: "reports",
  SETTINGS: "settings",
  USER_MANAGEMENT: "user_management",
  ROLE_MANAGEMENT: "role_management",
} as const;

export type AppModule = typeof APP_MODULES[keyof typeof APP_MODULES];

// Permission action types
export const PERMISSION_ACTIONS = {
  VIEW: "view",
  ADD: "add", 
  EDIT: "edit",
  DELETE: "delete",
  EXPORT: "export",
  IMPORT: "import",
  BULK_ACTIONS: "bulk_actions",
} as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];