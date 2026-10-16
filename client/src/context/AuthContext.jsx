import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch((err) => {
        if (err.response?.status === 401) setUser(null);
      });
  }, []);

  const login = async (name, password) => {
    const { data } = await api.post('/auth/login', { name, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, password, nickname = '') => {
    const { data } = await api.post('/auth/register', { name, password, nickname });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const changeName = async (name) => {
    const { data } = await api.put('/auth/name', { name });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, changeName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
