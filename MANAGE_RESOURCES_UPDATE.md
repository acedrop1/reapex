# ManageResources.tsx Update for Consolidated Buckets

## Changes Required

Update `components/admin/ManageResources.tsx` to use consolidated `documents` bucket with folder prefixes.

---

## Find and Replace

### 1. Update uploadFile function (Line ~288-299)

**OLD:**
```typescript
// Upload file to storage
const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) throw error;
    return data.path;
};
```

**NEW:**
```typescript
// Upload file to storage - uses consolidated 'documents' bucket with folder prefixes
const uploadFile = async (file: File, folder: string, filename: string) => {
    const path = `${folder}/${filename}`;
    const { data, error} = await supabase.storage
        .from('documents')  // Always use documents bucket
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) throw error;
    return data.path;
};
```

---

### 2. Update Form (Brokerage Documents) uploads (Line ~303-309)

**OLD:**
```typescript
if (formData.file) {
    const fileName = `${Date.now()}-${formData.file.name}`;
    fileUrl = await uploadFile(formData.file, 'documents', fileName);
    docData.file_url = fileUrl;
    docData.file_name = formData.file!.name;
    docData.file_size = formData.file!.size;
}
```

**NEW:**
```typescript
if (formData.file) {
    const fileName = `${Date.now()}-${formData.file.name}`;
    fileUrl = await uploadFile(formData.file, 'forms', fileName);  // forms/ folder
    docData.file_url = fileUrl;
    docData.file_name = formData.file!.name;
    docData.file_size = formData.file!.size;
}
```

---

### 3. Update Training Resource uploads (Line ~318-327)

**OLD:**
```typescript
if (formData.file) {
    const fileName = `${Date.now()}-${formData.file.name}`;
    fileUrl = await uploadFile(formData.file, 'training-resources', fileName);
}
if (formData.icon) {
    const iconName = `thumbnails/${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'training-resources', iconName);
}
```

**NEW:**
```typescript
if (formData.file) {
    const fileName = `${Date.now()}-${formData.file.name}`;
    fileUrl = await uploadFile(formData.file, 'training', fileName);  // training/ folder
}
if (formData.icon) {
    const iconName = `${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'training', iconName);  // training/ folder
}
```

---

### 4. Update Marketing Template preview uploads (Line ~345-349)

**OLD:**
```typescript
if (formData.icon) {
    const iconName = `previews/${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'brand-assets', iconName);
}
```

**NEW:**
```typescript
if (formData.icon) {
    const iconName = `${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'marketing', iconName);  // marketing/ folder
}
```

---

### 5. Update External Links logo uploads (Line ~366-370)

**OLD:**
```typescript
if (formData.icon) {
    const iconName = `logos/${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'external-links', iconName);
}
```

**NEW:**
```typescript
if (formData.icon) {
    const iconName = `${Date.now()}-${formData.icon.name}`;
    iconUrl = await uploadFile(formData.icon, 'logos', iconName);  // logos/ folder
}
```

---

### 6. Update delete function (Line ~405-440)

**OLD:**
```typescript
// Determine bucket and files to delete based on resource type
let bucket: string | null = null;
let filesToDelete: string[] = [];

if (currentType === 'form' && itemToDelete.file_url) {
    bucket = 'documents';
    filesToDelete = [itemToDelete.file_url];
} else if (currentType === 'training') {
    bucket = 'training-resources';
    if (itemToDelete.url) filesToDelete.push(itemToDelete.url);
    if (itemToDelete.thumbnail_url) filesToDelete.push(itemToDelete.thumbnail_url);
} else if (currentType === 'marketing' && itemToDelete.preview_image_url) {
    bucket = 'brand-assets';
    filesToDelete = [itemToDelete.preview_image_url];
} else if (currentType === 'link' && (itemToDelete.icon_url || itemToDelete.logo_url)) {
    bucket = 'external-links';
    filesToDelete = [itemToDelete.icon_url || itemToDelete.logo_url];
}

// Delete associated files from storage
if (bucket && filesToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove(filesToDelete);
```

**NEW:**
```typescript
// Determine files to delete based on resource type
// All files are now in 'documents' bucket with folder prefixes
let filesToDelete: string[] = [];

if (currentType === 'form' && itemToDelete.file_url) {
    filesToDelete = [itemToDelete.file_url];  // Already has forms/ prefix
} else if (currentType === 'training') {
    if (itemToDelete.url) filesToDelete.push(itemToDelete.url);  // Has training/ prefix
    if (itemToDelete.thumbnail_url) filesToDelete.push(itemToDelete.thumbnail_url);
} else if (currentType === 'marketing' && itemToDelete.preview_image_url) {
    filesToDelete = [itemToDelete.preview_image_url];  // Has marketing/ prefix
} else if (currentType === 'link' && (itemToDelete.icon_url || itemToDelete.logo_url)) {
    filesToDelete = [itemToDelete.icon_url || itemToDelete.logo_url];  // Has logos/ prefix
}

// Delete associated files from storage (all in documents bucket)
if (filesToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
        .from('documents')  // Always use documents bucket
        .remove(filesToDelete);
```

---

## Summary of Changes

1. **uploadFile function**: Changed to accept `folder` instead of `bucket`, always uses `documents` bucket
2. **Forms**: Upload to `forms/` folder
3. **Training**: Upload to `training/` folder (removed `thumbnails/` subfolder)
4. **Marketing**: Upload to `marketing/` folder (removed `previews/` subfolder)
5. **Links**: Upload to `logos/` folder (path was already `logos/...`, just changed bucket)
6. **Delete**: Always uses `documents` bucket, files already have folder prefixes

---

## Testing After Update

1. **Upload new form** → Should save to `documents/forms/{timestamp}-{filename}`
2. **Upload training video** → Should save to `documents/training/{timestamp}-{filename}`
3. **Upload training thumbnail** → Should save to `documents/training/{timestamp}-{filename}`
4. **Upload marketing preview** → Should save to `documents/marketing/{timestamp}-{filename}`
5. **Upload link logo** → Should save to `documents/logos/{timestamp}-{filename}`
6. **Delete any resource** → Should remove from `documents` bucket
7. **Reorder resources** → Should still work (no storage changes)

---

## Backwards Compatibility

After code update, OLD files (without folder prefixes) will still work because:
- Database migration script adds folder prefixes to existing records
- getPublicUrl works with any path in the bucket
- Download/view operations use the path from database (already updated)

**However**, if migration hasn't run yet:
- New uploads will go to new folders (documents/training/...)
- Old files will be at old paths (just filename without prefix)
- Both will work until migration completes
