# Setting Admin Role

The admin features in the portal (announcements, listings filters, training resources) are only visible to users with the `admin` role.

## Check Your Current Role

To check your current role, run this SQL in the Supabase SQL Editor:

```sql
SELECT id, email, role, full_name
FROM users
WHERE email = 'your-email@example.com';
```

Replace `'your-email@example.com'` with your actual email address.

## Set Admin Role

If your role is not `'admin'`, run this SQL to set it:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Replace `'your-email@example.com'` with your actual email address.

## Verify the Change

After updating, verify the change worked:

```sql
SELECT id, email, role, full_name
FROM users
WHERE email = 'your-email@example.com';
```

The `role` column should now show `'admin'`.

## Available Roles

The system supports the following roles:
- `'admin'` - Full access to all features, can manage announcements, training resources, and see all listings
- `'broker'` - Can manage their own listings and transactions
- `'agent'` - Can manage their own listings and transactions

## Admin Features

Once you have the admin role, you will see:

1. **Announcements Page**: "Create Announcement" button
2. **Listings Page**: "Filter by Agent" dropdown to view all agents' listings
3. **Training & Resources Page**: "Add Resource" button to upload training materials

## Troubleshooting

If you've set your role to admin but still don't see admin features:

1. **Clear browser cache and reload**
2. **Sign out and sign back in**
3. **Check browser console** for any errors (F12 → Console tab)
4. **Verify the role is saved**: Run the verification SQL above

## Quick Set Admin Script

For convenience, here's a single command to set the first user as admin:

```sql
-- Set the first registered user as admin
UPDATE users
SET role = 'admin'
WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
```

Or set a specific user by email:

```sql
-- Set specific user as admin by email
UPDATE users
SET role = 'admin'
WHERE email = 'admin@re-apex.com';
```
