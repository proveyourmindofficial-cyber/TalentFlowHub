import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User, token: string) => {
    console.log('Login called with:', userData, token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export logout function for components
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  window.location.reload();
};

// Simple Microsoft login using email verification
export const initiateO365Login = async () => {
  const email = prompt('Enter your Office 365 email address:');
  
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  try {
    const response = await fetch('/api/auth/microsoft-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      // Successful login - redirect to main app
      const userData = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.roleId || 'user',
        department: data.user.department
      };
      
      localStorage.setItem('authToken', 'microsoft-authenticated');
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Reload to trigger auth state update
      window.location.href = '/';
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Microsoft login error:', error);
    alert('Login failed. Please try again.');
  }
};