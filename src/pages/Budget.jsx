// src/pages/Budget.js
import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import BudgetCard from '../components/BudgetCard';
import { Plus, TrendingDown, PiggyBank, AlertCircle, X } from 'lucide-react';
import axios from 'axios';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // ✅ Add error state
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

  // Categories mapping with proper names
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesList = [
        { id: 1, name: 'Dinner' },
        { id: 2, name: 'Driving' },
        { id: 3, name: 'Shopping' },
        { id: 4, name: 'Entertainment' },
        { id: 5, name: 'Utilities' },
        { id: 6, name: 'Groceries' },
        { id: 7, name: 'Transportation' },
        { id: 8, name: 'Healthcare' },
        { id: 9, name: 'Education' },
        { id: 10, name: 'Rent' }
      ];
      setCategories(categoriesList);
    } catch (err) {
      console.error('GET CATEGORIES ERROR:', err);
      setError('Failed to load categories');
    }
  }, []);

  // Get category name from ID
  const getCategoryName = useCallback((categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : null;
  }, [categories]);

  // ✅ Wrap fetchBudgets in useCallback to prevent infinite loops
  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      if (!backendUrl) {
        console.error("❌ Missing backend URL");
        setError("Backend URL is not configured");
        setLoading(false);
        return;
      }
      
      const res = await axios.get(`${backendUrl}/api/budget/1`);
      console.log('=== FULL RESPONSE ===', res.data);
      
      let budgetsData = [];
      let summaryData = null;
      
      if (res.data?.data) {
        budgetsData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        summaryData = res.data.summary;
      } else if (Array.isArray(res.data)) {
        budgetsData = res.data;
      } else if (res.data?.budgets) {
        budgetsData = res.data.budgets;
        summaryData = res.data.summary;
      } else if (res.data) {
        budgetsData = [res.data];
      }
      
      // ✅ Safe mapping with null checks
      const budgetsWithCategoryName = budgetsData
        .filter(budget => budget) // Remove null/undefined
        .map(budget => {
          let categoryName = getCategoryName(budget.categoryId);
          
          if (!categoryName && budget.category) {
            categoryName = budget.category;
          }
          
          if (!categoryName) {
            categoryName = `Category ${budget.categoryId || 'Unknown'}`;
          }
          
          const limitAmount = budget.limitAmount || 0;
          const spentAmount = budget.spentAmount || 0;
          const remainingAmount = budget.remainingAmount || (limitAmount - spentAmount);
          const percentageUsed = budget.percentageUsed || (limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0);
          
          return {
            id: budget.id || Math.random(),
            categoryId: budget.categoryId,
            categoryName: categoryName,
            category: categoryName,
            limitAmount: limitAmount,
            spentAmount: spentAmount,
            remainingAmount: remainingAmount,
            percentageUsed: percentageUsed,
            status: budget.status || (spentAmount > limitAmount ? 'EXCEEDED' : 'WITHIN_LIMIT'),
            month: budget.month,
            year: budget.year
          };
        });
      
      console.log('Budgets with names:', budgetsWithCategoryName);
      setBudgets(budgetsWithCategoryName);
      
      // Use summary from backend if available
      if (summaryData) {
        setSummary({
          totalSpent: summaryData.totalSpent || 0,
          totalLimit: summaryData.totalLimit || 0,
          totalRemaining: summaryData.totalRemaining || (summaryData.totalLimit - summaryData.totalSpent),
          overallPercentage: summaryData.overallPercentage || 
                             (summaryData.totalLimit > 0 ? (summaryData.totalSpent / summaryData.totalLimit) * 100 : 0)
        });
      } else {
        // Fallback calculation
        const totalSpent = budgetsWithCategoryName.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
        const totalLimit = budgetsWithCategoryName.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
        setSummary({
          totalSpent: totalSpent,
          totalLimit: totalLimit,
          totalRemaining: totalLimit - totalSpent,
          overallPercentage: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
        });
      }
      
    } catch (err) {
      console.error('GET ERROR:', err);
      setError(err.response?.data?.message || err.message || "Failed to fetch budgets");
      // ✅ Set empty budgets on error instead of breaking
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [getCategoryName]); // ✅ Add getCategoryName as dependency

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
  }, [fetchCategories, fetchBudgets]); // ✅ Add proper dependencies

  // ✅ Safe calculation with null check
  const overBudget = budgets.filter(b => b && b.spentAmount > b.limitAmount);

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
    
    setLoading(true);
    setError(null);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      if (!backendUrl) {
        throw new Error("Backend URL is not configured");
      }
      
      const payload = {
        categoryId: Number(formData.categoryId),
        limitAmount: Number(formData.limitAmount),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      };
      
      console.log('Sending payload:', payload);
      const response = await axios.post(`${backendUrl}/api/budget/1`, payload);
      console.log('Post response:', response.data);
      
      // ✅ Only call fetchBudgets once
      await fetchBudgets();
      
      setFormData({
        categoryId: '',
        limitAmount: ''
      });
      setShowForm(false);
      
    } catch (error) {
      console.error("Error adding budget:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to add budget";
      alert(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading state
  if (loading && budgets.length === 0) {
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

  // ✅ Error state
  if (error && budgets.length === 0) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Budgets</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button 
              onClick={fetchBudgets}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-black">Monthly Budget</h2>
          <p className="text-gray-500">Your curated financial outlook for {new Date().toLocaleString('default', { month: 'long' })}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="md:col-span-2 bg-white p-8 rounded-xl border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-500">Total Remaining</span>
                <div className="text-5xl font-bold text-emerald-600 mt-2">
                  ${(summary.totalRemaining || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                {(summary.overallPercentage || 0) >= 100 ? 'Over Budget' : (summary.overallPercentage || 0) >= 80 ? 'Near Limit' : 'On Track'}
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">{Math.round(summary.overallPercentage || 0)}% of monthly limit reached</span>
                <span className="font-bold text-gray-900">
                  ${(summary.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 
                  ${(summary.totalLimit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(summary.overallPercentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {overBudget.length > 0 && overBudget[0] && (
            <div className="bg-red-50 p-8 rounded-xl border border-red-200">
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertCircle size={16} />
                <span className="font-bold uppercase text-xs">Budget Alert</span>
              </div>
              <h3 className="text-xl font-bold text-red-800 leading-tight">
                {overBudget[0].categoryName || 'Category'} exceeds limit
              </h3>
              <p className="text-red-600 text-sm mb-4">
                You've spent ${((overBudget[0].spentAmount || 0) - (overBudget[0].limitAmount || 0)).toLocaleString()} over your ${(overBudget[0].limitAmount || 0).toLocaleString()} allocation.
              </p>
              <button className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
                Adjust Budget
              </button>
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold text-emerald-600 mb-6">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(budgets) && budgets.map((budget) => (
            budget && <BudgetCard 
              key={budget.id || Math.random()} 
              budget={{
                ...budget,
                category: budget.categoryName,
                limitAmount: budget.limitAmount || 0,
                spentAmount: budget.spentAmount || 0,
                remainingAmount: budget.remainingAmount || 0,
                percentageUsed: budget.percentageUsed || 0,
                status: budget.status || 'WITHIN_LIMIT'
              }} 
            />
          ))}
          
          <button 
            onClick={() => setShowForm(true)}
            className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-transform">
              <Plus size={24} className="text-emerald-600" />
            </div>
            <span className="font-bold text-emerald-600">Add Category</span>
          </button>
        </div>

        {/* Rest of the form and insights sections remain the same */}
        {showForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-emerald-600">Add New Category</h3>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
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
                        {category.name}
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
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-opacity disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-8 mt-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2">
              <h3 className="text-xl font-bold text-emerald-600 mb-4">Spending Insights</h3>
              <p className="text-gray-600 mb-6">
                You have {budgets.length} budget categories with a total limit of ${(summary.totalLimit || 0).toLocaleString()}.
                You've utilized {Math.round(summary.overallPercentage || 0)}% of your total budget.
              </p>
              <div className="flex gap-4">
                <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
                  <TrendingDown size={14} /> {Math.round(summary.overallPercentage || 0)}% Used
                </div>
                <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
                  <PiggyBank size={14} /> Remaining: ${(summary.totalRemaining || 0).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 relative h-48 flex items-end justify-between px-4 pb-4 bg-gray-50 rounded-xl">
              {budgets.filter(b => b).slice(0, 7).map((budget, i) => {
                const percentage = budget?.percentageUsed || 0;
                const categoryName = budget?.categoryName || 'Unknown';
                return (
                  <div key={budget?.id || i} className="flex flex-col items-center gap-2">
                    <div
                      className="w-8 bg-emerald-200 rounded-t-lg transition-all hover:bg-emerald-300 cursor-pointer"
                      style={{ height: `${Math.min(percentage, 100)}%`, minHeight: '4px' }}
                      title={`${categoryName}: ${percentage.toFixed(1)}%`}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {categoryName.substring(0, 3)}
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