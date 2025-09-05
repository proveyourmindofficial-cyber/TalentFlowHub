import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum, boolean, numeric, date, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const jobStatusEnum = pgEnum('job_status', ['draft', 'active', 'closed', 'on_hold']);
export const jobTypeEnum = pgEnum('job_type', ['full_time', 'part_time', 'contract', 'internship']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent']);
export const candidateStatusEnum = pgEnum('candidate_status', ['Available', 'Email Sent', 'Interested', 'Not Interested', 'Interviewing', 'Offered', 'Offer Released', 'Joined', 'Rejected', 'Not Joined']);
export const candidateTypeEnum = pgEnum('candidate_type', ['internal', 'external']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'failed', 'not_required']);
export const screeningStatusEnum = pgEnum('screening_status', ['pending', 'scheduled', 'completed', 'passed', 'failed', 'not_required']);
export const applicationStageEnum = pgEnum('application_stage', ['Applied', 'Under Review', 'Shortlisted', 'L1 Scheduled', 'L2 Scheduled', 'Selected', 'Offer Released', 'Joined', 'Rejected', 'Rejected by Candidate', 'No Show', 'Not Joined', 'On Hold']);
export const interviewRoundEnum = pgEnum('interview_round', ['L1', 'L2', 'HR', 'Final']);
export const interviewModeEnum = pgEnum('interview_mode', ['Online', 'Offline']);
export const interviewStatusEnum = pgEnum('interview_status', ['Scheduled', 'Completed', 'Selected', 'Rejected', 'On Hold']);
export const interviewFeedbackEnum = pgEnum('interview_feedback', ['Selected', 'Rejected', 'On Hold', 'No Show']);
export const clientRequirementStatusEnum = pgEnum('client_requirement_status', ['open', 'closed', 'hold']);
export const emailProviderEnum = pgEnum('email_provider', ['smtp', 'sendgrid', 'outlook', 'gmail']);
export const emailStatusEnum = pgEnum('email_status', ['sent', 'delivered', 'failed', 'bounced', 'complained']);
export const permissionActionEnum = pgEnum('permission_action', ['view', 'add', 'edit', 'delete', 'approve', 'export', 'download', 'manage_workflow']);
export const notificationTypeEnum = pgEnum('notification_type', ['info', 'success', 'warning', 'error', 'system']);
export const activityActionEnum = pgEnum('activity_action', ['login', 'logout', 'create', 'update', 'delete', 'view', 'email_sent', 'export', 'import', 'status_change']);
export const feedbackTypeEnum = pgEnum('feedback_type', ['bug', 'feature', 'improvement', 'question', 'other']);
export const feedbackStatusEnum = pgEnum('feedback_status', ['open', 'in_progress', 'resolved', 'closed']);
export const feedbackPriorityEnum = pgEnum('feedback_priority', ['low', 'medium', 'high', 'urgent']);

// Remove old role system enum - we ONLY use custom roles now

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client Requirements table
export const clientRequirements = pgTable("client_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  reqNumber: varchar("req_number"),
  title: varchar("title").notNull(),
  skillset: text("skillset").array(),
  detailsText: text("details_text"),
  attachmentUrl: text("attachment_url"),
  status: clientRequirementStatusEnum("status").notNull().default('open'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email Providers table - for storing email configuration
export const emailProviders = pgTable("email_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  provider: emailProviderEnum("provider").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  
  // SMTP Configuration
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpSecure: boolean("smtp_secure").default(false),
  smtpUsername: varchar("smtp_username"),
  smtpPassword: varchar("smtp_password"),
  
  // API Configuration
  apiKey: varchar("api_key"),
  
  // From Details
  fromEmail: varchar("from_email").notNull(),
  fromName: varchar("from_name").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Templates table
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(), // Unique identifier like 'candidate_registration'
  name: varchar("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  isActive: boolean("is_active").notNull().default(true),
  category: varchar("category"), // e.g., 'application', 'interview', 'offer', 'rejection'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Logs table - for tracking sent emails
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  to: text("to").notNull(),
  cc: text("cc"),
  bcc: text("bcc"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  templateId: varchar("template_id").references(() => emailTemplates.id),
  templateData: text("template_data"), // JSON string
  provider: emailProviderEnum("provider").notNull(),
  messageId: varchar("message_id"),
  status: emailStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string for additional data
  sentAt: timestamp("sent_at").notNull(),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company Profile Table - Single company configuration
export const companyProfiles = pgTable("company_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companyLogo: varchar("company_logo", { length: 500 }),
  website: varchar("website", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  foundedYear: integer("founded_year"),
  companySize: varchar("company_size", { length: 50 }),
  description: text("description"),
  tagline: varchar("tagline", { length: 255 }),
  
  // Contact Information
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  
  // Address Information
  addressLine1: varchar("address_line1", { length: 255 }),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  
  // Social Media
  linkedinUrl: varchar("linkedin_url", { length: 255 }),
  twitterUrl: varchar("twitter_url", { length: 255 }),
  facebookUrl: varchar("facebook_url", { length: 255 }),
  
  // Email Configuration
  emailFromName: varchar("email_from_name", { length: 255 }),
  emailFromAddress: varchar("email_from_address", { length: 255 }),
  emailSignature: text("email_signature"),
  
  // System Fields
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Offer Letters table
export const offerLetters = pgTable("offer_letters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: 'cascade' }),
  
  // Basic Details
  designation: text("designation").notNull(),
  joiningDate: date("joining_date").notNull(),
  offerDate: date("offer_date").notNull().default(sql`CURRENT_DATE`),
  companyName: text("company_name").notNull().default('TalentFlow Solutions'),
  hrName: text("hr_name").notNull(),
  hrSignature: text("hr_signature"),
  
  // Salary Details
  ctc: numeric("ctc", { precision: 12, scale: 2 }).notNull(),
  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }).notNull(),
  hra: numeric("hra", { precision: 12, scale: 2 }).notNull(),
  conveyanceAllowance: numeric("conveyance_allowance", { precision: 12, scale: 2 }).default('0'),
  medicalAllowance: numeric("medical_allowance", { precision: 12, scale: 2 }).default('0'),
  flexiPay: numeric("flexi_pay", { precision: 12, scale: 2 }).default('0'),
  specialAllowance: numeric("special_allowance", { precision: 12, scale: 2 }).default('0'),
  employerPf: numeric("employer_pf", { precision: 12, scale: 2 }).notNull(),
  otherBenefits: numeric("other_benefits", { precision: 12, scale: 2 }).default('0'),
  
  // Deductions
  employeePf: numeric("employee_pf", { precision: 12, scale: 2 }).notNull(),
  professionalTax: numeric("professional_tax", { precision: 12, scale: 2 }).notNull().default('2400'),
  insurance: numeric("insurance", { precision: 12, scale: 2 }).default('6000'),
  incomeTax: numeric("income_tax", { precision: 12, scale: 2 }).default('0'),
  netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull(),
  grossSalary: numeric("gross_salary", { precision: 12, scale: 2 }),
  
  // Document Details
  templateUsed: text("template_used").default('default'),
  pdfUrl: text("pdf_url"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  
  // Audit
  generatedBy: varchar("generated_by").references(() => users.id),
  status: text("status").notNull().default('draft'), // draft, sent, accepted, rejected
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table - ONLY CUSTOM ROLES, NO OLD ROLE SYSTEM
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  department: varchar("department"),
  roleId: varchar("role_id").references(() => customRoles.id),
  passwordHash: varchar("password_hash"), // Added for secure password storage
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull().default('info'),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  actionUrl: varchar("action_url"), // Optional URL for clickable notifications
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  action: activityActionEnum("action").notNull(),
  resourceType: varchar("resource_type"), // 'job', 'candidate', 'application', 'user', etc.
  resourceId: varchar("resource_id"), // ID of the affected resource
  resourceName: varchar("resource_name"), // Name/title of the affected resource
  description: text("description").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string for additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Feedback System Tables
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  type: feedbackTypeEnum("type").notNull(),
  priority: feedbackPriorityEnum("priority").notNull(),
  status: feedbackStatusEnum("status").default("open").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  page: varchar("page"),
  userAgent: text("user_agent"),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: 'set null' }),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedbackComments = pgTable("feedback_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  feedbackId: varchar("feedback_id").references(() => feedback.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  comment: text("comment").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  department: varchar("department").notNull(),
  location: varchar("location"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  jobType: jobTypeEnum("job_type").notNull().default('full_time'),
  status: jobStatusEnum("status").notNull().default('draft'),
  priority: priorityEnum("priority").notNull().default('medium'),
  experienceLevel: varchar("experience_level"),
  skills: text("skills").array(),
  benefits: text("benefits"),
  applicationDeadline: timestamp("application_deadline"),
  isRemoteAvailable: boolean("is_remote_available").notNull().default(false),
  createdById: varchar("created_by_id").references(() => users.id),
  assignedRecruiterId: varchar("assigned_recruiter_id").references(() => users.id),
  clientId: varchar("client_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dropdown management tables
export const dropdownOptions = pgTable("dropdown_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category").notNull(), // 'skill_set', 'company', 'location', 'qualification', 'source'
  value: varchar("value").notNull(),
  label: varchar("label").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Skills master table
export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  category: varchar("category").notNull(), // technical, soft, domain
  defaultProficiency: integer("default_proficiency").default(1), // 1-5 scale
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidate skills relationship table  
export const candidateSkills = pgTable("candidate_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  skillId: varchar("skill_id").notNull().references(() => skills.id, { onDelete: 'cascade' }),
  proficiency: integer("proficiency").notNull(), // 1-5 scale
  yearsOfExperience: integer("years_of_experience").default(0),
  certified: boolean("certified").default(false),
  addedAt: timestamp("added_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Basic Information (Common for both Internal and External)
  candidateType: candidateTypeEnum("candidate_type").notNull().default('internal'),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  primarySkill: text("primary_skill").notNull(),
  totalExperience: numeric("total_experience", { precision: 4, scale: 1 }),
  relevantExperience: numeric("relevant_experience", { precision: 4, scale: 1 }),
  currentCompany: text("current_company"),
  currentLocation: text("current_location"),
  preferredLocation: text("preferred_location"),
  currentCtc: numeric("current_ctc", { precision: 10, scale: 2 }),
  expectedCtc: numeric("expected_ctc", { precision: 10, scale: 2 }),
  noticePeriod: text("notice_period"),
  tentativeDoj: date("tentative_doj"),
  resumeUrl: text("resume_url"),
  notes: text("notes"),
  status: candidateStatusEnum("status").notNull().default('Available'),
  
  // External Candidate Specific Fields
  serialNumber: integer("serial_number"), // Auto-generated sequence for external candidates
  registrationDate: date("registration_date").default(sql`CURRENT_DATE`),
  recruiterName: varchar("recruiter_name"),
  source: varchar("source"), // Naukri, LinkedIn, etc.
  clientName: varchar("client_name"),
  skillSet: text("skill_set").array(),
  uanNumber: varchar("uan_number", { length: 12 }),
  jobLocation: text("job_location"),
  highestQualification: varchar("highest_qualification"),
  linkedinUrl: varchar("linkedin_url"),
  linkedinVerificationStatus: verificationStatusEnum("linkedin_verification_status").default('not_required'),
  aadhaarNumber: varchar("aadhaar_number", { length: 12 }), // Encrypted storage
  aadhaarVerificationStatus: verificationStatusEnum("aadhaar_verification_status").default('not_required'),
  managerScreeningStatus: screeningStatusEnum("manager_screening_status").default('not_required'),
  managerScreeningVideoUrl: varchar("manager_screening_video_url"),
  lastWorkingDay: date("last_working_day"),
  
  // Enhanced document storage for structured data
  educationData: json("education_data").default([]),
  employmentData: json("employment_data").default([]),
  identityData: json("identity_data").default({}),
  additionalData: json("additional_data").default({}),
  
  // Document Management (legacy - keeping for backward compatibility)
  documentsUrls: text("documents_urls").array().default(sql`ARRAY[]::text[]`),
  
  // Email workflow fields
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  responseToken: text("response_token"), // Unique token for email responses
  candidateResponse: text("candidate_response"), // "interested", "not_interested", null
  responseAt: timestamp("response_at"),
  responseFeedback: text("response_feedback"), // Feedback from candidate
  
  // Candidate Portal Authentication Fields
  password: text("password"), // Hashed password for portal login
  isPortalActive: boolean("is_portal_active").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  portalToken: text("portal_token"), // For session management
  tokenExpiresAt: timestamp("token_expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidate Sessions table for portal authentication
export const candidateSessions = pgTable("candidate_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// OLD ROLE SYSTEM COMPLETELY REMOVED - WE ONLY USE CUSTOM ROLES NOW

// Custom Roles & Permissions System - Zoho Creator Style
export const customRoles = pgTable("custom_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366f1"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customRolePermissions = pgTable("custom_role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => customRoles.id, { onDelete: "cascade" }),
  module: varchar("module", { length: 50 }).notNull(),
  permissions: json("permissions").$type<{
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
  }>().default({
    view: false,
    add: false,
    edit: false,
    delete: false,
    export: false,
    import: false,
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userCustomRoles = pgTable("user_custom_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customRoleId: varchar("custom_role_id").notNull().references(() => customRoles.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
});

// Applications table
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  stage: applicationStageEnum("stage").notNull().default('Applied'),
  feedback: text("feedback"),
  scheduledDate: timestamp("scheduled_date"),
  candidateResponse: varchar("candidate_response").default('pending'),
  responseFeedback: text("response_feedback"),
  responseToken: varchar("response_token"),
  responseAt: timestamp("response_at"),
  jdEmailSentAt: timestamp("jd_email_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interviews table
export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: 'cascade' }),
  interviewRound: interviewRoundEnum("interview_round").notNull(),
  interviewer: text("interviewer").notNull(),
  mode: interviewModeEnum("mode").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  notes: text("notes"),
  feedbackResult: interviewFeedbackEnum("feedback_result"),
  status: interviewStatusEnum("status").notNull().default('Scheduled'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  createdJobs: many(jobs, { relationName: "job_creator" }),
  assignedJobs: many(jobs, { relationName: "job_recruiter" }),
  addedCandidates: many(candidates),
  assignedApplications: many(applications),
  customRoleAssignment: one(userCustomRoles, {
    fields: [users.id],
    references: [userCustomRoles.userId],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [jobs.createdById],
    references: [users.id],
    relationName: "job_creator",
  }),
  assignedRecruiter: one(users, {
    fields: [jobs.assignedRecruiterId],
    references: [users.id],
    relationName: "job_recruiter",
  }),
  applications: many(applications),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  applications: many(applications),
  sessions: many(candidateSessions),
}));

export const candidateSessionsRelations = relations(candidateSessions, ({ one }) => ({
  candidate: one(candidates, {
    fields: [candidateSessions.candidateId],
    references: [candidates.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}));

export const offerLettersRelations = relations(offerLetters, ({ one }) => ({
  candidate: one(candidates, {
    fields: [offerLetters.candidateId],
    references: [candidates.id],
  }),
  job: one(jobs, {
    fields: [offerLetters.jobId],
    references: [jobs.id],
  }),
  application: one(applications, {
    fields: [offerLetters.applicationId],
    references: [applications.id],
  }),
  generatedByUser: one(users, {
    fields: [offerLetters.generatedBy],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  requirements: many(clientRequirements),
}));

export const clientRequirementsRelations = relations(clientRequirements, ({ one }) => ({
  client: one(clients, {
    fields: [clientRequirements.clientId],
    references: [clients.id],
  }),
  createdByUser: one(users, {
    fields: [clientRequirements.createdBy],
    references: [users.id],
  }),
}));

// OLD ROLE SYSTEM RELATIONS REMOVED - ONLY CUSTOM ROLES NOW

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  password: true,
  portalToken: true,
  tokenExpiresAt: true,
  lastLoginAt: true,
});

export const insertCandidateSessionSchema = createInsertSchema(candidateSessions).omit({
  id: true,
  createdAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfferLetterSchema = createInsertSchema(offerLetters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertClientRequirementSchema = createInsertSchema(clientRequirements).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type OfferLetter = typeof offerLetters.$inferSelect;
export type InsertOfferLetter = z.infer<typeof insertOfferLetterSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type ClientRequirement = typeof clientRequirements.$inferSelect;
export type InsertClientRequirement = z.infer<typeof insertClientRequirementSchema>;

export type DropdownOption = typeof dropdownOptions.$inferSelect;
export type InsertDropdownOption = typeof dropdownOptions.$inferInsert;

// Skills types
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;
export type CandidateSkill = typeof candidateSkills.$inferSelect;
export type InsertCandidateSkill = typeof candidateSkills.$inferInsert;

// Extended types with relations
export type JobWithRelations = Job & {
  createdBy?: User;
  assignedRecruiter?: User;
  applications?: ApplicationWithRelations[];
};

export type ApplicationWithRelations = Application & {
  job?: Job;
  candidate?: Candidate;
  assignedRecruiter?: User;
  interviews?: Interview[];
};

export type ClientRequirementWithRelations = ClientRequirement & {
  client?: Client;
  createdByUser?: User;
};

// Email provider schemas
export const insertEmailProviderSchema = createInsertSchema(emailProviders);
export const upsertEmailProviderSchema = insertEmailProviderSchema.partial().required({ id: true });

export type InsertEmailProvider = z.infer<typeof insertEmailProviderSchema>;
export type EmailProvider = typeof emailProviders.$inferSelect;
export type UpsertEmailProvider = z.infer<typeof upsertEmailProviderSchema>;

// Email template schemas
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);
export const upsertEmailTemplateSchema = insertEmailTemplateSchema.partial().required({ id: true });

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type UpsertEmailTemplate = z.infer<typeof upsertEmailTemplateSchema>;

// Email log schemas
export const insertEmailLogSchema = createInsertSchema(emailLogs);

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

// Company profile schemas
export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type CompanyProfile = typeof companyProfiles.$inferSelect;

// Candidate portal types
export type CandidateSession = typeof candidateSessions.$inferSelect;
export type InsertCandidateSession = z.infer<typeof insertCandidateSessionSchema>;

// Candidate portal authentication schemas
export const candidateLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const candidateRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type CandidateLogin = z.infer<typeof candidateLoginSchema>;
export type CandidateRegistration = z.infer<typeof candidateRegistrationSchema>;

// Role Permission System Schemas
// OLD ROLE SYSTEM INSERT SCHEMAS REMOVED

// OLD ROLE SYSTEM TYPES REMOVED

// Custom Roles Schemas
export const insertCustomRoleSchema = createInsertSchema(customRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomRolePermissionSchema = createInsertSchema(customRolePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCustomRoleSchema = createInsertSchema(userCustomRoles).omit({
  id: true,
  assignedAt: true,
});

export type InsertCustomRole = z.infer<typeof insertCustomRoleSchema>;
export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRolePermission = z.infer<typeof insertCustomRolePermissionSchema>;
export type CustomRolePermission = typeof customRolePermissions.$inferSelect;
export type InsertUserCustomRole = z.infer<typeof insertUserCustomRoleSchema>;
export type UserCustomRole = typeof userCustomRoles.$inferSelect;

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Activity log schemas
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Feedback schemas
export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments).omit({
  id: true,
  createdAt: true,
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;
export type FeedbackComment = typeof feedbackComments.$inferSelect;
