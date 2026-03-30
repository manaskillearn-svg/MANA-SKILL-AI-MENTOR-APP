import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, ThumbsUp, Send, User, Clock, Plus, X, Search, Filter, MessageCircle } from 'lucide-react';
import { UserProfile, ForumPost, ForumComment } from '../types';
import { db, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, where } from '../firebase';

interface CommunityProps {
  user: UserProfile;
}

export default function Community({ user }: CommunityProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('General');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'General', 'Success Stories', 'Questions', 'Tips & Tricks', 'Earning Proofs'];

  useEffect(() => {
    const unsubPosts = onSnapshot(
      query(collection(db, 'forumPosts'), orderBy('timestamp', 'desc')),
      (snap) => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumPost)));
      }
    );
    return () => unsubPosts();
  }, []);

  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }
    const unsubComments = onSnapshot(
      query(collection(db, `forumPosts/${selectedPost.id}/comments`), orderBy('timestamp', 'asc')),
      (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumComment)));
      }
    );
    return () => unsubComments();
  }, [selectedPost]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle || !newPostContent) return;

    try {
      await addDoc(collection(db, 'forumPosts'), {
        uid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        likes: [],
        commentCount: 0,
        timestamp: serverTimestamp()
      });
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPost(false);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    const postRef = doc(db, 'forumPosts', postId);
    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment) return;

    try {
      await addDoc(collection(db, `forumPosts/${selectedPost.id}/comments`), {
        postId: selectedPost.id,
        uid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content: newComment,
        timestamp: serverTimestamp()
      });
      
      // Update comment count on post
      await updateDoc(doc(db, 'forumPosts', selectedPost.id), {
        commentCount: (selectedPost.commentCount || 0) + 1
      });

      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold text-slate-900 flex items-center">
            <MessageSquare className="text-emerald-500 mr-3" size={36} />
            Community Hub
          </h2>
          <p className="text-slate-500">Connect, share, and grow with fellow learners</p>
        </div>
        <button 
          onClick={() => setShowNewPost(true)}
          className="bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2"
        >
          <Plus size={20} />
          <span>Start a Discussion</span>
        </button>
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-4 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                activeCategory === cat 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPosts.map((post) => {
          const isLiked = post.likes?.includes(user.uid);
          return (
            <motion.div 
              key={post.id}
              layout
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="p-8 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={post.authorPhoto} 
                      alt={post.authorName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{post.authorName}</p>
                      <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock size={10} className="mr-1" />
                        {post.timestamp?.toDate ? new Date(post.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                        <span className="mx-2">•</span>
                        <span className="text-emerald-600">{post.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="cursor-pointer" onClick={() => setSelectedPost(post)}>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2">{post.title}</h3>
                    <p className="text-slate-600 line-clamp-3 leading-relaxed">{post.content}</p>
                  </div>

                  <div className="flex items-center space-x-6 pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => handleLikePost(post.id, isLiked)}
                      className={`flex items-center space-x-2 transition-colors ${isLiked ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
                    >
                      <ThumbsUp size={18} className={isLiked ? 'fill-current' : ''} />
                      <span className="text-sm font-bold">{post.likes?.length || 0}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center space-x-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span className="text-sm font-bold">{post.commentCount || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <MessageSquare size={48} className="mx-auto mb-4 text-slate-200" />
            <h3 className="text-xl font-bold text-slate-900">No discussions found</h3>
            <p className="text-slate-500">Be the first to start a conversation!</p>
          </div>
        )}
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPost && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900">Start Discussion</h3>
                    <p className="text-slate-500">Share your thoughts with the community</p>
                  </div>
                  <button 
                    onClick={() => setShowNewPost(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.filter(c => c !== 'All').map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewPostCategory(cat)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            newPostCategory === cat 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Title</label>
                    <input 
                      type="text" 
                      placeholder="What's on your mind?"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Content</label>
                    <textarea 
                      placeholder="Write your message here..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={6}
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center space-x-2"
                  >
                    <span>Post Discussion</span>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center space-x-3">
                  <img 
                    src={selectedPost.authorPhoto} 
                    alt={selectedPost.authorName}
                    className="w-10 h-10 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedPost.authorName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {selectedPost.timestamp?.toDate ? new Date(selectedPost.timestamp.toDate()).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {selectedPost.category}
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900 leading-tight">{selectedPost.title}</h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h4 className="font-bold text-slate-900 flex items-center">
                      <MessageCircle size={20} className="mr-2 text-blue-500" />
                      Comments ({comments.length})
                    </h4>
                  </div>

                  <div className="space-y-6">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex space-x-4">
                        <img 
                          src={comment.authorPhoto} 
                          alt={comment.authorName}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-none">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-slate-900 text-xs">{comment.authorName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {comment.timestamp?.toDate ? new Date(comment.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-8 text-slate-400 italic text-sm">
                        No comments yet. Start the conversation!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <form onSubmit={handleAddComment} className="flex space-x-3">
                  <input 
                    type="text" 
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-6 py-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                    required
                  />
                  <button 
                    type="submit"
                    className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
