import {
  users,
  jobs,
  candidates,
  candidateSessions,
  applications,
  interviews,
  offerLetters,
  clients,
  clientRequirements,
  notifications,
  activityLogs,
  feedback,
  feedbackComments,
  type User,
  type InsertUser,
  type Job,
  type InsertJob,
  type JobWithRelations,
  type Candidate,
  type InsertCandidate,
  type CandidateSession,
  type InsertCandidateSession,
  type Application,
  type InsertApplication,
  type ApplicationWithRelations,
  type Interview,
  type InsertInterview,
  type OfferLetter,
  type InsertOfferLetter,
  type Client,
  type InsertClient,
  type ClientRequirement,
  type InsertClientRequirement,
  type ClientRequirementWithRelations,
  type Notification,
  type InsertNotification,
  type ActivityLog,
  type InsertActivityLog,
  type Feedback,
  type InsertFeedback,
  type FeedbackComment,
  type InsertFeedbackComment,
  emailProviders,
  type EmailProvider,
  type InsertEmailProvider,
  emailTemplates,
  type EmailTemplate,
  type InsertEmailTemplate,
  emailLogs,
  type EmailLog,
  type InsertEmailLog,
  companyProfiles,
  type CompanyProfile,
  type InsertCompanyProfile,
  userJourneyStates,
  type UserJourneyState,
  type InsertUserJourneyState,
  dropdownOptions,
  type DropdownOption,
  type InsertDropdownOption,
  // OLD ROLE SYSTEM TYPES REMOVED
  customRoles,
  type CustomRole,
  type InsertCustomRole,
  customRolePermissions,
  type CustomRolePermission,
  type InsertCustomRolePermission,
  userCustomRoles,
  type UserCustomRole,
  type InsertUserCustomRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, inArray, lt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersWithCustomRoles(): Promise<any[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: string, password: string): Promise<void>;
  deleteUser(id: string): Promise<void>;

  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<JobWithRelations | undefined>;
  getJobs(): Promise<JobWithRelations[]>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  bulkDeleteJobs(ids: string[]): Promise<void>;
  getJobsByStatus(status: string): Promise<Job[]>;

  // Candidate operations
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidate(id: string): Promise<Candidate | undefined>;
  getCandidates(): Promise<Candidate[]>;
  getCandidateByEmail(email: string): Promise<Candidate | undefined>;
  updateCandidate(id: string, candidate: Partial<Candidate>): Promise<Candidate>;
  deleteCandidate(id: string): Promise<void>;
  bulkDeleteCandidates(ids: string[]): Promise<void>;
  
  // Dropdown management operations
  getDropdownOptions(category: string): Promise<DropdownOption[]>;
  createDropdownOption(option: InsertDropdownOption): Promise<DropdownOption>;

  // Candidate portal session operations
  createCandidateSession(session: InsertCandidateSession): Promise<CandidateSession>;
  getCandidateSessionByToken(token: string): Promise<CandidateSession | undefined>;
  deleteCandidateSession(id: string): Promise<void>;
  deleteExpiredCandidateSessions(): Promise<void>;

  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplication(id: string): Promise<ApplicationWithRelations | undefined>;
  getApplications(): Promise<ApplicationWithRelations[]>;
  updateApplication(id: string, application: Partial<InsertApplication>): Promise<Application>;
  deleteApplication(id: string): Promise<void>;
  bulkDeleteApplications(ids: string[]): Promise<void>;
  getApplicationsByJob(jobId: string): Promise<ApplicationWithRelations[]>;
  getApplicationsByCandidate(candidateId: string): Promise<ApplicationWithRelations[]>;
  getApplicationWithRelations(id: string): Promise<ApplicationWithRelations | undefined>;

  // Interview operations
  createInterview(interview: InsertInterview): Promise<Interview>;
  getInterview(id: string): Promise<Interview | undefined>;
  getInterviews(): Promise<Interview[]>;
  updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview>;
  deleteInterview(id: string): Promise<void>;
  bulkDeleteInterviews(ids: string[]): Promise<void>;
  getInterviewWithRelations(id: string): Promise<any>;

  // Offer Letter operations
  createOfferLetter(offerLetter: InsertOfferLetter): Promise<OfferLetter>;
  getOfferLetter(id: string): Promise<OfferLetter | undefined>;
  getOfferLetters(): Promise<OfferLetter[]>;
  getOfferLettersByApplication(applicationId: string): Promise<OfferLetter[]>;
  updateOfferLetter(id: string, offerLetter: Partial<InsertOfferLetter>): Promise<OfferLetter>;
  deleteOfferLetter(id: string): Promise<void>;
  bulkDeleteOfferLetters(ids: string[]): Promise<void>;
  getOfferLetterWithRelations(id: string): Promise<any>;

  // Client operations
  createClient(client: InsertClient): Promise<Client>;
  getClient(id: string): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Client Requirement operations
  createClientRequirement(requirement: InsertClientRequirement): Promise<ClientRequirement>;
  getClientRequirement(id: string): Promise<ClientRequirementWithRelations | undefined>;
  getClientRequirements(): Promise<ClientRequirementWithRelations[]>;
  updateClientRequirement(id: string, requirement: Partial<InsertClientRequirement>): Promise<ClientRequirement>;
  deleteClientRequirement(id: string): Promise<void>;
  bulkDeleteClientRequirements(ids: string[]): Promise<void>;

  // Email Provider operations
  createEmailProvider(provider: InsertEmailProvider): Promise<EmailProvider>;
  getEmailProvider(id: string): Promise<EmailProvider | undefined>;
  getEmailProviders(): Promise<EmailProvider[]>;
  updateEmailProvider(id: string, provider: Partial<InsertEmailProvider>): Promise<EmailProvider>;
  deleteEmailProvider(id: string): Promise<void>;
  
  // Email Template operations
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;
  
  // Email Log operations
  createEmailLog(log: InsertEmailLog): Promise<EmailLog>;
  updateEmailLog(id: string, log: Partial<InsertEmailLog>): Promise<EmailLog>;
  
  // Company Profile operations
  getCompanyProfile(): Promise<CompanyProfile | undefined>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: string, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile>;
  getEmailLog(id: string): Promise<EmailLog | undefined>;
  getEmailLogs(): Promise<EmailLog[]>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // Activity Log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(limit?: number, offset?: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: string, limit?: number): Promise<ActivityLog[]>;
  getActivityLogsCount(): Promise<number>;

  // User Journey State operations
  createUserJourneyState(state: InsertUserJourneyState): Promise<UserJourneyState>;
  getUserJourneyState(userId: string): Promise<UserJourneyState | undefined>;
  updateUserJourneyState(userId: string, state: Partial<InsertUserJourneyState>): Promise<UserJourneyState>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    activeJobs: number;
    totalCandidates: number;
    pendingApplications: number;
    todayInterviews: number;
  }>;


  // Custom Roles operations
  getCustomRoles(): Promise<CustomRole[]>;
  getCustomRole(id: string): Promise<CustomRole | undefined>;
  createCustomRole(role: InsertCustomRole): Promise<CustomRole>;
  updateCustomRole(id: string, role: Partial<InsertCustomRole>): Promise<CustomRole>;
  deleteCustomRole(id: string): Promise<void>;
  getUserCountByCustomRole(roleId: string): Promise<number>;

  // Custom Role Permissions operations
  getCustomRolePermissions(roleId: string): Promise<CustomRolePermission[]>;
  createCustomRolePermission(permission: InsertCustomRolePermission): Promise<CustomRolePermission>;
  updateCustomRolePermission(roleId: string, module: string, permissions: any): Promise<CustomRolePermission>;
  deleteCustomRolePermissions(roleId: string): Promise<void>;

  // User Custom Role Assignment operations
  assignCustomRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<UserCustomRole>;
  removeCustomRoleFromUser(userId: string): Promise<void>;
  getUserCustomRole(userId: string): Promise<UserCustomRole | undefined>;
  getUsersByCustomRole(roleId: string): Promise<User[]>;

  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(id: string): Promise<Feedback | undefined>;
  getFeedbackList(filters?: any): Promise<Feedback[]>;
  updateFeedback(id: string, feedback: Partial<InsertFeedback>): Promise<Feedback>;
  deleteFeedback(id: string): Promise<void>;

  // Feedback comments operations
  createFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment>;
  getFeedbackComments(feedbackId: string): Promise<FeedbackComment[]>;
  deleteFeedbackComment(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Get users with their assigned custom roles
  async getUsersWithCustomRoles(): Promise<any[]> {
    const result = await db
      .select({
        user: users,
        customRole: customRoles,
      })
      .from(users)
      .leftJoin(userCustomRoles, eq(users.id, userCustomRoles.userId))
      .leftJoin(customRoles, eq(userCustomRoles.customRoleId, customRoles.id))
      .orderBy(desc(users.createdAt));

    return result.map(({ user, customRole }) => ({
      ...user,
      customRole: customRole || null,
    }));
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    await db.update(users)
      .set({ passwordHash: password })
      .where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Job operations
  async createJob(jobData: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(jobData).returning();
    return job;
  }

  async getJob(id: string): Promise<JobWithRelations | undefined> {
    const [job] = await db
      .select()
      .from(jobs)
      .leftJoin(users, eq(jobs.createdById, users.id))
      .where(eq(jobs.id, id));
    
    if (!job) return undefined;

    return {
      ...job.jobs,
      createdBy: job.users || undefined,
    };
  }

  async getJobs(): Promise<JobWithRelations[]> {
    const jobsData = await db
      .select()
      .from(jobs)
      .leftJoin(users, eq(jobs.createdById, users.id))
      .orderBy(desc(jobs.createdAt));

    return jobsData.map(row => ({
      ...row.jobs,
      createdBy: row.users || undefined,
    }));
  }

  async updateJob(id: string, jobData: Partial<InsertJob>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ ...jobData, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async deleteJob(id: string): Promise<void> {
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  async bulkDeleteJobs(ids: string[]): Promise<void> {
    await db.delete(jobs).where(inArray(jobs.id, ids));
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.status, status as any));
  }

  // Candidate operations
  async createCandidate(candidateData: InsertCandidate): Promise<Candidate> {
    let data = { ...candidateData };
    
    // Auto-generate serial number for external candidates
    if (candidateData.candidateType === 'external') {
      // Get the next serial number based on existing candidates
      const [lastCandidate] = await db
        .select({ serialNumber: candidates.serialNumber })
        .from(candidates)
        .where(eq(candidates.candidateType, 'external'))
        .orderBy(desc(candidates.serialNumber))
        .limit(1);
      
      data.serialNumber = (lastCandidate?.serialNumber || 0) + 1;
    }
    
    const [candidate] = await db.insert(candidates).values(data).returning();
    return candidate;
  }

  async getCandidate(id: string): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate;
  }

  async getCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates).orderBy(desc(candidates.createdAt));
  }

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.email, email));
    return candidate;
  }

  async updateCandidate(id: string, candidateData: Partial<Candidate>): Promise<Candidate> {
    const [candidate] = await db
      .update(candidates)
      .set(candidateData as any)
      .where(eq(candidates.id, id))
      .returning();
    return candidate;
  }

  async deleteCandidate(id: string): Promise<void> {
    await db.delete(candidates).where(eq(candidates.id, id));
  }

  async bulkDeleteCandidates(ids: string[]): Promise<void> {
    await db.delete(candidates).where(inArray(candidates.id, ids));
  }

  // Candidate portal session operations
  async createCandidateSession(sessionData: InsertCandidateSession): Promise<CandidateSession> {
    const [session] = await db.insert(candidateSessions).values(sessionData).returning();
    return session;
  }

  async getCandidateSessionByToken(token: string): Promise<CandidateSession | undefined> {
    const [session] = await db.select().from(candidateSessions).where(eq(candidateSessions.sessionToken, token));
    return session;
  }

  async deleteCandidateSession(id: string): Promise<void> {
    await db.delete(candidateSessions).where(eq(candidateSessions.id, id));
  }

  async deleteExpiredCandidateSessions(): Promise<void> {
    await db.delete(candidateSessions).where(lt(candidateSessions.expiresAt, new Date()));
  }

  // Dropdown management operations
  async getDropdownOptions(category: string): Promise<DropdownOption[]> {
    return await db.select().from(dropdownOptions)
      .where(and(eq(dropdownOptions.category, category), eq(dropdownOptions.isActive, true)))
      .orderBy(dropdownOptions.label);
  }

  async createDropdownOption(optionData: InsertDropdownOption): Promise<DropdownOption> {
    const [option] = await db.insert(dropdownOptions).values(optionData).returning();
    return option;
  }

  // Application operations
  async createApplication(applicationData: InsertApplication): Promise<Application> {
    const [application] = await db.insert(applications).values(applicationData).returning();
    return application;
  }

  async getApplication(id: string): Promise<ApplicationWithRelations | undefined> {
    const [app] = await db
      .select()
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(candidates, eq(applications.candidateId, candidates.id))
      .where(eq(applications.id, id));

    if (!app) return undefined;

    return {
      ...app.applications,
      job: app.jobs || undefined,
      candidate: app.candidates || undefined,
    };
  }

  async getApplications(): Promise<ApplicationWithRelations[]> {
    const appsData = await db
      .select()
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(candidates, eq(applications.candidateId, candidates.id))
      .orderBy(desc(applications.createdAt));

    return appsData.map(row => ({
      ...row.applications,
      job: row.jobs || undefined,
      candidate: row.candidates || undefined,
    }));
  }

  async getApplicationsWithRelations(): Promise<ApplicationWithRelations[]> {
    return this.getApplications();
  }

  async updateApplication(id: string, applicationData: Partial<InsertApplication>): Promise<Application> {
    const [application] = await db
      .update(applications)
      .set({ ...applicationData, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async deleteApplication(id: string): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  async bulkDeleteApplications(ids: string[]): Promise<void> {
    await db.delete(applications).where(inArray(applications.id, ids));
  }

  async bulkUpdateApplications(ids: string[], updates: Partial<InsertApplication>): Promise<void> {
    await db
      .update(applications)
      .set({ ...updates, updatedAt: new Date() })
      .where(inArray(applications.id, ids));
  }

  async getApplicationsByJob(jobId: string): Promise<ApplicationWithRelations[]> {
    const appsData = await db
      .select()
      .from(applications)
      .leftJoin(candidates, eq(applications.candidateId, candidates.id))
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.createdAt));

    return appsData.map(row => ({
      ...row.applications,
      candidate: row.candidates || undefined,
    }));
  }

  async getApplicationsByCandidate(candidateId: string): Promise<ApplicationWithRelations[]> {
    const appsData = await db
      .select()
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.candidateId, candidateId))
      .orderBy(desc(applications.createdAt));

    return appsData.map(row => ({
      ...row.applications,
      job: row.jobs || undefined,
    }));
  }

  // Interview operations
  async createInterview(interviewData: InsertInterview): Promise<Interview> {
    const [interview] = await db.insert(interviews).values(interviewData).returning();
    return interview;
  }

  async getInterview(id: string): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async getInterviews(): Promise<Interview[]> {
    return await db.select().from(interviews).orderBy(desc(interviews.scheduledDate));
  }

  async updateInterview(id: string, interviewData: Partial<InsertInterview>): Promise<Interview> {
    const [interview] = await db
      .update(interviews)
      .set({ ...interviewData, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();
    return interview;
  }

  async deleteInterview(id: string): Promise<void> {
    await db.delete(interviews).where(eq(interviews.id, id));
  }

  async bulkDeleteInterviews(ids: string[]): Promise<void> {
    await db.delete(interviews).where(inArray(interviews.id, ids));
  }

  // Offer Letter operations
  async createOfferLetter(offerLetterData: InsertOfferLetter): Promise<OfferLetter> {
    const [offerLetter] = await db.insert(offerLetters).values(offerLetterData).returning();
    return offerLetter;
  }

  async getOfferLetter(id: string): Promise<OfferLetter | undefined> {
    const [offerLetter] = await db.select().from(offerLetters).where(eq(offerLetters.id, id));
    return offerLetter;
  }

  async getOfferLetters(): Promise<any[]> {
    return await db
      .select({
        id: offerLetters.id,
        applicationId: offerLetters.applicationId,
        candidateId: offerLetters.candidateId,
        ctc: offerLetters.ctc,
        designation: offerLetters.designation,
        joiningDate: offerLetters.joiningDate,
        offerDate: offerLetters.offerDate,
        // Salary breakdown fields
        basicSalary: offerLetters.basicSalary,
        hra: offerLetters.hra,
        conveyanceAllowance: offerLetters.conveyanceAllowance,
        medicalAllowance: offerLetters.medicalAllowance,
        status: offerLetters.status,
        createdAt: offerLetters.createdAt,
        updatedAt: offerLetters.updatedAt,
        candidate: {
          name: candidates.name,
          email: candidates.email,
          currentLocation: candidates.currentLocation
        }
      })
      .from(offerLetters)
      .leftJoin(candidates, eq(offerLetters.candidateId, candidates.id))
      .orderBy(desc(offerLetters.createdAt));
  }

  async getOfferLettersByApplication(applicationId: string): Promise<OfferLetter[]> {
    return await db.select().from(offerLetters).where(eq(offerLetters.applicationId, applicationId));
  }

  async updateOfferLetter(id: string, offerLetterData: Partial<InsertOfferLetter>): Promise<OfferLetter> {
    const [offerLetter] = await db
      .update(offerLetters)
      .set({ ...offerLetterData, updatedAt: new Date() })
      .where(eq(offerLetters.id, id))
      .returning();
    return offerLetter;
  }

  async deleteOfferLetter(id: string): Promise<void> {
    await db.delete(offerLetters).where(eq(offerLetters.id, id));
  }

  async bulkDeleteOfferLetters(ids: string[]): Promise<void> {
    await db.delete(offerLetters).where(inArray(offerLetters.id, ids));
  }

  // Client operations
  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async updateClient(id: string, clientData: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Client Requirement operations
  async createClientRequirement(requirementData: InsertClientRequirement): Promise<ClientRequirement> {
    const [requirement] = await db.insert(clientRequirements).values(requirementData).returning();
    return requirement;
  }

  async getClientRequirement(id: string): Promise<ClientRequirementWithRelations | undefined> {
    const [requirement] = await db
      .select()
      .from(clientRequirements)
      .leftJoin(clients, eq(clientRequirements.clientId, clients.id))
      .leftJoin(users, eq(clientRequirements.createdBy, users.id))
      .where(eq(clientRequirements.id, id));
    
    if (!requirement) return undefined;
    
    return {
      ...requirement.client_requirements,
      client: requirement.clients || undefined,
      createdByUser: requirement.users || undefined,
    };
  }

  async getClientRequirements(): Promise<ClientRequirementWithRelations[]> {
    const results = await db
      .select()
      .from(clientRequirements)
      .leftJoin(clients, eq(clientRequirements.clientId, clients.id))
      .leftJoin(users, eq(clientRequirements.createdBy, users.id))
      .orderBy(desc(clientRequirements.createdAt));
    
    return results.map(result => ({
      ...result.client_requirements,
      client: result.clients || undefined,
      createdByUser: result.users || undefined,
    }));
  }

  async updateClientRequirement(id: string, requirementData: Partial<InsertClientRequirement>): Promise<ClientRequirement> {
    const [requirement] = await db
      .update(clientRequirements)
      .set(requirementData)
      .where(eq(clientRequirements.id, id))
      .returning();
    return requirement;
  }

  async deleteClientRequirement(id: string): Promise<void> {
    await db.delete(clientRequirements).where(eq(clientRequirements.id, id));
  }

  async bulkDeleteClientRequirements(ids: string[]): Promise<void> {
    await db.delete(clientRequirements).where(inArray(clientRequirements.id, ids));
  }

  // Dashboard statistics
  async getDashboardStats() {
    const [activeJobsCount] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, 'active'));

    const [totalCandidatesCount] = await db
      .select({ count: count() })
      .from(candidates);

    const [pendingApplicationsCount] = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.stage, 'Applied'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayInterviewsCount] = await db
      .select({ count: count() })
      .from(interviews)
      .where(
        and(
          eq(interviews.status, 'Scheduled'),
          sql`${interviews.scheduledDate} >= ${today}`,
          sql`${interviews.scheduledDate} < ${tomorrow}`
        )
      );

    return {
      activeJobs: activeJobsCount?.count || 0,
      totalCandidates: totalCandidatesCount?.count || 0,
      pendingApplications: pendingApplicationsCount?.count || 0,
      todayInterviews: todayInterviewsCount?.count || 0,
    };
  }

  // Email Provider operations
  async createEmailProvider(providerData: InsertEmailProvider): Promise<EmailProvider> {
    const [provider] = await db.insert(emailProviders).values(providerData).returning();
    return provider;
  }

  async getEmailProvider(id: string): Promise<EmailProvider | undefined> {
    const [provider] = await db.select().from(emailProviders).where(eq(emailProviders.id, id));
    return provider;
  }

  async getEmailProviders(): Promise<EmailProvider[]> {
    return await db.select().from(emailProviders).orderBy(desc(emailProviders.createdAt));
  }

  async updateEmailProvider(id: string, providerData: Partial<InsertEmailProvider>): Promise<EmailProvider> {
    const [provider] = await db
      .update(emailProviders)
      .set({ ...providerData, updatedAt: new Date() })
      .where(eq(emailProviders.id, id))
      .returning();
    return provider;
  }

  async deleteEmailProvider(id: string): Promise<void> {
    await db.delete(emailProviders).where(eq(emailProviders.id, id));
  }

  // Email Template operations
  async createEmailTemplate(templateData: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db.insert(emailTemplates).values(templateData).returning();
    return template;
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(emailTemplates.name);
  }

  async getEmailTemplateByKey(key: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, key));
    return template;
  }

  async updateEmailTemplate(id: string, templateData: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [template] = await db
      .update(emailTemplates)
      .set({ ...templateData, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return template;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  // Email Log operations (implemented at end of class)

  // Additional relation methods for email service
  async getApplicationWithRelations(id: string): Promise<ApplicationWithRelations | undefined> {
    const [result] = await db
      .select()
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(candidates, eq(applications.candidateId, candidates.id))
      .where(eq(applications.id, id));

    if (!result) return undefined;

    return {
      ...result.applications,
      job: result.jobs || undefined,
      candidate: result.candidates || undefined,
    };
  }

  async getInterviewWithRelations(id: string): Promise<any> {
    const [result] = await db
      .select()
      .from(interviews)
      .leftJoin(applications, eq(interviews.applicationId, applications.id))
      .leftJoin(candidates, eq(applications.candidateId, candidates.id))
      .where(eq(interviews.id, id));

    if (!result) return undefined;

    return {
      ...result.interviews,
      candidate: result.candidates || undefined,
      application: result.applications || undefined,
    };
  }

  async getOfferLetterWithRelations(id: string): Promise<any> {
    const [result] = await db
      .select()
      .from(offerLetters)
      .leftJoin(candidates, eq(offerLetters.candidateId, candidates.id))
      .leftJoin(applications, eq(offerLetters.applicationId, applications.id))
      .where(eq(offerLetters.id, id));

    if (!result) return undefined;

    return {
      ...result.offer_letters,
      candidate: result.candidates || undefined,
      application: result.applications || undefined,
    };
  }

  // Company Profile operations
  async getCompanyProfile(): Promise<CompanyProfile | undefined> {
    const [profile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.isActive, true))
      .limit(1);
    return profile;
  }

  async createCompanyProfile(profileData: InsertCompanyProfile): Promise<CompanyProfile> {
    // Deactivate any existing profiles first (single company setup)
    await db
      .update(companyProfiles)
      .set({ isActive: false });

    const [profile] = await db
      .insert(companyProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async updateCompanyProfile(id: string, profileData: Partial<InsertCompanyProfile>): Promise<CompanyProfile> {
    const [profile] = await db
      .update(companyProfiles)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(companyProfiles.id, id))
      .returning();
    return profile;
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.count;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Activity Log operations
  async createActivityLog(logData: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(logData).returning();
    return log;
  }

  async getActivityLogs(limit: number = 100, offset: number = 0): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getActivityLogsByUser(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getActivityLogsCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(activityLogs);
    return result.count;
  }

  // Custom Roles operations
  async getCustomRoles(): Promise<CustomRole[]> {
    return await db.select().from(customRoles).orderBy(desc(customRoles.createdAt));
  }

  async getCustomRole(id: string): Promise<CustomRole | undefined> {
    const [role] = await db.select().from(customRoles).where(eq(customRoles.id, id));
    return role;
  }

  async createCustomRole(roleData: InsertCustomRole): Promise<CustomRole> {
    const [role] = await db.insert(customRoles).values(roleData).returning();
    return role;
  }

  async updateCustomRole(id: string, roleData: Partial<InsertCustomRole>): Promise<CustomRole> {
    const [role] = await db.update(customRoles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(customRoles.id, id))
      .returning();
    return role;
  }

  async deleteCustomRole(id: string): Promise<void> {
    await db.delete(customRoles).where(eq(customRoles.id, id));
  }

  async getUserCountByCustomRole(roleId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(userCustomRoles)
      .where(eq(userCustomRoles.customRoleId, roleId));
    return result.count;
  }

  // Custom Role Permissions operations
  async getCustomRolePermissions(roleId: string): Promise<CustomRolePermission[]> {
    return await db.select()
      .from(customRolePermissions)
      .where(eq(customRolePermissions.roleId, roleId))
      .orderBy(customRolePermissions.module);
  }

  async createCustomRolePermission(permissionData: InsertCustomRolePermission): Promise<CustomRolePermission> {
    const [permission] = await db.insert(customRolePermissions).values(permissionData).returning();
    return permission;
  }

  async updateCustomRolePermission(roleId: string, module: string, permissions: any): Promise<CustomRolePermission> {
    const [permission] = await db.update(customRolePermissions)
      .set({ 
        permissions,
        updatedAt: new Date()
      })
      .where(and(
        eq(customRolePermissions.roleId, roleId),
        eq(customRolePermissions.module, module)
      ))
      .returning();
    
    if (!permission) {
      // If permission doesn't exist, create it
      return await this.createCustomRolePermission({
        roleId,
        module,
        permissions,
      });
    }
    
    return permission;
  }

  async deleteCustomRolePermissions(roleId: string): Promise<void> {
    await db.delete(customRolePermissions).where(eq(customRolePermissions.roleId, roleId));
  }

  // User Custom Role Assignment operations
  async assignCustomRoleToUser(userId: string, roleId: string, assignedBy: string): Promise<UserCustomRole> {
    // First remove any existing custom role assignments
    await this.removeCustomRoleFromUser(userId);
    
    // Then assign the new role
    const [assignment] = await db.insert(userCustomRoles).values({
      userId,
      customRoleId: roleId,
      assignedBy,
      isActive: true,
    }).returning();
    return assignment;
  }

  async removeCustomRoleFromUser(userId: string): Promise<void> {
    await db.delete(userCustomRoles).where(eq(userCustomRoles.userId, userId));
  }

  async getUserCustomRole(userId: string): Promise<UserCustomRole | undefined> {
    const [assignment] = await db.select()
      .from(userCustomRoles)
      .where(and(
        eq(userCustomRoles.userId, userId),
        eq(userCustomRoles.isActive, true)
      ));
    return assignment;
  }

  async getUsersByCustomRole(roleId: string): Promise<User[]> {
    return await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      department: users.department,
      roleId: users.roleId,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .innerJoin(userCustomRoles, eq(users.id, userCustomRoles.userId))
    .where(and(
      eq(userCustomRoles.customRoleId, roleId),
      eq(userCustomRoles.isActive, true)
    ));
  }

  // Feedback operations
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [feedbackItem] = await db.insert(feedback).values(feedbackData).returning();
    return feedbackItem;
  }

  async getFeedback(id: string): Promise<Feedback | undefined> {
    const [feedbackItem] = await db.select().from(feedback).where(eq(feedback.id, id));
    return feedbackItem;
  }

  async getFeedbackList(filters?: any): Promise<Feedback[]> {
    let query = db.select().from(feedback);
    
    if (filters?.status) {
      query = query.where(eq(feedback.status, filters.status));
    }
    if (filters?.type) {
      query = query.where(eq(feedback.type, filters.type));
    }
    if (filters?.priority) {
      query = query.where(eq(feedback.priority, filters.priority));
    }
    
    return await query.orderBy(desc(feedback.createdAt));
  }

  async updateFeedback(id: string, feedbackData: Partial<InsertFeedback>): Promise<Feedback> {
    const [updated] = await db.update(feedback)
      .set({ ...feedbackData, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();
    return updated;
  }

  async deleteFeedback(id: string): Promise<void> {
    await db.delete(feedback).where(eq(feedback.id, id));
  }

  // Feedback comments operations
  async createFeedbackComment(commentData: InsertFeedbackComment): Promise<FeedbackComment> {
    const [comment] = await db.insert(feedbackComments).values(commentData).returning();
    return comment;
  }

  async getFeedbackComments(feedbackId: string): Promise<FeedbackComment[]> {
    return await db.select()
      .from(feedbackComments)
      .where(eq(feedbackComments.feedbackId, feedbackId))
      .orderBy(feedbackComments.createdAt);
  }

  async deleteFeedbackComment(id: string): Promise<void> {
    await db.delete(feedbackComments).where(eq(feedbackComments.id, id));
  }

  // Email Log operations implementation
  async createEmailLog(logData: InsertEmailLog): Promise<EmailLog> {
    const [log] = await db.insert(emailLogs).values(logData).returning();
    return log;
  }

  async updateEmailLog(id: string, logData: Partial<InsertEmailLog>): Promise<EmailLog> {
    const [log] = await db.update(emailLogs)
      .set(logData)
      .where(eq(emailLogs.id, id))
      .returning();
    return log;
  }

  async getEmailLog(id: string): Promise<EmailLog | undefined> {
    const [log] = await db.select().from(emailLogs).where(eq(emailLogs.id, id));
    return log;
  }

  async getEmailLogs(): Promise<EmailLog[]> {
    return await db.select().from(emailLogs).orderBy(desc(emailLogs.createdAt));
  }

  // User Journey State operations implementation
  async createUserJourneyState(stateData: InsertUserJourneyState): Promise<UserJourneyState> {
    const [state] = await db.insert(userJourneyStates).values(stateData).returning();
    return state;
  }

  async getUserJourneyState(userId: string): Promise<UserJourneyState | undefined> {
    const [state] = await db.select()
      .from(userJourneyStates)
      .where(eq(userJourneyStates.userId, userId));
    return state;
  }

  async updateUserJourneyState(userId: string, stateData: Partial<InsertUserJourneyState>): Promise<UserJourneyState> {
    const [state] = await db.update(userJourneyStates)
      .set({ ...stateData, updatedAt: new Date() })
      .where(eq(userJourneyStates.userId, userId))
      .returning();
    return state;
  }
}

export const storage = new DatabaseStorage();
