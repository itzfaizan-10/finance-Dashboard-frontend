// src/components/TransactionRow.js
import React from 'react';
import { ArrowDownLeft, ArrowUpRight, MoreVertical } from 'lucide-react';

const TransactionRow = ({ transaction, compact = false }) => {
  // Fix: Check transaction.type correctly (backend sends "EXPENSE" or "INCOME")
  const isIncome = transaction.type === 'INCOME' || transaction.type === 'income';
  
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {/* Remove transaction.icon - use default icon */}
            {isIncome ? <ArrowDownLeft size={18} className="text-emerald-600" /> : <ArrowUpRight size={18} className="text-red-500" />}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{transaction.description}</p>
            <p className="text-xs text-gray-500">{transaction.transactiondate || transaction.date} • {transaction.category}</p>
          </div>
        </div>
        <span className={`font-headline font-bold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}${(transaction.amount || 0).toLocaleString()}
        </span>
      </div>
    );
  }
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-5 text-sm text-gray-600">{transaction.transactiondate || transaction.date || '-'}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            {isIncome ? <ArrowDownLeft size={18} className="text-emerald-600" /> : <ArrowUpRight size={18} className="text-red-500" />}
          </div>
          <span className="text-sm font-semibold text-gray-900">{transaction.description || 'No description'}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
          {transaction.category || 'Uncategorized'}
        </span>
      </td>
      <td className="px-6 py-5">
        <span className={`flex items-center gap-1 text-xs font-bold ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
          {isIncome ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
          {isIncome ? 'Income' : 'Expense'}
        </span>
      </td>
      <td className={`px-6 py-5 text-right font-bold text-lg ${isIncome ? 'text-emerald-600' : 'text-gray-900'}`}>
        {isIncome ? '+' : '-'}${(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-6 py-5">
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
};

export default TransactionRow;