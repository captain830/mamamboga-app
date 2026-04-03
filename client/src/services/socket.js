import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

let socket;

export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }
  
  socket = io('http://localhost:5001', {
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: true
  });
  
  socket.on('connect', () => {
    console.log('🔌 Socket connected successfully');
    if (token) {
      socket.emit('authenticate', token);
    }
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    toast.error('Connection error. Please refresh the page.');
  });
  
  // Listen for general notifications
  socket.on('notification', (notification) => {
    console.log('📨 Notification received:', notification);
    
    // Show toast notification without JSX
    toast.success(notification.title, {
      duration: 5000,
      position: 'top-right',
      icon: '🔔',
      style: {
        background: '#363636',
        color: '#fff',
      },
    });
    
    // Show additional message
    setTimeout(() => {
      toast(notification.message, {
        duration: 4000,
        position: 'top-right',
        icon: '📨',
      });
    }, 500);
  });
  
  // Listen for new orders (admin)
  socket.on('new-order', (order) => {
    toast.success(`🆕 New Order!`, {
      duration: 8000,
      position: 'top-right',
      icon: '🛒',
      style: {
        background: '#2e7d32',
        color: '#fff',
      },
    });
    
    toast(`Order #${order.orderNumber} for KSh ${order.amount} from ${order.customerName}`, {
      duration: 7000,
      position: 'top-right',
    });
    
    // Optional: Refresh orders list
    if (window.location.pathname.includes('/admin')) {
      window.dispatchEvent(new Event('order-updated'));
    }
  });
  
  // Listen for order status updates
  socket.on('order-status-update', (data) => {
    toast.success(`📦 Order ${data.status.toUpperCase()}!`, {
      duration: 5000,
      position: 'top-right',
      icon: '🚚',
    });
    
    toast(data.message, {
      duration: 4000,
      position: 'top-right',
    });
  });
  
  // Listen for feedback replies
  socket.on('feedback-reply', (data) => {
    toast.success('💬 Admin replied to your feedback!', {
      duration: 5000,
      position: 'top-right',
      icon: '💬',
    });
    
    toast(data.message, {
      duration: 4000,
      position: 'top-right',
    });
  });
  
  // Listen for payment confirmation
  socket.on('payment-confirmed', (data) => {
    toast.success('💰 Payment Successful!', {
      duration: 5000,
      position: 'top-right',
      icon: '✅',
      style: {
        background: '#2e7d32',
        color: '#fff',
      },
    });
    
    toast(data.message, {
      duration: 4000,
      position: 'top-right',
    });
  });
  
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log('Socket disconnected');
  }
};