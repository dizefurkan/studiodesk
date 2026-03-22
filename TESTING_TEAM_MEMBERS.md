# Team Members Testing Guide

## Overview
This guide will help you verify that the team members system is working correctly. Follow these steps in order.

## Prerequisites
- You should be logged in as the owner of an organization
- You should be on the `/dashboard/settings` page

## Test Steps

### Step 1: Check Current Status (No Members Yet)
1. Open `/dashboard/settings` in your browser
2. Open Browser DevTools: Press `F12`
3. Go to the **Console** tab
4. Look for logs with 📋, 🔍, ✅ emojis
5. **Expected result**: 
   - You should see `⚠️  No members found: []` or `🔍 Members received - count: 0`
   - The Team Members section should show "No team members yet"
   - Don't close the console yet

### Step 2: Add Your First Team Member
**Option A: Using the UI (Recommended)**
1. In the Team Members section, click the **"Add Team Member"** button or **"+ Add"** button
2. Enter an email, for example: `john@example.com`
3. Select a role (e.g., "Staff")
4. Click **"Invite"** button
5. You should see a modal showing the credentials (email + temporary password)
6. Click "Done" to close the modal

**Option B: Manual Database Insert (Advanced Testing)**
1. Open Supabase dashboard
2. Go to: Project > SQL Editor > Create new query
3. Run this SQL (replace with your actual organization ID):
```sql
INSERT INTO organization_users (organization_id, user_id, role)
SELECT 
  'YOUR_ORG_ID', 
  id, 
  'staff'
FROM auth.users
LIMIT 1;
```

### Step 3: Reload and Check Logs
1. **Reload** the `/dashboard/settings` page (Ctrl+R or Cmd+R)
2. Open DevTools Console again (F12)
3. Look for these logs in order:
   - 📋 Fetching team members for organization: [UUID]
   - 🔍 Raw members query response: [array]
   - 🔍 Members received - count: [number]

### Step 4: Interpret Results

**If you see:**
```
📋 Fetching team members for organization: a1b2c3d4-...
🔍 Raw members query response: [
  {
    "id": "...",
    "role": "staff",
    "user_id": "...",
    "organization_id": "a1b2c3d4-..."
  }
]
✅ Team members with profiles merged: [...]
📊 Team Members Count: 1
```
✅ **SUCCESS** - Your team members are being fetched correctly!

**If you see:**
```
⚠️  No members found: []
📊 Team Members Count: 0
```
There might be an issue. Check:
- Is the member actually inserted in the database?
- Is the organization ID correct?

### Step 5: Verify UI Display
1. Look at the Team Members section in the settings page
2. **Expected**: Should now show the member's name with their role
3. **If still showing "0 members"**: Scroll down and refresh to see if it updates

### Step 6: Test Password Reset (Owner Only)
1. Look for a 🔑 (key icon) button next to each team member
2. Click the 🔑 button
3. You should see a modal with a temporary password
4. Try to copy the password (click the copy button)
5. Click "Done"

### Step 7: Server Console Check (Optional)
Open the terminal where you ran `npm run dev`:
1. Look for logs from the AddTeamMemberForm with:
   - ✅ User successfully added to organization_users
   - User ID: [uuid]
   - Organization ID: [uuid]
   - Role: [role]

## Troubleshooting

### Problem: Team Members showing "0" after adding a member

**Check 1: Is the database INSERT actually working?**
1. Open Supabase dashboard
2. Go to organization_users table
3. Filter by your organization ID
4. Look for the rows you just added
5. If no rows: The insert isn't working, check the auth.users table

**Check 2: Are the logs showing members found?**
1. Check the DevTools console logs
2. Look for "🔍 Raw members query response:"
3. If empty array: The query isn't finding the records
4. If error: Check what the error message says

**Check 3: Do the profiles exist?**
1. In the logs, look for "🔍 Member profiles query response:"
2. If empty: The profiles don't exist
3. If error: Check the error details

### Problem: Modal shows credentials but member doesn't appear in list

1. This might be a caching issue
2. Try hard-refreshing the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the database directly

### Problem: Can't see the 🔑 reset password button

1. Make sure you're logged in as owner
2. Make sure the member is not an owner
3. The button should appear next to the member's row

## What to Share if You Have Issues
If things aren't working, share:
1. Screenshot of the console logs (especially with emoji prefixes)
2. The error message if any
3. Screenshot of Supabase > organization_users table (with your data)
4. Your organization ID (from the logs)

## Expected Final Result
✅ Team members appear in the list with their names
✅ Count shows correct number of members  
✅ Password reset button (🔑) is visible
✅ Can copy password from reset modal
✅ Can add and remove members
