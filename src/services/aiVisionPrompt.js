// Prompt + structured-output schema for the Gemini listing analyzer.
// Kept free of React Native imports so it can be exercised from Node tests.
import { DEFAULT_CATEGORIES, getCategoryConditionSchema } from '../constants/categories.js';

export const CONDITION_RATINGS = ['Like New', 'Very Good', 'Good', 'Acceptable'];
const CATEGORY_IDS = DEFAULT_CATEGORIES.map((c) => c.id);
const SUB_CATEGORY_IDS = DEFAULT_CATEGORIES.flatMap((c) => (c.subCategories || []).map((s) => s.id));

// Condition fields the AI may pre-fill, per sub-category (the form the seller actually
// fills): only what a photo of the outside can show. Pages, working condition, battery
// etc. stay with the seller, who is legally the one declaring the condition.
export const AI_FILLABLE_FIELDS = {
  // Electronics
  phones_tablets: ['screenCondition', 'bodyCondition'],
  laptops_computers: ['bodyCondition'],
  desktop_pc: ['exteriorCondition'],
  monitors_tv: ['exteriorCondition'],
  audio_headphones: ['exteriorAndEarPads'],
  speakers_audio: ['exteriorCondition'],
  chargers_power: ['exteriorCondition'],
  peripherals_accessories: ['exteriorCondition'],
  cameras: ['bodyCondition'],
  wearables: ['bodyCondition'],
  gaming_consoles: ['exteriorCondition'],
  other_electronics: ['exteriorCondition'],
  // Fashion
  apparel: ['fabricCondition', 'gender'],
  footwear: ['upperCondition', 'soleCondition'],
  bags_wallets: ['materialType', 'exteriorCorners'],
  watches: ['accessoryCondition', 'strapCondition'],
  eyewear: ['frameCondition'],
  fashion_accessories: ['exteriorCondition'],
  // Books & study
  general_books: ['coverCondition'],
  textbooks_academic: ['coverAndBinding'],
  comics_manga: ['jacketCondition'],
  stationery_tools: ['exteriorLook'],
  art_supplies: ['exteriorLook'],
  // Home
  electric_kitchen: ['cleanliness'],
  cookware_tableware: ['surfaceCondition', 'material'],
  home_cooling_cleaning: ['cleanliness'],
  large_appliances: ['exteriorCondition'],
  furniture_decor: ['surfaceWear'],
  other_household: ['exteriorCondition'],
  // Vehicles
  motorbikes_scooters: ['exteriorCondition'],
  bicycles_ebikes: ['exteriorCondition'],
  helmets_accessories: ['helmetShellVisor'],
  other_vehicles: ['exteriorCondition'],
  // Sports & Hobbies
  musical_instruments: ['exteriorCondition'],
  sports_equipment: ['exteriorCondition'],
  collectibles_toys: ['exteriorCondition'],
  camping_outdoor: ['cleanliness'],
  other_sports_hobbies: ['exteriorCondition'],
  // Other
  handicraft_art: ['exteriorCondition'],
  pet_supplies: ['exteriorCondition', 'cleanliness'],
  beauty_care: ['exteriorCondition'],
  general_misc: ['exteriorCondition'],
};

const fillableFields = (categoryId, subCategoryId) =>
  getCategoryConditionSchema(categoryId, subCategoryId).filter(
    (f) => f.type === 'select' && (AI_FILLABLE_FIELDS[subCategoryId] || []).includes(f.fieldKey)
  );

const describeConditionSchemas = () =>
  DEFAULT_CATEGORIES.map((cat) => {
    const subs = (cat.subCategories || [])
      .map((sub) => {
        const fields = fillableFields(cat.id, sub.id)
          .map((f) => `      - ${f.fieldKey} (${f.label}): ${f.options.map((o) => `"${o}"`).join(' | ')}`)
          .join('\n');
        // The examples let the model tell close types apart (a charger is not a keyboard)
        return `    ${sub.id} (${sub.name} - ví dụ: ${sub.description}):\n${fields}`;
      })
      .join('\n');
    return `  ${cat.id} (${cat.name}):\n${subs}`;
  }).join('\n');

const buildPrompt = (sellerHint) => `Bạn là chuyên viên thẩm định đồ cũ của chợ ReMarket (Việt Nam). Nhiệm vụ: nhìn ảnh người bán vừa chụp và tạo bản nháp tin đăng TRUNG THỰC để người bán tự kiểm tra lại.

QUY TẮC BẮT BUỘC:
1. Chỉ mô tả những gì THỰC SỰ NHÌN THẤY trong ảnh. Nếu có nhiều ảnh, chúng là cùng một món đồ chụp từ nhiều góc.
2. Nhận diện thương hiệu/model dựa trên đặc điểm nhìn thấy (logo, chữ in, cụm camera, kiểu dáng). Luôn ghi model KHẢ DĨ NHẤT vào name (vd "iPhone 11 Pro", "Tai nghe Sony WH-1000XM4"); nếu chưa chắc chắn thì vẫn ghi dự đoán đó nhưng thêm "model" vào uncertainFields. Chỉ dùng tên chung chung khi hoàn toàn không có đặc điểm nhận dạng.
3. KHÔNG bịa thông số không thể thấy qua ảnh: dung lượng bộ nhớ, % pin, size quần áo, năm sản xuất, tình trạng hoạt động bên trong. Những thông tin này để người bán tự điền.
4. Đánh giá tình trạng ngoại hình thận trọng: chỉ chọn "Like New" khi ảnh đủ rõ và không thấy dấu hiệu sử dụng. Ảnh chụp sản phẩm đã qua sử dụng thường là "Very Good" hoặc "Good". Liệt kê mọi vết xước, móp, ố, sờn, bong tróc nhìn thấy vào knownDefects (mảng rỗng nếu không thấy).
5. Nếu ảnh không chứa một món đồ có thể bán lại (ví dụ: đồ ăn, người, phong cảnh, ảnh màn hình), đặt isSellableProduct = false và giải thích trong photoQualityIssue.
6. Nếu ảnh mờ, tối, bị che, quá xa, đặt photoQualityIssue mô tả ngắn cách chụp lại; ngược lại để chuỗi rỗng.
7. categoryId chỉ được chọn trong: ${CATEGORY_IDS.join(', ')}; subCategoryId là loại sản phẩm THUỘC đúng danh mục đó (liệt kê kèm ví dụ ở mục 9). Chọn loại có ví dụ khớp nhất với món đồ; nếu không loại nào khớp thì chọn loại "khác" (other_...) của danh mục đó, không ép vào loại gần giống.
8. Giá: ước lượng khoảng giá ĐỒ CŨ tại Việt Nam (VNĐ, số nguyên) theo tình trạng nhìn thấy, priceMin <= priceMax. Không chắc thì để khoảng rộng.
9. conditionFields: chỉ điền các trường của ĐÚNG phân loại con đã chọn mà ảnh cho thấy rõ, giá trị phải chép NGUYÊN VĂN một trong các lựa chọn dưới đây. Không thấy rõ thì bỏ qua trường đó.
${describeConditionSchemas()}
10. name ngắn gọn (tối đa 80 ký tự), description 2-4 câu tiếng Việt, tự nhiên, không cam kết bảo hành hay chất lượng bên trong.
11. confidence (0-100) phản ánh mức chắc chắn về việc nhận diện đúng món đồ.
${sellerHint ? `\nThông tin người bán đã gõ (chỉ để tham khảo, ảnh là căn cứ chính): "${sellerHint}"` : ''}`;

export const VISION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isSellableProduct: { type: 'BOOLEAN' },
    name: { type: 'STRING' },
    brand: { type: 'STRING' },
    categoryId: { type: 'STRING', enum: CATEGORY_IDS },
    subCategoryId: { type: 'STRING', enum: SUB_CATEGORY_IDS },
    overallCondition: { type: 'STRING', enum: CONDITION_RATINGS },
    description: { type: 'STRING' },
    knownDefects: { type: 'ARRAY', items: { type: 'STRING' } },
    priceMin: { type: 'INTEGER' },
    priceMax: { type: 'INTEGER' },
    conditionFields: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { fieldKey: { type: 'STRING' }, value: { type: 'STRING' } },
        required: ['fieldKey', 'value'],
      },
    },
    uncertainFields: { type: 'ARRAY', items: { type: 'STRING' } },
    photoQualityIssue: { type: 'STRING' },
    confidence: { type: 'INTEGER' },
  },
  required: [
    'isSellableProduct',
    'name',
    'categoryId',
    'overallCondition',
    'description',
    'knownDefects',
    'priceMin',
    'priceMax',
    'conditionFields',
    'uncertainFields',
    'photoQualityIssue',
    'confidence',
  ],
  propertyOrdering: [
    'isSellableProduct',
    'photoQualityIssue',
    'brand',
    'name',
    'categoryId',
    'subCategoryId',
    'overallCondition',
    'knownDefects',
    'conditionFields',
    'uncertainFields',
    'description',
    'priceMin',
    'priceMax',
    'confidence',
  ],
};

// images: [{ base64, mimeType }] - every photo of the same item (max 3 are sent)
export const buildVisionRequest = ({ images, sellerHint = '' }) => ({
  contents: [
    {
      parts: [
        { text: buildPrompt(sellerHint.trim()) },
        ...images.slice(0, 3).map((img) => ({
          inlineData: { mimeType: img.mimeType || 'image/jpeg', data: img.base64 },
        })),
      ],
    },
  ],
  generationConfig: {
    temperature: 0.2,
    responseMimeType: 'application/json',
    responseSchema: VISION_RESPONSE_SCHEMA,
  },
});

const roundPrice = (n) => Math.max(0, Math.round(Number(n || 0) / 10000) * 10000);

const UNCERTAIN_LABELS = {
  model: 'Model / đời máy',
  brand: 'Thương hiệu',
  name: 'Tên sản phẩm',
  size: 'Kích cỡ (size)',
  storage: 'Dung lượng bộ nhớ',
  battery: 'Tình trạng pin',
  batteryhealth: 'Tình trạng pin',
  workingcondition: 'Tình trạng hoạt động',
  price: 'Giá bán',
  category: 'Danh mục',
  categoryid: 'Danh mục',
  condition: 'Độ mới',
  overallcondition: 'Độ mới',
};

const labelUncertainField = (field) => {
  const text = String(field || '').trim();
  return UNCERTAIN_LABELS[text.toLowerCase()] || text;
};

// Ordered rules: the first match wins, so specific types come before broad ones
// (e.g. "cáp sạc" before generic phone words, "camera an ninh" before cameras).
// Short words are written " word " (whole word in the space-padded text below).
const SUB_CATEGORY_RULES = {
  cat_electronics: [
    ['chargers_power', /củ sạc|cáp sạc|dây sạc|cáp (usb|type|lightning)|sạc dự phòng|pin dự phòng|power ?bank|charger|adapter|đế sạc|sạc không dây| hub /],
    ['audio_headphones', /tai nghe|airpods?|earbuds?|headphones?|earphones?| buds /],
    ['speakers_audio', / loa |speaker|soundbar|amply|micro karaoke|đầu đĩa/],
    ['wearables', /apple watch|galaxy watch|smart ?watch|đồng hồ thông minh|mi band|xiaomi band|vòng đeo|garmin|fitbit/],
    ['other_electronics', /camera an ninh|camera wifi|camera ip|webcam|router|modem|ổ cứng| ssd | hdd |kindle|máy đọc sách/],
    ['cameras', /máy ảnh|ống kính| lens |canon|nikon|fujifilm|sony alpha| sony a\d|gopro|máy quay|action cam|flycam| dji |camera/],
    ['gaming_consoles', /playstation| ps[345] |nintendo| switch |xbox|máy chơi game|steam deck/],
    ['monitors_tv', /màn hình|monitor|tivi| tv |máy chiếu|projector/],
    ['peripherals_accessories', /chuột|mouse|bàn phím|keyboard|tay cầm|gamepad|controller|bút trình chiếu/],
    ['desktop_pc', /máy tính bàn|máy tính để bàn| pc |imac|mac mini|desktop|case máy| vga |card màn hình|mainboard| cpu /],
    ['laptops_computers', /laptop|macbook|thinkpad|notebook|surface|vivobook|zenbook|ideapad|chromebook/],
    ['phones_tablets', /iphone|ipad|điện thoại|smartphone|galaxy|xiaomi|redmi|oppo|vivo|realme|tablet|máy tính bảng/],
  ],
  cat_clothing: [
    ['footwear', /giày|dép|sneaker|shoe|sandal|cao gót|boots?/],
    ['bags_wallets', /túi|balo| ví |bag|backpack|wallet|tote|clutch/],
    ['watches', /đồng hồ|watch/],
    ['eyewear', /kính|glasses|sunglasses/],
    ['fashion_accessories', /thắt lưng|dây nịt| nón | mũ |trang sức|nhẫn|vòng tay|dây chuyền|khuyên tai|bông tai|khăn|cà vạt|kẹp tóc/],
  ],
  cat_books: [
    ['comics_manga', /manga|truyện tranh|comic|light novel|manhwa/],
    ['textbooks_academic', /giáo trình|sách giáo khoa|tiếng anh|ielts|toeic|đại học|chuyên ngành/],
    ['stationery_tools', /casio|vinacal|máy tính cầm tay|bảng vẽ điện tử|wacom|từ điển điện tử/],
    ['art_supplies', / bút |thước|compa|màu vẽ|giá vẽ|họa cụ|cọ vẽ/],
  ],
  cat_appliances: [
    ['large_appliances', /tủ lạnh|máy giặt|máy sấy quần áo|điều hòa|máy lạnh|máy nước nóng|bình nóng lạnh/],
    ['home_cooling_cleaning', /quạt|hút bụi|lọc không khí|lọc khí|robot| fan |vacuum/],
    ['electric_kitchen', /nồi cơm|nồi chiên|nồi áp suất điện|máy xay|ấm siêu tốc|ấm đun| lò |bếp từ|bếp điện|máy ép|máy pha/],
    ['cookware_tableware', / bát | đĩa |chảo| nồi | dao |thớt|bình giữ nhiệt|hộp thủy tinh| ly | cốc /],
    ['furniture_decor', / bàn | ghế |giá kệ| kệ | tủ |đèn|gương/],
  ],
  cat_vehicles: [
    ['motorbikes_scooters', /xe máy|tay ga|xe số|wave|sirius|vision|air ?blade|sh |lead|exciter|winner|vespa|vario|scooter/],
    ['bicycles_ebikes', /xe đạp|xe điện|ebike|xe đạp điện|xe máy điện|vinfast|cap a|giant|asama|touring|fixed gear|mountain bike/],
    ['helmets_accessories', /mũ bảo hiểm|nón bảo hiểm|fullface|royal|agv|yohe|kính chắn gió|khóa xe|giá đỡ điện thoại/],
    ['other_vehicles', /ván trượt|skateboard|patin|roller|bơm xe|phụ tùng xe|nhớt/],
  ],
  cat_sports_hobbies: [
    ['musical_instruments', /đàn|guitar|piano|organ|ukulele|violon|trống|kèn|sáo|amply guitar|pickup/],
    ['sports_equipment', /vợt|cầu lông|yonex|lining|tennis|pickleball|bóng đá|bóng rổ|tạ|thảm yoga|găng tay/],
    ['collectibles_toys', /mô hình|gundam|figure|lego|boardgame|board game|uno|ma sói|thẻ bài|pokemon/],
    ['camping_outdoor', /lều|túi ngủ|dã ngoại|cắm trại|ghế gấp|bàn gấp|bếp dã ngoại/],
    ['other_sports_hobbies', /cần câu|câu cá|patin|thể thao/],
  ],
  cat_other: [
    ['beauty_care', /nước hoa|perfume|mỹ phẩm|son |serum|máy rửa mặt|máy uốn tóc|máy sấy tóc|toner/],
    ['pet_supplies', /thú cưng|chó|mèo|lồng|chuồng|đệm ngủ thú cưng|bát ăn|cát mèo|thức ăn mèo/],
    ['handicraft_art', /handmade|thủ công|len|nến thơm|tranh|gốm sứ|quà tặng/],
    ['general_misc', /./],
  ],
};

const DEFAULT_SUB_CATEGORY = {
  cat_electronics: 'other_electronics',
  cat_clothing: 'apparel',
  cat_books: 'general_books',
  cat_appliances: 'other_household',
  cat_vehicles: 'other_vehicles',
  cat_sports_hobbies: 'other_sports_hobbies',
  cat_other: 'general_misc',
};

export const inferSubCategory = (categoryId, name = '', brand = '') => {
  // Space-padded, punctuation-free text: rules match whole words with " word " because
  // the regex word boundary only understands ASCII letters (never matches "mũ", "tủ", "ví")
  const text = ` ${name} ${brand} `.toLowerCase().replace(/[.,;:()\/_+"'\-]+/g, ' ');
  const rules = SUB_CATEGORY_RULES[categoryId];
  if (!rules) return null;
  const match = rules.find(([, pattern]) => pattern.test(text));
  return match ? match[0] : DEFAULT_SUB_CATEGORY[categoryId];
};

// Validate/clean the model output before it reaches the form
export const normalizeVisionResult = (raw) => {
  const category = DEFAULT_CATEGORIES.find((c) => c.id === raw.categoryId) || null;

  // The sub-category decides which condition form the seller sees: accept the model's
  // choice only if it belongs to the chosen category, otherwise infer it from the name
  const subCategoryId = !category
    ? null
    : (category.subCategories || []).some((s) => s.id === raw.subCategoryId)
    ? raw.subCategoryId
    : inferSubCategory(category.id, raw.name, raw.brand);

  const selectFields = category ? fillableFields(category.id, subCategoryId) : [];

  const conditionData = {};
  (Array.isArray(raw.conditionFields) ? raw.conditionFields : []).forEach(({ fieldKey, value }) => {
    const field = selectFields.find((f) => f.fieldKey === fieldKey);
    if (field && field.options.includes(value)) conditionData[fieldKey] = value;
  });

  let priceMin = roundPrice(raw.priceMin);
  let priceMax = roundPrice(raw.priceMax);
  if (priceMin > priceMax) [priceMin, priceMax] = [priceMax, priceMin];

  return {
    isSellableProduct: raw.isSellableProduct !== false,
    name: String(raw.name || '').trim().slice(0, 120),
    brand: String(raw.brand || '').trim(),
    categoryId: category ? category.id : null,
    categoryName: category ? category.name : '',
    subCategoryId,
    overallCondition: CONDITION_RATINGS.includes(raw.overallCondition) ? raw.overallCondition : 'Good',
    description: String(raw.description || '').trim(),
    knownDefects: (Array.isArray(raw.knownDefects) ? raw.knownDefects : [])
      .map((d) => String(d).trim())
      .filter(Boolean),
    priceMin,
    priceMax,
    // Midpoint of the range is what gets pre-filled into the price field
    suggestedPrice: priceMax > 0 ? roundPrice((priceMin + priceMax) / 2) : 0,
    conditionData,
    uncertainFields: [
      ...new Set((Array.isArray(raw.uncertainFields) ? raw.uncertainFields : []).map(labelUncertainField)),
    ].filter(Boolean),
    photoQualityIssue: String(raw.photoQualityIssue || '').trim(),
    confidenceScore: Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 0))),
  };
};
