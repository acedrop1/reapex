/**
 * Migration Script: Consolidate Storage Buckets
 *
 * Purpose: Move files from separate buckets into folder-based structure in 'documents' bucket
 *
 * Folder Structure:
 * documents/
 * ├── marketing/          # From marketing-files bucket
 * ├── forms/             # From brokerage_documents (already in documents)
 * ├── training/          # From training-resources bucket
 * ├── logos/             # From external-links bucket
 * └── {user-id}/         # User transaction documents (already in documents)
 *
 * IMPORTANT: Run this AFTER migration 089_consolidate_buckets_folder_based.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MigrationStats {
  bucket: string;
  folder: string;
  totalFiles: number;
  copied: number;
  failed: number;
  errors: string[];
}

/**
 * Copy files from source bucket to documents bucket with new folder prefix
 */
async function migrateFiles(
  sourceBucket: string,
  targetFolder: string,
  stats: MigrationStats
): Promise<void> {
  console.log(`\n📂 Migrating ${sourceBucket} → documents/${targetFolder}/`);

  try {
    // Recursively list all files in source bucket
    const allFiles: any[] = [];
    const listAllFiles = async (path: string = '') => {
      const { data: items, error: listError } = await supabase.storage
        .from(sourceBucket)
        .list(path, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

      if (listError) {
        console.error(`❌ Error listing files in ${sourceBucket}/${path}:`, listError);
        stats.errors.push(`List error: ${listError.message}`);
        return;
      }

      if (!items || items.length === 0) {
        return;
      }

      for (const item of items) {
        const itemPath = path ? `${path}/${item.name}` : item.name;

        // Check if item is a folder (id is null for folders in Supabase storage)
        if (item.id === null) {
          // It's a folder, recurse into it
          await listAllFiles(itemPath);
        } else {
          // It's a file, add to list
          allFiles.push({ ...item, fullPath: itemPath });
        }
      }
    };

    await listAllFiles();

    if (allFiles.length === 0) {
      console.log(`   ℹ️  No files found in ${sourceBucket}`);
      return;
    }

    stats.totalFiles = allFiles.length;
    console.log(`   Found ${allFiles.length} files to migrate`);

    for (const file of allFiles) {
      const sourcePath = file.fullPath;
      // Strip the folder prefix if it exists (e.g., training/file.mp4 → file.mp4)
      const fileName = sourcePath.replace(/^(training|logos|marketing|forms)\//, '');
      const targetPath = `${targetFolder}/${fileName}`;

      console.log(`   📄 Processing: ${sourcePath} → ${targetPath}`);

      try {
        // Download file from source bucket
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(sourceBucket)
          .download(sourcePath);

        if (downloadError) {
          console.error(`   ❌ Failed to download ${sourcePath}:`, JSON.stringify(downloadError, null, 2));
          stats.failed++;
          stats.errors.push(`Download ${sourcePath}: ${downloadError.message || JSON.stringify(downloadError)}`);
          continue;
        }

        // Upload to documents bucket with new path
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(targetPath, fileData, {
            cacheControl: '3600',
            upsert: true, // Overwrite if exists
          });

        if (uploadError) {
          console.error(`   ❌ Failed to upload ${targetPath}:`, JSON.stringify(uploadError, null, 2));
          stats.failed++;
          stats.errors.push(`Upload ${targetPath}: ${uploadError.message || JSON.stringify(uploadError)}`);
          continue;
        }

        console.log(`   ✅ Copied: ${sourcePath} → ${targetPath}`);
        stats.copied++;
      } catch (error) {
        console.error(`   ❌ Error processing ${sourcePath}:`, error);
        stats.failed++;
        stats.errors.push(`Process ${sourcePath}: ${error}`);
      }
    }
  } catch (error) {
    console.error(`❌ Migration failed for ${sourceBucket}:`, error);
    stats.errors.push(`Bucket migration error: ${error}`);
  }
}

/**
 * Update database references to point to new file paths
 */
async function updateDatabaseReferences(): Promise<void> {
  console.log('\n📝 Updating database references...');

  // Update brokerage_documents table (file_url should now be forms/...)
  const { data: brokerageDocs, error: brokerageError } = await supabase
    .from('brokerage_documents')
    .select('id, file_url')
    .not('file_url', 'is', null);

  if (brokerageError) {
    console.error('❌ Error fetching brokerage_documents:', brokerageError);
  } else if (brokerageDocs && brokerageDocs.length > 0) {
    console.log(`   Updating ${brokerageDocs.length} brokerage document references...`);
    for (const doc of brokerageDocs) {
      // If file_url doesn't already start with 'forms/', add it
      if (doc.file_url && !doc.file_url.startsWith('forms/')) {
        const newUrl = `forms/${doc.file_url}`;
        const { error: updateError } = await supabase
          .from('brokerage_documents')
          .update({ file_url: newUrl })
          .eq('id', doc.id);

        if (updateError) {
          console.error(`   ❌ Failed to update brokerage_documents ${doc.id}:`, updateError);
        } else {
          console.log(`   ✅ Updated: ${doc.file_url} → ${newUrl}`);
        }
      }
    }
  }

  // Update training_resources table (video_url/document_url should now be training/...)
  const { data: trainingResources, error: trainingError } = await supabase
    .from('training_resources')
    .select('id, video_url, document_url, thumbnail_url, preview_url');

  if (trainingError) {
    console.error('❌ Error fetching training_resources:', trainingError);
  } else if (trainingResources && trainingResources.length > 0) {
    console.log(`   Updating ${trainingResources.length} training resource references...`);
    for (const resource of trainingResources) {
      const updates: any = {};

      // Update video_url (only if it's a storage path, not HTTP URL)
      if (resource.video_url && !resource.video_url.startsWith('training/') && !resource.video_url.startsWith('http')) {
        updates.video_url = `training/${resource.video_url}`;
      }

      // Update document_url (only if it's a storage path, not HTTP URL)
      if (resource.document_url && !resource.document_url.startsWith('training/') && !resource.document_url.startsWith('http')) {
        updates.document_url = `training/${resource.document_url}`;
      }

      // Update thumbnail_url
      if (resource.thumbnail_url && !resource.thumbnail_url.startsWith('training/') && !resource.thumbnail_url.startsWith('http')) {
        updates.thumbnail_url = `training/${resource.thumbnail_url}`;
      }

      // Update preview_url
      if (resource.preview_url && !resource.preview_url.startsWith('training/') && !resource.preview_url.startsWith('http')) {
        updates.preview_url = `training/${resource.preview_url}`;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('training_resources')
          .update(updates)
          .eq('id', resource.id);

        if (updateError) {
          console.error(`   ❌ Failed to update training_resources ${resource.id}:`, updateError);
        } else {
          console.log(`   ✅ Updated training resource ${resource.id}`);
        }
      }
    }
  }

  // Update external_links table (logo_url should now be logos/...)
  const { data: externalLinks, error: linksError } = await supabase
    .from('external_links')
    .select('id, logo_url')
    .not('logo_url', 'is', null);

  if (linksError) {
    console.error('❌ Error fetching external_links:', linksError);
  } else if (externalLinks && externalLinks.length > 0) {
    console.log(`   Updating ${externalLinks.length} external link logo references...`);
    for (const link of externalLinks) {
      // If logo_url doesn't start with 'logos/' or 'http', add prefix
      if (link.logo_url && !link.logo_url.startsWith('logos/') && !link.logo_url.startsWith('http')) {
        const newUrl = `logos/${link.logo_url}`;
        const { error: updateError } = await supabase
          .from('external_links')
          .update({ logo_url: newUrl })
          .eq('id', link.id);

        if (updateError) {
          console.error(`   ❌ Failed to update external_links ${link.id}:`, updateError);
        } else {
          console.log(`   ✅ Updated: ${link.logo_url} → ${newUrl}`);
        }
      }
    }
  }

  // Note: canva_templates doesn't store file URLs, just external Canva links
  console.log('   ℹ️  canva_templates uses external URLs, no migration needed');
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting bucket consolidation migration\n');
  console.log('Target bucket: documents');
  console.log('Folder structure:');
  console.log('  - marketing/  (from marketing-files)');
  console.log('  - forms/      (brokerage documents)');
  console.log('  - training/   (from training-resources)');
  console.log('  - logos/      (from external-links)');
  console.log('  - {user-id}/  (transaction documents - already correct)\n');

  const migrations: MigrationStats[] = [];

  // Migrate marketing-files → documents/marketing/
  const marketingStats: MigrationStats = {
    bucket: 'marketing-files',
    folder: 'marketing',
    totalFiles: 0,
    copied: 0,
    failed: 0,
    errors: [],
  };
  await migrateFiles('marketing-files', 'marketing', marketingStats);
  migrations.push(marketingStats);

  // Migrate training-resources → documents/training/
  const trainingStats: MigrationStats = {
    bucket: 'training-resources',
    folder: 'training',
    totalFiles: 0,
    copied: 0,
    failed: 0,
    errors: [],
  };
  await migrateFiles('training-resources', 'training', trainingStats);
  migrations.push(trainingStats);

  // Migrate external-links → documents/logos/
  const logosStats: MigrationStats = {
    bucket: 'external-links',
    folder: 'logos',
    totalFiles: 0,
    copied: 0,
    failed: 0,
    errors: [],
  };
  await migrateFiles('external-links', 'logos', logosStats);
  migrations.push(logosStats);

  // Update database references
  await updateDatabaseReferences();

  // Print summary
  console.log('\n\n═══════════════════════════════════════');
  console.log('📊 MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════\n');

  let totalFiles = 0;
  let totalCopied = 0;
  let totalFailed = 0;

  migrations.forEach(stat => {
    console.log(`${stat.bucket} → documents/${stat.folder}/`);
    console.log(`  Total:  ${stat.totalFiles}`);
    console.log(`  ✅ Copied: ${stat.copied}`);
    console.log(`  ❌ Failed: ${stat.failed}`);
    if (stat.errors.length > 0) {
      console.log(`  Errors:`);
      stat.errors.forEach(err => console.log(`    - ${err}`));
    }
    console.log('');

    totalFiles += stat.totalFiles;
    totalCopied += stat.copied;
    totalFailed += stat.failed;
  });

  console.log('═══════════════════════════════════════');
  console.log(`TOTAL: ${totalFiles} files`);
  console.log(`✅ Successfully copied: ${totalCopied}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log('═══════════════════════════════════════\n');

  if (totalFailed === 0) {
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update code to use documents bucket with folder prefixes');
    console.log('2. Test file uploads/downloads in each section');
    console.log('3. Once verified, you can delete old buckets:');
    console.log('   - marketing-files');
    console.log('   - training-resources');
    console.log('   - external-links (keep if still has files)');
  } else {
    console.log('⚠️  Migration completed with errors. Review failed items above.');
  }
}

// Run migration
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
