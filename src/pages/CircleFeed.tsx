import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, Heart, MessageCircle, Share2, Image as ImageIcon, Send, X, TrendingUp, Clock, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  user_id: string;
  username: string;
  caption: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  isLiked?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  comment: string;
  created_at: string;
}

interface Circle {
  id: string;
  name: string;
  icon: string;
  members: number;
  postsCount?: number;
}

export default function CircleFeed() {
  const { circleId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCaption, setNewCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedPostComments, setSelectedPostComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (circleId && session) {
      fetchCircleDetails();
      fetchPosts();

      // Subscribe to realtime updates
      const postsChannel = supabase
        .channel('circle_posts_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'circle_posts',
            filter: `circle_id=eq.${circleId}`,
          },
          () => {
            fetchPosts();
          }
        )
        .subscribe();

      const likesChannel = supabase
        .channel('circle_post_likes_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'circle_post_likes',
          },
          () => {
            fetchPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(postsChannel);
        supabase.removeChannel(likesChannel);
      };
    }
  }, [circleId, session, sortBy]);

  const fetchCircleDetails = async () => {
    try {
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('id, name, icon')
        .eq('id', circleId)
        .single();

      if (circleError) throw circleError;

      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId);

      const { count: postsCount } = await supabase
        .from('circle_posts')
        .select('*', { count: 'exact', head: true })
        .eq('circle_id', circleId);

      setCircle({
        ...circleData,
        members: members?.length || 0,
        postsCount: postsCount || 0,
      });
    } catch (error: any) {
      toast.error('Failed to load circle details');
      console.error(error);
    }
  };

  const fetchPosts = async () => {
    if (!session) return;

    try {
      const orderBy = sortBy === 'recent' ? 'created_at' : 'likes_count';
      
      const { data: postsData, error: postsError } = await supabase
        .from('circle_posts')
        .select('*')
        .eq('circle_id', circleId)
        .order(orderBy, { ascending: false });

      if (postsError) throw postsError;

      // Check which posts the user has liked
      const { data: likesData } = await supabase
        .from('circle_post_likes')
        .select('post_id')
        .eq('user_id', session.user.id)
        .in('post_id', postsData.map(p => p.id));

      const likedPostIds = new Set(likesData?.map(l => l.post_id) || []);

      setPosts(
        postsData.map(post => ({
          ...post,
          isLiked: likedPostIds.has(post.id),
        }))
      );
    } catch (error: any) {
      toast.error('Failed to load posts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async () => {
    // Validation: must have caption OR image
    if (!session) {
      toast.error('Please sign in to post');
      return;
    }

    if (!newCaption.trim() && !selectedImage) {
      toast.error('⚠️ Please add text or image to create a post.');
      return;
    }

    setIsPosting(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('circle-posts')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('circle-posts')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Get username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', session.user.id)
        .single();

      // Create post
      const { error: postError } = await supabase
        .from('circle_posts')
        .insert({
          circle_id: circleId,
          user_id: session.user.id,
          username: profile?.username || 'Anonymous',
          caption: newCaption || '',
          image_url: imageUrl,
        });

      if (postError) throw postError;

      toast.success('✅ Post created successfully!');
      setNewCaption('');
      setSelectedImage(null);
      setImagePreview(null);
      fetchCircleDetails(); // Update post count
    } catch (error: any) {
      toast.error('Failed to create post');
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string, imageUrl: string | null) => {
    if (!session) return;

    try {
      // Delete image from storage if exists
      if (imageUrl) {
        const imagePath = imageUrl.split('/circle-posts/')[1];
        if (imagePath) {
          await supabase.storage
            .from('circle-posts')
            .remove([imagePath]);
        }
      }

      // Delete post
      const { error } = await supabase
        .from('circle_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post deleted');
      fetchCircleDetails(); // Update post count
    } catch (error: any) {
      toast.error('Failed to delete post');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleLikeToggle = async (postId: string, isLiked: boolean) => {
    if (!session) return;

    // Optimistically update UI
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !isLiked,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
            }
          : post
      )
    );

    try {
      if (isLiked) {
        await supabase
          .from('circle_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('circle_post_likes')
          .insert({
            post_id: postId,
            user_id: session.user.id,
          });
      }
    } catch (error: any) {
      toast.error('Failed to update like');
      // Revert on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: isLiked,
                likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1,
              }
            : post
        )
      );
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('circle_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);

      // Subscribe to realtime comment updates
      const commentsChannel = supabase
        .channel(`comments_${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'circle_post_comments',
            filter: `post_id=eq.${postId}`,
          },
          () => {
            fetchComments(postId);
          }
        )
        .subscribe();
    } catch (error: any) {
      toast.error('Failed to load comments');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!session || !newComment.trim()) return;

    // Optimistically update comment count
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      )
    );

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', session.user.id)
        .single();

      await supabase
        .from('circle_post_comments')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          username: profile?.username || 'Anonymous',
          comment: newComment,
        });

      setNewComment('');
      fetchComments(postId);
      toast.success('Comment added!');
    } catch (error: any) {
      toast.error('Failed to add comment');
      // Revert on error
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count - 1 }
            : post
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="glass-card border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/community')}
                variant="outline"
                className="border-electric/30"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold font-orbitron holographic-text">
                  {circle?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {circle?.members} members • {circle?.postsCount || 0} posts
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                onClick={() => setSortBy('recent')}
                size="sm"
                className={sortBy === 'recent' ? 'bg-gradient-nature' : ''}
              >
                <Clock size={16} className="mr-2" />
                Recent
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'outline'}
                onClick={() => setSortBy('popular')}
                size="sm"
                className={sortBy === 'popular' ? 'bg-gradient-nature' : ''}
              >
                <TrendingUp size={16} className="mr-2" />
                Popular
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Create Post Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 mb-8 shadow-card"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">✏️ Create Post</h2>
          
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mb-4 rounded-xl overflow-hidden"
            >
              <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
              <Button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
              >
                <X size={16} />
              </Button>
            </motion.div>
          )}

          {!imagePreview && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-8 mb-4 text-center transition-all
                ${isDragging 
                  ? 'border-neon bg-neon/10' 
                  : 'border-border/50 hover:border-electric/50'}
              `}
            >
              <Upload className={`mx-auto mb-2 ${isDragging ? 'text-neon' : 'text-muted-foreground'}`} size={32} />
              <p className="text-sm text-muted-foreground">
                Drag & drop an image here, or click below to select
              </p>
            </div>
          )}

          <Textarea
            placeholder="Share your climate action... 🌱 (Text or image required)"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            className="glass resize-none mb-4"
            rows={3}
          />

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-electric/30 hover:bg-electric/10"
            >
              <ImageIcon size={16} className="mr-2" />
              {selectedImage ? 'Change Photo' : 'Add Photo'}
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={isPosting || (!newCaption.trim() && !selectedImage)}
              className="bg-gradient-nature hover:shadow-elevated flex-1"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </motion.div>

        {/* Posts Feed */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {posts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  delay: idx * 0.05,
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                layout
              >
                <Card className="glass-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-shadow">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-gradient-nature flex items-center justify-center">
                        <span className="text-background font-bold">
                          {post.username.charAt(0).toUpperCase()}
                        </span>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{post.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {session?.user.id === post.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id, post.image_url)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>

                  {/* Post Image */}
                  {post.image_url && (
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={post.image_url}
                      alt="Post"
                      className="w-full h-80 object-cover rounded-xl mb-4"
                    />
                  )}

                  {/* Post Caption */}
                  {post.caption && (
                    <p className="text-foreground mb-4 whitespace-pre-wrap">{post.caption}</p>
                  )}

                  {/* Interaction Buttons */}
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeToggle(post.id, post.isLiked || false)}
                        className={post.isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}
                      >
                        <motion.div
                          animate={post.isLiked ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Heart
                            size={20}
                            className={post.isLiked ? 'fill-red-500' : ''}
                          />
                        </motion.div>
                        <span className="ml-2">{post.likes_count}</span>
                      </Button>
                    </motion.div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedPostComments === post.id) {
                          setSelectedPostComments(null);
                        } else {
                          setSelectedPostComments(post.id);
                          fetchComments(post.id);
                        }
                      }}
                      className={selectedPostComments === post.id ? 'text-electric' : ''}
                    >
                      <MessageCircle size={20} />
                      <span className="ml-2">{post.comments_count}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + `/circle/${circleId}`);
                        toast.success('Link copied to clipboard!');
                      }}
                    >
                      <Share2 size={20} />
                    </Button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {selectedPostComments === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border/50 pt-4 space-y-3"
                      >
                        {comments.length > 0 ? (
                          <AnimatePresence>
                            {comments.map((comment, commentIdx) => (
                              <motion.div 
                                key={comment.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: commentIdx * 0.05 }}
                                className="flex gap-3"
                              >
                                <Avatar className="w-8 h-8 bg-gradient-nature flex items-center justify-center flex-shrink-0">
                                  <span className="text-background text-xs font-bold">
                                    {comment.username.charAt(0).toUpperCase()}
                                  </span>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-semibold text-foreground">{comment.username}</span>{' '}
                                    <span className="text-foreground">{comment.comment}</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No comments yet. Be the first to comment!
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Input
                            placeholder="Add a comment... 💬"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="glass flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newComment.trim()) {
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <Button
                            onClick={() => handleAddComment(post.id)}
                            size="sm"
                            disabled={!newComment.trim()}
                            className="bg-gradient-nature"
                          >
                            <Send size={16} />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No posts yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}