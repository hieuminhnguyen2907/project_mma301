import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { chatService } from '../../services/chatService.js';
import { Header } from '../../components/common/Header.js';
import { colors, spacing, typography, borderRadius } from '../../config/theme.js';
import { formatCurrency } from '../../utils/currency.js';
import { formatRelativeTime } from '../../utils/date.js';
import { ROUTES } from '../../constants/routes.js';

// Helper to guarantee list elements have no duplicate IDs
const deduplicateMessages = (msgs) => {
  if (!Array.isArray(msgs)) return [];
  const seen = new Set();
  const result = [];
  for (const m of msgs) {
    if (m && m.id && !seen.has(m.id)) {
      seen.add(m.id);
      result.push(m);
    }
  }
  return result;
};

export const ChatDetailScreen = ({ route, navigation }) => {
  const { conversation, product, initialMessage } = route.params || {};
  const { user } = useSelector((state) => state.auth);

  const [currentConv, setCurrentConv] = useState(conversation || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(initialMessage || '');
  const [isSending, setIsSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [typingName, setTypingName] = useState('');
  const flatListRef = useRef(null);

  // Chat requires an account: both sides must know who they are talking to
  const currentUserId = user?.uid || null;
  const currentUserName = user?.displayName || '';

  // 1. Initialize Conversation
  useEffect(() => {
    let isMounted = true;
    const initChat = async () => {
      try {
        if (conversation) {
          if (isMounted) {
            setCurrentConv(conversation);
            setMessages(deduplicateMessages(conversation.messages || []));
          }
        } else if (product) {
          const conv = await chatService.getOrCreateConversation({ product, buyer: user });
          if (isMounted) {
            setCurrentConv(conv);
            setMessages(deduplicateMessages(conv.messages || []));
          }
        }
      } catch (err) {
        console.warn('Init chat error:', err);
        if (isMounted) {
          Alert.alert('Không thể mở cuộc trò chuyện', err.message, [
            { text: 'Đóng', onPress: () => navigation.goBack() },
          ]);
        }
      }
    };

    initChat();
    return () => {
      isMounted = false;
    };
  }, [conversation?.id, product?.id, user?.uid]);

  // 2. Realtime Subscriptions (Messages & Typing Indicator)
  useEffect(() => {
    if (!currentConv?.id) return;

    // Realtime message updates
    const unsubMessages = chatService.subscribeToMessages(currentConv.id, (incomingList) => {
      setMessages(deduplicateMessages(incomingList));
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });

    // Realtime typing indicator
    const unsubTyping = chatService.subscribeToTyping(currentConv.id, (isTyping, senderName) => {
      setPartnerTyping(isTyping);
      setTypingName(senderName || '');
      if (isTyping) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      if (typeof unsubMessages === 'function') unsubMessages();
      if (typeof unsubTyping === 'function') unsubTyping();
    };
  }, [currentConv?.id]);

  const quickInquiries = [
    'Sản phẩm này còn không bạn?',
    'Bớt chút tiền xăng xe cho mình nhé?',
    'Mình muốn thương lượng giá món này...',
    'Còn đầy đủ phụ kiện theo máy không?',
    'Có thể xem hàng trực tiếp ở đâu?',
  ];

  // 3. Handle Send Message
  const handleSend = useCallback(
    async (textToSend) => {
      const text = (textToSend || inputText).trim();
      if (!text || isSending || !currentConv?.id || !currentUserId) return;

      setIsSending(true);
      setInputText('');

      try {
        await chatService.sendMessage({
          conversationId: currentConv.id,
          senderId: currentUserId,
          senderName: currentUserName,
          text,
          productId: currentConv.productId,
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (err) {
        console.error('Send message error:', err);
        setInputText(text);
        Alert.alert('Chưa gửi được tin nhắn', err.message || 'Vui lòng thử lại.');
      } finally {
        setIsSending(false);
      }
    },
    [inputText, isSending, currentConv, currentUserId, currentUserName]
  );

  const partnerName =
    currentConv?.buyerId === currentUserId ? currentConv?.sellerName : currentConv?.buyerName;

  return (
    // Covers the whole screen (header included), so no vertical offset. Android needs the
    // padding too: with edge-to-edge the window is no longer resized for the keyboard.
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <Header
        title={partnerName || 'Trao đổi mua bán'}
        onBackPress={() => navigation.goBack()}
      />

      {/* Sticky Product Inquired Card */}
      {currentConv && (
        <View style={styles.productBanner}>
          <Image source={{ uri: currentConv.primaryImage }} style={styles.productThumb} />
          <View style={styles.productDetails}>
            <Text numberOfLines={1} style={styles.productTitle}>
              {currentConv.productName}
            </Text>
            <Text style={styles.productPrice}>{formatCurrency(currentConv.productPrice)}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewProductBtn}
            onPress={() =>
              navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: currentConv.productId })
            }
          >
            <Text style={styles.viewProductBtnText}>Xem tin</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Suggestion Chips */}
      <View style={styles.quickChipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsScroll}
        >
          {quickInquiries.map((chip, idx) => (
            <TouchableOpacity
              key={`chip_${idx}`}
              style={styles.chip}
              disabled={isSending}
              onPress={() => handleSend(chip)}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Message Thread */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => `${item.id || 'msg'}_${index}`}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isMe = item.senderId === currentUserId;
          const isSystem = item.senderId === 'system';

          if (isSystem) {
            return (
              <View style={styles.systemBox}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.systemText}>{item.text}</Text>
              </View>
            );
          }

          return (
            <View
              style={[
                styles.bubbleWrapper,
                isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
              ]}
            >
              {!isMe && (
                <Text style={styles.senderHeader}>
                  {item.senderName || partnerName || 'Người bán'}
                </Text>
              )}
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleRight : styles.bubbleLeft,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMe ? styles.messageTextRight : styles.messageTextLeft,
                  ]}
                >
                  {item.text}
                </Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.bubbleTime}>
                  {formatRelativeTime(item.timestamp)}
                  {item.isSimulated ? ' • Tin nhắn mô phỏng (chế độ demo)' : ''}
                </Text>
                {isMe && (
                  <Ionicons
                    name="checkmark-done"
                    size={12}
                    color={colors.primary}
                    style={{ marginLeft: 3 }}
                  />
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          partnerTyping ? (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.typingText}>
                  {typingName ? `${typingName} đang soạn tin...` : 'Đang soạn tin...'}
                </Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Bottom Message Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập câu hỏi hoặc thỏa thuận..."
          placeholderTextColor={colors.textMuted}
          style={styles.textInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || isSending) && styles.sendBtnDisabled,
          ]}
          onPress={() => handleSend(inputText)}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons name="send" size={18} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
  },
  productDetails: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  productTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  productPrice: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  viewProductBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.sm,
  },
  viewProductBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  quickChipsWrapper: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  quickChipsScroll: {
    paddingHorizontal: spacing.md,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: borderRadius.pill,
    marginRight: 8,
  },
  chipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: 24,
  },
  systemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.borderLight,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
    marginVertical: spacing.sm,
  },
  systemText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  bubbleWrapper: {
    marginBottom: spacing.md,
    maxWidth: '82%',
  },
  bubbleWrapperRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleWrapperLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderHeader: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 3,
    marginLeft: 4,
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: borderRadius.lg,
  },
  bubbleRight: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleLeft: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageText: {
    ...typography.bodySmall,
    lineHeight: 19,
  },
  messageTextRight: {
    color: colors.textInverse,
  },
  messageTextLeft: {
    color: colors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bubbleTime: {
    fontSize: 9,
    color: colors.textMuted,
  },
  typingContainer: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
  },
  typingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
});
