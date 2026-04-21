-- Add contact_id column to tasks table to allow associating tasks with contacts

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_contact_id ON public.tasks(contact_id);

-- Add comment
COMMENT ON COLUMN public.tasks.contact_id IS 'Optional reference to contact this task is related to';
