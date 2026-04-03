import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  total: 0,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload.orders;
      state.total = action.payload.total;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    },
    updateOrderStatus: (state, action) => {
      const { id, status } = action.payload;
      const order = state.orders.find(o => o.id === id);
      if (order) {
        order.status = status;
      }
      if (state.currentOrder?.id === id) {
        state.currentOrder.status = status;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
});

export const {
  setOrders,
  setCurrentOrder,
  addOrder,
  updateOrderStatus,
  setLoading,
  setError,
  clearCurrentOrder,
} = orderSlice.actions;

export default orderSlice.reducer;