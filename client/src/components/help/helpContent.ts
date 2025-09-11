import { 
  CalendarDays, 
  Users, 
  Briefcase, 
  FileText, 
  UserCheck, 
  Settings,
  Building,
  BarChart3
} from 'lucide-react';

export interface HelpStep {
  title: string;
  description: string;
  details?: string;
}

export interface HelpModule {
  title: string;
  category: string;
  icon: any;
  introduction: string;
  steps: HelpStep[];
  impact: string[];
  workflow: string[];
  integrations: string[];
  notifications: string[];
}

export const helpContent: Record<string, HelpModule> = {
  // 🎯 INTERVIEW MODULE - Complete Prototype Following Template
  interviews: {
    title: "Interview Management",
    category: "Core Module",
    icon: CalendarDays,
    
    // A) Introduction - What this module is for
    introduction: "The Interview Module manages the complete candidate evaluation process through multiple interview rounds (L1, L2, HR, Final). It handles scheduling, feedback collection, and automatic candidate progression through the hiring pipeline with Microsoft Teams integration and email notifications.",
    
    // B) Step-by-Step Actions - What to do & How to do it
    steps: [
      {
        title: "1. Schedule New Interview",
        description: "Create interview appointments for candidates with specific rounds and timings.",
        details: "Select Application → Choose Interview Round (L1/L2/HR/Final) → Set Date/Time → Choose Mode (Teams/Online/On-site) → Status defaults to 'Scheduled'. Teams meetings are automatically created if configured."
      },
      {
        title: "2. Submit Interview Feedback", 
        description: "Evaluate candidates and record feedback with ratings and decisions.",
        details: "Rate Technical Skills (1-5) → Rate Communication (1-5) → Add Overall Feedback → Select Result (Selected/Rejected/On Hold/No Show). This triggers automatic workflow progression."
      },
      {
        title: "3. View/Edit Existing Feedback",
        description: "Review previous feedback or update evaluation results.",
        details: "Click feedback button on any interview → View detailed feedback → Edit if needed → Save changes. Updates trigger re-evaluation of candidate status."
      },
      {
        title: "4. Manage Interview Status",
        description: "Update interview status from Scheduled to Completed or other states.",
        details: "Status options: Scheduled, Completed, Cancelled, Rescheduled. Status automatically changes to 'Completed' when feedback is submitted."
      },
      {
        title: "5. Teams Meeting Integration",
        description: "Automatic Microsoft Teams meeting creation for virtual interviews.",
        details: "When Mode = 'Teams', system creates meeting automatically → Sends meeting link to candidate and interviewer → Meeting details included in email invitations."
      }
    ],
    
    // C) Impact - What happens after each action
    impact: [
      "When you schedule L1 interview → Application status changes to 'L1 Scheduled' → Candidate status becomes 'Interviewing' → Email sent to candidate with meeting details",
      "When L1 feedback is 'Selected' → Application automatically moves to 'L2 Scheduled' → Candidate gets progression email → Dashboard statistics update instantly",
      "When L2 feedback is 'Selected' → Application moves to 'Selected' status → Ready for HR round → Timeline updated in candidate profile",
      "When HR feedback is 'Selected' → Application automatically moves to 'Offer Released' → Candidate status becomes 'Offered' → Offer team gets notification",
      "When any feedback is 'Rejected' → Application status becomes 'Rejected' → Candidate status becomes 'Rejected' → Rejection email sent automatically",
      "When feedback is 'On Hold' → Application paused at current stage → No automatic progression → Follow-up email sent",
      "All status changes instantly reflect in Dashboard, Reports, and Candidate Timeline without manual updates"
    ],
    
    // D) Workflow - End-to-End flow with status transitions
    workflow: [
      "Applied",
      "L1 Scheduled", 
      "L1 Selected",
      "L2 Scheduled",
      "L2 Selected", 
      "HR Scheduled",
      "HR Selected",
      "Offer Released",
      "Joined"
    ],
    
    // E) Integration Points - How modules connect
    integrations: [
      "Applications Module → Interview scheduling automatically updates application stage and shows in application table",
      "Candidates Module → Interview feedback updates candidate status and appears in candidate timeline tab",
      "Dashboard → Interview counts and recent feedback activities display in real-time statistics",
      "Reports → All interview data feeds into reporting and analytics for hiring metrics",
      "Email System → Automatic notifications sent for scheduling, progression, and rejections using company email templates",
      "Microsoft Teams → Virtual meetings created automatically with calendar invitations and join links"
    ],
    
    // F) Notifications - Which emails/alerts are sent
    notifications: [
      "Interview Scheduled → Email sent to Candidate with date, time, location/meeting link, and confirmation details",
      "L1 Selected → 'Shortlisted for L2 Technical Round' email sent to candidate with next steps",
      "L2 Selected → 'Shortlisted for HR Discussion' email sent to candidate with HR round details", 
      "HR Selected → 'Offer Extended' email sent to candidate with offer details and next steps",
      "Any Rejection → 'Application Status Update' email sent explaining rejection with appreciation message",
      "On Hold Status → 'Interview On Hold' email sent explaining temporary pause with follow-up timeline",
      "No Show → 'Missed Interview' email sent with rescheduling options and importance of attendance"
    ]
  },

  // 🎯 JOBS MODULE - Complete Documentation
  jobs: {
    title: "Job Management",
    category: "Core Module", 
    icon: Briefcase,
    
    // A) Introduction - What this module is for
    introduction: "The Jobs Module is used to create and manage job openings for which candidates can be applied. It handles job descriptions, requirements, salary ranges, department assignments, and job status management throughout the hiring lifecycle.",
    
    // B) Step-by-Step Actions - What to do & How to do it
    steps: [
      {
        title: "1. Create New Job Opening",
        description: "Add comprehensive job postings with all required details.",
        details: "Enter Job Title → Select Department → Set Salary Range (Min/Max) → Write Job Description → Add Requirements → Set Experience Level → Choose Status (Draft/Active). Draft jobs are visible only to admins, Active jobs are visible to all recruiters."
      },
      {
        title: "2. Manage Job Status",
        description: "Control job visibility and application acceptance.",
        details: "Status options: Draft (Admin only), Active (Open for applications), Closed (No new applications). Active jobs appear in candidate application forms and recruiter dashboards."
      },
      {
        title: "3. Edit Job Details",
        description: "Update job information, requirements, and descriptions.",
        details: "Modify any job details including title, description, requirements, salary range. Changes are immediately visible to recruiters. Update status to close applications when needed."
      },
      {
        title: "4. Bulk Job Operations",
        description: "Manage multiple jobs simultaneously for efficiency.",
        details: "Select multiple jobs → Bulk actions: Change status (Active/Closed), Delete multiple jobs, Export job data. Useful for managing multiple openings at once."
      },
      {
        title: "5. Smart Job Import",
        description: "Import jobs from external sources or bulk create.",
        details: "Use Smart Import feature → Upload CSV or manual entry → Auto-populate job fields → Review and confirm. Saves time when creating multiple similar positions."
      }
    ],
    
    // C) Impact - What happens after each action
    impact: [
      "When job status is set to Active → Job becomes visible to all recruiters → Appears in candidate application dropdowns → Shows in active jobs dashboard",
      "When job is created → Automatic job ID assigned → Added to jobs table → Available for candidate applications → Recruitment team can start sourcing",
      "When job status changes to Closed → No new applications accepted → Existing applications remain intact → Job hidden from new application forms",
      "When job details are updated → Changes reflect immediately in all views → Applications maintain link to updated job → Candidate communications use latest details",
      "When job is deleted → All linked applications remain but show as 'Job Deleted' → Cannot create new applications → Existing workflow continues for current candidates"
    ],
    
    // D) Workflow - End-to-End flow with status transitions
    workflow: [
      "Draft",
      "Active", 
      "Applications Open",
      "Under Review",
      "Interviews Started",
      "Closed"
    ],
    
    // E) Integration Points - How modules connect
    integrations: [
      "Applications Module → Jobs appear in application creation forms → Application table shows job titles → Job status affects application creation",
      "Candidates Module → Job details displayed in candidate applications → Application history shows job information",
      "Dashboard → Active jobs count displayed → Recent job activities tracked → Job statistics in recruitment metrics",
      "Reports → Job-wise application reports → Hiring pipeline by job → Time-to-fill analytics per job opening",
      "Bulk Operations → Export job data for external systems → Import jobs from external sources → Mass status updates for job management"
    ],
    
    // F) Notifications - Which emails/alerts are sent
    notifications: [
      "Job Created → Internal notification to recruitment team → Admin gets job creation confirmation",
      "Job Status Active → Recruitment team notified that job is open for applications → Appears in active jobs list",
      "Job Status Closed → Notification that job no longer accepts applications → Automatic status update to linked systems",
      "Job Updated → Change notification to recruitment team → Applications linked to job get updated job details",
      "Bulk Job Operations → Confirmation emails for mass status changes → Summary of jobs affected by bulk actions"
    ]
  },

  // 🎯 CANDIDATES MODULE - Complete Documentation
  candidates: {
    title: "Candidate Management", 
    category: "Core Module",
    icon: Users,
    
    // A) Introduction - What this module is for
    introduction: "The Candidates Module manages comprehensive candidate profiles including personal details, skills & expertise, experience, document management, and status tracking throughout the entire hiring process. It includes advanced features like integrated skill management, timeline tracking, and document organization.",
    
    // B) Step-by-Step Actions - What to do & How to do it
    steps: [
      {
        title: "1. Create Candidate Profile (5 Sections)",
        description: "Add comprehensive candidate information across organized sections.",
        details: "Personal Info (Name, Email, Phone, Location) → Contact Details (Address, LinkedIn, Portfolio) → Skills & Expertise (Technical/Soft skills with experience) → Experience (Work history, Education) → Documents (Resume, Certificates). Each section can be filled independently."
      },
      {
        title: "2. Advanced Document Management",
        description: "Upload and organize candidate documents by category.",
        details: "Resume Upload → Certificates → Portfolio Files → Other Documents. Documents are stored in cloud storage with secure access. Resume viewing available in modal with download options."
      },
      {
        title: "3. Integrated Skills & Expertise System",
        description: "Manage candidate skills with experience tracking and proficiency levels.",
        details: "Primary Skill selection → Skills & Expertise management → Experience tracking (0-50 years) → Proficiency levels (1-5 stars) → Skill categories (Technical/Soft/Domain). Skills auto-populate between sections for consistency."
      },
      {
        title: "4. Timeline & Status Management",
        description: "Track candidate journey and status changes throughout hiring process.",
        details: "View complete timeline of activities → Status updates (Available, Interviewing, Offered, Joined, Rejected) → Application history → Interview progression → Automatic status updates from workflow."
      },
      {
        title: "5. Smart Search & Bulk Operations",
        description: "Find candidates efficiently and manage multiple profiles.",
        details: "Search by name, email, skills → Filter by status, experience → Bulk operations (status updates, export, delete) → Advanced filtering for quick candidate discovery."
      }
    ],
    
    // C) Impact - What happens after each action
    impact: [
      "When candidate is created → Available for job applications → Appears in application creation forms → Added to candidate database → Recruitment team can start engagement",
      "When skills are added → Candidate becomes searchable by those skills → Skills appear in application reviews → Primary skill drives job matching",
      "When documents are uploaded → Stored securely in cloud storage → Accessible via candidate profile → Resume viewable in modal → Download links available",
      "When status changes to 'Interviewing' → Timeline updated → Dashboard statistics reflect change → Interview workflow activated → Status visible across all modules",
      "When candidate completes hiring process → Status becomes 'Joined' or 'Rejected' → Complete journey tracked in timeline → Analytics include candidate in reports → Historical data preserved"
    ],
    
    // D) Workflow - End-to-End flow with status transitions
    workflow: [
      "Available",
      "Interested", 
      "Interviewing",
      "Selected",
      "Offered",
      "Joined",
      "Rejected"
    ],
    
    // E) Integration Points - How modules connect
    integrations: [
      "Applications Module → Candidates appear in application creation → Application table shows candidate names → Candidate status affects application progression",
      "Interview Module → Interview scheduling links to candidate profiles → Feedback affects candidate status → Timeline shows interview progression",
      "Dashboard → Candidate counts by status → Recent candidate activities → Hiring pipeline statistics include candidate data",
      "Document Management → Resume uploads integrated with cloud storage → Document viewing in candidate profiles → Secure file sharing capabilities",
      "Email System → Candidate portal invitations → Status update notifications → Interview scheduling emails → Automatic workflow emails"
    ],
    
    // F) Notifications - Which emails/alerts are sent
    notifications: [
      "Candidate Created → Internal notification to recruitment team → Profile available for applications",
      "Status Updated → Automatic timeline entry → Dashboard statistics update → Integration with other modules",
      "Document Uploaded → Confirmation of successful upload → Document available for review → Cloud storage backup completed",
      "Portal Account Created → Secure password setup link sent to candidate → Login credentials for candidate portal access",
      "Interview Invitations → Automated emails when candidate selected for interviews → Meeting details and confirmation links"
    ]
  },

  // 🎯 APPLICATIONS MODULE - Complete Documentation
  applications: {
    title: "Application Management",
    category: "Core Module",
    icon: FileText, 
    
    // A) Introduction - What this module is for
    introduction: "The Applications Module is the central hub that connects candidates to job openings and tracks their complete journey through the hiring pipeline. It manages application stages, workflow automation, bulk operations, and provides real-time visibility into the hiring process from initial application to final decision.",
    
    // B) Step-by-Step Actions - What to do & How to do it
    steps: [
      {
        title: "1. Create New Application",
        description: "Link candidates to specific job openings to start the hiring process.",
        details: "Select Candidate from dropdown → Select Job Opening → Application automatically gets 'Applied' stage → Add initial notes if needed → System creates unique application ID → Candidate enters hiring pipeline."
      },
      {
        title: "2. Manage Application Stages",
        description: "Track and update candidate progress through hiring pipeline.",
        details: "Stage options: Applied → Under Review → Shortlisted → L1 Scheduled → L2 Scheduled → Selected → Offer Released → Joined → Rejected. Stages update automatically through interview workflow or manually by recruiters."
      },
      {
        title: "3. Application Workflow Integration",
        description: "Benefit from automatic stage transitions based on interview feedback.",
        details: "When L1 interview marked 'Selected' → Auto-advances to 'L2 Scheduled' → When L2 'Selected' → Moves to 'Selected' → When HR 'Selected' → Moves to 'Offer Released'. No manual stage updates needed for interview workflow."
      },
      {
        title: "4. Bulk Application Operations",
        description: "Manage multiple applications efficiently with bulk actions.",
        details: "Select multiple applications → Bulk actions: Change stage, Update status, Delete applications, Export data. Useful for managing large recruitment drives or cleaning up old applications."
      },
      {
        title: "5. Search, Filter & Track Applications",
        description: "Find applications quickly and monitor hiring progress.",
        details: "Search by candidate name, job title → Filter by stage, date range → Sort by creation date, stage → Track application age → Monitor pipeline progression → Export filtered results."
      }
    ],
    
    // C) Impact - What happens after each action
    impact: [
      "When application is created → Candidate officially enters hiring pipeline → Application appears in all recruitment views → Interview scheduling becomes available → Workflow automation activated",
      "When stage changes to 'Shortlisted' → Candidate ready for interview scheduling → Application highlighted in priority views → Interview workflow can begin",
      "When interview feedback triggers stage change → Application automatically progresses → Candidate status updates → Dashboard statistics reflect change → No manual intervention required",
      "When application reaches 'Offer Released' → Candidate status becomes 'Offered' → Offer process can begin → Timeline shows complete journey → Application marked as successful",
      "When application is rejected at any stage → Candidate status becomes 'Rejected' → Application workflow stops → Rejection email sent automatically → Application archived for future reference"
    ],
    
    // D) Workflow - End-to-End flow with status transitions
    workflow: [
      "Applied",
      "Under Review", 
      "Shortlisted",
      "L1 Scheduled",
      "L2 Scheduled",
      "Selected",
      "Offer Released",
      "Joined",
      "Rejected"
    ],
    
    // E) Integration Points - How modules connect
    integrations: [
      "Jobs Module → Application creation requires active job → Job details display in application → Job status affects application creation availability",
      "Candidates Module → Application creation requires existing candidate → Candidate profile accessible from application → Candidate status updates when application progresses",
      "Interview Module → Applications enable interview scheduling → Interview feedback automatically updates application stage → Interview history visible in application timeline",
      "Dashboard → Application counts by stage displayed → Recent application activities tracked → Pipeline analytics include application progression data",
      "Reports → Application-wise hiring reports → Stage-wise analytics → Time-in-stage tracking → Conversion rate analysis from application data"
    ],
    
    // F) Notifications - Which emails/alerts are sent
    notifications: [
      "Application Created → Internal notification to recruitment team → Candidate confirmation email → Application tracking begins",
      "Stage Progression → Automatic emails when moving through L1→L2→HR→Offer stages → Candidate informed of progress → Next steps communicated",
      "Application Rejected → Rejection email sent to candidate → Internal notification to recruitment team → Application archived notification",
      "Bulk Operations → Confirmation of bulk stage changes → Summary of applications affected → Team notification of mass updates",
      "Workflow Automation → Email notifications triggered by interview feedback → Stage change confirmations → Automatic progression alerts"
    ]
  }
};

// Helper function to get help content for a specific module
export function getHelpContent(module: string): HelpModule | null {
  return helpContent[module] || null;
}

// Get all available modules
export function getAllHelpModules(): string[] {
  return Object.keys(helpContent);
}