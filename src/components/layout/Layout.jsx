// src/components/Layout.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../authcontext/AuthContext';
import Sidebar from '../Sidebar';
import TopNav from '../TopNav';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const username = user?.username;
  
  const getPageTitle = () => {
    if (location.pathname === '/') {
      return { title: 'Financial Overview', subtitle: `Welcome back, ${username}. Your portfolio is up 4.2%.` };
    }
    if (location.pathname === '/transactions') {
      return { title: 'Transaction History', subtitle: 'A record of your financial movements.' };
    }
    if (location.pathname === '/budget') {
      return { title: 'Monthly Budget', subtitle: 'Your financial outlook for October.' };
    }
    if (location.pathname === '/profile') {
      return { title: 'Profile Settings', subtitle: 'Manage your account preferences.' };
    }
    return { title: 'The Curator', subtitle: 'Premium Finance' };
  };
  
  const { title, subtitle } = getPageTitle();
  
  return (
    <div className="min-h-screen bg-background dark:bg-zinc-400 ">
      <Sidebar />
      <TopNav title={title} subtitle={subtitle} />
      <div className="ml-64">
        {children}
      </div>
    </div>
  );
};

export default Layout;