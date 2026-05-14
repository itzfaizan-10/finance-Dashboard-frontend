// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
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

  // Fetch dashboard data from backend
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
        const token = localStorage.getItem("token");

        if(!token){
             setError("User not authenticated. Please login again.");
             setLoading(false); 
             return;}
      
      const response = await axios.get(`${backendUrl}/api/dashboard`,{
        headers:{
          Authorization: `Bearer ${token}`,},
      });
      console.log('Dashboard data:', response.data);
      
      setDashboardData({
        totalBalance: response.data.totalBalance || 0,
        totalIncome: response.data.totalIncome || 0,
        totalExpense: response.data.totalExpense || 0,
        monthlyChange: response.data.monthlyChange || 0,
        recentTransactions: response.data.recentTransactions || [],
        categoryBreakdown: response.data.categoryBreakdown || {}
      });
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Get user's display name
  const getDisplayName = () => {
    if (!user) return 'Guest';
    return user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8 pt-24">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
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
            Welcome back, {getDisplayName()}. Your curated portfolio is up {dashboardData.monthlyChange || 4.2}% this week.
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
                <TrendingUp size={14} /> {dashboardData.monthlyChange}%
              </div>
            </div>
            <p className="text-3xl font-bold text-green-700 mb-2">
              ${dashboardData.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              ${dashboardData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              ${dashboardData.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <TransactionRow key={tx.id} transaction={tx} compact={false} />
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