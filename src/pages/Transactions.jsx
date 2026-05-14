// src/pages/Transactions.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import TransactionRow from '../components/TransactionRow';
import TransactionForm from '../components/TransactionForm';
import { Download, Plus, Calendar, Filter, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import axios from 'axios';

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

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const itemsPerPage = 8;

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = 1; 
     const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/transaction/users/${userId}`);
      console.log('Fetched transactions:', response.data);
      
      let transactionsData = [];
      if (response.data && response.data.data) {
        transactionsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (response.data && Array.isArray(response.data)) {
        transactionsData = response.data;
      } else if (response.data) {
        transactionsData = [response.data];
      }
      
      const safeTransactions = transactionsData.map(t => ({
        id: t.id || Date.now(),
        description: t.description || 'No description',
        category: t.category || 'Uncategorized',
        type: t.type || 'EXPENSE',
        amount: t.amount || 0,
        transactiondate: t.transactiondate || t.date || new Date().toISOString().split('T')[0],
        categoryId: t.categoryId
      }));
      
      setTransactions(safeTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions. Please check if backend is running.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new transaction
  const handleNewTransaction = async (transaction) => {
    console.log('New transaction:', transaction);
    
    try {
      const categoryId = CATEGORY_TO_ID[transaction.category] || 0;
      
      const payload = {
        amount: Number(transaction.amount),
        type: transaction.type,
        category: transaction.category,
        categoryId: categoryId,
        description: transaction.description,
        date: transaction.date || new Date().toISOString().split('T')[0]
      };
      
      console.log('Sending payload with categoryId:', payload);
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/api/transaction/1`, payload);
      console.log('Transaction saved:', response.data);
      
      await fetchTransactions();
      setShowForm(false);
      console.log('Transaction created successfully!');
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create transaction';
      alert(`Error: ${errorMsg}`);
    }
  };

  const exportToCSV = () => {
    console.log('CSV export feature coming soon!');
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => (t.type?.toLowerCase() || t.type) === filterType);
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (error) {
    return (
      <Layout>
        <div className="p-8 pt-24">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <button onClick={fetchTransactions} className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 pt-24 bg-white">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Transaction History</h2>
            <p className="text-gray-500">A curated record of your financial movements.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportToCSV} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus size={16} /> New Transaction
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              All ({transactions.length})
            </button>
            <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'income' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Income ({transactions.filter(t => t.type?.toLowerCase() === 'income').length})
            </button>
            <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'expense' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Expense ({transactions.filter(t => t.type?.toLowerCase() === 'expense').length})
            </button>
          </div>
          
          <div className="flex-1">
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
              </select>
            </div>
          </div>
          
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Filter size={18} />
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
                    <p className="mt-2">Loading transactions...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No transactions found. Click "New Transaction" to add one.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="px-6 py-6 border-t border-gray-100 flex justify-between items-center">
              <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} transactions</p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-lg ${currentPage === page ? 'bg-emerald-600 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Insights Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 bg-emerald-50 p-8 rounded-xl relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Spending Insight</h3>
              <p className="text-gray-600 text-sm mb-6">You've spent 12% more on Dining compared to last month. Consider reviewing your weekly caps.</p>
              <a href="#" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:gap-3 transition-all">View Analysis <TrendingUp size={14} /></a>
            </div>
          </div>
          
          <div className="col-span-2 bg-gray-50 p-8 rounded-xl flex items-center justify-between border border-gray-200">
            <div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Secure Export Ready</h3>
              <p className="text-gray-600 text-sm">Your Q3 tax summary has been compiled and is ready for your accountant.</p>
            </div>
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform">Download Report</button>
          </div>
        </div>
      </div>
      
      {showForm && <TransactionForm onSubmit={handleNewTransaction} onClose={() => setShowForm(false)} />}
    </Layout>
  );
};

export default Transactions;