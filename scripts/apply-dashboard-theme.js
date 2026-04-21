#!/usr/bin/env node

/**
 * Dashboard Theme Transformer Script
 *
 * Applies black/white theme to all dashboard pages:
 * - Replaces Material-UI icons with Phosphor duotone icons
 * - Applies dashboardStyles to all components
 * - Removes border-radius and applies black borders
 * - Updates all colors to black/white scheme
 */

const fs = require('fs');
const path = require('path');

// Icon mapping: Material-UI -> Phosphor
const iconMap = {
  'Contacts': 'Users',
  'TrendingUp': 'TrendingUp',
  'Assignment': 'ListChecks',
  'Add': 'Plus',
  'Edit': 'PencilSimple',
  'CalendarToday': 'CalendarBlank',
  'AccountCircle': 'UserCircle',
  'Logout': 'SignOut',
  'PersonAdd': 'UserPlus',
  'AccountBalance': 'Bank',
  'Announcement': 'Megaphone',
  'Delete': 'Trash',
  'Save': 'FloppyDisk',
  'Close': 'X',
  'Check': 'Check',
  'MoreVert': 'DotsThreeVertical',
  'Search': 'MagnifyingGlass',
  'FilterList': 'Funnel',
  'Sort': 'ArrowsDownUp',
  'ArrowBack': 'ArrowLeft',
  'ArrowForward': 'ArrowRight',
  'Home': 'House',
  'Settings': 'Gear',
  'Notifications': 'Bell',
  'Email': 'Envelope',
  'Phone': 'Phone',
  'AttachFile': 'Paperclip',
  'Download': 'Download',
  'Upload': 'Upload',
  'Share': 'ShareNetwork',
  'Print': 'Printer',
  'Visibility': 'Eye',
  'VisibilityOff': 'EyeSlash',
};

// Component style transformations
const styleTransforms = {
  Paper: 'dashboardStyles.paper',
  Card: 'dashboardStyles.card',
  Button: 'dashboardStyles.button',
  Chip: 'dashboardStyles.chip',
  Table: 'dashboardStyles.table',
  Tabs: 'dashboardStyles.tabs',
  Dialog: 'dashboardStyles.dialog',
  TextField: 'dashboardStyles.textField',
  Container: 'dashboardStyles.container',
};

function transformFile(filePath) {
  console.log(`\n🔄 Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changes = [];

  // Step 1: Add imports if not present
  if (!content.includes("from '@phosphor-icons/react'")) {
    // Find Material-UI icons being imported
    const muiIconMatch = content.match(/import\s*{([^}]+)}\s*from\s*'@mui\/icons-material'/);

    if (muiIconMatch) {
      const muiIcons = muiIconMatch[1]
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      // Map to Phosphor icons
      const phosphorIcons = muiIcons
        .map(icon => iconMap[icon] || icon)
        .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

      // Add Phosphor import
      const phosphorImport = `import {\n  ${phosphorIcons.join(',\n  ')},\n} from '@phosphor-icons/react';`;

      content = content.replace(
        muiIconMatch[0],
        phosphorImport
      );

      changes.push(`✓ Replaced Material-UI icons with Phosphor icons: ${phosphorIcons.join(', ')}`);
    }
  }

  // Add dashboardStyles import if not present
  if (!content.includes("from '@/lib/theme/dashboardStyles'")) {
    // Find the last import statement
    const lastImport = content.lastIndexOf("from '@mui/material'");
    if (lastImport !== -1) {
      const endOfLine = content.indexOf('\n', lastImport);
      content = content.slice(0, endOfLine + 1) +
                "import { dashboardStyles } from '@/lib/theme/dashboardStyles';\n" +
                content.slice(endOfLine + 1);
      changes.push('✓ Added dashboardStyles import');
    }
  }

  // Step 2: Replace icon usages
  for (const [muiIcon, phosphorIcon] of Object.entries(iconMap)) {
    // Replace icon component with duotone weight
    const iconRegex = new RegExp(`<${muiIcon}([^/>]*)/?>`, 'g');
    const matches = content.match(iconRegex);

    if (matches) {
      content = content.replace(iconRegex, (match) => {
        // Check if it already has size and weight
        if (match.includes('size=') && match.includes('weight=')) {
          return match.replace(muiIcon, phosphorIcon);
        }

        // Add size and weight="duotone"
        if (match.endsWith('/>')) {
          return `<${phosphorIcon} size={20} weight="duotone" />`;
        } else {
          return `<${phosphorIcon} size={20} weight="duotone">`;
        }
      });
      changes.push(`✓ Replaced ${muiIcon} with ${phosphorIcon} (duotone)`);
    }
  }

  // Step 3: Apply component styles
  for (const [component, style] of Object.entries(styleTransforms)) {
    // Match component without existing sx prop
    const withoutSx = new RegExp(`<${component}([^>]*?)(?<!sx=)>`, 'g');
    content = content.replace(withoutSx, (match, attrs) => {
      if (attrs.includes('sx=')) return match; // Skip if already has sx
      return `<${component}${attrs} sx={${style}}>`;
    });

    // Match component with existing sx prop (merge styles)
    const withSx = new RegExp(`<${component}([^>]*?)sx={([^}]+)}`, 'g');
    content = content.replace(withSx, (match, attrs, existingSx) => {
      // Merge with existing styles
      return `<${component}${attrs}sx={{ ...${style}, ${existingSx} }}`;
    });
  }

  // Step 4: Replace color props
  content = content.replace(/color="text\.secondary"/g, 'sx={dashboardStyles.typography.secondary}');
  content = content.replace(/color="text\.primary"/g, 'sx={dashboardStyles.typography.primary}');
  content = content.replace(/color="primary\.main"/g, 'sx={{ color: "#000000" }}');

  // Step 5: Update Typography with color props
  content = content.replace(
    /<Typography([^>]*?)color="text\.secondary"/g,
    '<Typography$1sx={{ ...dashboardStyles.typography.secondary, ...(typeof $1 === "object" && $1.sx || {}) }}'
  );

  // Step 6: Remove borderRadius from inline styles
  content = content.replace(/borderRadius:\s*\d+/g, 'borderRadius: 0');

  // Step 7: Update Chip colors to black/white
  content = content.replace(
    /<Chip([^>]*?)color="(primary|secondary|success|error|warning|info)"/g,
    '<Chip$1sx={dashboardStyles.chip}'
  );

  // Write back
  fs.writeFileSync(filePath, content, 'utf8');

  if (changes.length > 0) {
    console.log('  Changes made:');
    changes.forEach(change => console.log(`    ${change}`));
  } else {
    console.log('  ℹ️  No changes needed');
  }
}

// Find all dashboard page files
function findDashboardPages(dir) {
  const dashboardDir = path.join(dir, 'app/(dashboard)');
  const pages = [];

  function walk(directory) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file === 'page.tsx' && !filePath.includes('layout.tsx')) {
        pages.push(filePath);
      }
    });
  }

  walk(dashboardDir);
  return pages;
}

// Main execution
function main() {
  const projectRoot = process.cwd();
  console.log('🎨 Dashboard Theme Transformer\n');
  console.log(`📁 Project root: ${projectRoot}\n`);

  // Check if dashboardStyles.ts exists
  const stylesPath = path.join(projectRoot, 'lib/theme/dashboardStyles.ts');
  if (!fs.existsSync(stylesPath)) {
    console.error('❌ Error: dashboardStyles.ts not found at', stylesPath);
    console.error('   Please create the styles file first.');
    process.exit(1);
  }

  // Find all dashboard pages
  const pages = findDashboardPages(projectRoot);

  if (pages.length === 0) {
    console.error('❌ No dashboard pages found');
    process.exit(1);
  }

  console.log(`📄 Found ${pages.length} dashboard pages:\n`);
  pages.forEach((page, i) => {
    console.log(`  ${i + 1}. ${path.relative(projectRoot, page)}`);
  });

  console.log('\n🚀 Starting transformation...');

  // Transform each page
  pages.forEach(page => {
    try {
      transformFile(page);
    } catch (error) {
      console.error(`\n❌ Error processing ${page}:`, error.message);
    }
  });

  console.log('\n\n✅ Transformation complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Review the changes with: git diff');
  console.log('  2. Test each page in the browser');
  console.log('  3. Fix any TypeScript errors');
  console.log('  4. Commit the changes\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { transformFile, findDashboardPages };
