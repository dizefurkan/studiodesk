# Team Members Count Debug Guide

## Problem
Team Members section shows "0 members" even though members have been added to the database.

## What Was Changed
The settings page (`app/dashboard/settings/page.tsx`) has been updated to:
1. Query `organization_users` table first (without nested relations)
2. Extract the `user_id` values from the results
3. Query `profiles` table separately using those user IDs
4. Merge the profile data with member data using a Map

This approach is more robust than trying to use nested relations in Supabase, which may not be properly configured.

## How to Debug

### Step 1: Open the Settings Page
Navigate to `/dashboard/settings` in your browser.

### Step 2: Open Browser Developer Tools
Press `F12` to open the Developer Tools, then click on the **Console** tab.

### Step 3: Look for Detailed Logs
You should see logs with emoji prefixes:
- 🔍 Raw members query response - Shows the exact data returned from `organization_users`
- 🔍 Raw members error - Any errors from that query
- 🔍 Members received - count - How many organization_users records were found
- 📋 User IDs to fetch profiles for - The list of user IDs to look up
- 🔍 Member profiles query response - The profile data found
- 🔍 Member profiles error - Any errors from the profiles query
- ✅ Team members with profiles merged - Final merged data structure
- 🔍 All profiles fetched - Count of all profiles (for the "add member" dropdown)
- 📊 Team Members Count - Final count shown to user

### Step 4: Interpret the Logs
If you see:
- ✅ Team members with profiles merged: [array with data] → **Members ARE being fetched**, problem is likely in the component rendering
- ⚠️ No members found: [] → **No members in database yet**, or query isn't finding them
- 🔍 Raw members error → **Database query failed**, check the error details

### Step 5: Check Server Console (Optional)
These logs are also printed to your Next.js server console. Check the terminal where you ran `npm run dev` for the same emoji-prefixed logs.

## Common Issues & Solutions

### Logs show "No members found" but members exist in Supabase
- The organization ID might be wrong
- Check the log "Organization ID:" to verify it matches your organization

### Logs show members fetched but component still shows "0"
- There might be a rendering issue in `TeamMembersSection.tsx`
- Check if `teamMembers.length` is being calculated correctly
- Verify the data structure matches what the component expects

### Member profiles are empty/undefined
- If you see "Unknown" as full_name, the profile doesn't exist for that user
- This shouldn't happen in normal operation - user creation creates both Auth user and profile

## Data Structure Expected
After the merge, each team member should look like:
```typescript
{
  id: "uuid",                    // organization_user id
  role: "owner|manager|instructor|staff",
  user_id: "uuid",               // auth.users.id
  organization_id: "uuid",
  profiles: {
    id: "uuid",                  // Same as user_id
    full_name: "John Doe"
  }
}
```

## If Problems Persist
1. Copy all the console logs and share them
2. Share the error messages if any
3. Check if team members actually exist in Supabase (organization_users table > select organization ID > look for rows)
4. Verify the organization ID is correct by checking the settings page heading

## Next Fix if Needed
If the data is being fetched correctly but still not displaying:
- The issue would be in `TeamMembersSection.tsx` component
- We would need to add logging there to see how the component receives and processes the data
