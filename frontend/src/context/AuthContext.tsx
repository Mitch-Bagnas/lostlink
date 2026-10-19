import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  upgradeToPremium: (paymentMethod?: string) => Promise<void>;
  downgradeToFree: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await apiClient<{ user: User }>('/auth/me', { skipAuthRedirect: true });
      setUser(data.user);
    } catch (err) {
      // 401 or no active session: user remains null
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiClient<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRedirect: true,
    });
    setUser(data.user);
    return data.user;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<User> => {
    const data = await apiClient<{ user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
      skipAuthRedirect: true,
    });
    setUser(data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', { method: 'POST', skipAuthRedirect: true });
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (user) {
      setUser({ ...user, must_change_password: false });
    }
  };

  const upgradeToPremium = async (paymentMethod = 'gcash'): Promise<void> => {
    const data = await apiClient<{ user: User }>('/users/me/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan: 'monthly_50php', paymentMethod }),
    });
    setUser(data.user);
  };

  const downgradeToFree = async (): Promise<void> => {
    const data = await apiClient<{ user: User }>('/users/me/downgrade', {
      method: 'POST',
    });
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        changePassword,
        upgradeToPremium,
        downgradeToFree,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
