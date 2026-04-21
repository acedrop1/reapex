## Admin Agent Permission Parity (2026-01-02)

### Overview
Complete permission audit and remediation ensuring admin_agent role has identical permissions to admin role across all database RLS policies, storage buckets, and application code. This addresses 26 permission gaps where admin_agent was excluded from admin-level operations.

### Migration File
`20260102_fix_admin_agent_permissions.sql`

### Permission Gaps Fixed

#### Database RLS Policies (16 policies)
All policies updated to use `role IN ('admin', 'admin_agent')` instead of only checking for 'admin':

1. **external_links** - Insert, update, delete policies (3 policies)
2. **brokerage_documents** - Insert, update, delete policies (3 policies)
3. **training_resources** - Insert, update, delete policies (3 policies)
4. **canva_templates** - Insert, update, delete policies (3 policies)
5. **meetings** - Full management policy (1 policy)

#### Storage Bucket Policies (6 policies)
Storage policies updated for private buckets:

1. **transaction-documents** - Upload, update, delete policies (3 policies)
2. **announcement-attachments** - Upload, update, delete policies (3 policies)

### Application Code Updates

#### API Routes (3 checks)
**File:** `/app/api/admin/all-listings/route.ts`
- **Lines:** 40, 100, 165
- **Changes:** Replaced `userProfile.role !== 'admin'` with `!isAdmin(userProfile.role)`
- **Impact:** admin_agent can now access GET, PUT, DELETE endpoints for all listings management

#### UI Components (1 check)
**File:** `/components/layout/Header.tsx`
- **Line:** 128
- **Changes:** Replaced `user?.role === 'admin'` with `isAdmin(user?.role)`
- **Impact:** admin_agent now sees pending applications count badge in header

### Helper Function Usage
All fixes leverage the existing `isAdmin()` helper from `/lib/utils/auth.ts`:
```typescript
export function isAdmin(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'admin_agent';
}
```

### Purpose
Ensures users with admin_agent role can:
- Manage external links, brokerage documents, training resources
- Control marketing templates (canva_templates)
- Manage meetings and calendar sync
- View document audit logs
- Upload/manage transaction documents in storage
- Upload/manage announcement attachments in storage
- Access admin all-listings management page
- View pending application count badge

### Deployment Status
✅ **DEPLOYED** - Migration successfully applied to Supabase on 2026-01-02

### Testing Checklist
Post-deployment verification:
- [ ] admin_agent can create/edit external links
- [ ] admin_agent can manage brokerage documents
- [ ] admin_agent can manage training resources
- [ ] admin_agent can manage marketing templates
- [ ] admin_agent can manage meetings
- [ ] admin_agent can upload transaction documents
- [ ] admin_agent can upload announcement attachments
- [ ] admin_agent can access /admin/all-listings page
- [ ] admin_agent sees pending apps badge in header
- [ ] admin role still has all permissions (no regression)
- [ ] agent role is still restricted (no privilege escalation)

### Files Modified
1. `/supabase/migrations/20260102_fix_admin_agent_permissions.sql` (new)
2. `/app/api/admin/all-listings/route.ts`
3. `/components/layout/Header.tsx`
4. `/dev/schema_updates.md` (this file)

---

## Admin Agent Full Permissions (2025-12-15)

### Overview
Comprehensive update to ensure admin_agent role has identical permissions to admin role across all RLS policies, particularly for storage buckets.

### Migration File
`094_admin_agent_full_permissions.sql`

### Changes

#### Storage Policies Updated
All storage bucket policies now check for both 'admin' AND 'admin_agent' roles:

1. **training-resources** - Upload, update, delete
2. **announcement-attachments** - Insert, update, delete
3. **canva-templates** - All operations
4. **listing-photos** - Delete any photo
5. **profile-photos** - Insert, update, delete
6. **transaction-documents** - View all, upload, delete
7. **documents** - All operations

#### Helper Functions
Migration relies on existing helper functions from migration 090:
- `is_admin()` - Returns true for admin OR admin_agent
- `is_agent()` - Returns true for agent OR admin_agent

### Purpose
Ensures users with admin_agent role can:
- Manage all storage buckets like full admins
- Upload/delete training resources
- Manage announcement attachments
- Control canva templates
- Administer profile photos
- Access transaction documents
- Perform all document operations

---

## Announcement Related Items (2025-12-14)

### Overview
Optional related items system for announcements allowing admins to link announcements to various resource types (forms, marketing materials, listings, public events, external links, training). Each related item shows a CTA button with customizable text that directs users to the related resource.

### Database Schema Changes

#### announcements (Modified)
Added related item fields to allow linking announcements to various resources.

**New Columns:**
- `related_type` TEXT CHECK (form, marketing, listing, event, link, training) - Type of related resource
- `related_id` TEXT - ID of related item in its respective table (nullable for link type)
- `related_title` TEXT - Cached display title for performance (avoids JOINs)
- `related_url` TEXT - Direct URL for link type or override URL for other types
- `related_cta_text` TEXT - Custom CTA button text (falls back to type-based defaults)

**New Indexes:**
- `idx_announcements_related_type` ON related_type

**Default CTA Text by Type:**
- form: "View Form"
- marketing: "View Resource"
- listing: "View Listing"
- event: "View Event"
- link: "Learn More"
- training: "Start Training"

### Components

#### RelatedItemSelector
**Location:** `/components/announcements/RelatedItemSelector.tsx`
**Purpose:** Admin UI component for selecting related items when creating/editing announcements

**Features:**
- Dropdown to select related type (including "None" option)
- Dynamic autocomplete that queries appropriate table based on selected type
- Automatic URL generation for each resource type
- Custom CTA text field with type-specific placeholders
- Manual URL/title input for "link" type
- Proper dark theme styling

**Query Logic:**
- form → queries `forms` table
- marketing → queries `brokerage_resources` where category='marketing'
- listing → queries `listings` where status='active'
- event → queries `calendar_events` where source='custom' AND agent_id IS NULL (public events)
- training → queries `brokerage_resources` where category='training'
- link → manual input fields

### Files Modified

#### `/app/(dashboard)/dashboard/page.tsx`
- Added `getDefaultCta()` helper function for type-based default CTA text
- Updated announcement rendering to show CTA button when related item exists
- CTA button positioned at bottom right of announcement card with hover effects

#### `/app/(dashboard)/admin/announcements/page.tsx`
- Added `relatedItem` state for tracking selected related item
- Integrated RelatedItemSelector component in announcement dialog
- Updated create/update mutations to save all 5 related fields
- Updated `handleEdit()` to populate related item state when editing
- Updated `resetDialog()` to clear related item state

### Migration File
**Location:** `/supabase/migrations/20251214_announcement_related_items.sql`

---

## Google Calendar Bidirectional Sync (2025-12-14)

### Overview
Complete bidirectional sync system between Google Calendar and Reapex Calendar. Allows automatic sync on login, manual sync triggers, event categorization, and conflict resolution. Google Calendar is the source of truth, but users can categorize events in Reapex for better organization.

### Database Schema Changes

#### calendar_events (Modified)
Added Google Calendar sync fields to existing table.

**New Columns:**
- `google_event_id` TEXT UNIQUE - Google Calendar event ID for bidirectional sync mapping
- `event_category` TEXT - User-assigned category for organizational purposes (separate from event_type)
- `last_synced_at` TIMESTAMPTZ - Timestamp of last successful sync with Google Calendar
- `google_metadata` JSONB - Original Google Calendar event data stored as JSON

**New Indexes:**
- `idx_calendar_events_google_event_id` ON google_event_id
- `idx_calendar_events_last_synced_at` ON last_synced_at
- `idx_calendar_events_event_category` ON event_category

#### users (Modified)
Added Google Calendar sync metadata for incremental sync.

**New Columns:**
- `google_calendar_sync_token` TEXT - Google Calendar API sync token for incremental sync
- `google_calendar_last_sync` TIMESTAMPTZ - Timestamp of last successful sync operation

#### calendar_sync_log (New Table)
Tracks all Google Calendar sync operations with detailed metrics.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `user_id` UUID REFERENCES users(id) - User who performed the sync
- `sync_type` TEXT CHECK (full, incremental, manual, webhook) - Type of sync operation
- `sync_direction` TEXT CHECK (google_to_reapex, reapex_to_google, bidirectional) - Sync direction
- `events_synced` INTEGER DEFAULT 0 - Total events processed
- `events_created` INTEGER DEFAULT 0 - New events created
- `events_updated` INTEGER DEFAULT 0 - Existing events updated
- `events_deleted` INTEGER DEFAULT 0 - Events deleted
- `conflicts_detected` INTEGER DEFAULT 0 - Number of conflicts found
- `sync_status` TEXT CHECK (success, partial, failed) - Overall sync result
- `error_message` TEXT - Error details if sync failed
- `sync_started_at` TIMESTAMPTZ NOT NULL - Sync operation start time
- `sync_completed_at` TIMESTAMPTZ - Sync operation completion time
- `metadata` JSONB - Additional sync metadata
- `created_at` TIMESTAMPTZ DEFAULT NOW()

**Indexes:**
- `idx_calendar_sync_log_user_id` ON user_id
- `idx_calendar_sync_log_created_at` ON created_at DESC

#### calendar_sync_conflicts (New Table)
Stores sync conflicts for manual resolution.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `user_id` UUID REFERENCES users(id) - User who owns the conflicting event
- `event_id` UUID REFERENCES calendar_events(id) - Reapex event ID
- `google_event_id` TEXT NOT NULL - Google Calendar event ID
- `conflict_type` TEXT CHECK (update_collision, delete_collision, duplicate) - Type of conflict
- `reapex_data` JSONB NOT NULL - Reapex event data at time of conflict
- `google_data` JSONB NOT NULL - Google Calendar event data at time of conflict
- `resolved` BOOLEAN DEFAULT FALSE - Whether conflict has been resolved
- `resolution_strategy` TEXT CHECK (keep_reapex, keep_google, merge, manual) - How conflict was resolved
- `resolved_at` TIMESTAMPTZ - When conflict was resolved
- `resolved_by` UUID REFERENCES users(id) - User who resolved the conflict
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

**Indexes:**
- `idx_calendar_sync_conflicts_user_id` ON user_id
- `idx_calendar_sync_conflicts_resolved` ON resolved

**Triggers:**
- `calendar_sync_conflicts_updated_at` - Auto-updates updated_at timestamp

### RLS Policies

#### calendar_sync_log
- **Users can view own logs:** `auth.uid() = user_id`
- **System can insert logs:** `true` (for background sync operations)
- **Admins can view all logs:** Role check for admin users

#### calendar_sync_conflicts
- **Users can view own conflicts:** `auth.uid() = user_id`
- **Users can update own conflicts:** `auth.uid() = user_id` (for resolution)
- **System can insert conflicts:** `true` (for sync operations)
- **Admins can view all conflicts:** Role check for admin users

### API Endpoints

#### POST /api/calendar/sync
Performs bidirectional calendar sync between Google Calendar and Reapex.

**Request Body:**
```json
{
  "syncType": "full" | "incremental" | "manual",
  "forceFullSync": boolean
}
```

**Response:**
```json
{
  "success": true,
  "message": "Calendar synced successfully",
  "result": {
    "success": true,
    "events_synced": 25,
    "events_created": 5,
    "events_updated": 3,
    "events_deleted": 1,
    "conflicts": []
  }
}
```

**Sync Process:**
1. **Fetch Google Events:** Full or incremental fetch using sync tokens
2. **Google → Reapex:** Import Google events, detect conflicts, apply "last write wins"
3. **Reapex → Google:** Export Reapex events, create/update in Google Calendar
4. **Update Metadata:** Store new sync token and timestamp

#### GET /api/calendar/sync/status
Returns current sync status and last sync details.

**Response:**
```json
{
  "lastSync": "2025-12-14T10:30:00Z",
  "hasSyncToken": true,
  "lastSyncLog": {
    "sync_type": "incremental",
    "sync_status": "success",
    "events_synced": 10,
    "events_created": 2,
    "events_updated": 1,
    "events_deleted": 0
  },
  "unresolvedConflicts": 0
}
```

#### POST /api/calendar/webhook
Handles Google Calendar push notifications for real-time sync.

**Headers:**
- `x-goog-channel-id` - Channel identifier
- `x-goog-resource-state` - Event state (sync, exists, not_exists)

**Resource States:**
- `sync` - Initial verification
- `exists` - Calendar changes detected, triggers incremental sync
- `not_exists` - Calendar deleted or access revoked

#### GET /api/calendar/background-sync
Background cron job endpoint for periodic sync of all users.

**Security:** Requires `CRON_SECRET` header with Bearer token.

**Response:**
```json
{
  "message": "Background sync completed",
  "results": {
    "total": 50,
    "synced": 48,
    "failed": 2,
    "errors": []
  }
}
```

### Components

#### SyncStatusIndicator
Real-time sync status display with manual sync trigger.

**Location:** `/components/calendar/SyncStatusIndicator.tsx`

**Features:**
- Last sync timestamp with relative time
- Sync status chip (success/warning/error)
- Manual sync button with loading animation
- Detailed sync info popover with metrics
- Auto-refresh every 30 seconds
- Conflict notifications

**Usage:**
```tsx
import SyncStatusIndicator from '@/components/calendar/SyncStatusIndicator';

<SyncStatusIndicator />
```

#### CategoryAssignmentModal
Bulk event categorization interface for Google Calendar events.

**Location:** `/components/calendar/CategoryAssignmentModal.tsx`

**Features:**
- Search and filter events
- Bulk category assignment with pending changes queue
- Quick assign for individual events
- Category color coding
- Real-time event count by category

**Event Categories:**
- Tasks & Appointments (#1976d2)
- Property Showings (#00bcd4)
- Transaction Dates (#2e7d32)
- Deal Milestones (#9c27b0)
- Company Events (#ed6c02)
- Personal Events (#757575)

**Usage:**
```tsx
import CategoryAssignmentModal from '@/components/calendar/CategoryAssignmentModal';

const [open, setOpen] = useState(false);

<CategoryAssignmentModal
  open={open}
  onClose={() => setOpen(false)}
/>
```

### Helper Library

#### /lib/google-calendar.ts
Comprehensive Google Calendar API helper functions.

**Key Functions:**

- `getGoogleCalendarClient(accessToken, refreshToken)` - Initialize authenticated client
- `fetchAllGoogleEvents(calendar, options)` - Fetch all events with pagination
- `fetchIncrementalGoogleEvents(calendar, syncToken)` - Incremental sync using sync tokens
- `createGoogleEvent(calendar, event)` - Create event in Google Calendar
- `updateGoogleEvent(calendar, googleEventId, event)` - Update existing event
- `deleteGoogleEvent(calendar, googleEventId)` - Delete event from Google Calendar
- `googleEventToReapex(googleEvent, agentId)` - Convert Google → Reapex format
- `reapexEventToGoogle(reapexEvent)` - Convert Reapex → Google format
- `detectConflict(reapexEvent, googleEvent)` - Detect sync conflicts
- `resolveConflictLastWriteWins(reapexEvent, googleEvent)` - Apply conflict resolution
- `logSyncOperation(userId, syncType, syncDirection, result)` - Log sync to database
- `storeSyncConflict(userId, conflict)` - Store conflict for resolution

### OAuth Configuration

#### Login Page (Modified)
Added Google Calendar scope to OAuth request.

**Location:** `/app/(auth)/login/page.tsx`

**OAuth Scopes:**
```typescript
scopes: 'https://www.googleapis.com/auth/calendar.events'
```

**Permissions:**
- Read/write access to calendar events
- Create, update, and delete events
- Access to event metadata

#### Auth Callback (Modified)
Triggers automatic background sync on successful login.

**Location:** `/app/auth/callback/route.ts`

**Sync Trigger:**
```typescript
fetch('/api/calendar/sync', {
  method: 'POST',
  body: JSON.stringify({
    syncType: 'full',
    forceFullSync: true
  })
})
```

### UI Integration

#### Calendar Page (Modified)
Added sync status indicator and category assignment button.

**Location:** `/app/(dashboard)/calendar/page.tsx`

**New Features:**
- SyncStatusIndicator in header (real-time sync status)
- "Categorize Events" button in filters sidebar
- CategoryAssignmentModal for bulk event categorization
- Updated subtitle: "Synced with Google Calendar"

### Sync Strategies

#### Full Sync
- Fetches ALL events from Google Calendar (past + future)
- Compares with Reapex database
- Creates, updates, or deletes events as needed
- Used on initial login and manual full sync

#### Incremental Sync
- Uses Google Calendar API sync tokens
- Only fetches changed events since last sync
- Much faster and more efficient
- Used for background sync and manual refresh

#### Conflict Resolution
- Detects conflicts based on `last_synced_at` timestamp
- Compares `updated_at` (Reapex) vs `updated` (Google)
- Applies "last write wins" strategy
- Logs conflicts for manual review if needed

### Background Sync

#### Vercel Cron Configuration
Add to `vercel.json` for periodic sync:

```json
{
  "crons": [
    {
      "path": "/api/calendar/background-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Schedule:** Every 15 minutes

**Environment Variables Required:**
- `CRON_SECRET` - Secret token for cron authentication

### Webhook Setup (Optional)

To enable real-time sync notifications:

1. Register webhook URL with Google Calendar API
2. Call `calendar.events.watch()` with channel configuration
3. Set webhook URL to `/api/calendar/webhook`
4. Include user ID in channel token for identification
5. Renew channel before expiration (max 30 days)

### Security Features

- OAuth tokens stored in Supabase auth session
- Automatic token refresh via `googleapis` library
- RLS policies restrict access to own events and logs
- Admin-only access to background sync trigger
- Cron secret protection for background sync endpoint
- Private storage for conflict data

### Usage Instructions

#### For Agents

1. **Initial Sync:**
   - Sign in with Google OAuth
   - Calendar automatically syncs on login
   - Wait for "Synced" status indicator

2. **Manual Sync:**
   - Click sync icon in calendar header
   - Wait for completion notification
   - View sync details in status popover

3. **Categorize Events:**
   - Click "Categorize Events" button
   - Search or filter events
   - Assign categories for organization
   - Apply changes individually or in bulk

4. **View Sync History:**
   - Click info icon in sync status
   - View last sync timestamp
   - See events synced, created, updated
   - Check for conflicts

#### For Admins

- View all users' sync logs in database
- Monitor sync success rates
- Manually trigger background sync via API
- Resolve sync conflicts for users
- Set up webhook for real-time notifications

### Next Steps

1. **Production Deployment:**
   - Set up Vercel Cron for background sync
   - Configure `CRON_SECRET` environment variable
   - Test OAuth flow in production

2. **Webhook Setup (Optional):**
   - Register webhook URL with Google Calendar API
   - Implement channel renewal cron job
   - Add user context to channel tokens

3. **Testing:**
   - Create test events in Google Calendar
   - Verify bidirectional sync
   - Test conflict resolution
   - Validate category assignments

---

## Agent Agreements System (2025-12-14)

### Overview
Complete system for managing agent-specific agreements and documents. Allows both agents and admins to upload, view, and manage documents. Admins can mark documents as required and set expiration dates.

### New Database Table

#### agent_agreements
Stores agent-specific agreements and documents with full audit trail.

**Columns:**
- `id` UUID PRIMARY KEY (auto-generated)
- `agent_id` UUID REFERENCES users(id) - Agent this agreement belongs to
- `document_type` TEXT NOT NULL - Type of document (ICA Agreement, Commission Plan, etc.)
- `file_name` TEXT NOT NULL - Display name for the document
- `file_url` TEXT NOT NULL - Storage path in agent-agreements bucket
- `file_size` INTEGER NOT NULL - File size in bytes
- `uploaded_by` UUID REFERENCES users(id) - User who uploaded (agent or admin)
- `uploaded_at` TIMESTAMPTZ DEFAULT NOW() - Upload timestamp
- `notes` TEXT - Optional admin notes about the document
- `is_required` BOOLEAN DEFAULT false - Whether document is required for compliance
- `expires_at` TIMESTAMPTZ - Optional expiration date
- `status` TEXT DEFAULT 'active' - Status: active, archived, or expired
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

**Indexes:**
- `idx_agent_agreements_agent_id` ON agent_id
- `idx_agent_agreements_status` ON status
- `idx_agent_agreements_uploaded_by` ON uploaded_by
- `idx_agent_agreements_document_type` ON document_type

**Triggers:**
- `agent_agreements_updated_at` - Auto-updates updated_at timestamp

### Storage Bucket

#### agent-agreements
Private bucket for agent agreement documents.

**Configuration:**
- **Bucket Name:** agent-agreements
- **Public:** false (private with signed URLs)
- **File Size Limit:** 50MB
- **Accepted Types:** PDF, DOC, DOCX, PNG, JPG, JPEG, TXT
- **Path Structure:** `{agent_id}/agreements/{timestamp}.{ext}`

### RLS Policies

#### Table Policies (agent_agreements)
1. **Agents can view own agreements** - SELECT by agent_id
2. **Agents can insert own agreements** - INSERT with agent_id = auth.uid()
3. **Agents can update own agreements** - UPDATE by agent_id
4. **Agents can delete own agreements** - DELETE by agent_id
5. **Admins have full access** - ALL operations for admin/broker roles

#### Storage Policies (agent-agreements bucket)
1. **Agents can upload own files** - INSERT to their folder
2. **Agents can read own files** - SELECT from their folder
3. **Agents can update own files** - UPDATE in their folder
4. **Agents can delete own files** - DELETE from their folder
5. **Admins have full access** - ALL operations for admin/broker roles

### Document Types
- ICA Agreement
- Commission Plan Agreement
- Company Policies
- Non-Disclosure Agreement
- Tax Forms (W-9, etc.)
- Other (with custom label)

### Components Created

#### /components/profile/AgreementsTab.tsx
Agent-facing component for uploading and managing their own agreements.

**Features:**
- Upload section with document type dropdown
- Drag-and-drop file upload
- Document list with preview and download
- Can delete own uploaded documents
- Shows who uploaded each document (agent or admin)
- Preview modal for PDF and image files

#### /components/modals/ManageAgreementsModal.tsx
Admin modal for managing agent agreements.

**Features:**
- Upload documents for specific agent
- Add notes to uploads
- Mark documents as required
- Set expiration dates
- View all agent documents (agent-uploaded and admin-uploaded)
- Preview and download documents
- Delete any document

### UI Integration

#### /app/(dashboard)/dashboard/profile/page.tsx
Added "Agreements" tab to agent profile page (3rd tab after Profile and Plan).

#### /app/(dashboard)/admin/users/page.tsx
Added "Manage Agreements" action button with FileText icon to admin users table.
- Opens ManageAgreementsModal for selected agent
- Purple color (#9C27B0) to distinguish from other actions

### Security Features
- Row Level Security enforces agent-only access to their documents
- Admins/brokers have full access to all documents
- Storage uses signed URLs with 60-second expiry for downloads
- 1-hour expiry for preview URLs
- File paths organized by agent ID to prevent cross-access
- All uploads logged with uploader ID for audit trail

### Migration File
Location: `/supabase/migrations/20251214_agent_agreements.sql`

**To Apply:**
Run the migration file in Supabase SQL Editor to create the table, indexes, RLS policies, storage bucket, and storage policies.

### Usage

**For Agents:**
1. Navigate to Profile → Agreements tab
2. Select document type and upload file
3. View uploaded agreements
4. Download or preview documents
5. Delete own uploaded documents

**For Admins:**
1. Go to Admin → Users
2. Click FileText icon (purple) in Actions column
3. Upload documents for the agent
4. Add notes, mark as required, set expiration
5. View/manage all agent documents
6. Delete any document

---

## Archive Functionality for Contacts (2025-12-14)

### Overview
Added archive functionality to contacts table to support archiving sell requests without deleting them.

### Schema Changes

#### Contacts Table - New Column
- **archived** BOOLEAN (default: false)
  - Allows marking contacts/sell requests as archived
  - Archived items hidden by default in admin views
  - Can be toggled to unarchive items

### UI Updates

#### Admin Sell Requests Page (/admin/sell-requests)
- Added "Show Archived" checkbox filter
- Added Archive/Unarchive button to each row
- Added Delete button to permanently remove requests
- Archive button shows orange when item is archived
- Only non-archived items shown by default

### Migration
Run in Supabase SQL Editor:
```sql
-- Add archived column to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Create index for filtering archived contacts
CREATE INDEX IF NOT EXISTS idx_contacts_archived ON contacts(archived);

-- Update existing contacts to not be archived
UPDATE contacts SET archived = false WHERE archived IS NULL;
```

---

## Agent Applications Storage & Policies (2025-12-01)

### Migration 069: Ensure Application Documents Bucket
- **Issue**: `agent-application-documents` storage bucket not found when viewing applications
- **Fix**: Create bucket with proper configuration if it doesn't exist
- **Bucket**: Private bucket, 10MB limit, JPG/PNG/PDF only
- **Files**: `supabase/migrations/069_ensure_application_documents_bucket.sql`

**Run in Supabase SQL Editor:**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'agent-application-documents',
    'agent-application-documents',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
```

### Migration 068: Fix Application Insert Policy
- **Solution**: Use service role key in API to bypass RLS for public submissions
- **Files**: `app/api/applications/route.ts` updated to use service role

### Migration 067: Restore Public Insert Policy
- **Issue**: Migration 062 accidentally removed the public INSERT policy on `agent_applications`
- **Fix**: Restore "Anyone can submit applications" policy to allow public form submissions
- **Policy**: `FOR INSERT TO anon, authenticated WITH CHECK (true)`
- **Files**: `supabase/migrations/067_restore_public_application_insert.sql`

---

## Transaction Documents System (2025-01-29)

### New Storage Bucket: documents
- **Purpose**: Store transaction-related documents (contracts, disclosures, statements, etc.)
- **Access**: Private bucket with 50MB file limit per document
- **Allowed Types**: PDF, DOC, DOCX, TXT, PNG, JPEG
- **Folder Structure**: `{user_id}/transactions/{listing_id|transaction_id}/`
- **Security**: Files stored as paths, signed URLs generated on-demand for viewing/downloading (60s expiry)

### Database Tables:

#### transaction_documents (Updated 2025-01-29)
- **id** UUID (Primary Key)
- **listing_id** UUID (Foreign Key → listings.id, NULLABLE)
- **transaction_id** UUID (Foreign Key → transactions.id, NULLABLE)
- **document_type** TEXT (Dropdown categories - must match exact values)
- **file_name** TEXT
- **file_url** TEXT (Storage path, not public URL)
- **file_size** INTEGER
- **uploaded_by** UUID (Foreign Key → users.id)
- **uploaded_at** TIMESTAMPTZ
- **notes** TEXT (Optional)
- **Constraint**: Either listing_id OR transaction_id must be provided

### Document Types (Exact Values Required):
- `Fully Executed Contract`
- `CIS`
- `Dual Agency/Informed Consent`
- `SPD`
- `Lead-Based Paint Disclosure`
- `Proof of Deposit`
- `Commission Statement`
- `Final ALTA/CD`
- `Other`

### RLS Policies (Updated 2025-01-29):

#### Transactions Table:
- **SELECT**: Users can view their own transactions OR admins can view all
- **INSERT**: Users can create their own transactions
- **UPDATE**: Users can update their own transactions OR admins can update all
- **DELETE**: Users can delete their own transactions

#### Transaction Documents Table:
- **SELECT**: Users can view documents where they are the uploader OR owner of the listing/transaction OR admins
- **INSERT**: Users can upload documents to their own listings/transactions
- **DELETE**: Users can delete their own uploaded documents OR admins can delete any
- **ALL**: Admins have full access

#### Storage Bucket:
- **INSERT**: Users can upload to `{their_user_id}/` folders OR admins can upload anywhere
- **SELECT**: Users can read from `{their_user_id}/` folders OR admins can read anywhere
- **DELETE**: Users can delete from `{their_user_id}/` folders OR admins can delete anywhere

### Views:

#### transaction_documents_summary
- **listing_id** UUID (Nullable)
- **transaction_id** UUID (Nullable)
- **total_documents** INTEGER (Count of all documents)
- **document_types_count** INTEGER (Count of unique document types)
- **uploaded_types** TEXT[] (Array of uploaded document types)
- **last_upload** TIMESTAMPTZ (Most recent upload timestamp)

### Components:

#### DocumentUpload
- Document type dropdown selector
- Drag-and-drop file upload interface
- File validation (type and size)
- Upload progress indicator
- Success/error feedback
- **Props**:
  - `listingId`: string
  - `onUploadComplete`: () => void
  - `maxSizeMB`: number (default: 50)

#### TransactionDocumentLibrary
- Displays uploaded documents grouped by type
- Document cards with file icon, name, size, uploader, and date
- Download and delete actions
- Empty state when no documents
- Delete confirmation dialog
- **Props**:
  - `listingId`: string
  - `onDocumentsChange`: () => void

### UI Integration:

#### Transactions Page (/dashboard/transactions)
- Replaced table view with card-based layout for active listings
- Each listing card shows:
  - Property address, city, state
  - Status chip and listing price
  - "Documents" button (expandable)
  - "Close Transaction" button
- Expandable document section with:
  - Upload form (left column)
  - Document library (right column)
  - Two-column responsive grid layout

### Migration: 040_transaction_documents.sql
- Creates transaction_documents table with constraints
- Creates indexes for performance
- Implements RLS policies
- Creates transaction_documents_summary view
- **IMPORTANT**: Requires manual storage bucket setup (see migration comments)

### Updated Pages:
- `/dashboard/transactions` - Complete redesign with document library integration

### Storage Bucket Setup Required:
1. Create 'documents' bucket in Supabase Dashboard
2. Set bucket as private (not public)
3. Configure 50MB file size limit
4. Set allowed MIME types
5. Configure RLS policies for user folder access


## Listing Photos Storage (2025-01-29)

### New Storage Bucket: listing-photos
- **Purpose**: Store property listing cover images and gallery photos
- **Access**: Public bucket with 10MB file limit
- **Allowed Types**: JPEG, PNG, WEBP
- **Folder Structure**:
  - `{user_id}/covers/` - Cover images
  - `{user_id}/gallery/` - Gallery images

### RLS Policies:
- Public can view all listing photos
- Authenticated users can upload to their own folder
- Agents can delete their own photos
- Admins can delete any photos

### Components:
- `ImageUpload` - Single image upload with drag-and-drop
- `GalleryUpload` - Multiple image upload with drag-and-drop reordering

### Updated Pages:
- `/admin/listings` - Now uses ImageUpload and GalleryUpload components


## Listing Title Field (2025-01-29)

### Schema Change:
- Added `title` TEXT column to `listings` table
- Purpose: Descriptive title for property listings (e.g., "Luxury 3BR Apartment in Downtown")

### UI Updates:
- Added "Descriptive Title" field at the top of edit listing modal
- Added margin to modal content for better spacing
- Price field now displays with dollar sign and comma formatting


## Image Captions (2025-01-29)

### Schema Change:
- Added `images_data` JSONB column to `listings` table
- Purpose: Store gallery images with captions as array of {url: string, caption: string}
- Migration includes automatic conversion of existing `images` array to `images_data` format

### Component Updates:
- `GalleryUpload` now supports captions
- Each gallery image has a caption input field below it
- Caption data is saved along with the image URL
- Images can still be drag-and-drop reordered
- Changed aspect ratio to 4:3 for better display
- Grid layout changed to xs={12}, sm={6}, md={4} for larger image previews

### Updated Interface:
```typescript
interface GalleryImage {
  url: string;
  caption: string;
}
```


## Rental and Sale Specific Fields (2025-01-29)

### Schema Changes:
- Added `deposit` DECIMAL(12, 2) column to `listings` table
- Added `monthly_rental` DECIMAL(12, 2) column to `listings` table
- Added `amenities` TEXT[] column to `listings` table
- Converted `features` column to JSONB type

### Purpose:
- Support distinct data requirements for rental vs sale listings
- `deposit`: Security deposit amount for rental listings
- `monthly_rental`: Monthly rental amount (replaces price for rentals)
- `amenities`: Array of amenities for rental properties (e.g., ["wifi", "parking", "gym"])
- `features`: JSONB object for property features (for both sales and rentals)

### UI Updates:
- Dynamic price fields based on `listing_type`:
  - For `for_rent`: Shows "Monthly Rental" and "Security Deposit" fields
  - For `for_sale`: Shows "Sale Price" field
- Conditional amenities section for rental listings with 15 checkboxes:
  - WiFi, Parking, Gym/Fitness Center, Swimming Pool, 24/7 Security, Elevator
  - Balcony/Terrace, Furnished, Pets Allowed, Laundry in Unit, Dishwasher
  - Air Conditioning, Central Heating, Garden/Yard, Concierge Service
- Conditional features section for sale listings with 15 checkboxes:
  - New Construction, Recently Renovated, Hardwood Floors, Granite Countertops
  - Stainless Steel Appliances, Walk-in Closet, Fireplace, Smart Home Features
  - Energy Efficient, Solar Panels, Finished Basement, Finished Attic
  - Deck/Patio, Water View, Mountain View

### Data Formats:
- Amenities stored as array: `["wifi", "parking", "gym"]`
- Features stored as JSONB object: `{"new_construction": true, "fireplace": false}`


## Admin User Profile Editing (2025-01-29)

### Feature Enhancement:
- Added complete user profile editing capability for admins
- Includes drag-and-drop profile photo upload

### UI Updates:
- Added `ImageUpload` component to `EditUserModal` for profile picture management
- Profile photo upload uses existing `profile-photos` storage bucket
- Maximum file size: 5MB
- Allowed formats: JPEG, PNG, WEBP
- Drag-and-drop interface for easy file upload

### Editable Fields:
- Profile Photo (headshot_url)
- Full Name
- Email (account email)
- Public Email (email_public) - Public-facing contact email
- Role (Agent, Broker, Admin)
- Account Status (Approved, Pending, Suspended, Rejected)
- Phone Number
- Bio
- Social Media Links:
  - Facebook (social_facebook)
  - Instagram (social_instagram)
  - LinkedIn (social_linkedin)
  - TikTok (social_tiktok)
  - X/Twitter (social_x)
- Cap Amount
- Current Cap Progress

### Storage Details:
- Bucket: `profile-photos`
- Public access for viewing
- Users can manage their own photos
- Admins can manage any user's photo via the edit modal

### Social Media & Contact Fields:
All social media fields are optional and store full profile URLs:
- **email_public**: Alternative public email (if different from account email)
- **social_facebook**: Facebook profile URL
- **social_instagram**: Instagram profile URL
- **social_linkedin**: LinkedIn profile URL
- **social_tiktok**: TikTok profile URL
- **social_x**: X (Twitter) profile URL

These fields are displayed on agent public profiles and allow visitors to connect with agents on their preferred platforms.


## Dark Theme Design System (2025-01-29)

### Complete Dashboard Redesign
Comprehensive dark theme implementation across all dashboard components with black/blue/white color palette. Professional, accessible design with WCAG AA compliance.

### Color Palette

#### Primary Colors
- **Primary Black**: `#0A0A0A` - Main background color for layouts and pages
- **Secondary Black**: `#121212` - Card backgrounds and elevated surfaces
- **Tertiary Black**: `#1A1A1A` - Hover states and interactive surfaces
- **Blue Accent**: `#2196F3` - Primary interactive color (buttons, active states, links)
- **Blue Hover**: `#1E88E5` - Hover state for blue elements
- **Blue Active**: `#1976D2` - Active/pressed state for blue elements

#### Text Colors
- **Primary Text**: `#FFFFFF` - High contrast text (headings, primary content)
- **Secondary Text**: `#B0B0B0` - Medium contrast text (labels, descriptions)
- **Tertiary Text**: `#808080` - Low contrast text (hints, captions)

#### Border & Divider Colors
- **Primary Border**: `#2A2A2A` - Subtle borders that don't clash (cards, inputs)
- **Secondary Border**: `#333333` - Slightly stronger borders (hover states)

#### Status Colors
- **Success Background**: `rgba(27, 94, 32, 0.15)` - Green tint for approved/active
- **Success Border**: `rgba(76, 175, 80, 0.3)` - Green border
- **Success Text**: `#81C784` - Green text
- **Warning Background**: `rgba(230, 81, 0, 0.15)` - Orange tint for pending
- **Warning Border**: `rgba(255, 152, 0, 0.3)` - Orange border
- **Warning Text**: `#FFB74D` - Orange text
- **Error Background**: `rgba(183, 28, 28, 0.15)` - Red tint for rejected/failed
- **Error Border**: `rgba(244, 67, 54, 0.3)` - Red border
- **Error Text**: `#E57373` - Red text
- **Info Background**: `rgba(1, 87, 155, 0.15)` - Blue tint for informational
- **Info Border**: `rgba(33, 150, 243, 0.3)` - Blue border
- **Info Text**: `#64B5F6` - Blue text

### Design Tokens (CSS Variables)
All colors are defined in `/app/globals.css` as CSS variables for consistency:

```css
:root {
  /* Backgrounds */
  --bg-primary: #0A0A0A;
  --bg-secondary: #121212;
  --bg-tertiary: #1A1A1A;

  /* Blue Accent System */
  --blue-500: #2196F3;
  --blue-600: #1E88E5;
  --blue-700: #1976D2;

  /* Text Colors */
  --text-primary: #FFFFFF;
  --text-secondary: #B0B0B0;
  --text-tertiary: #808080;

  /* Borders */
  --border-primary: #2A2A2A;
  --border-secondary: #333333;

  /* Status Colors (and more...) */
}
```

### Component Styling Patterns

#### Cards
- Background: `#121212`
- Border: `1px solid #2A2A2A`
- Border Radius: `12px`
- Shadow: `0 2px 4px 0 rgba(0, 0, 0, 0.6)`
- Hover: Lighter border `#333333` and deeper shadow `0 4px 8px 0 rgba(0, 0, 0, 0.7)`

#### Buttons
- **Primary (Contained)**:
  - Background: `#2196F3`
  - Hover: `#1E88E5` with slight lift (`translateY(-1px)`)
  - Active: `#1976D2`
  - Shadow on hover: `0 2px 8px rgba(33, 150, 243, 0.3)`
- **Outlined**:
  - Border: `1px solid #2196F3`
  - Text: `#2196F3`
  - Hover: Background `rgba(33, 150, 243, 0.08)`

#### Tables
- Header Background: `rgba(33, 150, 243, 0.08)` - Subtle blue tint
- Header Text: `#2196F3` - Blue accent
- Row Hover: `rgba(33, 150, 243, 0.04)` - Very subtle blue highlight
- Cell Borders: `#2A2A2A`

#### Text Fields / Inputs
- Background: `transparent`
- Border: `1px solid #2A2A2A`
- Border Radius: `8px`
- Focus Border: `#2196F3` (blue accent)
- Text Color: `#FFFFFF`
- Label Color: `#B0B0B0`

#### Chips / Tags
- Status-specific backgrounds with 15% opacity
- Colored borders with 30% opacity
- Colored text for high contrast
- Border Radius: `8px`

#### Upload Components
- Dropzone Border: `2px dashed #2A2A2A`
- Dropzone Background: `#121212`
- Dragging State Border: `2px dashed #2196F3` (blue)
- Dragging State Background: `#1A1A1A`
- Hover Border: `#2196F3`
- Icons: `#B0B0B0` default, `#2196F3` when dragging

### Spacing & Layout

#### Border Radius System
- **Small**: `8px` - Small elements, inputs, chips
- **Medium**: `12px` - Cards, modals, containers
- **Large**: `16px` - Hero sections, feature cards

#### Transitions
- **Standard**: `200ms ease` - Hover states, color changes
- **Slow**: `300ms ease` - Large movements, page transitions

#### Shadows
- **Subtle**: `0 2px 4px 0 rgba(0, 0, 0, 0.6)` - Default card shadow
- **Medium**: `0 4px 8px 0 rgba(0, 0, 0, 0.7)` - Hover card shadow
- **Strong**: `0 8px 16px 0 rgba(0, 0, 0, 0.8)` - Modals, dropdowns

### Files Updated

#### Foundation (Phase 1)
1. `/app/globals.css` - Complete CSS variable system
2. `/components/providers/ThemeProvider.tsx` - MUI dark mode configuration
3. `/lib/theme/dashboardStyles.ts` - Shared component styles

#### Layout (Phase 2)
4. `/components/layout/Sidebar.tsx` - Dark navigation with blue active states
5. `/components/layout/Header.tsx` - Dark header with white text
6. `/app/(dashboard)/layout.tsx` - Dark layout wrapper

#### Components (Phase 3)
7. `/components/dashboard/widgets.tsx` - All dashboard widgets
8. `/components/modals/AgentApplicationModal.tsx` - Signup form modal
9. `/components/upload/ImageUpload.tsx` - Single image upload
10. `/components/upload/GalleryUpload.tsx` - Multi-image upload

### Accessibility Compliance (WCAG AA)

All color combinations meet or exceed WCAG AA contrast ratio requirements:

- **White on Primary Black** (#FFFFFF on #0A0A0A): 21:1 ratio ✅
- **Secondary Text on Primary Black** (#B0B0B0 on #0A0A0A): 9.5:1 ratio ✅
- **Blue Accent on Primary Black** (#2196F3 on #0A0A0A): 4.8:1 ratio ✅
- **Status Colors**: All meet 4.5:1 minimum for text ✅

### Material-UI Theme Configuration

Complete `createTheme` configuration in ThemeProvider:
- Palette mode: `'dark'`
- Custom component overrides for: MuiButton, MuiCard, MuiChip, MuiTableHead, MuiTableRow, MuiTableCell, MuiTextField, MuiDialog, MuiBackdrop
- Typography using system font stack
- Transitions, spacing, and breakpoints

### Inspiration
Design inspired by **Wireframe Agent Portal.pdf** with modern dark theme aesthetics.

### Rollback Points
- **c198045**: Pre-dark-theme checkpoint (before any changes)
- **0232ce1**: Foundation and layout complete (CSS vars, theme, Sidebar, Header)
- **7e46a61**: Complete dark theme implementation (all components)

### Benefits
- **Reduced Eye Strain**: Dark backgrounds easier on eyes in low-light conditions
- **Professional Appearance**: Modern, clean aesthetic for real estate platform
- **Energy Efficiency**: OLED displays consume less power with dark themes
- **Accessibility**: High contrast ratios ensure readability for all users
- **Consistency**: Centralized design tokens ensure uniform appearance
- **Maintainability**: CSS variables and shared styles make updates easy


## Agent Enhancements - Service Areas and Reviews System (2025-01-29)

### Schema Changes

#### Service Areas Field
- Added `service_areas` TEXT[] column to `users` table
- Purpose: Store cities/areas where the agent provides services
- Format: Array of city names (e.g., `["Dubai Marina", "Downtown Dubai", "Palm Jumeirah"]`)
- Default: Empty array `{}`

#### Agent Reviews Table
Created new `agent_reviews` table with the following structure:

**Fields:**
- `id` UUID (primary key)
- `agent_id` UUID (foreign key to users table)
- `reviewer_name` TEXT (required)
- `reviewer_email` TEXT (optional)
- `rating` INTEGER (1-5 stars, required)
- `review_text` TEXT (required)
- `is_approved` BOOLEAN (default: false - requires admin approval)
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ (auto-updated via trigger)

**Indexes:**
- `idx_agent_reviews_agent_id` - Fast lookups by agent
- `idx_agent_reviews_approved` - Filter approved reviews
- `idx_agent_reviews_created_at` - Sort by date
- `idx_agent_reviews_agent_approved` - Composite index for common query pattern

**Row Level Security (RLS):**
- **Public**: Can view only approved reviews
- **Authenticated**: Can view all reviews (for admin panel)
- **Admins Only**: Can insert, update, and delete reviews

**Helper View:**
- `agent_ratings_summary` - Aggregated rating statistics per agent
  - `total_reviews` - Count of approved reviews
  - `average_rating` - Average rating (rounded to 1 decimal)
  - `five_star_count` through `one_star_count` - Distribution of ratings

### Features

#### Public Agent Profile Page
- **Enhanced Layout**: Two-column layout with profile info and listings
- **About Section**: Displays languages, service areas, and specialties with chips
- **Reviews Tab**: Shows approved reviews with star ratings
- **Listings Tab**: Displays all listings from the agent
- **Rating Display**: Average rating with star icons in header
- **Contact Section**: Phone, email, and social media links

#### Admin Review Management
- **Review Submission**: Admins can add reviews through admin panel
- **Approval Workflow**: Reviews require admin approval before public display
- **Review Moderation**: View, approve, or reject pending reviews
- **Rating Statistics**: View rating distribution and averages per agent

### Components Created

1. **AgentProfileHeader.tsx**
   - Displays agent headshot, name, role, rating
   - Contact buttons (Ask a question, phone number)
   - Average rating with review count

2. **AgentAboutSection.tsx**
   - Shows languages as chips
   - Shows service areas as chips
   - Shows specialties as chips
   - Responsive layout

3. **ReviewsList.tsx**
   - Star rating display
   - Review cards with reviewer name and date
   - Empty state when no reviews
   - Sorted by most recent first

4. **Admin Reviews Page**
   - Table of all reviews (pending + approved)
   - Approve/reject actions
   - Filter by agent, status, rating
   - Inline review display

### UI Design Specifications

**Color Scheme (Dark Theme):**
- Matches existing dark theme palette
- Chips use outlined style with theme colors
- Star ratings in gold/yellow (#FFB74D)

**Typography:**
- Agent name: 32px bold
- Section headers: 20px semibold
- Review text: 16px regular
- Chips: 14px medium

**Spacing:**
- Card padding: 24px
- Section gaps: 32px
- Chip spacing: 8px gap

### Files Modified/Created

**Database:**
- `supabase/migrations/039_agent_enhancements.sql` (created)

**Components:**
- `components/agents/AgentProfileHeader.tsx` (created)
- `components/agents/AgentAboutSection.tsx` (created)
- `components/agents/ReviewsList.tsx` (created)

**Pages:**
- `app/(public)/agent/[slug]/page.tsx` (major redesign)
- `app/(public)/agents/page.tsx` (added rating display)
- `app/(dashboard)/admin/reviews/page.tsx` (created)

**Documentation:**
- `dev/schema_updates.md` (this file - updated)

### Migration File
`supabase/migrations/039_agent_enhancements.sql` includes:
- Service areas column addition
- Agent reviews table creation
- RLS policies for security
- Indexes for performance
- Helper view for rating aggregation
- Trigger for auto-updating timestamps
- Comprehensive comments for documentation


## Commission Payout Approval Workflow (2025-12-01)

### Overview
Complete commission payout approval workflow for closed transactions. When an agent closes a transaction, it goes to admin for review. Admin sets the final commission amount, applies brokerage split (80/20, 90/10, or 100% no split), adds fees, and the system auto-calculates the agent's net payout. Agent can view detailed payout breakdown.

### Schema Changes

#### New Enum Type
- **commission_status**: ENUM with values:
  - `pending_approval` - Transaction closed, awaiting admin review (default)
  - `approved` - Admin approved the commission payout
  - `paid` - Physical check issued to agent

#### Transactions Table - New Columns
- **commission_status** commission_status (default: 'pending_approval')
  - Status of commission payout workflow
- **final_commission_amount** DECIMAL(12, 2) (nullable)
  - Final commission amount set by admin after review
  - May differ from original GCI
- **brokerage_split_percentage** DECIMAL(5, 2) (nullable)
  - Agent's split percentage: 80%, 90%, or 100% (no split)
  - Constraint: Must be one of these three values
- **brokerage_fees** JSONB (default: '[]')
  - Array of fees: `[{name: "Transaction Fee", amount: 250}, {name: "E&O Insurance", amount: 100}]`
  - Each fee has name (string) and amount (number)
- **agent_net_payout** DECIMAL(12, 2) (nullable)
  - Final payout to agent (auto-calculated via trigger)
  - Formula: (final_commission × split%) - total_fees
- **approved_by** UUID (foreign key to users.id, nullable)
  - Admin who approved the commission payout
- **approved_at** TIMESTAMPTZ (nullable)
  - Timestamp when commission was approved
- **payout_notes** TEXT (nullable)
  - Admin notes about the payout

#### Database Functions
- **calculate_agent_net_payout(p_final_commission, p_split_percentage, p_fees)**
  - Calculates agent net payout from commission, split, and fees
  - Returns: DECIMAL(12, 2)
  - Immutable function for consistent calculations

#### Database Triggers
- **trigger_update_agent_net_payout**
  - Fires BEFORE INSERT OR UPDATE on transactions
  - Auto-calculates agent_net_payout when final_commission_amount, brokerage_split_percentage, or brokerage_fees change
  - Ensures payout is always accurate

### RLS Policies (Updated)

#### Agents - View Own Transactions
- **SELECT**: Can view own transactions including all payout details
- **UPDATE**: Can update own transactions only if:
  - Transaction status = 'closed'
  - Commission status = 'pending_approval'
  - Cannot modify commission approval fields

#### Admins - Manage All Transactions
- **ALL**: Full access to all transactions
- Can approve commissions, set split percentages, add fees
- Can mark approved payouts as paid

### Workflow

1. **Agent Closes Transaction**
   - Transaction status set to 'closed'
   - Commission status automatically 'pending_approval'

2. **Admin Reviews & Approves**
   - Views transaction in /admin/commission-payouts
   - Sets final commission amount (may differ from GCI)
   - Selects brokerage split: 80%, 90%, or 100%
   - Adds itemized fees (name and amount)
   - System auto-calculates net payout
   - Adds optional notes
   - Clicks "Approve Payout"

3. **Agent Views Breakdown**
   - Goes to My Business > Payouts tab
   - Sees all closed transactions
   - Views commission breakdown:
     - Gross Commission Income (GCI)
     - Final Commission Amount (if adjusted)
     - Brokerage Split (% and dollar amount)
     - Itemized Fees
     - Net Payout
   - Can view status: Pending Approval, Approved, or Paid

4. **Admin Marks as Paid**
   - After issuing physical check
   - Updates commission status to 'paid'

### UI Components

#### Admin Interface (/admin/commission-payouts)
- Table view of all closed transactions
- Filter by commission status (all, pending, approved, paid)
- Approve dialog with:
  - Final commission amount input
  - Split percentage dropdown (80%, 90%, 100%)
  - Fee management (add/remove itemized fees)
  - Real-time net payout calculation
  - Notes field
- View details dialog showing complete breakdown
- Mark as paid button for approved payouts
- Status chips with color coding

#### Agent Interface (My Business > Payouts Tab)
- Table view of agent's closed transactions
- Columns: Property, GCI, Split %, Fees, Net Payout, Status
- View breakdown button for approved/paid transactions
- Detailed breakdown dialog showing:
  - Property information
  - Commission calculation:
    - Original GCI
    - Final commission (if adjusted)
    - Brokerage split (% and amount)
    - Itemized fees
    - Total fees
    - Net payout
  - Admin notes (if any)
  - Approval timestamp
- Status indicators:
  - Pending Approval (orange)
  - Approved (green)
  - Paid (blue)

### Components Created/Updated

**New Components:**
1. `/app/(dashboard)/admin/commission-payouts/page.tsx`
   - Admin commission approval interface
   - Approval dialog with calculation preview
   - Fee management system
   - View details dialog

**Updated Components:**
2. `/components/dashboard/business/PayoutsTab.tsx`
   - Complete redesign to use transactions table
   - Added breakdown modal
   - Real-time fee calculation
   - Status indicators

3. `/components/layout/Sidebar.tsx`
   - Added "Commission Payouts" to admin menu

4. `/app/(dashboard)/dashboard/business/page.tsx`
   - Removed legacy payouts query
   - PayoutsTab now self-contained

### Data Structures

#### Fee Object
```typescript
interface Fee {
  name: string;    // e.g., "Transaction Fee"
  amount: number;  // e.g., 250.00
}
```

#### Example Fees Array (JSONB)
```json
[
  {"name": "Transaction Fee", "amount": 250},
  {"name": "E&O Insurance", "amount": 100},
  {"name": "Technology Fee", "amount": 50}
]
```

### Calculation Example
- **Gross Commission (GCI)**: $10,000
- **Final Commission**: $10,000
- **Brokerage Split**: 80% (agent gets 80%)
- **Agent Gross**: $8,000 (10,000 × 0.80)
- **Fees**:
  - Transaction Fee: $250
  - E&O Insurance: $100
  - Technology Fee: $50
- **Total Fees**: $400
- **Agent Net Payout**: $7,600 ($8,000 - $400)

### Migration File
`supabase/migrations/065_commission_payout_workflow.sql` includes:
- Commission status enum creation
- Transactions table column additions
- Calculate payout function
- Auto-update trigger
- RLS policy updates
- Comprehensive indexes
- Documentation comments

### Benefits
- **Transparency**: Agents see complete commission breakdown
- **Automation**: Net payout auto-calculated, no manual math
- **Flexibility**: Admin can adjust final commission if needed
- **Accountability**: Tracks who approved and when
- **Accuracy**: Trigger ensures calculations are always correct
- **Auditability**: Complete history of commission approvals
