'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { isAdmin as checkIsAdmin } from '@/lib/utils/auth';
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import { dashboardStyles } from '@/lib/theme/dashboardStyles';
import {
  Trash,
  DownloadSimple,
  Info,
} from '@phosphor-icons/react';
import { useState } from 'react';
import ResourceGrid from '@/components/shared/ResourceGrid';
import FilePreviewModal from '@/components/modals/FilePreviewModal';


export default function FormsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Get current user and check if admin
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('users')
        .select('id, role, full_name')
        .eq('id', user.id)
        .single();

      return data;
    },
  });

  const isAdmin = checkIsAdmin(currentUser?.role);

  // Fetch brokerage documents (from admin brokerage documents upload)
  const { data: forms, isLoading } = useQuery({
    queryKey: ['brokerage-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokerage_documents')
        .select(`
          *,
          users!brokerage_documents_uploaded_by_fkey(full_name)
        `)
        .eq('is_visible', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });


  // Delete brokerage document mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brokerage_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokerage-documents'] });
    },
  });


  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Templates': '#4CAF50',
      'Compliance': '#E2C05A',
      'Listing Forms': '#4CAF50',
      'Buyer Forms': '#E2C05A',
      'Transaction Forms': '#FF9800',
      'Compliance Forms': '#F44336',
      'Brokerage Operations': '#c49d2f',
      'Misc': '#607D8B',
    };
    return colors[category] || '#757575';
  };

  const handlePreviewPane = async (form: any) => {
    // Normalize the field name - FilePreviewModal expects 'url' but brokerage_documents uses 'file_url'
    const normalizedForm = {
      ...form,
      url: form.url || form.file_url, // Use existing url, fall back to file_url
    };

    setSelectedFile(normalizedForm);
    setPreviewModalOpen(true);

    // Log the view action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('document_access_logs').insert({
        document_id: form.id,
        user_id: user.id,
        action_type: 'view',
        ip_address: null,
        user_agent: navigator.userAgent,
      });
    }
  };

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000000', position: 'relative' }}>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* ZipForms Warning Section */}
        <Box sx={{
          backgroundColor: '#111111',
          borderBottom: '1px solid rgba(226, 192, 90, 0.08)',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Button
            variant="contained"
            size="large"
            component="a"
            href="https://www.zipformplus.com/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              backgroundColor: '#E2C05A',
              color: '#FFFFFF',
              py: 1.5,
              px: 4,
              '&:hover': { backgroundColor: '#C4A43B' },
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            Access ZipForms Plus
          </Button>
          <Box
            sx={{
              backgroundColor: 'rgba(226, 192, 90, 0.15)',
              border: '1px solid rgba(226, 192, 90, 0.4)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              flex: 1,
            }}
          >
            <Info
              size={20}
              weight="fill"
              style={{
                color: '#E2C05A',
                flexShrink: 0,
                marginTop: '2px',
              }}
            />
            <Typography variant="caption" sx={{ color: '#E0E0E0', lineHeight: 1.5, fontSize: '0.75rem' }}>
              To ensure 100% compliance and legal protection, Reapex agents must only use forms from this system.
              State and local boards update forms frequently. Using a saved, old version creates massive liability
              for you and the brokerage.
            </Typography>
          </Box>
        </Box>


        {/* Forms Section */}
        <Box sx={{ backgroundColor: '#111111', p: 3, flex: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography variant="body2" sx={{ color: '#808080' }}>
                Loading forms...
              </Typography>
            </Box>
          ) : (
            <ResourceGrid
              items={(forms || []).map((form: any) => ({
                id: form.id,
                title: form.title,
                description: form.description,
                category: form.category,
                type: 'document',
                url: form.file_url,
                file_name: form.file_name,
                file_type: form.file_name ? form.file_name.split('.').pop()?.toLowerCase() : 'unknown',
                created_at: form.created_at,
              }))}
              onItemClick={handlePreviewPane}
              isAdmin={isAdmin}
              onDelete={(item) => deleteFormMutation.mutate(item.id)}
            />
          )}

          {(!isLoading && (!forms || forms.length === 0)) && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body2" sx={{ color: '#808080' }}>
                No forms available yet.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* File Preview Modal */}
      <FilePreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        selectedFile={selectedFile}
      />
    </Box>
  );
}
