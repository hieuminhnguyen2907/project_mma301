// Test Suite for Strict Marketplace Validation
import {
  validateProductName,
  validatePrice,
  validateOriginalPrice,
  validateStockQuantity,
  validateDescription,
  validateBatteryHealth,
  validateDefectItem,
  validateAddressField,
  validateFullProductListing,
} from '../src/utils/validation.js';

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('================================================================');
console.log('REMARKET - STRICT INPUT VALIDATION TEST SUITE');
console.log('================================================================\n');

// 1. Product Name / Title Validation
console.log('[1] Product Name / Title:');
assert(Boolean(validateProductName('')), 'Reject empty product name');
assert(Boolean(validateProductName('   ')), 'Reject whitespace-only product name');
assert(Boolean(validateProductName('ip')), 'Reject title shorter than 5 chars');
assert(Boolean(validateProductName('a'.repeat(125))), 'Reject title exceeding 120 chars');
assert(Boolean(validateProductName('!@#$%^&*()')), 'Reject title consisting only of special symbols');
assert(validateProductName('iPhone 13 128GB Midnight') === null, 'Accept valid product title');

// 2. Price Validation
console.log('\n[2] Selling Price:');
assert(Boolean(validatePrice('')), 'Reject empty price');
assert(Boolean(validatePrice(0)), 'Reject 0 VND');
assert(Boolean(validatePrice(-50000)), 'Reject negative price');
assert(Boolean(validatePrice(500)), 'Reject price below 1.000 VND');
assert(Boolean(validatePrice('abc')), 'Reject non-numeric price');
assert(Boolean(validatePrice(15000000000)), 'Reject price exceeding 10 billion VND');
assert(validatePrice('12.500.000 ₫') === null, 'Accept formatted currency string');
assert(validatePrice(1500000) === null, 'Accept valid integer price');

// 3. Original Price Validation (optional, but strictly bounded)
console.log('\n[3] Original Price:');
assert(validateOriginalPrice(null, 1000000) === null, 'Accept null/omitted original price');
assert(validateOriginalPrice('', 1000000) === null, 'Accept empty original price');
assert(Boolean(validateOriginalPrice(-10000, 1000000)), 'Reject negative original price');
assert(Boolean(validateOriginalPrice(5000000, 10000000)), 'Reject original price lower than second-hand selling price');
assert(validateOriginalPrice(15000000, 10000000) === null, 'Accept original price higher than selling price');

// 4. Stock Quantity Validation
console.log('\n[4] Stock Quantity:');
assert(Boolean(validateStockQuantity('')), 'Reject empty stock');
assert(Boolean(validateStockQuantity('0')), 'Reject 0 stock');
assert(Boolean(validateStockQuantity('-2')), 'Reject negative stock');
assert(Boolean(validateStockQuantity('1.5')), 'Reject decimal stock');
assert(Boolean(validateStockQuantity('1005')), 'Reject stock exceeding 999');
assert(validateStockQuantity('1') === null, 'Accept stock of 1');
assert(validateStockQuantity('50') === null, 'Accept stock of 50');

// 5. Description Validation
console.log('\n[5] Description:');
assert(Boolean(validateDescription('')), 'Reject empty description');
assert(Boolean(validateDescription('Máy còn đẹp lắm')), 'Reject description shorter than 20 chars');
assert(validateDescription('Máy dùng lướt 8 tháng, đầy đủ sạc cáp zin, pin còn rất trâu.') === null, 'Accept description with >= 20 chars');

// 6. Battery Health Validation
console.log('\n[6] Battery Health (%):');
assert(validateBatteryHealth(null) === null, 'Accept omitted battery health');
assert(validateBatteryHealth('') === null, 'Accept empty battery health');
assert(Boolean(validateBatteryHealth(0)), 'Reject battery health 0%');
assert(Boolean(validateBatteryHealth(-5)), 'Reject negative battery health');
assert(Boolean(validateBatteryHealth(150)), 'Reject battery health > 100%');
assert(validateBatteryHealth(85) === null, 'Accept realistic battery health 85%');
assert(validateBatteryHealth(100) === null, 'Accept 100% battery health');

// 7. Known Defects Validation
console.log('\n[7] Known Defects:');
assert(Boolean(validateDefectItem('')), 'Reject empty defect item');
assert(Boolean(validateDefectItem('ab')), 'Reject defect description shorter than 3 chars');
assert(Boolean(validateDefectItem('Vết xước góc máy', ['Vết xước góc máy'])), 'Reject duplicate defect');
assert(validateDefectItem('Cấn nhẹ góc dưới bên phải', []) === null, 'Accept valid defect description');

// 8. Address Validation
console.log('\n[8] Address Fields:');
assert(Boolean(validateAddressField('city', '')), 'Reject empty city');
assert(Boolean(validateAddressField('district', '')), 'Reject empty district');
assert(Boolean(validateAddressField('streetAddress', '12')), 'Reject street address shorter than 3 chars');
assert(validateAddressField('streetAddress', '45/12 Nguyễn Trãi') === null, 'Accept valid street address');

// 9. Comprehensive Full Listing Validator
console.log('\n[9] Full Product Listing Form Validation:');
const invalidResult = validateFullProductListing({
  form: {
    name: 'abc', // too short
    categoryId: null, // missing
    subCategoryId: null,
    price: '', // missing
    originalPrice: '',
    stockQuantity: '0', // invalid
    description: 'Ngắn', // too short
    overallCondition: 'Good',
    city: '',
    district: '',
    streetAddress: '',
  },
  images: [], // missing images
  selectedCategory: null,
  activeSchema: [],
  conditionData: {},
});
assert(invalidResult.isValid === false, 'Full validator correctly rejects invalid form');
assert(Boolean(invalidResult.errors.images), 'Detects missing images');
assert(Boolean(invalidResult.errors.name), 'Detects invalid name');
assert(Boolean(invalidResult.errors.categoryId), 'Detects missing category');
assert(Boolean(invalidResult.errors.price), 'Detects missing price');
assert(Boolean(invalidResult.errors.description), 'Detects short description');

const validResult = validateFullProductListing({
  form: {
    name: 'iPhone 13 128GB Midnight VN/A',
    categoryId: 'cat_electronics',
    subCategoryId: 'phones_tablets',
    price: 11200000,
    originalPrice: 18990000,
    stockQuantity: 1,
    description: 'Máy dùng lướt 10 tháng, dán cường lực và ốp lưng từ lúc mở hộp, pin còn rất trâu.',
    overallCondition: 'Very Good',
    city: 'Hồ Chí Minh',
    district: 'Quận 5',
    streetAddress: '45/12 Nguyễn Trãi',
  },
  images: ['https://example.com/phone1.jpg'],
  selectedCategory: {
    id: 'cat_electronics',
    name: 'Đồ điện tử',
    subCategories: [{ id: 'phones_tablets', name: 'Điện thoại & Tablet' }],
  },
  activeSchema: [
    { fieldKey: 'workingCondition', label: 'Tình trạng hoạt động', required: true },
    { fieldKey: 'screenCondition', label: 'Tình trạng màn hình', required: true },
    { fieldKey: 'batteryHealth', label: 'Pin (%)', required: false },
  ],
  conditionData: {
    workingCondition: 'Hoạt động hoàn hảo (100% chức năng)',
    screenCondition: 'Không trầy xước (Như mới 99%)',
    batteryHealth: 88,
  },
});
assert(validResult.isValid === true, 'Full validator accepts completely valid product listing');
assert(Object.keys(validResult.errors).length === 0, 'No errors on valid form');

console.log('\n================================================================');
console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
