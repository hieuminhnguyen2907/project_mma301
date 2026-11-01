import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';
import { logoutUser } from './authSlice';

export const loadNotifications = createAsyncThunk(
  'notifications/load',
  async (userId) => {
    const list = await notificationService.getNotifications(userId);
    return list;
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notifId) => {
    await notificationService.markAsRead(notifId);
    return notifId;
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (userId) => {
    await notificationService.markAllAsRead(userId);
    return userId;
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.isRead).length;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(logoutUser.fulfilled, () => initialState);
  },
});

export default notificationSlice.reducer;
