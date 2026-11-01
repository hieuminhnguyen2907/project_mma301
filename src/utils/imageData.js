// Read any image URI (file://, content://, https://) as base64 for the Gemini vision API
export const getBase64FromUri = async (uri) => {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = typeof reader.result === 'string' ? reader.result.split(',')[1] : null;
        resolve(b64 || null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (_err) {
    return null;
  }
};

// Full-resolution camera photos are several MB of base64 each, which made the Gemini
// request slow enough to time out. 1024px is plenty to read labels and spot defects.
// Falls back to the original data when the photo cannot be resized.
export const prepareImageForAi = async ({ uri, base64, mimeType }) => {
  try {
    // Loaded lazily: it is a native module and this file also runs under Node tests
    const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator');
    const rendered = await ImageManipulator.manipulate(uri).resize({ width: 1024 }).renderAsync();
    const result = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
    if (result.base64) return { uri, base64: result.base64, mimeType: 'image/jpeg' };
  } catch (_err) {
    // Keep the original photo
  }
  const b64 = base64 || (await getBase64FromUri(uri));
  return b64 ? { uri, base64: b64, mimeType } : null;
};

// Vietnamese text without diacritics, for keyword matching ("Điện thoại" ~ "dien thoai")
export const foldVietnamese = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
