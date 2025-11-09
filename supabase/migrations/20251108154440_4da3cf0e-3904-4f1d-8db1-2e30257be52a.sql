-- Create user_actions table for personal impact tracking
CREATE TABLE public.user_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  day text NOT NULL,
  action_type text NOT NULL,
  points bigint NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

-- Users can view their own actions
CREATE POLICY "Users can view their own actions"
ON public.user_actions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own actions
CREATE POLICY "Users can insert their own actions"
ON public.user_actions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_user_actions_user_date ON public.user_actions(user_id, date);
CREATE INDEX idx_user_actions_user_type ON public.user_actions(user_id, action_type);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_actions;