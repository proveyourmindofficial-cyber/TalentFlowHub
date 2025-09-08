# Overview

O2F ATS is an Applicant Tracking System (ATS) built as a full-stack web application following the user's custom workflow: Job → Candidate → Application → Interview. It provides recruitment teams with tools to manage the complete hiring pipeline through a modern, responsive interface. The system follows a module-based approach where each module includes database schema, API endpoints, forms, and table views.

## Current Status (August 20, 2025)
✅ **Job Module Complete** - Full CRUD operations, form validation, table view with search/filters
✅ **Candidate Module Complete** - Full CRUD with resume uploads, comprehensive form with 5 sections, table with search/filters
✅ **Object Storage Integration** - Cloud storage for resume uploads with presigned URLs and file serving
✅ **Resume Upload & Viewing** - Complete file upload with cloud storage, resume viewing in modal, download functionality
✅ **Candidate Detail View** - Comprehensive profile view with organized sections, resume viewing, professional formatting
✅ **Applications Table** - PostgreSQL table with cascade deletes, 11-stage enum, auto-update trigger for updated_at
✅ **Database Schema** - All tables (jobs, candidates, applications, interviews, users, offerLetters, email_providers, email_templates, email_logs) with proper relations and constraints
✅ **Modern UI Framework** - Sidebar navigation, dashboard with statistics, responsive design
✅ **API Layer** - RESTful endpoints with Zod validation and error handling
✅ **Applications CRUD API** - Complete REST endpoints with stage transition validation enforcing proper workflow
✅ **Application Module Frontend** - Complete UI with form, table, edit/delete actions, navigation layout
✅ **Stage Flow Automation** - Full automation working: Application → Interview → Feedback → Candidate status updates
✅ **Live Data Integration** - All dashboard components and navigation showing real-time database data
✅ **Bulk Operations** - Complete bulk select, edit, and delete operations for all modules (jobs, candidates, applications, interviews)
✅ **Offer Letter Module Complete** - Comprehensive offer letter system with PDF generation, email integration, and Indian salary calculations
✅ **Client Module Complete** - Client Requirements module with full CRUD operations, forms, table view, and navigation integration
✅ **Email Service Infrastructure** - Complete email service layer with SMTP provider support (Office365, G Suite, SendGrid), workflow automation, template management, and email tracking
✅ **Microsoft Graph API Email Integration** - **FULLY OPERATIONAL** - Complete Office 365 email integration with OAuth2 authentication, confirmed working email delivery to any recipient, enhanced Email Settings UI with testing capabilities - **PRODUCTION READY**
✅ **Email Testing Interface** - Enhanced Email Settings page with Microsoft Graph API testing tools, successful email delivery confirmed to external addresses
✅ **Company Profile Module Complete** - Comprehensive company profile management integrated within Settings section with full CRUD operations, professional form layout, and database integration
✅ **Settings Page Complete** - Tabbed interface with Company Profile and Email Settings, fully functional save/edit operations, professional UI design
✅ **System Complete** - All core modules including Microsoft Graph email service integration, Company Profile management, and Settings configuration implemented, tested, and verified working
✅ **Advanced Candidate Module Enhancement** - Complete implementation with advanced Document Manager (section-based uploads), Integrated Primary Skill + Skills & Expertise System (unified skill management with experience tracking), Enhanced Dropdowns (instant additions with + buttons for all form fields), Professional UI/UX with organized sections, and Additional Features (Timeline tracking, Smart Search, Bulk Operations) - **PRODUCTION READY**
✅ **Integrated Primary Skill + Skills & Expertise System** - Complete unified skill management with Primary Skill dropdown (sourced from skills database), auto-population to Skills & Expertise at Expert level, individual skill experience tracking (0-50 years), proficiency levels (1-5 stars), skill categories (Technical/Soft/Domain), inline skill creation, search functionality, and seamless integration between both systems - **FULLY INTEGRATED & PRODUCTION READY**

# User Preferences

Preferred communication style: Simple, everyday language.

## Module Development Standards (MANDATORY)
All modules must include complete CRUD operations + Import/Export + Bulk Operations as standard requirements:

### Required Actions (Non-Optional):
- **Create**: Add new records via forms with validation
- **Edit**: Modify existing records with proper form handling
- **Delete**: Remove individual records with confirmation dialogs
- **Search/Filter**: Real-time search and filtering capabilities
- **Import/Export**: CSV/Excel import and export functionality
- **Bulk Operations**: Select multiple items for bulk edit/delete

### UI Standards:
- **Add Button**: Top-right position
- **Edit/Delete**: Row-level actions
- **Bulk Operations**: Bottom position
- **Import/Export**: Header level actions

### Completion Criteria:
A module is only considered complete when ALL actions are implemented and working with backend integration. No placeholder buttons or mock functionality allowed.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Component-based UI built with React 18 and TypeScript for type safety
- **Vite Build System**: Fast development server and optimized production builds
- **Wouter Router**: Lightweight client-side routing for single-page application navigation
- **shadcn/ui Components**: Modern, accessible UI component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens and responsive design
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates

## Backend Architecture
- **Express.js Server**: RESTful API server with middleware for logging, error handling, and request processing
- **Node.js Runtime**: ES modules with TypeScript compilation for modern JavaScript features
- **Drizzle ORM**: Type-safe database operations with schema-first approach
- **PostgreSQL Database**: Relational database for structured data storage with ACID compliance

## Data Layer
- **Database Schema**: Comprehensive schema covering users, jobs, candidates, applications, and interviews
- **Type Safety**: Database types automatically generated and shared between frontend and backend
- **Migrations**: Schema versioning and deployment through Drizzle migrations
- **Connection Pooling**: Neon PostgreSQL serverless with connection pooling for scalability

## Authentication & Authorization
- **Role-Based Access**: User roles including director, account manager, recruiter, candidate, client, HR, and background check
- **Session Management**: Express sessions with PostgreSQL session store
- **User Management**: Profile management with department assignments and active status tracking

## Key Design Patterns
- **Shared Types**: Common TypeScript interfaces and schemas shared between client and server
- **Component Composition**: Reusable UI components with consistent design patterns
- **API Layer Abstraction**: Centralized API request handling with error management and caching
- **Form Management**: React Hook Form with Zod validation for type-safe form handling
- **State Management**: Server state via TanStack Query, local state via React hooks

## Development Environment
- **Hot Module Replacement**: Vite HMR for instant development feedback
- **TypeScript Checking**: Strict type checking across the entire codebase
- **Path Mapping**: Absolute imports with alias resolution for clean import statements
- **Development Logging**: Request/response logging with performance metrics

# External Dependencies

## Database & ORM
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Drizzle ORM**: Modern TypeScript ORM with query building and migrations
- **Drizzle Kit**: Database migration and schema management tools

## UI Framework & Styling
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Lucide React**: Consistent icon library with React components
- **Class Variance Authority**: Utility for creating variant-based component APIs

## Development Tools
- **Vite**: Build tool with fast HMR and optimized production builds
- **ESBuild**: Fast JavaScript bundler for server-side code
- **TypeScript**: Static type checking and modern JavaScript features
- **React Hook Form**: Performant forms with minimal re-renders
- **Zod**: Runtime type validation and schema parsing

## State Management & Data Fetching
- **TanStack Query**: Server state management with intelligent caching
- **React Router (Wouter)**: Lightweight client-side routing
- **React Hook Form**: Form state management with validation

## Production Deployment
- **Static Asset Serving**: Optimized static file serving in production
- **Environment Configuration**: Separate development and production configurations
- **Error Handling**: Comprehensive error boundaries and API error handling