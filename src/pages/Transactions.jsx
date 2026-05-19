// src/pages/Transactions.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import TransactionRow from '../components/TransactionRow';
import TransactionForm from '../components/TransactionForm';
import { Download, Plus, Calendar, Filter, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../authcontext/AuthContext';

// Category to ID mapping (must match backend)
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

// Reverse mapping for ID to category
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
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last30');
  const itemsPerPage = 8;

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

  // Fetch transactions with authentication
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
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

      console.log(`Fetching transactions for user: ${userId}`);
      
      const client = apiClient();
      const response = await client.get(`/api/transaction/users/${userId}`);
      
      console.log('Fetched transactions:', response.data);
      
      let transactionsData = [];
      
      // Safely extract data
      if (response.data && response.data.data) {
        transactionsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (response.data && Array.isArray(response.data)) {
        transactionsData = response.data;
      } else if (response.data && response.data.transactions) {
        transactionsData = response.data.transactions;
      } else if (response.data) {
        transactionsData = [response.data];
      }
      
      // Safely map transactions with proper error handling
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
      setInitialLoading(false);
    }
  }, [backendUrl, apiClient, getUserId]);

  // Load transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Add new transaction with validation
  const handleNewTransaction = async (transaction) => {
    console.log('New transaction:', transaction);
    
    // Validate transaction data
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
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Session expired. Please login again.');
      window.location.href = '/login';
      return;
    }
    
    try {
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
      
      // Refresh transactions
      await fetchTransactions();
      setShowForm(false);
      
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

  // Filter transactions
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

  // Loading state
  if (initialLoading) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading transactions...</p>
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
                onClick={() => fetchTransactions()} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
              >
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
            {/* Export CSV button - show only, not working */}
            <button 
              disabled
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 cursor-not-allowed transition-colors"
              title="Export CSV (Coming Soon)"
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      </div>
                      <p className="mt-2">Loading transactions...</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
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