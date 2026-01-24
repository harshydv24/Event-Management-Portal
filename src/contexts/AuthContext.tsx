import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role: UserRole, uid?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'eventPortal_users';
const SESSION_KEY = 'eventPortal_session';

const getStoredUsers = (): Record<string, User & { password: string }> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveUsers = (users: Record<string, User & { password: string }>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const parsedUser = JSON.parse(session);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    const users = getStoredUsers();
    const key = `${email.trim()}_${role}`;
    const storedUser = users[key];

    if (storedUser && storedUser.password === password.trim()) {
      const { password: _, ...userWithoutPassword } = storedUser;
      setUser(userWithoutPassword);
      localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    uid?: string,
    ): Promise<boolean> => {
    const users = getStoredUsers();
    const key = `${email.trim()}_${role}`;

    if (users[key]) {
      return false; // User already exists
    }

    const newUser: User & { password: string } = {
      id: crypto.randomUUID(),
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      role,
      uid: role === 'student' ? uid?.trim() : undefined,
      clubId: role === 'club' ? crypto.randomUUID() : undefined,
    };

    users[key] = newUser;
    saveUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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