'use client';

import {
  Box,
  Typography,
} from '@mui/material';
import ResourceGrid from '@/components/shared/ResourceGrid';

interface CanvaTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business_card' | 'property_flyer' | 'yard_sign' | 'social_media';
  template_id: string;
  preview_image_url: string | null;
  canva_url: string;
  display_order: number;
}

interface TemplateGalleryProps {
  templates: CanvaTemplate[];
  isAdmin?: boolean;
}

const categoryLabels = {
  business_card: 'Business Cards',
  property_flyer: 'Property Flyers',
  yard_sign: 'Yard Signs',
  social_media: 'Social Media',
};

export default function TemplateGallery({ templates, isAdmin = false }: TemplateGalleryProps) {

  const handleEditInCanva = (canvaUrl: string) => {
    window.open(canvaUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box>
      {/* Template Grid - All templates together */}
      {templates.length > 0 ? (
        <ResourceGrid
          items={templates.map((template) => ({
            id: template.id,
            title: template.name,
            description: template.description,
            category: categoryLabels[template.category],
            type: 'template',
            url: template.canva_url,
            preview_url: template.preview_image_url,
            canva_url: template.canva_url,
          }))}
          onItemClick={(item) => handleEditInCanva(item.canva_url || '')}
          isAdmin={false} // No admin actions
        />
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: '#121212',
            borderRadius: '12px',
            border: '1px solid #2A2A2A',
          }}
        >
          <Typography variant="h6" sx={{ color: '#808080', mt: 2 }}>
            No templates available
          </Typography>
          <Typography variant="body2" sx={{ color: '#808080', mt: 1 }}>
            Marketing templates will appear here when added
          </Typography>
        </Box>
      )}
    </Box>
  );
}
