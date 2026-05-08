import React from 'react';
import { motion } from 'motion/react';
import { format, addDays } from 'date-fns';
import { calculateQualityScore } from '../lib/sun';
import { Sun, Cloud, CloudRain, Star } from 'lucide-react';

interface ForecastStripProps {
  forecast: any[];
  location: { latitude: number; longitude: number };
}

export function ForecastStrip({ forecast, location }: ForecastStripProps) {
  // Aggregate forecast into days (approx 12:00 or 18:00 snapshots)
  const dailyForecast = React.useMemo(() => {
    if (!forecast || forecast.length === 0) return [];
    
    const days: any[] = [];
    const seenDays = new Set();
    
    forecast.forEach(item => {
      const dateStr = format(new Date(item.dt * 1000), 'yyyy-MM-dd');
      // We prefer the snapshot closest to evening (18:00) for sunset prediction
      const hour = new Date(item.dt * 1000).getHours();
      
      if (!seenDays.has(dateStr) && (hour >= 15 || !days.some(d => format(new Date(d.dt * 1000), 'yyyy-MM-dd') === dateStr))) {
        const score = calculateQualityScore(item.clouds, item.humidity, item.visibility);
        days.push({ ...item, score });
        seenDays.add(dateStr);
      }
    });

    return days.slice(0, 7);
  }, [forecast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-stone-100 font-serif font-bold text-xl">Weekly Forecast</h3>
        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Next 7 Days</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 px-2 scrollbar-none">
        {dailyForecast.map((day, idx) => (
          <motion.div
            key={day.dt}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex-shrink-0 w-24 p-4 rounded-3xl text-center space-y-3 transition-colors ${
              day.score >= 80 ? 'bg-sunset-deep/20 border border-sunset-deep/30' : 'bg-white/5 border border-white/5'
            }`}
          >
            <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">
              {idx === 0 ? 'Today' : format(new Date(day.dt * 1000), 'EEE')}
            </div>
            
            <div className="flex justify-center">
              {day.score >= 80 ? (
                <Star className="w-6 h-6 text-sunset-gold fill-sunset-gold" />
              ) : day.clouds > 80 ? (
                <CloudRain className="w-6 h-6 text-stone-500" />
              ) : day.clouds > 30 ? (
                <Cloud className="w-6 h-6 text-stone-400" />
              ) : (
                <Sun className="w-6 h-6 text-sunset-amber" />
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xl font-serif font-bold">{day.score}%</div>
              <div className="w-12 h-1 mx-auto bg-stone-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${day.score >= 80 ? 'bg-sunset-deep' : 'bg-stone-500'}`} 
                  style={{ width: `${day.score}%` }} 
                />
              </div>
            </div>

            {day.score >= 80 && (
              <div className="text-[9px] text-sunset-deep font-black uppercase tracking-tighter">Best Day</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
