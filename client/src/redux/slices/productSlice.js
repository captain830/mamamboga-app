import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  featuredProducts: [],
  selectedProduct: null,
  categories: [],
  loading: false,
  error: null,
  total: 0,
  hasMore: false,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload.products;
      state.total = action.payload.total;
      state.hasMore = action.payload.hasMore;
    },
    setFeaturedProducts: (state, action) => {
      state.featuredProducts = action.payload;
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
});

export const {
  setProducts,
  setFeaturedProducts,
  setSelectedProduct,
  setCategories,
  setLoading,
  setError,
  clearSelectedProduct,
} = productSlice.actions;

export default productSlice.reducer;