import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin');

      if (!saved || saved === 'undefined' || saved === 'null') {
        return null;
      }

      return JSON.parse(saved);
    } catch (error) {
      console.error('Invalid saved admin data:', error);
      localStorage.removeItem('admin');
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token');

    if (!savedToken || savedToken === 'undefined' || savedToken === 'null') {
      return null;
    }

    return savedToken;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await authService.getCurrentUser();

          if (res.data && res.data.admin) {
            setUser(res.data.admin);
            localStorage.setItem(
              'admin',
              JSON.stringify(res.data.admin)
            );
          } else {
            logout();
          }
        } catch (err) {
          console.error('Authentication verification failed:', err);
          logout();
        }
      }

      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (username, password) => {
    const res = await authService.login(username, password);

    const { token: jwtToken, admin } = res.data;

    if (!jwtToken || !admin) {
      throw new Error('Invalid login response from server');
    }

    setToken(jwtToken);
    setUser(admin);

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('admin', JSON.stringify(admin));

    return admin;
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('admin');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
