// src/authcontext/AuthContext.js
import axios from 'axios';
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  const getBackendUrl = () => {
    const url = import.meta.env.VITE_BACKEND_URL || 'https://finance-dashboard-3nub.onrender.com';
    if (!url) {
      console.error('❌ VITE_BACKEND_URL is not defined');
      return 'http://localhost:8080';
    }
    return url;
  };

  const parseJwt = (token) => {
    try {
      if (!token) return { sub: "unknown", name: "User" };
      
      const base64Url = token.split('.')[1];
      if (!base64Url) return { sub: "unknown", name: "User" };
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error parsing JWT:", error);
      return { sub: "unknown", name: "User" };
    }
  };

  const isTokenExpired = (token) => {
    try {
      const decoded = parseJwt(token);
      if (decoded.exp) {
        const expirationTime = decoded.exp * 1000;
        return Date.now() >= expirationTime;
      }
      return false;
    } catch (error) {
      return true;
    }
  };

  const saveUserData = (userData, jwtToken) => {
    const userToStore = {
      ...userData,
      jwt: jwtToken,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userToStore));
    setUser(userToStore);
    setToken(jwtToken);
    
    console.log(" User data saved");
  };

  const clearUserData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    console.log("🗑️ User data cleared");
  };

  // Initialize auth - DON'T redirect here!
  useEffect(() => {
    const initializeAuth = () => {
      console.log(" Initializing authentication...");
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        if (!isTokenExpired(storedToken)) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("Found valid stored user:", parsedUser.email);
            setUser(parsedUser);
            setToken(storedToken);
          } catch (err) {
            console.error("Error parsing stored user:", err);
            clearUserData();
          }
        } else {
          console.log(" Token expired");
          clearUserData();
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, []); // Empty dependency array - runs once on mount

  // Handle OAuth redirect
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const backendUrl = getBackendUrl();
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');
      
      if (error) {
        console.error("OAuth error:", error);
        setError(error);
        setLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      if (token) {
        console.log(" Processing OAuth token...");
        
        if (isTokenExpired(token)) {
          console.error("Token expired");
          setError("Token has expired");
            clearUserData();
          setLoading(false);
          return;
        }
        
        const userInfo = parseJwt(token);
        const userData = {
          email: userInfo.sub || userInfo.email,
          name: userInfo.name || "User",
          userId: userInfo.userId || userInfo.id || userInfo.sub,
          provider: 'google',
          roles: ['USER']
        };
        
        saveUserData(userData, token);
        setLoading(false);
        
        const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/';
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
        return;
      }
      
      setLoading(false);
    };
    
    handleOAuthRedirect();
  }, []);

  const login = async (email, password) => {
    const backendUrl = getBackendUrl();
    console.log( backendUrl);
    
    try {
      setError(null);
      console.log('Login attempt for email:', email);
      
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password,
      });

      if (response.status === 200 && response.data) {
        const token = response.data.token || response.data.jwt || response.data.accessToken;
        const userId = response.data.userId || response.data.id;
        const userEmail = response.data.email || email;
        const userName = response.data.name || email.split('@')[0];

          const finalToken = typeof token === 'string' ? token : token?.token;

        
        if (!finalToken) {
        setError("Invalid server response - no token received");
        return { success: false, message: "Invalid server response" };
      }
        
        const userData = {
          email: userEmail,
          name: userName,
          userId: userId,
          roles: ['USER']
        };
        
        saveUserData(userData, finalToken);
        
        // ✅ Use window.location for redirect to avoid React Router issues
        window.location.href = '/';
        
        return { success: true, message: "Login successful" };
      } else {
        return { success: false, message: 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = "Login failed";
      if (error.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to backend at ${backendUrl}`;
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    const backendUrl = getBackendUrl();
    console.log('Register attempt for:', {  backendUrl });
    
    try {
      setError(null);
      console.log('Register attempt for:', { name, email });
      
      const response = await axios.post(`${backendUrl}/api/auth/signup`, {
        username: name,
        password,
        email
      });
      
      if (response.status === 200 || response.status === 201) {
        const token = response.data.token || response.data.jwt || response.data.accessToken;
        const userId = response.data.userId || response.data.id;
        const userEmail = response.data.email || email;
        const userName = response.data.name || name;
        
         const finalToken = typeof token === 'string' ? token : token?.token;
      
      if (!finalToken) {
        setError("Invalid server response - no token received");
        return { success: false, message: "Invalid server response" };
      }
        
        const userData = {
          email: userEmail,
          name: userName,
          userId: userId,
          roles: ['USER']
        };
        
        saveUserData(userData, finalToken);
        
        // ✅ Use window.location for redirect
        window.location.href = '/';
        
        return { success: true, message: "Registration successful" };
      } else {
        return { success: false, message: "Registration failed" };
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed";
      if (error.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to backend at ${backendUrl}`;
      } else if (error.response?.status === 409) {
        errorMessage = "Email already exists";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  if (token) {
  console.log("Processing OAuth token...");
  
  if (isTokenExpired(token)) {
    console.error("Token expired");
    setError("Token has expired");
    clearUserData();
    setLoading(false);
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }
 const userInfo = parseJwt(token);
  const userData = {
    email: userInfo.sub || userInfo.email,
    name: userInfo.name || "User",
    userId: userInfo.userId || userInfo.id || userInfo.sub,
    provider: 'google',
    roles: ['USER']
  };

    saveUserData(userData, token);
  setLoading(false);
  
  const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/';
  localStorage.removeItem('redirectAfterLogin');
  window.location.href = redirectUrl;
  return;
}

  const logout = () => {
    console.log("Logging out...");
    clearUserData();
    window.location.href = '/login';
  };

  const googleLogin = () => {
    const backendUrl = getBackendUrl();
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      localStorage.setItem('redirectAfterLogin', currentPath);
    }
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  };

  const isAuthenticated = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    return !!(storedToken && storedUser && !isTokenExpired(storedToken));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      token,
      login, 
      register, 
      logout,
      googleLogin,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};