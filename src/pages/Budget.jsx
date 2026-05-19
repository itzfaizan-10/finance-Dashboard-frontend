// src/pages/Budget.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import BudgetCard from '../components/BudgetCard';
import { Plus, TrendingDown, PiggyBank, AlertCircle, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../authcontext/AuthContext';

const Budget = () => {
  const { user, logout } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalSpent: 0,
    totalLimit: 0,
    totalRemaining: 0,
    overallPercentage: 0
  });
  const [formData, setFormData] = useState({
    categoryId: '',
    limitAmount: ''
  });

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

  // Get user ID from auth context
  const getUserId = useCallback(() => {
    if (!user) return null;
    return user.userId || user.id || user.sub;
  }, [user]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const client = apiClient();
      try {
        const response = await client.get('/api/categories');
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
          return;
        }
      } catch (err) {
        console.log('Using fallback categories');
      }
      
      // Fallback categories
      const categoriesList = [
        { id: 1, name: 'Dinner', icon: '🍽️' },
        { id: 2, name: 'Driving', icon: '🚗' },
        { id: 3, name: 'Shopping', icon: '🛍️' },
        { id: 4, name: 'Entertainment', icon: '🎬' },
        { id: 5, name: 'Utilities', icon: '💡' },
        { id: 6, name: 'Groceries', icon: '🛒' },
        { id: 7, name: 'Transportation', icon: '🚌' },
        { id: 8, name: 'Healthcare', icon: '🏥' },
        { id: 9, name: 'Education', icon: '📚' },
        { id: 10, name: 'Rent', icon: '🏠' }
      ];
      setCategories(categoriesList);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  }, [apiClient]);

  // Get category name from ID
  const getCategoryName = useCallback((categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : null;
  }, [categories]);

  // Array of distinct, high-contrast bar colors for the graph
  const barColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-violet-500'
  ];

  // Get border color based on percentage (keeping for reference but not used in graph)
  const getBorderColor = (percentage) => {
    if (percentage >= 100) return 'border-red-400';
    if (percentage >= 80) return 'border-yellow-400';
    if (percentage >= 50) return 'border-emerald-400';
    return 'border-green-400';
  };

  // Fetch budgets with authentication
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const userId = getUserId();
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      if (!backendUrl) {
        throw new Error("Backend URL is not configured");
      }
      
      const client = apiClient();
      const response = await client.get(`/api/budget/${userId}`);
      
      console.log('Budget response:', response.data);
      
      let budgetsData = [];
      let summaryData = null;
      
      // Parse response data
      if (response.data?.data) {
        budgetsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        summaryData = response.data.summary;
      } else if (Array.isArray(response.data)) {
        budgetsData = response.data;
      } else if (response.data?.budgets) {
        budgetsData = response.data.budgets;
        summaryData = response.data.summary;
      } else if (response.data) {
        budgetsData = [response.data];
      }
      
      // Transform budgets with category names and use backend percentage
      const budgetsWithCategoryName = budgetsData
        .filter(budget => budget)
        .map(budget => {
          let categoryName = getCategoryName(budget.categoryId);
          
          if (!categoryName && budget.category) {
            categoryName = budget.category;
          }
          
          if (!categoryName) {
            categoryName = `Category ${budget.categoryId || 'Unknown'}`;
          }
          
          const limitAmount = Number(budget.limitAmount) || 0;
          const spentAmount = Number(budget.spentAmount) || 0;
          const remainingAmount = budget.remainingAmount !== undefined ? 
            Number(budget.remainingAmount) : limitAmount - spentAmount;
          
          // Use percentage from backend if available, otherwise calculate
          let percentageUsed = budget.percentageUsed !== undefined ?
            Number(budget.percentageUsed) : (limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0);
          
          // Round to 1 decimal place
          percentageUsed = Math.round(percentageUsed * 10) / 10;
          
          return {
            id: budget.id || `budget_${Date.now()}_${Math.random()}`,
            categoryId: budget.categoryId,
            categoryName: categoryName,
            category: categoryName,
            limitAmount: limitAmount,
            spentAmount: spentAmount,
            remainingAmount: Math.max(0, remainingAmount),
            percentageUsed: Math.min(100, percentageUsed),
            status: budget.status || (spentAmount > limitAmount ? 'EXCEEDED' : 
                     percentageUsed >= 90 ? 'WARNING' : 'WITHIN_LIMIT'),
            month: budget.month || new Date().getMonth() + 1,
            year: budget.year || new Date().getFullYear()
          };
        });
      
      setBudgets(budgetsWithCategoryName);
      
      // Update summary
      if (summaryData) {
        setSummary({
          totalSpent: Number(summaryData.totalSpent) || 0,
          totalLimit: Number(summaryData.totalLimit) || 0,
          totalRemaining: Number(summaryData.totalRemaining) || 0,
          overallPercentage: Number(summaryData.overallPercentage) || 0
        });
      } else {
        // Calculate summary from budgets
        const totalSpent = budgetsWithCategoryName.reduce((sum, b) => sum + b.spentAmount, 0);
        const totalLimit = budgetsWithCategoryName.reduce((sum, b) => sum + b.limitAmount, 0);
        setSummary({
          totalSpent: totalSpent,
          totalLimit: totalLimit,
          totalRemaining: totalLimit - totalSpent,
          overallPercentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
        });
      }
      
    } catch (err) {
      console.error('Error fetching budgets:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 404) {
        // No budgets found - this is fine, just show empty state
        setBudgets([]);
        setError(null);
      } else {
        setError(err.response?.data?.message || err.message || "Failed to fetch budgets");
        setBudgets([]);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [backendUrl, apiClient, getUserId, getCategoryName]);

  // Load budgets on mount
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Calculate over budget categories safely
  const overBudget = budgets.filter(b => b && b.spentAmount > b.limitAmount);
  const warningBudget = budgets.filter(b => b && b.percentageUsed >= 80 && b.percentageUsed < 100);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.limitAmount) {
      alert("Please fill all fields");
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Your session has expired. Please login again.");
      window.location.href = '/login';
      return;
    }
    
    const userId = getUserId();
    if (!userId) {
      alert("User not found. Please login again.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!backendUrl) {
        throw new Error("Backend URL is not configured");
      }
      
      const client = apiClient();
      const payload = {
        categoryId: Number(formData.categoryId),
        limitAmount: Number(formData.limitAmount),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        userId: userId
      };
      
      console.log('Creating budget:', payload);
      const response = await client.post(`/api/budget/${userId}`, payload);
      console.log('Budget created:', response.data);
      
      // Refresh budgets list
      await fetchBudgets();
      
      // Reset form
      setFormData({
        categoryId: '',
        limitAmount: ''
      });
      setShowForm(false);
      
    } catch (error) {
      console.error("Error adding budget:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to add budget";
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!confirm('Are you sure you want to delete this budget category?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = '/login';
      return;
    }
    
    setLoading(true);
    
    try {
      const userId = getUserId();
      const client = apiClient();
      await client.delete(`/api/budget/${userId}/${budgetId}`);
      
      // Refresh budgets
      await fetchBudgets();
      
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert(error.response?.data?.message || "Failed to delete budget");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading budgets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error && budgets.length === 0) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Budgets</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <div className="space-x-3">
              <button 
                onClick={fetchBudgets}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center gap-2"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Go to Dashboard
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
        {/* Header - Removed refresh button */}
        <div className="mb-10">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-black">Monthly Budget</h2>
            <p className="text-gray-500">
              Your curated financial outlook for {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}.
            </p>
          </div>
        </div>

        {/* Summary Cards with minimal border and light green */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="md:col-span-2 bg-white p-8 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-500">Total Remaining</span>
                <div className="text-5xl font-bold text-emerald-600 mt-2">
                  ${summary.totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                summary.overallPercentage >= 100 ? 'bg-red-100 text-red-700' :
                summary.overallPercentage >= 80 ? 'bg-yellow-100 text-yellow-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {summary.overallPercentage >= 100 ? 'Over Budget' : 
                 summary.overallPercentage >= 80 ? 'Near Limit' : 'On Track'}
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">{summary.overallPercentage.toFixed(1)}% of monthly limit reached</span>
                <span className="font-bold text-gray-900">
                  ${summary.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })} / 
                  ${summary.totalLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.overallPercentage >= 100 ? 'bg-red-500' :
                    summary.overallPercentage >= 80 ? 'bg-yellow-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(summary.overallPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Alert Card */}
          {overBudget.length > 0 && (
            <div className="bg-red-50 p-8 rounded-xl border border-red-200 shadow-sm">
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertCircle size={16} />
                <span className="font-bold uppercase text-xs">Budget Alert</span>
              </div>
              <h3 className="text-xl font-bold text-red-800 leading-tight">
                {overBudget[0].categoryName} exceeds limit
              </h3>
              <p className="text-red-600 text-sm mb-4">
                You've spent ${(overBudget[0].spentAmount - overBudget[0].limitAmount).toLocaleString()} over your ${overBudget[0].limitAmount.toLocaleString()} allocation.
              </p>
              <button 
                onClick={() => handleDeleteBudget(overBudget[0].id)}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Adjust Budget
              </button>
            </div>
          )}

          {/* Warning Card */}
          {warningBudget.length > 0 && overBudget.length === 0 && (
            <div className="bg-yellow-50 p-8 rounded-xl border border-yellow-200 shadow-sm">
              <div className="flex items-center gap-2 text-yellow-600 mb-4">
                <AlertCircle size={16} />
                <span className="font-bold uppercase text-xs">Warning</span>
              </div>
              <h3 className="text-xl font-bold text-yellow-800 leading-tight">
                {warningBudget[0].categoryName} near limit
              </h3>
              <p className="text-yellow-600 text-sm mb-4">
                You've used {warningBudget[0].percentageUsed.toFixed(1)}% of your ${warningBudget[0].limitAmount.toLocaleString()} budget.
              </p>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <h3 className="text-2xl font-bold text-emerald-600 mb-6">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard 
              key={budget.id} 
              budget={budget}
              onDelete={() => handleDeleteBudget(budget.id)}
            />
          ))}
          
          <button 
            onClick={() => setShowForm(true)}
            className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center gap-3 hover:bg-emerald-50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white border border-emerald-200 flex items-center justify-center transition-transform group-hover:scale-110">
              <Plus size={24} className="text-emerald-600" />
            </div>
            <span className="font-bold text-emerald-600">Add Category</span>
            <span className="text-xs text-gray-400">Set budget limit for a category</span>
          </button>
        </div>

        {/* Add Budget Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-emerald-600">Add New Category</h3>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Category Name</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon && `${category.icon} `}{category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Budget Limit ($)</label>
                  <input
                    type="number"
                    name="limitAmount"
                    value={formData.limitAmount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Insights Section with colored graph bars - UPDATED: added border and distinct bar colors */}
        <div className="bg-white rounded-xl border border-gray-300 p-8 mt-10 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2">
              <h3 className="text-xl font-bold text-emerald-600 mb-4">Spending Insights</h3>
              <p className="text-gray-600 mb-6">
                You have {budgets.length} budget categories with a total limit of ${summary.totalLimit.toLocaleString()}.
                You've utilized {summary.overallPercentage.toFixed(1)}% of your total budget.
              </p>
              <div className="flex gap-4">
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold border border-emerald-200">
                  <TrendingDown size={14} /> {summary.overallPercentage.toFixed(1)}% Used
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold border border-emerald-200">
                  <PiggyBank size={14} /> Remaining: ${summary.totalRemaining.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* Graph container with border and contrasting bar colors */}
            <div className="w-full md:w-1/2 relative h-48 flex items-end justify-between px-4 pb-4 bg-gray-50 rounded-xl border border-gray-300 shadow-inner">
              {budgets.slice(0, 7).map((budget, i) => {
                const percentage = budget.percentageUsed;
                // Use a distinct color from the array based on index
                const barColor = barColors[i % barColors.length];
                // Add a subtle border to each bar for definition
                const borderColor = 'border border-gray-400';
                
                return (
                  <div key={budget.id} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-full max-w-[40px] ${barColor} ${borderColor} rounded-t-lg transition-all hover:opacity-80 cursor-pointer`}
                      style={{ height: `${Math.min(percentage, 100)}%`, minHeight: '4px' }}
                      title={`${budget.categoryName}: ${percentage.toFixed(1)}%`}
                    />
                    <span className="text-xs text-gray-600 truncate max-w-[50px] text-center font-medium">
                      {budget.categoryName.substring(0, 3)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Budget;