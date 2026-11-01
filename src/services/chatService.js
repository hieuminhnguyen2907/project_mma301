import { storage } from '../utils/storage.js';
import { db, isLiveFirebase } from '../config/firebase.js';
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

// Conversation fields stored in Firestore (the messages live in a sub-collection)
const toConversationDoc = (conv) => ({
  id: conv.id,
  productId: conv.productId,
  productName: conv.productName,
  productPrice: conv.productPrice,
  primaryImage: conv.primaryImage,
  buyerId: conv.buyerId,
  buyerName: conv.buyerName,
  sellerId: conv.sellerId,
  sellerName: conv.sellerName,
  lastMessage: conv.lastMessage,
  lastMessageTime: conv.lastMessageTime,
  updatedAt: conv.lastMessageTime,
});

const conversationsOf = (userId) =>
  conversationsStore
    .filter((c) => c.buyerId === userId || c.sellerId === userId)
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

// Initial preloaded conversations
const DEFAULT_CONVERSATIONS = [
  {
    id: 'conv_demo_01',
    productId: 'prod_01',
    productName: 'iPhone 13 128GB Midnight (Chính hãng VN/A)',
    productPrice: 11200000,
    primaryImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
    buyerId: 'user_buyer_linh',
    buyerName: 'Trần Thảo Linh',
    sellerId: 'user_seller_nam',
    sellerName: 'Nguyễn Văn Nam',
    lastMessage: 'Máy còn đầy đủ hóa đơn bảo hành không anh ơi?',
    lastMessageTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      {
        id: 'msg_01',
        senderId: 'user_buyer_linh',
        senderName: 'Trần Thảo Linh',
        text: 'Chào anh Nam, máy iPhone 13 này còn hộp zin không ạ?',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'msg_02',
        senderId: 'user_seller_nam',
        senderName: 'Nguyễn Văn Nam',
        text: 'Chào bạn, máy fullbox đầy đủ que chọc sim và cáp sạc theo máy nhé!',
        timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      },
      {
        id: 'msg_03',
        senderId: 'user_buyer_linh',
        senderName: 'Trần Thảo Linh',
        text: 'Máy còn đầy đủ hóa đơn bảo hành không anh ơi?',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
];

let conversationsStore = [...DEFAULT_CONVERSATIONS];
let hasHydrated = false;

// Realtime In-Memory Event Bus (Pub-Sub)
const messageListeners = new Map(); // convId -> Set<callback>
const conversationListeners = new Map(); // userId -> Set<callback>
const typingListeners = new Map(); // convId -> Set<callback>

// Hydrate from AsyncStorage on startup
// Concurrent first calls share one load; otherwise a late-finishing read could replace
// the store with stale data and drop records written in between
let hydrationPromise = null;
const hydrateStore = () => {
  if (!hydrationPromise) hydrationPromise = hydrateStoreOnce();
  return hydrationPromise;
};

const hydrateStoreOnce = async () => {
  if (hasHydrated) return;
  try {
    const saved = await storage.getChatConversations();
    if (saved && Array.isArray(saved) && saved.length > 0) {
      // Merge saved conversations with defaults, preferring saved versions
      const mergedMap = new Map();
      DEFAULT_CONVERSATIONS.forEach((c) => mergedMap.set(c.id, c));
      saved.forEach((c) => mergedMap.set(c.id, c));
      conversationsStore = Array.from(mergedMap.values());
    }
  } catch (err) {
    console.warn('⚠️ [ChatService] Hydration fallback:', err);
  } finally {
    hasHydrated = true;
  }
};

// Generate guaranteed-unique message ID
const generateUniqueId = (prefix = 'msg') => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  const salt = Math.floor(Math.random() * 100000);
  return `${prefix}_${ts}_${rand}_${salt}`;
};

// Notify message subscribers
const notifyMessageSubscribers = (conversationId, messages) => {
  const callbacks = messageListeners.get(conversationId);
  if (callbacks && callbacks.size > 0) {
    const safeList = [...messages];
    callbacks.forEach((cb) => {
      try {
        cb(safeList);
      } catch (err) {
        console.warn('Listener error in chat:', err);
      }
    });
  }
};

// Notify conversation list subscribers
const notifyConversationSubscribers = (userId) => {
  const callbacks = conversationListeners.get(userId);
  if (callbacks && callbacks.size > 0) {
    const userConvs = conversationsOf(userId);
    callbacks.forEach((cb) => {
      try {
        cb([...userConvs]);
      } catch (err) {
        console.warn('Listener error in conv list:', err);
      }
    });
  }
};

// Notify typing indicator subscribers
const notifyTypingSubscribers = (conversationId, isTyping, typingUserName) => {
  const callbacks = typingListeners.get(conversationId);
  if (callbacks && callbacks.size > 0) {
    callbacks.forEach((cb) => {
      try {
        cb(isTyping, typingUserName);
      } catch (err) {
        console.warn('Listener error in typing:', err);
      }
    });
  }
};

// Contextual Smart Auto-Reply Generator for Interactive Testing
const generateSmartReply = (userText, conv) => {
  const lower = (userText || '').toLowerCase();
  const prodName = conv?.productName || 'món đồ này';

  if (lower.includes('bớt') || lower.includes('giá') || lower.includes('thương lượng') || lower.includes('fix') || lower.includes('mặc cả')) {
    return 'Dạ mức giá này mình đăng đã rất hợp lý cho tình trạng máy rồi ạ! Nếu bạn thiện chí qua xem và lấy trực tiếp, mình xin phép bớt 50k - 100k tiền xăng xe giao lưu vui vẻ nhé!';
  }
  if (lower.includes('còn') || lower.includes('bán chưa') || lower.includes('hết')) {
    return `Chào bạn! Sản phẩm "${prodName}" mình vẫn còn nhé. Tình trạng và hình thức đúng như ảnh chụp trong bài ạ!`;
  }
  if (lower.includes('phụ kiện') || lower.includes('hộp') || lower.includes('sạc') || lower.includes('zin') || lower.includes('bảo hành')) {
    return 'Dạ máy còn đầy đủ phụ kiện theo kèm nguyên bản nhé bạn. Mình giữ gìn rất cẩn thận, bao test thoải mái tại chỗ ạ!';
  }
  if (lower.includes('địa chỉ') || lower.includes('ở đâu') || lower.includes('xem') || lower.includes('qua') || lower.includes('hẹn')) {
    return 'Địa chỉ của mình có hiển thị trên bản đồ vị trí trong bài đăng đó ạ. Bạn tiện lúc nào cứ nhắn trước cho mình tầm 20-30 phút là mình có nhà tiếp bạn ghé test máy nha!';
  }
  if (lower.includes('ship') || lower.includes('giao')) {
    return 'Mình có hỗ trợ tạo đơn giao hàng nhận kiểm tra rồi thanh toán (COD) qua app ReMarket luôn nha bạn!';
  }

  return 'Chào bạn! Cảm ơn bạn đã quan tâm đến sản phẩm của mình. Bạn cần xem thêm ảnh chụp góc nào hoặc muốn hẹn lịch xem máy trực tiếp thì cứ nhắn mình nhé!';
};

export const chatService = {
  // Get all conversations for a user
  async getConversations(userId) {
    await hydrateStore();
    // Only the two participants ever see a conversation (no shared "guest" view)
    return conversationsOf(userId);
  },

  // Get or create conversation between buyer and seller for a product
  async getOrCreateConversation({ product, buyer }) {
    await hydrateStore();
    if (!buyer?.uid) throw new Error('Vui lòng đăng nhập để nhắn tin với người bán');
    if (!product?.sellerId) throw new Error('Không xác định được người bán của sản phẩm');
    if (product.sellerId === buyer.uid) throw new Error('Đây là sản phẩm do bạn đăng bán');
    const buyerId = buyer.uid;
    const buyerName = buyer.displayName || 'Người mua';
    // Deterministic id: the buyer reopening the chat (or the seller's device) lands
    // on the same thread
    const convId = this.getThreadId(buyerId, product.sellerId, product.id);

    let conv = conversationsStore.find(
      (c) => c.id === convId || (c.productId === product.id && c.buyerId === buyerId)
    );

    if (!conv) {
      conv = {
        id: convId,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        primaryImage: product.primaryImage || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
        buyerId,
        buyerName,
        sellerId: product.sellerId,
        sellerName: product.sellerName || 'Người bán',
        lastMessage: 'Bắt đầu cuộc trao đổi',
        lastMessageTime: new Date().toISOString(),
        messages: [
          {
            id: `msg_init_${Date.now()}`,
            senderId: 'system',
            senderName: 'Hệ thống',
            text: `Bạn đang trao đổi về sản phẩm: ${product.name}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      conversationsStore.unshift(conv);
      await storage.saveChatConversations(conversationsStore);
      notifyConversationSubscribers(buyerId);
      notifyConversationSubscribers(conv.sellerId);
    }

    if (isLiveFirebase && db) {
      // The conversation document (with both participants) must exist before any
      // message: the seller's device discovers chats and the security rules check
      // participants through it
      try {
        await setDoc(doc(db, 'conversations', conv.id), toConversationDoc(conv), { merge: true });
      } catch (err) {
        console.warn('⚠️ [Firestore] create conversation failed:', err.message);
      }
    }

    return { ...conv, messages: [...conv.messages] };
  },

  // Deterministic thread helper
  getThreadId(buyerId, sellerId, productId) {
    return `thread_${buyerId}_${sellerId}_${productId}`;
  },

  // Get messages of a conversation
  async getMessages(conversationId) {
    await hydrateStore();
    const conv = conversationsStore.find((c) => c.id === conversationId);
    return conv ? [...conv.messages] : [];
  },

  // Send message with Realtime PubSub, AsyncStorage Persistence, Firestore Sync & Auto-Reply
  async sendMessage(arg1, arg2, arg3) {
    await hydrateStore();

    let conversationId, senderId, senderName, text, productId, isAutoReply;
    if (typeof arg1 === 'object') {
      conversationId = arg1.conversationId || arg1.threadId;
      senderId = arg1.senderId;
      senderName = arg1.senderName || 'Người dùng';
      text = arg1.text;
      productId = arg1.productId;
      isAutoReply = arg1.isAutoReply || false;
    } else {
      conversationId = arg1;
      senderId = arg2;
      text = arg3;
      senderName = 'Người dùng';
      isAutoReply = false;
    }

    if (!senderId) throw new Error('Vui lòng đăng nhập để nhắn tin');
    const cleanText = text ? String(text).trim() : '';
    if (!cleanText) throw new Error('Tin nhắn trống');

    let conv = conversationsStore.find((c) => c.id === conversationId);
    if (!conv) {
      conv = {
        id: conversationId,
        productId: productId || 'unknown',
        productName: 'Trao đổi mua bán',
        productPrice: 0,
        primaryImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
        buyerId: senderId,
        buyerName: senderName,
        sellerId: null,
        sellerName: 'Người bán',
        messages: [],
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
      };
      conversationsStore.push(conv);
    }

    const newMsg = {
      id: generateUniqueId('msg'),
      senderId,
      senderName,
      text: cleanText.slice(0, 1000),
      timestamp: new Date().toISOString(),
      // Simulated replies exist only in offline demo mode and are labelled in the UI
      ...(isAutoReply ? { isSimulated: true } : {}),
    };

    // Immutable update to prevent memory reference leaks and duplicate keys
    conv.messages = [...(conv.messages || []), newMsg];
    conv.lastMessage = newMsg.text;
    conv.lastMessageTime = newMsg.timestamp;

    // 1. Persist to local storage
    await storage.saveChatConversations(conversationsStore);

    // 2. Notify realtime in-memory subscribers (Zero latency!)
    notifyMessageSubscribers(conversationId, conv.messages);
    notifyConversationSubscribers(conv.buyerId);
    notifyConversationSubscribers(conv.sellerId);

    // 3. Firestore Live Sync if connected (conversation doc first: the message rules
    // read the participants from it)
    if (isLiveFirebase && db && conv.sellerId) {
      try {
        await setDoc(doc(db, 'conversations', conversationId), toConversationDoc(conv), { merge: true });
        await setDoc(doc(db, 'conversations', conversationId, 'messages', newMsg.id), newMsg);
      } catch (err) {
        console.warn('⚠️ [Firestore] Realtime chat sync fallback:', err.message);
      }
    }

    // 4. Offline demo only: with no backend there is no second device, so the partner's
    // side is simulated. Never with a live backend: it would put words (e.g. a price
    // discount) in a real seller's mouth.
    if (!isLiveFirebase && !isAutoReply && senderId !== 'system') {
      const isSenderBuyer = senderId === conv.buyerId;
      const partnerId = isSenderBuyer ? conv.sellerId : conv.buyerId;
      const partnerName = isSenderBuyer ? conv.sellerName : conv.buyerName;

      // Only simulate if the partner is an AI/demo account (not current sender)
      if (partnerId) {
        setTimeout(() => {
          // Trigger typing indicator
          notifyTypingSubscribers(conversationId, true, partnerName);

          setTimeout(async () => {
            notifyTypingSubscribers(conversationId, false, partnerName);
            const replyText = generateSmartReply(newMsg.text, conv);

            await chatService.sendMessage({
              conversationId,
              senderId: partnerId,
              senderName: partnerName,
              text: replyText,
              productId: conv.productId,
              isAutoReply: true,
            });
          }, 1500);
        }, 800);
      }
    }

    return newMsg;
  },

  // Realtime subscription to messages for a conversation
  subscribeToMessages(conversationId, callback) {
    if (!messageListeners.has(conversationId)) {
      messageListeners.set(conversationId, new Set());
    }
    const set = messageListeners.get(conversationId);
    set.add(callback);

    // Immediately push current messages
    this.getMessages(conversationId).then((msgs) => {
      callback(msgs);
    });

    // Also attach Firestore onSnapshot if available
    let firestoreUnsubscribe = null;
    if (isLiveFirebase && db) {
      try {
        const q = query(
          collection(db, 'conversations', conversationId, 'messages'),
          orderBy('timestamp', 'asc')
        );
        firestoreUnsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const fsMsgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
              const conv = conversationsStore.find((c) => c.id === conversationId);
              // Deduplicate by id
              const msgMap = new Map();
              (conv?.messages || []).forEach((m) => msgMap.set(m.id, m));
              fsMsgs.forEach((m) => msgMap.set(m.id, m));
              const merged = Array.from(msgMap.values()).sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
              );
              if (conv) {
                conv.messages = merged;
                storage.saveChatConversations(conversationsStore);
              }
              notifyMessageSubscribers(conversationId, merged);
            }
          },
          (err) => {
            console.warn('⚠️ [Firestore] onSnapshot message error:', err.message);
          }
        );
      } catch (err) {
        console.warn('⚠️ [Firestore] subscribeToMessages error:', err.message);
      }
    }

    // Return unsubscribe cleanup function
    return () => {
      set.delete(callback);
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  },

  // Realtime subscription to conversation list for a user
  subscribeToConversations(userId, callback) {
    if (!conversationListeners.has(userId)) {
      conversationListeners.set(userId, new Set());
    }
    const set = conversationListeners.get(userId);
    set.add(callback);

    // Push initial list
    this.getConversations(userId).then((list) => {
      callback(list);
    });

    // Live mode: conversations started on other devices (e.g. a buyer writing to this
    // seller) arrive through Firestore
    const firestoreUnsubs = [];
    if (isLiveFirebase && db && userId) {
      ['buyerId', 'sellerId'].forEach((field) => {
        try {
          const q = query(collection(db, 'conversations'), where(field, '==', userId));
          firestoreUnsubs.push(
            onSnapshot(
              q,
              (snapshot) => {
                snapshot.docs.forEach((d) => {
                  const remote = { ...d.data(), id: d.id };
                  const local = conversationsStore.find((c) => c.id === d.id);
                  if (local) Object.assign(local, remote, { messages: local.messages || [] });
                  else conversationsStore.push({ ...remote, messages: [] });
                });
                storage.saveChatConversations(conversationsStore);
                notifyConversationSubscribers(userId);
              },
              (err) => console.warn('⚠️ [Firestore] conversations listener error:', err.message)
            )
          );
        } catch (err) {
          console.warn('⚠️ [Firestore] subscribeToConversations error:', err.message);
        }
      });
    }

    return () => {
      set.delete(callback);
      firestoreUnsubs.forEach((unsub) => unsub());
    };
  },

  // Realtime subscription to typing indicator
  subscribeToTyping(conversationId, callback) {
    if (!typingListeners.has(conversationId)) {
      typingListeners.set(conversationId, new Set());
    }
    const set = typingListeners.get(conversationId);
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  },
};
