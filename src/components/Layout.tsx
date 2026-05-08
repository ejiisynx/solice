import React from 'react';
import { motion } from 'motion/react';
import { Home, Map, Users, Book, Trophy, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user, signIn, profile, loading, isAdmin } = useAuth();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: Map, label: 'Spots' },
    { id: 'feed', icon: Users, label: 'Feed' },
    { id: 'journal', icon: Book, label: 'Journal' },
    ...(isAdmin ? [{ id: 'moderation', icon: ShieldCheck, label: 'Review' }] : []),
    { id: 'progress', icon: Trophy, label: 'More' },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-sunset-bg flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-sunset-deep blur-2xl"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-sunset-bg flex flex-col items-center justify-center p-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full bg-sunset-deep blur-[60px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <h1 className="text-5xl font-serif font-black text-stone-100 relative z-10 tracking-tight leading-none">
              Golden Hour<br/>Finder
            </h1>
          </div>
          <p className="text-stone-400 font-medium">Chase the light. Never miss the moment.</p>
        </div>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={signIn}
          className="w-full max-w-xs bg-sunset-deep text-white py-4 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-sunset-deep/20"
        >
          <LogIn className="w-5 h-5" />
          Continue with Google
        </motion.button>
        
        <div className="text-[10px] text-stone-600 uppercase tracking-widest font-black text-center">
          Experience every sunset.<br/>Join our community of chasers.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sunset-bg pb-24">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-sunset-bg/80 backdrop-blur-xl z-30 border-b border-white/5">
        <div className="font-serif font-black text-xl text-stone-100 tracking-tight">Golden Hour</div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Good Evening</div>
            <div className="text-xs font-bold text-stone-100 uppercase">{profile?.username || 'Chaser'}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-sunset-deep/10 border border-sunset-deep/20 flex items-center justify-center text-sunset-deep font-bold text-xs ring-2 ring-sunset-deep/5 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile?.username?.[0].toUpperCase()
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-lg mx-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 z-40">
        <div className="max-w-md mx-auto h-16 glass-card px-2 flex items-center justify-around shadow-2xl shadow-black/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${isActive ? 'text-sunset-amber' : 'text-stone-500'}`}
              >
                <div className={`relative p-2 rounded-2xl transition-colors ${isActive ? 'bg-sunset-amber/10' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'fill-sunset-amber/20' : ''}`} />
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sunset-amber"
                    />
                  )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
