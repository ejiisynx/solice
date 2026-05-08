import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Check, X, MapPin, AlertCircle, CheckSquare, Square, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PendingSpot {
  id: string;
  name: string;
  type: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  approved: boolean;
}

export function Moderation() {
  const [pendingSpots, setPendingSpots] = useState<PendingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'spots'), where('approved', '==', false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PendingSpot));
      setPendingSpots(fetched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'spots');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingSpots.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingSpots.map(s => s.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return;
    
    const batch = writeBatch(db);
    selectedIds.forEach((id) => {
      const spotRef = doc(db, 'spots', id);
      if (action === 'approve') {
        batch.update(spotRef, { approved: true });
      } else {
        batch.delete(spotRef);
      }
    });

    try {
      await batch.commit();
      setSelectedIds(new Set());
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'spots/bulk');
    }
  };

  const approveSpot = async (id: string) => {
    try {
      const spotRef = doc(db, 'spots', id);
      await updateDoc(spotRef, { approved: true });
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `spots/${id}`);
    }
  };

  const rejectSpot = async (id: string) => {
    try {
      const spotRef = doc(db, 'spots', id);
      await deleteDoc(spotRef);
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `spots/${id}`);
    }
  };

  if (pendingSpots.length === 0 && !loading) return null;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-sunset-amber" />
          <h2 className="text-xl font-serif font-black text-stone-100 uppercase tracking-tight">Pending Moderation</h2>
        </div>
        
        {pendingSpots.length > 0 && (
          <button 
            onClick={toggleSelectAll}
            className="text-[10px] uppercase font-black tracking-widest text-stone-500 hover:text-stone-300 flex items-center gap-2"
          >
            {selectedIds.size === pendingSpots.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selectedIds.size === pendingSpots.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky top-4 z-50 glass-card bg-sunset-deep/90 border-sunset-amber/40 p-4 flex items-center justify-between shadow-2xl backdrop-blur-xl"
          >
            <div className="text-xs font-bold text-white">
              {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkAction('reject')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-100 hover:bg-red-500 transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <Trash2 className="w-3 h-3" />
                Reject
              </button>
              <button 
                onClick={() => handleBulkAction('approve')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500 transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <CheckCircle2 className="w-3 h-3" />
                Approve
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <AnimatePresence>
          {pendingSpots.map((spot) => (
            <motion.div
              key={spot.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => toggleSelect(spot.id)}
              className={`glass-card p-5 space-y-4 border transition-colors cursor-pointer ${
                selectedIds.has(spot.id) ? 'border-sunset-amber bg-sunset-amber/10' : 'border-sunset-amber/20 bg-sunset-amber/5'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`mt-1 transition-colors ${selectedIds.has(spot.id) ? 'text-sunset-amber' : 'text-stone-700'}`}>
                    {selectedIds.has(spot.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-sunset-amber font-black uppercase tracking-widest">{spot.type}</div>
                    <h3 className="font-bold text-stone-100">{spot.name}</h3>
                    <div className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {spot.city} ({spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)})
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => approveSpot(spot.id)}
                    className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => rejectSpot(spot.id)}
                    className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-stone-400 italic">"{spot.description}"</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
