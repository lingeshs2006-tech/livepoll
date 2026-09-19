import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token invalid or expired");
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = res;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      return res;
    } catch (error) {
      console.error('Login error:', error);
      // If backend is not available, show a more helpful error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED')) {
        throw new Error('Backend server is not running. Please start the backend server and try again.');
      }
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/signup', { name, email, password });
      const { token, user: userData } = res;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      return res;
    } catch (error) {
      console.error('Registration error:', error);
      // If backend is not available, show a more helpful error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED')) {
        throw new Error('Backend server is not running. Please start the backend server and try again.');
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
