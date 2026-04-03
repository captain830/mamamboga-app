// Request permission for push notifications
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Send a push notification
export const sendNotification = (title, body, icon = '/logo.png') => {
  if (!('Notification' in window)) return
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: icon,
      badge: '/badge.png',
      vibrate: [200, 100, 200],
      tag: 'mamamboga-notification'
    })
  }
}

// Check for new orders and notify
export const setupOrderNotifications = (socket, userId) => {
  if (!socket) return
  
  socket.on('new-order', (order) => {
    sendNotification(
      '🛒 New Order Received!',
      `Order #${order.orderNumber} for KSh ${order.amount} from ${order.customerName}`,
      '/logo.png'
    )
  })
  
  socket.on('order-status-update', (data) => {
    sendNotification(
      '📦 Order Status Update',
      data.message,
      '/logo.png'
    )
  })
  
  socket.on('feedback-reply', (data) => {
    sendNotification(
      '💬 Admin Replied',
      data.message,
      '/logo.png'
    )
  })
}