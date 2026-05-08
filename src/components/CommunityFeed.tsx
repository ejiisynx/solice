import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Send, Sparkles, Image as ImageIcon, X, MapPin, Search, Edit2, Save, Undo } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { GoogleGenAI } from "@google/genai";

interface Post {
  id: string;
  user_id: string;
  username: string;
  photo_url: string;
  caption: string;
  is_ai_caption: boolean;
  mood: string;
  location_name: string;
  likes_count: number;
  created_at: any;
}

export function CommunityFeed() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [newPost, setNewPost] = useState({ photo_url: '', caption: '', location: '' });
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Post));
      setPosts(fetchedPosts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return unsubscribe;
  }, []);

  const handleLike = async (postId: string, currentLikes: number) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
    
    // For simplicity in MVP, we just increment. 
    // In real app, we check if already liked.
    await updateDoc(postRef, {
      likes_count: increment(1)
    });
    await setDoc(likeRef, {
      user_id: user.uid,
      created_at: serverTimestamp()
    });
  };

  const handleUpdatePost = async (postId: string) => {
    if (!user || isUpdating) return;
    setIsUpdating(true);
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        caption: editCaption,
        updated_at: serverTimestamp() // Optional: add updated_at field
      });
      setEditingPostId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const generateAICaption = async () => {
    setIsAIGenerating(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined");
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a poetic sunset caption writer for Golden Hour Finder. Write ONE caption (max 20 words, 1-2 sentences). Vary between lyrical, punchy, and warm tones. Return ONLY the caption. No hashtags. No quotation marks.",
        },
        contents: "Write a caption for a beautiful sunset I just took a photo of."
      });
      
      if (response.text) {
        setNewPost(prev => ({ ...prev, caption: response.text || '' }));
      }
    } catch (error) {
      console.error("AI Generation error:", error);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      const postData = {
        user_id: user.uid,
        username: profile.username,
        photo_url: newPost.photo_url || `https://images.unsplash.com/photo-1472120482482-d42104454e7e?auto=format&fit=crop&q=80&w=800`, // Placeholder
        caption: newPost.caption,
        is_ai_caption: true, // For now we flag it if generated
        location_name: newPost.location || 'Unknown Spot',
        likes_count: 0,
        comments_count: 0,
        quality_score: 85,
        created_at: serverTimestamp(),
      };

      await addDoc(collection(db, 'posts'), postData);
      setNewPost({ photo_url: '', caption: '', location: '' });
      setIsComposing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  const filteredPosts = posts.filter(post => 
    post.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-black text-stone-100">Community</h2>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsComposing(true)}
          className="w-10 h-10 bg-sunset-deep rounded-full flex items-center justify-center text-white shadow-lg shadow-sunset-deep/20"
        >
          <Send className="w-5 h-5 -rotate-45" />
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input 
          type="text"
          placeholder="Search for users or captions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-sunset-amber/50 transition-colors"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-full"
          >
            <X className="w-3 h-3 text-stone-500" />
          </button>
        )}
      </div>

      {/* Post Composer View */}
      <AnimatePresence>
        {isComposing && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-50 bg-sunset-bg p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setIsComposing(false)} className="p-2"><X /></button>
              <h3 className="font-serif font-bold text-xl">New Post</h3>
              <button 
                onClick={handleSubmitPost}
                className="bg-sunset-deep px-6 py-2 rounded-full text-sm font-bold"
              >
                Share
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pb-8">
              <div className="aspect-square rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-stone-500 overflow-hidden relative">
                {newPost.photo_url ? (
                  <img src={newPost.photo_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Select Photo</span>
                    <input 
                      type="text" 
                      placeholder="Paste image URL for demo..." 
                      className="mt-4 px-4 py-2 bg-white/10 rounded-full text-xs w-3/4 text-center focus:outline-none"
                      onChange={(e) => setNewPost(prev => ({ ...prev, photo_url: e.target.value }))}
                    />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Caption</label>
                  <button 
                    onClick={generateAICaption}
                    disabled={isAIGenerating}
                    className="flex items-center gap-1 text-[10px] text-sunset-amber uppercase tracking-widest font-bold disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    {isAIGenerating ? 'Writing...' : 'AI Caption'}
                  </button>
                </div>
                <textarea 
                  value={newPost.caption}
                  onChange={(e) => setNewPost(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Capture the feeling..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm min-h-[100px] focus:outline-none focus:border-sunset-amber/50 transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input 
                    type="text"
                    placeholder="Where are you?"
                    value={newPost.location}
                    onChange={(e) => setNewPost(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-sunset-amber/50"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed List */}
      <div className="space-y-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, idx) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card overflow-hidden"
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sunset-deep/20 flex items-center justify-center text-[10px] font-bold text-sunset-deep">
                  {post.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-stone-100">{post.username}</div>
                  <div className="text-[10px] text-stone-500 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    {post.location_name}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] text-stone-600 font-medium">
                    {post.created_at?.seconds ? formatDistanceToNow(new Date(post.created_at.seconds * 1000)) + ' ago' : 'Just now'}
                  </div>
                  {user?.uid === post.user_id && !editingPostId && (
                    <button 
                      onClick={() => {
                        setEditingPostId(post.id);
                        setEditCaption(post.caption);
                      }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-stone-500 hover:text-sunset-amber transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="aspect-square w-full bg-stone-900 border-y border-white/5">
                <img src={post.photo_url} alt="Sunset" className="w-full h-full object-cover" />
              </div>

              <div className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <button 
                    onClick={() => handleLike(post.id, post.likes_count)}
                    className="flex items-center gap-1.5 group"
                  >
                    <Heart className="w-6 h-6 text-stone-400 group-active:scale-125 group-active:text-sunset-deep transition-transform" />
                    <span className="text-sm font-bold text-stone-400">{post.likes_count}</span>
                  </button>
                  <button className="flex items-center gap-1.5">
                    <MessageCircle className="w-6 h-6 text-stone-400" />
                    <span className="text-sm font-bold text-stone-400">0</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editingPostId === post.id ? (
                    <div className="space-y-3">
                      <textarea 
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="w-full bg-white/5 border border-sunset-amber/30 rounded-xl p-3 text-sm text-stone-200 focus:outline-none focus:border-sunset-amber/60 resize-none min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleUpdatePost(post.id)}
                          disabled={isUpdating}
                          className="flex-1 bg-sunset-deep text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button 
                          onClick={() => setEditingPostId(null)}
                          className="px-4 bg-white/5 text-stone-400 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10"
                        >
                          <Undo className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-300 leading-relaxed italic">
                      {post.is_ai_caption && (
                        <span className="inline-flex items-center gap-1 bg-sunset-amber/10 text-sunset-amber text-[8px] font-black px-1.5 py-0.5 rounded mr-2 uppercase tracking-tighter">
                          <Sparkles className="w-2 h-2" /> AI
                        </span>
                      )}
                      "{post.caption}"
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-600">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-stone-500 font-serif italic text-lg">No posts found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
