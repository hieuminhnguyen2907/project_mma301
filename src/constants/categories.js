// Standardized Product Categories & Dynamic Condition Schemas for ReMarket
//
// Design rule: every sub-category groups items of the SAME kind, so each REQUIRED field
// applies to every item in it (a charger is never asked about its keys, a hat never
// about its glass). Fields that only apply to part of a group (battery of a wireless
// headset, the screen of an all-in-one PC) are optional and carry a hint. Each
// category ends with an "other" group whose questions fit any item.
//
// Field shape:
//   fieldKey, label, type: 'select' | 'multiselect' | 'number', required
//   options        select / multiselect choices
//   graded: true   select options are ordered best -> worst (used by the condition score)
//   hint           short help shown under the label
//   min/max/unit   number fields

// Fallback labels (product detail uses the schema label of the listing's sub-category
// first, see getConditionFieldLabel)
export const CONDITION_FIELD_LABELS = {
  // Electronics & Tech
  workingCondition: 'Tình trạng hoạt động',
  screenCondition: 'Màn hình',
  displayCondition: 'Màn hình hiển thị',
  keyboardTrackpad: 'Bàn phím & Trackpad',
  screenAndKeyboard: 'Màn hình & Bàn phím',
  bodyCondition: 'Thân vỏ',
  exteriorCondition: 'Ngoại hình & Độ hao mòn',
  batteryHealth: 'Dung lượng pin (%)',
  batteryStatus: 'Tình trạng pin',
  batteryDuration: 'Thời lượng pin',
  repairHistory: 'Lịch sử sửa chữa',
  audioQuality: 'Chất lượng âm thanh',
  connectionStatus: 'Kết nối & Micro',
  connectionType: 'Phương thức kết nối',
  connectivity: 'Cổng / Chuẩn kết nối',
  exteriorAndEarPads: 'Ngoại hình & Đệm tai',
  functionAndButtons: 'Chức năng & Phím bấm',
  chargingPerformance: 'Hiệu suất sạc',
  powerBankCapacity: 'Độ chai pin dự phòng',
  connectorTypes: 'Cổng / Đầu kết nối',
  lensSensorCondition: 'Ống kính & Cảm biến',
  shutterCount: 'Số lần chụp (Shutter count)',
  controllerCondition: 'Tay cầm kèm theo',
  portsAndRemote: 'Cổng kết nối & Điều khiển',

  // Clothing & Fashion
  size: 'Kích cỡ (Size)',
  shoeSize: 'Kích cỡ giày (Size)',
  fabricCondition: 'Độ mới chất vải & Màu sắc',
  soleCondition: 'Đế & Mũi giày',
  upperCondition: 'Thân giày (Da / Vải)',
  stainsOrTears: 'Vết ố, rách hoặc sứt chỉ',
  gender: 'Phân loại giới tính',
  materialType: 'Chất liệu chính',
  zipperAndHardware: 'Khóa, nút cài & Quai đeo',
  exteriorCorners: 'Góc đáy & Bề mặt',
  interiorCleanliness: 'Độ sạch lòng túi',
  accessoryCondition: 'Mặt kính & Vỏ đồng hồ',
  workingStatus: 'Bộ máy đồng hồ',
  strapCondition: 'Dây đeo',
  lensCondition: 'Tròng kính',
  frameCondition: 'Gọng kính',
  integrityCondition: 'Độ nguyên vẹn (khóa, móc, đường may)',

  // Books & Stationery
  coverCondition: 'Tình trạng bìa sách',
  pageCondition: 'Tình trạng trang giấy',
  writingOrHighlight: 'Ghi chú & Highlight',
  editionStatus: 'Bài tập & Ghi chép trong sách',
  coverAndBinding: 'Bìa, gáy sách & Độ chắc chắn',
  cdOrOnlineCode: 'Đĩa CD / Mã học kèm',
  jacketCondition: 'Bìa truyện',
  spineAndYellowing: 'Gáy truyện & Độ ố vàng',
  setCompleteness: 'Quy cách bộ',
  includedCollectibles: 'Quà tặng / Phụ kiện sưu tầm',
  includedBookmarks: 'Phụ kiện kẹp sách / Bọc bìa',
  workingFunction: 'Tình trạng hoạt động',
  exteriorLook: 'Ngoại hình & Trầy xước',
  usageLevel: 'Mức độ đã sử dụng',

  // Home Appliances & Living
  innerPotOrBlade: 'Bộ phận tiếp xúc thực phẩm',
  surfaceCondition: 'Bề mặt sử dụng',
  structuralIntegrity: 'Độ nguyên vẹn (nứt, móp, nắp đậy)',
  material: 'Chất liệu chính',
  filterAndParts: 'Lưới lọc, cánh quạt & Hộp bụi',
  frameSturdiness: 'Độ chắc chắn khung & Khớp nối',
  surfaceWear: 'Bề mặt hoàn thiện',
  electricalFunction: 'Bộ phận điện',
  cleanliness: 'Độ sạch sẽ & Vệ sinh',
  usageAge: 'Thời gian đã sử dụng',

  // Common
    // Vehicles & Transportation
  engineCondition: 'Tình trạng động cơ & Máy móc',
  paperworkStatus: 'Giấy tờ xe & Pháp lý',
  odometerRange: 'Số km đã đi (Odo)',
  safetyAndBrakes: 'Hệ thống phanh, đèn & Lốp xe',
  frameAndChain: 'Khung sườn & Bộ truyền động',
  batteryOrPower: 'Bình ắc quy / Pin xe điện',
  brakesAndTires: 'Phanh & Lốp xe',
  helmetShellVisor: 'Vỏ mũ & Kính chắn gió',
  strapAndPadding: 'Dây quai & Đệm lót trong',

  // Sports, Music & Hobbies
  soundAndPlayability: 'Âm thanh & Cần đàn / Phím bấm',
  frameAndTension: 'Khung vợt & Độ căng cước',
  gripCondition: 'Cán cầm / Tay quấn',
  completenessPieces: 'Độ đầy đủ chi tiết & Khớp nối',
  boxAndManual: 'Hộp gốc & Sách hướng dẫn',
  waterproofZippers: 'Vải bạt, chống nước & Khóa kéo',
  polesAndFrame: 'Khung cọc & Độ chắc chắn',

  // Other & Miscellaneous
  remainingVolume: 'Dung tích còn lại / Mức độ sử dụng',
  craftIntegrity: 'Độ nguyên vẹn chi tiết & Màu sắc',
  customCategoryTag: 'Nhãn phân loại tùy chỉnh',

  includedAccessories: 'Phụ kiện kèm theo',
};

// ---------------------------------------------------------------------------------
// Reusable field definitions
// ---------------------------------------------------------------------------------

const genericExterior = (label = 'Ngoại hình & Độ hao mòn') => ({
  fieldKey: 'exteriorCondition',
  label,
  type: 'select',
  required: true,
  graded: true,
  options: [
    'Như mới, không trầy xước',
    'Trầy xước nhẹ, chỉ thấy khi nhìn gần',
    'Trầy xước / Bạc màu thấy rõ',
    'Cấn móp, nứt vỡ hoặc bong tróc',
  ],
});

const genericWorking = (label = 'Tình trạng hoạt động') => ({
  fieldKey: 'workingCondition',
  label,
  type: 'select',
  required: true,
  graded: true,
  options: [
    'Hoạt động hoàn hảo, đủ mọi chức năng',
    'Hoạt động tốt, có lỗi rất nhỏ (ghi rõ trong mô tả)',
    'Lỗi một số chức năng (ghi rõ trong mô tả)',
    'Không hoạt động / Chỉ bán linh kiện',
  ],
});

const touchScreen = {
  fieldKey: 'screenCondition',
  label: 'Màn hình cảm ứng',
  type: 'select',
  required: true,
  graded: true,
  options: [
    'Không trầy xước, hiển thị hoàn hảo',
    'Trầy xước lông mèo nhẹ',
    'Có vết xước thấy rõ',
    'Ám màn / Sọc màn / Nứt kính',
  ],
};

const panelDisplay = (label, required = true, hint) => ({
  fieldKey: 'displayCondition',
  label,
  type: 'select',
  required,
  graded: true,
  ...(hint ? { hint } : {}),
  options: [
    'Hiển thị sắc nét, không điểm chết, không hở sáng',
    'Trầy xước nhẹ / Hở sáng nhẹ khó thấy',
    'Có điểm chết / Ố màn / Vệt đè thấy rõ',
    'Sọc màn / Nứt màn / Lỗi hiển thị',
  ],
});

const usageAge = (options) => ({
  fieldKey: 'usageAge',
  label: 'Thời gian đã sử dụng',
  type: 'select',
  required: false,
  options: options || ['Dưới 6 tháng', 'Từ 6 đến 12 tháng', 'Từ 1 đến 2 năm', 'Trên 2 năm'],
});

const repairHistory = (required, options) => ({
  fieldKey: 'repairHistory',
  label: 'Lịch sử sửa chữa / Thay linh kiện',
  type: 'select',
  required,
  options: options || [
    'Chưa từng sửa chữa, thay linh kiện',
    'Đã thay pin',
    'Đã thay màn hình',
    'Đã sửa / thay linh kiện khác (ghi rõ trong mô tả)',
  ],
});

const accessories = (options, label = 'Phụ kiện kèm theo', fieldKey = 'includedAccessories') => ({
  fieldKey,
  label,
  type: 'multiselect',
  required: false,
  options,
});

// ---------------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------------

const ELECTRONICS_SUBS = [
  {
    id: 'phones_tablets',
    name: 'Điện thoại & Máy tính bảng',
    icon: 'phone-portrait-outline',
    description: 'iPhone, Samsung, Xiaomi, OPPO, iPad, máy tính bảng Android',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Tình trạng hoạt động',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Hoạt động hoàn hảo (100% chức năng)',
          'Hoạt động bình thường (đầy đủ tính năng cơ bản)',
          'Có lỗi nhẹ chức năng phụ: Face ID, loa, camera... (ghi rõ)',
          'Cần sửa chữa / Chỉ bán linh kiện',
        ],
      },
      touchScreen,
      {
        fieldKey: 'bodyCondition',
        label: 'Khung viền & Mặt lưng',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Đẹp như mới (Không trầy xước)',
          'Trầy dăm nhẹ theo thời gian',
          'Cấn móp nhẹ ở góc',
          'Cấn móp sâu / Nứt vỡ mặt lưng',
        ],
      },
      {
        fieldKey: 'batteryHealth',
        label: 'Dung lượng pin tối đa',
        type: 'number',
        required: false,
        min: 1,
        max: 100,
        unit: '%',
        placeholder: 'Ví dụ: 85',
        hint: 'iPhone: Cài đặt > Pin > Tình trạng pin. Bỏ trống nếu máy không hiển thị.',
      },
      repairHistory(true),
      accessories(['Hộp gốc (Fullbox)', 'Củ sạc zin', 'Cáp sạc zin', 'Tai nghe', 'Ốp lưng / Bao da']),
    ],
  },
  {
    id: 'laptops_computers',
    name: 'Laptop & MacBook',
    icon: 'laptop-outline',
    description: 'MacBook, laptop văn phòng, laptop gaming, Surface, Chromebook',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Khả năng vận hành',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Hoạt động hoàn hảo, mượt mà mọi tác vụ',
          'Hoạt động bình thường, ổn định',
          'Thỉnh thoảng bị chậm / Nóng máy / Quạt ồn',
          'Lỗi phần cứng cần sửa chữa',
        ],
      },
      panelDisplay('Màn hình'),
      {
        fieldKey: 'keyboardTrackpad',
        label: 'Bàn phím & Trackpad',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Phím và trackpad nhạy, không lỗi',
          'Phím bóng / mờ chữ nhẹ, vẫn gõ tốt',
          'Có phím hơi kẹt / Trackpad sượng',
          'Liệt phím / Hỏng trackpad',
        ],
      },
      {
        fieldKey: 'bodyCondition',
        label: 'Vỏ máy & Bản lề',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Vỏ đẹp không cấn móp, bản lề êm chắc',
          'Xước dăm nhẹ nắp lưng/đáy',
          'Cấn móp góc / Bản lề hơi lỏng',
          'Nứt vỡ vỏ ngoài / Gãy bản lề',
        ],
      },
      {
        fieldKey: 'batteryStatus',
        label: 'Thời lượng pin',
        type: 'select',
        required: false,
        graded: true,
        options: [
          'Pin còn rất tốt (trên 4 tiếng)',
          'Pin còn khá (2 - 3 tiếng)',
          'Pin chai nhanh (dưới 1 tiếng)',
          'Pin chai hoàn toàn / Phải cắm sạc khi dùng',
        ],
      },
      repairHistory(true, [
        'Chưa từng sửa chữa, thay linh kiện',
        'Đã nâng cấp RAM / ổ cứng',
        'Đã thay pin / bàn phím / màn hình',
        'Đã sửa main hoặc linh kiện khác (ghi rõ trong mô tả)',
      ]),
      accessories(['Hộp gốc (Fullbox)', 'Sạc zin theo máy', 'Chuột rời', 'Túi chống sốc / Balo']),
    ],
  },
  {
    id: 'desktop_pc',
    name: 'Máy tính để bàn',
    icon: 'desktop-outline',
    description: 'PC lắp ráp, máy bộ văn phòng, iMac, Mac mini, linh kiện PC (CPU, VGA, RAM...)',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Khả năng vận hành',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Chạy ổn định, mượt mọi tác vụ',
          'Hoạt động bình thường',
          'Thỉnh thoảng treo / Nóng / Quạt ồn',
          'Lỗi phần cứng, cần sửa chữa',
        ],
      },
      genericExterior('Vỏ máy / Thùng case'),
      panelDisplay(
        'Màn hình liền máy',
        false,
        'Chỉ chọn với máy có màn hình liền (iMac, All-in-one). Màn hình rời đăng ở mục "Màn hình & Tivi".'
      ),
      repairHistory(false, [
        'Chưa từng sửa chữa, thay linh kiện',
        'Đã nâng cấp linh kiện (ghi rõ cấu hình)',
        'Đã sửa / thay linh kiện hỏng (ghi rõ trong mô tả)',
      ]),
      accessories(['Dây nguồn', 'Bàn phím', 'Chuột', 'Màn hình đi kèm', 'Hộp gốc']),
    ],
  },
  {
    id: 'monitors_tv',
    name: 'Màn hình & Tivi',
    icon: 'tv-outline',
    description: 'Màn hình máy tính, Smart TV, máy chiếu',
    conditionFieldSchema: [
      panelDisplay('Chất lượng hiển thị'),
      genericExterior('Viền, vỏ & Chân đế'),
      {
        fieldKey: 'portsAndRemote',
        label: 'Cổng kết nối & Điều khiển',
        type: 'select',
        required: false,
        options: [
          'Các cổng hoạt động tốt, đủ điều khiển (nếu có)',
          'Các cổng hoạt động tốt, thiếu điều khiển',
          'Có cổng bị lỗi (ghi rõ trong mô tả)',
        ],
      },
      usageAge(),
      accessories(['Chân đế', 'Dây nguồn / Adapter', 'Cáp HDMI / DisplayPort', 'Điều khiển từ xa', 'Hộp gốc']),
    ],
  },
  {
    id: 'audio_headphones',
    name: 'Tai nghe',
    icon: 'headset-outline',
    description: 'AirPods, tai nghe true wireless, tai nghe chụp tai, tai nghe có dây',
    conditionFieldSchema: [
      {
        fieldKey: 'audioQuality',
        label: 'Chất lượng âm thanh',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Âm thanh chuẩn 2 bên, bass treble căng, không rè',
          'Nghe tốt rõ ràng, không có lỗi âm',
          'Âm thanh hơi nhỏ hoặc rè nhẹ ở mức âm lượng tối đa',
          'Một bên tai bị nhỏ tiếng / Rè nặng',
        ],
      },
      {
        fieldKey: 'connectionStatus',
        label: 'Kết nối & Micro',
        type: 'select',
        required: true,
        options: [
          'Kết nối ổn định, mic đàm thoại rõ',
          'Kết nối ổn định (tai nghe không có mic)',
          'Kết nối đôi lúc chập chờn / Mic hơi nhỏ',
          'Mất kết nối thường xuyên / Mic hỏng',
        ],
      },
      {
        fieldKey: 'exteriorAndEarPads',
        label: 'Ngoại hình & Đệm tai / Núm tai',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Đẹp như mới, đệm da nguyên vẹn không tróc',
          'Trầy xước dăm nhẹ, đệm tai còn êm',
          'Đệm tai sờn / Tróc da nhẹ',
          'Vỏ trầy xước nhiều / Rách đệm tai',
        ],
      },
      {
        fieldKey: 'batteryDuration',
        label: 'Thời lượng pin',
        type: 'select',
        required: false,
        graded: true,
        hint: 'Bỏ qua nếu là tai nghe có dây.',
        options: [
          'Pin trâu nghe liên tục > 5 tiếng',
          'Pin nghe tốt khoảng 3 - 5 tiếng',
          'Pin dùng 1 - 2 tiếng',
          'Pin chai, nhanh hết pin',
        ],
      },
      accessories([
        'Hộp sạc / Hộp gốc (Fullbox)',
        'Dây sạc zin',
        'Cáp âm thanh 3.5mm',
        'Núm cao su tai nghe các cỡ',
        'Túi đựng / Case bảo vệ',
      ]),
    ],
  },
  {
    id: 'speakers_audio',
    name: 'Loa & Thiết bị âm thanh',
    icon: 'volume-high-outline',
    description: 'Loa Bluetooth, loa vi tính, soundbar, amply, micro karaoke, đầu đĩa',
    conditionFieldSchema: [
      {
        fieldKey: 'audioQuality',
        label: 'Chất lượng âm thanh',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Âm thanh chuẩn, không rè ở mọi mức âm lượng',
          'Nghe tốt, rè nhẹ khi mở lớn hết cỡ',
          'Có tiếng rè / Một loa nhỏ tiếng',
          'Rè nặng / Mất tiếng',
        ],
      },
      genericExterior('Vỏ loa & Lưới loa'),
      accessories(
        ['Bluetooth', 'Dây AUX 3.5mm', 'Quang (Optical) / HDMI ARC', 'USB / Thẻ nhớ', 'Wi-Fi / AirPlay'],
        'Cổng / Chuẩn kết nối hỗ trợ',
        'connectivity'
      ),
      {
        fieldKey: 'batteryDuration',
        label: 'Thời lượng pin',
        type: 'select',
        required: false,
        graded: true,
        hint: 'Bỏ qua nếu loa cắm điện trực tiếp.',
        options: [
          'Pin dùng liên tục > 5 tiếng',
          'Pin dùng khoảng 3 - 5 tiếng',
          'Pin dùng 1 - 2 tiếng',
          'Pin chai, phải cắm sạc khi dùng',
        ],
      },
      accessories(['Dây nguồn / Cáp sạc', 'Điều khiển từ xa', 'Micro kèm theo', 'Hộp gốc']),
    ],
  },
  {
    id: 'chargers_power',
    name: 'Sạc, Cáp & Pin dự phòng',
    icon: 'battery-charging-outline',
    description: 'Củ sạc, cáp sạc, pin sạc dự phòng, đế sạc không dây, adapter laptop, hub chuyển đổi',
    conditionFieldSchema: [
      {
        fieldKey: 'chargingPerformance',
        label: 'Hiệu suất sạc / Truyền dữ liệu',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Sạc ổn định, đúng công suất, nhận sạc nhanh',
          'Sạc bình thường (không nhận sạc nhanh / chưa kiểm tra)',
          'Sạc chập chờn, phải giữ góc dây',
          'Không sạc được / Chỉ bán xác',
        ],
      },
      genericExterior('Vỏ, dây & Đầu cắm'),
      {
        fieldKey: 'powerBankCapacity',
        label: 'Độ chai pin (pin sạc dự phòng)',
        type: 'select',
        required: false,
        graded: true,
        hint: 'Chỉ chọn với pin sạc dự phòng. Bỏ qua nếu là củ sạc, cáp hoặc đế sạc.',
        options: [
          'Giữ pin tốt, sạc đầy điện thoại nhiều lần',
          'Hao pin nhẹ so với lúc mới',
          'Chai nhiều, nhanh hết pin',
        ],
      },
      {
        fieldKey: 'connectorTypes',
        label: 'Cổng / Đầu kết nối',
        type: 'multiselect',
        required: false,
        options: ['USB-C', 'Lightning', 'Micro USB', 'USB-A', 'Sạc không dây (Qi / MagSafe)', 'Đầu DC (adapter laptop)'],
      },
      accessories(['Hộp gốc', 'Cáp kèm theo', 'Túi đựng', 'Hóa đơn / Bảo hành']),
    ],
  },
  {
    id: 'peripherals_accessories',
    name: 'Chuột, Bàn phím & Tay cầm',
    icon: 'game-controller-outline',
    description: 'Chuột, bàn phím cơ, tay cầm chơi game, bút trình chiếu, bàn di chuột',
    conditionFieldSchema: [
      {
        fieldKey: 'functionAndButtons',
        label: 'Chức năng & Phím / Nút bấm',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Mọi phím, nút bấm nhạy, không lỗi',
          'Dùng tốt, có phím / nút hơi cứng nhẹ',
          'Có phím sượng, double-click hoặc trôi analog nhẹ',
          'Có phím / nút bị liệt, cần sửa chữa',
        ],
      },
      {
        fieldKey: 'exteriorCondition',
        label: 'Ngoại hình & Độ hao mòn',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Như mới, không trầy xước',
          'Hao mòn nhẹ tự nhiên qua sử dụng',
          'Bóng mờ mặt phím / Trầy xước thấy rõ',
          'Nứt vỏ / Thiếu keycap, nút bấm',
        ],
      },
      {
        fieldKey: 'connectionType',
        label: 'Phương thức kết nối',
        type: 'select',
        required: false,
        options: [
          'Không dây (Bluetooth / USB 2.4G)',
          'Có dây cáp cắm trực tiếp',
          'Hỗ trợ cả không dây và có dây',
        ],
      },
      accessories(['Hộp gốc (Fullbox)', 'Dây cáp kết nối', 'Đầu thu USB Dongle', 'Keycap / Switch dự phòng', 'Kê tay']),
    ],
  },
  {
    id: 'cameras',
    name: 'Máy ảnh & Ống kính',
    icon: 'camera-outline',
    description: 'Máy ảnh DSLR, mirrorless, compact, ống kính, máy quay, action cam, flycam',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Tình trạng hoạt động',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Hoạt động hoàn hảo, lấy nét và chụp chuẩn',
          'Hoạt động tốt, có lỗi rất nhỏ (ghi rõ)',
          'Lỗi một số chức năng: lấy nét, vòng xoay, nút... (ghi rõ)',
          'Hỏng / Chỉ bán linh kiện',
        ],
      },
      {
        fieldKey: 'lensSensorCondition',
        label: 'Thấu kính & Cảm biến',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Trong, không mốc, không bụi, không xước',
          'Có bụi nhẹ bên trong, không ảnh hưởng ảnh',
          'Mốc nhẹ / Xước nhẹ thấu kính',
          'Mốc nặng / Xước ảnh hưởng ảnh chụp',
        ],
      },
      {
        fieldKey: 'bodyCondition',
        label: 'Thân máy / Thân ống kính',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Như mới, không trầy xước',
          'Trầy xước nhẹ khi sử dụng',
          'Trầy xước thấy rõ / Bong cao su tay cầm',
          'Cấn móp / Nứt vỏ',
        ],
      },
      {
        fieldKey: 'shutterCount',
        label: 'Số lần chụp (Shutter count)',
        type: 'number',
        required: false,
        min: 0,
        max: 9999999,
        unit: 'lần',
        placeholder: 'Ví dụ: 12000',
        hint: 'Bỏ trống với ống kính, máy quay hoặc khi không rõ.',
      },
      accessories(['Pin & Sạc', 'Thẻ nhớ', 'Dây đeo', 'Nắp ống kính / Hood', 'Túi / Balo máy ảnh', 'Hộp gốc']),
    ],
  },
  {
    id: 'wearables',
    name: 'Đồng hồ thông minh & Vòng đeo',
    icon: 'watch-outline',
    description: 'Apple Watch, Galaxy Watch, Garmin, Xiaomi Band, vòng đeo sức khỏe',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Tình trạng hoạt động',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Hoạt động hoàn hảo, cảm biến đo chuẩn',
          'Hoạt động tốt, có lỗi rất nhỏ (ghi rõ)',
          'Lỗi một số chức năng: cảm biến, nút, loa... (ghi rõ)',
          'Hỏng chức năng chính',
        ],
      },
      touchScreen,
      {
        fieldKey: 'bodyCondition',
        label: 'Vỏ & Dây đeo',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Như mới, dây đeo sạch đẹp',
          'Trầy xước nhẹ vỏ / Dây hơi cũ',
          'Trầy xước thấy rõ / Dây sờn',
          'Cấn móp vỏ / Dây rách, đứt',
        ],
      },
      {
        fieldKey: 'batteryStatus',
        label: 'Thời lượng pin',
        type: 'select',
        required: false,
        graded: true,
        options: [
          'Pin dùng được như mới',
          'Pin hao nhẹ, vẫn dùng hết ngày',
          'Pin chai, phải sạc giữa ngày',
          'Pin chai nặng',
        ],
      },
      accessories(['Dây sạc / Đế sạc', 'Dây đeo dự phòng', 'Hộp gốc']),
    ],
  },
  {
    id: 'gaming_consoles',
    name: 'Máy chơi game',
    icon: 'game-controller-outline',
    description: 'PlayStation, Nintendo Switch, Xbox, máy chơi game cầm tay, băng / đĩa game',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Tình trạng hoạt động',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Chạy mượt, đọc đĩa / băng game ổn định',
          'Hoạt động bình thường',
          'Thỉnh thoảng lỗi / Quạt ồn / Joy-Con trôi nhẹ',
          'Lỗi phần cứng, cần sửa chữa',
        ],
      },
      genericExterior('Vỏ máy'),
      {
        fieldKey: 'controllerCondition',
        label: 'Tay cầm kèm theo',
        type: 'select',
        required: false,
        options: [
          'Tay cầm kèm theo hoạt động tốt',
          'Tay cầm kèm theo bị trôi analog / nút sượng',
          'Không kèm tay cầm',
        ],
      },
      accessories(['Tay cầm', 'Dây nguồn / Sạc', 'Cáp HDMI', 'Băng / Đĩa game', 'Hộp gốc']),
    ],
  },
  {
    id: 'other_electronics',
    name: 'Thiết bị điện tử khác',
    icon: 'hardware-chip-outline',
    description: 'Router Wi-Fi, webcam, ổ cứng, máy đọc sách, camera an ninh, đồ điện tử thông minh...',
    conditionFieldSchema: [
      genericWorking(),
      genericExterior(),
      usageAge(),
      accessories(['Dây nguồn / Cáp sạc', 'Phụ kiện đi kèm theo máy', 'Hộp gốc', 'Hóa đơn / Bảo hành']),
    ],
  },
];

const CLOTHING_SUBS = [
  {
    id: 'apparel',
    name: 'Quần áo & Váy đầm',
    icon: 'shirt-outline',
    description: 'Áo thun, sơ mi, áo khoác, quần jeans, váy đầm, đồ thể thao, đồ ngủ',
    conditionFieldSchema: [
      {
        fieldKey: 'size',
        label: 'Kích cỡ (Size)',
        type: 'select',
        required: true,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Freesize', 'Size số / Khác (ghi trong mô tả)'],
      },
      {
        fieldKey: 'fabricCondition',
        label: 'Độ mới chất vải & Màu sắc',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Vải như mới, màu tươi nguyên',
          'Đã giặt vài lần, còn rất mới',
          'Có dấu hiệu sử dụng thông thường',
          'Vải hơi sờn / Hơi phai màu nhẹ',
        ],
      },
      {
        fieldKey: 'stainsOrTears',
        label: 'Vết ố, rách hoặc sứt chỉ',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Tuyệt đối không có vết ố hay rách',
          'Có vết ố nhỏ khó thấy',
          'Đã sửa lại đường chỉ / Vá nhỏ',
          'Có vết ố / rách thấy rõ (ghi rõ trong mô tả)',
        ],
      },
      {
        fieldKey: 'gender',
        label: 'Phân loại giới tính',
        type: 'select',
        required: false,
        options: ['Nam', 'Nữ', 'Unisex', 'Trẻ em'],
      },
    ],
  },
  {
    id: 'footwear',
    name: 'Giày dép',
    icon: 'footsteps-outline',
    description: 'Sneaker, giày thể thao, giày da, cao gót, sandal, dép',
    conditionFieldSchema: [
      {
        fieldKey: 'shoeSize',
        label: 'Kích cỡ giày (Size EU)',
        type: 'select',
        required: true,
        options: ['Dưới 35', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', 'Trên 45'],
      },
      {
        fieldKey: 'soleCondition',
        label: 'Đế giày & Mũi giày',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Đế nguyên gai chưa mòn, mũi giày không gãy nếp',
          'Đế mòn nhẹ phần gót, mũi giày đứng form',
          'Đế mòn thấy rõ, mũi giày gãy nếp nhẹ',
          'Đế mòn nhiều / Có vết hở keo nhẹ',
        ],
      },
      {
        fieldKey: 'upperCondition',
        label: 'Thân giày (Da / Vải)',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Thân giày sạch bóng, da/vải như mới',
          'Có nếp nhăn tự nhiên, không bong tróc',
          'Vải hơi bám bụi / Da hơi sờn nhẹ',
          'Có vết trầy xước da / Vải ố vàng',
        ],
      },
      accessories(
        ['Hộp giày gốc (OG Box)', 'Hộp thay thế', 'Dây giày dự phòng', 'Shoe tree giữ form', 'Hóa đơn / Tag chính hãng'],
        'Phụ kiện giày kèm theo'
      ),
    ],
  },
  {
    id: 'bags_wallets',
    name: 'Túi xách, Balo & Ví',
    icon: 'bag-handle-outline',
    description: 'Túi xách, túi đeo chéo, balo, túi tote, ví da cầm tay',
    conditionFieldSchema: [
      {
        fieldKey: 'materialType',
        label: 'Chất liệu chính',
        type: 'select',
        required: true,
        options: [
          'Da thật (Genuine Leather)',
          'Da tổng hợp / Da PU',
          'Vải Canvas / Vải dù',
          'Chất liệu khác',
        ],
      },
      {
        fieldKey: 'zipperAndHardware',
        label: 'Khóa, nút cài & Quai đeo',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Khóa / nút cài êm, quai chắc chắn, kim loại sáng',
          'Hoạt động tốt, kim loại trầy nhẹ',
          'Khóa hơi rít / Kim loại xỉn màu / Quai sờn nhẹ',
          'Hỏng khóa / Đứt hoặc mất quai',
        ],
      },
      {
        fieldKey: 'exteriorCorners',
        label: 'Góc đáy & Bề mặt da / vải',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Góc đáy nguyên vẹn không trầy sờn',
          'Sờn nhẹ ở góc đáy khó thấy',
          'Có vết trầy xước trên bề mặt',
          'Góc đáy sờn tróc nhiều',
        ],
      },
      {
        fieldKey: 'interiorCleanliness',
        label: 'Độ sạch lòng túi',
        type: 'select',
        required: false,
        graded: true,
        options: [
          'Lòng túi sạch, không vết bẩn hay mùi lạ',
          'Có vết bụi / vết bút nhỏ bên trong',
          'Cần vệ sinh hoặc spa lại lòng túi',
        ],
      },
    ],
  },
  {
    id: 'watches',
    name: 'Đồng hồ đeo tay',
    icon: 'time-outline',
    description: 'Đồng hồ cơ, đồng hồ pin (quartz). Đồng hồ thông minh đăng ở mục Đồ điện tử.',
    conditionFieldSchema: [
      {
        fieldKey: 'workingStatus',
        label: 'Bộ máy',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Chạy chuẩn giờ, mọi kim và chức năng hoạt động',
          'Chạy bình thường, sai số nhỏ',
          'Hết pin / Cần lau dầu bảo dưỡng',
          'Không chạy / Hỏng bộ máy',
        ],
      },
      {
        fieldKey: 'accessoryCondition',
        label: 'Mặt kính & Vỏ đồng hồ',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Mặt kính không tì vết, vỏ sáng bóng',
          'Xước dăm lông mèo rất nhẹ',
          'Có vết xước thấy rõ trên kính / vỏ',
          'Nứt vỡ kính / Cấn móp vỏ',
        ],
      },
      {
        fieldKey: 'strapCondition',
        label: 'Dây đeo',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Dây như mới',
          'Dây có dấu hiệu sử dụng nhẹ',
          'Dây sờn / Trầy xước thấy rõ',
          'Dây hỏng, thiếu mắt hoặc không kèm dây',
        ],
      },
      accessories(['Hộp gốc & Sổ bảo hành', 'Mắt dây dự phòng', 'Dây đeo thay thế', 'Hóa đơn mua hàng']),
    ],
  },
  {
    id: 'eyewear',
    name: 'Kính mắt',
    icon: 'glasses-outline',
    description: 'Kính râm, gọng kính cận, kính thời trang',
    conditionFieldSchema: [
      {
        fieldKey: 'lensCondition',
        label: 'Tròng kính',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Tròng kính trong, không trầy',
          'Trầy xước nhẹ khó thấy',
          'Trầy xước thấy rõ',
          'Nứt / Bong lớp phủ tròng (hoặc không có tròng)',
        ],
      },
      {
        fieldKey: 'frameCondition',
        label: 'Gọng kính',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Gọng thẳng, bản lề chắc',
          'Gọng trầy nhẹ, bản lề tốt',
          'Gọng hơi lệch / Bản lề lỏng',
          'Gãy gọng / Mất ốc, đệm mũi',
        ],
      },
      accessories(['Hộp kính', 'Khăn lau', 'Thẻ bảo hành / Hóa đơn']),
    ],
  },
  {
    id: 'fashion_accessories',
    name: 'Trang sức, Thắt lưng & Phụ kiện khác',
    icon: 'diamond-outline',
    description: 'Trang sức, thắt lưng, mũ nón, khăn, cà vạt, kẹp tóc, phụ kiện thời trang khác',
    conditionFieldSchema: [
      {
        fieldKey: 'exteriorCondition',
        label: 'Bề mặt & Màu sắc',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Như mới, sáng bóng / màu tươi',
          'Có dấu hiệu sử dụng nhẹ',
          'Xỉn màu / Trầy xước / Sờn thấy rõ',
          'Bong tróc / Phai màu nhiều',
        ],
      },
      {
        fieldKey: 'integrityCondition',
        label: 'Khóa cài, móc nối & Đường may',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Nguyên vẹn, chắc chắn',
          'Hơi lỏng nhẹ, vẫn dùng tốt',
          'Lỏng / Bung chỉ nhẹ, cần sửa',
          'Gãy khóa / Đứt / Bung nhiều',
        ],
      },
      accessories(['Hộp / Túi đựng', 'Giấy kiểm định / Hóa đơn']),
    ],
  },
];

const BOOK_SUBS = [
  {
    id: 'general_books',
    name: 'Sách, Tạp chí & Ấn phẩm khác',
    icon: 'book-outline',
    description: 'Tiểu thuyết, kỹ năng sống, kinh tế, thiếu nhi, sách nấu ăn, sách ảnh, tạp chí và các ấn phẩm in khác',
    conditionFieldSchema: [
      {
        fieldKey: 'coverCondition',
        label: 'Tình trạng bìa sách',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Bìa phẳng phiu, không gấp nếp (như mới)',
          'Bìa có nếp gấp nhẹ góc',
          'Bìa trầy xước / Ố vàng do thời gian',
          'Bìa bị rách nhẹ',
        ],
      },
      {
        fieldKey: 'pageCondition',
        label: 'Tình trạng trang giấy',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Trang giấy trắng sạch, đủ 100% trang',
          'Giấy có ngả vàng nhẹ theo thời gian',
          'Có vài trang gấp nếp',
          'Có trang rách / thiếu trang (ghi rõ)',
        ],
      },
      {
        fieldKey: 'writingOrHighlight',
        label: 'Ghi chú / Highlight',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Không có bút viết hay highlight',
          'Có gạch chân chì nhẹ vài trang',
          'Có đánh dấu bút nhớ (highlight)',
          'Có nhiều ghi chú viết tay',
        ],
      },
      accessories(
        ['Bookmark gốc theo sách', 'Đai sách (Obi)', 'Bìa bọc nylon bảo vệ'],
        'Phụ kiện kẹp sách / Bọc bìa',
        'includedBookmarks'
      ),
    ],
  },
  {
    id: 'textbooks_academic',
    name: 'Giáo trình & Sách ngoại ngữ',
    icon: 'school-outline',
    description: 'Giáo trình đại học, sách giáo khoa, luyện thi IELTS/TOEIC, sách chuyên ngành',
    conditionFieldSchema: [
      {
        fieldKey: 'editionStatus',
        label: 'Bài tập & Ghi chép trong sách',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Sách sạch 100%, chưa từng làm bài vào sách',
          'Có làm bài tập bằng chì (đã tẩy sạch)',
          'Có highlight / ghi chú từ vựng',
          'Đã điền đáp án bằng bút mực',
        ],
      },
      {
        fieldKey: 'coverAndBinding',
        label: 'Bìa, gáy sách & Độ chắc chắn',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Gáy sách vuông vức, keo dán gáy chắc chắn',
          'Gáy sách hơi lỏng nhẹ mép đầu',
          'Đã dán băng keo / Dập ghim gia cố gáy',
          'Gáy bung / Rời trang',
        ],
      },
      {
        fieldKey: 'cdOrOnlineCode',
        label: 'Đĩa CD / Mã học kèm theo',
        type: 'select',
        required: false,
        hint: 'Bỏ qua nếu sách không có đĩa hay mã học online.',
        options: [
          'Đầy đủ đĩa CD / Mã học online chưa cào',
          'Đã cào mã học trực tuyến / Mất đĩa',
        ],
      },
    ],
  },
  {
    id: 'comics_manga',
    name: 'Truyện tranh & Manga',
    icon: 'albums-outline',
    description: 'Manga, comic, light novel, manhwa, truyện tranh thiếu nhi',
    conditionFieldSchema: [
      {
        fieldKey: 'jacketCondition',
        label: 'Bìa truyện (bìa thường / bìa áo)',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Bìa phẳng đẹp, màu tươi, không rách',
          'Bìa nhăn nhẹ mép góc',
          'Bìa có vết rách nhỏ / Đã dán lại',
          'Bìa rách nhiều / Mất bìa áo',
        ],
      },
      {
        fieldKey: 'spineAndYellowing',
        label: 'Gáy truyện & Độ ố vàng giấy',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Gáy truyện thẳng tắp không gãy, giấy trắng đẹp',
          'Gáy đẹp, mép giấy ngả vàng nhẹ theo thời gian',
          'Gáy có nếp gấp nhẹ, giấy ố vàng tự nhiên',
          'Gáy gãy nhiều / Giấy ố nặng do bảo quản',
        ],
      },
      {
        fieldKey: 'setCompleteness',
        label: 'Quy cách bán',
        type: 'select',
        required: true,
        options: [
          'Trọn bộ đầy đủ 100% tập (Full set)',
          'Bộ dài tập còn thiếu vài cuốn (ghi rõ)',
          'Bán tập lẻ / Tập đặc biệt',
        ],
      },
      {
        fieldKey: 'includedCollectibles',
        label: 'Quà tặng & Phụ kiện sưu tầm',
        type: 'multiselect',
        required: false,
        options: [
          'Bookmark gốc theo tập',
          'Đai sách (Obi) nguyên vẹn',
          'Postcard giới hạn kèm theo',
          'Poster / Standee tặng kèm',
          'Nguyên màng co (chưa đọc)',
        ],
      },
    ],
  },
  {
    id: 'stationery_tools',
    name: 'Máy tính cầm tay & Thiết bị học tập',
    icon: 'calculator-outline',
    description: 'Máy tính Casio / Vinacal, bảng vẽ điện tử, bút thông minh, từ điển điện tử',
    conditionFieldSchema: [
      {
        fieldKey: 'workingFunction',
        label: 'Tình trạng hoạt động',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Hoạt động hoàn hảo, màn hiển thị rõ nét',
          'Hoạt động bình thường, ổn định',
          'Màn hơi mờ / Cần thay pin mới',
          'Có phím bị kẹt / Liệt phím',
        ],
      },
      {
        fieldKey: 'exteriorLook',
        label: 'Ngoại hình & Trầy xước',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Như mới, không trầy xước',
          'Trầy dăm nhẹ trên vỏ nắp',
          'Mờ ký hiệu trên phím bấm',
          'Cấn móp / Nứt vỡ nắp vỏ',
        ],
      },
      accessories(['Hộp gốc & Sách hướng dẫn', 'Nắp trượt bảo vệ', 'Pin kèm theo', 'Cáp kết nối / Bút stylus']),
    ],
  },
  {
    id: 'art_supplies',
    name: 'Dụng cụ học tập & Họa cụ',
    icon: 'color-palette-outline',
    description: 'Bút kỹ thuật, bộ compa - thước, màu vẽ, giá vẽ, balo / hộp đựng dụng cụ',
    conditionFieldSchema: [
      {
        fieldKey: 'usageLevel',
        label: 'Mức độ đã sử dụng',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Mới, chưa sử dụng (còn tem / màng)',
          'Dùng ít, còn trên 70%',
          'Đã dùng khoảng một nửa',
          'Dùng nhiều, còn dưới 30%',
        ],
      },
      {
        fieldKey: 'exteriorLook',
        label: 'Ngoại hình & Độ nguyên vẹn',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Như mới, nguyên vẹn',
          'Trầy xước / bám màu nhẹ',
          'Trầy xước thấy rõ / Hộp đựng cũ',
          'Gãy, nứt hoặc thiếu chi tiết (ghi rõ)',
        ],
      },
      {
        fieldKey: 'setCompleteness',
        label: 'Quy cách bán',
        type: 'select',
        required: false,
        options: ['Đủ bộ, không thiếu món', 'Bộ thiếu một vài món (ghi rõ)', 'Bán lẻ từng món'],
      },
    ],
  },
];

const APPLIANCE_SUBS = [
  {
    id: 'electric_kitchen',
    name: 'Thiết bị điện nhà bếp',
    icon: 'flash-outline',
    description: 'Nồi cơm điện, nồi chiên không dầu, máy xay, ấm siêu tốc, lò nướng, lò vi sóng, máy pha cà phê',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Khả năng vận hành',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Hoạt động mạnh mẽ, đủ mọi chế độ',
          'Hoạt động bình thường, nấu / xay / đun tốt',
          'Hoạt động nhưng ồn hoặc nóng chậm',
          'Lỗi, cần bảo trì sửa chữa',
        ],
      },
      {
        fieldKey: 'innerPotOrBlade',
        label: 'Bộ phận tiếp xúc thực phẩm',
        type: 'select',
        required: true,
        graded: true,
        hint: 'Lòng nồi, khay chiên, cối xay, lòng ấm, khoang lò...',
        options: [
          'Nguyên vẹn, sạch, không tróc hay gỉ',
          'Xước li ti, vẫn dùng tốt',
          'Tróc lớp chống dính / Ố cặn nhẹ',
          'Tróc nhiều / Gỉ sét (ghi rõ)',
        ],
      },
      {
        fieldKey: 'cleanliness',
        label: 'Độ sạch sẽ & Vệ sinh',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Đã vệ sinh sạch sẽ, khử mùi',
          'Bình thường, có thể sử dụng ngay',
          'Cần lau chùi kỹ trước khi dùng',
        ],
      },
      usageAge(['Dưới 3 tháng', 'Từ 3 đến 6 tháng', 'Từ 6 đến 12 tháng', 'Trên 1 năm']),
      accessories(['Dây nguồn zin', 'Khay / Vỉ / Cối phụ kèm theo', 'Hộp gốc & Sách hướng dẫn']),
    ],
  },
  {
    id: 'cookware_tableware',
    name: 'Dụng cụ bếp & Bàn ăn (Không dùng điện)',
    icon: 'restaurant-outline',
    description: 'Nồi, chảo, bát đĩa, ly cốc, dao kéo, bình giữ nhiệt, hộp đựng thực phẩm',
    conditionFieldSchema: [
      {
        fieldKey: 'surfaceCondition',
        label: 'Bề mặt sử dụng',
        type: 'select',
        required: true,
        graded: true,
        hint: 'Lớp chống dính, men sứ, lòng bình, lưỡi dao...',
        options: [
          'Như mới, sáng bóng, không trầy',
          'Xước dăm nhẹ, không ảnh hưởng sử dụng',
          'Ố màu / Lớp phủ hơi sờn / Lưỡi dao hơi cùn',
          'Tróc lớp phủ / Sứt mẻ nhỏ',
        ],
      },
      {
        fieldKey: 'structuralIntegrity',
        label: 'Độ nguyên vẹn (nứt, móp, nắp đậy)',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Không nứt vỡ, không móp méo',
          'Móp nhẹ nhưng nắp vẫn đậy khít',
          'Có vết nứt dăm rất nhỏ',
          'Nứt / Sứt mẻ / Nắp không còn khít',
        ],
      },
      {
        fieldKey: 'cleanliness',
        label: 'Độ sạch sẽ',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Đã rửa sạch, không bám mùi',
          'Sạch sẽ bình thường',
          'Cần rửa lại trước khi sử dụng',
        ],
      },
      {
        fieldKey: 'material',
        label: 'Chất liệu chính',
        type: 'select',
        required: false,
        options: [
          'Inox',
          'Gang',
          'Gốm sứ',
          'Thủy tinh',
          'Nhôm phủ chống dính',
          'Nhựa / Silicone',
          'Gỗ / Tre',
          'Khác',
        ],
      },
    ],
  },
  {
    id: 'home_cooling_cleaning',
    name: 'Quạt, Máy lọc khí & Máy hút bụi',
    icon: 'snow-outline',
    description: 'Quạt điện, quạt tích điện, máy lọc không khí, máy hút bụi, robot hút bụi',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Vận hành & Sức gió / Lực hút',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Động cơ êm, gió mạnh / Lực hút mạnh',
          'Hoạt động tốt mọi chế độ',
          'Hoạt động bình thường nhưng hơi ồn',
          'Động cơ yếu / Chập chờn',
        ],
      },
      {
        fieldKey: 'filterAndParts',
        label: 'Lưới lọc, cánh quạt & Hộp bụi',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Màng lọc mới thay, cánh quạt sạch',
          'Màng lọc còn tốt, bám bụi nhẹ',
          'Cần thay màng lọc / Vệ sinh cánh quạt',
        ],
      },
      {
        fieldKey: 'batteryStatus',
        label: 'Pin tích điện',
        type: 'select',
        required: false,
        graded: true,
        hint: 'Bỏ qua nếu máy cắm điện trực tiếp.',
        options: [
          'Pin còn rất tốt (trên 4 tiếng / đủ dọn cả nhà)',
          'Pin dùng được 1 - 2 tiếng',
          'Pin đã chai, chỉ dùng khi cắm sạc',
        ],
      },
      {
        fieldKey: 'cleanliness',
        label: 'Vệ sinh vỏ ngoài',
        type: 'select',
        required: true,
        graded: true,
        options: ['Đã lau chùi sạch sẽ', 'Bám bụi nhẹ bên ngoài', 'Cần vệ sinh tổng thể'],
      },
    ],
  },
  {
    id: 'large_appliances',
    name: 'Điện lạnh & Điện máy lớn',
    icon: 'cube-outline',
    description: 'Tủ lạnh, máy giặt, máy sấy quần áo, điều hòa, máy nước nóng',
    conditionFieldSchema: [
      {
        fieldKey: 'workingCondition',
        label: 'Khả năng vận hành',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Vận hành tốt, làm lạnh / giặt / sưởi đúng chuẩn',
          'Hoạt động bình thường, hơi ồn nhẹ',
          'Hiệu suất giảm (lạnh yếu, vắt yếu...)',
          'Lỗi, cần sửa chữa',
        ],
      },
      genericExterior('Vỏ máy & Ngoại hình'),
      repairHistory(true, [
        'Chưa từng sửa chữa',
        'Đã bảo dưỡng / vệ sinh định kỳ',
        'Đã thay linh kiện (ghi rõ trong mô tả)',
      ]),
      usageAge(['Dưới 1 năm', 'Từ 1 đến 3 năm', 'Từ 3 đến 5 năm', 'Trên 5 năm']),
      accessories(['Điều khiển từ xa', 'Ống cấp / thoát nước', 'Sách hướng dẫn / Phiếu bảo hành']),
    ],
  },
  {
    id: 'furniture_decor',
    name: 'Nội thất & Đèn trang trí',
    icon: 'bed-outline',
    description: 'Bàn ghế, giá kệ, tủ, gương, đèn bàn, đèn cây, đồ trang trí',
    conditionFieldSchema: [
      {
        fieldKey: 'frameSturdiness',
        label: 'Độ chắc chắn khung & Khớp nối',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Khung vững chãi, khớp nối chắc không lung lay',
          'Chắc chắn, chịu lực tốt',
          'Có khớp nối hơi lỏng nhẹ, dùng bình thường',
          'Cần siết lại ốc vít / Gia cố chân đế',
        ],
      },
      {
        fieldKey: 'surfaceWear',
        label: 'Bề mặt hoàn thiện (Gỗ / Sơn / Kính / Vải)',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Bề mặt đẹp, không trầy xước',
          'Trầy dăm nhẹ khó thấy',
          'Có vết xước / vết ố thấy rõ',
          'Bong tróc sơn / Trầy xước nhiều',
        ],
      },
      {
        fieldKey: 'electricalFunction',
        label: 'Bộ phận điện',
        type: 'select',
        required: false,
        graded: true,
        hint: 'Chỉ chọn với đồ có điện như đèn, kệ có đèn, ghế massage...',
        options: ['Hoạt động tốt', 'Hoạt động nhưng chập chờn nhẹ', 'Bị hỏng, cần sửa'],
      },
      usageAge(),
    ],
  },
  {
    id: 'other_household',
    name: 'Đồ gia dụng khác',
    icon: 'home-outline',
    description: 'Dụng cụ vệ sinh, đồ dùng phòng tắm, đồ dùng cho bé, dụng cụ sửa chữa, đồ gia dụng khác',
    conditionFieldSchema: [
      genericExterior(),
      {
        fieldKey: 'integrityCondition',
        label: 'Độ nguyên vẹn & Chức năng',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Nguyên vẹn, đầy đủ bộ phận, dùng tốt',
          'Thiếu / lỏng chi tiết nhỏ, không ảnh hưởng',
          'Hỏng một phần, vẫn dùng được (ghi rõ)',
          'Hỏng, cần sửa chữa',
        ],
      },
      {
        fieldKey: 'cleanliness',
        label: 'Độ sạch sẽ & Vệ sinh',
        type: 'select',
        required: false,
        graded: true,
        options: ['Đã vệ sinh sạch sẽ', 'Bình thường, dùng được ngay', 'Cần vệ sinh trước khi dùng'],
      },
      usageAge(),
    ],
  },
];

const VEHICLE_SUBS = [
  {
    id: 'motorbikes_scooters',
    name: 'Xe máy & Xe tay ga',
    icon: 'speedometer-outline',
    description: 'Xe số, xe côn tay, xe tay ga, xe 50cc cho học sinh',
    conditionFieldSchema: [
      {
        fieldKey: 'engineCondition',
        label: 'Tình trạng động cơ & Máy móc',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Máy êm, nguyên zin, chưa rớt đầu',
          'Máy êm, đã bảo dưỡng / thay nhớt định kỳ',
          'Máy hơi kêu / có tiếng gõ nhẹ',
          'Máy yếu, cần đại tu / làm lại',
        ],
      },
      {
        fieldKey: 'paperworkStatus',
        label: 'Giấy tờ xe & Pháp lý',
        type: 'select',
        required: true,
        options: [
          'Chính chủ, sang tên ngay',
          'Có cà vẹt gốc, bao tranh chấp',
          'Xe thanh lý / Giấy tờ hợp lệ',
          'Không giấy tờ (chỉ bán phụ tùng)',
        ],
      },
      {
        fieldKey: 'safetyAndBrakes',
        label: 'Hệ thống phanh, đèn & Lốp xe',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Phanh ăn, đèn còi tốt, lốp còn gai dày',
          'Hoạt động tốt, mòn nhẹ tự nhiên',
          'Cần thay lốp hoặc bố thắng',
          'Đèn / còi / phanh bị lỗi cần sửa',
        ],
      },
      genericExterior('Dàn áo & Khung sườn'),
      {
        fieldKey: 'odometerRange',
        label: 'Số km đã đi (Odo)',
        type: 'select',
        required: false,
        options: ['Dưới 10.000 km', '10.000 - 30.000 km', '30.000 - 60.000 km', 'Trên 60.000 km'],
      },
      usageAge(['Dưới 1 năm', 'Từ 1 đến 3 năm', 'Từ 3 đến 5 năm', 'Trên 5 năm']),
    ],
  },
  {
    id: 'bicycles_ebikes',
    name: 'Xe đạp & Xe điện',
    icon: 'bicycle-outline',
    description: 'Xe đạp thể thao, touring, fixed gear, xe đạp mini, xe đạp điện, xe máy điện',
    conditionFieldSchema: [
      {
        fieldKey: 'frameAndChain',
        label: 'Khung sườn & Bộ truyền động',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Chuyển số mượt mà, xích líp tốt, không rỉ sét',
          'Hoạt động tốt, xích líp khô nhẹ cần tra dầu',
          'Chuyển số sượng, xích chùng hoặc có rỉ sét',
          'Hỏng bộ số / đứt xích cần sửa',
        ],
      },
      {
        fieldKey: 'brakesAndTires',
        label: 'Phanh & Lốp xe',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Phanh ăn chắc, lốp dày nguyên gai',
          'Phanh tốt, lốp mòn nhẹ',
          'Phanh mòn hoặc lốp cần thay mới',
        ],
      },
      genericExterior('Khung xe & Nước sơn'),
      {
        fieldKey: 'batteryOrPower',
        label: 'Bình ắc quy / Pin xe điện',
        type: 'select',
        required: false,
        graded: true,
        hint: 'Chỉ chọn đối với xe điện, xe đạp trợ lực',
        options: [
          'Pin / Ắc quy rất khỏe, đi xa như ban đầu',
          'Pin còn tốt (80-90%), đi được 20-30km/sạc',
          'Pin chai nhẹ, cần sạc thường xuyên hơn',
          'Pin chai nặng hoặc hỏng, cần thay mới',
        ],
      },
      usageAge(),
    ],
  },
  {
    id: 'helmets_accessories',
    name: 'Mũ bảo hiểm & Phụ kiện xe',
    icon: 'shield-checkmark-outline',
    description: 'Mũ bảo hiểm fullface, 3/4, nửa đầu, giá đỡ điện thoại, khóa xe, phụ kiện đi phượt',
    conditionFieldSchema: [
      {
        fieldKey: 'helmetShellVisor',
        label: 'Vỏ mũ & Kính chắn gió',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Như mới, kính trong suốt không trầy',
          'Trầy xước rất nhẹ ngoài vỏ, kính tốt',
          'Trầy xước thấy rõ, kính hơi mờ',
          'Nứt vỡ hoặc chốt kính bị lỏng',
        ],
      },
      {
        fieldKey: 'strapAndPadding',
        label: 'Dây quai & Đệm lót trong',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Khóa bấm nhạy, đệm lót sạch thơm nguyên vẹn',
          'Đệm sạch, khóa chắc chắn bình thường',
          'Đệm hơi sờn hoặc cần giặt vệ sinh',
        ],
      },
      usageAge(),
    ],
  },
  {
    id: 'other_vehicles',
    name: 'Phương tiện & Phụ tùng khác',
    icon: 'construct-outline',
    description: 'Ván trượt, patin, phụ tùng xe cộ, dụng cụ bảo dưỡng',
    conditionFieldSchema: [
      genericWorking(),
      genericExterior(),
      usageAge(),
    ],
  },
];

const SPORTS_HOBBIES_SUBS = [
  {
    id: 'musical_instruments',
    name: 'Nhạc cụ (Guitar, Piano, Ukulele...)',
    icon: 'musical-notes-outline',
    description: 'Đàn guitar acoustic, classic, điện, ukulele, đàn phím điện tử, phụ kiện nhạc cụ',
    conditionFieldSchema: [
      {
        fieldKey: 'soundAndPlayability',
        label: 'Âm thanh & Cần đàn / Phím bấm',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Âm vang chuẩn, cần thẳng, action êm không rè phím',
          'Âm thanh tốt, rè nhẹ ở phím cao ít dùng',
          'Cần hơi cong hoặc action cao cần căn chỉnh lại',
          'Nứt vỡ thùng / gãy cần / liệt phím',
        ],
      },
      genericExterior('Thùng đàn & Bề mặt hoàn thiện'),
      accessories(
        ['Bao đàn (bao da/bao vải)', 'Capo & Phím gảy (Pick)', 'Dây đàn dự phòng', 'Dây cáp cắm amply', 'Chân để đàn'],
        'Phụ kiện kèm theo'
      ),
      usageAge(),
    ],
  },
  {
    id: 'sports_equipment',
    name: 'Dụng cụ thể thao & Gym',
    icon: 'tennisball-outline',
    description: 'Vợt cầu lông, tennis, pickleball, bóng đá, bóng rổ, tạ, thảm yoga',
    conditionFieldSchema: [
      {
        fieldKey: 'frameAndTension',
        label: 'Khung vợt & Độ căng cước / Đàn hồi',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Khung nguyên vẹn chưa nứt lún, độ đàn hồi/cước căng tốt',
          'Khung trầy sơn nhẹ, chơi thể thao tốt',
          'Cước hơi chùng hoặc khung trầy xước nhiều',
          'Khung rạn nứt / đứt cước cần căng lại',
        ],
      },
      genericExterior('Bề mặt tiếp xúc & Ngoại hình'),
      {
        fieldKey: 'gripCondition',
        label: 'Cán cầm / Tay quấn',
        type: 'select',
        required: false,
        graded: true,
        options: ['Quấn cán mới nguyên', 'Quấn cán còn dùng tốt', 'Quấn cán cũ, nên thay mới'],
      },
      usageAge(),
    ],
  },
  {
    id: 'collectibles_toys',
    name: 'Mô hình, Đồ chơi & Sưu tầm',
    icon: 'cube-outline',
    description: 'Mô hình Gundam, Anime figure, Lego, Board game, xe mô hình, thẻ bài',
    conditionFieldSchema: [
      {
        fieldKey: 'completenessPieces',
        label: 'Độ đầy đủ chi tiết & Khớp nối',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Đầy đủ 100% chi tiết/mảnh ghép, khớp nối chắc chắn',
          'Đủ chi tiết chính, khớp nối bình thường',
          'Thiếu chi tiết nhỏ không đáng kể',
          'Thiếu phụ kiện quan trọng hoặc khớp lỏng/gãy',
        ],
      },
      genericExterior('Ngoại hình sơn & Độ phai màu'),
      {
        fieldKey: 'boxAndManual',
        label: 'Hộp gốc & Sách hướng dẫn',
        type: 'select',
        required: false,
        options: [
          'Đầy đủ hộp gốc và sách hướng dẫn',
          'Hộp có móp méo nhẹ / có sách',
          'Chỉ có mô hình/đồ chơi (không còn hộp)',
        ],
      },
      usageAge(),
    ],
  },
  {
    id: 'camping_outdoor',
    name: 'Dã ngoại & Cắm trại',
    icon: 'bonfire-outline',
    description: 'Lều cắm trại, túi ngủ, bàn ghế gấp, đèn pin dã ngoại, bếp ga mini',
    conditionFieldSchema: [
      {
        fieldKey: 'waterproofZippers',
        label: 'Vải bạt, chống nước & Khóa kéo',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Chống nước tốt, vải lành lặn, khóa trơn tru',
          'Vải nguyên vẹn, trầy xước nhẹ qua sử dụng',
          'Vải sờn hoặc khóa kéo rít nhẹ',
          'Rách hoặc hỏng khóa kéo cần sửa',
        ],
      },
      {
        fieldKey: 'polesAndFrame',
        label: 'Khung cọc & Độ chắc chắn',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Khung cọc đủ bộ, khớp nối chắc chắn',
          'Khung dùng tốt, trầy xước nhẹ',
          'Thiếu cọc phụ hoặc khớp hơi lỏng',
        ],
      },
      {
        fieldKey: 'cleanliness',
        label: 'Vệ sinh & Mùi ẩm mốc',
        type: 'select',
        required: false,
        graded: true,
        options: ['Đã giặt phơi sạch sẽ, không mùi', 'Bình thường', 'Cần vệ sinh trước khi dùng'],
      },
      usageAge(),
    ],
  },
  {
    id: 'other_sports_hobbies',
    name: 'Thể thao & Giải trí khác',
    icon: 'ellipsis-horizontal-circle-outline',
    description: 'Các dụng cụ thể thao, nhạc cụ hoặc sở thích giải trí khác',
    conditionFieldSchema: [
      genericWorking(),
      genericExterior(),
      usageAge(),
    ],
  },
];

const OTHER_SUBS = [
  {
    id: 'handicraft_art',
    name: 'Đồ thủ công, Mỹ nghệ & Quà tặng',
    icon: 'color-palette-outline',
    description: 'Tranh ảnh, đồ len thủ công, nến thơm, đồ gốm sứ, phụ kiện handmade',
    conditionFieldSchema: [
      genericExterior('Độ nguyên vẹn & Thẩm mỹ'),
      {
        fieldKey: 'craftIntegrity',
        label: 'Độ nguyên vẹn chi tiết & Màu sắc',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Nguyên vẹn 100%, màu sắc tươi mới, không lỗi',
          'Còn rất đẹp, có hao mòn rất nhỏ khó thấy',
          'Có vết trầy xước / phai màu hoặc sứt nhẹ',
          'Bị nứt vỡ / sứt mẻ hoặc đứt gãy cần gắn lại',
        ],
      },
      usageAge(),
    ],
  },
  {
    id: 'pet_supplies',
    name: 'Thú cưng & Phụ kiện thú cưng',
    icon: 'paw-outline',
    description: 'Chuồng lồng, đệm ngủ, bát ăn, dây dắt, balo vận chuyển chó mèo',
    conditionFieldSchema: [
      genericExterior('Độ chắc chắn & Ngoại hình'),
      {
        fieldKey: 'cleanliness',
        label: 'Vệ sinh & Khử khuẩn',
        type: 'select',
        required: true,
        graded: true,
        options: ['Đã giặt rửa, khử khuẩn sạch sẽ', 'Bình thường, dùng được ngay', 'Cần vệ sinh trước khi dùng'],
      },
      usageAge(),
    ],
  },
  {
    id: 'beauty_care',
    name: 'Mỹ phẩm & Chăm sóc cá nhân',
    icon: 'sparkles-outline',
    description: 'Nước hoa chiết, máy rửa mặt, máy uốn tóc, dụng cụ làm đẹp cá nhân',
    conditionFieldSchema: [
      genericWorking('Tình trạng hoạt động (với máy làm đẹp)'),
      {
        fieldKey: 'remainingVolume',
        label: 'Dung tích còn lại / Mức độ sử dụng',
        type: 'select',
        required: true,
        graded: true,
        options: [
          'Còn mới nguyên (chưa bóc seal / 100%)',
          'Còn nhiều (trên 80%)',
          'Còn một nửa (khoảng 50%)',
          'Còn ít (dưới 30% để test mùi/dùng thử)',
        ],
      },
      genericExterior('Vỏ chai, thân máy & Vệ sinh'),
      usageAge(),
    ],
  },
  {
    id: 'general_misc',
    name: 'Đồ dùng & Hàng thanh lý khác',
    icon: 'ellipsis-horizontal-circle-outline',
    description: 'Bất kỳ sản phẩm hoặc đồ dùng nào chưa được phân loại ở trên',
    conditionFieldSchema: [
      genericWorking('Tình trạng hoạt động / Công năng sử dụng'),
      genericExterior('Độ mới ngoại hình & Hao mòn'),
      accessories(
        ['Đầy đủ hộp và toàn bộ phụ kiện gốc', 'Có phụ kiện cơ bản đi kèm', 'Chỉ có món đồ chính (không kèm phụ kiện)'],
        'Phụ kiện kèm theo'
      ),
      usageAge(),
    ],
  },
];

const subById = (subs, id) => subs.find((s) => s.id === id);

export const DEFAULT_CATEGORIES = [
  {
    id: 'cat_electronics',
    name: 'Đồ điện tử',
    nameEn: 'Electronics',
    slug: 'electronics',
    icon: 'laptop-outline',
    description: 'Điện thoại, laptop, máy tính, tai nghe, loa, máy ảnh, sạc cáp và phụ kiện công nghệ',
    subCategories: ELECTRONICS_SUBS,
    // Fallback when no type is chosen: questions that fit any device
    conditionFieldSchema: subById(ELECTRONICS_SUBS, 'other_electronics').conditionFieldSchema,
  },
  {
    id: 'cat_clothing',
    name: 'Thời trang & Quần áo',
    nameEn: 'Clothing',
    slug: 'clothing',
    icon: 'shirt-outline',
    description: 'Quần áo, giày dép, túi xách, đồng hồ, kính mắt, trang sức và phụ kiện',
    subCategories: CLOTHING_SUBS,
    conditionFieldSchema: subById(CLOTHING_SUBS, 'fashion_accessories').conditionFieldSchema,
  },
  {
    id: 'cat_books',
    name: 'Sách & Giáo trình',
    nameEn: 'Books',
    slug: 'books',
    icon: 'book-outline',
    description: 'Sách văn học, giáo trình, truyện tranh, máy tính cầm tay, dụng cụ học tập',
    subCategories: BOOK_SUBS,
    conditionFieldSchema: subById(BOOK_SUBS, 'general_books').conditionFieldSchema,
  },
  {
    id: 'cat_appliances',
    name: 'Đồ gia dụng & Bếp',
    nameEn: 'Home Appliances',
    slug: 'home_appliances',
    icon: 'home-outline',
    description: 'Thiết bị bếp, dụng cụ nấu nướng, quạt, máy hút bụi, điện lạnh, nội thất',
    subCategories: APPLIANCE_SUBS,
    conditionFieldSchema: subById(APPLIANCE_SUBS, 'other_household').conditionFieldSchema,
  },
  {
    id: 'cat_vehicles',
    name: 'Xe cộ & Phương tiện',
    nameEn: 'Vehicles & Transportation',
    slug: 'vehicles',
    icon: 'bicycle-outline',
    description: 'Xe máy, xe tay ga, xe đạp, xe đạp điện, mũ bảo hiểm, linh kiện và phụ kiện xe',
    subCategories: VEHICLE_SUBS,
    conditionFieldSchema: subById(VEHICLE_SUBS, 'other_vehicles').conditionFieldSchema,
  },
  {
    id: 'cat_sports_hobbies',
    name: 'Thể thao & Giải trí',
    nameEn: 'Sports & Hobbies',
    slug: 'sports_hobbies',
    icon: 'football-outline',
    description: 'Dụng cụ thể thao, nhạc cụ, mô hình, đồ chơi, board game, đồ dã ngoại và cắm trại',
    subCategories: SPORTS_HOBBIES_SUBS,
    conditionFieldSchema: subById(SPORTS_HOBBIES_SUBS, 'other_sports_hobbies').conditionFieldSchema,
  },
  {
    id: 'cat_other',
    name: 'Khác & Hàng tổng hợp',
    nameEn: 'Other & Miscellaneous',
    slug: 'other',
    icon: 'apps-outline',
    description: 'Đồ thủ công, mỹ phẩm & chăm sóc cá nhân, thú cưng, cây cảnh, quà tặng và mọi đồ dùng thanh lý khác',
    subCategories: OTHER_SUBS,
    conditionFieldSchema: subById(OTHER_SUBS, 'general_misc').conditionFieldSchema,
  },
];

/**
 * Returns the sub-category object (or null)
 */
export const getSubCategory = (categoryId, subCategoryId) => {
  const cat = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.subCategories?.find((s) => s.id === subCategoryId) || null;
};

/**
 * Returns the exact condition schema matching category + subCategory
 */
export const getCategoryConditionSchema = (categoryId, subCategoryId) => {
  const cat = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return [];

  const sub = subCategoryId ? getSubCategory(categoryId, subCategoryId) : null;
  if (sub && sub.conditionFieldSchema) {
    return sub.conditionFieldSchema;
  }

  return cat.conditionFieldSchema || [];
};

/**
 * Returns the human-friendly label of a condition field. With the listing's category /
 * sub-category the label of that exact form is used (the same key can be worded
 * differently per product type, e.g. "Vỏ & Dây đeo" vs "Khung viền & Mặt lưng").
 */
export const getConditionFieldLabel = (fieldKey, categoryId, subCategoryId) => {
  if (categoryId) {
    const field = getCategoryConditionSchema(categoryId, subCategoryId).find((f) => f.fieldKey === fieldKey);
    if (field) return field.label;
  }
  return CONDITION_FIELD_LABELS[fieldKey] || fieldKey;
};
