-- Fix function search paths for security
DROP FUNCTION IF EXISTS increment_post_likes() CASCADE;
DROP FUNCTION IF EXISTS decrement_post_likes() CASCADE;
DROP FUNCTION IF EXISTS increment_post_comments() CASCADE;
DROP FUNCTION IF EXISTS decrement_post_comments() CASCADE;

-- Create function to increment likes count with search_path
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circle_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to decrement likes count with search_path
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circle_posts
  SET likes_count = likes_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to increment comments count with search_path
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circle_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to decrement comments count with search_path
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circle_posts
  SET comments_count = comments_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate triggers
CREATE TRIGGER on_like_added
AFTER INSERT ON circle_post_likes
FOR EACH ROW
EXECUTE FUNCTION increment_post_likes();

CREATE TRIGGER on_like_removed
AFTER DELETE ON circle_post_likes
FOR EACH ROW
EXECUTE FUNCTION decrement_post_likes();

CREATE TRIGGER on_comment_added
AFTER INSERT ON circle_post_comments
FOR EACH ROW
EXECUTE FUNCTION increment_post_comments();

CREATE TRIGGER on_comment_removed
AFTER DELETE ON circle_post_comments
FOR EACH ROW
EXECUTE FUNCTION decrement_post_comments();