// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import SummaryCard from '../components/SummaryCard';
import TransactionRow from '../components/TransactionRow';
import { useAuth } from '../authcontext/AuthContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, TrendingUp } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
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
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // ✅ Wrap fetchDashboardData in useCallback to prevent infinite loops
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        setError("User not authenticated. Please login again.");
        setLoading(false);
        
        // ✅ Optionally redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        
        return;
      }
      
      if (!backendUrl) {
        console.error("Backend URL not configured");
        setError("Backend URL is not configured. Please check environment variables.");
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${backendUrl}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Dashboard data:', response.data);
      
      // ✅ Safely extract data with fallbacks
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
      
      // ✅ Handle different error types
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          setError(err.response.data?.message || 'Failed to load dashboard data');
        }
      } else if (err.request) {
        // Request was made but no response
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        // Something else happened
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [backendUrl]); // ✅ Add backendUrl as dependency

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // ✅ Add fetchDashboardData as dependency

  // ✅ Safe user display name extraction
  const getDisplayName = useCallback(() => {
    try {
      if (!user) return 'Guest';
      
      // ✅ Check if user is an object
      if (typeof user !== 'object') return 'User';
      
      // ✅ Safely extract name with fallbacks
      const name = user?.name || 
                   user?.username || 
                   (user?.email ? user.email.split('@')[0] : null) || 
                   'User';
      
      // ✅ Ensure we return a string
      return String(name);
    } catch (err) {
      console.error('Error getting display name:', err);
      return 'User';
    }
  }, [user]);

  // ✅ Safe monthly change display
  const getMonthlyChangeDisplay = () => {
    const change = dashboardData.monthlyChange;
    if (typeof change !== 'number') return '0.0';
    return change.toFixed(1);
  };

  // ✅ Loading state
  if (loading) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <Layout>
        <div className="p-8 pt-24 min-h-screen">
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-lg max-w-md mx-auto text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="font-bold text-lg mb-2">Error Loading Dashboard</h3>
            <p className="text-sm mb-4">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 pt-24 bg-white min-h-screen">
        
        {/* FINANCIAL OVERVIEW HEADING */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-black">Financial Overview</h1>
          <p className="text-gray-500 mt-2">
            Welcome back, {getDisplayName()}. Your curated portfolio is up {getMonthlyChangeDisplay()}% this week.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Balance Card - Light Green Theme */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Wallet size={16} className="text-green-600" />
                </div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">REMAINING BALANCE</p>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <TrendingUp size={14} /> {getMonthlyChangeDisplay()}%
              </div>
            </div>
            <p className="text-3xl font-bold text-green-700 mb-2">
              ${(dashboardData.totalBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-green-500">Available to spend</p>
          </div>

          {/* Receive Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ArrowDownLeft size={16} className="text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">RECEIVE</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ${(dashboardData.totalIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-600">+2.4% vs last month</p>
          </div>

          {/* Spend Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <ArrowUpRight size={16} className="text-red-500" />
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SPEND</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              ${(dashboardData.totalExpense || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400">Total expenses this month</p>
          </div>
        </div>

        {/* Recent Transactions - Full width now */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 pb-4 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Recent Curation</h3>
              <p className="text-sm text-gray-500 mt-1">Your latest transactions across all accounts</p>
            </div>
            <button 
              onClick={() => window.location.href = '/transactions'}
              className="text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors"
            >
              VIEW ALL {dashboardData.recentTransactions.length} TRANSACTIONS
            </button>
          </div>
          
          <div className="overflow-x-auto">
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
                {dashboardData.recentTransactions.length > 0 ? (
                  dashboardData.recentTransactions.map((tx) => (
                    <TransactionRow key={tx.id || Math.random()} transaction={tx} compact={false} />
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAB button to add transaction */}
        <button 
          onClick={() => window.location.href = '/transactions'}
          className="fixed bottom-8 right-8 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-all hover:shadow-xl z-50"
        >
          <Plus size={24} />
        </button>
      </div>
    </Layout>
  );
};

export default Dashboard;