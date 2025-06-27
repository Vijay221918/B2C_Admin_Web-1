// src/redux/ordersSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  orders: [],
  loading: false,
  error: null,
  successMessage: '',
  totalCount: 0,
};

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `https://b2c-49u4.onrender.com/api/v1/order/order?page=${page}&limit=${limit}`
      );
      if (!response.data || !Array.isArray(response.data.orders)) {
        throw new Error('Invalid data format from server');
      }
      return response.data;
    } catch (error) {
      console.error("Fetch error:", error);
      return rejectWithValue(error.response?.data || error.message || 'Failed to fetch orders');
    }
  }
);

export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `https://b2c-backend-eik4.onrender.com/api/v1/admin/order/delete/${id}`
      );
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete order');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders || [];
        state.totalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter((order) => order.id !== action.payload);
        state.totalCount -= 1;
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSuccessMessage, clearSuccessMessage } = ordersSlice.actions;
export default ordersSlice.reducer;
