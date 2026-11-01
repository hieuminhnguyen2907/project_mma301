import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/explore/SearchScreen';
import { CreateListingScreen } from '../screens/sell/CreateListingScreen';
import { FavoritesScreen } from '../screens/product/FavoritesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { colors } from '../config/theme';
import { ROUTES } from '../constants/routes';

const Tab = createBottomTabNavigator();

export const AppTabs = () => {
  // Size the bar from the real safe-area inset (home indicator / gesture bar) instead of
  // fixed per-platform numbers, which clipped the labels on Android and web
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 60 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          lineHeight: 14,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === ROUTES.TAB_HOME) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === ROUTES.TAB_EXPLORE) {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === ROUTES.TAB_SELL) {
            return (
              <View style={styles.sellButtonContainer}>
                <Ionicons name="add" size={28} color={colors.textInverse} />
              </View>
            );
          } else if (route.name === ROUTES.TAB_FAVORITES) {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === ROUTES.TAB_PROFILE) {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.TAB_HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Trang chủ' }}
      />
      <Tab.Screen
        name={ROUTES.TAB_EXPLORE}
        component={SearchScreen}
        options={{ tabBarLabel: 'Khám phá' }}
      />
      <Tab.Screen
        name={ROUTES.TAB_SELL}
        component={CreateListingScreen}
        options={{ tabBarLabel: 'Đăng bán' }}
      />
      <Tab.Screen
        name={ROUTES.TAB_FAVORITES}
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Yêu thích' }}
      />
      <Tab.Screen
        name={ROUTES.TAB_PROFILE}
        component={ProfileScreen}
        options={{ tabBarLabel: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  sellButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
