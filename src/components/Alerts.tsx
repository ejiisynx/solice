import React, { useState } from 'react';
import { Bell, ShieldCheck, Clock, Sun, Users, BookMarked, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const ALERTS = [
  { id: 'gh', title: 'Golden Hour Alert', desc: 'Fires 60 min before sunset', icon: Sun, color: 'text-amber-400' },
  { id: 'qf', title: 'Quality Forecast', desc: 'When forecast is ≥ 80%', icon: Zap, color: 'text-sunset-gold' },
  { id: 'jr', title: 'Journal Reminder', desc: '15 min after today\'s sunset', icon: BookMarked, color: 'text-sunset-amber' },
  { id: 'fs', title: 'Friends\' Spots', desc: 'When someone nearby posts', icon: Users, color: 'text-blue-400' },
];

export function Alerts() {
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [activeAlerts, setActiveAlerts] = useState<string[]>(['gh', 'qf']);

  const requestPermission = async () => {
    const res = await Notification.requestPermission();
    setPermission(res);
  };

  const testNotification = (id: string) => {
    if (permission === 'granted') {
      const alert = ALERTS.find(a => a.id === id);
      setTimeout(() => {
        new Notification("Golden Hour Finder", {
          body: `Test: ${alert?.title} - ${alert?.desc}`,
          icon: "/favicon.ico"
        });
      }, 4000);
    } else {
      alert("Please enable notifications in your browser first");
    }
  };

  const toggleAlert = (id: string) => {
    setActiveAlerts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-serif font-black text-stone-100">Notification Center</h2>
        
        {permission !== 'granted' ? (
          <div className="bg-sunset-deep p-6 rounded-3xl space-y-4 shadow-xl shadow-sunset-deep/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white">Enable Notifications</h3>
                <p className="text-xs text-sunset-cream/80">Get real-time alerts for the perfect sunset moment.</p>
              </div>
            </div>
            <button 
              onClick={requestPermission}
              className="w-full bg-white text-sunset-deep py-3 rounded-2xl text-sm font-bold active:scale-95 transition-transform"
            >
              Grant Access
            </button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Notification Access Granted</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {ALERTS.map((alert) => {
          const isActive = activeAlerts.includes(alert.id);
          const Icon = alert.icon;
          
          return (
            <div key={alert.id} className="glass-card p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 ${isActive ? alert.color : 'text-stone-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-stone-100">{alert.title}</h4>
                  <p className="text-[10px] text-stone-500 font-medium uppercase tracking-widest">{alert.desc}</p>
                </div>
                <button 
                  onClick={() => toggleAlert(alert.id)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-sunset-deep' : 'bg-stone-800'}`}
                >
                  <motion.div 
                    animate={{ x: isActive ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-stone-600 font-bold uppercase tracking-tight">
                  <Clock className="w-3 h-3" />
                  Scheduled: {isActive ? '17:45 PM' : 'Disabled'}
                </div>
                <button 
                  onClick={() => testNotification(alert.id)}
                  className="text-[9px] font-black uppercase tracking-widest text-sunset-amber px-3 py-1 rounded-full border border-sunset-amber/20 hover:bg-sunset-amber/10 transition-colors"
                >
                  Test Alert
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
