import React, { useEffect } from 'react'
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Feedback from './pages/Feedback'
import AdminFeedback from './pages/AdminFeedback'
import AdminOrders from './pages/AdminOrders';
import { initializeSocket } from './services/socket';
import ThemeToggle from './components/ThemeToggle'
import OfflineHandler from './components/OfflineHandler'  // Add at top


const queryClient = new QueryClient()

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
        
        {/* ThemeToggle - Place OUTSIDE Routes */}
        <ThemeToggle />
        <OfflineHandler />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* ProtectedRoute now handles Layout internally */}
          <Route element={<ProtectedRoute />}>
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
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin/feedback" element={<AdminFeedback />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
              </>
            )}
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App