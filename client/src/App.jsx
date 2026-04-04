import React, { useEffect, useState } from 'react'  // Add useState here
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { setCredentials } from './redux/slices/authSlice'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import Payments from './pages/Payments'
import Delivery from './pages/Delivery'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import UserManagement from './pages/UserManagement'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Feedback from './pages/Feedback'
import AdminFeedback from './pages/AdminFeedback'
import AdminOrders from './pages/AdminOrders';
import { initializeSocket } from './services/socket';
import ThemeToggle from './components/ThemeToggle'
import OfflineHandler from './components/OfflineHandler'
import VerifyEmail from './pages/VerifyEmail'

const queryClient = new QueryClient()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Move VerifiedRoute outside the App component
const VerifiedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const [isVerified, setIsVerified] = useState(null);
  
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => setIsVerified(data.is_verified))
      .catch(() => setIsVerified(false));
    }
  }, [user]);
  
  if (isVerified === null) return (
    <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  );
  
  if (!isVerified) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Account Not Verified</h2>
        <p className="text-gray-600 mb-4">Please check your email for a verification link.</p>
        <button 
          onClick={() => {/* Resend verification email */}}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Resend Verification Email
        </button>
      </div>
    );
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      dispatch(setCredentials({ user: JSON.parse(userData), token }))
    }
  }, [dispatch])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#2e7d32',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <ThemeToggle />
        <OfflineHandler />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />  {/* Add this route */}
          
          {/* Wrap ProtectedRoute with VerifiedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route element={<VerifiedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/delivery" element={<Delivery />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/test" element={<div className="p-8"><h1>Test Page Works!</h1></div>} />
                <Route path="/feedback" element={<Feedback />} />

                {user?.role === 'admin' && (
                  <>
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin/feedback" element={<AdminFeedback />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                  </>
                )}
              </Route>
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App