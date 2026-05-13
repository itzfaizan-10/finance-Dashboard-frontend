// src/components/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
import { useAuth } from '../authcontext/AuthContext';
import { 
  LayoutDashboard, Receipt, Wallet, User, LogOut, 
  CreditCard, Lightbulb 
} from 'lucide-react';

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'transactions', label: 'Transactions', icon: Receipt, path: '/transactions' },
    { id: 'budget', label: 'Budget', icon: Wallet, path: '/budget' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-emerald-50 flex flex-col z-30">
      <div className="px-6 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <CreditCard size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-emerald-900">
            The Curator
          </h1>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
          Premium Finance
        </p>
      </div>
      
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-emerald-100 text-emerald-900 font-semibold border-r-4 border-emerald-600'
                : 'text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100/50'
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-3 rounded-xl bg-emerald-100/50 border border-emerald-100 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={12} className="text-emerald-600" />
            <p className="text-xs font-bold text-emerald-800">Tip</p>
          </div>
          <p className="text-[10px] text-emerald-600 leading-relaxed">
            Your "Dining" expense is 12% lower than last month. Keep it up!
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100/50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;