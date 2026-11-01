import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../../services/productService';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { MOCK_PRODUCTS } from '../../services/mockData';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters, { rejectWithValue }) => {
    try {
      const data = await productService.getProducts(filters);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchProductDetail = createAsyncThunk(
  'products/fetchProductDetail',
  async (id, { rejectWithValue }) => {
    try {
      const product = await productService.getProductById(id);
      return product;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createNewListing = createAsyncThunk(
  'products/createNewListing',
  async ({ productData, seller }, { rejectWithValue }) => {
    try {
      const newProduct = await productService.createProduct(productData, seller);
      return newProduct;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleProductFavorite = createAsyncThunk(
  'products/toggleProductFavorite',
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const targetUserId = userId || 'guest_device';
      const isFav = await productService.toggleFavorite(targetUserId, productId);
      return { productId, isFav };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  'products/fetchFavorites',
  async (userId, { rejectWithValue }) => {
    try {
      const targetUserId = userId || 'guest_device';
      const list = await productService.getFavoriteProducts(targetUserId);
      return list;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  items: MOCK_PRODUCTS, // Pre-seeded so products appear instantly upon app launch
  favorites: [],
  categories: DEFAULT_CATEGORIES,
  selectedCategory: 'all',
  selectedProduct: null,
  searchQuery: '',
  selectedCondition: null,
  sortBy: 'newest',
  isLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedCondition: (state, action) => {
      state.selectedCondition = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    clearFilters: (state) => {
      state.selectedCategory = 'all';
      state.searchQuery = '';
      state.selectedCondition = null;
      state.sortBy = 'newest';
    },
    syncCategories: (state) => {
      state.categories = DEFAULT_CATEGORIES;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.categories = DEFAULT_CATEGORIES;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Detail
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.selectedProduct = action.payload;
      })

      // Create
      .addCase(createNewListing.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      // Favorites
      .addCase(toggleProductFavorite.fulfilled, (state, action) => {
        const { productId, isFav } = action.payload;
        if (isFav) {
          const prod = state.items.find((p) => p.id === productId) || state.selectedProduct;
          if (prod && !state.favorites.some((f) => f.id === productId)) {
            state.favorites.push(prod);
          }
        } else {
          state.favorites = state.favorites.filter((f) => f.id !== productId);
        }
        // Sync favoriteCount on item
        const item = state.items.find((p) => p.id === productId);
        if (item) {
          item.favoriteCount = isFav ? (item.favoriteCount || 0) + 1 : Math.max(0, (item.favoriteCount || 1) - 1);
        }
        if (state.selectedProduct && state.selectedProduct.id === productId) {
          state.selectedProduct.favoriteCount = isFav
            ? (state.selectedProduct.favoriteCount || 0) + 1
            : Math.max(0, (state.selectedProduct.favoriteCount || 1) - 1);
        }
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
      });
  },
});

export const {
  setSelectedCategory,
  setSearchQuery,
  setSelectedCondition,
  setSortBy,
  clearFilters,
  syncCategories,
} = productSlice.actions;

export default productSlice.reducer;
