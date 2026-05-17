// src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../authcontext/AuthContext';
import { CreditCard, TrendingUp, PieChart, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Password strength validation
  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 6) errors.push('Password must be at least 6 characters');
    if (!/[A-Z]/.test(pass)) errors.push('Password must contain at least one uppercase letter');
    if (!/[0-9]/.test(pass)) errors.push('Password must contain at least one number');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Validation checks
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    // ✅ Password strength validation
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      return;
    }

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    
    try {
      // ✅ Check if register function exists
      if (!register) {
        throw new Error('Authentication service not available');
      }

      const result = await register(name, email, password);
      console.log("Registration result => ", result);

      // ✅ Check if registration was successful
      if (result && result.success) {
        console.log("Registration successful, redirecting...");
        // AuthContext will handle redirect to home page
        // No need to navigate here if AuthContext already redirects
      } else {
        // ✅ Show error message from result
        setError(result?.message || "Registration failed");
        setLoading(false);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  // ✅ Check if AuthContext is available
  if (!register) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
          <p>Authentication service is not available. Please check your app configuration.</p>
          <Link to="/login" className="mt-4 inline-block text-emerald-600 hover:text-emerald-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="flex w-full max-w-6xl min-h-[700px] bg-white rounded-xl overflow-hidden shadow-2xl">
        {/* Left Column - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-600">Expense Tracker</span>
          </div>
          
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Create your account</h1>
            <p className="text-gray-500">Begin your journey with Expense Tracker.</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  placeholder="Enter your full name"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  placeholder="name@company.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
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
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password requirements hint */}
            {password && (
              <div className="text-xs space-y-1">
                <p className={`${password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                  ✓ At least 6 characters
                </p>
                <p className={`{/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  ✓ At least one uppercase letter
                </p>
                <p className={`{/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  ✓ At least one number
                </p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        
        {/* Right Column - Illustration */}
        <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/30 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center p-12">
            <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
              <div className="col-span-2 bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-xl">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">Net Worth Progress</span>
                  <span className="text-emerald-600 font-bold">+12.4%</span>
                </div>
                <div className="h-24 w-full flex items-end gap-1 mt-4">
                  <div className="flex-1 bg-emerald-200 rounded-t h-[40%]"></div>
                  <div className="flex-1 bg-emerald-200 rounded-t h-[55%]"></div>
                  <div className="flex-1 bg-emerald-200 rounded-t h-[45%]"></div>
                  <div className="flex-1 bg-emerald-200 rounded-t h-[70%]"></div>
                  <div className="flex-1 bg-emerald-200 rounded-t h-[60%]"></div>
                  <div className="flex-1 bg-emerald-600 rounded-t h-[90%]"></div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-xl">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <PieChart size={20} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900">Assets</h3>
                <p className="text-2xl font-extrabold text-emerald-600">$42.8k</p>
              </div>
              
              <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-xl">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900">Markets</h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <p className="text-sm text-gray-500">Live curation</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-extrabold text-emerald-600 mb-4">The new standard for modern wealth.</h2>
              <p className="text-gray-500">Join 20,000+ professionals curating their financial future.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;