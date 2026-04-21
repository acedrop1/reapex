'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  ArrowsClockwise as SyncIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Clock as ClockIcon,
  Info as InfoIcon,
} from '@phosphor-icons/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface SyncStatus {
  lastSync: string | null;
  hasSyncToken: boolean;
  lastSyncLog: {
    sync_type: string;
    sync_status: string;
    events_synced: number;
    events_created: number;
    events_updated: number;
    events_deleted: number;
    conflicts_detected: number;
    sync_completed_at: string;
    error_message?: string;
  } | null;
  unresolvedConflicts: number;
}

export default function SyncStatusIndicator() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Fetch sync status
  const { data: syncStatus, isLoading } = useQuery<SyncStatus>({
    queryKey: ['calendar-sync-status'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/sync/status');
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncType: 'incremental',
          forceFullSync: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });

  const handleInfoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Loading sync status...
        </Typography>
      </Box>
    );
  }

  if (!syncStatus) {
    return null;
  }

  const getSyncStatusColor = () => {
    if (!syncStatus.lastSync) return 'default';
    if (syncStatus.lastSyncLog?.sync_status === 'failed') return 'error';
    if (syncStatus.unresolvedConflicts > 0) return 'warning';
    return 'success';
  };

  const getSyncStatusIcon = () => {
    if (syncMutation.isPending) return <CircularProgress size={16} />;
    if (!syncStatus.lastSync) return <WarningIcon size={16} weight="fill" />;
    if (syncStatus.lastSyncLog?.sync_status === 'failed')
      return <WarningIcon size={16} weight="fill" />;
    if (syncStatus.unresolvedConflicts > 0) return <WarningIcon size={16} weight="fill" />;
    return <CheckIcon size={16} weight="fill" />;
  };

  const getSyncStatusText = () => {
    if (syncMutation.isPending) return 'Syncing...';
    if (!syncStatus.lastSync) return 'Never synced';
    if (syncStatus.lastSyncLog?.sync_status === 'failed') return 'Sync failed';
    if (syncStatus.unresolvedConflicts > 0) return `${syncStatus.unresolvedConflicts} conflicts`;
    return `Synced ${formatDistanceToNow(new Date(syncStatus.lastSync), { addSuffix: true })}`;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        icon={getSyncStatusIcon()}
        label={getSyncStatusText()}
        color={getSyncStatusColor()}
        size="small"
        sx={{ fontWeight: 500 }}
      />

      <Tooltip title="Sync Now">
        <span>
          <IconButton
            size="small"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            sx={{
              animation: syncMutation.isPending ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <SyncIcon size={18} weight="bold" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Sync Info">
        <IconButton size="small" onClick={handleInfoClick}>
          <InfoIcon size={18} />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Google Calendar Sync Status
          </Typography>

          {syncStatus.lastSyncLog && (
            <>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Last Sync"
                    secondary={
                      syncStatus.lastSync
                        ? formatDistanceToNow(new Date(syncStatus.lastSync), { addSuffix: true })
                        : 'Never'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Sync Type"
                    secondary={syncStatus.lastSyncLog.sync_type.toUpperCase()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip
                        label={syncStatus.lastSyncLog.sync_status.toUpperCase()}
                        size="small"
                        color={
                          syncStatus.lastSyncLog.sync_status === 'success' ? 'success' : 'error'
                        }
                      />
                    }
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 1 }} />

              <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom>
                Last Sync Details:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Events Synced"
                    secondary={syncStatus.lastSyncLog.events_synced}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={syncStatus.lastSyncLog.events_created}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Updated"
                    secondary={syncStatus.lastSyncLog.events_updated}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Deleted"
                    secondary={syncStatus.lastSyncLog.events_deleted}
                  />
                </ListItem>
              </List>

              {syncStatus.unresolvedConflicts > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {syncStatus.unresolvedConflicts} unresolved conflict
                    {syncStatus.unresolvedConflicts !== 1 ? 's' : ''} detected
                  </Alert>
                </>
              )}

              {syncStatus.lastSyncLog.error_message && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {syncStatus.lastSyncLog.error_message}
                  </Alert>
                </>
              )}
            </>
          )}

          {!syncStatus.lastSync && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Calendar has not been synced yet. Click the sync button to sync your Google Calendar
              events.
            </Alert>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                syncMutation.mutate();
                handleClose();
              }}
              disabled={syncMutation.isPending}
              startIcon={<SyncIcon size={16} />}
            >
              Sync Now
            </Button>
            <Button size="small" onClick={handleClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
