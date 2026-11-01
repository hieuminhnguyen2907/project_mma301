import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { cartService } from '../../services/cartService';
import { productService } from '../../services/productService';

// Hearts tapped while browsing as a guest follow the user into their account
const adoptGuestFavorites = async (user) => {
  try {
    await productService.migrateGuestFavorites(user?.uid);
  } catch (_err) {
    // Favorites are a convenience: never fail the sign-in because of them
  }
};

export const checkAuthSession = createAsyncThunk(
  'auth/checkAuthSession',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentSession();
      return user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await authService.login(email, password);
      await adoptGuestFavorites(user);
      return user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const user = await authService.register(userData);
      await adoptGuestFavorites(user);
      return user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const demoLoginUser = createAsyncThunk(
  'auth/demoLoginUser',
  async (role, { rejectWithValue }) => {
    try {
      const user = await authService.demoLogin(role);
      return user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await authService.logout();
    // Cart storage is device-wide: clear it so the next account does not inherit it
    await cartService.clearCart();
    return null;
  }
);

export const addDeliveryAddress = createAsyncThunk(
  'auth/addDeliveryAddress',
  async ({ uid, addressData }, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.addAddress(uid, addressData);
      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const setDefaultAddress = createAsyncThunk(
  'auth/setDefaultAddress',
  async ({ uid, addressId }, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.setDefaultAddress(uid, addressId);
      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async ({ uid, updateData }, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.updateProfile(uid, updateData);
      return updatedUser;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false, // Starts false so guests & users see the app immediately without infinite spinner
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check session (runs in background without freezing app UI)
      .addCase(checkAuthSession.pending, (_state) => {})
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(checkAuthSession.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        // e.g. the account was suspended since the last launch
        state.error = action.payload || null;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Đăng nhập thất bại';
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Đăng ký thất bại';
      })

      // Demo login
      .addCase(demoLoginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(demoLoginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Đăng nhập thất bại';
      })
      .addCase(demoLoginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })

      // Addresses
      .addCase(addDeliveryAddress.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.user = action.payload;
      })

      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload || 'Cập nhật hồ sơ thất bại';
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
