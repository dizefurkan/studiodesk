# Direct Database Verification

If you want to verify that team members are actually being saved in the database, follow these steps:

## Via Supabase Dashboard

### Check 1: Verify organization_users table has data
1. Open Supabase Dashboard
2. Go to: **SQL Editor** (left sidebar)
3. Create new query
4. Run this SQL (it will show all team members in your organization):
```sql
SELECT 
  ou.id,
  ou.user_id,
  ou.role,
  ou.organization_id,
  p.full_name,
  p.email
FROM organization_users ou
LEFT JOIN profiles p ON ou.user_id = p.id
ORDER BY ou.created_at DESC;
```

**Expected result**: Should show rows with your team members

### Check 2: Find your organization ID
You'll need this for other queries:
```sql
SELECT * FROM organizations ORDER BY created_at DESC LIMIT 1;
```
Look for the `id` column - that's your organization ID.

### Check 3: Query by specific organization
Replace `'YOUR_ORG_ID'` with the actual ID from Check 2:
```sql
SELECT 
  ou.id,
  ou.user_id,
  ou.role,
  p.full_name
FROM organization_users ou
LEFT JOIN profiles p ON ou.user_id = p.id
WHERE ou.organization_id = 'YOUR_ORG_ID'
ORDER BY ou.created_at DESC;
```

### Check 4: Verify profiles table
Make sure team member profiles exist:
```sql
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 10;
```

### Check 5: Count members in each organization
```sql
SELECT 
  o.id,
  o.name,
  COUNT(ou.id) as member_count
FROM organizations o
LEFT JOIN organization_users ou ON o.id = ou.organization_id
GROUP BY o.id, o.name
ORDER BY o.created_at DESC;
```

## What the correct data structure should look like

When data is correctly saved:

**Profiles table:**
```
id: a1b2c3d4-... (from auth.users)
full_name: John Doe
email: john@example.com
```

**organization_users table:**
```
id: x1y2z3w4-...
organization_id: organization-uuid
user_id: a1b2c3d4-... (matches profiles.id)
role: staff
created_at: 2024-01-15...
```

## Common Issues and How to Diagnose

### Issue: No rows in organization_users
- The insert query in `sendTeamInvitation` didn't work
- Check auth.users - do the users exist?
- Check if there are errors in the server console

### Issue: organization_users has rows but profiles is empty
- The profile creation failed
- The user exists in auth but not in profiles table
- The application should have created both

### Issue: Rows exist but query shows NULL for full_name
- There's a mismatch in the user IDs
- The profile.id doesn't match organization_users.user_id
- This shouldn't happen in normal operation

## Using the SQL Editor to Test Inserts

If you want to manually test the insert:

```sql
-- 1. First, create a test user if you don't have one
-- (You'd normally do this through the Auth API, but for testing:)

-- 2. Get an existing user from auth
SELECT id, email FROM auth.users LIMIT 1;

-- 3. Get your organization ID
SELECT id FROM organizations LIMIT 1;

-- 4. Check if this user is already in the organization
SELECT * FROM organization_users 
WHERE user_id = 'USER_ID_FROM_STEP_2'
AND organization_id = 'ORG_ID_FROM_STEP_3';

-- 5. If step 4 returns no rows, insert the user
INSERT INTO organization_users (organization_id, user_id, role)
VALUES (
  'ORG_ID_FROM_STEP_3',
  'USER_ID_FROM_STEP_2', 
  'staff'
);

-- 6. Verify the insert worked
SELECT * FROM organization_users 
WHERE user_id = 'USER_ID_FROM_STEP_2'
AND organization_id = 'ORG_ID_FROM_STEP_3';
```

## Key Questions to Answer

Use the above queries to answer:
- [ ] Do rows exist in organization_users for your organization?
- [ ] Do the corresponding profiles exist?
- [ ] Are the user_id values in organization_users matching the id values in profiles?
- [ ] What is your organization ID? ___________

## If You Find Missing Data

**If profiles are missing:**
- The profile creation step failed
- Check the server logs when adding a team member
- You may need to manually create profiles:
```sql
INSERT INTO profiles (id, full_name, email)
VALUES (
  'USER_ID_FROM_AUTH',
  'Full Name',
  'email@example.com'
);
```

**If organization_users are missing:**
- The insert didn't work
- Manually run the insert query from Step 5 above
- Then reload the settings page

## Final Verification Query

After you think everything is working, run this to see your complete team:

```sql
SELECT 
  p.full_name as "Member Name",
  p.email as "Email",
  ou.role as "Role",
  ou.created_at as "Added On"
FROM organization_users ou
JOIN profiles p ON ou.user_id = p.id
WHERE ou.organization_id = 'YOUR_ORG_ID'
ORDER BY ou.created_at DESC;
```

This should match what you see in the Team Members section on the settings page.
