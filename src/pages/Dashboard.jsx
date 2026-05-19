// src/pages/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import TransactionRow from '../components/TransactionRow';
import { useAuth } from '../authcontext/AuthContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Create axios instance with auth header
  const apiClient = useCallback(() => {
    const token = localStorage.getItem("token");
    return axios.create({
      baseURL: backendUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
  }, [backendUrl]);

  // Get userId from user object or localStorage
  const getUserId = useCallback(() => {
    if (user?.userId) return user.userId;
    if (user?.id) return user.id;
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.userId || parsedUser.id;
      } catch (err) {
        console.error('Error parsing stored user:', err);
      }
    }
    return null;
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        setError("User not authenticated. Please login again.");
        setLoading(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      if (!backendUrl) {
        console.error("Backend URL not configured");
        setError("Backend URL is not configured.");
        setLoading(false);
        return;
      }
      
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const client = apiClient();
      
      // Fetch transactions
      const transactionsResponse = await client.get(`/api/transaction/users/${userId}`);
      console.log('Transactions data:', transactionsResponse.data);
      
      let transactionsData = [];
      if (transactionsResponse.data && transactionsResponse.data.data) {
        transactionsData = Array.isArray(transactionsResponse.data.data) ? transactionsResponse.data.data : [transactionsResponse.data.data];
      } else if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
        transactionsData = transactionsResponse.data;
      } else if (transactionsResponse.data && transactionsResponse.data.transactions) {
        transactionsData = transactionsResponse.data.transactions;
      }
      
      // Calculate income and expense from transactions
      let totalIncome = 0;
      let totalExpense = 0;
      
      const mappedTransactions = transactionsData
        .filter(t => t && typeof t === 'object')
        .map(t => {
          const amount = Math.abs(Number(t.amount) || 0);
          const type = t.type || (t.amount > 0 ? 'INCOME' : 'EXPENSE');
          
          if (type === 'INCOME') {
            totalIncome += amount;
          } else {
            totalExpense += amount;
          }
          
          return {
            id: t.id || `temp-${Date.now()}-${Math.random()}`,
            description: t.description || t.merchant || 'No description',
            category: t.category || 'Uncategorized',
            type: type,
            amount: amount,
            transactiondate: t.transactiondate || t.date || new Date().toISOString().split('T')[0],
            categoryId: t.categoryId
          };
        });
      
      // Calculate total balance (Income - Expense)
      const totalBalance = totalIncome - totalExpense;
      
      // Get recent transactions (last 5)
      const recentTransactions = mappedTransactions
        .sort((a, b) => new Date(b.transactiondate) - new Date(a.transactiondate))
        .slice(0, 5);
      
      console.log('Dashboard calculations:', {
        totalIncome,
        totalExpense,
        totalBalance,
        recentCount: recentTransactions.length
      });
      
      setDashboardData({
        totalBalance: totalBalance,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        recentTransactions: recentTransactions
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [backendUrl, apiClient, getUserId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-black">Financial Overview</h1>
          <p className="text-gray-500 mt-2">
            Welcome back, {getDisplayName()}. Here's your financial summary.
          </p>
        </div>

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
            </div>
            <p className="text-3xl font-bold text-green-700 mb-2">
              ${dashboardData.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-green-500">Income - Expenses</p>
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
              ${dashboardData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-600">From all transactions</p>
          </div>

          {/* Expense Card */}
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
              ${dashboardData.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400">From all transactions</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 pb-4 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500 mt-1">Your latest transactions across all accounts</p>
            </div>
            <button 
              onClick={() => window.location.href = '/transactions'}
              className="text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors"
            >
              VIEW ALL ({dashboardData.recentTransactions.length}) TRANSACTIONS →
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
                  dashboardData.recentTransactions.map((tx, index) => (
                    <TransactionRow key={tx.id || index} transaction={tx} compact={false} />
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                      No transactions yet. Click + to add your first transaction.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAB button - show only, not working */}
        <button 
          disabled
          className="fixed bottom-8 right-8 bg-gray-300 cursor-not-allowed text-white p-4 rounded-full shadow-lg z-50"
          title="Add Transaction (Coming Soon)"
        >
          <Plus size={24} />
        </button>
      </div>
    </Layout>
  );
};

export default Dashboard;