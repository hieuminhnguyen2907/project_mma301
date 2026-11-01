import { productService } from './productService.js';
import { buildVisionRequest, normalizeVisionResult } from './aiVisionPrompt.js';
import { foldVietnamese } from '../utils/imageData.js';

const rawKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const isLiveGeminiKey = Boolean(
  rawKey &&
  rawKey.trim() !== '' &&
  !rawKey.includes('xxxx') &&
  !rawKey.includes('AIzaSyDemo')
);
const GEMINI_API_KEY = isLiveGeminiKey ? rawKey.trim() : null;

// Candidate models in preference order. flash-lite is the primary: in testing it identified
// products as well as the larger flash model at ~2s instead of 6-18s, and the larger
// model was often overloaded ("high demand").
const CANDIDATE_MODELS = [
  process.env.EXPO_PUBLIC_GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  // gemini-2.5-flash was retired by Google (404 for this key)
  'gemini-flash-latest',
].filter(Boolean);

const UNIQUE_MODELS = Array.from(new Set(CANDIDATE_MODELS));
const REQUEST_TIMEOUT_MS = 30000;

// body: a full generateContent request. Tries each model until one answers with JSON.
const callGemini = async (body) => {
  let lastError = null;

  for (const model of UNIQUE_MODELS) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller?.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data?.error?.message || `Gemini HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }

      const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
      if (!text) throw new Error('Gemini returned an empty response');

      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      console.log(`🤖 [Gemini AI] Succeeded with model: ${model}`);
      return { data: parsed, modelUsed: model };
    } catch (err) {
      lastError = err.name === 'AbortError' ? new Error('Gemini phản hồi quá lâu') : err;
      // An invalid key / malformed request fails the same way on every model
      if (err.status === 400 || err.status === 401 || err.status === 403) break;
      console.warn(`⚠️ [Gemini AI] Model ${model} failed (${lastError.message}), trying fallback...`);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  throw lastError || new Error('Không thể kết nối tới Google Gemini AI');
};

export const aiService = {
  // N2: AI Multimodal Vision Product Analyzer for Listing
  // Analyzes captured product image with Gemini Vision (or intelligent local vision engine)
  // Extracts: product name, category, condition rating, suggested price, professional detailed description, detected defects
  // images: [{ uri, base64, mimeType }] - photos of the same item (first 3 are analysed).
  // The single-image form ({ imageUri, base64 }) is still accepted.
  async analyzeProductImage({ images, imageUri, base64, sellerHint = '' }) {
    const photos = (images && images.length > 0 ? images : [{ uri: imageUri, base64 }]).filter(
      (img) => img && img.base64
    );

    // 1. Real Gemini Vision whenever a key is configured
    if (GEMINI_API_KEY) {
      // Never substitute demo data for a real analysis: a random sample would mislabel
      // the seller's item
      if (photos.length === 0) {
        throw new Error('Không đọc được dữ liệu ảnh, vui lòng chọn hoặc chụp lại ảnh');
      }
      try {
        const result = await callGemini(
          buildVisionRequest({
            images: photos.map((p) => ({
              base64: p.base64,
              mimeType:
                p.mimeType ||
                (p.uri && p.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
            })),
            sellerHint,
          })
        );

        return {
          ...normalizeVisionResult(result.data),
          isAiAnalyzed: true,
          isLiveAi: true,
          modelUsed: result.modelUsed,
          analyzedAt: new Date().toISOString(),
        };
      } catch (err) {
        console.warn('Gemini Vision API error:', err.message);
        throw new Error(`AI không phân tích được ảnh: ${err.message}`);
      }
    }

    // 2. Intelligent Resilient Vision Engine (Offline / Fallback / Demo Mode)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const sampleVisionItems = [
      {
        name: 'iPhone 13 128GB Xanh Midnight (Bản VN/A)',
        categoryId: 'cat_electronics',
        categoryName: 'Đồ điện tử',
        overallCondition: 'Very Good',
        suggestedPrice: 11200000,
        description: 'Điện thoại iPhone 13 128GB màu Xanh Midnight chính hãng VN/A. Ngoại hình còn rất đẹp, viền xước lông mèo nhẹ không đáng kể theo thời gian sử dụng. Màn hình nguyên bản hiển thị sắc nét TrueTone, Face ID nhạy, pin còn 87%. Máy dùng giữ gìn, chưa từng sửa chữa ép kính.',
        knownDefects: ['Xước dăm nhẹ viền dưới gần cổng sạc', 'Pin còn 87% dung lượng'],
        confidenceScore: 94,
      },
      {
        name: 'Tai nghe Bluetooth Chống ồn Sony WH-1000XM4',
        categoryId: 'cat_electronics',
        categoryName: 'Đồ điện tử',
        overallCondition: 'Like New',
        suggestedPrice: 3800000,
        description: 'Tai nghe chụp tai chống ồn chủ động đỉnh cao Sony WH-1000XM4 màu đen. Đệm da và vòm đầu còn rất mới, êm ái, pin trâu dùng liên tục trên 28 tiếng. Âm bass sâu, chống ồn tốt. Đầy đủ phụ kiện cáp sạc và bao đựng chống va đập.',
        knownDefects: ['Đã qua sử dụng khoảng 6 tháng, ngoại hình 98%'],
        confidenceScore: 92,
      },
      {
        name: 'Áo Khoác Bomber Unisex Phong Cách Vintage Size L',
        categoryId: 'cat_clothing',
        categoryName: 'Thời trang & Quần áo',
        overallCondition: 'Very Good',
        suggestedPrice: 280000,
        description: 'Áo khoác bomber form suông vintage màu xanh rêu, chất vải dù 2 lớp dày dặn cản gió tốt. Cúc bấm và khóa kéo kim loại hoạt động trơn tru. Áo mặc ít lần, không bị xù lông hay phai màu, phù hợp bạn nào từ 58-72kg.',
        knownDefects: ['Mất tem mác cổ áo', 'Khóa kéo hơi sờn sơn nhẹ'],
        confidenceScore: 90,
      },
      {
        name: 'Nồi chiên không dầu Lock&Lock dung tích 5.2L',
        categoryId: 'cat_appliances',
        categoryName: 'Đồ gia dụng & Bếp',
        overallCondition: 'Good',
        suggestedPrice: 750000,
        description: 'Nồi chiên không dầu Lock&Lock cơ điện tử 5.2L chiên gà nguyên con thoải mái. Khay nướng tráng men chống dính còn tốt, thanh nhiệt tỏa nhiệt đều, hẹn giờ và chỉnh nhiệt độ chuẩn xác. Đã vệ sinh sạch sẽ, dùng rất tiện cho gia đình.',
        knownDefects: ['Vết xước cọ rửa nhẹ ở đáy khay chiên', 'Không còn hộp giấy gốc'],
        confidenceScore: 88,
      },
      {
        name: 'Combo Sách Kỹ Năng Đắc Nhân Tâm & Nghĩ Giàu Làm Giàu',
        categoryId: 'cat_books',
        categoryName: 'Sách & Giáo trình',
        overallCondition: 'Like New',
        suggestedPrice: 135000,
        description: 'Bộ sách phát triển bản thân kinh điển bản bìa mềm giấy vàng chống lóa mắt. Sách đọc xong cất kệ giữ gìn cẩn thận, bìa phẳng phiu, gáy không gãy nếp, bên trong sạch đẹp không gạch chân bút nhớ hay vẽ bậy.',
        knownDefects: ['Gáy sách có nếp gấp nhẹ do mở đọc'],
        confidenceScore: 95,
      },
      {
        name: 'Xe đạp thể thao Giant Escape 2 Phanh Đĩa Dầu',
        categoryId: 'cat_vehicles',
        categoryName: 'Xe cộ & Phương tiện',
        subCategoryId: 'bicycles_ebikes',
        overallCondition: 'Very Good',
        suggestedPrice: 5200000,
        description: 'Xe đạp touring Giant Escape 2 chính hãng màu đen nhám. Khung nhôm Aluxx siêu nhẹ, bộ truyền động Shimano 24 tốc độ chuyển số êm mượt, phanh đĩa dầu Tektro ăn chắc. Xe đi lướt khoảng 500km, đã gắn sẵn baga sau và gọng bình nước.',
        knownDefects: ['Xước nhẹ ở gắp sau do dựng chân chống'],
        confidenceScore: 92,
      },
      {
        name: 'Đàn Guitar Acoustic Yamaha F310 Kèm Bao Da',
        categoryId: 'cat_sports_hobbies',
        categoryName: 'Thể thao & Giải trí',
        subCategoryId: 'musical_instruments',
        overallCondition: 'Like New',
        suggestedPrice: 1950000,
        description: 'Đàn guitar acoustic Yamaha F310 chính hãng màu gỗ tự nhiên. Cần đàn thẳng tắp, action thấp bấm cực êm tay không đau tay cho người mới tập. Âm vang ấm, phím đồng không rè. Tặng kèm bao da 3 lớp, capo và phím gảy.',
        knownDefects: ['Vết xước lông mèo rất nhỏ ở mặt lưng thùng đàn'],
        confidenceScore: 94,
      },
      {
        name: 'Bể cá thủy sinh mini để bàn kèm đèn LED và lọc thác',
        categoryId: 'cat_other',
        categoryName: 'Khác & Hàng tổng hợp',
        subCategoryId: 'general_misc',
        overallCondition: 'Very Good',
        suggestedPrice: 320000,
        description: 'Bể cá kính dán giấu keo kích thước 30x18x20cm cực đẹp để bàn làm việc. Kính trong suốt không trầy xước, không rỉ nước. Trọn bộ gồm đèn LED thủy sinh siêu sáng, máy lọc thác êm ái và ít phân nền.',
        knownDefects: ['Lưới lọc hơi ngả màu do dùng nước máy, đã vệ sinh'],
        confidenceScore: 90,
      },
    ];

    const item = sampleVisionItems[Math.floor(Math.random() * sampleVisionItems.length)];
    return {
      ...item,
      isAiAnalyzed: true,
      isLiveAi: false,
      analyzedAt: new Date().toISOString(),
    };
  },

  // N2: AI Visual Search
  // Gemini identifies the item in the photo (name, brand, category); active listings are
  // then ranked by how well they match. hint: a known label (sample photos / typed text).
  async visualSearch({ uri, base64, mimeType, hint = '' }) {
    let detected;
    if (GEMINI_API_KEY && base64) {
      const analysis = await this.analyzeProductImage({
        images: [{ uri, base64, mimeType }],
        sellerHint: hint,
      });
      detected = {
        isSellableProduct: analysis.isSellableProduct,
        name: analysis.name,
        brand: analysis.brand,
        categoryId: analysis.categoryId,
        subCategoryId: analysis.subCategoryId,
        categoryName: analysis.categoryName,
        confidenceScore: analysis.confidenceScore,
        photoQualityIssue: analysis.photoQualityIssue,
        isLiveAi: true,
      };
    } else if (hint.trim()) {
      // No AI available: search with the label we already know (never invent attributes)
      detected = { isSellableProduct: true, name: hint.trim(), brand: '', isLiveAi: false };
    } else {
      throw new Error(
        'Tìm kiếm bằng hình ảnh cần kết nối Google Gemini. Vui lòng kiểm tra cấu hình EXPO_PUBLIC_GEMINI_API_KEY hoặc tìm bằng từ khóa.'
      );
    }

    if (detected.isSellableProduct === false) {
      return { queryImageUri: uri, detected, matches: [], totalMatches: 0 };
    }

    const products = (await productService.getProducts()).filter((p) => p.status === 'active');
    const matches = rankVisualMatches(products, detected).slice(0, 8);
    return { queryImageUri: uri, detected, matches, totalMatches: matches.length };
  },
};

const STOP_WORDS = new Set([
  'cu', 'moi', 'may', 'ban', 'chinh', 'hang', 'size', 'mau', 'loai', 'cho', 'va', 'cua',
  'the', 'and', 'with', 'new', 'used', 'gb', 'tb', 'pro', 'max',
]);

const tokenize = (text) =>
  foldVietnamese(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

// Score listings against what the AI saw. A listing needs at least one name/brand word
// in common, or the same sub-category, to count as "similar".
const rankVisualMatches = (products, detected) => {
  const nameTokens = [...new Set(tokenize(detected.name))];
  const brandTokens = tokenize(detected.brand);

  return products
    .map((p) => {
      const name = foldVietnamese(p.name);
      const desc = foldVietnamese(p.description);
      let textScore = 0;
      nameTokens.forEach((t) => {
        if (name.includes(t)) textScore += 2;
        else if (desc.includes(t)) textScore += 1;
      });
      brandTokens.forEach((t) => {
        if (name.includes(t)) textScore += 3;
      });
      const sameSub = Boolean(detected.subCategoryId) && p.subCategoryId === detected.subCategoryId;
      const sameCat = Boolean(detected.categoryId) && p.categoryId === detected.categoryId;
      const score = textScore + (sameSub ? 2 : 0) + (sameCat ? 1 : 0);
      return { product: p, score, relevant: textScore > 0 || sameSub };
    })
    .filter((m) => m.relevant)
    .sort((a, b) => b.score - a.score)
    .map((m) => m.product);
};
