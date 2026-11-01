import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { checkAuthSession } from '../store/slices/authSlice';
import { ROUTES } from '../constants/routes';

import { AppTabs } from './AppTabs';
import { AuthStack } from './AuthStack';
import { AdminStack } from './AdminStack';

// Detail & Modal Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/explore/SearchScreen';
import { CreateListingScreen } from '../screens/sell/CreateListingScreen';
import { FavoritesScreen } from '../screens/product/FavoritesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { CategoryBrowseScreen } from '../screens/home/CategoryBrowseScreen';
import { ProductDetailScreen } from '../screens/product/ProductDetailScreen';
import { VisualSearchScreen } from '../screens/explore/VisualSearchScreen';
import { CartScreen } from '../screens/cart/CartScreen';
import { CheckoutScreen } from '../screens/cart/CheckoutScreen';
import { OrderSuccessScreen } from '../screens/cart/OrderSuccessScreen';
import { BuyerOrdersScreen } from '../screens/orders/BuyerOrdersScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { SellerOrdersScreen } from '../screens/seller/SellerOrdersScreen';
import { ManageListingsScreen } from '../screens/seller/ManageListingsScreen';
import { CreateReviewScreen } from '../screens/reviews/CreateReviewScreen';
import { CreateReportScreen } from '../screens/disputes/CreateReportScreen';
import { CreateReturnScreen } from '../screens/disputes/CreateReturnScreen';
import { NotificationCenterScreen } from '../screens/notifications/NotificationCenterScreen';
import { AddressManagerScreen } from '../screens/profile/AddressManagerScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';

// Chat & Wallet Screens
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatDetailScreen } from '../screens/chat/ChatDetailScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthSession());
  }, [dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {/* Main Tabs (Accessible to all: Guests & Users) */}
        <Stack.Screen name={ROUTES.APP_TABS} component={AppTabs} />

        {/* Auth Flow */}
        <Stack.Screen name={ROUTES.AUTH_STACK} component={AuthStack} />

        {/* Discovery & Detail Screens */}
        <Stack.Screen name={ROUTES.CATEGORY_BROWSE} component={CategoryBrowseScreen} />
        <Stack.Screen name={ROUTES.PRODUCT_DETAIL} component={ProductDetailScreen} />
        <Stack.Screen name={ROUTES.VISUAL_SEARCH} component={VisualSearchScreen} />
        <Stack.Screen name={ROUTES.SEARCH} component={SearchScreen} />
        <Stack.Screen name={ROUTES.TAB_EXPLORE} component={SearchScreen} />
        <Stack.Screen name={ROUTES.CREATE_LISTING} component={CreateListingScreen} />
        <Stack.Screen name={ROUTES.TAB_SELL} component={CreateListingScreen} />
        <Stack.Screen name={ROUTES.TAB_FAVORITES} component={FavoritesScreen} />
        <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
        <Stack.Screen name={ROUTES.TAB_HOME} component={HomeScreen} />
        <Stack.Screen name={ROUTES.TAB_PROFILE} component={ProfileScreen} />

        {/* Cart & Checkout */}
        <Stack.Screen name={ROUTES.CART} component={CartScreen} />
        <Stack.Screen name={ROUTES.CHECKOUT} component={CheckoutScreen} />
        <Stack.Screen name={ROUTES.ORDER_SUCCESS} component={OrderSuccessScreen} />

        {/* Orders & Seller */}
        <Stack.Screen name={ROUTES.BUYER_ORDERS} component={BuyerOrdersScreen} />
        <Stack.Screen name={ROUTES.ORDER_DETAIL} component={OrderDetailScreen} />
        <Stack.Screen name={ROUTES.SELLER_ORDERS} component={SellerOrdersScreen} />
        <Stack.Screen name={ROUTES.MANAGE_LISTINGS} component={ManageListingsScreen} />

        {/* Reviews & Disputes */}
        <Stack.Screen name={ROUTES.CREATE_REVIEW} component={CreateReviewScreen} />
        <Stack.Screen name={ROUTES.CREATE_REPORT} component={CreateReportScreen} />
        <Stack.Screen name={ROUTES.CREATE_RETURN} component={CreateReturnScreen} />

        {/* Notifications & Profile */}
        <Stack.Screen name={ROUTES.NOTIFICATIONS} component={NotificationCenterScreen} />
        <Stack.Screen name={ROUTES.ADDRESS_MANAGER} component={AddressManagerScreen} />
        <Stack.Screen name={ROUTES.EDIT_PROFILE} component={EditProfileScreen} />

        {/* Real-time C2C Chat Flow */}
        <Stack.Screen name={ROUTES.CHAT_LIST} component={ChatListScreen} />
        <Stack.Screen name={ROUTES.CHAT_DETAIL} component={ChatDetailScreen} />

        {/* Seller Wallet & COD Settlement */}
        <Stack.Screen name={ROUTES.WALLET} component={WalletScreen} />

        {/* Admin Console */}
        <Stack.Screen name={ROUTES.ADMIN_STACK} component={AdminStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
