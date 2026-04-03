export const translations = {
  en: {
    // Common
    welcome: 'Welcome',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    feedback: 'Feedback',
    profile: 'Profile',
    admin: 'Admin',
    
    // Products
    freshProducts: 'Fresh Products',
    browseOurSelection: 'Browse our selection of fresh, organic produce',
    searchProducts: 'Search products...',
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    stock: 'Stock',
    price: 'Price',
    category: 'Category',
    description: 'Description',
    
    // Orders
    myOrders: 'My Orders',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    orderStatus: 'Order Status',
    totalAmount: 'Total Amount',
    trackOrder: 'Track Order',
    cancelOrder: 'Cancel Order',
    
    // Feedback
    feedbackSupport: 'Feedback & Support',
    sendFeedback: 'Send Feedback',
    myFeedback: 'My Feedback',
    subject: 'Subject',
    message: 'Message',
    send: 'Send',
    
    // Cart
    shoppingCart: 'Shopping Cart',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',
    remove: 'Remove',
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    total: 'Total',
    
    // Payment
    payment: 'Payment',
    payWithMpesa: 'Pay with M-Pesa',
    phoneNumber: 'Phone Number',
    initiatePayment: 'Initiate Payment',
    
    // Success/Error
    success: 'Success!',
    error: 'Error!',
    loading: 'Loading...',
    noData: 'No data found',
  },
  
  sw: {
    // Common
    welcome: 'Karibu',
    login: 'Ingia',
    register: 'Jisajili',
    logout: 'Toka',
    dashboard: 'Dashibodi',
    products: 'Bidhaa',
    orders: 'Maagizo',
    feedback: 'Maoni',
    profile: 'Wasifu',
    admin: 'Msimamizi',
    
    // Products
    freshProducts: 'Bidhaa Mbichi',
    browseOurSelection: 'Vinjari bidhaa zetu mbichi na za kikaboni',
    searchProducts: 'Tafuta bidhaa...',
    addToCart: 'Ongeza kwenye Rukwama',
    outOfStock: 'Hakuna Bidhaa',
    stock: 'Hisa',
    price: 'Bei',
    category: 'Jamii',
    description: 'Maelezo',
    
    // Orders
    myOrders: 'Maagizo Yangu',
    orderNumber: 'Nambari ya Agizo',
    orderDate: 'Tarehe ya Agizo',
    orderStatus: 'Hali ya Agizo',
    totalAmount: 'Jumla ya Kiasi',
    trackOrder: 'Fuatilia Agizo',
    cancelOrder: 'Ghairi Agizo',
    
    // Feedback
    feedbackSupport: 'Maoni na Msaada',
    sendFeedback: 'Tuma Maoni',
    myFeedback: 'Maoni Yangu',
    subject: 'Mada',
    message: 'Ujumbe',
    send: 'Tuma',
    
    // Cart
    shoppingCart: 'Rukwama ya Ununuzi',
    checkout: 'Malipo',
    continueShopping: 'Endelea Kununua',
    remove: 'Ondoa',
    subtotal: 'Jumla Ndogo',
    delivery: 'Uwasilishaji',
    total: 'Jumla',
    
    // Payment
    payment: 'Malipo',
    payWithMpesa: 'Lipa kwa M-Pesa',
    phoneNumber: 'Nambari ya Simu',
    initiatePayment: 'Anza Malipo',
    
    // Success/Error
    success: 'Imefanikiwa!',
    error: 'Hitilafu!',
    loading: 'Inapakia...',
    noData: 'Hakuna data iliyopatikana',
  }
}

export const getTranslation = (key, language = 'en') => {
  return translations[language]?.[key] || translations.en[key] || key
}