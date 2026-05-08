import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getSolarTimes, getSunPosition } from '../lib/sun';
import { format, differenceInSeconds } from 'date-fns';
import { Sun, Moon, MapPin, Clock, Thermometer } from 'lucide-react';

interface SunTrackerProps {
  location: { latitude: number; longitude: number };
  weather: any;
  qualityScore: number;
}

export function SunTracker({ location, weather, qualityScore }: SunTrackerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const times = useMemo(() => getSolarTimes(now, location.latitude, location.longitude), [now, location]);
  const position = useMemo(() => getSunPosition(now, location.latitude, location.longitude), [now, location]);

  const countdown = useMemo(() => {
    const diff = differenceInSeconds(times.sunset, now);
    if (diff < 0) return "Sunset passed";
    
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  }, [now, times]);

  const isGoldenHour = useMemo(() => {
    return now >= times.goldenHour && now <= times.goldenHourEnd;
  }, [now, times]);

  // Calculate sun position on the arc (for visual representation)
  // We'll map the solar altitude to a 0-180 degree arc
  // Altitude < 0 means it's below horizon
  const arcProgress = useMemo(() => {
    // Total day duration in degrees roughly maps to altitude
    // But for a simple UI arc, let's map current time between sunrise and sunset
    const start = times.sunrise.getTime();
    const end = times.sunset.getTime();
    const current = now.getTime();
    
    if (current < start) return 0;
    if (current > end) return 100;
    
    return ((current - start) / (end - start)) * 100;
  }, [now, times]);

  return (
    <div className="space-y-6">
      {/* Demo Mode Badge */}
      {weather?.isSimulated && (
        <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold text-stone-500 uppercase tracking-widest inline-flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-stone-700" />
          Demo Mode (Simulated Data)
        </div>
      )}

      {/* Golden Hour Alert */}
      {isGoldenHour && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sunset-deep/20 border border-sunset-deep/50 text-sunset-deep px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md"
        >
          <div className="w-2 h-2 rounded-full bg-sunset-deep animate-pulse" />
          <span className="font-medium tracking-tight">Golden Hour is happening now!</span>
        </motion.div>
      )}

      {/* Main Tracker Card */}
      <div className="glass-card p-8 overflow-hidden relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sunset-deep/10 blur-[100px] pointer-events-none" />

        <div className="flex flex-col items-center text-center relative z-10">
          <span className="text-stone-400 text-sm font-medium uppercase tracking-widest mb-1">Countdown to Sunset</span>
          <h2 className="text-5xl font-serif font-black text-glow tabular-nums mb-8">
            {countdown}
          </h2>

          {/* Sun Arc */}
          <div className="w-full h-40 relative mb-8">
            {/* The Arc Line */}
            <svg viewBox="0 0 400 200" className="w-full h-full stroke-stone-800 fill-none overflow-visible">
              <path 
                d="M 50,150 A 150,150 0 0,1 350,150" 
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* Sun on the arc */}
              <motion.g
                animate={{ 
                  x: 50 + (300 * arcProgress / 100),
                  y: 150 - Math.sin((arcProgress / 100) * Math.PI) * 150
                }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <circle r="12" className="fill-sunset-amber blur-sm" />
                <circle r="6" className="fill-sunset-gold" />
                <Sun className="w-4 h-4 text-white -translate-x-2 -translate-y-2" />
              </motion.g>
            </svg>
            
            {/* Horizon Line */}
            <div className="absolute bottom-10 left-0 right-0 h-[1px] bg-white/10" />
            
            {/* Time markers */}
            <div className="absolute bottom-2 left-12 text-[10px] text-stone-500 uppercase tracking-widest">
              {format(times.sunrise, 'h:mm a')}
            </div>
            <div className="absolute bottom-2 right-12 text-[10px] text-stone-500 uppercase tracking-widest">
              {format(times.sunset, 'h:mm a')}
            </div>
          </div>

          {/* Quality Score Circle */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-sunset-deep/20 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-sunset-deep" />
                </div>
                <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Quality</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-serif font-bold">{qualityScore}%</span>
                <span className="text-xs text-sunset-amber font-medium">EPIC</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Feels Like</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-serif font-bold">{Math.round(weather?.feels_like || 0)}°</span>
                <span className="text-xs text-stone-500">C</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <Clock className="w-4 h-4 mx-auto mb-2 text-stone-500" />
          <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Sunrise</div>
          <div className="text-sm font-bold">{format(times.sunrise, 'h:mm')}</div>
        </div>
        <div className="glass-card p-4 text-center border-sunset-amber/30">
          <Sun className="w-4 h-4 mx-auto mb-2 text-sunset-amber" />
          <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Golden</div>
          <div className="text-sm font-bold">{format(times.goldenHour, 'h:mm')}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <Moon className="w-4 h-4 mx-auto mb-2 text-stone-500" />
          <div className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Sunset</div>
          <div className="text-sm font-bold">{format(times.sunset, 'h:mm')}</div>
        </div>
      </div>
    </div>
  );
}
