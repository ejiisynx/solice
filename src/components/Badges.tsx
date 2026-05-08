import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Shield, Zap, Sparkles, Heart, Map as MapIcon, Users, Camera, Flame, Moon, Sun, Star } from 'lucide-react';

const BADGES = [
  { key: 'first_light', title: 'First Light', desc: 'Logged your first sunset', icon: Sun, color: 'text-amber-400' },
  { key: 'golden_chaser', title: 'Golden Chaser', desc: 'Experienced 5 golden hours', icon: Sparkles, color: 'text-yellow-400' },
  { key: '3_day_streak', title: '3-Day Streak', desc: '3 consecutive sunset logs', icon: Flame, color: 'text-orange-500' },
  { key: 'week_warrior', title: 'Week Warrior', desc: '7 consecutive sunset logs', icon: Shield, color: 'text-blue-400' },
  { key: 'storm_watcher', title: 'Storm Watcher', desc: 'Caught a sunset after rain', icon: Zap, color: 'text-purple-400' },
  { key: 'spot_hunter', title: 'Spot Hunter', desc: 'Visited 5 unique locations', icon: MapIcon, color: 'text-green-400' },
  { key: 'romantic', title: 'Romantic', desc: 'Shared 3 sunset posts', icon: Heart, color: 'text-pink-400' },
  { key: 'night_owl', title: 'Night Owl', desc: 'Logged 1 hour after sunset', icon: Moon, color: 'text-indigo-400' },
  { key: 'storyteller', title: 'Storyteller', desc: 'Used AI caption 5 times', icon: Users, color: 'text-teal-400' },
  { key: 'community_star', title: 'Community Star', desc: 'Get 50 total likes', icon: Star, color: 'text-red-400' },
  { key: 'sunrise_sender', title: 'Sunrise Sender', desc: 'Log one early morning', icon: Sun, color: 'text-orange-300' },
  { key: 'golden_legend', title: 'Golden Legend', desc: 'Reach 30 day streak', icon: Trophy, color: 'text-sunset-gold' },
];

export function Badges() {
  const earnedKeys = ['first_light', 'golden_chaser']; // Mock earned

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-black text-stone-100 mb-2">Achievements</h2>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-sunset-deep" style={{ width: `${(earnedKeys.length / BADGES.length) * 100}%` }} />
        </div>
        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-black">
          {earnedKeys.length} of {BADGES.length} Badges Earned
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {BADGES.map((badge, idx) => {
          const isEarned = earnedKeys.includes(badge.key);
          const Icon = badge.icon;
          
          return (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col items-center text-center space-y-2 group"
            >
              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isEarned 
                ? 'bg-white/10 shadow-lg shadow-black/20' 
                : 'bg-white/5 grayscale opacity-40'
              }`}>
                {isEarned && (
                  <motion.div 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border border-white/5 rounded-full"
                  />
                )}
                <Icon className={`w-8 h-8 ${isEarned ? badge.color : 'text-stone-500'}`} />
                
                {isEarned && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sunset-deep rounded-full flex items-center justify-center border-4 border-sunset-bg">
                    <Zap className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
                )}
              </div>
              <div>
                <div className={`text-[10px] font-black uppercase tracking-tight ${isEarned ? 'text-stone-100' : 'text-stone-600'}`}>
                  {badge.title}
                </div>
                <div className="text-[8px] text-stone-700 font-medium leading-tight max-w-[80px] mx-auto">
                  {isEarned ? 'UNLOCKED' : badge.desc}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
