'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
} from '@mui/material';
import { ChatCircle, EnvelopeSimple, Phone, MapPin, Buildings, Wrench } from '@phosphor-icons/react';

const ActionCard = ({
  title,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex', alignItems: 'center', gap: 2, p: 2.5,
      background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px',
      textDecoration: 'none', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer',
      '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
    }}
  >
    <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(226,192,90,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E2C05A', flexShrink: 0 }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>{title}</Typography>
      <Typography sx={{ fontSize: '12px', color: '#aaaaaa' }}>{subtitle}</Typography>
    </Box>
  </Box>
);

const QuickLink = ({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) => (
  <Box
    component="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    sx={{
      display: 'flex', alignItems: 'center', gap: 1.1,
      p: '12px 14px', borderRadius: '8px', background: '#1a1a1a',
      border: '1px solid rgba(226, 192, 90, 0.08)', fontSize: '12px', fontWeight: 600,
      color: '#FFFFFF', textDecoration: 'none', cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      '&:hover': { borderColor: 'rgba(226, 192, 90, 0.2)', background: '#181818', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
    }}
  >
    <Box sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E2C05A', flexShrink: 0 }}>
      {icon}
    </Box>
    {label}
  </Box>
);

export default function SupportPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [brokerOpen, setBrokerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'general',
    description: '',
    priority: 'medium',
  });
  const [brokerForm, setBrokerForm] = useState({
    subject: '',
    question: '',
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      return data;
    },
  });

  // Submit support ticket — creates a notification for admins
  const submitTicketMutation = useMutation({
    mutationFn: async (form: typeof ticketForm) => {
      if (!currentUser) throw new Error('Not logged in');

      // Get all admin users
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'admin_agent']);

      // Create a notification for each admin
      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          title: `Support Ticket: ${form.subject}`,
          message: `${currentUser.full_name || 'An agent'} submitted a ${form.priority} priority ticket (${form.category}): ${form.description.substring(0, 100)}...`,
          type: 'support_ticket',
          read: false,
          link: '/admin/users',
        }));

        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setTicketOpen(false);
      setTicketForm({ subject: '', category: 'general', description: '', priority: 'medium' });
      setSuccessMessage('Support ticket submitted! An admin will review it shortly.');
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  // Submit broker question
  const submitBrokerMutation = useMutation({
    mutationFn: async (form: typeof brokerForm) => {
      if (!currentUser) throw new Error('Not logged in');

      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'admin_agent']);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          title: `Broker Question: ${form.subject}`,
          message: `${currentUser.full_name || 'An agent'} asked: ${form.question.substring(0, 120)}`,
          type: 'broker_question',
          read: false,
          link: '/admin/users',
        }));

        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setBrokerOpen(false);
      setBrokerForm({ subject: '', question: '' });
      setSuccessMessage('Your question has been sent to the managing broker!');
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  return (
    <Box sx={{ p: { xs: 2, md: '24px 28px' }, fontFamily: "'DM Sans', sans-serif" }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#FFFFFF' }}>Support & Brokerage</Typography>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
          {successMessage}
        </Alert>
      )}

      {/* Support Actions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <ActionCard
          title="Submit Support Ticket"
          subtitle="Get help from the operations team"
          icon={<ChatCircle size={20} weight="fill" />}
          onClick={() => setTicketOpen(true)}
        />
        <ActionCard
          title="Ask a Broker Question"
          subtitle="Direct line to your managing broker"
          icon={<EnvelopeSimple size={20} weight="fill" />}
          onClick={() => setBrokerOpen(true)}
        />
      </Box>

      {/* Contact Info */}
      <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Brokerage Contact</Typography>
        </Box>
        <Box sx={{ p: '16px 20px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Phone size={16} color="#E2C05A" />
            <Typography sx={{ fontSize: '13px', color: '#aaaaaa' }}>
              Office: <Box component="a" href="tel:+1234567890" sx={{ color: '#FFFFFF', textDecoration: 'none', '&:hover': { color: '#E2C05A' } }}>(123) 456-7890</Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EnvelopeSimple size={16} color="#E2C05A" />
            <Typography sx={{ fontSize: '13px', color: '#aaaaaa' }}>
              Email: <Box component="a" href="mailto:support@reapex.com" sx={{ color: '#FFFFFF', textDecoration: 'none', '&:hover': { color: '#E2C05A' } }}>support@reapex.com</Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MapPin size={16} color="#E2C05A" />
            <Typography sx={{ fontSize: '13px', color: '#aaaaaa' }}>123 Main Street, Suite 100, City, State 12345</Typography>
          </Box>
        </Box>
      </Box>

      {/* Office Resources */}
      <Box sx={{ background: '#111111', border: '1px solid rgba(226, 192, 90, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ p: '16px 20px', borderBottom: '1px solid rgba(226, 192, 90, 0.08)' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Office Resources</Typography>
        </Box>
        <Box sx={{ p: '16px 20px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
            <QuickLink label="Company Directory" href="/admin/agents" icon={<Buildings size={16} />} />
            <QuickLink label="Office Setup Guide" href="#" icon={<Wrench size={16} />} />
          </Box>
        </Box>
      </Box>

      {/* Support Ticket Dialog */}
      <Dialog open={ticketOpen} onClose={() => setTicketOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#111111', border: '1px solid rgba(226, 192, 90, 0.15)', borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Submit Support Ticket</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Subject"
            fullWidth
            value={ticketForm.subject}
            onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(226,192,90,0.15)' } }, '& .MuiInputLabel-root': { color: '#aaa' } }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#aaa' }}>Category</InputLabel>
            <Select
              value={ticketForm.category}
              label="Category"
              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
              sx={{ color: '#fff', '& fieldset': { borderColor: 'rgba(226,192,90,0.15)' } }}
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="technical">Technical Issue</MenuItem>
              <MenuItem value="billing">Billing</MenuItem>
              <MenuItem value="compliance">Compliance</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#aaa' }}>Priority</InputLabel>
            <Select
              value={ticketForm.priority}
              label="Priority"
              onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
              sx={{ color: '#fff', '& fieldset': { borderColor: 'rgba(226,192,90,0.15)' } }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={ticketForm.description}
            onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(226,192,90,0.15)' } }, '& .MuiInputLabel-root': { color: '#aaa' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTicketOpen(false)} sx={{ color: '#aaa' }}>Cancel</Button>
          <Button
            onClick={() => submitTicketMutation.mutate(ticketForm)}
            disabled={!ticketForm.subject || !ticketForm.description || submitTicketMutation.isPending}
            sx={{ backgroundColor: '#E2C05A', color: '#000', fontWeight: 600, '&:hover': { backgroundColor: '#c4a43e' }, '&.Mui-disabled': { backgroundColor: 'rgba(226,192,90,0.3)', color: '#666' } }}
          >
            {submitTicketMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Broker Question Dialog */}
      <Dialog open={brokerOpen} onClose={() => setBrokerOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#111111', border: '1px solid rgba(226, 192, 90, 0.15)', borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '16px' }}>Ask a Broker Question</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Subject"
            fullWidth
            value={brokerForm.subject}
            onChange={(e) => setBrokerForm({ ...brokerForm, subject: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(226,192,90,0.15)' } }, '& .MuiInputLabel-root': { color: '#aaa' } }}
          />
          <TextField
            label="Your Question"
            fullWidth
            multiline
            rows={4}
            value={brokerForm.question}
            onChange={(e) => setBrokerForm({ ...brokerForm, question: e.target.value })}
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(226,192,90,0.15)' } }, '& .MuiInputLabel-root': { color: '#aaa' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBrokerOpen(false)} sx={{ color: '#aaa' }}>Cancel</Button>
          <Button
            onClick={() => submitBrokerMutation.mutate(brokerForm)}
            disabled={!brokerForm.subject || !brokerForm.question || submitBrokerMutation.isPending}
            sx={{ backgroundColor: '#E2C05A', color: '#000', fontWeight: 600, '&:hover': { backgroundColor: '#c4a43e' }, '&.Mui-disabled': { backgroundColor: 'rgba(226,192,90,0.3)', color: '#666' } }}
          >
            {submitBrokerMutation.isPending ? 'Sending...' : 'Send Question'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
