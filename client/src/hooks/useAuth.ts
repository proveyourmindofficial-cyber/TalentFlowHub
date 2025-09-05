import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { activityTracker } from '../services/activityTracker';

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
  // Initialize state immediately with localStorage data to prevent auth loss during HMR
  const [user, setUser] = useState<User | null>(() => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Initial auth check failed:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      return null;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false); // No loading needed since we initialize immediately

  useEffect(() => {
    // Double-check auth status on mount (for edge cases)
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        // Validate the session with the server before trusting localStorage
        try {
          const response = await fetch('/api/user/permissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            // Session is valid, use cached user data
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            activityTracker.setUser(parsedUser.id);
            console.log('✅ Session validated successfully');
          } else {
            // Session is invalid, clear cached data
            console.log('❌ Session validation failed, clearing cached auth data');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setUser(null);
          }
        } catch (validateError) {
          // Network error or server unavailable, clear auth data to be safe
          console.log('❌ Session validation error, clearing cached auth data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User, token: string) => {
    console.log('Login called with:', userData, token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    
    // Start activity tracking for this user
    activityTracker.setUser(userData.id);
  };

  const logout = () => {
    // Clear activity tracking before logout
    activityTracker.clearUser();
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const refreshPermissions = async () => {
    // Force re-fetch of user permissions
    if (user) {
      try {
        // Clear cached permissions and re-fetch
        const response = await fetch('/api/user/permissions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (response.ok) {
          console.log('🔄 Permissions refreshed successfully');
          // Force page reload to apply new permissions
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to refresh permissions:', error);
      }
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshPermissions
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

// Simple invitation-based access for new users
export const requestAccess = async () => {
  const email = prompt('Enter your email address to request access:');
  
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  alert('Access requests are handled by administrators. Please contact your system administrator to get an invitation email with setup instructions.');
};