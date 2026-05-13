// src/components/BudgetCard.js
import React from 'react';

const BudgetCard = ({ budget }) => {
 const percent = budget.percentageUsed ?? 0;
 const leftBudget = budget.remainingAmount ?? 0;
 const isOver = budget.status === 'EXCEEDED' || percent > 100;
 
 // Get category name - remove ID numbers and show actual names
 const getCategoryDisplayName = (categoryName) => {
   if (!categoryName) return 'Other';
   
   // Remove any ID numbers like "1 ", "5 " etc.
   let displayName = categoryName.replace(/^\d+\s*/, '');
   
   // Map common categories to clean names
   const categoryMap = {
     'Dinner': 'Dinner',
     'Driving': 'Driving',
     'Utilities': 'Utilities',
     'Entertainment': 'Entertainment',
     'Shopping': 'Shopping',
     'Groceries': 'Groceries',
     'Transportation': 'Transportation',
     'Healthcare': 'Healthcare',
     'Education': 'Education',
     'Rent': 'Rent'
   };
   
   return categoryMap[displayName] || displayName;
 };
 
 // Get appropriate emoji for category
 const getCategoryEmoji = (categoryName) => {
   if (!categoryName) return '💰';
   
   const name = categoryName.toLowerCase();
   if (name.includes('dinner') || name.includes('food')) return '🍽️';
   if (name.includes('driving') || name.includes('transport')) return '🚗';
   if (name.includes('utility')) return '💡';
   if (name.includes('entertainment')) return '🎬';
   if (name.includes('shopping')) return '🛍️';
   if (name.includes('grocery')) return '🛒';
   if (name.includes('health')) return '🏥';
   if (name.includes('education')) return '📚';
   if (name.includes('rent')) return '🏠';
   return '💰';
 };
 
 const displayName = getCategoryDisplayName(budget.category);
 const emoji = getCategoryEmoji(budget.category);
  
  return (
    <div className={`bg-white p-6 rounded-xl border ${isOver ? 'border-red-200 border-t-4 border-t-red-500' : 'border-gray-100'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
            <span className="text-gray-700">{emoji}</span>
          </div>
          <span className="font-bold text-gray-900">{displayName}</span>
        </div>
        <span className={`text-sm ${isOver ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
          {percent}%
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Spent</span>
          <span className={`font-bold ${isOver ? 'text-red-500' : 'text-gray-900'}`}>${budget.spentAmount?.toFixed(2)}</span>
        </div>
        
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${isOver ? 'bg-red-500' : 'bg-emerald-600'} rounded-full`} 
            style={{ width: `${Math.min(percent || 0, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Limit: ${budget.limitAmount?.toFixed(2)}</span>
          <span className={isOver ? 'text-red-500 font-semibold' : 'text-emerald-600'}>
            {isOver ? 'Over Budget' : `$${leftBudget.toFixed(2)} left`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;