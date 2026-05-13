import axios from 'axios';
import React, { createContext, useState, useContext, useEffect } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
  
  console.log("backend url => ", backendUrl)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Handle Google OAuth redirect when component mounts
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      // Get the current URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');
      
      console.log("Checking OAuth redirect...");
      console.log("Token in URL:", token ? "Present (length: " + token.length + ")" : "Not present");
      console.log("Error in URL:", error || "None");
      
      // If there's an error parameter
      if (error) {
        console.error("OAuth error:", error);
        setError(error);
        setLoading(false);
        // Clean URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // If there's a token from Google OAuth
      if (token) {
        console.log("✅ Token found in URL, processing OAuth login...");
        
        try {
          // Store the token
          localStorage.setItem('token', token);
          
          // Decode token to get user info
          const userInfo = parseJwt(token);
          console.log("Decoded user from token:", userInfo);
          
          // ✅ FIXED: Get name from multiple possible locations in JWT
          const userName = userInfo.name ||      // Standard claim
                          userInfo.Name ||      // Alternative casing
                          userInfo.fullName ||  // Alternative field name
                          userInfo.email?.split('@')[0] ||  // Fallback: use email prefix
                          "User";               // Final fallback
          
          const userEmail = userInfo.sub ||     // Subject (standard)
                           userInfo.email ||    // Email claim
                           userInfo.userEmail;  // Alternative
          
          const userData = {
            email: userEmail,
            name: userName,
            userId: userInfo.userId || userInfo.id,
            jwt: token
          };
          
          console.log("Setting user data:", userData);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Clean URL and redirect to dashboard
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.href = '/';
          
        } catch (err) {
          console.error("Error processing OAuth token:", err);
          setError("Failed to process Google login");
          setLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }
      
      // No OAuth redirect, check localStorage for existing user
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
    };
    
    handleOAuthRedirect();
  }, []);

  // ✅ IMPROVED: Helper function to decode JWT with better error handling
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

  // ✅ FIXED: Login function with redirect
  const login = async (email, password) => {
    try {
      setError(null);
      console.log('your login data =>', { email, password });
      
      const res = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password,
      });
      console.log("your login res => ", res);

      if (res.status === 200 && res.data) {
        // Handle different response structures
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
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        // ✅ REDIRECT TO DASHBOARD AFTER LOGIN
        window.location.href = '/';
        
        return { success: true, message: "Login successfully" };
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

  // ✅ FIXED: Register function with redirect
  const register = async (name, email, password) => {
    try {
      setError(null);
      console.log('your register data =>', name, email, password);
      
      const res = await axios.post(`${backendUrl}/api/auth/signup`, {
        username: name,
        password,
        email
      });
      console.log("Register response:", res);
      console.log("Full response data:", JSON.stringify(res.data, null, 2));
      console.log("RESPONSE STATUS:", res.status);
      console.log("RESPONSE HEADERS:", res.headers);
      
      if (res.status === 200 || res.status === 201) {
        // Handle different response structures
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
        
        // ✅ REDIRECT TO DASHBOARD AFTER REGISTRATION
        window.location.href = '/';
        
        return { success: true, message: "Registration successful" };
      } else {
        return { success: false, message: "Registration failed" };
      }
    
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Error details:", error.response?.data);
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
    window.location.href = '/login';
  };

  // ✅ Function to initiate Google login
  const googleLogin = () => {
    console.log("Initiating Google login...");
    // Store current path to redirect back after login
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    // Redirect to backend OAuth endpoint
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