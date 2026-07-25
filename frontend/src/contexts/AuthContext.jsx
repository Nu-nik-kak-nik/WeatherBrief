import React, { createContext, useState, useEffect } from 'react';
import * as authApi from '../services/api/auth';
import { getAccessToken, setAccessToken, clearAccessToken } from '../services/api/token';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState(() => getAccessToken() || null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        let token = getAccessToken();
        if (token) {
          const userData = await authApi.getCurrentUser();
          if (userData) {
            setUser(userData);
            setAccessTokenState(token);
            setLoading(false);
            return;
          }
        }
        const data = await authApi.refreshToken();
        if (data?.access_token) {
          setAccessTokenState(data.access_token);
          const userData = await authApi.getCurrentUser();
          if (userData) setUser(userData);
        }
      } catch (err) {
        console.warn('Session restoration failed', err);
        clearAccessToken();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    if (data?.access_token) {
      setAccessTokenState(data.access_token);
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    }
    return data;
  };

  const register = async (nickname, email, password, lang, units) => {
    await authApi.register(nickname, email, password, lang, units);
    return login(email, password);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setAccessTokenState(null);
    clearAccessToken();
  };

  const refreshAccessToken = async () => {
    const data = await authApi.refreshToken();
    if (data?.access_token) {
      setAccessTokenState(data.access_token);
      return data.access_token;
    }
    throw new Error('Refresh failed');
  };

  const githubLogin = () => {
    authApi.githubLogin();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshAccessToken,
        githubLogin,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
