// src/components/TopNav.js
import React, { useState } from 'react';
import { useAuth } from '../authcontext/AuthContext';
import { Search, Bell, Settings, Menu } from 'lucide-react';

const TopNav = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  // Get user's display name
  const getDisplayName = () => {
    if (!user) return 'Guest';
    return user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 z-20">
      
      {/* Left side - Menu button for mobile only */}
      <div className="flex items-center lg:hidden">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Center / Expanded Search Bar - Takes up available space */}
   <div className="flex-1 flex items-center justify-center lg:justify-start px-4 lg:px-0">
  <div className={`relative transition-all duration-300 w-full max-w-2xl ${searchFocused ? 'lg:max-w-4xl' : 'lg:max-w-2xl'}`}>
    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder="Search transactions, categories, or merchants..."
      onFocus={() => setSearchFocused(true)}
      onBlur={() => setSearchFocused(false)}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-gray-700 placeholder:text-gray-400 transition-all"
    />
  </div>
</div>
      
      {/* Right side - Action Buttons */}
      <div className="flex items-center gap-1 lg:gap-2">
        {/* Notification Bell */}
        <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        {/* Settings Button */}
        <button className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Settings size={20} />
        </button>
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1 lg:mx-2"></div>
        
        {/* Profile Section */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{getDisplayName()}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Premium Member</p>
          </div>
          <div className="relative group">
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center cursor-pointer shadow-sm">
              <span className="text-white text-sm font-bold">
                {getDisplayName().charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{getDisplayName()}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                </div>
                <button 
                  onClick={() => window.location.href = '/profile'}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <span>👤</span> My Profile
                </button>
                <button 
                  onClick={() => window.location.href = '/settings'}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <span>⚙️</span> Settings
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/login';
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <span>🚪</span> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;