// src/pages/Budget.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import BudgetCard from '../components/BudgetCard';
import { Plus, TrendingDown, PiggyBank, AlertCircle, X } from 'lucide-react';
import axios from 'axios';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
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
   

  // Categories mapping with proper names
  const fetchCategories = async () => {
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
      console.log('GET CATEGORIES ERROR:', err);
    }
  };

  // Get category name from ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : null;
  };

  const fetchBudgets = async () => {
    setLoading(true);
    
    try {
      if (!backendUrl) {
  console.error("❌ VITE_BACKEND_URL is not defined");
}
      const res = await axios.get(`${backendUrl}/api/budget/1`);
      console.log('=== FULL RESPONSE ===', res.data);
      
      let budgetsData = [];
      let summaryData = null;
      
      if (res.data.data) {
        budgetsData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        summaryData = res.data.summary;
      } else if (Array.isArray(res.data)) {
        budgetsData = res.data;
      } else if (res.data.budgets) {
        budgetsData = res.data.budgets;
        summaryData = res.data.summary;
      } else {
        budgetsData = [res.data];
      }
      
      // Build budgets with proper category names
      const budgetsWithCategoryName = budgetsData.map(budget => {
        let categoryName = getCategoryName(budget.categoryId);
        
        // If category not found in our list, try to get from budget object directly
        if (!categoryName && budget.category) {
          categoryName = budget.category;
        }
        
        // Last resort - use categoryId
        if (!categoryName) {
          categoryName = `Category ${budget.categoryId}`;
        }
        
        return {
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: categoryName,
          category: categoryName, // Add this for BudgetCard
          limitAmount: budget.limitAmount || 0,
          spentAmount: budget.spentAmount || 0,
          remainingAmount: budget.remainingAmount || (budget.limitAmount - budget.spentAmount),
          percentageUsed: budget.percentageUsed || (budget.limitAmount > 0 ? (budget.spentAmount / budget.limitAmount) * 100 : 0),
          status: budget.status || (budget.spentAmount > budget.limitAmount ? 'EXCEEDED' : 'WITHIN_LIMIT'),
          month: budget.month,
          year: budget.year
        };
      });
      
      console.log('Budgets with names:', budgetsWithCategoryName);
      setBudgets(Array.isArray(budgetsWithCategoryName) ? budgetsWithCategoryName : []);
      
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
      console.log('GET ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
  }, []);

  const overBudget = budgets.filter(b => b.spentAmount > b.limitAmount);

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
    try {
      const payload = {
        categoryId: Number(formData.categoryId),
        limitAmount: Number(formData.limitAmount),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      };
      
      console.log('Sending payload:', payload);

     
      const response = await axios.post(`${backendUrl}/api/budget/1`, payload);
      setTimeout(() => {
  fetchBudgets();
}, 300);
      console.log('Post response:', response.data);
      
      await fetchBudgets();
      
      setFormData({
        categoryId: '',
        limitAmount: ''
      });
      setShowForm(false);
      
    } catch (error) {
      console.log("error is ", error);
      alert(error.response?.data?.message || "Failed to add budget");
    } finally {
      setLoading(false);
    }
  };

  if (loading && budgets.length === 0) {
    return (
      <Layout>
        <div className="p-8 pt-24 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading budgets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 pt-24 bg-white">
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
                  ${summary.totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                {summary.overallPercentage >= 100 ? 'Over Budget' : summary.overallPercentage >= 80 ? 'Near Limit' : 'On Track'}
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">{Math.round(summary.overallPercentage)}% of monthly limit reached</span>
                <span className="font-bold text-gray-900">
                  ${summary.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 
                  ${summary.totalLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(summary.overallPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {overBudget.length > 0 && (
            <div className="bg-red-50 p-8 rounded-xl border border-red-200">
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
              <button className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
                Adjust Budget
              </button>
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold text-emerald-600 mb-6">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(budgets) && budgets.map((budget) => (
            <BudgetCard 
              key={budget.id} 
              budget={{
                ...budget,
                category: budget.categoryName,
                limitAmount: budget.limitAmount,
                spentAmount: budget.spentAmount,
                remainingAmount: budget.remainingAmount,
                percentageUsed: budget.percentageUsed,
                status: budget.status
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
                You have {budgets.length} budget categories with a total limit of ${summary.totalLimit.toLocaleString()}.
                You've utilized {Math.round(summary.overallPercentage)}% of your total budget.
              </p>
              <div className="flex gap-4">
                <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
                  <TrendingDown size={14} /> {Math.round(summary.overallPercentage)}% Used
                </div>
                <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold">
                  <PiggyBank size={14} /> Remaining: ${summary.totalRemaining.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 relative h-48 flex items-end justify-between px-4 pb-4 bg-gray-50 rounded-xl">
              {budgets.slice(0, 7).map((budget, i) => {
                const percentage = budget.percentageUsed || 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className="w-8 bg-emerald-200 rounded-t-lg transition-all hover:bg-emerald-300 cursor-pointer"
                      style={{ height: `${Math.min(percentage, 100)}%` }}
                      title={`${budget.categoryName}: ${percentage.toFixed(1)}%`}
                    ></div>
                    <span className="text-xs text-gray-500">{budget.categoryName?.substring(0, 3)}</span>
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