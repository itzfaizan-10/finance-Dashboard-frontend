// src/components/SummaryCard.js
import React from 'react';

const SummaryCard = ({ title, amount, change, icon: Icon, variant = 'primary' }) => {
  const variants = {
    primary: 'bg-primary text-white',
    white: ' bg-primary text-on-surface text-white',
  };
  
  return (
    <div className={`${variants[variant]} rounded-xl p-6 shadow-sm relative overflow-hidden group`}>
      {variant === 'primary' && (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-container rounded-full opacity-20 transition-transform group-hover:scale-125"></div>
      )}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</span>
          <Icon size={20} className={variant === 'primary' ? 'opacity-80' : ''} />
        </div>
        <div className="text-3xl font-bold mb-1">${amount.toLocaleString()}</div>
        {change && (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">{change}</span>
            <span className="opacity-60">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;