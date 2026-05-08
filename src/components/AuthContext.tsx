import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const userRef = doc(db, 'users', user.uid);
        const adminRef = doc(db, 'admins', user.uid);
        
        try {
          const [userSnap, adminSnap] = await Promise.all([
            getDoc(userRef),
            getDoc(adminRef)
          ]);

          setIsAdmin(adminSnap.exists());

          if (userSnap.exists()) {
            setProfile(userSnap.data());
          } else {
            const newProfile = {
              username: user.displayName || 'Chase',
              email: user.email,
              avatar_url: user.photoURL,
              streak_count: 0,
              created_at: serverTimestamp(),
              last_active: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching profile or admin status:", error);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    await loginWithGoogle();
  };

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, profile, isAdmin, signIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
