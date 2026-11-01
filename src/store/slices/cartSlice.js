import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { cartService } from '../../services/cartService';
import { logoutUser } from './authSlice';

export const loadCart = createAsyncThunk('cart/loadCart', async () => {
  const items = await cartService.getCart();
  return items;
});

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ product, quantity, userId }, { rejectWithValue }) => {
    try {
      const items = await cartService.addToCart(product, quantity, userId);
      return items;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const items = await cartService.updateQuantity(productId, quantity);
      return items;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (productId) => {
    const items = await cartService.removeFromCart(productId);
    return items;
  }
);

const initialState = {
  items: [],
  selectedSellerId: null, // For 1-seller checkout selection
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setSelectedSellerId: (state, action) => {
      state.selectedSellerId = action.payload;
    },
    clearCartError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.fulfilled, (state, action) => {
        state.items = action.payload;
        // Auto-select first seller if none selected
        if (action.payload.length > 0 && !state.selectedSellerId) {
          state.selectedSellerId = action.payload[0].sellerId;
        }
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.items = action.payload;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { setSelectedSellerId, clearCartError } = cartSlice.actions;

// Selectors
export const selectCartGroups = createSelector(
  (state) => state.cart.items,
  (items) => cartService.groupItemsBySeller(items)
);

export const selectCartTotalCount = (state) => {
  return state.cart.items.reduce((acc, curr) => acc + curr.quantity, 0);
};

export default cartSlice.reducer;
