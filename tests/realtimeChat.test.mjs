import { chatService } from '../src/services/chatService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runChatTests() {
  console.log('========================================');
  console.log('REMARKET - REALTIME CHAT VERIFICATION');
  console.log('========================================\n');

  // Test 1: Realtime subscription listener delivers messages
  let receivedMessages = [];
  const testConvId = `conv_test_${Date.now()}`;

  const unsubscribe = chatService.subscribeToMessages(testConvId, (messages) => {
    receivedMessages = messages;
  });

  assert(typeof unsubscribe === 'function', 'Subscription returns valid unsubscribe function');

  // Test 2: Sending a message notifies listener immediately
  const msg1 = await chatService.sendMessage({
    conversationId: testConvId,
    senderId: 'user_tester_a',
    senderName: 'Người mua A',
    text: 'Sản phẩm này còn không bạn?',
    productId: 'prod_test',
  });

  assert(receivedMessages.length >= 1, `Realtime subscriber received message (Count: ${receivedMessages.length})`);
  assert(receivedMessages.some((m) => m.id === msg1.id), 'Sent message ID found in realtime broadcast');

  // Test 3: Rapid sequential sends produce 100% unique IDs (No duplicate keys)
  const ids = new Set();
  ids.add(msg1.id);
  const duplicateIds = [];
  for (let i = 0; i < 5; i++) {
    const msg = await chatService.sendMessage({
      conversationId: testConvId,
      senderId: 'user_tester_a',
      senderName: 'Người mua A',
      text: `Tin nhắn nhanh số ${i + 1}`,
      productId: 'prod_test',
      isAutoReply: true,
    });
    if (ids.has(msg.id)) {
      duplicateIds.push(msg.id);
    }
    ids.add(msg.id);
  }

  assert(duplicateIds.length === 0, `All message IDs are strictly unique (Duplicates found: ${duplicateIds.length})`);
  assert(ids.size === 6, `Total unique IDs in set is 6 (Actual: ${ids.size})`);

  // Test 4: Conversations list subscription
  let userConversations = [];
  const unsubConv = chatService.subscribeToConversations('user_tester_a', (convs) => {
    userConversations = convs;
  });

  // Allow async hydration to deliver initial list
  await new Promise((r) => setTimeout(r, 50));

  assert(typeof unsubConv === 'function', 'Conversation list subscription returns unsubscribe function');
  assert(userConversations.length >= 1, 'User conversations list contains the active chat');

  // Clean up subscriptions
  unsubscribe();
  unsubConv();

  console.log(`\nCHAT VERIFICATION RESULT: ${passed} PASSED | ${failed} FAILED`);
  if (failed > 0) process.exit(1);
}

runChatTests();
