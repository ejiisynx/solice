import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Plus, Camera, Smile, Trash2, Calendar, X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  user_id: string;
  photo_url: string;
  caption: string;
  mood_emoji: string;
  quality_score: number;
  created_at: any;
}

export function Journal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ photo_url: '', caption: '', mood: '✨' });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'users', user.uid, 'journal'),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as JournalEntry));
      setEntries(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/journal`);
    });

    return unsubscribe;
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEntry = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'journal'), {
        user_id: user.uid,
        photo_url: selectedImage || `https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800`,
        caption: newEntry.caption,
        mood_emoji: newEntry.mood,
        quality_score: 88, // Mock quality based on time
        created_at: serverTimestamp(),
      });
      setIsAdding(false);
      setSelectedImage(null);
      setNewEntry({ photo_url: '', caption: '', mood: '✨' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'journal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-black text-stone-100">Journal</h2>
        <div className="flex items-center gap-2">
          <div className="glass-card px-3 py-1 text-[10px] font-bold text-sunset-amber uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sunset-amber animate-pulse" />
            {entries.length > 0 ? entries.length : 0} Day Streak
          </div>
        </div>
      </div>

      {!isAdding ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full h-32 glass-card border-dashed border-white/20 flex flex-col items-center justify-center gap-2 group hover:bg-white/10 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-stone-500 group-hover:text-sunset-amber transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Write Daily Entry</span>
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 space-y-6 overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl">New Entry</h3>
            <button onClick={() => setIsAdding(false)} className="p-2 text-stone-500 hover:text-stone-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Photo Upload Area */}
          <div className="relative aspect-video rounded-2xl bg-white/5 border border-white/10 overflow-hidden group">
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-500 hover:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest">
                  {isUploading ? 'Uploading...' : 'Add Sunset Photo'}
                </span>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              {['✨', '😌', '🌅', '📸', '🧘'].map(m => (
                <button 
                  key={m}
                  onClick={() => setNewEntry(prev => ({ ...prev, mood: m }))}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-colors ${newEntry.mood === m ? 'bg-sunset-deep/20 border border-sunset-deep/30' : 'bg-white/5'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <textarea 
              placeholder="Today's sunset felt like..."
              value={newEntry.caption}
              onChange={(e) => setNewEntry(prev => ({ ...prev, caption: e.target.value }))}
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm min-h-[120px] focus:outline-none focus:border-sunset-amber/50 transition-colors"
            />

            <button 
              onClick={handleAddEntry}
              className="w-full bg-sunset-deep py-4 rounded-2xl text-sm font-bold shadow-lg shadow-sunset-deep/20 active:scale-[0.98] transition-transform"
            >
              Save Daily Entry
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4">
        <AnimatePresence>
          {entries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-4 flex gap-4"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-900">
                <img src={entry.photo_url} alt="Journal" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 uppercase tracking-widest font-black mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {entry.created_at?.seconds ? format(new Date(entry.created_at.seconds * 1000), 'MMM d, yyyy') : 'Today'}
                    </span>
                    <span className="text-sm">{entry.mood_emoji}</span>
                  </div>
                  <p className="text-sm text-stone-300 line-clamp-2 italic">"{entry.caption}"</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-stone-600 font-bold uppercase tracking-tighter">Sunset Quality: {entry.quality_score}%</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && !isAdding && (
          <div className="text-center py-12 text-stone-600">
            <Book className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-serif">No entries yet. Start your journey today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
