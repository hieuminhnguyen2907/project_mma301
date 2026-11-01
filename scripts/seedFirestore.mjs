// Node.js Database Seeding Script for Cloud Firestore
// Usage: npm run db:seed                      (categories only)
//        npm run db:seed -- --with-sample-products
//
// The security rules only let an admin write categories, so the script signs in with
// SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD from .env (an account whose users/{uid}.role is
// 'admin', see FIREBASE_SETUP_GUIDE.md). Demo users are not seeded: without a Firebase
// Auth account they could never sign in.

import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { DEFAULT_CATEGORIES } from '../src/constants/categories.js';
import { MOCK_PRODUCTS } from '../src/services/mockData.js';

const WITH_SAMPLE_PRODUCTS = process.argv.includes('--with-sample-products');

// Parse .env file manually without requiring dotenv package
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Không tìm thấy file .env tại thư mục gốc!');
    console.log('👉 Hãy copy file .env.example thành .env và điền các khóa cấu hình Firebase của bạn.');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        env[key] = value;
      }
    }
  });
  return env;
}

async function seed() {
  console.log('\n======================================================');
  console.log('🔥 REMARKET - SEEDING CLOUD FIRESTORE DATABASE');
  console.log('======================================================\n');

  const env = loadEnv();

  const firebaseConfig = {
    apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || firebaseConfig.apiKey.includes('xxxx')) {
    console.error('❌ Cấu hình Firebase trong .env chưa hợp lệ hoặc còn chứa mã giả lập.');
    console.log('👉 Vui lòng dán đúng apiKey và projectId từ Firebase Console.');
    process.exit(1);
  }

  console.log(`📡 Đang kết nối tới Firebase Project: [${firebaseConfig.projectId}]...`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    console.error('❌ Thiếu SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD trong .env (tài khoản admin thật).');
    process.exit(1);
  }
  const { user } = await signInWithEmailAndPassword(getAuth(app), env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD);
  console.log(`🔐 Đã đăng nhập admin: ${user.email}`);

  // 1. Seed Categories
  console.log('\n[1/2] Đang nạp danh mục sản phẩm (categories & conditionFieldSchemas)...');
  for (const cat of DEFAULT_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), {
      ...cat,
      isActive: true,
      updatedAt: new Date().toISOString(),
    });
    console.log(`  ✓ Đã thêm danh mục: ${cat.name} (${cat.id})`);
  }

  // 2. Seed Products (opt-in: their sellers are demo accounts nobody can sign in to, so
  // orders on them would never be confirmed; use only for a showcase database)
  if (!WITH_SAMPLE_PRODUCTS) {
    console.log('\n[2/2] Bỏ qua sản phẩm mẫu (thêm --with-sample-products nếu cần dữ liệu trưng bày).');
  }
  for (const prod of WITH_SAMPLE_PRODUCTS ? MOCK_PRODUCTS : []) {
    await setDoc(doc(db, 'products', prod.id), {
      ...prod,
      updatedAt: new Date().toISOString(),
    });
    console.log(`  ✓ Đã thêm sản phẩm: ${prod.name} - Giá: ${prod.price.toLocaleString('vi-VN')} đ`);
  }

  console.log('\n======================================================');
  console.log('🎉 NẠP DỮ LIỆU LÊN CLOUD FIRESTORE THÀNH CÔNG RỰC RỠ!');
  console.log('======================================================\n');
  console.log('Bây giờ cơ sở dữ liệu Firebase của bạn đã có đầy đủ:');
  console.log(`- ${DEFAULT_CATEGORIES.length} danh mục ngành hàng kèm schema điều kiện động.`);
  if (WITH_SAMPLE_PRODUCTS) {
    console.log(`- ${MOCK_PRODUCTS.length} sản phẩm đồ cũ mẫu (người bán là tài khoản demo).`);
  }
  console.log('\nBạn có thể vào Firebase Console > Firestore Database để kiểm tra!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Lỗi khi nạp dữ liệu lên Firestore:', err.message);
  process.exit(1);
});
