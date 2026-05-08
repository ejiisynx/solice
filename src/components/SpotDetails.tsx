import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Star, X, MessageSquare, Send, User, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface Review {
  id: string;
  user_id: string;
  username: string;
  rating: number;
  comment: string;
  created_at: any;
}

interface SpotDetailsProps {
  spot: {
    id: string;
    name: string;
    description: string;
    rating_avg: number;
    rating_count: number;
  };
  onClose: () => void;
}

export function SpotDetails({ spot, onClose }: SpotDetailsProps) {
  const spotId = spot.id;
  const spotName = spot.name;
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, `spots/${spotId}/reviews`),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
      setReviews(fetched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `spots/${spotId}/reviews`);
      setLoading(false);
    });

    return unsubscribe;
  }, [spotId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        const spotRef = doc(db, 'spots', spotId);
        const spotDoc = await transaction.get(spotRef);
        
        if (!spotDoc.exists()) {
          throw new Error("MOCK_SPOT_ERROR");
        }

        const data = spotDoc.data();
        const currentAvg = data.rating_avg || 0;
        const currentCount = data.rating_count || 0;
        
        const newCount = currentCount + 1;
        const newAvg = (currentAvg * currentCount + newRating) / newCount;

        // 1. Add review
        const reviewRef = doc(collection(db, `spots/${spotId}/reviews`));
        transaction.set(reviewRef, {
          user_id: user.uid,
          username: profile?.username || 'Explorer',
          rating: newRating,
          comment: newComment,
          created_at: serverTimestamp(),
        });

        // 2. Update spot
        transaction.update(spotRef, {
          rating_avg: Number(newAvg.toFixed(1)),
          rating_count: newCount
        });
      });

      setNewComment('');
      setNewRating(5);
    } catch (error: any) {
      if (error.message === "MOCK_SPOT_ERROR") {
        alert("This is a demo spot. Reviews are only enabled for community-submitted locations.");
      } else {
        handleFirestoreError(error, OperationType.WRITE, `spots/${spotId}/reviews`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
    >
      <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-stone-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sunset-gold/10 flex items-center justify-center text-sunset-gold shrink-0">
              <Sun className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-black text-stone-100">{spotName}</h3>
              <div className="flex items-center gap-2 mt-1">
              <div className="flex text-sunset-amber">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{reviews.length} Reviews</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Spot Description & Stats */}
          <div className="space-y-4">
            <p className="text-sm text-stone-300 leading-relaxed">
              {spot.description}
            </p>
            <div className="flex items-center gap-6 py-4 border-y border-white/5">
              <div className="text-center">
                <div className="text-2xl font-serif font-black text-sunset-gold">{spot.rating_avg}</div>
                <div className="text-[8px] text-stone-500 uppercase font-bold tracking-widest">Average Rating</div>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="text-center">
                <div className="text-2xl font-serif font-black text-stone-100">{spot.rating_count}</div>
                <div className="text-[8px] text-stone-500 uppercase font-bold tracking-widest">Total Reviews</div>
              </div>
            </div>
          </div>

          {/* Add Review Form */}
          {user && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-sunset-amber">Leave a Review</h4>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        newRating >= star ? 'bg-sunset-amber text-stone-900' : 'bg-white/5 text-stone-500 hover:bg-white/10'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${newRating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <textarea
                    placeholder="Tell others about your sunset experience..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm min-h-[100px] focus:outline-none focus:border-sunset-amber/50 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-sunset-deep py-3 rounded-2xl text-sm font-bold shadow-lg shadow-sunset-deep/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Posting...' : 'Share Review'}
                </button>
              </form>
            </div>
          )}

          {/* Review List */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">Recent Experiences</h4>
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-sunset-amber border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-sunset-deep/20 flex items-center justify-center text-sunset-deep">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-200">{review.username}</p>
                          <p className="text-[8px] text-stone-500 uppercase font-black uppercase tracking-widest">
                            {review.created_at?.seconds ? format(new Date(review.created_at.seconds * 1000), 'MMM d, yyyy') : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex text-sunset-amber">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-xs text-stone-400 italic leading-relaxed">"{review.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-stone-800 mx-auto mb-2" />
                <p className="text-xs text-stone-600">No reviews yet. Be the first to share!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
