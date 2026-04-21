# Agent Contact Information Setup

This guide explains how to add contact information and social media fields to the users table.

## Migration File

**File**: `supabase/migrations/017_add_agent_contact_social.sql`

## New Fields Added

The following fields have been added to the `users` table:

- `phone` - Agent's phone number for public display
- `email_public` - Public email address (may differ from auth email)
- `social_facebook` - Facebook profile URL
- `social_instagram` - Instagram profile URL
- `social_linkedin` - LinkedIn profile URL
- `social_tiktok` - TikTok profile URL
- `social_x` - X (Twitter) profile URL

## How to Run the Migration

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/017_add_agent_contact_social.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project root directory
cd /Users/imranmehkri/Desktop/reapex-portal

# Run the migration
supabase db push
```

## Verify Migration

After running the migration, verify the new columns exist:

```sql
-- Check the users table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('phone', 'email_public', 'social_facebook', 'social_instagram', 'social_linkedin', 'social_tiktok', 'social_x');
```

You should see all 7 new columns listed.

## Profile Page Updates

The profile page has been updated to include fields for:

1. **Contact Information**
   - Phone Number
   - Public Email (separate from login email)

2. **Social Media Links**
   - Facebook
   - Instagram
   - LinkedIn
   - TikTok
   - X (Twitter)

## How to Use

1. Log in to the agent portal
2. Navigate to "My Profile"
3. Click "Edit" button
4. Fill in your contact information and social media links
5. Click "Save" to update your profile

## Notes

- All fields are optional
- Social media fields should contain full URLs (e.g., `https://facebook.com/yourprofile`)
- Phone number can be in any format (e.g., `(555) 123-4567`)
- Public email can be different from your login email
- The auth email (used for login) cannot be changed from the profile page

## Troubleshooting

If you encounter issues:

1. **Migration fails**: Check if columns already exist using the verification query above
2. **Fields not saving**: Check browser console for errors
3. **Fields not appearing**: Make sure you've run the migration and refreshed the page
