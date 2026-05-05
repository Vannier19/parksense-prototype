import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock users database
  const mockUsers: Record<string, { password: string; user: User }> = {
    admin: {
      password: '12345678',
      user: {
        id: 'user-001',
        username: 'admin',
        email: 'admin@parksense.com',
        role: 'admin'
      }
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('parksense_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to load user from storage:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userRecord = mockUsers[username];
    
    if (!userRecord || userRecord.password !== password) {
      throw new Error('Invalid username or password');
    }

    setUser(userRecord.user);
    localStorage.setItem('parksense_user', JSON.stringify(userRecord.user));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('parksense_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
