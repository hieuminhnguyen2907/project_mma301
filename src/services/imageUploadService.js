import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage as fbStorage, isLiveFirebase } from '../config/firebase.js';

// Fallback when Firebase Storage is not enabled (it needs a billing account): the photo
// is shrunk and embedded as a data URI so other devices can still display it. Firestore
// documents are capped at 1 MB, so it has to stay small (~40-80 KB per photo).
const INLINE_MAX_WIDTH = 640;
const INLINE_QUALITY = 0.45;
const INLINE_MAX_BYTES = 150 * 1024;

const isRemoteUri = (uri) => /^(https?:|data:)/i.test(uri);

const compressToDataUri = async (localUri) => {
  // Loaded lazily: it is a native module and the services also run under Node tests
  const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
  const rendered = await ImageManipulator.manipulate(localUri)
    .resize({ width: INLINE_MAX_WIDTH })
    .renderAsync();
  const result = await rendered.saveAsync({
    compress: INLINE_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64 || result.base64.length > INLINE_MAX_BYTES * 1.37) {
    throw new Error('Ảnh quá lớn để lưu trực tiếp');
  }
  return `data:image/jpeg;base64,${result.base64}`;
};

export const imageUploadService = {
  // Returns a URL every device can load. folder: 'products' | 'avatars' | 'disputes'
  // (must match storage.rules). Throws when the photo cannot be made shareable, so the
  // caller never saves a file:// path that only exists on this phone.
  async uploadImage(localUri, userId, folder = 'products') {
    if (!localUri || typeof localUri !== 'string') return localUri;
    if (isRemoteUri(localUri)) return localUri;

    // Offline demo mode: nothing is shared between devices, the local file is fine
    if (!isLiveFirebase) return localUri;

    if (fbStorage) {
      try {
        const response = await fetch(localUri);
        const blob = await response.blob();
        const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
        const storageRef = ref(fbStorage, `${folder}/${userId}/${filename}`);
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        return await getDownloadURL(storageRef);
      } catch (err) {
        console.warn('⚠️ [Firebase Storage] upload failed, embedding image instead:', err.message);
      }
    }

    try {
      return await compressToDataUri(localUri);
    } catch (err) {
      throw new Error(`Không thể tải ảnh lên (${err.message}). Vui lòng thử lại.`);
    }
  },

  async uploadImages(localUris = [], userId, folder = 'products') {
    const urls = [];
    for (const uri of localUris) {
      urls.push(await this.uploadImage(uri, userId, folder));
    }
    return urls;
  },
};
