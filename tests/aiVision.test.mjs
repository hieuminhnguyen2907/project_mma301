// Offline checks for the Gemini vision request/response handling (no network needed)
import { buildVisionRequest, normalizeVisionResult } from '../src/services/aiVisionPrompt.js';

let total = 0;
let failed = 0;
const assert = (cond, msg) => {
  total++;
  if (cond) console.log(`  ✓ PASS: ${msg}`);
  else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
};

console.log('========================================');
console.log('REMARKET - AI VISION REQUEST & NORMALIZATION');
console.log('========================================\n');

const req = buildVisionRequest({
  images: [1, 2, 3, 4].map((i) => ({ base64: `img${i}` })),
  sellerHint: '  iPhone 11 Pro  ',
});
const parts = req.contents[0].parts;
assert(parts.filter((p) => p.inlineData).length === 3, 'Sends at most 3 photos');
assert(parts[0].text.includes('"iPhone 11 Pro"'), 'Includes trimmed seller hint in the prompt');
assert(req.generationConfig.responseSchema.properties.categoryId.enum.includes('cat_books'), 'Category constrained by enum schema');
assert(req.generationConfig.temperature <= 0.3, 'Low temperature for consistent answers');

const result = normalizeVisionResult({
  isSellableProduct: true,
  name: 'Sách Milk and Honey',
  categoryId: 'cat_books',
  overallCondition: 'Mint',
  description: 'Sách bìa mềm.',
  knownDefects: ['  Góc bìa hơi gập ', ''],
  priceMin: 90000,
  priceMax: 51234,
  conditionFields: [
    { fieldKey: 'coverCondition', value: 'Bìa có nếp gấp nhẹ góc' },
    { fieldKey: 'coverCondition', value: 'Bìa rất đẹp' }, // not an app option
    { fieldKey: 'pageCondition', value: 'Trang giấy trắng sạch, đủ 100% trang' }, // not visible from outside
  ],
  uncertainFields: ['model', 'model', 'size'],
  photoQualityIssue: '',
  confidence: 140,
});
assert(result.overallCondition === 'Good', 'Unknown condition rating falls back to Good');
assert(result.categoryName === 'Sách & Giáo trình', 'Category name resolved from the app catalogue');
assert(result.priceMin === 50000 && result.priceMax === 90000, 'Price range rounded and ordered');
assert(result.suggestedPrice === 70000, 'Suggested price is the range midpoint');
assert(result.conditionData.coverCondition === 'Bìa có nếp gấp nhẹ góc', 'Valid visible condition option kept');
assert(!('pageCondition' in result.conditionData), 'Fields that a photo cannot show are not pre-filled');
assert(result.knownDefects.length === 1 && result.knownDefects[0] === 'Góc bìa hơi gập', 'Defects trimmed, empties dropped');
assert(result.uncertainFields.join('|') === 'Model / đời máy|Kích cỡ (size)', 'Uncertain fields translated and de-duplicated');
assert(result.confidenceScore === 100, 'Confidence clamped to 0-100');

const unknown = normalizeVisionResult({ categoryId: 'cat_cars', isSellableProduct: false });
assert(unknown.categoryId === null, 'Unknown category id rejected');
assert(unknown.isSellableProduct === false, 'Non-product photo flagged');

console.log('\n========================================');
console.log(`AI VISION TOTAL: ${total} | PASSED: ${total - failed} | FAILED: ${failed}`);
console.log('========================================\n');
if (failed > 0) process.exit(1);
