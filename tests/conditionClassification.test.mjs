// Verification Test Suite for Category & Sub-Category Condition Classification
import {
  DEFAULT_CATEGORIES,
  getCategoryConditionSchema,
  getConditionFieldLabel,
  CONDITION_FIELD_LABELS,
} from '../src/constants/categories.js';

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

console.log('================================================================');
console.log('REMARKET - CATEGORY & SUB-CATEGORY CONDITION SCHEMA VERIFICATION');
console.log('================================================================\n');

// 1. All 4 categories must have subCategories
console.log('[1] Core Category Hierarchy:');
assert(DEFAULT_CATEGORIES.length === 7, 'Has 7 primary categories (including Vehicles, Sports & Catch-all Other)');
DEFAULT_CATEGORIES.forEach((cat) => {
  assert(
    Array.isArray(cat.subCategories) && cat.subCategories.length >= 3,
    `Category "${cat.name}" has at least 3 distinct sub-classifications (Found: ${cat.subCategories?.length})`
  );
});

// 2. Electronics sub-classification checks
console.log('\n[2] Electronics (Đồ điện tử) Classification Accuracy:');
const elecSchemaPhone = getCategoryConditionSchema('cat_electronics', 'phones_tablets');
const elecSchemaAudio = getCategoryConditionSchema('cat_electronics', 'audio_headphones');
const elecSchemaPeripheral = getCategoryConditionSchema('cat_electronics', 'peripherals_accessories');

const phoneKeys = elecSchemaPhone.map((f) => f.fieldKey);
const audioKeys = elecSchemaAudio.map((f) => f.fieldKey);
const peripheralKeys = elecSchemaPeripheral.map((f) => f.fieldKey);

assert(phoneKeys.includes('screenCondition'), 'Phones/Tablets schema requires screen condition');
assert(!audioKeys.includes('screenCondition'), 'Headphones & Audio schema DOES NOT include screen condition (Strict requirement)');
assert(audioKeys.includes('audioQuality'), 'Headphones & Audio schema includes dedicated sound quality');
assert(audioKeys.includes('exteriorAndEarPads'), 'Headphones & Audio schema includes ear pads wear criteria');
assert(!peripheralKeys.includes('screenCondition'), 'Peripherals schema DOES NOT include screen condition');
assert(!peripheralKeys.includes('batteryHealth'), 'Peripherals schema DOES NOT include battery health %');
assert(peripheralKeys.includes('functionAndButtons'), 'Peripherals schema includes button/port responsiveness');

// 3. Clothing & Fashion sub-classification checks
console.log('\n[3] Clothing & Fashion (Thời trang) Classification Accuracy:');
const clothSchemaApparel = getCategoryConditionSchema('cat_clothing', 'apparel');
const clothSchemaShoes = getCategoryConditionSchema('cat_clothing', 'footwear');
const clothSchemaBags = getCategoryConditionSchema('cat_clothing', 'bags_wallets');

const apparelKeys = clothSchemaApparel.map((f) => f.fieldKey);
const shoesKeys = clothSchemaShoes.map((f) => f.fieldKey);
const bagsKeys = clothSchemaBags.map((f) => f.fieldKey);

assert(apparelKeys.includes('size'), 'Apparel schema includes garment size (XS-XXL)');
assert(shoesKeys.includes('shoeSize'), 'Footwear schema includes numeric shoe sizes (35-45)');
assert(!shoesKeys.includes('size'), 'Footwear schema DOES NOT use XS/S/M/L clothing sizes');
assert(shoesKeys.includes('soleCondition'), 'Footwear schema includes shoe sole & toe crease criteria');
assert(!bagsKeys.includes('size') && !bagsKeys.includes('shoeSize'), 'Bags & Wallets schema has NO clothing/shoe size');
assert(bagsKeys.includes('zipperAndHardware'), 'Bags & Wallets schema checks zippers & hardware');
assert(bagsKeys.includes('exteriorCorners'), 'Bags & Wallets schema checks bottom corner wear');

// 4. Books & Manga sub-classification checks
console.log('\n[4] Books (Sách & Giáo trình) Classification Accuracy:');
const booksSchemaGeneral = getCategoryConditionSchema('cat_books', 'general_books');
const booksSchemaManga = getCategoryConditionSchema('cat_books', 'comics_manga');

const generalBookKeys = booksSchemaGeneral.map((f) => f.fieldKey);
const mangaKeys = booksSchemaManga.map((f) => f.fieldKey);

assert(generalBookKeys.includes('coverCondition'), 'General books schema includes cover condition');
assert(mangaKeys.includes('jacketCondition'), 'Manga schema includes dust jacket condition');
assert(mangaKeys.includes('setCompleteness'), 'Manga schema includes set completeness (full set vs single volume)');
assert(mangaKeys.includes('includedCollectibles'), 'Manga schema includes Obi, bookmarks, postcards');

// 5. Home Appliances sub-classification checks
console.log('\n[5] Home Appliances (Đồ gia dụng & Bếp) Classification Accuracy:');
const appSchemaElectric = getCategoryConditionSchema('cat_appliances', 'electric_kitchen');
const appSchemaCookware = getCategoryConditionSchema('cat_appliances', 'cookware_tableware');

const electricKeys = appSchemaElectric.map((f) => f.fieldKey);
const cookwareKeys = appSchemaCookware.map((f) => f.fieldKey);

assert(electricKeys.includes('workingCondition'), 'Electric kitchen schema includes motor operation');
assert(!cookwareKeys.includes('workingCondition'), 'Non-electric Cookware schema DOES NOT include motor operation');
assert(cookwareKeys.includes('surfaceCondition'), 'Cookware schema checks non-stick / ceramic surface');
assert(cookwareKeys.includes('structuralIntegrity'), 'Cookware schema checks physical dent/crack integrity');

// 6. Vehicles, Sports/Hobbies & Other Classification Checks
console.log('\n[6] Vehicles, Sports & Other Classification Accuracy:');
const motorbikeSchema = getCategoryConditionSchema('cat_vehicles', 'motorbikes_scooters');
const bikeSchema = getCategoryConditionSchema('cat_vehicles', 'bicycles_ebikes');
const guitarSchema = getCategoryConditionSchema('cat_sports_hobbies', 'musical_instruments');
const otherSchema = getCategoryConditionSchema('cat_other', 'general_misc');

const motorbikeKeys = motorbikeSchema.map((f) => f.fieldKey);
const bikeKeys = bikeSchema.map((f) => f.fieldKey);
const guitarKeys = guitarSchema.map((f) => f.fieldKey);
const otherKeys = otherSchema.map((f) => f.fieldKey);

assert(motorbikeKeys.includes('engineCondition'), 'Motorbikes schema includes engine condition');
assert(motorbikeKeys.includes('paperworkStatus'), 'Motorbikes schema includes legal registration status');
assert(!bikeKeys.includes('paperworkStatus'), 'Bicycles do NOT require registration papers');
assert(bikeKeys.includes('frameAndChain'), 'Bicycles check frame and chain condition');
assert(guitarKeys.includes('soundAndPlayability'), 'Guitars/Instruments check sound and fretboard playability');
assert(otherKeys.includes('workingCondition') && otherKeys.includes('exteriorCondition'), 'Universal other category checks core working and exterior condition');

// 7. Every question must fit every item of its product type
console.log('\n[6] Field relevance per product type:');
const keysOf = (catId, subId) => getCategoryConditionSchema(catId, subId).map((f) => f.fieldKey);
const requiredKeysOf = (catId, subId) =>
  getCategoryConditionSchema(catId, subId).filter((f) => f.required).map((f) => f.fieldKey);

const chargerKeys = keysOf('cat_electronics', 'chargers_power');
assert(!chargerKeys.includes('functionAndButtons'), 'Chargers/cables are NOT asked about keys or buttons');
assert(!chargerKeys.includes('screenCondition') && !chargerKeys.includes('connectionType'), 'Chargers have no screen / wireless-or-wired question');
assert(requiredKeysOf('cat_electronics', 'chargers_power').includes('chargingPerformance'), 'Chargers are asked about charging performance');
assert(!requiredKeysOf('cat_electronics', 'chargers_power').includes('powerBankCapacity'), 'Power-bank battery wear is optional (a cable has no battery)');

const speakerKeys = keysOf('cat_electronics', 'speakers_audio');
assert(!speakerKeys.includes('exteriorAndEarPads') && !speakerKeys.includes('connectionStatus'), 'Speakers are NOT asked about ear pads or call microphone');
assert(!keysOf('cat_electronics', 'desktop_pc').includes('keyboardTrackpad'), 'Desktop PCs are NOT asked about a built-in keyboard / trackpad');
assert(!requiredKeysOf('cat_electronics', 'desktop_pc').includes('displayCondition'), 'Built-in screen is optional for desktops (only iMac / all-in-one have one)');
assert(!keysOf('cat_clothing', 'fashion_accessories').includes('accessoryCondition'), 'Hats / belts / jewellery are NOT asked about watch glass');
assert(keysOf('cat_clothing', 'watches').includes('strapCondition'), 'Watches have their own strap criterion');
assert(!keysOf('cat_books', 'art_supplies').includes('workingFunction'), 'Pens / rulers are NOT asked whether they power on');
assert(keysOf('cat_books', 'stationery_tools').includes('workingFunction'), 'Calculators are asked whether they work');
assert(keysOf('cat_appliances', 'furniture_decor').includes('electricalFunction'), 'Furniture has an optional electrical check for lamps');
assert(!requiredKeysOf('cat_appliances', 'furniture_decor').includes('electricalFunction'), 'Electrical check is not required for a table or a chair');

DEFAULT_CATEGORIES.forEach((cat) => {
  assert(
    cat.subCategories.some((s) => s.id.startsWith('other_') || /khác/i.test(s.name)),
    `"${cat.name}" offers an "other" type so no item is forced into a wrong form`
  );
  cat.subCategories.forEach((sub) => {
    const required = sub.conditionFieldSchema.filter((f) => f.required);
    assert(required.length >= 2 && required.length <= 5, `"${sub.name}" asks 2-5 required questions (${required.length})`);
    sub.conditionFieldSchema
      .filter((f) => f.graded)
      .forEach((f) => {
        if (f.type !== 'select' || f.options.length < 3) {
          assert(false, `Graded field ${sub.id}.${f.fieldKey} is a select with >= 3 ordered options`);
        }
      });
  });
});

// 7. Label Dictionary Coverage
console.log('\n[6] Label Dictionary Coverage:');
const sampleKeys = [
  'workingCondition',
  'screenCondition',
  'audioQuality',
  'shoeSize',
  'soleCondition',
  'zipperAndHardware',
  'jacketCondition',
  'structuralIntegrity',
];
sampleKeys.forEach((k) => {
  const lbl = getConditionFieldLabel(k);
  assert(Boolean(lbl && lbl !== k), `Field key "${k}" resolves to descriptive label: "${lbl}"`);
});

console.log('\n================================================================');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
