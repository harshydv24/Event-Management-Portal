import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/config/firebase';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
} from '@/services/authService';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role: UserRole, uid?: string) => Promise<boolean>;
  logout: () => void;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Listen for Firebase Auth state changes (handles refresh / session persistence)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(profile);
          setIsEmailVerified(firebaseUser.emailVerified);
        } catch {
          setUser(null);
          setIsEmailVerified(false);
        }
      } else {
        setUser(null);
        setIsEmailVerified(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const loggedInUser = await loginUser(email, password, role);
      setUser(loggedInUser);
      setIsEmailVerified(auth.currentUser?.emailVerified || false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    uid?: string,
  ): Promise<boolean> => {
    try {
      const newUser = await registerUser(email, password, name, role, uid);
      setUser(newUser);
      setIsEmailVerified(false); // New signup is never verified yet
      return true;
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      console.error('Signup failed:', firebaseError.code, firebaseError.message);
      throw firebaseError;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsEmailVerified(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      setIsEmailVerified(verified);
      return verified;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isEmailVerified,
      login,
      signup,
      logout,
      resendVerificationEmail,
      refreshVerificationStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};