'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import { Plus, PencilSimple, Trash, MagnifyingGlass } from '@phosphor-icons/react';
import Link from 'next/link';

// Panel component matching prototype
const Panel = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
  <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2.5, '&:hover': { borderColor: 'rgba(226,192,90,0.1)' } }}>
    <Box sx={{ p: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{title}</Typography>
      {badge && <Box sx={{ fontSize: '11px', fontWeight: 700, px: 1.1, py: 0.25, borderRadius: '100px', background: 'rgba(226,192,90,0.12)', color: '#E2C05A' }}>{badge}</Box>}
    </Box>
    <Box sx={{ p: '16px 20px' }}>{children}</Box>
  </Box>
);

// Filter button matching prototype
const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      px: 1.75, py: 0.75, borderRadius: '100px', fontSize: '12px', fontWeight: 500,
      background: active ? 'rgba(226,192,90,0.12)' : '#111111',
      border: `1px solid ${active ? 'rgba(226, 192, 90, 0.2)' : 'rgba(226, 192, 90, 0.08)'}`,
      color: active ? '#E2C05A' : '#aaaaaa',
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      '&:hover': { transform: 'translateY(-1px)', background: 'rgba(226,192,90,0.12)', borderColor: 'rgba(226, 192, 90, 0.2)', color: '#E2C05A' },
    }}
  >
    {children}
  </Box>
);

export default function CRMPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('pipeline');
  const [dutyOn, setDutyOn] = useState(false);
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', source: '', status: 'new', notes: '' });

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      return data;
    },
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('contacts').insert({ ...data, agent_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setAddDialogOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', source: '', status: 'new', notes: '' });
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('contacts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditContact(null);
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  const filteredContacts = contacts.filter((c: any) => {
    if (search) {
      const s = search.toLowerCase();
      return (c.first_name || '').toLowerCase().includes(s) || (c.last_name || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s);
    }
    return true;
  });

  // Stats
  const newLeads = contacts.filter((c: any) => c.status === 'new').length;
  const activeLeads = contacts.filter((c: any) => c.status === 'active' || c.status === 'contacted').length;
  const thisMonth = contacts.filter((c: any) => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  contacts.forEach((c: any) => {
    const src = c.source || 'Direct';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const topSources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const avatarGradients = [
    'linear-gradient(135deg, #E2C05A, #c4a43e)',
    'linear-gradient(135deg, #00e68a, #00b36b)',
    'linear-gradient(135deg, #ffb020, #cc8800)',
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      new: { bg: 'rgba(226,192,90,0.12)', color: '#E2C05A' },
      contacted: { bg: 'rgba(0,230,138,0.12)', color: '#00e68a' },
      active: { bg: 'rgba(0,230,138,0.12)', color: '#00e68a' },
      qualified: { bg: 'rgba(255,176,32,0.12)', color: '#ffb020' },
      closed: { bg: 'rgba(255,77,106,0.12)', color: '#ff4d6a' },
    };
    const style = map[status] || map.new;
    return (
      <Box sx={{ display: 'inline-flex', px: 1.1, py: 0.25, borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: style.bg, color: style.color, textTransform: 'capitalize' }}>
        {status}
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>Leads & Contacts</Typography>
        <Box
          component="button"
          onClick={() => setAddDialogOpen(true)}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            px: 2.25, py: 1, borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: '#E2C05A', color: '#000000', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.3s ease',
            '&:hover': { background: '#c4a43e' },
          }}
        >
          <Plus size={14} weight="bold" /> Add Contact
        </Box>
      </Box>

      {/* Duty Toggle */}
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 1.5, p: '12px 20px',
        background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '8px', mb: 2,
      }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>Lead Routing Status:</Typography>
        <Box
          onClick={() => setDutyOn(!dutyOn)}
          sx={{
            width: 48, height: 24, background: dutyOn ? 'rgba(0,230,138,0.12)' : '#1a1a1a',
            border: `1px solid ${dutyOn ? '#00e68a' : 'rgba(226,192,90,0.08)'}`,
            borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease',
          }}
        >
          <Box sx={{
            position: 'absolute', top: 2, left: dutyOn ? 26 : 2,
            width: 20, height: 20, background: dutyOn ? '#00e68a' : '#666666',
            borderRadius: '10px', transition: 'all 0.3s ease',
          }} />
        </Box>
        <Box sx={{
          fontSize: '11px', fontWeight: 600, px: 1, py: 0.25, borderRadius: '100px',
          background: dutyOn ? 'rgba(0,230,138,0.12)' : 'rgba(255,77,106,0.12)',
          color: dutyOn ? '#00e68a' : '#ff4d6a',
        }}>
          {dutyOn ? 'On-Duty' : 'Off-Duty'}
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
        <FilterBtn active={activeFilter === 'pipeline'} onClick={() => setActiveFilter('pipeline')}>My Pipeline</FilterBtn>
        <FilterBtn active={activeFilter === 'stats'} onClick={() => setActiveFilter('stats')}>Lead Gen Stats</FilterBtn>
      </Box>

      {/* Follow Up Boss Hub */}
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        p: '60px 40px', textAlign: 'center',
        background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px',
        position: 'relative', overflow: 'hidden', mb: 2.5,
        '&::after': {
          content: '""', position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 120%, rgba(226,192,90,.05) 0%, transparent 60%)',
          pointerEvents: 'none',
        },
      }}>
        <Typography sx={{ fontSize: '18px', fontWeight: 700, mb: 0.75, color: '#FFFFFF', position: 'relative', zIndex: 1 }}>Follow Up Boss</Typography>
        <Typography sx={{ color: '#aaaaaa', mb: 2.5, maxWidth: 380, fontSize: '13px', position: 'relative', zIndex: 1 }}>
          Access your complete lead management system, pipelines, and automations.
        </Typography>
        <Box component="a" href="#" onClick={(e: React.MouseEvent) => e.preventDefault()} sx={{
          display: 'inline-flex', px: 2.25, py: 1, borderRadius: '8px',
          fontSize: '13px', fontWeight: 600, background: '#E2C05A', color: '#000000',
          textDecoration: 'none', position: 'relative', zIndex: 1,
        }}>
          Launch CRM
        </Box>
      </Box>

      {/* Lead Gen Stats */}
      {activeFilter === 'stats' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
          <Panel title="Lead Generation Stats">
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: '12px', color: '#666666', mb: 0.4 }}>This Month</Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#FFFFFF' }}>{thisMonth}</Typography>
            </Box>
            <Box sx={{ borderTop: '1px solid rgba(226, 192, 90, 0.08)', pt: 1.5 }}>
              <Typography sx={{ fontSize: '12px', color: '#666666', mb: 0.4 }}>Total Contacts</Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#FFFFFF' }}>{contacts.length}</Typography>
            </Box>
          </Panel>
          <Panel title="Top Lead Sources">
            {topSources.map(([source, count], i) => (
              <Box key={source} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.025)', '&:last-child': { borderBottom: 'none' } }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '8px', background: avatarGradients[i % 3], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#FFFFFF' }}>
                  {source.slice(0, 3)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{source}</Typography>
                  <Typography sx={{ fontSize: '11px', color: '#666666' }}>{count} leads</Typography>
                </Box>
              </Box>
            ))}
            {topSources.length === 0 && <Typography sx={{ fontSize: '13px', color: '#666666' }}>No data yet</Typography>}
          </Panel>
        </Box>
      )}

      {/* Contacts Table */}
      {activeFilter === 'pipeline' && (
        <Panel title="All Contacts" badge={`${filteredContacts.length}`}>
          {/* Search */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, mb: 2,
            background: '#1a1a1a', border: '1px solid rgba(226, 192, 90, 0.08)',
            borderRadius: '8px', px: 1.75, py: 0.75,
            '&:focus-within': { borderColor: '#E2C05A' },
          }}>
            <MagnifyingGlass size={14} color="#666666" />
            <input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none', color: '#FFFFFF',
                fontSize: '13px', fontFamily: "'DM Sans', sans-serif", width: '100%',
              }}
            />
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Phone', 'Source', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666666', borderBottom: '1px solid rgba(226,192,90,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact: any) => (
                  <tr key={contact.id} style={{ transition: 'all 0.2s ease' }}>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                      {contact.first_name} {contact.last_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#aaaaaa', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>{contact.email || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#aaaaaa', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>{contact.phone || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#666666', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>{contact.source || '—'}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>{getStatusBadge(contact.status || 'new')}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => { setEditContact(contact); setFormData({ first_name: contact.first_name || '', last_name: contact.last_name || '', email: contact.email || '', phone: contact.phone || '', source: contact.source || '', status: contact.status || 'new', notes: contact.notes || '' }); }} sx={{ color: '#aaaaaa', '&:hover': { color: '#E2C05A' } }}>
                          <PencilSimple size={14} />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteContactMutation.mutate(contact.id)} sx={{ color: '#aaaaaa', '&:hover': { color: '#ff4d6a' } }}>
                          <Trash size={14} />
                        </IconButton>
                      </Box>
                    </td>
                  </tr>
                ))}
                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#666666', fontSize: '13px' }}>No contacts found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Panel>
      )}

      {/* Add/Edit Contact Dialog */}
      <Dialog open={addDialogOpen || !!editContact} onClose={() => { setAddDialogOpen(false); setEditContact(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: '#111111', border: '1px solid rgba(226,192,90,0.08)', borderRadius: '12px' } }}>
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>
          {editContact ? 'Edit Contact' : 'Add New Contact'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {['first_name', 'last_name', 'email', 'phone'].map(field => (
            <TextField
              key={field}
              label={field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              value={(formData as any)[field]}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(226,192,90,0.08)' }, '&:hover fieldset': { borderColor: 'rgba(226,192,90,0.2)' } }, '& .MuiInputLabel-root': { color: '#666666' } }}
            />
          ))}
          <TextField
            select
            label="Source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(226,192,90,0.08)' } }, '& .MuiInputLabel-root': { color: '#666666' } }}
          >
            {['Website', 'Zillow', 'Realtor.com', 'Referral', 'Instagram', 'Direct', 'Other'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(226,192,90,0.08)' } }, '& .MuiInputLabel-root': { color: '#666666' } }}
          >
            {['new', 'contacted', 'active', 'qualified', 'closed'].map(s => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={2}
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(226,192,90,0.08)' } }, '& .MuiInputLabel-root': { color: '#666666' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setAddDialogOpen(false); setEditContact(null); }} sx={{ color: '#666666' }}>Cancel</Button>
          <Button
            onClick={() => {
              if (editContact) {
                updateContactMutation.mutate({ id: editContact.id, data: formData });
              } else {
                addContactMutation.mutate(formData);
              }
            }}
            sx={{ background: '#E2C05A', color: '#000000', fontWeight: 600, '&:hover': { background: '#c4a43e' } }}
          >
            {editContact ? 'Save' : 'Add Contact'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
