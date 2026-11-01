import { MOCK_USERS } from './mockData.js';
import { storage } from '../utils/storage.js';
import { deepClone } from '../utils/clone.js';
import { auth, db, isLiveFirebase } from '../config/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

// Built-in demo accounts (any password) exist only in offline demo mode. With a live
// Firebase project they must never be reachable: "admin@remarket.vn" + any 6 characters
// would otherwise open the admin console of the published app.
const DEMO_MODE_DISABLED_MESSAGE =
  'Tài khoản demo chỉ dùng được ở chế độ ngoại tuyến. Vui lòng đăng nhập bằng tài khoản thật.';

const SUSPENDED_MESSAGE = 'Tài khoản của bạn đã bị quản trị viên tạm khóa';

// Firebase restores its persisted sign-in asynchronously after launch
const waitForAuthReady = async () => {
  if (!auth || typeof auth.authStateReady !== 'function') return;
  await Promise.race([
    auth.authStateReady(),
    new Promise((resolve) => setTimeout(resolve, 8000)),
  ]);
};

// Local in-memory users state initialized from MOCK_USERS
let usersStore = deepClone(MOCK_USERS);

// Insert or replace a user in the in-memory store (Firebase accounts and restored
// sessions are not part of MOCK_USERS, but address/profile updates need them here)
const upsertUser = (user) => {
  const index = usersStore.findIndex((u) => u.uid === user.uid);
  if (index === -1) {
    usersStore.push(user);
  } else {
    usersStore[index] = user;
  }
  return user;
};

// Find a user by uid, falling back to the saved session for the signed-in account
const resolveUser = async (uid) => {
  const existing = usersStore.find((u) => u.uid === uid);
  if (existing) return existing;
  const session = await storage.getUser();
  if (session && session.uid === uid) {
    return upsertUser({ ...session, addresses: session.addresses || [] });
  }
  return null;
};

// Only the signed-in account may be written to the persisted session
const saveSessionIfCurrent = async (user) => {
  const session = await storage.getUser();
  if (session && session.uid === user.uid) {
    await storage.saveUser(user);
  }
};

const syncUserDoc = async (uid, data) => {
  if (!isLiveFirebase || !db) return;
  try {
    await updateDoc(doc(db, 'users', uid), data);
  } catch (err) {
    console.warn('⚠️ [Firestore] user sync failed:', err.message);
  }
};

const FIREBASE_AUTH_MESSAGES = {
  'auth/invalid-credential': 'Email hoặc mật khẩu không chính xác',
  'auth/wrong-password': 'Email hoặc mật khẩu không chính xác',
  'auth/user-not-found': 'Email không tồn tại trong hệ thống',
  'auth/invalid-email': 'Định dạng email không hợp lệ',
  'auth/email-already-in-use': 'Email này đã được đăng ký trên ReMarket',
  'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự)',
  'auth/too-many-requests': 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau',
  'auth/network-request-failed': 'Không có kết nối mạng, vui lòng kiểm tra lại',
};

const toFriendlyAuthError = (err, fallback) =>
  new Error(FIREBASE_AUTH_MESSAGES[err?.code] || err?.message || fallback);

export const authService = {
  // Login with email and password
  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Live Firebase is available, authenticate with Firebase Auth
    if (isLiveFirebase && auth && db) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;

        // Fetch user profile document from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userDocRef);

        let userProfile;
        if (userSnap.exists()) {
          userProfile = { uid: fbUser.uid, addresses: [], ...userSnap.data() };
        } else {
          // Create initial user profile if missing
          userProfile = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email.split('@')[0],
            phoneNumber: fbUser.phoneNumber || '',
            avatarUrl: fbUser.photoURL || null,
            role: 'buyer_seller',
            status: 'active',
            ratingAverage: 0,
            ratingCount: 0,
            totalSales: 0,
            totalOrders: 0,
            addresses: [],
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, userProfile);
        }

        if (userProfile.status === 'suspended') {
          await signOut(auth);
          throw new Error(SUSPENDED_MESSAGE);
        }

        upsertUser(userProfile);
        await storage.saveUser(userProfile);
        return deepClone(userProfile);
      } catch (fbErr) {
        // Live mode: Firebase is the only authority, never fall back to demo accounts
        throw toFriendlyAuthError(fbErr, 'Email hoặc mật khẩu không chính xác');
      }
    }

    // 2. Demo / Fallback local authentication
    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('Email không tồn tại trong hệ thống');
    }

    if (user.status === 'suspended') {
      throw new Error('Tài khoản của bạn đã bị quản trị viên tạm khóa');
    }

    if (password.length < 6) {
      throw new Error('Mật khẩu không chính xác');
    }

    await storage.saveUser(user);
    return deepClone(user);
  },

  // Register a new user
  async register({ displayName, email, phoneNumber, password }) {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Live Firebase is available, register with Firebase Auth
    if (isLiveFirebase && auth && db) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const fbUser = userCredential.user;

        const newUser = {
          uid: fbUser.uid,
          email: cleanEmail,
          displayName: displayName.trim(),
          phoneNumber: phoneNumber.trim(),
          avatarUrl: null,
          role: 'buyer_seller',
          status: 'active',
          ratingAverage: 0,
          ratingCount: 0,
          totalSales: 0,
          totalOrders: 0,
          addresses: [],
          createdAt: new Date().toISOString(),
        };

        // Write to Cloud Firestore
        await setDoc(doc(db, 'users', fbUser.uid), newUser);
        upsertUser(newUser);
        await storage.saveUser(newUser);
        return deepClone(newUser);
      } catch (fbErr) {
        throw toFriendlyAuthError(fbErr, 'Đăng ký tài khoản Firebase thất bại');
      }
    }

    // 2. Demo / Fallback local registration
    await new Promise((resolve) => setTimeout(resolve, 300));
    const existing = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('Email này đã được đăng ký trên ReMarket');
    }

    const newUser = {
      uid: `user_${Date.now()}`,
      email: cleanEmail,
      displayName: displayName.trim(),
      phoneNumber: phoneNumber.trim(),
      avatarUrl: null,
      role: 'buyer_seller',
      status: 'active',
      ratingAverage: 0,
      ratingCount: 0,
      totalSales: 0,
      totalOrders: 0,
      addresses: [],
      createdAt: new Date().toISOString(),
    };

    usersStore.push(newUser);
    await storage.saveUser(newUser);
    return deepClone(newUser);
  },

  // One-click demo login for fast testing & grading
  async demoLogin(role = 'buyer') {
    if (isLiveFirebase) throw new Error(DEMO_MODE_DISABLED_MESSAGE);
    await new Promise((resolve) => setTimeout(resolve, 200));

    let user;
    if (role === 'admin') {
      user = usersStore.find((u) => u.role === 'admin');
    } else if (role === 'seller') {
      user = usersStore.find((u) => u.uid === 'user_seller_nam');
    } else {
      user = usersStore.find((u) => u.uid === 'user_buyer_linh');
    }

    if (!user) {
      user = usersStore[0];
    }

    if (user.status === 'suspended') {
      throw new Error('Tài khoản của bạn đã bị quản trị viên tạm khóa');
    }

    await storage.saveUser(user);
    return deepClone(user);
  },

  // Logout
  async logout() {
    if (isLiveFirebase && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Firebase signout:', e.message);
      }
    }
    await storage.removeUser();
    return true;
  },

  // Restore existing session
  async getCurrentSession() {
    let session = await storage.getUser();
    if (!session) return null;

    if (isLiveFirebase && auth && db) {
      await waitForAuthReady();
      // The saved session must belong to the account Firebase actually has signed in
      // (old demo sessions or a revoked sign-in are dropped)
      if (!auth.currentUser || auth.currentUser.uid !== session.uid) {
        await storage.removeUser();
        return null;
      }
      try {
        const snap = await getDoc(doc(db, 'users', session.uid));
        if (snap.exists()) {
          // Pick up a suspension, rating or address change made on another device
          session = { ...session, ...snap.data(), uid: session.uid };
          await storage.saveUser(session);
        }
      } catch (err) {
        // Offline: keep using the saved session
        console.warn('⚠️ [Firestore] session refresh failed:', err.message);
      }
      if (session.status === 'suspended') {
        await this.logout();
        throw new Error(SUSPENDED_MESSAGE);
      }
    }

    // The saved session holds the latest addresses/profile edits for this account
    upsertUser({ ...session, addresses: session.addresses || [] });
    return deepClone(session);
  },

  // Send password reset email (Firebase) or simulate it in demo mode
  async resetPassword(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (isLiveFirebase && auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return true;
      } catch (fbErr) {
        throw toFriendlyAuthError(fbErr, 'Không thể gửi email khôi phục mật khẩu');
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
    return true;
  },

  // Update profile (also used to refresh a seller's rating, so it must never touch
  // another account's session)
  async updateProfile(uid, updateData) {
    await syncUserDoc(uid, { ...updateData, updatedAt: new Date().toISOString() });

    await new Promise((resolve) => setTimeout(resolve, 300));
    const user = await resolveUser(uid);
    const updatedUser = {
      ...(user || { uid }),
      ...updateData,
      uid,
      updatedAt: new Date().toISOString(),
    };
    if (user) upsertUser(updatedUser);
    await saveSessionIfCurrent(updatedUser);
    return deepClone(updatedUser);
  },

  // Add delivery address
  async addAddress(uid, addressData) {
    const user = await resolveUser(uid);
    if (!user) throw new Error('Không tìm thấy người dùng');

    const currentAddresses = user.addresses || [];
    const newAddress = {
      id: `addr_${Date.now()}`,
      ...addressData,
      isDefault: currentAddresses.length === 0 ? true : addressData.isDefault || false,
    };

    const addresses = [
      ...(newAddress.isDefault
        ? currentAddresses.map((a) => ({ ...a, isDefault: false }))
        : currentAddresses),
      newAddress,
    ];

    const updatedUser = upsertUser({ ...user, addresses });
    await syncUserDoc(uid, { addresses });
    await saveSessionIfCurrent(updatedUser);
    return deepClone(updatedUser);
  },

  // Set default address
  async setDefaultAddress(uid, addressId) {
    const user = await resolveUser(uid);
    if (!user) throw new Error('Không tìm thấy người dùng');

    const addresses = (user.addresses || []).map((a) => ({
      ...a,
      isDefault: a.id === addressId,
    }));

    const updatedUser = upsertUser({ ...user, addresses });
    await syncUserDoc(uid, { addresses });
    await saveSessionIfCurrent(updatedUser);
    return deepClone(updatedUser);
  },

  // Get all users (Admin use only)
  async getAllUsers() {
    if (isLiveFirebase && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        // Live mode: the Firestore accounts are the real user base (no demo accounts)
        const remoteUsers = snap.docs.map((d) => ({ uid: d.id, addresses: [], ...d.data() }));
        remoteUsers.forEach(upsertUser);
        return deepClone(remoteUsers);
      } catch (err) {
        console.warn('⚠️ [Firestore] getAllUsers fallback:', err.message);
      }
    }
    return deepClone(usersStore);
  },

  // Toggle user suspension (Admin use only)
  async toggleUserStatus(uid, currentStatus) {
    const user = usersStore.find((u) => u.uid === uid);
    if (!user) throw new Error('Không tìm thấy người dùng');
    if (user.role === 'admin') throw new Error('Không thể khóa tài khoản quản trị viên');
    const status = currentStatus === 'active' ? 'suspended' : 'active';
    if (isLiveFirebase && db) {
      // Must reach Firestore: a lock that only exists on the admin's phone does nothing
      await updateDoc(doc(db, 'users', uid), { status, updatedAt: new Date().toISOString() });
    }
    const updatedUser = upsertUser({ ...user, status });
    return deepClone(updatedUser);
  },
};
