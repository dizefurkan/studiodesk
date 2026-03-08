# 📝 Complete Supabase Setup Instructions

## Prerequisites
- Supabase account (free tier works fine): https://supabase.com
- GitHub account (easiest for signup)

---

## Step 1: Create Supabase Project

### 1.1 Visit Supabase Dashboard
1. Go to https://app.supabase.com
2. Click "New project" (or "Create a new project")
3. Select your organization (create one if needed)

### 1.2 Project Configuration
Fill in the following:
- **Name**: `studiodesk` (or your preferred name)
- **Database Password**: Create a strong password and **SAVE IT** (you'll need it)
  - Example: `StudioDeskP@ssw0rd2024`
- **Region**: Select closest to your location (US Easy = us-east-1, EU = eu-west-1)
- **Pricing Plan**: Free tier is fine for development

### 1.3 Wait for Database Initialization
- Click "Create new project"
- Wait 3-5 minutes for the database to initialize
- You'll see "Project is being created..." → "Your project is ready"

---

## Step 2: Get Your Credentials

Once project is ready:

### 2.1 Navigate to Project Settings
1. Click on your project name
2. Click **Settings** (gear icon, bottom left)
3. Click **API** in the sidebar

### 2.2 Copy Your Keys
You'll see these on the page:
- **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
- **Anon Public Key**: Starts with `eyJhbGciOi...`
- **Service Role Secret Key**: Starts with `eyJhbGciOi...` (Longer than anon key)

**Keep these safe! Never expose the service role key in frontend code.**

---

## Step 3: Create `.env.local` File

### 3.1 In VS Code
1. Open your project root folder
2. Create a new file: `.env.local`
3. Copy and paste this (replace with YOUR credentials):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# Database Connection (for migrations)
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-id.supabase.co:5432/postgres

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3.2 Replace Values
- `your-project-id`: From your URL (https://`xxxxxxxxxxxxx`.supabase.co)
- `your-actual-anon-key-here`: Copy from Anon Public Key
- `your-actual-service-role-key-here`: Copy from Service Role Key
- `your-db-password`: The password you set during project creation

---

## Step 4: Initialize Database Schema

### 4.1 In Supabase Dashboard SQL Editor
1. Go to your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire content from: `database/schema.sql`
5. Paste into the SQL Editor
6. Click **Run**
7. Wait for all queries to execute (green checkmarks appear)

### 4.2 Set Up RLS Policies
1. Click **New Query** again
2. Copy the entire content from: `database/rls-policies.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. Wait for completion

---

## Step 5: Install Dependencies

### 5.1 In Terminal
```bash
cd /Users/saidfurkandize/Projects/studiodesk
npm install
```

This installs:
- Supabase client libraries
- shadcn/ui components
- Form handling libraries
- And other dependencies

---

## Step 6: Test Connection

### 6.1 Start Development Server
```bash
npm run dev
```

### 6.2 Check if it works
1. Open http://localhost:3000
2. You should see the landing page (not an error)

---

## Step 7: Configure Email (Optional but Recommended)

### 7.1 Supabase Email Configuration
By default, Supabase uses a limited "rate-limited" email service. For production, you should configure your own email provider.

For now (development), the default is fine.

---

## Step 8: Auth Settings

### 8.1 Email Configuration
1. In Supabase Dashboard → **Authentication** (left sidebar)
2. Click **Providers**
3. Make sure **Email** is enabled (it should be by default)
4. Click **Email** to expand it
5. Disable "Confirm email" if you want users to login without email verification
   - OR keep it enabled for security

### 8.2 Redirect URLs
1. Click **URL Configuration** in Authentication sidebar
2. Add these **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/onboarding`

(We'll add production URLs later)

---

## Troubleshooting

### ❌ "Failed to create tables"
- Make sure you copied the entire `schema.sql` content
- Check if there are any red error messages
- Database might have issues - try again in 1-2 minutes

### ❌ "Policy errors"
- Policies depend on tables existing first
- Make sure you ran `schema.sql` before `rls-policies.sql`

### ❌ "Cannot connect to database"
- Check your `.env.local` file
- Make sure `NEXT_PUBLIC_SUPABASE_URL` is correct
- Make sure it starts with `https://` (not `http://`)

### ❌ "Anon key not working"
- Make sure you copied the **Anon Public Key** (not the Service Role Key)
- Check for extra spaces or newlines in `.env.local`

### ❌ "npm install fails"
- Delete `node_modules` folder: `rm -rf node_modules`
- Delete package-lock.json: `rm package-lock.json`
- Run: `npm install` again

---

## Summary: What You Just Set Up

✅ **Supabase Project**: Cloud PostgreSQL database with auth  
✅ **Database Schema**: 19 tables with relationships and indexes  
✅ **Row-Level Security**: Data isolation by organization  
✅ **Environment Variables**: API keys configured locally  
✅ **Dependencies**: All npm packages installed  

---

## Next Steps

Once you've done all these steps:

1. ✅ Created Supabase project
2. ✅ Got your API credentials
3. ✅ Created `.env.local` file
4. ✅ Ran `schema.sql` in SQL Editor
5. ✅ Ran `rls-policies.sql` in SQL Editor
6. ✅ Ran `npm install`
7. ✅ Started dev server with `npm run dev`

**Tell me you're done, and we'll build:**
- Auth pages (Login/Register)
- Onboarding flow
- Dashboard layout
- Sidebar navigation
- shadcn/ui components

---

## Quick Reference: Project IDs

Your project ID is in your Supabase URL:
```
https://[PROJECT-ID].supabase.co
```

Example: If your URL is `https://abcdef123456.supabase.co`, your project ID is `abcdef123456`

---

Need help? Check Supabase docs: https://supabase.com/docs

