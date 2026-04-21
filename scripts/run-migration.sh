#!/bin/bash

# Migration Runner Script
# This script runs the database migration using psql

echo "🚀 Running Supabase Database Migration..."
echo ""

# Check if migration file exists
MIGRATION_FILE="supabase/migrations/001_initial_schema.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Found migration file: $MIGRATION_FILE"
echo ""
echo "To run this migration, you have two options:"
echo ""
echo "OPTION 1: Via Supabase Dashboard (Easiest)"
echo "1. Go to: https://supabase.com/dashboard/project/vwbqtrffvbpkmxfuenrs/sql"
echo "2. Click 'New Query'"
echo "3. Copy the contents of $MIGRATION_FILE"
echo "4. Paste and click 'Run'"
echo ""
echo "OPTION 2: Via Supabase CLI (Requires login)"
echo "1. Get your access token from: https://supabase.com/dashboard/account/tokens"
echo "2. Run: export SUPABASE_ACCESS_TOKEN=your_token"
echo "3. Run: supabase link --project-ref vwbqtrffvbpkmxfuenrs"
echo "4. Run: supabase db push"
echo ""
echo "OPTION 3: Via psql (Requires database password)"
echo "1. Get your database password from Supabase Dashboard → Settings → Database"
echo "2. Run: PGPASSWORD=your_password psql -h db.vwbqtrffvbpkmxfuenrs.supabase.co -U postgres -d postgres -f $MIGRATION_FILE"
echo ""

# Try to use Supabase CLI if available
if command -v supabase &> /dev/null; then
    echo "💡 Supabase CLI detected. Attempting to run migration..."
    echo ""
    
    # Check if already linked
    if [ -f ".supabase/config.toml" ]; then
        echo "📦 Pushing migration via Supabase CLI..."
        supabase db push
    else
        echo "⚠️  Project not linked. Please run:"
        echo "   supabase login"
        echo "   supabase link --project-ref vwbqtrffvbpkmxfuenrs"
        echo "   supabase db push"
    fi
else
    echo "⚠️  Supabase CLI not found. Please use Option 1 (Dashboard) above."
fi

