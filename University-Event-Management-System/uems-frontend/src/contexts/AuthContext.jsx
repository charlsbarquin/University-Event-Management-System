// uems-frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/auth';
import { toast } from 'react-hot-toast';

// Create context
const AuthContext = createContext();

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      // Set user from localStorage immediately for better UX
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
          localStorage.removeItem('user');
        }
      }
      
      // Only verify with server if we have a token
      if (token) {
        const result = await authService.getCurrentUser();
        
        if (result.success) {
          const updatedUser = result.data.user;
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Show role promotion toast if applicable
          const oldUser = storedUser ? JSON.parse(storedUser) : null;
          if (oldUser?.role === 'student' && updatedUser.role === 'organizer') {
            toast.success('Congratulations! You are now an Organizer!', {
              duration: 5000,
              icon: '🎉',
            });
          }
        } else {
          // Token might be expired, but keep localStorage data
          // Only clear if server explicitly says token is invalid
          if (result.message?.includes('Invalid token') || 
              result.message?.includes('No token') ||
              result.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
          // Otherwise, keep user logged in with stored data
        }
      } else {
        // No token, clear user
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Network error - keep user logged in with stored data
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
    
    // ✅ Optional: Set up periodic token refresh (every 10 minutes)
    const refreshInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        // Silently refresh auth status
        checkAuthStatus().catch(console.error);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(refreshInterval);
  }, [checkAuthStatus]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result.success) {
        setUser(result.data.user);
        toast.success(`Welcome back, ${result.data.user.firstName}!`, {
          duration: 3000,
          icon: '👋',
        });
      } else {
        toast.error(result.message || 'Login failed', {
          duration: 4000,
        });
      }
      return result;
    } catch (error) {
      toast.error('An error occurred during login', {
        duration: 4000,
      });
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await authService.register(userData);
      if (result.success) {
        setUser(result.data.user);
        toast.success('Registration successful! Welcome!', {
          duration: 4000,
          icon: '🎊',
        });
      } else {
        toast.error(result.message || 'Registration failed', {
          duration: 4000,
        });
      }
      return result;
    } catch (error) {
      toast.error('An error occurred during registration', {
        duration: 4000,
      });
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    const userName = user?.firstName || 'User';
    authService.logout();
    setUser(null);
    setAuthChecked(true);
    toast.success(`Goodbye, ${userName}! Come back soon!`, {
      duration: 3000,
      icon: '👋',
    });
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const getUserId = () => {
    if (!user) return null;
    return user._id || user.id;
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    authChecked,
    refreshAuth,
    getUserId,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isOrganizer: user?.role === 'organizer',
    isStudent: user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };