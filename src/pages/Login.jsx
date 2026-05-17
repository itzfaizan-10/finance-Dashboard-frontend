// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../authcontext/AuthContext';
import { Mail, Lock, Eye, EyeOff, CreditCard, TrendingUp, Shield } from 'lucide-react';

const Login = () => {
  const { login, googleLogin } = useAuth(); // ✅ Use googleLogin from context instead of hardcoded URL
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      
      if (!result || !result.success) {
        setError(result?.message || 'Login failed');
        setLoading(false);
        return;
      }

      console.log('Login successful:', result);
      navigate('/'); // ✅ Navigate to home page after login
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Google Login with error handling
  const handleGoogleLogin = () => {
    try {
      if (googleLogin) {
        googleLogin();
      } else {
        // Fallback if googleLogin is not available in context
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
        window.location.href = `${backendUrl}/oauth2/authorization/google`;
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to initiate Google login. Please try again.');
    }
  };

  // ✅ If AuthContext is not available, show error
  if (!login) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
          <p>Authentication service is not available. Please check your app configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="flex w-full max-w-6xl min-h-[600px] bg-white rounded-xl overflow-hidden shadow-2xl">
        {/* Left Column - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-600">Expense Tracker</span>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-extrabold mb-4 text-gray-900">Welcome Back</h1>
            <p className="text-gray-500">Enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  placeholder="name@company.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <a href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign in to account'
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-4 text-xs font-semibold uppercase text-gray-400">or continue with</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <div className="grid gap-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-3 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <img 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google" 
                  className="w-5 h-5" 
                />
                <span className="text-sm font-semibold text-gray-700">Continue with Google</span>
              </button>
            </div>
          </form>

          <footer className="mt-12 text-center">
            <p className="text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline">
                Create Account
              </Link>
            </p>
          </footer>
        </div>

        {/* Right Column - Illustration */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-50 to-green-50 relative items-center justify-center p-12">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/30 to-transparent"></div>
          <div className="relative z-10 w-full max-w-md space-y-6">
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-2xl transform -rotate-2">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <TrendingUp size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Monthly Growth</span>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">+12.4%</span>
              </div>
              <div className="h-16 flex items-end gap-1">
                <div className="w-1/6 bg-emerald-200 rounded-t h-[40%]"></div>
                <div className="w-1/6 bg-emerald-200 rounded-t h-[60%]"></div>
                <div className="w-1/6 bg-emerald-200 rounded-t h-[55%]"></div>
                <div className="w-1/6 bg-emerald-200 rounded-t h-[80%]"></div>
                <div className="w-1/6 bg-emerald-200 rounded-t h-[70%]"></div>
                <div className="w-1/6 bg-emerald-600 rounded-t h-[100%]"></div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-2xl transform translate-x-12 rotate-3">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-emerald-600" />
                  <span className="text-sm font-bold text-gray-900">Wealth Managed</span>
                </div>
                <div className="text-3xl font-extrabold text-emerald-600">$248,500.00</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  Live sync with 14 institutions
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h2 className="text-2xl font-extrabold text-emerald-600 mb-2">Curated for excellence.</h2>
              <p className="text-sm text-gray-500">
                Join over 50,000 young professionals managing their future with intentionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;