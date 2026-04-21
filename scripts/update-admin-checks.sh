#!/bin/bash

# Script to update admin role checks to use isAdmin helper function
# This ensures both 'admin' and 'admin_agent' roles have admin privileges

echo "Updating admin privilege checks..."

# Files to update
FILES=(
  "app/(dashboard)/my-listings/page.tsx"
  "app/(dashboard)/my-listings/new/page.tsx"
  "app/(dashboard)/dashboard/forms/page.tsx"
  "app/(dashboard)/dashboard/marketing/page.tsx"
  "app/(dashboard)/dashboard/training/page.tsx"
  "app/(dashboard)/admin/users/page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Add import if not present
    if ! grep -q "import { isAdmin" "$file"; then
      # Find the last import line and add after it
      sed -i.bak "/^import/a\\
import { isAdmin as checkIsAdmin } from '@/lib/utils/auth';
" "$file"
    fi

    # Replace role === 'admin' with checkIsAdmin(role)
    sed -i.bak "s/\\.role === 'admin'/checkIsAdmin(&.role)/g" "$file"
    sed -i.bak "s/role === 'admin'/checkIsAdmin(role)/g" "$file"

    echo "  ✓ Updated $file"
  else
    echo "  ⚠ File not found: $file"
  fi
done

# Clean up backup files
find . -name "*.bak" -delete

echo "Done! Updated admin privilege checks."
echo ""
echo "Please review the changes and run 'npm run build' to verify."
