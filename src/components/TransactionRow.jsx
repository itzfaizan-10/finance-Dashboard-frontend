// src/components/TransactionRow.js
import React from 'react';
import { Trash2 } from 'lucide-react';

const TransactionRow = ({ transaction, compact = false, onDelete }) => {
  const { id, description, category, type, amount, transactiondate } = transaction;
  const displayDate = transactiondate;
  const isExpense = type?.toLowerCase() === 'expense';
  
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {!compact && (
        <td className="px-6 py-4 text-sm text-gray-500">
          {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}
        </td>
      )}
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{description || 'No description'}</p>
          {compact && (
            <p className="text-xs text-gray-400 mt-1">
              {displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A'}
            </p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
          {category || 'Uncategorized'}
        </span>
      </td>
      {!compact && (
        <td className="px-6 py-4">
          <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
            isExpense 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {type || (isExpense ? 'EXPENSE' : 'INCOME')}
          </span>
        </td>
      )}
      <td className={`px-6 py-4 text-right font-semibold ${
        isExpense ? 'text-red-600' : 'text-green-600'
      }`}>
        {isExpense ? '-' : '+'}${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      
      {/* Delete button column - only show if onDelete prop is provided */}
      {onDelete && (
        <td className="px-6 py-4 text-center">
          <button
            onClick={() => onDelete(id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
            title="Delete transaction"
          >
            <Trash2 size={16} />
          </button>
        </td>
      )}
    </tr>
  );
};

export default TransactionRow;