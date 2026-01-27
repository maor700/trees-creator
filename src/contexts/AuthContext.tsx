import React, { createContext, useContext } from 'react';
import { useObservable } from 'dexie-react-hooks';
import { treesDB } from '../models/treesDb';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use Dexie Cloud's observable for current user
  const currentUser = useObservable(treesDB.cloud.currentUser);

  // Dexie Cloud handles loading state internally
  const loading = !currentUser;

  const user = currentUser?.userId ? {
    id: currentUser.userId,
    email: currentUser.email,
  } : null;

  const login = async () => {
    // Opens Dexie Cloud's auth popup
    await treesDB.cloud.login();
  };

  const logout = async () => {
    await treesDB.cloud.logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
