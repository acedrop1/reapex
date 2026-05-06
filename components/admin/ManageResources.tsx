'use client';

import React, { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Avatar,
} from '@mui/material';
import {
    MagnifyingGlass,
    Plus,
    Trash,
    PencilSimple,
    UploadSimple,
    X,
    File,
    FilePdf,
    FileDoc,
    FileVideo,
    FileText,
    Image as ImageIcon,
    CaretUp,
    CaretDown,
    Eye,
    ArrowSquareOut,
} from '@phosphor-icons/react';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';

// Define types
type ResourceType = 'form' | 'training' | 'marketing' | 'link';

interface ResourceFormData {
    title: string;
    description: string;
    category: string;
    file?: File | null;
    link?: string;
    icon?: File | null;
}

// Helper function to get the appropriate Phosphor icon based on file extension
const getFileIcon = (fileName: string, size: number = 32) => {
    if (!fileName) return <File size={size} color="#B0B0B0" weight="duotone" />;

    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconProps = { size, weight: 'duotone' as const };

    switch (extension) {
        case 'pdf':
            return <FilePdf {...iconProps} color="#EF5350" />;
        case 'doc':
        case 'docx':
            return <FileDoc {...iconProps} color="#E2C05A" />;
        case 'mp4':
        case 'mov':
        case 'avi':
        case 'mkv':
            return <FileVideo {...iconProps} color="#c49d2f" />;
        case 'txt':
        case 'md':
            return <FileText {...iconProps} color="#4CAF50" />;
        default:
            return <File {...iconProps} color="#B0B0B0" />;
    }
};

const ManageResources = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewItem, setPreviewItem] = useState<any>(null);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState<ResourceFormData>({
        title: '',
        description: '',
        category: '',
        file: null,
        link: '',
        icon: null,
    });

    const supabase = createClient();
    const queryClient = useQueryClient();

    // Category options for each resource type
    const categoryOptions = {
        form: ['Forms', 'Training', 'Compliance', 'Other'],
        training: ['Onboarding', 'Tech', 'Compliance', 'Marketing', 'Sales'],
        marketing: ['Business Card', 'Property Flyer', 'Social Media', 'Yard Sign', 'Photography', 'Other'],
        link: ['Forms & Compliance', 'Marketing & Branding', 'Training & Knowledge'],
    };

    // Determine current resource type
    const getResourceType = (tabIndex: number): ResourceType => {
        switch (tabIndex) {
            case 0: return 'form';
            case 1: return 'training';
            case 2: return 'marketing';
            case 3: return 'link';
            default: return 'form';
        }
    };

    const currentType = getResourceType(activeTab);

    // Fetch functions
    const fetchForms = async () => {
        const { data, error } = await supabase
            .from('brokerage_documents')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;

        // Convert storage paths to public URLs
        return data?.map(doc => ({
            ...doc,
            file_url: doc.file_url ? supabase.storage.from('documents').getPublicUrl(doc.file_url).data.publicUrl : doc.file_url,
            icon_url: doc.icon_url ? supabase.storage.from('documents').getPublicUrl(doc.icon_url).data.publicUrl : doc.icon_url,
            logo_url: doc.logo_url ? supabase.storage.from('documents').getPublicUrl(doc.logo_url).data.publicUrl : doc.logo_url,
        })) || [];
    };

    const fetchTraining = async () => {
        const { data, error } = await supabase
            .from('training_resources')
            .select('*')
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;

        // Convert storage paths to public URLs
        return data?.map(resource => ({
            ...resource,
            thumbnail_url: resource.thumbnail_url ? supabase.storage.from('documents').getPublicUrl(resource.thumbnail_url).data.publicUrl : resource.thumbnail_url,
            file_url: resource.file_url ? supabase.storage.from('documents').getPublicUrl(resource.file_url).data.publicUrl : resource.file_url,
        })) || [];
    };

    const fetchMarketing = async () => {
        const { data, error } = await supabase
            .from('canva_templates')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;

        // Convert storage paths to public URLs
        return data?.map(template => ({
            ...template,
            preview_image_url: template.preview_image_url ? supabase.storage.from('documents').getPublicUrl(template.preview_image_url).data.publicUrl : template.preview_image_url,
        })) || [];
    };

    const fetchLinks = async () => {
        const { data, error } = await supabase
            .from('external_links')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;

        // Convert storage paths to public URLs
        return data?.map(link => ({
            ...link,
            logo_url: link.logo_url ? supabase.storage.from('documents').getPublicUrl(link.logo_url).data.publicUrl : link.logo_url,
            icon_url: link.icon_url ? supabase.storage.from('documents').getPublicUrl(link.icon_url).data.publicUrl : link.icon_url,
        })) || [];
    };

    // React Queries
    const formsQuery = useQuery({ queryKey: ['admin-forms'], queryFn: fetchForms, enabled: activeTab === 0 });
    const trainingQuery = useQuery({ queryKey: ['admin-training'], queryFn: fetchTraining, enabled: activeTab === 1 });
    const marketingQuery = useQuery({ queryKey: ['admin-marketing'], queryFn: fetchMarketing, enabled: activeTab === 2 });
    const linksQuery = useQuery({ queryKey: ['admin-links'], queryFn: fetchLinks, enabled: activeTab === 3 });

    const getCurrentData = () => {
        switch (activeTab) {
            case 0: return formsQuery.data || [];
            case 1: return trainingQuery.data || [];
            case 2: return marketingQuery.data || [];
            case 3: return linksQuery.data || [];
            default: return [];
        }
    };

    const getCurrentLoading = () => {
        switch (activeTab) {
            case 0: return formsQuery.isLoading;
            case 1: return trainingQuery.isLoading;
            case 2: return marketingQuery.isLoading;
            case 3: return linksQuery.isLoading;
            default: return false;
        }
    };

    const data = getCurrentData();
    const isLoading = getCurrentLoading();

    // Filter data
    const filteredData = data.filter((item: any) =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // File dropzone for main file (form/training)
    const onFileDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFormData(prev => ({ ...prev, file: acceptedFiles[0] }));
        }
    }, []);

    const { getRootProps: getFileRootProps, getInputProps: getFileInputProps, isDragActive: isFileDragActive } = useDropzone({
        onDrop: onFileDrop,
        accept: currentType === 'form' ? {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        } : {
            'application/pdf': ['.pdf'],
            'video/mp4': ['.mp4'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
        multiple: false,
    });

    // Icon/Image dropzone
    const onIconDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFormData(prev => ({ ...prev, icon: acceptedFiles[0] }));
        }
    }, []);

    const { getRootProps: getIconRootProps, getInputProps: getIconInputProps, isDragActive: isIconDragActive } = useDropzone({
        onDrop: onIconDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'image/svg+xml': ['.svg'],
        },
        maxFiles: 1,
        multiple: false,
    });

    // Upload file to storage - uses consolidated 'documents' bucket with folder prefixes
    const uploadFile = async (file: File, folder: string, filename: string) => {
        // Sanitize filename: replace spaces and special chars with underscores
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${folder}/${sanitizedFilename}`;
        const { data, error } = await supabase.storage
            .from('documents')  // Always use documents bucket
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) throw error;
        return data.path;
    };

    // Handle form submission
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let fileUrl = '';
            let iconUrl = '';

            // Upload files based on resource type
            if (currentType === 'form') {
                if (!formData.file && !editingItem) {
                    throw new Error('Please select a file');
                }
                if (formData.file) {
                    const fileName = `${Date.now()}-${formData.file.name}`;
                    fileUrl = await uploadFile(formData.file, 'forms', fileName);  // forms/ folder
                }
                if (formData.icon) {
                    const iconName = `${Date.now()}-${formData.icon.name}`;
                    iconUrl = await uploadFile(formData.icon, 'forms', iconName);  // forms/ folder for icons
                }

                // Insert/update brokerage_document
                const docData: any = {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    uploaded_by: user.id,
                };

                if (fileUrl) {
                    docData.file_url = fileUrl;
                    docData.file_name = formData.file!.name;
                    docData.file_size = formData.file!.size;
                }
                if (iconUrl) {
                    docData.icon_url = iconUrl;
                }

                if (editingItem) {
                    await supabase.from('brokerage_documents').update(docData).eq('id', editingItem.id);
                } else {
                    await supabase.from('brokerage_documents').insert(docData);
                }
            } else if (currentType === 'training') {
                if (!formData.file && !formData.link && !editingItem) {
                    throw new Error('Please provide a link or upload a file');
                }
                if (formData.file) {
                    const fileName = `${Date.now()}-${formData.file.name}`;
                    fileUrl = await uploadFile(formData.file, 'training', fileName);  // training/ folder
                }
                if (formData.icon) {
                    const iconName = `thumbnails/${Date.now()}-${formData.icon.name}`;
                    iconUrl = await uploadFile(formData.icon, 'training', iconName);  // training/ folder (includes thumbnails/ subfolder)
                }

                // Determine resource type
                let resourceType = 'document';
                const linkValue = formData.link?.trim() || '';
                if (formData.file?.type.includes('video')) {
                    resourceType = 'video';
                } else if (linkValue && (linkValue.includes('youtube.com') || linkValue.includes('youtu.be') || linkValue.includes('vimeo.com'))) {
                    resourceType = 'video';
                }

                // Auto-fetch thumbnail for links if no icon was manually uploaded
                let autoThumbnail = '';
                if (!iconUrl && !editingItem?.thumbnail_url && linkValue) {
                    try {
                        const ogRes = await fetch(`/api/og-image?url=${encodeURIComponent(linkValue)}`);
                        const ogData = await ogRes.json();
                        if (ogData.thumbnail_url) {
                            autoThumbnail = ogData.thumbnail_url;
                        }
                    } catch {
                        // Silently fail — just won't have a thumbnail
                    }
                }

                const trainingData: any = {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category.toLowerCase(),
                    resource_type: resourceType,
                    thumbnail_url: iconUrl || editingItem?.thumbnail_url || autoThumbnail || null,
                };

                // If there's a link, use it as the URL (external resource). If file was also uploaded, file takes priority.
                if (fileUrl) {
                    trainingData.url = fileUrl;
                } else if (linkValue) {
                    trainingData.url = linkValue;
                    // Also set video_url for video-type links
                    if (resourceType === 'video') {
                        trainingData.video_url = linkValue;
                    }
                } else {
                    trainingData.url = editingItem?.url;
                }

                if (editingItem) {
                    await supabase.from('training_resources').update(trainingData).eq('id', editingItem.id);
                } else {
                    await supabase.from('training_resources').insert(trainingData);
                }
            } else if (currentType === 'marketing') {
                if (!formData.link && !editingItem) {
                    throw new Error('Please enter a Canva template URL');
                }
                if (formData.icon) {
                    const iconName = `${Date.now()}-${formData.icon.name}`;
                    iconUrl = await uploadFile(formData.icon, 'marketing', iconName);  // marketing/ folder
                }

                const marketingData: any = {
                    name: formData.title,
                    description: formData.description,
                    category: formData.category.toLowerCase().replace(' ', '_'),
                    canva_url: formData.link || editingItem?.canva_url,
                    preview_image_url: iconUrl || editingItem?.preview_image_url,
                    template_id: formData.link?.split('/').pop() || editingItem?.template_id,
                };

                if (editingItem) {
                    await supabase.from('canva_templates').update(marketingData).eq('id', editingItem.id);
                } else {
                    await supabase.from('canva_templates').insert(marketingData);
                }
            } else if (currentType === 'link') {
                if (!formData.link && !editingItem) {
                    throw new Error('Please enter a URL');
                }
                if (formData.icon) {
                    const iconName = `${Date.now()}-${formData.icon.name}`;
                    iconUrl = await uploadFile(formData.icon, 'logos', iconName);  // logos/ folder
                }

                // Auto-fetch OG image for links if no icon was manually uploaded
                let autoLogo = '';
                const linkUrl = formData.link?.trim() || editingItem?.url || '';
                if (!iconUrl && !editingItem?.logo_url && !editingItem?.icon_url && linkUrl) {
                    try {
                        const ogRes = await fetch(`/api/og-image?url=${encodeURIComponent(linkUrl)}`);
                        const ogData = await ogRes.json();
                        if (ogData.thumbnail_url) {
                            autoLogo = ogData.thumbnail_url;
                        }
                    } catch {
                        // Silently fail
                    }
                }

                const linkData: any = {
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    url: formData.link || editingItem?.url,
                    logo_url: iconUrl || editingItem?.logo_url || editingItem?.icon_url || autoLogo || null,
                    icon_url: iconUrl || editingItem?.icon_url || editingItem?.logo_url || autoLogo || null,
                    created_by: user.id,
                };

                if (editingItem) {
                    await supabase.from('external_links').update(linkData).eq('id', editingItem.id);
                } else {
                    await supabase.from('external_links').insert(linkData);
                }
            }

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
            queryClient.invalidateQueries({ queryKey: ['admin-training'] });
            queryClient.invalidateQueries({ queryKey: ['admin-marketing'] });
            queryClient.invalidateQueries({ queryKey: ['admin-links'] });

            // Reset form and close dialog
            setFormData({ title: '', description: '', category: '', file: null, link: '', icon: null });
            setEditingItem(null);
            setOpenDialog(false);
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Failed to save resource');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;

        try {
            let table = 'training_resources';
            let filesToDelete: string[] = [];

            if (activeTab === 0) {
                table = 'brokerage_documents';
                if (itemToDelete.file_url) filesToDelete.push(itemToDelete.file_url);  // Already has forms/ prefix
            } else if (activeTab === 1) {
                // table is already training_resources
                if (itemToDelete.url) filesToDelete.push(itemToDelete.url);  // Has training/ prefix
                if (itemToDelete.thumbnail_url) filesToDelete.push(itemToDelete.thumbnail_url);
            } else if (activeTab === 2) {
                table = 'canva_templates';
                if (itemToDelete.preview_image_url) filesToDelete.push(itemToDelete.preview_image_url);  // Has marketing/ prefix
            } else if (activeTab === 3) {
                table = 'external_links';
                if (itemToDelete.logo_url) filesToDelete.push(itemToDelete.logo_url);  // Has logos/ prefix
            }

            // Delete associated files from storage (all in documents bucket)
            if (filesToDelete.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('documents')  // Always use documents bucket
                    .remove(filesToDelete);

                if (storageError) {
                    console.error('Error deleting files from storage:', storageError);
                    // We continue to delete the record even if storage delete fails
                    // or valid strategy is to stop? Usually better to clean up DB even if storage fails, 
                    // but maybe log it.
                }
            }

            const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['admin-forms'] });
            queryClient.invalidateQueries({ queryKey: ['admin-training'] });
            queryClient.invalidateQueries({ queryKey: ['admin-marketing'] });
            queryClient.invalidateQueries({ queryKey: ['admin-links'] });

            setDeleteDialogOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Delete error', error);
            // Optionally set an error state to show in UI
        }
    };

    const openAddDialog = () => {
        setFormData({ title: '', description: '', category: '', file: null, link: '', icon: null });
        setEditingItem(null);
        setError(null);
        setOpenDialog(true);
    };

    const openEditDialog = (item: any) => {
        setFormData({
            title: item.title || item.name || '',
            description: item.description || '',
            category: item.category || '',
            file: null,
            link: item.url || item.canva_url || '',
            icon: null, // We handle the preview separately in the UI
        });
        // We might want to store the initial image URL to show preview even if form icon is null
        // But the UI logic below uses formData.icon for preview of NEW file.
        // We need a way to show existing image.
        setEditingItem(item);
        setError(null);
        setOpenDialog(true);
    };

    // Get a viewable URL for a resource item
    const getViewableUrl = (item: any): string | null => {
        const raw = item.file_url || item.url || null;
        if (!raw) return null;
        if (raw.startsWith('http')) return raw;
        if (raw.startsWith('/')) return raw;
        return supabase.storage.from('documents').getPublicUrl(raw).data.publicUrl;
    };

    const getFileExtension = (item: any): string => {
        const name = item.file_name || item.url || item.file_url || '';
        return name.split('.').pop()?.toLowerCase() || '';
    };

    const openPreview = (item: any) => {
        setPreviewItem(item);
        setPreviewDialogOpen(true);
    };

    const handleReorder = async (item: any, direction: 'up' | 'down') => {
        try {
            const currentIndex = filteredData.findIndex((i: any) => i.id === item.id);
            if (currentIndex === -1) return;

            const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (swapIndex < 0 || swapIndex >= filteredData.length) return;

            const swapItem = filteredData[swapIndex];

            // Table and column mapping
            const tableMap: Record<number, { table: string; column: string }> = {
                0: { table: 'brokerage_documents', column: 'display_order' },
                1: { table: 'training_resources', column: 'order_index' },
                2: { table: 'canva_templates', column: 'display_order' },
                3: { table: 'external_links', column: 'display_order' }
            };

            const config = tableMap[activeTab];
            if (!config) return;

            // Get current order values - use the correct column name
            const orderColumn = config.column;
            const itemOrder = item[orderColumn] ?? currentIndex;
            const swapOrder = swapItem[orderColumn] ?? swapIndex;

            // Swap the display orders correctly
            const updates = [
                supabase.from(config.table).update({ [orderColumn]: swapOrder }).eq('id', item.id),
                supabase.from(config.table).update({ [orderColumn]: itemOrder }).eq('id', swapItem.id)
            ];

            await Promise.all(updates);

            // Invalidate cache
            queryClient.invalidateQueries({ queryKey: [`admin-${['forms', 'training', 'marketing', 'links'][activeTab]}`] });

        } catch (error) {
            console.error('Reorder failed', error);
        }
    };

    return (
        <Box sx={{ p: 3, borderTop: '2px solid #2A2A2A', backgroundColor: '#0A0A0A' }} id="manage-resources">
            <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                    mb: 3,
                    minHeight: 44,
                    '& .MuiTabs-indicator': { backgroundColor: '#E2C05A' },
                    '& .MuiTabs-scrollButtons': {
                        color: '#B0B0B0',
                    },
                    '& .MuiTab-root': {
                        color: '#B0B0B0',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        minHeight: 44,
                        whiteSpace: 'nowrap',
                        '&.Mui-selected': { color: '#E2C05A' },
                    },
                }}
            >
                <Tab label="Forms & Compliance" />
                <Tab label="Training Material" />
                <Tab label="Marketing Assets" />
                <Tab label="External Links" />
            </Tabs>

            {/* Toolbar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <MagnifyingGlass size={20} color="#B0B0B0" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ ...dashboardStyles.textField, flex: 1, maxWidth: 400 }}
                />

                <Button
                    variant="contained"
                    startIcon={<Plus size={20} weight="duotone" />}
                    onClick={openAddDialog}
                    sx={{
                        backgroundColor: 'rgba(1, 87, 155, 0.15)',
                        border: '1px solid rgba(226, 192, 90, 0.3)',
                        color: '#EDD48A',
                        fontWeight: 600,
                        textTransform: 'none',
                        ml: 'auto',
                        '&:hover': {
                            backgroundColor: 'rgba(226, 192, 90, 0.25)',
                            borderColor: 'rgba(226, 192, 90, 0.5)',
                        },
                    }}
                >
                    Add {activeTab === 0 ? 'Form' : activeTab === 1 ? 'Training' : activeTab === 2 ? 'Template' : 'Link'}
                </Button>
            </Box>

            {/* Table */}
            <TableContainer sx={{ backgroundColor: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '8px' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#B0B0B0', fontWeight: 600, borderBottom: '1px solid #2A2A2A' }}>Title</TableCell>
                            <TableCell sx={{ color: '#B0B0B0', fontWeight: 600, borderBottom: '1px solid #2A2A2A' }}>Category</TableCell>
                            <TableCell sx={{ color: '#B0B0B0', fontWeight: 600, borderBottom: '1px solid #2A2A2A' }}>Date Added</TableCell>
                            <TableCell sx={{ color: '#B0B0B0', fontWeight: 600, borderBottom: '1px solid #2A2A2A', textAlign: 'right' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, borderBottom: 'none' }}>
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((item: any) => (
                                <TableRow key={item.id} hover sx={{ '&:hover': { backgroundColor: '#1A1A1A' } }}>
                                    <TableCell sx={{ color: '#FFFFFF', borderBottom: '1px solid #2A2A2A', fontWeight: 500 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            {/* Show image avatar for resources with images */}
                                            {(item.icon_url || item.logo_url || item.preview_image_url || item.thumbnail_url) && (
                                                <Avatar
                                                    src={item.icon_url || item.logo_url || item.preview_image_url || item.thumbnail_url}
                                                    sx={{ width: 32, height: 32, border: 'none' }}
                                                    variant="rounded"
                                                    imgProps={{ style: { objectFit: 'cover' } }}
                                                />
                                            )}
                                            {/* Show file icon for forms and training with file_name or url */}
                                            {!item.icon_url && !item.logo_url && !item.preview_image_url && !item.thumbnail_url && (item.file_name || item.url) && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
                                                    {getFileIcon(item.file_name || item.url || '', 32)}
                                                </Box>
                                            )}
                                            <Box>
                                                {item.title || item.name}
                                                {item.description && (
                                                    <Typography variant="body2" noWrap sx={{ color: '#808080', fontSize: '0.75rem', maxWidth: 400, display: 'block' }}>
                                                        {item.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>
                                        <Chip
                                            label={item.category || 'General'}
                                            size="small"
                                            sx={{ ...dashboardStyles.chip, fontSize: '0.7rem' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#B0B0B0', borderBottom: '1px solid #2A2A2A' }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: '1px solid #2A2A2A', textAlign: 'right' }}>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                            {/* Preview / View button */}
                                            {(item.file_url || item.url || item.canva_url) && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        // Marketing templates open Canva URL, links open their URL
                                                        if (activeTab === 2 && item.canva_url) {
                                                            window.open(item.canva_url, '_blank', 'noopener,noreferrer');
                                                        } else if (activeTab === 3 && (item.url || item.file_url)) {
                                                            const url = item.url?.startsWith('http') ? item.url : getViewableUrl(item);
                                                            if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                                        } else {
                                                            openPreview(item);
                                                        }
                                                    }}
                                                    sx={{ color: '#4CAF50', '&:hover': { color: '#66BB6A' } }}
                                                >
                                                    <Eye size={18} />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => handleReorder(item, 'up')}
                                                disabled={filteredData.indexOf(item) === 0}
                                                sx={{ color: '#B0B0B0', '&:hover': { color: '#FFFFFF' } }}
                                            >
                                                <CaretUp size={18} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleReorder(item, 'down')}
                                                disabled={filteredData.indexOf(item) === filteredData.length - 1}
                                                sx={{ color: '#B0B0B0', '&:hover': { color: '#FFFFFF' } }}
                                            >
                                                <CaretDown size={18} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#E2C05A' }}
                                                onClick={() => openEditDialog(item)}
                                            >
                                                <PencilSimple size={18} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#EF5350' }}
                                                onClick={() => {
                                                    setItemToDelete(item);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash size={18} />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#808080', borderBottom: 'none' }}>
                                    No resources found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Resource Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#121212',
                        borderRadius: '12px',
                        border: '1px solid #2A2A2A',
                        color: '#FFFFFF'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {editingItem ? 'Edit Resource' : 'Add New Resource'}
                    </Typography>
                    <IconButton size="small" onClick={() => setOpenDialog(false)} sx={{ color: '#B0B0B0' }}>
                        <X size={20} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        {/* Title */}
                        <TextField
                            label="Title"
                            fullWidth
                            size="small"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            sx={dashboardStyles.textField}
                            required
                        />

                        {/* File Upload or Link (depending on type) */}
                        {currentType === 'form' && (
                            <Box>
                                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                                    File {editingItem && '*Optional when editing'}
                                </Typography>
                                <Box
                                    {...getFileRootProps()}
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: isFileDragActive ? '#E2C05A' : '#333333',
                                        borderRadius: 2,
                                        p: 3,
                                        backgroundColor: isFileDragActive ? 'rgba(226, 192, 90, 0.1)' : '#0D0D0D',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            borderColor: '#E2C05A',
                                            backgroundColor: 'rgba(226, 192, 90, 0.05)',
                                        },
                                    }}
                                >
                                    <input {...getFileInputProps()} />
                                    {formData.file ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                            <File size={24} color="#E2C05A" />
                                            <Typography sx={{ color: '#FFFFFF' }}>{formData.file.name}</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData(prev => ({ ...prev, file: null }));
                                                }}
                                                sx={{ color: '#EF5350' }}
                                            >
                                                <X size={18} />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <>
                                            <UploadSimple size={32} color="#B0B0B0" style={{ marginBottom: 8 }} />
                                            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                                                {isFileDragActive ? 'Drop file here' : 'Drag & drop file here, or click to select'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#666666', mt: 1, display: 'block' }}>
                                                Supported: PDF, DOC, DOCX
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {currentType === 'training' && (
                            <Box>
                                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                                    External Link (YouTube, course URL, etc.) — or upload a file below
                                </Typography>
                                <TextField
                                    label="Resource URL"
                                    fullWidth
                                    size="small"
                                    value={formData.link}
                                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                    sx={dashboardStyles.textField}
                                    placeholder="https://youtube.com/watch?v=... or https://course-site.com/..."
                                    helperText="Paste a YouTube link, course URL, or any external resource link"
                                    FormHelperTextProps={{ sx: { color: '#666' } }}
                                />
                                <Typography variant="body2" sx={{ color: '#B0B0B0', mt: 2, mb: 1 }}>
                                    File Upload (Optional — use instead of or alongside a link)
                                </Typography>
                                <Box
                                    {...getFileRootProps()}
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: isFileDragActive ? '#E2C05A' : '#333333',
                                        borderRadius: 2,
                                        p: 3,
                                        backgroundColor: isFileDragActive ? 'rgba(226, 192, 90, 0.1)' : '#0D0D0D',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            borderColor: '#E2C05A',
                                            backgroundColor: 'rgba(226, 192, 90, 0.05)',
                                        },
                                    }}
                                >
                                    <input {...getFileInputProps()} />
                                    {formData.file ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                            <File size={24} color="#E2C05A" />
                                            <Typography sx={{ color: '#FFFFFF' }}>{formData.file.name}</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData(prev => ({ ...prev, file: null }));
                                                }}
                                                sx={{ color: '#EF5350' }}
                                            >
                                                <X size={18} />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <>
                                            <UploadSimple size={32} color="#B0B0B0" style={{ marginBottom: 8 }} />
                                            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                                                {isFileDragActive ? 'Drop file here' : 'Drag & drop file here, or click to select'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#666666', mt: 1, display: 'block' }}>
                                                Supported: PDF, DOC, DOCX, MP4
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {(currentType === 'marketing' || currentType === 'link') && (
                            <TextField
                                label={currentType === 'marketing' ? 'Canva Template URL' : 'Link URL'}
                                fullWidth
                                size="small"
                                value={formData.link}
                                onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                sx={dashboardStyles.textField}
                                required={!editingItem}
                                placeholder={currentType === 'marketing' ? 'https://www.canva.com/design/...' : 'https://example.com'}
                            />
                        )}

                        {/* Icon/Image Upload */}
                            <Box>
                                <Typography variant="body2" sx={{ color: '#B0B0B0', mb: 1 }}>
                                    Icon/Image (Optional)
                                </Typography>
                                <Box
                                    {...getIconRootProps()}
                                    sx={{
                                        border: '2px dashed',
                                        borderColor: isIconDragActive ? '#E2C05A' : '#333333',
                                        borderRadius: 2,
                                        p: 3,
                                        backgroundColor: isIconDragActive ? 'rgba(226, 192, 90, 0.1)' : '#0D0D0D',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            borderColor: '#E2C05A',
                                            backgroundColor: 'rgba(226, 192, 90, 0.05)',
                                        },
                                    }}
                                >
                                    <input {...getIconInputProps()} />
                                    {/* Logic: Show new file if selected, otherwise show existing if editing */}
                                    {formData.icon ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                            <ImageIcon size={24} color="#E2C05A" />
                                            <Typography sx={{ color: '#FFFFFF' }}>{formData.icon.name}</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFormData(prev => ({ ...prev, icon: null }));
                                                }}
                                                sx={{ color: '#EF5350' }}
                                            >
                                                <X size={18} />
                                            </IconButton>
                                        </Box>
                                    ) : (editingItem && (editingItem.logo_url || editingItem.icon_url || editingItem.preview_image_url || editingItem.thumbnail_url)) ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                            <Avatar
                                                src={editingItem.logo_url || editingItem.icon_url || editingItem.preview_image_url || editingItem.thumbnail_url}
                                                variant="rounded"
                                                sx={{ width: 64, height: 64, mb: 1, border: 'none' }}
                                                imgProps={{ style: { objectFit: 'cover' } }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#B0B0B0' }}>
                                                Current Icon (Drop new image to replace)
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <>
                                            <UploadSimple size={32} color="#B0B0B0" style={{ marginBottom: 8 }} />
                                            <Typography variant="body2" sx={{ color: '#B0B0B0' }}>
                                                {isIconDragActive ? 'Drop image here' : 'Drag & drop image here, or click to select'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#666666', mt: 1, display: 'block' }}>
                                                Supported: JPG, PNG, WEBP, SVG
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>

                        {/* Description */}
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            sx={dashboardStyles.textField}
                        />

                        {/* Category */}
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ color: '#B0B0B0' }}>Category</InputLabel>
                            <Select
                                label="Category"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                sx={{ ...dashboardStyles.textField, '& .MuiSelect-select': { color: '#FFFFFF' } }}
                                required
                            >
                                {categoryOptions[currentType].map((cat) => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid #2A2A2A' }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: '#B0B0B0' }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.title || !formData.category}
                        sx={dashboardStyles.buttonContained}
                    >
                        {isSubmitting ? <CircularProgress size={20} /> : editingItem ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#121212',
                        border: '1px solid #2A2A2A',
                        borderRadius: '12px',
                        color: '#FFFFFF'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#B0B0B0' }}>
                        Are you sure you want to delete "{itemToDelete?.title || itemToDelete?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#B0B0B0', textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteItem}
                        sx={{
                            backgroundColor: '#EF5350',
                            color: '#FFFFFF',
                            textTransform: 'none',
                            '&:hover': { backgroundColor: '#D32F2F' },
                        }}
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* File Preview Dialog */}
            <Dialog
                open={previewDialogOpen}
                onClose={() => setPreviewDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#0A0A0A',
                        border: '1px solid #2A2A2A',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        height: '85vh',
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {previewItem && getFileIcon(previewItem.file_name || previewItem.url || '', 24)}
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                            {previewItem?.title || previewItem?.name || 'File Preview'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {previewItem && getViewableUrl(previewItem) && (
                            <IconButton
                                size="small"
                                onClick={() => window.open(getViewableUrl(previewItem)!, '_blank', 'noopener,noreferrer')}
                                sx={{ color: '#E2C05A' }}
                            >
                                <ArrowSquareOut size={20} />
                            </IconButton>
                        )}
                        <IconButton size="small" onClick={() => setPreviewDialogOpen(false)} sx={{ color: '#B0B0B0' }}>
                            <X size={20} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {previewItem && (() => {
                        const url = getViewableUrl(previewItem);
                        const ext = getFileExtension(previewItem);

                        if (!url) {
                            return (
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <Typography sx={{ color: '#808080' }}>No file URL available for preview.</Typography>
                                </Box>
                            );
                        }

                        // PDF — embed in iframe
                        if (ext === 'pdf') {
                            return (
                                <Box
                                    component="iframe"
                                    src={`${url}#toolbar=1&navpanes=0`}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        backgroundColor: '#1A1A1A',
                                    }}
                                    title={previewItem.title || 'PDF Preview'}
                                />
                            );
                        }

                        // Video — use native video player
                        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
                            return (
                                <Box
                                    component="video"
                                    controls
                                    src={url}
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        borderRadius: '8px',
                                    }}
                                />
                            );
                        }

                        // Images
                        if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)) {
                            return (
                                <Box
                                    component="img"
                                    src={url}
                                    alt={previewItem.title || 'Image Preview'}
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            );
                        }

                        // Fallback — can't preview inline, offer to open in new tab
                        return (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Box sx={{ mb: 3 }}>
                                    {getFileIcon(previewItem.file_name || '', 64)}
                                </Box>
                                <Typography sx={{ color: '#FFFFFF', mb: 1, fontWeight: 500 }}>
                                    {previewItem.file_name || 'File'}
                                </Typography>
                                <Typography sx={{ color: '#808080', mb: 3, fontSize: '0.875rem' }}>
                                    This file type cannot be previewed inline.
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<ArrowSquareOut size={18} />}
                                    onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                                    sx={{
                                        backgroundColor: 'rgba(226, 192, 90, 0.15)',
                                        border: '1px solid rgba(226, 192, 90, 0.3)',
                                        color: '#EDD48A',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': {
                                            backgroundColor: 'rgba(226, 192, 90, 0.25)',
                                        },
                                    }}
                                >
                                    Open in New Tab
                                </Button>
                            </Box>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ManageResources;
