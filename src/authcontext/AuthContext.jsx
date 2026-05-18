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

  // Get backend URL
  const getBackendUrl = () => {
    const url = import.meta.env.VITE_BACKEND_URL;
    console.log("🔍 Backend URL from env:", url);
    if (!url) {
      console.error('❌ VITE_BACKEND_URL is not defined');
      return 'http://localhost:8080';
    }
    return url;
  };

  const parseJwt = (token) => {
    try {
      if (!token) {
        console.error("No token provided to parseJwt");
        return { sub: "unknown", name: "User" };
      }
      
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.error("Invalid token format");
        return { sub: "unknown", name: "User" };
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      
      console.log("Full decoded JWT payload:", decoded);
      return decoded;
    } catch (error) {
      console.error("Error parsing JWT:", error);
      return { sub: "unknown", name: "User" };
    }
  };

  // Check if token is expired
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

  // Get token expiration time
  const getTokenExpiration = (token) => {
    try {
      const decoded = parseJwt(token);
      if (decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Get session status
  const getSessionStatus = () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return { isActive: false, remainingSeconds: null };
    
    try {
      const decoded = parseJwt(storedToken);
      if (decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingSeconds = decoded.exp - currentTime;
        return {
          isActive: remainingSeconds > 0,
          remainingSeconds: remainingSeconds,
          expiresAt: new Date(decoded.exp * 1000)
        };
      }
      return { isActive: true, remainingSeconds: null };
    } catch (error) {
      return { isActive: false, remainingSeconds: null };
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
    localStorage.setItem('tokenExpiration', getTokenExpiration(jwtToken)?.toISOString());
    
    setUser(userToStore);
    setToken(jwtToken);
    
    console.log("✅ User data saved, token:", jwtToken.substring(0, 50) + "...");
  };

  const clearUserData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setToken(null);
    console.log("🗑️ User data cleared");
  };

  // Initialize auth from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("🔐 Initializing authentication...");
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      
      console.log("Stored token exists:", !!storedToken);
      console.log("Stored user exists:", !!storedUser);
      
      if (storedToken && storedUser && tokenExpiration) {
        const isExpired = new Date(tokenExpiration) <= new Date();
        
        if (!isExpired && !isTokenExpired(storedToken)) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("✅ Found valid stored user:", parsedUser.email);
            setUser(parsedUser);
            setToken(storedToken);
          } catch (err) {
            console.error("Error parsing stored user:", err);
            clearUserData();
          }
        } else {
          console.log("⚠️ Token expired, clearing user data");
          clearUserData();
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Handle OAuth redirect
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const backendUrl = getBackendUrl();
      console.log("🌐 Backend URL for OAuth:", backendUrl);
      
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');
        
        console.log("Checking OAuth redirect...");
        console.log("Token in URL:", token ? "Present" : "Not present");
        console.log("Error in URL:", error || "None");
        
        if (error) {
          console.error("OAuth error:", error);
          setError(error);
          setLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        
        if (token) {
          console.log("✅ Token found, processing OAuth login...");
          
          try {
            if (isTokenExpired(token)) {
              console.error("Received token is already expired");
              setError("Token has expired");
              setLoading(false);
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
            
            const userInfo = parseJwt(token);
            const userName = userInfo.name || userInfo.Name || userInfo.fullName || userInfo.email?.split('@')[0] || "User";
            const userEmail = userInfo.sub || userInfo.email || userInfo.userEmail;
            
            const userData = {
              email: userEmail,
              name: userName,
              userId: userInfo.userId || userInfo.id || userInfo.sub,
              provider: 'google',
              roles: userInfo.roles || ['USER']
            };
            
            console.log("Setting user data from OAuth:", userData);
            saveUserData(userData, token);
            
            setLoading(false);
            const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/';
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
          } catch (err) {
            console.error("Error processing OAuth token:", err);
            setError("Failed to process Google login");
            setLoading(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          return;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error in OAuth redirect handler:", err);
        setError("Authentication error occurred");
        setLoading(false);
      }
    };
    
    handleOAuthRedirect();
  }, []);

  const login = async (email, password) => {
    const backendUrl = getBackendUrl();
    console.log("🌐 Login API URL:", `${backendUrl}/api/auth/login`);
    
    try {
      setError(null);
      console.log('Login attempt for email:', email);
      
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password,
      });
      
      console.log("Login response status:", response.status);
      console.log("Login response data:", response.data);

      if (response.status === 200 && response.data) {
        const token = response.data.token || response.data.jwt || response.data.accessToken;
        const refreshToken = response.data.refreshToken;
        const userId = response.data.userId || response.data.id || response.data.user?.id;
        const userEmail = response.data.email || email;
        const userName = response.data.name || response.data.username || email.split('@')[0];
        const roles = response.data.roles || ['USER'];
        
        if (!token) {
          console.error("No token in response:", response.data);
          setError("Invalid server response: No token received");
          return { success: false, message: "Invalid server response" };
        }
        
        console.log("✅ Token received successfully");
        
        const userData = {
          email: userEmail,
          name: userName,
          userId: userId,
          roles: roles,
          provider: 'local'
        };
        
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        saveUserData(userData, token);
        
        return { success: true, message: "Login successful" };
      } else {
        return { success: false, message: 'Login failed' };
      }
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = "Login failed";
      if (error.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to backend at ${backendUrl}. Please make sure the backend server is running.`;
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
    console.log("🌐 Register API URL:", `${backendUrl}/api/auth/signup`);
    
    try {
      setError(null);
      console.log('Register attempt for:', { name, email });
      
      const response = await axios.post(`${backendUrl}/api/auth/signup`, {
        username: name,
        password,
        email
      });
      
      console.log("Register response status:", response.status);
      console.log("Register response data:", response.data);
      
      if (response.status === 200 || response.status === 201) {
        const token = response.data.token || response.data.jwt || response.data.accessToken;
        const userId = response.data.userId || response.data.id || response.data.user?.id;
        const userEmail = response.data.email || email;
        const userName = response.data.name || response.data.username || name;
        const roles = response.data.roles || ['USER'];
        
        if (!token) {
          console.error("No token in response:", response.data);
          setError("Invalid server response: No token received");
          return { success: false, message: "Invalid server response" };
        }
        
        console.log("✅ Registration successful, token received");
        
        const userData = {
          email: userEmail,
          name: userName,
          userId: userId,
          roles: roles,
          provider: 'local'
        };
        
        saveUserData(userData, token);
        
        return { success: true, message: "Registration successful" };
      } else {
        return { success: false, message: "Registration failed" };
      }
    } catch (error) {
      console.error("Registration error details:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = "Registration failed";
      if (error.code === 'ERR_NETWORK') {
        errorMessage = `Cannot connect to backend at ${backendUrl}. Please make sure the backend server is running.`;
      } else if (error.response?.status === 409) {
        errorMessage = "Email already exists. Please use a different email or login.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    console.log("🔓 Logging out...");
    
    // Optional: Call logout endpoint on backend
    const backendUrl = getBackendUrl();
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      axios.post(`${backendUrl}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${currentToken}` }
      }).catch(err => console.error("Logout API error:", err));
    }
    
    clearUserData();
    navigate('/login');
  };

  const googleLogin = () => {
    const backendUrl = getBackendUrl();
    console.log("🌐 Google Login URL:", `${backendUrl}/oauth2/authorization/google`);
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      localStorage.setItem('redirectAfterLogin', currentPath);
    }
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isAuthenticated = () => {
    const authenticated = !!user && !!token && !isTokenExpired(token);
    console.log("🔐 isAuthenticated check:", authenticated);
    return authenticated;
  };

  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) return false;
    
    try {
      const backendUrl = getBackendUrl();
      const response = await axios.post(`${backendUrl}/api/auth/refresh`, {
        refreshToken: refreshTokenValue
      });
      
      if (response.data.token) {
        const newToken = response.data.token;
        if (user) {
          saveUserData(user, newToken);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return false;
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("📊 Auth State:", {
      hasUser: !!user,
      hasToken: !!token,
      isAuth: isAuthenticated(),
      loading
    });
  }, [user, token, loading]);

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
      hasRole,
      isAuthenticated,
      refreshToken,
      getSessionStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};