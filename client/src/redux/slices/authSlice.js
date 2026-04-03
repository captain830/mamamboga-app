import { createSlice } from '@reduxjs/toolkit'

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      return {
        user: JSON.parse(user),
        token: token,
        isLoading: false,
        error: null,
      }
    }
  } catch (error) {
    console.error('Error loading auth state:', error)
  }
  return {
    user: null,
    token: null,
    isLoading: false,
    error: null,
  }
}

const initialState = loadInitialState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload
      state.user = user
      state.token = token
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    logout: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const { setCredentials, logout, setLoading, setError } = authSlice.actions
export default authSlice.reducer