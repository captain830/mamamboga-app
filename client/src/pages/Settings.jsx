import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Mama Mboga',
    storeEmail: 'info@mamamboga.com',
    storePhone: '+254700000000',
    storeAddress: 'Nairobi, Kenya',
    currency: 'KES',
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: 'light',
    primaryColor: '#2e7d32',
    animations: true,
  });
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderAlerts: true,
    feedbackAlerts: true,
    lowStockAlerts: true,
  });
  
  // Delivery Settings
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryFee: 100,
    freeDeliveryThreshold: 1000,
    estimatedDeliveryTime: '30-45',
    allowPickup: true,
  });

  // Tabs - Added 'data' tab
  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'delivery', label: 'Delivery', icon: '🚚' },
    { id: 'data', label: 'Data Management', icon: '💾' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setGeneralSettings(settings.general || generalSettings);
        setAppearance(settings.appearance || appearance);
        setNotifications(settings.notifications || notifications);
        setDeliverySettings(settings.delivery || deliverySettings);
      }
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setAppearance(prev => ({ ...prev, theme: savedTheme }));
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const allSettings = {
        general: generalSettings,
        appearance,
        notifications,
        delivery: deliverySettings,
      };
      
      localStorage.setItem('appSettings', JSON.stringify(allSettings));
      
      if (appearance.theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => {
    try {
      const data = {
        settings: localStorage.getItem('appSettings'),
        theme: localStorage.getItem('theme'),
        exportDate: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mamamboga_settings_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Settings exported!');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.settings) {
          localStorage.setItem('appSettings', data.settings);
          if (data.theme) {
            localStorage.setItem('theme', data.theme);
          }
          toast.success('Settings imported! Refreshing...');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (error) {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = () => {
    localStorage.removeItem('appSettings');
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
    toast.success('Reset to default! Refreshing...');
    setTimeout(() => window.location.reload(), 1500);
  };

  const clearAllData = () => {
    localStorage.clear();
    toast.success('All data cleared! Refreshing...');
    setTimeout(() => window.location.reload(), 1500);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 inline-block p-4 rounded-full mb-4">
          <span className="text-4xl">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Admin access required to modify settings.</p>
      </div>
    );
  }

  const SettingSection = ({ title, icon, children }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0">
      <div className="mb-2 sm:mb-0">
        <p className="font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">⚙️ System Settings</h1>
          <p className="text-gray-500 mt-1">Configure and manage your application preferences</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          💾 {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto mb-6 pb-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <SettingSection title="General Settings" icon="⚙️">
            <SettingRow label="Store Name" description="Your business name displayed throughout the app">
              <input
                type="text"
                value={generalSettings.storeName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })}
                className="px-3 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-green-500"
              />
            </SettingRow>
            <SettingRow label="Store Email" description="Customer support email address">
              <input
                type="email"
                value={generalSettings.storeEmail}
                onChange={(e) => setGeneralSettings({ ...generalSettings, storeEmail: e.target.value })}
                className="px-3 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-green-500"
              />
            </SettingRow>
            <SettingRow label="Store Phone" description="Contact number for customers">
              <input
                type="tel"
                value={generalSettings.storePhone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, storePhone: e.target.value })}
                className="px-3 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-green-500"
              />
            </SettingRow>
            <SettingRow label="Currency" description="Default currency for transactions">
              <select
                value={generalSettings.currency}
                onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                className="px-3 py-2 border rounded-lg w-32 focus:ring-2 focus:ring-green-500"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </SettingRow>
          </SettingSection>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <SettingSection title="Appearance" icon="🎨">
            <SettingRow label="Theme Mode" description="Choose light or dark theme">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAppearance({ ...appearance, theme: 'light' });
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('darkMode', 'light');
                    toast.success('Light mode activated! ☀️');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${!document.documentElement.classList.contains('dark') ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-white'}`}
                >
                  ☀️ Light
                </button>
                <button
                  onClick={() => {
                    setAppearance({ ...appearance, theme: 'dark' });
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('darkMode', 'dark');
                    toast.success('Dark mode activated! 🌙');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${document.documentElement.classList.contains('dark') ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-white'}`}
                >
                  🌙 Dark
                </button>
              </div>
            </SettingRow>
            <SettingRow label="Primary Color" description="Main brand color">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={appearance.primaryColor}
                  onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <span className="text-sm text-gray-500">{appearance.primaryColor}</span>
              </div>
            </SettingRow>
            <SettingRow label="Animations" description="Enable smooth transitions">
              <ToggleSwitch enabled={appearance.animations} onChange={(val) => setAppearance({ ...appearance, animations: val })} />
            </SettingRow>
          </SettingSection>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <SettingSection title="Notifications" icon="🔔">
            <SettingRow label="Email Notifications" description="Receive updates via email">
              <ToggleSwitch enabled={notifications.emailNotifications} onChange={(val) => setNotifications({ ...notifications, emailNotifications: val })} />
            </SettingRow>
            <SettingRow label="Order Alerts" description="Get notified when new orders arrive">
              <ToggleSwitch enabled={notifications.orderAlerts} onChange={(val) => setNotifications({ ...notifications, orderAlerts: val })} />
            </SettingRow>
            <SettingRow label="Feedback Alerts" description="Get notified when customers submit feedback">
              <ToggleSwitch enabled={notifications.feedbackAlerts} onChange={(val) => setNotifications({ ...notifications, feedbackAlerts: val })} />
            </SettingRow>
            <SettingRow label="Low Stock Alerts" description="Alert when products are running low">
              <ToggleSwitch enabled={notifications.lowStockAlerts} onChange={(val) => setNotifications({ ...notifications, lowStockAlerts: val })} />
            </SettingRow>
          </SettingSection>
        )}

        {/* Delivery Settings */}
        {activeTab === 'delivery' && (
          <SettingSection title="Delivery Settings" icon="🚚">
            <SettingRow label="Delivery Fee (KSh)" description="Standard delivery charge">
              <input
                type="number"
                value={deliverySettings.deliveryFee}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryFee: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-lg w-32"
              />
            </SettingRow>
            <SettingRow label="Free Delivery Threshold" description="Minimum order for free delivery">
              <input
                type="number"
                value={deliverySettings.freeDeliveryThreshold}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, freeDeliveryThreshold: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-lg w-32"
              />
            </SettingRow>
            <SettingRow label="Allow Store Pickup" description="Customers can pickup orders">
              <ToggleSwitch enabled={deliverySettings.allowPickup} onChange={(val) => setDeliverySettings({ ...deliverySettings, allowPickup: val })} />
            </SettingRow>
          </SettingSection>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <SettingSection title="Data Management" icon="💾">
            <SettingRow label="Export Settings" description="Download all settings as backup">
              <button onClick={exportData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                📥 Export Backup
              </button>
            </SettingRow>
            
            <SettingRow label="Import Settings" description="Restore from backup file">
              <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
                📤 Import Backup
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </SettingRow>
            
            <SettingRow label="Reset to Default" description="Restore all factory settings">
              <button onClick={resetToDefault} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                🔄 Reset Defaults
              </button>
            </SettingRow>
            
            <SettingRow label="Clear All Data" description="⚠️ This action cannot be undone">
              <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                🗑️ Clear All Data
              </button>
            </SettingRow>
          </SettingSection>
        )}
      </div>

      {/* Clear Data Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Action</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clear all data? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllData}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;