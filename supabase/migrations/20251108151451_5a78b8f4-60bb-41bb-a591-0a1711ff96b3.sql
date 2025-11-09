-- Create circles table
CREATE TABLE IF NOT EXISTS public.circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('university', 'neighborhood', 'workplace')),
  location TEXT NOT NULL,
  description TEXT,
  points BIGINT DEFAULT 0,
  weekly_points BIGINT DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create circle_members table
CREATE TABLE IF NOT EXISTS public.circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

-- Create circle_achievements table
CREATE TABLE IF NOT EXISTS public.circle_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create circle_messages table
CREATE TABLE IF NOT EXISTS public.circle_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table for user display info
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Circles policies (public read, authenticated write)
CREATE POLICY "Circles are viewable by everyone" ON public.circles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create circles" ON public.circles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update circles" ON public.circles FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Circle members policies
CREATE POLICY "Circle members are viewable by everyone" ON public.circle_members FOR SELECT USING (true);
CREATE POLICY "Users can join circles" ON public.circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave circles" ON public.circle_members FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies (public read)
CREATE POLICY "Achievements are viewable by everyone" ON public.circle_achievements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add achievements" ON public.circle_achievements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Messages policies (public read, authenticated write)
CREATE POLICY "Messages are viewable by everyone" ON public.circle_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.circle_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.circles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_messages;

-- Function to get member count
CREATE OR REPLACE FUNCTION get_circle_member_count(circle_uuid UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*)::BIGINT FROM public.circle_members WHERE circle_id = circle_uuid;
$$ LANGUAGE SQL STABLE;

-- Insert seed data
INSERT INTO public.circles (id, name, type, location, description, points, weekly_points, icon) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'University of Toronto Eco Squad', 'university', 'Toronto, ON', 'Students and staff united for campus sustainability', 45800, 342, 'School'),
  ('550e8400-e29b-41d4-a716-446655440002', 'The Annex Green Neighbors', 'neighborhood', 'Toronto, ON', 'A vibrant community making sustainable living the norm', 32400, 218, 'Home'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Cognizant Toronto Sustainability Team', 'workplace', 'Toronto, ON', 'Employees driving green initiatives at work and beyond', 28900, 189, 'Building2');

INSERT INTO public.circle_achievements (circle_id, badge_name, badge_emoji) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Carbon Neutral Campus', '🌱'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Zero Waste Pioneer', '♻️'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Water Warrior', '💧'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Bike-Friendly Zone', '🚴'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Tree Planting Heroes', '🌳'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Energy Savers', '⚡'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Data-Driven Impact', '📊');