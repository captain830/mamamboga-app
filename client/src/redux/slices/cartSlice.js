import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
  totalAmount: 0,
  totalItems: 0,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item.productId === action.payload.productId)
      
      if (existingItem) {
        existingItem.quantity += action.payload.quantity || 1
      } else {
        state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 })
      }
      
      localStorage.setItem('cart', JSON.stringify(state.items))
      cartSlice.caseReducers.calculateTotals(state)
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.productId !== action.payload)
      localStorage.setItem('cart', JSON.stringify(state.items))
      cartSlice.caseReducers.calculateTotals(state)
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload
      const item = state.items.find(item => item.productId === productId)
      if (item) {
        item.quantity = quantity
        if (item.quantity <= 0) {
          state.items = state.items.filter(i => i.productId !== productId)
        }
      }
      localStorage.setItem('cart', JSON.stringify(state.items))
      cartSlice.caseReducers.calculateTotals(state)
    },
    clearCart: (state) => {
      state.items = []
      localStorage.removeItem('cart')
      cartSlice.caseReducers.calculateTotals(state)
    },
    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions
export default cartSlice.reducer