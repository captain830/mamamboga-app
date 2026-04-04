const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./src/config/database');
const { protect, authorize } = require('./src/middleware/auth'); 

// Load environment variables FIRST
dotenv.config();

// Then require email service (so it has access to env vars)
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('./src/services/emailService');

// Database connection with retry
const { testConnection } = require('./src/config/database');

// Don't exit if database fails, just log
testConnection().catch(err => {
  console.warn('⚠️ Database connection warning:', err.message);
  console.log('App will continue running with limited functionality');
});

const app = express();
const PORT = process.env.PORT || 5001; // Changed to 5001 to match your frontend

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  'https://mamamboga-app.vercel.app',
  'https://mamamboga-app.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Create HTTP server for Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://mamamboga-app.vercel.app', 'https://mamamboga-app.onrender.com'],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  // Authenticate user
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      connectedUsers.set(decoded.id, socket.id);
      console.log(`✅ User ${decoded.id} (${decoded.role}) authenticated`);
      
      // Join admin room if admin
      if (decoded.role === 'admin') {
        socket.join('admin-room');
        console.log('📢 Admin joined admin-room');
      }
    } catch (error) {
      console.error('Socket auth error:', error);
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`🔌 User ${socket.userId} disconnected`);
    }
  });
});

// Helper function to send notifications
const sendNotification = (userId, notification) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', notification);
    console.log(`📨 Notification sent to user ${userId}`);
  }
};

// In-memory storage for demo
let users = [];
let products = [
  { id: 1, name: 'Fresh Sukuma Wiki', category: 'Vegetables', price: 50, stock: 100, description: 'Fresh organic kale leaves', image_url: null, featured: true },
  { id: 2, name: 'Ripe Tomatoes', category: 'Vegetables', price: 80, stock: 150, description: 'Juicy ripe tomatoes', image_url: null, featured: true },
  { id: 3, name: 'Red Onions', category: 'Vegetables', price: 60, stock: 120, description: 'Freshly harvested red onions', image_url: null, featured: false },
  { id: 4, name: 'Irish Potatoes', category: 'Vegetables', price: 100, stock: 200, description: 'High-quality potatoes', image_url: null, featured: true },
  { id: 5, name: 'Maize Flour', category: 'Cereals', price: 120, stock: 50, description: 'Premium quality maize flour, 2kg', image_url: null, featured: true },
  { id: 6, name: 'Long Grain Rice', category: 'Cereals', price: 150, stock: 40, description: 'Aromatic long grain rice, 1kg', image_url: null, featured: true },
  { id: 7, name: 'Fresh Cabbage', category: 'Vegetables', price: 45, stock: 80, description: 'Crisp fresh cabbage', image_url: null, featured: false },
  { id: 8, name: 'Dried Beans', category: 'Cereals', price: 180, stock: 60, description: 'Premium quality beans, 1kg', image_url: null, featured: false }
];

// Feedback Routes
app.use('/api/feedback', require('./src/routes/feedbackRoutes'));

// ============ ORDER ROUTES ============
let orders = [];
let nextOrderId = 1;

// Create sample orders
const createSampleOrders = () => {
  if (orders.length === 0) {
    orders.push({
      id: nextOrderId++,
      order_number: `ORD${Date.now() - 86400000}`,
      user_id: 1,
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '0712345678',
      subtotal: 230,
      delivery_fee: 100,
      total_amount: 330,
      status: 'pending',
      payment_status: 'pending',
      delivery_type: 'delivery',
      delivery_address: '123 Main Street, Nairobi',
      delivery_instructions: 'Call on arrival',
      items: [
        { product_id: 1, quantity: 2, price: 50, product_name: 'Fresh Sukuma Wiki' },
        { product_id: 2, quantity: 1, price: 80, product_name: 'Ripe Tomatoes' }
      ],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    });
    
    orders.push({
      id: nextOrderId++,
      order_number: `ORD${Date.now() - 172800000}`,
      user_id: 1,
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      customer_phone: '0723456789',
      subtotal: 420,
      delivery_fee: 0,
      total_amount: 420,
      status: 'confirmed',
      payment_status: 'paid',
      delivery_type: 'pickup',
      delivery_address: null,
      delivery_instructions: null,
      items: [
        { product_id: 4, quantity: 2, price: 100, product_name: 'Irish Potatoes' },
        { product_id: 5, quantity: 1, price: 120, product_name: 'Maize Flour' }
      ],
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString()
    });
    
    orders.push({
      id: nextOrderId++,
      order_number: `ORD${Date.now() - 259200000}`,
      user_id: 1,
      customer_name: 'Michael Omondi',
      customer_email: 'michael@example.com',
      customer_phone: '0734567890',
      subtotal: 300,
      delivery_fee: 100,
      total_amount: 400,
      status: 'shipped',
      payment_status: 'paid',
      delivery_type: 'delivery',
      delivery_address: '45 Kenyatta Avenue, Kisumu',
      delivery_instructions: 'Gate code 1234',
      items: [
        { product_id: 1, quantity: 3, price: 50, product_name: 'Fresh Sukuma Wiki' },
        { product_id: 7, quantity: 2, price: 45, product_name: 'Fresh Cabbage' }
      ],
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString()
    });
    
    console.log('✅ Sample orders created:', orders.length);
  }
};

createSampleOrders();

// Create admin user
const adminPassword = bcrypt.hashSync('admin123', 10);
users.push({
  id: 1,
  name: 'Admin User',
  email: 'admin@mamamboga.com',
  phone: '0700000000',
  password: adminPassword,
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString()
});

// Create order endpoint with notifications and email
app.post('/api/orders', async (req, res) => {
  try {
    const { items, delivery_type, delivery_address, delivery_instructions } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const user = users.find(u => u.id === decoded.id);
    
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product_id} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      subtotal += product.price * item.quantity;
      
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
        product_name: product.name
      });
    }
    
    const delivery_fee = delivery_type === 'delivery' ? 100 : 0;
    const total_amount = subtotal + delivery_fee;
    
    const order = {
      id: nextOrderId++,
      order_number: `ORD${Date.now()}`,
      user_id: decoded.id,
      customer_name: user?.name || 'Guest',
      customer_email: user?.email || 'N/A',
      customer_phone: user?.phone || 'N/A',
      subtotal,
      delivery_fee,
      total_amount,
      status: 'pending',
      payment_status: 'pending',
      delivery_type,
      delivery_address,
      delivery_instructions,
      items: orderItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    orders.push(order);
    console.log(`✅ Order created: ${order.order_number}`);
    
    // Send real-time notifications (WebSocket)
    io.to('admin-room').emit('new-order', {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total_amount,
      customerName: order.customer_name,
      timestamp: new Date().toISOString()
    });
    
    sendNotification(decoded.id, {
      type: 'order_created',
      title: 'Order Confirmed! 🎉',
      message: `Your order #${order.order_number} for KSh ${order.total_amount} has been placed successfully.`,
      orderId: order.id
    });
    
    // Send email confirmation (if email service is configured)
    try {
      const { sendOrderConfirmationEmail } = require('./src/services/emailService');
      if (user && user.email && user.email !== 'N/A') {
        await sendOrderConfirmationEmail(order, user);
        console.log(`📧 Order confirmation email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('⚠️ Email service not configured or failed:', emailError.message);
      // Don't fail the order if email fails
    }
    
    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get user's own orders
app.get('/api/orders/my-orders', (req, res) => {
  console.log('🔥 Orders endpoint was hit!');
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const userOrders = orders.filter(o => o.user_id === decoded.id);
    
    console.log(`📦 Returning ${userOrders.length} orders for user ${decoded.id}`);
    res.json(userOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get all orders (ADMIN)
app.get('/api/orders/all', (req, res) => {
  console.log('🔥 /api/orders/all endpoint called');
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const allOrders = orders.map(order => ({
      ...order,
      customer_name: order.customer_name || 'Guest',
      customer_email: order.customer_email || 'N/A',
      customer_phone: order.customer_phone || 'N/A'
    }));
    
    console.log(`📦 Admin returning ${allOrders.length} orders`);
    res.json(allOrders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get single order by ID
app.get('/api/orders/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const orderId = parseInt(req.params.id);
    
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.user_id !== decoded.id && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const orderWithProducts = {
      ...order,
      items: order.items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
          ...item,
          product_name: item.product_name || product?.name,
          product_category: product?.category
        };
      })
    };
    
    res.json(orderWithProducts);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// Update order status (admin) with notifications and email
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { status } = req.body;
    const orderId = parseInt(req.params.id);
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order status
    orders[orderIndex].status = status;
    orders[orderIndex].updated_at = new Date().toISOString();
    
    // Send notification to customer using the helper function
    sendNotification(orders[orderIndex].user_id, {
      type: 'order_status_update',
      title: `Order ${status.toUpperCase()}! 🚚`,
      message: `Your order #${orders[orderIndex].order_number} is now ${status}.`,
      orderId: orderId,
      status: status
    });
    
    // Also emit a specific event for real-time updates
    const socketId = connectedUsers.get(orders[orderIndex].user_id);
    if (socketId) {
      io.to(socketId).emit('order-status-update', {
        status: status,
        message: `Your order #${orders[orderIndex].order_number} is now ${status}.`,
        orderNumber: orders[orderIndex].order_number,
        orderId: orderId
      });
    }
    
    // Send email notification for status update
    try {
      const { sendOrderStatusEmail } = require('./src/services/emailService');
      const user = users.find(u => u.id === orders[orderIndex].user_id);
      if (user && user.email && user.email !== 'N/A') {
        await sendOrderStatusEmail(orders[orderIndex], user, status);
        console.log(`📧 Order status email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('⚠️ Email service not configured:', emailError.message);
    }
    
    console.log(`✅ Order ${orderId} status updated to ${status}`);
    res.json({ message: 'Order status updated', order: orders[orderIndex] });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// Cancel order
app.post('/api/orders/:id/cancel', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const orderId = parseInt(req.params.id);
    
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orders[orderIndex];
    
    if (order.user_id !== decoded.id && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    
    for (const item of order.items) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        product.stock += item.quantity;
      }
    }
    
    order.status = 'cancelled';
    order.updated_at = new Date().toISOString();
    
    sendNotification(order.user_id, {
      type: 'order_cancelled',
      title: 'Order Cancelled ❌',
      message: `Your order #${order.order_number} has been cancelled.`,
      orderId: orderId
    });
    
    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============ AUTH ROUTES ============

// Register - Save to database
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'customer' } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists in DATABASE
    let existingUser = null;
    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
      if (result.rows.length > 0) {
        existingUser = result.rows[0];
      }
    } catch (dbError) {
      console.log('Database check error:', dbError.message);
    }
    
    // Also check memory
    if (!existingUser) {
      existingUser = users.find(u => u.email === email || u.phone === phone);
    }
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or phone' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let newUser = null;
    
    // Try to save to DATABASE first
    try {
      const result = await db.query(
        `INSERT INTO users (name, email, phone, password, role, is_active, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) 
         RETURNING id, name, email, phone, role, is_active, created_at`,
        [name, email, phone, hashedPassword, role, true]
      );
      newUser = result.rows[0];
    } catch (dbError) {
      console.log('Database insert error:', dbError.message);
    }
    
    // Fallback to memory if database fails
    if (!newUser) {
      newUser = {
        id: users.length + 1,
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        is_active: true,
        created_at: new Date().toISOString()
      };
      users.push(newUser);
    }
    
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );
    
    // Send welcome email
    try {
      const { sendWelcomeEmail } = require('./src/services/emailService');
      sendWelcomeEmail(newUser).catch(err => console.error('Welcome email error:', err.message));
    } catch (emailError) {
      console.error('Email error:', emailError.message);
    }
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login - Works with database and memory
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    let user = null;
    
    // First try to find user in DATABASE
    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbError) {
      console.log('Database query error:', dbError.message);
    }
    
    // If not in database, check memory (for existing users)
    if (!user) {
      user = users.find(u => u.email === email);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );
    
    const { password: _, ...userWithoutPassword } = user;
    
    // Send login notification (don't await)
    try {
      const { sendLoginNotificationEmail } = require('./src/services/emailService');
      if (user.email && user.email !== 'admin@mamamboga.com') {
        sendLoginNotificationEmail(user, req).catch(err => console.error('Login email error:', err.message));
      }
    } catch (emailError) {
      console.error('Email error:', emailError.message);
    }
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    let user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      user = {
        id: decoded.id,
        name: decoded.name || 'User',
        email: decoded.email,
        role: decoded.role || 'customer',
        is_active: true
      };
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ============ PRODUCT ROUTES ============

// Get all products
app.get('/api/products', (req, res) => {
  try {
    const { category, search, featured } = req.query;
    let filteredProducts = [...products];
    
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (featured === 'true') {
      filteredProducts = filteredProducts.filter(p => p.featured);
    }
    
    res.json(filteredProducts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  try {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create product (admin only)
app.post('/api/products', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { name, category, price, stock, description } = req.body;
    
    if (!name || !category || !price || !stock) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const newProduct = {
      id: products.length + 1,
      name,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      description: description || '',
      image_url: null,
      featured: false,
      created_at: new Date().toISOString()
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product (admin only)
app.put('/api/products/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const productId = parseInt(req.params.id);
    const { name, category, price, stock, description } = req.body;
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    products[productIndex] = {
      ...products[productIndex],
      name: name || products[productIndex].name,
      category: category || products[productIndex].category,
      price: price ? parseFloat(price) : products[productIndex].price,
      stock: stock ? parseInt(stock) : products[productIndex].stock,
      description: description !== undefined ? description : products[productIndex].description,
      updated_at: new Date().toISOString()
    };
    
    res.json(products[productIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product (admin only)
app.delete('/api/products/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    products.splice(productIndex, 1);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
});
// ============ USER MANAGEMENT ROUTES ============

// Get all users (admin only)
app.get('/api/users/all', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get single user (admin only)
app.get('/api/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;
    
    const result = await db.query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, role = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name, email, phone, role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete user's feedback
    await db.query('DELETE FROM feedback WHERE user_id = $1', [id]);
    // Delete user's orders
    await db.query('DELETE FROM orders WHERE user_id = $1', [id]);
    // Delete the user
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Delete all customers (admin only)
app.delete('/api/users/bulk/customers', protect, authorize('admin'), async (req, res) => {
  try {
    // Delete feedback from customers
    await db.query('DELETE FROM feedback WHERE user_id IN (SELECT id FROM users WHERE role = $1)', ['customer']);
    // Delete orders from customers
    await db.query('DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE role = $1)', ['customer']);
    // Delete customers
    const result = await db.query('DELETE FROM users WHERE role = $1 RETURNING id', ['customer']);
    
    res.json({ message: `${result.rowCount} customers deleted successfully` });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Failed to delete customers' });
  }
});

// Reset user ID sequence (admin only)
app.post('/api/users/reset-sequence', protect, authorize('admin'), async (req, res) => {
  try {
    await db.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    res.json({ message: 'User ID sequence reset successfully' });
  } catch (error) {
    console.error('Reset sequence error:', error);
    res.status(500).json({ message: 'Failed to reset sequence' });
  }
});

// Create new user (admin only)
app.post('/api/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, password, role = 'customer' } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password, role, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) 
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name, email, phone, hashedPassword, role, true]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Update profile (user self)
app.put('/api/users/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;
    
    const result = await db.query(
      `UPDATE users SET name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, name, email, phone, role`,
      [name, phone, userId]
    );
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password (user self)
app.put('/api/users/change-password', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    // Get user with password
    const result = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, userId]);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
}); 

// ============ ANALYTICS ROUTES ============
const { getOrderStats } = require('./src/services/analyticsService');

app.get('/api/admin/analytics', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const stats = getOrderStats(orders);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});
// ============ PAYMENT ROUTES ============
let payments = [];
let nextPaymentId = 1;

// Initiate M-Pesa STK Push (simulated)
app.post('/api/payments/mpesa/stkpush', (req, res) => {
  try {
    const { orderId, phone } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const order = orders.find(o => o.id === orderId && o.user_id === decoded.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;
    
    const payment = {
      id: nextPaymentId++,
      order_id: orderId,
      amount: order.total_amount,
      status: 'pending',
      checkout_request_id: `REQ${Date.now()}`,
      merchant_request_id: `MERCH${Date.now()}`,
      phone: formattedPhone,
      created_at: new Date().toISOString()
    };
    
    payments.push(payment);
    
    setTimeout(() => {
      payment.status = 'completed';
      payment.mpesa_code = `MPESA${Date.now()}`;
      payment.transaction_date = new Date().toISOString();
      order.payment_status = 'paid';
      order.status = 'confirmed';
      order.updated_at = new Date().toISOString();
      
      sendNotification(decoded.id, {
        type: 'payment_completed',
        title: 'Payment Successful! 💰',
        message: `Your payment of KSh ${order.total_amount} for order #${order.order_number} was successful.`,
        orderId: order.id
      });
      
      console.log(`✅ Payment completed for order ${order.order_number}`);
    }, 2000);
    
    res.json({
      message: 'Payment initiated. Check your phone to complete payment.',
      checkoutRequestID: payment.checkout_request_id,
      merchantRequestID: payment.merchant_request_id
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ message: 'Failed to initiate payment' });
  }
});

// Get payment status
app.get('/api/payments/status/:orderId', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const payment = payments.find(p => p.order_id === parseInt(req.params.orderId));
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    const order = orders.find(o => o.id === payment.order_id);
    if (order.user_id !== decoded.id && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment status' });
  }
});

// Get payment history
app.get('/api/payments/history', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const userOrders = orders.filter(o => o.user_id === decoded.id);
    const userPayments = payments.filter(p => userOrders.some(o => o.id === p.order_id));
    
    const paymentsWithOrders = userPayments.map(payment => {
      const order = orders.find(o => o.id === payment.order_id);
      return {
        ...payment,
        order_number: order?.order_number,
        order_total: order?.total_amount
      };
    });
    
    res.json({ payments: paymentsWithOrders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// M-Pesa Callback endpoint
app.post('/api/payments/mpesa/callback', (req, res) => {
  console.log('M-Pesa Callback received:', req.body);
  res.json({ message: 'Callback received' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server with Socket.io
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║  🚀 Mama Mboga Server is running!                                     ║
║  📡 Server URL: http://localhost:${PORT}                               ║
║  🔌 WebSocket: Real-time notifications enabled                        ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                             ║
║  📅 Started: ${new Date().toISOString()}                              ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);
  console.log('\n📋 Available Routes:\n');
  console.log('🔐 AUTH ROUTES:');
  console.log('  POST   /api/auth/register     - Register new user');
  console.log('  POST   /api/auth/login        - Login user');
  console.log('  GET    /api/auth/me           - Get current user');
  console.log('\n📦 PRODUCT ROUTES:');
  console.log('  GET    /api/products          - Get all products');
  console.log('  GET    /api/products/:id      - Get single product');
  console.log('  POST   /api/products          - Create product (admin)');
  console.log('  PUT    /api/products/:id      - Update product (admin)');
  console.log('  DELETE /api/products/:id      - Delete product (admin)');
  console.log('\n🛒 ORDER ROUTES:');
  console.log('  POST   /api/orders            - Create new order');
  console.log('  GET    /api/orders/my-orders  - Get user orders');
  console.log('  GET    /api/orders/all        - Get all orders (admin)');
  console.log('  GET    /api/orders/:id        - Get single order');
  console.log('  PUT    /api/orders/:id/status - Update order status (admin)');
  console.log('  POST   /api/orders/:id/cancel - Cancel order');
  console.log('\n💰 PAYMENT ROUTES:');
  console.log('  POST   /api/payments/mpesa/stkpush  - Initiate M-Pesa payment');
  console.log('  GET    /api/payments/status/:orderId - Check payment status');
  console.log('  GET    /api/payments/history        - Get payment history');
  console.log('  POST   /api/payments/mpesa/callback - M-Pesa callback');
  console.log('\n💬 FEEDBACK ROUTES:');
  console.log('  POST   /api/feedback          - Submit feedback');
  console.log('  GET    /api/feedback/my       - Get my feedback');
  console.log('  GET    /api/feedback/all      - Get all feedback (admin)');
  console.log('  PUT    /api/feedback/:id/reply - Reply to feedback (admin)');
  console.log('\n🏥 HEALTH:');
  console.log('  GET    /health                - Health check');
  console.log('  GET    /api/test              - Test endpoint');
  console.log('\n✅ Server ready! Waiting for requests...\n');
});