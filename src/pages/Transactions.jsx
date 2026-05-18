// src/pages/Transactions.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import TransactionRow from '../components/TransactionRow';
import TransactionForm from '../components/TransactionForm';
import { Download, Plus, Calendar, Filter, ChevronLeft, ChevronRight, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../authcontext/AuthContext';

// ✅ Category to ID mapping (must match backend)
const CATEGORY_TO_ID = {
  'Dinner': 1,
  'Driving': 2,
  'Shopping': 3,
  'Entertainment': 4,
  'Utilities': 5,
  'Groceries': 6,
  'Transportation': 7,
  'Healthcare': 8,
  'Education': 9,
  'Rent': 10
};

// ✅ Reverse mapping for ID to category
const ID_TO_CATEGORY = {
  1: 'Dinner',
  2: 'Driving',
  3: 'Shopping',
  4: 'Entertainment',
  5: 'Utilities',
  6: 'Groceries',
  7: 'Transportation',
  8: 'Healthcare',
  9: 'Education',
  10: 'Rent'
};

const Transactions = () => {
  const { user, isAuthenticated, refreshToken, logout, getSessionStatus } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last30');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const itemsPerPage = 8;

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // ✅ Create axios instance with auth interceptor
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
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshed = await refreshToken();
            if (refreshed) {
              const newToken = localStorage.getItem("token");
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          } catch (refreshError) {
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

  // ✅ Check session periodically
  useEffect(() => {
    const checkSession = () => {
      const status = getSessionStatus();
      setSessionInfo(status);
      
      if (status.isActive && status.remainingSeconds && status.remainingSeconds <= 300) {
        console.warn(`⚠️ Session expires in ${Math.floor(status.remainingSeconds / 60)} minutes`);
      }
    };
    
    checkSession();
    const interval = setInterval(checkSession, 60000);
    
    return () => clearInterval(interval);
  }, [getSessionStatus]);

  // ✅ Get userId from user object or localStorage
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

  // ✅ Fetch transactions with authentication
  const fetchTransactions = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Check authentication
      if (!isAuthenticated || !isAuthenticated()) {
        setError('Authentication required. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      // Check token expiry before making request
      const sessionStatus = getSessionStatus();
      if (sessionStatus?.remainingSeconds && sessionStatus.remainingSeconds <= 0) {
        throw new Error('Token expired');
      }

      console.log(`Fetching transactions for user: ${userId}`);
      
      const client = apiClient();
      const response = await client.get(`/api/transaction/users/${userId}`);
      
      console.log('Fetched transactions:', response.data);
      
      let transactionsData = [];
      
      // ✅ Safely extract data
      if (response.data && response.data.data) {
        transactionsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (response.data && Array.isArray(response.data)) {
        transactionsData = response.data;
      } else if (response.data && response.data.transactions) {
        transactionsData = response.data.transactions;
      } else if (response.data) {
        transactionsData = [response.data];
      }
      
      // ✅ Safely map transactions with proper error handling
      const safeTransactions = transactionsData
        .filter(t => t && typeof t === 'object')
        .map(t => ({
          id: t.id || `temp-${Date.now()}-${Math.random()}`,
          description: t.description || t.merchant || 'No description',
          category: t.category || ID_TO_CATEGORY[t.categoryId] || 'Uncategorized',
          type: t.type || (t.amount > 0 ? 'INCOME' : 'EXPENSE'),
          amount: Math.abs(Number(t.amount) || 0),
          transactiondate: t.transactiondate || t.date || new Date().toISOString().split('T')[0],
          categoryId: t.categoryId,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        }));
      
      setTransactions(safeTransactions);
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 404) {
        setError('No transactions found. Create your first transaction!');
        setTransactions([]);
      } else if (error.response?.status === 403) {
        setError('You don\'t have permission to view these transactions.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(error.response?.data?.message || error.message || 'Failed to load transactions');
      }
      setTransactions([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setInitialLoading(false);
    }
  }, [backendUrl, apiClient, isAuthenticated, getUserId, getSessionStatus]);

  // Auto-refresh transactions every 5 minutes
  useEffect(() => {
    fetchTransactions();
    
    const intervalId = setInterval(() => {
      if (isAuthenticated && isAuthenticated()) {
        console.log("🔄 Auto-refreshing transactions...");
        fetchTransactions(true);
      }
    }, 300000);
    
    return () => clearInterval(intervalId);
  }, [fetchTransactions, isAuthenticated]);

  // ✅ Add new transaction with validation
  const handleNewTransaction = async (transaction) => {
    console.log('New transaction:', transaction);
    
    // ✅ Validate transaction data
    if (!transaction.amount || transaction.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!transaction.description?.trim()) {
      alert('Please enter a description');
      return;
    }
    
    if (!transaction.category) {
      alert('Please select a category');
      return;
    }
    
    if (!isAuthenticated || !isAuthenticated()) {
      alert('Session expired. Please login again.');
      window.location.href = '/login';
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const categoryId = CATEGORY_TO_ID[transaction.category];
      
      if (!categoryId) {
        console.error('Unknown category:', transaction.category);
        alert(`Unknown category: ${transaction.category}. Please select a valid category.`);
        return;
      }
      
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const payload = {
        amount: Number(transaction.amount),
        type: transaction.type.toUpperCase(),
        category: transaction.category,
        categoryId: categoryId,
        description: transaction.description.trim(),
        date: transaction.date || new Date().toISOString().split('T')[0],
        userId: userId
      };
      
      console.log('Sending payload:', payload);
      
      const client = apiClient();
      const response = await client.post(`/api/transaction/${userId}`, payload);
      
      console.log('Transaction saved:', response.data);
      
      // ✅ Refresh transactions
      await fetchTransactions();
      setShowForm(false);
      
      // Optional: Show success toast/notification
      // showSuccess('Transaction created successfully!');
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      
      let errorMessage = 'Failed to create transaction. ';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response) {
        errorMessage += error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'Unable to connect to server.';
      } else {
        errorMessage += error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  // ✅ Delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    if (!isAuthenticated || !isAuthenticated()) {
      alert('Session expired. Please login again.');
      window.location.href = '/login';
      return;
    }
    
    try {
      const userId = getUserId();
      const client = apiClient();
      await client.delete(`/api/transaction/${userId}/${transactionId}`);
      
      // Refresh transactions
      await fetchTransactions();
      
      // Optional: Show success message
      // showSuccess('Transaction deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  // ✅ Export to CSV with proper formatting
  const exportToCSV = () => {
    try {
      if (filtered.length === 0) {
        alert('No transactions to export');
        return;
      }
      
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
      const csvData = filtered.map(t => [
        t.transactiondate,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type,
        t.amount.toFixed(2)
      ]);
      
      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`Exported ${filtered.length} transactions to CSV`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const handleManualRefresh = async () => {
    await fetchTransactions(true);
  };

  // ✅ Filter transactions
  const filtered = React.useMemo(() => {
    let filteredData = [...transactions];
    
    // Filter by type
    if (filterType !== 'all') {
      filteredData = filteredData.filter(t => {
        const transactionType = (t.type || '').toLowerCase();
        return transactionType === filterType.toLowerCase();
      });
    }
    
    // Filter by date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(dateRange) {
      case 'last30':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        filteredData = filteredData.filter(t => new Date(t.transactiondate) >= thirtyDaysAgo);
        break;
      case 'last90':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        filteredData = filteredData.filter(t => new Date(t.transactiondate) >= ninetyDaysAgo);
        break;
      case 'thisYear':
        filteredData = filteredData.filter(t => new Date(t.transactiondate).getFullYear() === now.getFullYear());
        break;
      default:
        break;
    }
    
    // Sort by date (newest first)
    return filteredData.sort((a, b) => new Date(b.transactiondate) - new Date(a.transactiondate));
  }, [transactions, filterType, dateRange]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, dateRange]);

  // ✅ Statistics
  const stats = React.useMemo(() => {
    const income = filtered.filter(t => t.type?.toLowerCase() === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered.filter(t => t.type?.toLowerCase() === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filtered]);

  // Loading state
  if (initialLoading) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading transactions...</p>
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

  // Error state
  if (error && transactions.length === 0) {
    return (
      <Layout>
        <div className="p-8 pt-24 min-h-screen">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-6 rounded-xl max-w-md mx-auto text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <p className="font-bold text-lg mb-2">Error Loading Transactions</p>
            <p className="text-sm mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={handleManualRefresh} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <button 
                onClick={() => setShowForm(true)} 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Create Transaction
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
              <span>⏰</span>
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
        
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Transaction History</h2>
            <p className="text-gray-500">A curated record of your financial movements.</p>
            {transactions.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {filtered.length} of {transactions.length} transactions shown
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Refresh transactions"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button 
              onClick={exportToCSV} 
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={16} /> Export CSV
            </button>
            <button 
              onClick={() => setShowForm(true)} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={16} /> New Transaction
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-sm text-gray-600 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-emerald-600">${stats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-100">
            <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">${stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">Net Balance</p>
            <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {['all', 'income', 'expense'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} 
                <span className="ml-1 text-xs opacity-75">
                  ({type === 'all' ? transactions.length : transactions.filter(t => t.type?.toLowerCase() === type).length})
                </span>
              </button>
            ))}
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="thisYear">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Filter size={18} />
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Description</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Category</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 text-right">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      </div>
                      <p className="mt-2">Loading transactions...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {filterType !== 'all' 
                        ? `No ${filterType} transactions found in this period.` 
                        : 'No transactions found. Click "New Transaction" to add one.'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((tx, index) => (
                    <TransactionRow 
                      key={tx.id || index} 
                      transaction={tx}
                      onDelete={() => handleDeleteTransaction(tx.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-6 py-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} transactions
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum > totalPages) return null;
                  }
                  return pageNum <= totalPages && (
                    <button 
                      key={pageNum} 
                      onClick={() => setCurrentPage(pageNum)} 
                      className={`w-10 h-10 rounded-lg transition-colors ${
                        currentPage === pageNum 
                          ? 'bg-emerald-600 text-white' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 bg-emerald-50 p-8 rounded-xl relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Spending Insight</h3>
              <p className="text-gray-600 text-sm mb-6">
                {stats.expense > 0 
                  ? `Your total expenses this period are $${stats.expense.toLocaleString()}. ${stats.expense > stats.income ? 'Consider reviewing your spending habits.' : 'Great job keeping expenses under control!'}`
                  : 'Add some transactions to get spending insights.'}
              </p>
              <a href="/budget" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:gap-3 transition-all">
                View Analysis <TrendingUp size={14} />
              </a>
            </div>
          </div>
          
          <div className="col-span-2 bg-gray-50 p-8 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-200">
            <div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Secure Export Ready</h3>
              <p className="text-gray-600 text-sm">Your transaction history can be exported for tax purposes.</p>
            </div>
            <button 
              onClick={exportToCSV}
              disabled={filtered.length === 0}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Download Report ({filtered.length} transactions)
            </button>
          </div>
        </div>
      </div>
      
      {showForm && (
        <TransactionForm 
          onSubmit={handleNewTransaction} 
          onClose={() => setShowForm(false)} 
        />
      )}
    </Layout>
  );
};

export default Transactions;