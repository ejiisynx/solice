import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Filter, Search, Plus, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { SpotDetails } from './SpotDetails';

interface Spot {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  city: string;
  description: string;
  rating_avg: number;
  rating_count: number;
}

const MOCK_SPOTS: Spot[] = [
  {
    id: 's1',
    name: 'Sunset Cliffs Natural Park',
    type: 'Nature Park',
    latitude: 32.7214,
    longitude: -117.2562,
    city: 'San Diego',
    description: 'Rugged coastline with dramatic cliff views.',
    rating_avg: 4.9,
    rating_count: 1250,
  },
  {
    id: 's2',
    name: 'Griffith Observatory',
    type: 'Hilltop',
    latitude: 34.1184,
    longitude: -118.3004,
    city: 'Los Angeles',
    description: 'Iconic views over the city and Hollywood sign.',
    rating_avg: 4.8,
    rating_count: 5400,
  },
  {
    id: 's3',
    name: 'Santa Monica Pier',
    type: 'Beach',
    latitude: 34.0099,
    longitude: -118.496,
    city: 'Santa Monica',
    description: 'Classic California sunset over the Pacific.',
    rating_avg: 4.7,
    rating_count: 8900,
  }
];

export function SpotMap({ location }: { location: { latitude: number; longitude: number } | null }) {
  const [spots, setSpots] = useState<Spot[]>(MOCK_SPOTS);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [newSpot, setNewSpot] = useState({ 
    name: '', 
    type: 'Hilltop', 
    city: '', 
    description: '',
    latitude: location?.latitude || 0,
    longitude: location?.longitude || 0
  });

  useEffect(() => {
    const q = query(collection(db, 'spots'), where('approved', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSpots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Spot));
      setSpots([...MOCK_SPOTS, ...fetchedSpots]);
    }, (error) => {
      console.warn("Could not fetch spots from Firestore, using mock data");
    });

    return unsubscribe;
  }, []);

  const handleSubmitSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'spots'), {
        ...newSpot,
        approved: false,
        rating_avg: 0,
        rating_count: 0,
        latitude: Number(newSpot.latitude),
        longitude: Number(newSpot.longitude),
        created_at: serverTimestamp()
      });
      setIsSubmitting(false);
      setNewSpot({ name: '', type: 'Hilltop', city: '', description: '', latitude: location?.latitude || 0, longitude: location?.longitude || 0 });
      alert("Spot submitted! It will appear once approved by a moderator.");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'spots');
    }
  };

  const filteredSpots = spots.filter(spot => {
    const matchesFilter = filter === 'All' || spot.type === filter;
    const matchesSearch = spot.name.toLowerCase().includes(search.toLowerCase()) || spot.city.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {selectedSpotId && (
          <SpotDetails 
            spot={spots.find(s => s.id === selectedSpotId)!} 
            onClose={() => setSelectedSpotId(null)} 
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-serif font-black text-stone-100">Sunset Spots</h2>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSubmitting(true)}
            className="w-10 h-10 bg-sunset-deep rounded-full flex items-center justify-center text-white"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>
        
        {/* Search & Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['All', 'Hilltop', 'Beach', 'Promenade', 'Urban Rooftop', 'Nature Park'].map((btn) => (
            <button
              key={btn}
              onClick={() => setFilter(btn)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === btn 
                ? 'bg-sunset-deep text-white' 
                : 'bg-white/5 text-stone-400 border border-white/5'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input 
            type="text" 
            placeholder="Search by spot name or city..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-sunset-amber/50 transition-colors"
          />
        </div>
      </div>

      <AnimatePresence>
        {isSubmitting && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 gap-4 flex flex-col border-sunset-amber/30"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg">Suggest a Spot</h3>
              <button onClick={() => setIsSubmitting(false)}><X className="w-5 h-5 text-stone-500" /></button>
            </div>
            
            <form onSubmit={handleSubmitSpot} className="space-y-4">
              <input 
                type="text" 
                placeholder="Spot Name" 
                required
                value={newSpot.name}
                onChange={e => setNewSpot(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={newSpot.type}
                  onChange={e => setNewSpot(prev => ({ ...prev, type: e.target.value }))}
                  className="bg-stone-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-stone-100 focus:outline-none focus:border-sunset-amber/50 cursor-pointer"
                >
                  {['Hilltop', 'Beach', 'Promenade', 'Urban Rooftop', 'Nature Park'].map(t => (
                    <option key={t} value={t} className="bg-stone-900 text-stone-100">
                      {t}
                    </option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="City" 
                  required
                  value={newSpot.city}
                  onChange={e => setNewSpot(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none"
                />
              </div>
              <textarea 
                placeholder="Brief description..." 
                value={newSpot.description}
                onChange={e => setNewSpot(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none min-h-[80px]"
              />
              <button type="submit" className="w-full bg-sunset-deep py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Submit for Approval
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {filteredSpots.map((spot, idx) => (
          <motion.div
            key={spot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setSelectedSpotId(spot.id)}
            className="glass-card p-4 flex gap-4 items-start active:bg-white/10 transition-colors cursor-pointer group"
          >
            <div className="w-16 h-16 rounded-2xl bg-sunset-deep/10 flex-shrink-0 flex items-center justify-center text-sunset-deep group-hover:scale-105 transition-transform">
              <MapPin className="w-8 h-8" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-bold text-stone-100 truncate pr-2">{spot.name}</h4>
                <div className="flex items-center gap-1 text-sunset-gold font-bold text-xs shrink-0">
                  <Star className="w-3 h-3 fill-sunset-gold" />
                  {spot.rating_avg}
                </div>
              </div>
              
              <div className="text-xs text-stone-500 mb-2">{spot.city} • {spot.type}</div>
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-stone-600 uppercase tracking-widest font-bold">
                  {spot.rating_count} reviews
                </span>
                <button className="flex items-center gap-1 text-sunset-amber font-bold text-[10px] uppercase tracking-widest hover:underline">
                  <Navigation className="w-3 h-3" />
                  Directions
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
