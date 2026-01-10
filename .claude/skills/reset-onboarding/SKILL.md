---
name: reset-onboarding
description: Reset onboarding data for testing. Use when the user needs to test the onboarding flow from scratch. Invoked with an email address argument to identify the account to reset.
---

# Reset Onboarding Skill

> **Purpose**: Clear all onboarding-related data for a test account so the user can re-experience the onboarding flow from scratch.

## Invocation

```
/reset-onboarding <email>
```

Example:
```
/reset-onboarding hi+ob@aaronbaker.co
```

## What Gets Reset

| Table | Description |
|-------|-------------|
| `projects` | All projects created by this business |
| `project_images` | Images for those projects (cascade) |
| `interview_sessions` | Voice interview data (cascade) |
| `conversations` | Onboarding chat history + extracted state |
| `agent_memory` | Any agent memory for the business |
| `businesses` | Business profile |
| `contractors` | Legacy contractor profile |

**Preserved**: `auth.users` - The authentication account remains intact so the user can log back in.

## Execution Steps

When this skill is invoked with an email argument:

### Step 1: Lookup User ID

Use `mcp__supabase__execute_sql` to find the auth user ID:

```sql
SELECT id FROM auth.users WHERE email = '<email>';
```

If no user found, report that the email doesn't exist and stop.

### Step 2: Find Business and Contractor IDs

```sql
SELECT id FROM businesses WHERE auth_user_id = '<auth_user_id>';
SELECT id FROM contractors WHERE auth_user_id = '<auth_user_id>';
```

### Step 3: Delete Data in FK Order

Execute these DELETEs in order (cascades handle child records):

```sql
-- Projects (cascades to project_images, interview_sessions)
DELETE FROM projects WHERE business_id = '<business_id>';

-- Conversations (onboarding chat history)
DELETE FROM conversations WHERE business_id = '<business_id>';

-- Agent memory
DELETE FROM agent_memory WHERE business_id = '<business_id>';

-- Business profile
DELETE FROM businesses WHERE id = '<business_id>';

-- Legacy contractor profile
DELETE FROM contractors WHERE id = '<contractor_id>';
```

### Step 4: Report Results

After each DELETE, report the number of rows affected. Example output:

```
Reset complete for hi+ob@aaronbaker.co:
- Deleted 3 projects (with images and interviews)
- Deleted 1 conversation
- Deleted 0 agent_memory records
- Deleted 1 business profile
- Deleted 1 contractor profile

User can now log in and will be redirected to onboarding.
```

## Safety Notes

- This skill only deletes data for the specified email
- The auth account is preserved - user can still log in
- All deletions respect foreign key constraints
- Uses Supabase MCP which has service role access
