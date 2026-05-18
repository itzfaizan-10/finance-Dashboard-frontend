// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import TransactionRow from '../components/TransactionRow';
import { useAuth } from '../authcontext/AuthContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, TrendingUp, RefreshCw } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { user, isAuthenticated, refreshToken, logout, getSessionStatus } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    monthlyChange: 0,
    recentTransactions: [],
    categoryBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // ✅ Create axios instance with interceptors
  const apiClient = useCallback(() => {
    const token = localStorage.getItem("token");
    const instance = axios.create({
      baseURL: backendUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    // Response interceptor for token refresh
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Attempt to refresh the token
            const refreshed = await refreshToken();
            if (refreshed) {
              const newToken = localStorage.getItem("token");
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return instance;
  }, [backendUrl, refreshToken, logout]);

  // ✅ Check session status periodically
  useEffect(() => {
    const checkSession = () => {
      const status = getSessionStatus();
      setSessionInfo(status);
      
      // Show warning if less than 5 minutes remaining
      if (status.isActive && status.remainingSeconds && status.remainingSeconds <= 300) {
        console.warn(`⚠️ Session expires in ${Math.floor(status.remainingSeconds / 60)} minutes`);
        // You could trigger a toast notification here
      }
    };
    
    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [getSessionStatus]);

  // ✅ Fetch dashboard data with better error handling
  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      // Check authentication first
      if (!isAuthenticated()) {
        console.error("User not authenticated");
        setError("Your session has expired. Please login again.");
        
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login after delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      if (!backendUrl) {
        throw new Error("Backend URL is not configured");
      }
      
      // Log token expiry for debugging
      const tokenDetails = getSessionStatus();
      if (tokenDetails && tokenDetails.remainingSeconds) {
        console.log(`📊 Fetching dashboard - Token valid for: ${Math.floor(tokenDetails.remainingSeconds / 60)} minutes`);
      }
      
      const client = apiClient();
      const response = await client.get('/api/dashboard');
      
      console.log('Dashboard data received:', response.data);
      
      // ✅ Safely extract data with validation
      const data = response.data || {};
      
      setDashboardData({
        totalBalance: typeof data.totalBalance === 'number' ? data.totalBalance : 0,
        totalIncome: typeof data.totalIncome === 'number' ? data.totalIncome : 0,
        totalExpense: typeof data.totalExpense === 'number' ? data.totalExpense : 0,
        monthlyChange: typeof data.monthlyChange === 'number' ? data.monthlyChange : 0,
        recentTransactions: Array.isArray(data.recentTransactions) ? data.recentTransactions : [],
        categoryBreakdown: data.categoryBreakdown && typeof data.categoryBreakdown === 'object' ? data.categoryBreakdown : {}
      });
      
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      
      // ✅ Enhanced error handling
      if (err.response) {
        // Server responded with error
        switch (err.response.status) {
          case 401:
            setError('Session expired. Please login again.');
            // Clear expired token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            break;
          case 403:
            setError('You don\'t have permission to access this data.');
            break;
          case 404:
            setError('Dashboard API endpoint not found. Please check backend configuration.');
            break;
          case 500:
            setError('Server error. Please try again later.');
            break;
          default:
            setError(err.response.data?.message || 'Failed to load dashboard data');
        }
      } else if (err.request) {
        // Request made but no response
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        // Something else
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [backendUrl, apiClient, isAuthenticated, getSessionStatus]);

  // ✅ Auto-refresh data every 5 minutes
  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes (300000 ms)
    const intervalId = setInterval(() => {
      if (isAuthenticated()) {
        console.log("🔄 Auto-refreshing dashboard data...");
        fetchDashboardData(true);
      }
    }, 300000);
    
    return () => clearInterval(intervalId);
  }, [fetchDashboardData, isAuthenticated]);

  // ✅ Manual refresh handler
  const handleManualRefresh = async () => {
    await fetchDashboardData(true);
  };

  // ✅ Safe user display name extraction
  const getDisplayName = useCallback(() => {
    try {
      if (!user) return 'Guest';
      if (typeof user !== 'object') return 'User';
      
      const name = user?.name || 
                   user?.username || 
                   (user?.email ? user.email.split('@')[0] : null) || 
                   'User';
      
      return String(name);
    } catch (err) {
      console.error('Error getting display name:', err);
      return 'User';
    }
  }, [user]);

  // ✅ Format currency helper
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '$0.00';
    return `$${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // ✅ Get monthly change color class
  const getMonthlyChangeColor = () => {
    const change = dashboardData.monthlyChange;
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // ✅ Loading state with better UI
  if (loading) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading your dashboard...</p>
            {sessionInfo?.remainingSeconds && (
              <p className="mt-2 text-xs text-gray-400">
                Session expires in {Math.floor(sessionInfo.remainingSeconds / 60)} minutes
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // ✅ Error state with retry button
  if (error) {
    return (
      <Layout>
        <div className="p-8 pt-24 min-h-screen">
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-lg max-w-md mx-auto text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="font-bold text-lg mb-2">Error Loading Dashboard</h3>
            <p className="text-sm mb-4">{error}</p>
            <div className="space-x-3">
              <button 
                onClick={handleManualRefresh}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 pt-24 bg-white min-h-screen">
        
        {/* Session warning banner */}
        {sessionInfo?.remainingSeconds && sessionInfo.remainingSeconds <= 600 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⏰</span>
              <span className="text-sm">
                Your session will expire in {Math.floor(sessionInfo.remainingSeconds / 60)} minutes.
                {sessionInfo.remainingSeconds <= 300 && ' Please save your work!'}
              </span>
            </div>
            <button 
              onClick={logout}
              className="text-sm bg-yellow-100 px-3 py-1 rounded hover:bg-yellow-200"
            >
              Extend Session
            </button>
          </div>
        )}
        
        {/* Header with refresh button */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-black">Financial Overview</h1>
            <p className="text-gray-500 mt-2">
              Welcome back, {getDisplayName()}. Your portfolio is up {dashboardData.monthlyChange.toFixed(1)}% this week.
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Wallet size={16} className="text-green-600" />
                </div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">REMAINING BALANCE</p>
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${getMonthlyChangeColor()}`}>
                <TrendingUp size={14} /> {dashboardData.monthlyChange.toFixed(1)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-green-700 mb-2">
              {formatCurrency(dashboardData.totalBalance)}
            </p>
            <p className="text-xs text-green-500">Available to spend</p>
          </div>

          {/* Income Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ArrowDownLeft size={16} className="text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">TOTAL INCOME</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(dashboardData.totalIncome)}
            </p>
            <p className="text-xs text-emerald-600">+2.4% vs last month</p>
          </div>

          {/* Expenses Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <ArrowUpRight size={16} className="text-red-500" />
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">TOTAL EXPENSES</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(dashboardData.totalExpense)}
            </p>
            <p className="text-xs text-gray-400">Total expenses this month</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 pb-4 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500 mt-1">
                Your latest transactions across all accounts
                {dashboardData.recentTransactions.length > 0 && 
                  ` (${dashboardData.recentTransactions.length} total)`
                }
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/transactions'}
              className="text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
            >
              VIEW ALL
              {dashboardData.recentTransactions.length > 0 && 
                ` ${dashboardData.recentTransactions.length} TRANSACTIONS`
              }
              →
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {dashboardData.recentTransactions.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">MERCHANT / ENTITY</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">DATE</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboardData.recentTransactions.map((tx, index) => (
                    <TransactionRow 
                      key={tx.id || index} 
                      transaction={tx} 
                      compact={false} 
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No transactions yet</p>
                <button 
                  onClick={() => window.location.href = '/transactions'}
                  className="mt-4 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Add your first transaction →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FAB button */}
        <button 
          onClick={() => window.location.href = '/transactions'}
          className="fixed bottom-8 right-8 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-all hover:shadow-xl z-50"
          aria-label="Add transaction"
        >
          <Plus size={24} />
        </button>
      </div>
    </Layout>
  );
};

export default Dashboard;