// src/data/mockData.js
import { 
  Utensils, Banknote, Film, ShoppingBag, Car, Home, Dumbbell, 
  TrendingUp, PieChart, CreditCard, Coffee, Zap, Briefcase, Gift 
} from 'lucide-react';

export const mockTransactions = [
  { id: 1, date: 'Oct 24, 2023', description: 'The Artisan Bistro', category: 'Dining', type: 'expense', amount: 142.50, icon: Utensils },
  { id: 2, date: 'Oct 23, 2023', description: 'Monthly Salary Deposit', category: 'Income', type: 'income', amount: 8450.00, icon: Banknote },
  { id: 3, date: 'Oct 22, 2023', description: 'Streaming Bundle Premium', category: 'Entertainment', type: 'expense', amount: 24.99, icon: Film },
  { id: 4, date: 'Oct 21, 2023', description: 'Lux Style Boutique', category: 'Lifestyle', type: 'expense', amount: 312.00, icon: ShoppingBag },
  { id: 5, date: 'Oct 20, 2023', description: 'City Transit Auto-Reload', category: 'Transport', type: 'expense', amount: 50.00, icon: Car },
  { id: 6, date: 'Oct 19, 2023', description: 'Apple Store Soho', category: 'Technology', type: 'expense', amount: 1299.00, icon: ShoppingBag },
  { id: 7, date: 'Oct 22, 2023', description: 'Stripe Dividend', category: 'Income', type: 'income', amount: 3450.00, icon: Banknote },
  { id: 8, date: 'Oct 21, 2023', description: 'The Alchemist Bar', category: 'Dining', type: 'expense', amount: 84.20, icon: Utensils },
  { id: 9, date: 'Oct 18, 2023', description: 'Whole Foods Market', category: 'Groceries', type: 'expense', amount: 156.43, icon: ShoppingBag },
  { id: 10, date: 'Oct 15, 2023', description: 'Netflix Subscription', category: 'Entertainment', type: 'expense', amount: 15.99, icon: Film },
];

export const mockBudgets = [
  { id: 1, name: 'Housing', spent: 1800, limit: 2000, color: 'tertiary', icon: Home },
  { id: 2, name: 'Dining', spent: 740, limit: 600, color: 'error', icon: Utensils },
  { id: 3, name: 'Transport', spent: 147, limit: 350, color: 'secondary', icon: Car },
  { id: 4, name: 'Wellness', spent: 232, limit: 400, color: 'primary', icon: Dumbbell },
  { id: 5, name: 'Entertainment', spent: 205, limit: 250, color: 'tertiary', icon: Film },
];

export const monthlyData = {
  totalBalance: 84250,
  totalIncome: 12400,
  totalExpense: 4120.5,
  monthlyChange: 2.4,
  budgetUtilized: 32,
};

export const chartData = {
  months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
  income: [6500, 6800, 7200, 7500, 8000, 8450],
  expenses: [4200, 4300, 4100, 4400, 4500, 4120],
};

export const categoryData = [
  { name: 'Housing & Bills', percentage: 45, color: 'primary' },
  { name: 'Lifestyle', percentage: 25, color: 'tertiary' },
  { name: 'Investments', percentage: 30, color: 'secondary' },
];