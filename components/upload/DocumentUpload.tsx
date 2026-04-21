'use client';

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  CloudArrowUp,
  FilePdf,
  FileDoc,
  File as FileIcon,
  CheckCircle,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';

// Document configuration for Sales/Buy transactions
const SALES_DOCUMENT_CONFIG = {
  // Required Documents
  'Fully Executed Contract': { required: true, note: null },
  'Seller Disclosure': { required: true, note: null },
  'Commission Statement': { required: true, note: null },
  'Final ALTA/CD': { required: true, note: null },

  // Optional Documents with Notes
  'CIS': {
    required: false,
    note: 'If not in Fully Executed Contract'
  },
  'Dual Agency/Informed Consent': {
    required: false,
    note: 'If ReApex represents both sides'
  },
  'Lead-Based Paint Disclosure': {
    required: false,
    note: 'If home was built before 1978'
  },

  // Other
  'Other': { required: false, note: null },
};

// Document configuration for Rental transactions
const RENTAL_DOCUMENT_CONFIG = {
  // Required Documents
  'Fully Executed Lease Agreement': { required: true, note: null },
  'CIS': { required: true, note: null },

  // Optional Documents with Notes
  'Lead-Based Paint Disclosure': {
    required: false,
    note: 'If home was built before 1978'
  },

  // Other
  'Other': { required: false, note: null },
};

interface DocumentUploadProps {
  listingId?: string;
  transactionId?: string;
  onUploadComplete: () => void;
  maxSizeMB?: number;
}

interface UploadedDocument {
  document_type: string;
  file_name: string;
  id: string;
}

export default function DocumentUpload({
  listingId,
  transactionId,
  onUploadComplete,
  maxSizeMB = 50,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [transactionType, setTransactionType] = useState<'sale' | 'rental' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Fetch transaction type and existing documents
  useEffect(() => {
    const fetchData = async () => {
      try {
        const referenceId = transactionId || listingId;
        if (!referenceId) return;

        // Fetch transaction type if we have a transaction ID
        if (transactionId) {
          const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('transaction_type')
            .eq('id', transactionId)
            .single();

          if (txError) {
            console.error('Error fetching transaction type:', txError);
          } else if (txData) {
            setTransactionType(txData.transaction_type as 'sale' | 'rental');
          }
        } else {
          // Default to 'sale' for listings
          setTransactionType('sale');
        }

        // Fetch existing documents
        let query = supabase
          .from('transaction_documents')
          .select('id, document_type, file_name');

        if (transactionId) {
          query = query.eq('transaction_id', transactionId);
        } else if (listingId) {
          query = query.eq('listing_id', listingId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setUploadedDocuments(data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [listingId, transactionId]);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Get the appropriate document config based on transaction type
  const getDocumentConfig = () => {
    return transactionType === 'rental' ? RENTAL_DOCUMENT_CONFIG : SALES_DOCUMENT_CONFIG;
  };

  const DOCUMENT_CONFIG = getDocumentConfig();
  const DOCUMENT_TYPES = Object.keys(DOCUMENT_CONFIG);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    if (documentType === 'Other' && !customLabel.trim()) {
      setError('Please enter a custom label for Other document type');
      return;
    }

    setError(null);
    setSuccess(null);

    // Validate file size
    if (selectedFile.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    try {
      setUploading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload documents');
      }

      // Determine which ID to use
      const referenceId = transactionId || listingId;
      if (!referenceId) {
        throw new Error('Either listingId or transactionId must be provided');
      }

      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/transactions/${referenceId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Save document metadata to database with storage path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        document_type: documentType,
        file_name: documentType === 'Other' && customLabel.trim() ? customLabel.trim() : selectedFile.name,
        file_url: data.path,
        file_size: selectedFile.size,
        uploaded_by: user.id,
      };

      // Add either listing_id or transaction_id
      if (transactionId) {
        insertData.transaction_id = transactionId;
      } else if (listingId) {
        insertData.listing_id = listingId;
      }

      const { data: insertedDoc, error: dbError } = await supabase
        .from('transaction_documents')
        .insert(insertData)
        .select('id, document_type, file_name')
        .single();

      if (dbError) throw dbError;

      setSuccess('Document uploaded successfully');
      setSelectedFile(null);
      setDocumentType('');
      setCustomLabel('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Add to uploaded documents list
      if (insertedDoc) {
        setUploadedDocuments([...uploadedDocuments, insertedDoc]);
      }

      // Notify parent component
      onUploadComplete();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={32} color="#E2C05A" weight="duotone" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileDoc size={32} color="#E2C05A" weight="duotone" />;
    return <FileIcon size={32} color="#E2C05A" weight="duotone" />;
  };

  const isDocumentUploaded = (docType: string) => {
    return uploadedDocuments.some(doc => doc.document_type === docType);
  };

  const getDocumentHelperText = (docType: string) => {
    const config = DOCUMENT_CONFIG[docType as keyof typeof DOCUMENT_CONFIG];
    if (!config) return null;

    const parts: string[] = [];

    if (config.required) {
      parts.push('Required');
    } else {
      parts.push('Optional');
    }

    if (config.note) {
      parts.push(config.note);
    }

    return parts.join(' - ');
  };

  const getTransactionTypeLabel = () => {
    if (transactionType === 'rental') return 'Rental';
    if (transactionType === 'sale') return 'Sale/Buy';
    return 'Transaction';
  };

  return (
    <Box>
      {/* Document Checklist */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: '#0D0D0D', borderRadius: 2, border: '1px solid #2A2A2A' }}>
        <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 1, fontSize: '1rem', fontWeight: 600 }}>
          Document Checklist - {getTransactionTypeLabel()}
        </Typography>
        <Typography variant="caption" sx={{ color: '#808080', display: 'block', mb: 2 }}>
          Upload required documents to close this transaction
        </Typography>

        {/* Required Documents */}
        <Typography variant="subtitle2" sx={{ color: '#E2C05A', mb: 1, fontWeight: 600 }}>
          Required Documents
        </Typography>
        {DOCUMENT_TYPES.filter(type => DOCUMENT_CONFIG[type as keyof typeof DOCUMENT_CONFIG]?.required).map((docType) => (
          <FormControlLabel
            key={docType}
            control={
              <Checkbox
                checked={isDocumentUploaded(docType)}
                disabled
                icon={<Box sx={{ width: 20, height: 20, border: '2px solid #2A2A2A', borderRadius: '4px' }} />}
                checkedIcon={<CheckCircle size={20} weight="fill" color="#34D399" />}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: isDocumentUploaded(docType) ? '#34D399' : '#B0B0B0' }}>
                {docType}
              </Typography>
            }
            sx={{ display: 'flex', mb: 0.5 }}
          />
        ))}

        {/* Optional Documents */}
        <Typography variant="subtitle2" sx={{ color: '#FFA726', mb: 1, mt: 2, fontWeight: 600 }}>
          Optional Documents
        </Typography>
        {DOCUMENT_TYPES.filter(type =>
          !DOCUMENT_CONFIG[type as keyof typeof DOCUMENT_CONFIG]?.required && type !== 'Other'
        ).map((docType) => {
          const note = DOCUMENT_CONFIG[docType as keyof typeof DOCUMENT_CONFIG]?.note;
          return (
            <Box key={docType} sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isDocumentUploaded(docType)}
                    disabled
                    icon={<Box sx={{ width: 20, height: 20, border: '2px solid #2A2A2A', borderRadius: '4px' }} />}
                    checkedIcon={<CheckCircle size={20} weight="fill" color="#34D399" />}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: isDocumentUploaded(docType) ? '#34D399' : '#B0B0B0' }}>
                    {docType}
                  </Typography>
                }
                sx={{ display: 'flex' }}
              />
              {note && (
                <Typography variant="caption" sx={{ color: '#808080', ml: 4, display: 'block', fontStyle: 'italic' }}>
                  {note}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Document Type</InputLabel>
        <Select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          label="Document Type"
          sx={{
            backgroundColor: '#1A1A1A',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#2A2A2A',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#333333',
            },
          }}
        >
          {DOCUMENT_TYPES.map((type) => {
            const isUploaded = isDocumentUploaded(type);
            const helperText = getDocumentHelperText(type);

            return (
              <MenuItem
                key={type}
                value={type}
                disabled={isUploaded && type !== 'Other'}
                sx={{
                  '&.Mui-disabled': {
                    opacity: 0.5,
                    color: '#666666',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {isUploaded && <CheckCircle size={16} weight="fill" color="#34D399" style={{ marginRight: 8 }} />}
                  <Typography variant="body2">
                    {type}
                  </Typography>
                </Box>
                {helperText && (
                  <Typography variant="caption" sx={{ color: '#808080', mt: 0.5, fontStyle: 'italic' }}>
                    {helperText}
                  </Typography>
                )}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {documentType === 'Other' && (
        <TextField
          fullWidth
          label="Custom Document Label"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder="Enter document type (e.g., Appraisal, Inspection Report)"
          required
          sx={{
            mb: 2,
            '& .MuiInputBase-root': {
              backgroundColor: '#1A1A1A',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#2A2A2A',
            },
            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#333333',
            },
            '& .MuiInputLabel-root': {
              color: '#B0B0B0',
            },
            '& .MuiInputBase-input': {
              color: '#FFFFFF',
            },
          }}
        />
      )}

      {selectedFile ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 1,
            border: '2px solid #2A2A2A',
            backgroundColor: '#1A1A1A',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
          }}
        >
          {getFileIcon(selectedFile.name)}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#808080' }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSelectedFile(null)}
            sx={{
              borderColor: '#2A2A2A',
              color: '#B0B0B0',
              '&:hover': {
                borderColor: '#333333',
                backgroundColor: '#121212',
              },
            }}
          >
            Remove
          </Button>
        </Box>
      ) : (
        <Box
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            width: '100%',
            height: 150,
            border: `2px dashed ${isDragging ? '#E2C05A' : '#2A2A2A'}`,
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? '#1A1A1A' : '#121212',
            transition: 'all 0.2s',
            mb: 2,
            '&:hover': {
              borderColor: '#E2C05A',
              backgroundColor: '#1A1A1A',
            },
          }}
        >
          {isDragging ? (
            <FileIcon size={48} color="#E2C05A" weight="duotone" />
          ) : (
            <CloudArrowUp size={48} color="#B0B0B0" weight="duotone" />
          )}
          <Typography variant="body1" sx={{ mt: 2, fontWeight: 500, color: '#B0B0B0' }}>
            {isDragging ? 'Drop document here' : 'Click or drag document here'}
          </Typography>
          <Typography variant="caption" sx={{ mt: 0.5, color: '#808080' }}>
            Maximum file size: {maxSizeMB}MB
          </Typography>
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Button
        fullWidth
        variant="contained"
        onClick={handleUpload}
        disabled={uploading || !selectedFile || !documentType}
        sx={{
          backgroundColor: '#E2C05A',
          color: '#000000',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#34D399',
          },
          '&:disabled': {
            backgroundColor: '#2A2A2A',
            color: '#808080',
          },
        }}
      >
        {uploading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1, color: '#000000' }} />
            Uploading...
          </>
        ) : (
          'Upload Document'
        )}
      </Button>
    </Box>
  );
}
