import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { chatService } from '../../services/chatService.js';
import { Header } from '../../components/common/Header.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme.js';
import { formatRelativeTime } from '../../utils/date.js';
import { ROUTES } from '../../constants/routes.js';

export const ChatListScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = user?.uid || null;

  // Realtime subscription to conversations list
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return undefined;
    }
    let isMounted = true;
    setLoading(true);

    const unsubscribe = chatService.subscribeToConversations(currentUserId, (data) => {
      if (isMounted) {
        setConversations(data || []);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUserId]);

  const onRefresh = useCallback(async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    try {
      const data = await chatService.getConversations(currentUserId);
      setConversations(data);
    } catch (e) {
      console.warn('Error refreshing conversations:', e);
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId]);

  return (
    <View style={styles.container}>
      <Header
        title="Tin nhắn trao đổi"
        onBackPress={() => navigation.goBack()}
      />

      {conversations.length === 0 && !loading ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="Chưa có cuộc trò chuyện nào"
          subtitle="Khi xem chi tiết sản phẩm, bạn có thể bấm 'Nhắn tin' để hỏi thêm thông tin, thương lượng hoặc hẹn qua xem máy."
          actionTitle="Khám phá chợ đồ cũ"
          onActionPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_EXPLORE })}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => `${item.id || 'conv'}_${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            const isBuyer = item.buyerId === currentUserId;
            const partnerName = isBuyer ? item.sellerName : item.buyerName;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.chatCard}
                onPress={() => navigation.navigate(ROUTES.CHAT_DETAIL, { conversation: item })}
              >
                <Image
                  source={{
                    uri:
                      item.primaryImage ||
                      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
                  }}
                  style={styles.productThumb}
                />
                <View style={styles.info}>
                  <View style={styles.topRow}>
                    <Text numberOfLines={1} style={styles.partnerName}>
                      {partnerName || 'Người bán'}
                    </Text>
                    <Text style={styles.time}>{formatRelativeTime(item.lastMessageTime)}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.productTag}>
                    Đang hỏi về: {item.productName || 'Sản phẩm'}
                  </Text>
                  <Text numberOfLines={1} style={styles.lastMessage}>
                    {item.lastMessage || 'Chưa có tin nhắn'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerName: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  time: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  productTag: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  lastMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
