# Scraping Listings and Agents from re-apex.com

This script scrapes listings and agent information from re-apex.com and inserts them into your Supabase database.

## Prerequisites

1. **Service Role Key**: You need your Supabase Service Role Key for full access.
   - Go to your Supabase project → Settings → API
   - Copy the `service_role` key (NOT the anon key)
   - Add it to `.env.local`:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```

2. **At least one agent/user**: The script needs at least one agent in the database to assign listings to.
   - Option A: Create an agent manually via Supabase Dashboard (Authentication → Users → create user, then insert into `users` table)
   - Option B: Run `npm run setup-agent` (requires service role key)

## Usage

1. **Setup system agent** (optional, if you have service role key):
   ```bash
   npm run setup-agent
   ```

2. **Scrape listings and agents**:
   ```bash
   npm run scrape
   ```

## What it does

- Fetches listings from `https://re-apex.com/listings-with-elementor/`
- Fetches agents from `https://re-apex.com/agents-2/`
- Extracts property details (address, price, bedrooms, bathrooms, etc.)
- Extracts agent information (name, email, phone, photo, bio)
- Inserts/updates agents in the `users` table
- Inserts listings in the `listings` table

## Notes

- The script will skip listings that already exist (based on `property_reference`)
- If no agent is found for a listing, it will use the first available agent or skip the listing
- Images are stored as URLs (not downloaded)
- The script handles errors gracefully and provides a summary at the end

## Troubleshooting

- **"User not allowed"**: Make sure you're using the SERVICE_ROLE_KEY, not the anon key
- **"No agent found"**: Create at least one agent manually or run `npm run setup-agent`
- **"Foreign key violation"**: Make sure the users table has the agent referenced

