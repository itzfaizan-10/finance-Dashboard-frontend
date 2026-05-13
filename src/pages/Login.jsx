// src/pages/Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../authcontext/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CreditCard, TrendingUp, Shield } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      if (!result.success) {
        setError(result.message || 'Login failed');
        return;
      }

      console.log('Login successful:', result);
      navigate('/');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="flex w-full max-w-6xl min-h-[600px] bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl">
        {/* Left Column - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Expense Tracker</span>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-extrabold mb-4 dark:text-black">Welcome</h1>
            <p className="text-on-surface-variant red">Enter valid gmail and password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold">Password</label>
                <a href="#" className="text-sm text-primary">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-high rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in to account'}
            </button>

            {error && (
              <div className="p-3 bg-error-container text-error rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-outline-variant/30"></div>
              <span className="mx-4 text-xs font-semibold uppercase">or continue with</span>
              <div className="flex-grow border-t border-outline-variant/30"></div>
            </div>
            <div className="grid  gap-4" >
              <button
                onClick={() => {
                  window.location.href = "http://localhost:8080/oauth2/authorization/google";
                }}
                className=" flex items-center justify-center gap-3 py-3 bg-surface-container-low rounded-xl"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                <span className="text-sm font-semibold">Google</span>
              </button>
              {/* <button type="button" className="flex items-center justify-center gap-3 py-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-semibold">Apple ID</span>
              </button> */}
            </div>
          </form>

          <footer className="mt-12 text-center">
            <p className="text-on-surface-variant">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </footer>
        </div>

        {/* Right Column - Illustration */}
        <div className="hidden lg:flex w-1/2 bg-surface-container-low relative items-center justify-center p-12">
          <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container/60 to-transparent"></div>
          <div className="relative z-10 w-full max-w-md space-y-6">
            <div className="bg-white/80 dark:bg-zinc-250/80 backdrop-blur-xl p-6 rounded-xl shadow-2xl transform -rotate-2">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <TrendingUp size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-bold">Monthly Growth</span>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-secondary-fixed rounded-full">+12.4%</span>
              </div>
              <div className="h-16 flex items-end gap-1">
                <div className="w-1/6 bg-secondary-fixed-dim rounded-t h-[40%]"></div>
                <div className="w-1/6 bg-secondary-fixed-dim rounded-t h-[60%]"></div>
                <div className="w-1/6 bg-secondary-fixed-dim rounded-t h-[55%]"></div>
                <div className="w-1/6 bg-secondary-fixed-dim rounded-t h-[80%]"></div>
                <div className="w-1/6 bg-secondary-fixed-dim rounded-t h-[70%]"></div>
                <div className="w-1/6 bg-primary rounded-t h-[100%]"></div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-zinc-250/80 backdrop-blur-xl p-6 rounded-xl shadow-2xl transform translate-x-12 rotate-3">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-primary" />
                  <span className="text-sm font-bold">Wealth Managed</span>
                </div>
                <div className="text-3xl font-extrabold text-primary">$248,500.00</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Live sync with 14 institutions
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <h2 className="text-2xl font-extrabold text-primary mb-2">Curated for excellence.</h2>
              <p className="text-sm text-on-surface-variant">
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