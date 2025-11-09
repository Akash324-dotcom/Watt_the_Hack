-- Create storage bucket for circle post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('circle-posts', 'circle-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Create circle_posts table
CREATE TABLE IF NOT EXISTS public.circle_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  image_url TEXT,
  caption TEXT NOT NULL,
  likes_count BIGINT NOT NULL DEFAULT 0,
  comments_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create circle_post_likes table
CREATE TABLE IF NOT EXISTS public.circle_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.circle_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create circle_post_comments table
CREATE TABLE IF NOT EXISTS public.circle_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.circle_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for circle_posts
-- Users can view posts only from circles they're members of
CREATE POLICY "Members can view circle posts"
ON public.circle_posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_members.circle_id = circle_posts.circle_id
    AND circle_members.user_id = auth.uid()
  )
);

-- Users can create posts in circles they're members of
CREATE POLICY "Members can create circle posts"
ON public.circle_posts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_members.circle_id = circle_posts.circle_id
    AND circle_members.user_id = auth.uid()
  )
);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON public.circle_posts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON public.circle_posts
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for circle_post_likes
CREATE POLICY "Members can view likes"
ON public.circle_post_likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.circle_posts
    INNER JOIN public.circle_members ON circle_members.circle_id = circle_posts.circle_id
    WHERE circle_posts.id = circle_post_likes.post_id
    AND circle_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can like posts"
ON public.circle_post_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.circle_post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for circle_post_comments
CREATE POLICY "Members can view comments"
ON public.circle_post_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.circle_posts
    INNER JOIN public.circle_members ON circle_members.circle_id = circle_posts.circle_id
    WHERE circle_posts.id = circle_post_comments.post_id
    AND circle_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can comment on posts"
ON public.circle_post_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.circle_posts
    INNER JOIN public.circle_members ON circle_members.circle_id = circle_posts.circle_id
    WHERE circle_posts.id = circle_post_comments.post_id
    AND circle_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own comments"
ON public.circle_post_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for circle-posts bucket
CREATE POLICY "Members can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'circle-posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view circle post images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'circle-posts');

CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'circle-posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.circle_post_comments;