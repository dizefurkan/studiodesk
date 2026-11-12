# StudioDesk

A comprehensive SaaS platform for managing dance studios, including student management, instructor scheduling, course management, attendance tracking, and financial operations.

## 🎯 Project Overview

StudioDesk is a multi-tenant dance studio management system built with modern web technologies. It provides studio owners with tools to manage:

- **Students** - Track student profiles and enrollment
- **Instructors** - Manage instructor schedules and earnings
- **Courses** - Create and manage dance courses by type and schedule
- **Branches** - Support multiple studio locations
- **Attendance** - Track and record class attendance
- **Packages** - Manage and sell course packages
- **Cash Register** - Handle financial transactions
- **Reporting** - View earnings and analytics

## 🛠 Tech Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript, React
- **Styling**: Tailwind CSS, PostCSS
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Custom components with Lucide React icons
- **Form Handling**: react-hook-form with Zod validation
- **Security**: Row-Level Security (RLS) for multi-tenant isolation

## 📋 Features

### User Management
- User signup and authentication
- Role-based access control (owner, manager, instructor, staff)
- User organization assignment

### Organization & Branches
- Multi-tenant architecture with organization isolation
- Multiple branch support per organization
- Branch-specific management

### Students & Courses
- Student registration and profile management
- Dance type categorization
- Course scheduling with instructor assignment
- Course capacity management

### Attendance & Packages
- Session-based attendance tracking
- Course package creation and sales
- Credit-based package system
- Package expiration management

### Financial Operations
- Cash register transactions
- Instructor earnings tracking
- Payment method configuration
- Revenue reporting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Set up the database:**
   - Run the schema and RLS policies from `database/` directory in your Supabase SQL editor
   - See [database setup instructions](./SETUP_INSTRUCTIONS.md)

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
app/
  ├── (auth)/          # Authentication pages (login, register)
  ├── dashboard/       # Main application dashboard
  │   ├── students/    # Student management
  │   ├── instructors/ # Instructor management
  │   ├── courses/     # Course management
  │   ├── branches/    # Branch management
  │   └── ...          # Other modules
  ├── onboarding/      # Initial setup flow
  └── layout.tsx       # Root layout

components/
  ├── layout/          # Navigation and layout components
  └── ui/              # Reusable UI components

lib/
  ├── actions/         # Server actions
  ├── auth/            # Authentication utilities
  ├── supabase/        # Supabase client configurations
  ├── types/           # TypeScript type definitions
  └── utils/           # Helper utilities

supabase/migrations/   # Schema + RLS (source of truth, see database/README.md)
database/
  ├── README.md          # Setup & region migration guide
  ├── verify_schema.sql  # Diff helper between two projects
  └── _legacy/           # Old scripts, reference only
```

## 🔐 Authentication Flow

1. User registers/logs in via auth pages
2. Session managed by Supabase Auth
3. Onboarding flow for new organizations
4. Dashboard redirect after authentication
5. Automatic logout on auth session expiry

## 🗄 Database Architecture

The database uses a multi-tenant model with Row-Level Security (RLS) to isolate data:

- Users connect to organizations via `organization_users` table
- All data tables reference `organizations` for tenant isolation
- RLS policies enforce user access to only their organization's data

## 🧪 Development

### Build
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

## � Project Status

**Current Phase:** Phase 5 - Type Safety Sprint (In Progress)  
**Progress:** 2/6 action files type-safe (33%)  
**Build Status:** ✅ Type-safe files passing TypeScript  

👉 **For current phase details, see [PROGRESS.md](./PROGRESS.md)**

## 📚 Documentation

- [Progress Tracking](./PROGRESS.md) - Current phase and milestones
- [Type Safety Refactoring](./TYPE_SAFETY_REFACTORING.md) - Type safety sprint details
- [Setup Instructions](./SETUP_INSTRUCTIONS.md) - Getting started guide
- [Developer Guide](./DEVELOPER_GUIDE.md) - Development patterns and conventions
- [Supabase Rules](./SUPABASE_ACTION_RULES.md) - Type safety rules for action files
- [Component Guidelines](./COMPONENT_CREATION_GUIDELINES.md) - UI component patterns

## 🚢 Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Or deploy to any Node.js hosting platform that supports Next.js.

## 📝 License

This project is proprietary software.

