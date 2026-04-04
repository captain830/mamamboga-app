import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, 
  Mail, CreditCard, Truck, Package, Database, Download, Upload,
  RefreshCw, Save, Lock, Eye, EyeOff, Trash2, AlertTriangle,
  Moon, Sun, Monitor, Phone, MapPin, Clock, DollarSign,
  Percent, Tag, Users, FileText, Printer, QrCode, Share2,
  HelpCircle, Info, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'Mama Mboga',
    storeEmail: 'info@mamamboga.com',
    storePhone: '+254700000000',
    storeAddress: 'Nairobi, Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
  });
  
  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: 'light',
    primaryColor: '#2e7d32',
    fontSize: 'medium',
    animations: true,
    compactMode: false,
    sidebarCollapsed: false,
  });
  
  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderAlerts: true,
    feedbackAlerts: true,
    lowStockAlerts: true,
    promotionalEmails: false,
    smsAlerts: false,
    pushNotifications: true,
  });
  
  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    mpesaEnabled: true,
    cashOnDelivery: true,
    cardPayments: false,
    paymentGateway: 'mpesa',
    mpesaShortcode: '174379',
    mpesaConsumerKey: '',
    mpesaConsumerSecret: '',
  });
  
  // Delivery Settings
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryFee: 100,
    freeDeliveryThreshold: 1000,
    estimatedDeliveryTime: '30-45',
    maxDeliveryDistance: 10,
    allowPickup: true,
    deliveryHours: '08:00-20:00',
  });
  
  // Product Settings
  const [productSettings, setProductSettings] = useState({
    lowStockThreshold: 10,
    enableBackorders: false,
    autoApproveReviews: true,
    showOutOfStock: true,
    defaultSortBy: 'name',
    itemsPerPage: 12,
  });
  
  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordExpiryDays: 90,
    ipWhitelist: [],
  });
  
  // Data Management
  const [backupInfo, setBackupInfo] = useState({
    lastBackup: '2024-01-01 00:00:00',
    backupSize: '0 MB',
    autoBackup: true,
    backupFrequency: 'daily',
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon, color: 'bg-gray-500' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: 'bg-purple-500' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'bg-blue-500' },
    { id: 'payment', label: 'Payment', icon: CreditCard, color: 'bg-green-500' },
    { id: 'delivery', label: 'Delivery', icon: Truck, color: 'bg-orange-500' },
    { id: 'products', label: 'Products', icon: Package, color: 'bg-teal-500' },
    { id: 'security', label: 'Security', icon: Shield, color: 'bg-red-500' },
    { id: 'data', label: 'Data', icon: Database, color: 'bg-indigo-500' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setGeneralSettings(settings.general || generalSettings);
        setAppearance(settings.appearance || appearance);
        setNotifications(settings.notifications || notifications);
        setPaymentSettings(settings.payment || paymentSettings);
        setDeliverySettings(settings.delivery || deliverySettings);
        setProductSettings(settings.products || productSettings);
        setSecuritySettings(settings.security || securitySettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const allSettings = {
        general: generalSettings,
        appearance,
        notifications,
        payment: paymentSettings,
        delivery: deliverySettings,
        products: productSettings,
        security: securitySettings,
        backup: backupInfo,
      };
      
      localStorage.setItem('appSettings', JSON.stringify(allSettings));
      
      // Apply theme immediately
      if (appearance.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const data = {
        settings: localStorage.getItem('appSettings'),
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mamamboga_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
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
          toast.success('Settings imported successfully! Please refresh the page.');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (error) {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    localStorage.clear();
    toast.success('All data cleared!');
    setTimeout(() => window.location.reload(), 1500);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 inline-block p-4 rounded-full mb-4">
          <Shield className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Admin access required to modify settings.</p>
      </div>
    );
  }

  const SettingSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-green-600" />
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
        <div className="flex gap-2">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
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
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <SettingSection title="General Settings" icon={SettingsIcon}>
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
            <SettingRow label="Store Address" description="Physical location">
              <input
                type="text"
                value={generalSettings.storeAddress}
                onChange={(e) => setGeneralSettings({ ...generalSettings, storeAddress: e.target.value })}
                className="px-3 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-green-500"
              />
            </SettingRow>
            <SettingRow label="Currency" description="Default currency for transactions">
              <select
                value={generalSettings.currency}
                onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                className="px-3 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-green-500"
              >
                <option value="KES">Kenyan Shilling (KES)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </SettingRow>
            <SettingRow label="Timezone" description="Your local timezone">
              <select
                value={generalSettings.timezone}
                onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                className="px-3 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-green-500"
              >
                <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                <option value="Africa/Johannesburg">South Africa Standard Time</option>
                <option value="Africa/Cairo">Eastern European Time</option>
              </select>
            </SettingRow>
          </SettingSection>
        )}

        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <SettingSection title="Appearance" icon={Palette}>
            <SettingRow label="Theme Mode" description="Choose light or dark theme">
              <div className="flex gap-2">
                <button
                  onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${appearance.theme === 'light' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${appearance.theme === 'dark' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  <Moon size={16} /> Dark
                </button>
              </div>
            </SettingRow>
            <SettingRow label="Primary Color" description="Main brand color">
              <input
                type="color"
                value={appearance.primaryColor}
                onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                className="w-16 h-10 rounded border cursor-pointer"
              />
            </SettingRow>
            <SettingRow label="Font Size" description="Text size throughout the app">
              <select
                value={appearance.fontSize}
                onChange={(e) => setAppearance({ ...appearance, fontSize: e.target.value })}
                className="px-3 py-2 border rounded-lg w-48"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </SettingRow>
            <SettingRow label="Animations" description="Enable smooth transitions and animations">
              <ToggleSwitch enabled={appearance.animations} onChange={(val) => setAppearance({ ...appearance, animations: val })} />
            </SettingRow>
            <SettingRow label="Compact Mode" description="Reduce spacing for more content">
              <ToggleSwitch enabled={appearance.compactMode} onChange={(val) => setAppearance({ ...appearance, compactMode: val })} />
            </SettingRow>
          </SettingSection>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <SettingSection title="Notifications" icon={Bell}>
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
            <SettingRow label="Push Notifications" description="Browser notifications">
              <ToggleSwitch enabled={notifications.pushNotifications} onChange={(val) => setNotifications({ ...notifications, pushNotifications: val })} />
            </SettingRow>
          </SettingSection>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <SettingSection title="Payment Settings" icon={CreditCard}>
            <SettingRow label="M-Pesa Payment" description="Enable M-Pesa payments">
              <ToggleSwitch enabled={paymentSettings.mpesaEnabled} onChange={(val) => setPaymentSettings({ ...paymentSettings, mpesaEnabled: val })} />
            </SettingRow>
            <SettingRow label="Cash on Delivery" description="Allow cash payment on delivery">
              <ToggleSwitch enabled={paymentSettings.cashOnDelivery} onChange={(val) => setPaymentSettings({ ...paymentSettings, cashOnDelivery: val })} />
            </SettingRow>
            <SettingRow label="Card Payments" description="Accept credit/debit cards">
              <ToggleSwitch enabled={paymentSettings.cardPayments} onChange={(val) => setPaymentSettings({ ...paymentSettings, cardPayments: val })} />
            </SettingRow>
            <SettingRow label="M-Pesa Shortcode" description="Paybill/Till number">
              <input
                type="text"
                value={paymentSettings.mpesaShortcode}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, mpesaShortcode: e.target.value })}
                className="px-3 py-2 border rounded-lg w-48"
                placeholder="174379"
              />
            </SettingRow>
          </SettingSection>
        )}

        {/* Delivery Settings */}
        {activeTab === 'delivery' && (
          <SettingSection title="Delivery Settings" icon={Truck}>
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
            <SettingRow label="Estimated Delivery Time (minutes)" description="Average delivery time">
              <input
                type="text"
                value={deliverySettings.estimatedDeliveryTime}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, estimatedDeliveryTime: e.target.value })}
                className="px-3 py-2 border rounded-lg w-32"
                placeholder="30-45"
              />
            </SettingRow>
            <SettingRow label="Allow Store Pickup" description="Customers can pickup orders">
              <ToggleSwitch enabled={deliverySettings.allowPickup} onChange={(val) => setDeliverySettings({ ...deliverySettings, allowPickup: val })} />
            </SettingRow>
          </SettingSection>
        )}

        {/* Product Settings */}
        {activeTab === 'products' && (
          <SettingSection title="Product Settings" icon={Package}>
            <SettingRow label="Low Stock Threshold" description="Alert when stock falls below this number">
              <input
                type="number"
                value={productSettings.lowStockThreshold}
                onChange={(e) => setProductSettings({ ...productSettings, lowStockThreshold: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-lg w-24"
              />
            </SettingRow>
            <SettingRow label="Enable Backorders" description="Allow ordering out-of-stock items">
              <ToggleSwitch enabled={productSettings.enableBackorders} onChange={(val) => setProductSettings({ ...productSettings, enableBackorders: val })} />
            </SettingRow>
            <SettingRow label="Auto-approve Reviews" description="Customer reviews appear automatically">
              <ToggleSwitch enabled={productSettings.autoApproveReviews} onChange={(val) => setProductSettings({ ...productSettings, autoApproveReviews: val })} />
            </SettingRow>
            <SettingRow label="Items Per Page" description="Products shown per page">
              <select
                value={productSettings.itemsPerPage}
                onChange={(e) => setProductSettings({ ...productSettings, itemsPerPage: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-lg w-32"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </SettingRow>
          </SettingSection>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <SettingSection title="Security Settings" icon={Shield}>
            <SettingRow label="Two-Factor Authentication" description="Extra security for admin accounts">
              <ToggleSwitch enabled={securitySettings.twoFactorAuth} onChange={(val) => setSecuritySettings({ ...securitySettings, twoFactorAuth: val })} />
            </SettingRow>
            <SettingRow label="Session Timeout (minutes)" description="Auto logout after inactivity">
              <input
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-lg w-24"
              />
            </SettingRow>
            <SettingRow label="Max Login Attempts" description="Failed attempts before lockout">
              <input
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-lg w-24"
              />
            </SettingRow>
            <SettingRow label="Change Password" description="Update your account password">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Change Password
              </button>
            </SettingRow>
          </SettingSection>
        )}

        {/* Data Management */}
        {activeTab === 'data' && (
          <SettingSection title="Data Management" icon={Database}>
            <SettingRow label="Export Data" description="Download all settings and configurations">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download size={16} /> Export Backup
              </button>
            </SettingRow>
            <SettingRow label="Import Data" description="Restore from backup file">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                <Upload size={16} /> Import Backup
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </SettingRow>
            <SettingRow label="Last Backup" description={backupInfo.lastBackup}>
              <span className="text-sm text-gray-500">{backupInfo.lastBackup}</span>
            </SettingRow>
            <SettingRow label="Auto Backup" description="Automatically backup settings daily">
              <ToggleSwitch enabled={backupInfo.autoBackup} onChange={(val) => setBackupInfo({ ...backupInfo, autoBackup: val })} />
            </SettingRow>
            <SettingRow label="Clear All Data" description="⚠️ This action cannot be undone">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={16} /> Clear All Data
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
                  <AlertTriangle className="w-6 h-6 text-red-600" />
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