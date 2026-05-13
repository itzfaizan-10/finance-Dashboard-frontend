// src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../authcontext/AuthContext';
import { CreditCard, TrendingUp, PieChart } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    
    try {
      const result = await register(name, email, password);
      console.log("Registration result => ", result);

      // ✅ FIXED: Check if registration was successful
      if (result.success) {
        // Navigation is already handled in AuthContext with window.location.href
        // But you can keep this as backup
        console.log("Registration successful, redirecting...");
        // navigate('/dashboard'); // Uncomment if you want client-side navigation
      } else {
        // ✅ FIXED: Show error message from result
        setError(result.message || "Registration failed");
        setLoading(false);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="flex w-full max-w-6xl min-h-[700px] bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl">
        {/* Left Column - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Expense Tracker</span>
          </div>
          
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2 dark:text-black">Create your account</h1>
            <p className="text-on-surface-variant">Begin your journey with Expense Tracker.</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-error-container text-error rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-high rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-high rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="name@company.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
        
        {/* Right Column - Illustration */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-surface-container-low relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container/60 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center p-12">
            <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
              <div className="col-span-2 bg-white/80 dark:bg-zinc-250/80 backdrop-blur-xl p-6 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Net Worth Progress</span>
                  <span className="text-primary font-bold">+12.4%</span>
                </div>
                <div className="h-24 w-full flex items-end gap-1 mt-4">
                  <div className="flex-1 bg-primary-fixed-dim/40 rounded-t h-[40%]"></div>
                  <div className="flex-1 bg-primary-fixed-dim/40 rounded-t h-[55%]"></div>
                  <div className="flex-1 bg-primary-fixed-dim/40 rounded-t h-[45%]"></div>
                  <div className="flex-1 bg-primary-fixed-dim/40 rounded-t h-[70%]"></div>
                  <div className="flex-1 bg-primary-fixed-dim/40 rounded-t h-[60%]"></div>
                  <div className="flex-1 bg-primary-container rounded-t h-[90%]"></div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-zinc-250/80 backdrop-blur-xl p-6 rounded-xl">
                <div className="w-12 h-12 bg-secondary-fixed rounded-full flex items-center justify-center mb-4">
                  <PieChart size={20} />
                </div>
                <h3 className="font-bold">Assets</h3>
                <p className="text-2xl font-extrabold text-primary">$42.8k</p>
              </div>
              
              <div className="bg-white/80 dark:bg-zinc-250/80 backdrop-blur-xl p-6 rounded-xl">
                <div className="w-12 h-12 bg-tertiary-fixed rounded-full flex items-center justify-center mb-4">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-bold">Markets</h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-sm">Live curation</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-extrabold mb-4">The new standard for modern wealth.</h2>
              <p className="text-on-surface-variant">Join 20,000+ professionals curating their financial future.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;