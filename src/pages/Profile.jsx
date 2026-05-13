import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../authcontext/AuthContext';
import { User, Mail, Phone, DollarSign, Save } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    phone: '+1 (555) 000-0000',
    monthlyIncome: '5000',  // ✅ Changed from monthlySavings to monthlyIncome
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      console.log("User data in Profile:", user);
      setFormData(prev => ({
        ...prev,
        name: user?.name || prev.name,
        email: user?.email || prev.email,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    console.log("Saving profile data:", formData);
    alert("Profile updated successfully!");
  };

  // Monthly income options
  const monthlyIncomeOptions = [2500, 3000, 4000, 5000, 6000, 7500, 8000, 10000, 12000, 15000, 20000];

  console.log("Profile rendering with:", { user, formData });

  return (
    <Layout>
      <div className="p-8 pt-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Profile Settings</h2>
          
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-emerald-100">
                {user?.name ? (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-500 text-white text-3xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-500 text-white text-3xl font-bold">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{formData.name}</h3>
                <p className="text-gray-500">{formData.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                  Premium Member
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    disabled
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Monthly Income 💰</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 appearance-none"
                  >
                    {monthlyIncomeOptions.map(amount => (
                      <option key={amount} value={amount}>
                        ${amount.toLocaleString()}/month
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Income Summary */}
            <div className="mt-8 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <h4 className="text-sm font-semibold text-emerald-800 mb-2">Income Summary</h4>
              <p className="text-sm text-gray-600">
                Your monthly income is{' '}
                <span className="font-bold text-emerald-700">${parseInt(formData.monthlyIncome).toLocaleString()}</span>.
                This represents a yearly income of{' '}
                <span className="font-bold text-emerald-700">
                  ${(parseInt(formData.monthlyIncome) * 12).toLocaleString()}
                </span>.
              </p>
            </div>
            
            <div className="mt-8 flex justify-end gap-4">
              <button className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700">
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;