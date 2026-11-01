import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '../../services/orderService';
import { logoutUser } from './authSlice';

export const placeOrder = createAsyncThunk(
  'orders/placeOrder',
  async (orderPayload, { rejectWithValue }) => {
    try {
      const order = await orderService.createOrder(orderPayload);
      return order;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchBuyerOrders = createAsyncThunk(
  'orders/fetchBuyerOrders',
  async ({ buyerId, status }, { rejectWithValue }) => {
    try {
      const orders = await orderService.getBuyerOrders(buyerId, status);
      return orders;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchSellerOrders = createAsyncThunk(
  'orders/fetchSellerOrders',
  async ({ sellerId, status }, { rejectWithValue }) => {
    try {
      const orders = await orderService.getSellerOrders(sellerId, status);
      return orders;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const confirmSellerOrder = createAsyncThunk(
  'orders/confirmSellerOrder',
  async ({ orderId, sellerId }, { rejectWithValue }) => {
    try {
      const order = await orderService.confirmOrder(orderId, sellerId);
      return order;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rejectSellerOrder = createAsyncThunk(
  'orders/rejectSellerOrder',
  async ({ orderId, sellerId, reason }, { rejectWithValue }) => {
    try {
      const order = await orderService.rejectOrder(orderId, sellerId, reason);
      return order;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const cancelBuyerOrder = createAsyncThunk(
  'orders/cancelBuyerOrder',
  async ({ orderId, buyerId, reason }, { rejectWithValue }) => {
    try {
      const order = await orderService.cancelOrder(orderId, buyerId, reason);
      return order;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const shipSellerOrder = createAsyncThunk(
  'orders/shipSellerOrder',
  async ({ orderId, sellerId, trackingCode }, { rejectWithValue }) => {
    try {
      const order = await orderService.shipOrder(orderId, sellerId, trackingCode);
      return order;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const completeBuyerOrder = createAsyncThunk(
  'orders/completeBuyerOrder',
  async ({ orderId, buyerId }, { rejectWithValue }) => {
    try {
      // The seller's wallet picks up the COD proceeds from the completed order itself
      // (walletService.getWallet), so a wallet hiccup can no longer report a completed
      // order as failed
      const order = await orderService.completeOrder(orderId, buyerId);
      return order;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  buyerOrders: [],
  sellerOrders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    clearOrderError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Place Order
      .addCase(placeOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        state.buyerOrders.unshift(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Buyer Orders
      .addCase(fetchBuyerOrders.fulfilled, (state, action) => {
        state.buyerOrders = action.payload;
      })

      // Fetch Seller Orders
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.sellerOrders = action.payload;
      })

      // State Transitions updates
      .addCase(confirmSellerOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        state.sellerOrders = state.sellerOrders.map((o) => (o.id === updated.id ? updated : o));
        if (state.currentOrder?.id === updated.id) state.currentOrder = updated;
      })
      .addCase(rejectSellerOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        state.sellerOrders = state.sellerOrders.map((o) => (o.id === updated.id ? updated : o));
        if (state.currentOrder?.id === updated.id) state.currentOrder = updated;
      })
      .addCase(cancelBuyerOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        state.buyerOrders = state.buyerOrders.map((o) => (o.id === updated.id ? updated : o));
        if (state.currentOrder?.id === updated.id) state.currentOrder = updated;
      })
      .addCase(shipSellerOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        state.sellerOrders = state.sellerOrders.map((o) => (o.id === updated.id ? updated : o));
        if (state.currentOrder?.id === updated.id) state.currentOrder = updated;
      })
      .addCase(completeBuyerOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        state.buyerOrders = state.buyerOrders.map((o) => (o.id === updated.id ? updated : o));
        if (state.currentOrder?.id === updated.id) state.currentOrder = updated;
      })
      .addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { setCurrentOrder, clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
