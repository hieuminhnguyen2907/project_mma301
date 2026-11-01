import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { View } from 'react-native';
import { EmptyState } from '../components/common/EmptyState';
import { Header } from '../components/common/Header';
import { colors } from '../config/theme';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminListingsScreen } from '../screens/admin/AdminListingsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminDisputesScreen } from '../screens/admin/AdminDisputesScreen';
import { AdminCategoriesScreen } from '../screens/admin/AdminCategoriesScreen';
import { ROUTES } from '../constants/routes';

const Stack = createNativeStackNavigator();

export const AdminStack = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);

  // Defence in depth: the menu entry is admin-only, but the route itself must be too
  if (user?.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Quản trị" onBackPress={() => navigation.goBack()} />
        <EmptyState
          icon="lock-closed-outline"
          title="Không có quyền truy cập"
          subtitle="Khu vực này chỉ dành cho quản trị viên ReMarket."
          actionTitle="Quay lại"
          onActionPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.ADMIN_DASHBOARD} component={AdminDashboardScreen} />
      <Stack.Screen name={ROUTES.ADMIN_LISTINGS} component={AdminListingsScreen} />
      <Stack.Screen name={ROUTES.ADMIN_USERS} component={AdminUsersScreen} />
      <Stack.Screen name={ROUTES.ADMIN_DISPUTES} component={AdminDisputesScreen} />
      <Stack.Screen name={ROUTES.ADMIN_CATEGORIES} component={AdminCategoriesScreen} />
    </Stack.Navigator>
  );
};
