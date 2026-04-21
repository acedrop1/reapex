# Database Schema Documentation

Last Updated: 2025-01-24

## Users Table

Extended from Supabase auth.users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| email | TEXT | User email |
| full_name | TEXT | Full name |
| role | user_role | Enum: agent, admin, broker |
| title | VARCHAR(100) | Professional title (admin-editable only, default: 'LICENSED REALTOR') |
| headshot_url | TEXT | Profile picture URL |
| bio | TEXT | Agent biography |
| phone | TEXT | Phone number |
| license_number | TEXT | Real estate license number |
| specialties | TEXT[] | Agent specialties |
| languages | TEXT[] | Languages spoken |
| years_experience | INTEGER | Years of experience |
| is_active | BOOLEAN | Active status (default: true) |
| display_order | INTEGER | Display order for agent listings (default: 0) |
| cap_amount | DECIMAL(12,2) | Commission cap amount (default: 0) |
| current_cap_progress | DECIMAL(12,2) | Current cap progress (default: 0) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### RLS Policies
- Users can view their own profile
- Admins/brokers can view all users
- Users can update their own profile
- Admins/brokers can update all user profiles
- Admins/brokers can delete users

## Listings Table

Property listings for the public website and agent portal

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_id | UUID | Foreign key to users table |
| property_type | TEXT | apartment, single_family_home, condo, villa, office, shop, studio |
| listing_type | TEXT | for_sale, for_rent |
| property_address | TEXT | Street address |
| property_city | TEXT | City |
| property_state | TEXT | State |
| property_zip | TEXT | ZIP code |
| price | DECIMAL(12,2) | Listing price |
| price_period | TEXT | yearly, monthly (for rentals) |
| bedrooms | INTEGER | Number of bedrooms |
| bathrooms | INTEGER | Number of bathrooms |
| garages | INTEGER | Number of garages |
| square_feet | INTEGER | Square footage |
| description | TEXT | Property description |
| featured | BOOLEAN | Featured listing flag (default: false) |
| open_house | BOOLEAN | Open house flag (default: false) |
| mls_number | TEXT | MLS reference number (unique) |
| images | TEXT[] | Array of image URLs |
| status | TEXT | active, pending, sold, rented, inactive (default: active) |
| cover_image | TEXT | Primary/cover image URL |
| listing_url | TEXT | External URL link to full listing |
| features | JSONB | Property features object |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Features JSONB Structure
```json
{
  "laundry": "In-unit",
  "parking": "Garage",
  "lawn": true,
  "pool": true,
  "gym": false,
  "petFriendly": true,
  "furnished": false,
  "airConditioning": true,
  "heating": "Central",
  "appliances": ["Dishwasher", "Refrigerator", "Microwave", "Oven"],
  "utilities": ["Water", "Trash"],
  "amenities": ["Balcony", "Storage"]
}
```

### RLS Policies
- Agents can view their own listings
- Public can view active listings
- Agents can create their own listings
- Agents can update their own listings
- Agents can delete their own listings
- Admins/brokers can view all listings
- Admins/brokers can insert listings for any agent
- Admins/brokers can update all listings
- Admins/brokers can delete all listings

## Transactions Table

Agent transactions and deals

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_id | UUID | Foreign key to users table |
| property_address | TEXT | Property address |
| property_city | TEXT | City |
| property_state | TEXT | State |
| property_zip | TEXT | ZIP code |
| listing_price | DECIMAL(12,2) | Original listing price |
| sale_price | DECIMAL(12,2) | Final sale price |
| gci | DECIMAL(12,2) | Gross commission income (default: 0) |
| agent_split_percentage | DECIMAL(5,2) | Agent split percentage (default: 0) |
| agent_commission | DECIMAL(12,2) | Agent commission amount (default: 0) |
| status | transaction_status | pending, under_contract, closed, cancelled |
| closing_date | DATE | Closing date |
| contingency_date | DATE | Contingency date |
| listing_date | DATE | Listing date |
| documents | JSONB | Transaction documents (default: []) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### RLS Policies
- Agents can view their own transactions
- Admins/brokers can view all transactions
- Agents can create their own transactions
- Agents can update their own transactions
- Admins/brokers can update all transactions

## Announcements Table

Company-wide announcements

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Announcement title |
| content | TEXT | Announcement content |
| author_id | UUID | Foreign key to users table |
| priority | announcement_priority | low, medium, high |
| published_at | TIMESTAMP | Publication timestamp |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### RLS Policies
- All authenticated users can view published announcements
- Admins/brokers can view all announcements
- Admins/brokers can create announcements
- Admins/brokers can update announcements

## Applications Table

Agent applications for joining the brokerage

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| first_name | TEXT | Applicant first name |
| last_name | TEXT | Applicant last name |
| phone_number | TEXT | Phone number |
| email | TEXT | Email address |
| license_number | TEXT | Real estate license number |
| transactions_12_months | transaction_volume_range | Transaction volume: 0_5, 6_12, 13_plus |
| sales_volume_range | TEXT | under_2m, 2m_8m, over_8m |
| commission_plans | TEXT[] | Interested commission plans |
| photo_id_url | TEXT | Photo ID document URL |
| status | TEXT | pending, reviewing, approved, rejected |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMP | Creation timestamp |

### RLS Policies
- Admins/brokers can view all applications
- Admins/brokers can update applications

## Recent Schema Changes

### 2025-01-24: Transaction Volume Ranges
- Updated transactions_12_months field from INTEGER to transaction_volume_range enum
- New ranges: 0_5 (0-5 transactions), 6_12 (6-12 transactions), 13_plus (13+ transactions)
- Migrated existing integer data to appropriate ranges
- Migration: 026_update_transaction_volume_ranges.sql

### 2025-01-24: Admin RLS Policies
- Added admin policies for viewing, updating, and deleting all listings
- Added admin policies for viewing, updating, and deleting all user profiles
- Migration: 025_admin_rls_policies.sql

### 2025-01-21: Enhanced Listings Schema
- Added cover_image column for primary listing image
- Added features JSONB column for property features
- Added listing_url column for external listing links
- Migrated property_reference to mls_number
- Migration: 013_enhance_listings_schema.sql

## Admin Features

### Admin Dashboard Routes
- `/admin/applications` - Manage agent applications
- `/admin/listings` - Manage all property listings
- `/admin/agents` - Manage all agent profiles

### Admin API Routes
- `GET /api/admin/listings` - Get all listings
- `PUT /api/admin/listings` - Update any listing
- `DELETE /api/admin/listings?id={id}` - Delete any listing
- `GET /api/admin/agents` - Get all agents
- `PUT /api/admin/agents` - Update any agent profile
- `DELETE /api/admin/agents?id={id}` - Delete any agent

### Admin Permissions
- Admins and brokers can:
  - View all listings and edit all fields
  - View all agent profiles and edit all fields
  - Delete listings and agents
  - View and manage applications
  - Create and manage announcements
  - View all transactions
