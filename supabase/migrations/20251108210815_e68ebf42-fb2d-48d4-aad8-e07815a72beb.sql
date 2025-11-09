-- Create function to increment likes count
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circle_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circle_posts
  SET likes_count = likes_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment comments count
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circle_posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE circle_posts
  SET comments_count = comments_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like insert
CREATE TRIGGER on_like_added
AFTER INSERT ON circle_post_likes
FOR EACH ROW
EXECUTE FUNCTION increment_post_likes();

-- Create trigger for like delete
CREATE TRIGGER on_like_removed
AFTER DELETE ON circle_post_likes
FOR EACH ROW
EXECUTE FUNCTION decrement_post_likes();

-- Create trigger for comment insert
CREATE TRIGGER on_comment_added
AFTER INSERT ON circle_post_comments
FOR EACH ROW
EXECUTE FUNCTION increment_post_comments();

-- Create trigger for comment delete
CREATE TRIGGER on_comment_removed
AFTER DELETE ON circle_post_comments
FOR EACH ROW
EXECUTE FUNCTION decrement_post_comments();