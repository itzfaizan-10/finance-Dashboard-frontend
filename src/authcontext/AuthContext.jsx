import axios from 'axios';
import React, { createContext, useState, useContext, useEffect } from 'react';

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
  
  // ✅ Get backend URL
  const getBackendUrl = () => {
    const url = import.meta.env.VITE_BACKEND_URL;
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

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const backendUrl = getBackendUrl();
      console.log("backend url => ", backendUrl);
      
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
            localStorage.setItem('token', token);
            const userInfo = parseJwt(token);
            
            const userName = userInfo.name || userInfo.Name || userInfo.fullName || userInfo.email?.split('@')[0] || "User";
            const userEmail = userInfo.sub || userInfo.email || userInfo.userEmail;
            
            const userData = {
              email: userEmail,
              name: userName,
              userId: userInfo.userId || userInfo.id,
              jwt: token
            };
            
            console.log("Setting user data:", userData);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setLoading(false);
            // ✅ Redirect to home page (/) instead of /dashboard
            window.location.href = "/";
          } catch (err) {
            console.error("Error processing OAuth token:", err);
            setError("Failed to process Google login");
            setLoading(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          return;
        }
        
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("Found stored user:", parsedUser);
            setUser(parsedUser);
          } catch (err) {
            console.error("Error parsing stored user:", err);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
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
    
    try {
      setError(null);
      console.log('login data =>', { email, password });
      
      const res = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password,
      });
      console.log("login response => ", res);

      if (res.status === 200 && res.data) {
        const token = res.data.token || res.data.jwt || res.data.accessToken;
        const userId = res.data.userId || res.data.id || res.data.user?.id;
        const userEmail = res.data.email || email;
        const userName = res.data.name || res.data.username || email.split('@')[0];
        
        if (!token) {
          console.error("No token in response:", res.data);
          setError("Invalid server response: No token received");
          return { success: false, message: "Invalid server response" };
        }
        
        const userData = {
          email: userEmail,
          name: userName,
          jwt: token,
          userId: userId
        };
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        // ✅ Redirect to home page (/) instead of /dashboard
        window.location.href = "/";
        
        return { success: true, message: "Login successful" };
      } else {
        return { success: false, message: 'Login failed' };
      }
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    const backendUrl = getBackendUrl();
    
    try {
      setError(null);
      console.log('register data =>', name, email, password);
      
      const res = await axios.post(`${backendUrl}/api/auth/signup`, {
        username: name,
        password,
        email
      });
      console.log("Register response:", res);
      
      if (res.status === 200 || res.status === 201) {
        const token = res.data.token || res.data.jwt || res.data.accessToken;
        const userId = res.data.userId || res.data.id || res.data.user?.id;
        const userEmail = res.data.email || email;
        const userName = res.data.name || res.data.username || name;
        
        if (!token) {
          console.error("No token in response:", res.data);
          setError("Invalid server response: No token received");
          return { success: false, message: "Invalid server response" };
        }
        
        const userData = {
          email: userEmail,
          name: userName,
          jwt: token,
          userId: userId
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        // ✅ Redirect to home page (/) instead of /dashboard
        window.location.href = "/";
        
        return { success: true, message: "Registration successful" };
      } else {
        return { success: false, message: "Registration failed" };
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || "Registration failed";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    // ✅ Redirect to home page or login page after logout
    window.location.href = '/login';
  };

  const googleLogin = () => {
    const backendUrl = getBackendUrl();
    console.log("Initiating Google login...");
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = `${backendUrl}/oauth2/authorization/google`;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      login, 
      register, 
      logout,
      googleLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};