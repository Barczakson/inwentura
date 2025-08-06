'use client';

import { createContext, useContext, useState, useEffect, ReactNode, createElement } from 'react';
import { User } from '@/types/inwentura';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('inwentura_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('inwentura_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - in real app, this would call Firebase
    if (email && password.length >= 6) {
      const mockUser: User = {
        id: `user_${Date.now()}`,
        email,
        displayName: email.split('@')[0]
      };
      
      setUser(mockUser);
      localStorage.setItem('inwentura_user', JSON.stringify(mockUser));
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const register = async (email: string, password: string, name?: string): Promise<boolean> => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock registration - in real app, this would call Firebase
    if (email && password.length >= 6) {
      const mockUser: User = {
        id: `user_${Date.now()}`,
        email,
        displayName: name || email.split('@')[0]
      };
      
      setUser(mockUser);
      localStorage.setItem('inwentura_user', JSON.stringify(mockUser));
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('inwentura_user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return createElement(
    AuthContext.Provider,
    { value: value },
    children
  );
}