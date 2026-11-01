# ReMarket – Nền tảng Thương mại Điện tử Đồ cũ (C2C Second-Hand Marketplace)

ReMarket là ứng dụng di động thương mại điện tử chuyên biệt dành cho việc mua bán sản phẩm đã qua sử dụng (second-hand), được xây dựng trên nền tảng **React Native**, **Expo SDK 58**, **JavaScript thuần**, **React Navigation**, **Redux Toolkit**, **Firebase** và **Google Gemini AI**.

Ứng dụng hướng đến 3 giá trị cốt lõi:
1. **Tính minh bạch (Transparency):** Người bán khai báo chi tiết tình trạng sản phẩm qua biểu mẫu động theo từng danh mục chuẩn hóa và cam kết khai báo lỗi (known defects).
2. **Tính tin cậy & Nhất quán (Reliability):** Áp dụng quy tắc giỏ hàng 1 người bán (Single-Seller Checkout), bảo lưu tồn kho nguyên tử (Atomic Inventory Reservation) chống bán vượt kho, cùng State Machine 6 trạng thái đơn hàng.
3. **Tiện lợi & Hiện đại (Convenience):** Trải nghiệm người dùng cao cấp với hệ thống nhận diện màu xanh ngọc bích (Emerald Green `#0F766E`), tích hợp trợ lý AI Smart Listing và AI Visual Search (Gemini).

---

## 1. Công nghệ sử dụng (Technology Stack)

- **Mobile Framework:** React Native 0.88 + Expo SDK 58 (JavaScript `.js` / `.jsx`).
- **Điều hướng (Navigation):** React Navigation v7 (`@react-navigation/native-stack`, `@react-navigation/bottom-tabs`).
- **Quản lý trạng thái (State Management):** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`).
- **Validation:** Zod + React Hook Form.
- **Lưu trữ cục bộ & Caching:** `@react-native-async-storage/async-storage`.
- **Backend & Cloud:** Firebase Authentication, Cloud Firestore, Firebase Cloud Storage.
- **Trí tuệ nhân tạo (AI):** Google Gemini 1.5/2.0 API (Smart Listing Assistant & Visual Search).
- **Bộ nhận diện UI:** Custom Emerald Design System, `@expo/vector-icons`, Safe Area Context.

---

## 2. Tài khoản thử nghiệm (Demo Accounts)

Ứng dụng tích hợp sẵn nút đăng nhập nhanh 1 chạm (One-Click Demo Login) ngay tại màn hình Đăng nhập và Hồ sơ:

| Vai trò | Email đăng nhập | Mật khẩu mẫu | Chức năng nổi bật |
| :--- | :--- | :--- | :--- |
| **Người mua (Buyer)** | `linh.buyer@gmail.com` | `123456` | Mua hàng, theo dõi đơn, xác nhận đã nhận hàng, đánh giá người bán, khiếu nại trả hàng. |
| **Người bán (Seller)** | `nam.seller@gmail.com` | `123456` | Đăng tin (AI Smart Listing), quản lý kho, duyệt/từ chối đơn hàng, cập nhật mã vận đơn bưu cục. |
| **Quản trị viên (Admin)** | `admin@remarket.vn` | `123456` | Bảng điều khiển KPI Dashboard (GOV giả lập), kiểm duyệt bài đăng, khóa tài khoản vi phạm, giải quyết khiếu nại. |
| **Khách (Guest)** | Không cần đăng nhập | - | Xem trang chủ, tìm kiếm, lọc giá, xem chi tiết và biểu mẫu tình trạng sản phẩm. |

---

## 3. Cài đặt và Khởi chạy ứng dụng (Getting Started)

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Chạy kiểm thử tự động toàn diện (38 Scenarios Test Suite)
```bash
npm test
```
- **Kịch bản nghiệp vụ cốt lõi (21 tests):** Định dạng tiền VND, Zod validation, State machine đơn hàng, 1-Seller Checkout, trừ kho nguyên tử chống overselling, hoàn kho khi hủy, điều kiện đánh giá.
- **Kịch bản tính năng nâng cao (17 tests):** Thuật toán chấm điểm tình trạng 0-100 & định giá thị trường, vòng đời mặc cả giá (make offer), tạo phòng chat & nhắn tin theo sản phẩm, ví tiền người bán & quyết toán COD.

### Bước 3: Khởi động máy chủ Expo Development
```bash
npx expo start
```
- Nhấn `a` để mở trên máy ảo hoặc thiết bị Android.
- Nhấn `i` để mở trên máy ảo iOS Simulator (macOS).
- Quét mã QR bằng ứng dụng Expo Go trên điện thoại thật.

---

## 4. Cấu hình Biến môi trường (Tùy chọn)

ReMarket được tích hợp sẵn tầng **Resilient Service Provider** giúp ứng dụng hoạt động 100% trơn tru, đầy đủ dữ liệu mẫu ngay cả khi chưa kết nối Firebase hay Gemini API.

Nếu muốn kết nối Firebase và Gemini trực tiếp từ môi trường của bạn, tạo file `.env` tại thư mục gốc:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

---

## 5. Cấu trúc thư mục mã nguồn JavaScript

```
src/
├── config/
│   ├── firebase.js          # Khởi tạo Firebase SDK & chế độ resilient fallback
│   ├── gemini.js            # Cấu hình Gemini AI & template prompt
│   └── theme.js             # Design tokens màu Emerald Green (#0F766E), spacing, shadows
├── constants/
│   ├── categories.js        # 4 danh mục và schema trường điều kiện động
│   ├── orderStatus.js       # State machine 6 trạng thái & ma trận quyền hạn
│   └── routes.js            # Định danh định tuyến React Navigation
├── utils/
│   ├── currency.js          # Định dạng tiền tệ VND / USD
│   ├── date.js              # Định dạng thời gian theo múi giờ
│   ├── validation.js        # Zod schemas (Auth, Listing, Address, Review, Dispute)
│   └── storage.js           # AsyncStorage session & memory fallback
├── services/
│   ├── mockData.js          # Dữ liệu hạt giống chất lượng cao
│   ├── authService.js       # Đăng nhập, đăng ký, đổi vai trò, địa chỉ
│   ├── productService.js    # Quản lý kho, lọc tìm kiếm, kiểm duyệt tin
│   ├── cartService.js       # Giỏ hàng, gom nhóm theo người bán
│   ├── orderService.js      # Giao dịch trừ kho nguyên tử, chuyển trạng thái đơn
│   ├── reviewService.js     # Đánh giá người bán sau đơn hàng hoàn tất
│   ├── disputeService.js    # Báo cáo vi phạm & yêu cầu trả hàng
│   ├── adminService.js      # Thống kê KPI & nhật ký kiểm duyệt
│   ├── aiService.js         # Gemini Smart Listing & Visual Search
│   ├── notificationService.js# Thông báo in-app
│   ├── offerService.js      # Mặc cả & Trả giá (Make an Offer)
│   ├── chatService.js       # Tin nhắn trao đổi người mua - người bán
│   └── walletService.js     # Ví người bán, thu hộ COD, yêu cầu rút tiền
├── store/
│   ├── index.js             # Root Redux store
│   └── slices/              # authSlice, productSlice, cartSlice, orderSlice, notificationSlice
├── components/
│   ├── common/              # Button, Input, Card, Badge, Modal, StarRating, Header, EmptyState
│   ├── forms/               # DynamicConditionForm (render biểu mẫu động theo danh mục)
│   ├── product/             # ProductCard, ConditionTag, DefectList
│   └── order/               # OrderCard, StatusBadge
├── navigation/
│   ├── RootNavigator.js     # Điều hướng cấp cao nhất
│   ├── AppTabs.js           # 5 Bottom Tabs: Trang chủ, Khám phá, Đăng bán, Yêu thích, Tài khoản
│   ├── AuthStack.js         # Đăng nhập, Đăng ký, Quên mật khẩu
│   └── AdminStack.js        # Bảng điều khiển Admin & Kiểm duyệt
└── screens/                 # Toàn bộ màn hình người dùng, quản trị & AI
```

---

## 6. Phân công Trách nhiệm Nhóm 4 Người (Dành cho Buổi Thuyết trình / Báo cáo)

Để chứng minh quy mô của một dự án 4 thành viên hoàn thiện, khối lượng công việc được phân chia rõ ràng theo từng phân hệ chức năng:

### 👤 Thành viên 1: Kiến trúc sư Hệ thống & Quản lý Xác thực, Khám phá (Discovery & Auth Lead)
- **Nhiệm vụ:**
  - Thiết kế cấu trúc thư mục, hệ thống định tuyến React Navigation (Tabs, AuthStack, AdminStack).
  - Phân quyền 3 vai trò: Guest, Registered User (Buyer/Seller), Administrator.
  - Xử lý Safe Area Insets (chống tràn tai thỏ / thanh trạng thái) và KeyboardAvoidingView trên đa nền tảng iOS/Android.
  - Triển khai Màn hình Trang chủ, Tìm kiếm từ khóa, Bộ lọc đa tiêu chí (giá, danh mục, tình trạng, khu vực), Danh mục sản phẩm.

### 👤 Thành viên 2: Kỹ sư Đăng tin, Chuẩn hóa Tình trạng & Tích hợp Trí tuệ Nhân tạo (Listing & AI Lead)
- **Nhiệm vụ:**
  - Thiết kế Form đăng bán động (`DynamicConditionForm`) thích ứng với 4 nhóm ngành hàng (Điện tử, Quần áo, Sách, Gia dụng).
  - Tích hợp Chụp ảnh từ Camera trực tiếp hoặc Chọn ảnh từ Thư viện qua `expo-image-picker`.
  - Triển khai **ReMarket Condition Scoring & Valuation Estimator** (Chấm điểm tình trạng tự động 0-100 & định giá thị trường đồ cũ).
  - Tích hợp Google Gemini AI: Trợ lý đăng tin thông minh (Smart Listing Assistant) và Tìm kiếm sản phẩm bằng hình ảnh (Visual Search).

### 👤 Thành viên 3: Kỹ sư Giao dịch C2C, Mặc cả & Trò chuyện Thời gian thực (C2C Commerce & Chat Lead)
- **Nhiệm vụ:**
  - Xây dựng phân hệ **Mặc cả / Trả giá (Make an Offer)**: Người mua đề xuất giá thấp hơn giá niêm yết, người bán duyệt/từ chối, người mua được thanh toán ngay theo giá đã thỏa thuận.
  - Xây dựng phân hệ **Trò chuyện In-App (Real-time C2C Chat)**: Phòng chat gắn chặt với sản phẩm cụ thể, ghim thẻ sản phẩm trên đầu, gợi ý câu hỏi nhanh (chips), cập nhật tin nhắn.
  - Quy tắc Giỏ hàng 1 người bán (Single-Seller Checkout), tính phí vận chuyển, quản lý sổ địa chỉ.

### 👤 Thành viên 4: Kỹ sư Đơn hàng, Ví tiền Người bán & Quản trị Nền tảng (Order, Wallet & Admin Lead)
- **Nhiệm vụ:**
  - State Machine 6 trạng thái đơn hàng (`PENDING` -> `CONFIRMED` -> `SHIPPING` -> `COMPLETED`), bảo lưu kho nguyên tử chống bán vượt (overselling), chỉ người mua mới có quyền bấm xác nhận đã nhận hàng.
  - Xây dựng **Ví ReMarket & Quyết toán COD (Seller Wallet)**: Quản lý số dư khả dụng, doanh thu COD đang tạm giữ từ các đơn đang giao, quy trình rút tiền về tài khoản ngân hàng thụ hưởng.
  - Phân hệ Đánh giá uy tín & Khiếu nại / Báo cáo vi phạm (Disputes & Return Requests).
  - Bảng điều khiển Quản trị viên (Admin Console): Duyệt/khóa bài đăng, kiểm soát người dùng vi phạm, thống kê tổng doanh thu sàn (GMV giả định).

---

## 7. Các tài liệu kỹ thuật bổ sung

- [`FIREBASE_SETUP_GUIDE.md`](./FIREBASE_SETUP_GUIDE.md): Hướng dẫn cấu hình Firebase Console, Security Rules và nạp dữ liệu (Seeding).
- [`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md): Sơ đồ kiến trúc tầng & luồng dữ liệu.
- [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md): Chi tiết 11 collections Firestore và snapshot bất biến.
- [`BUSINESS_RULES.md`](./BUSINESS_RULES.md): Đặc tả State Machine đơn hàng và nguyên tắc trừ kho nguyên tử.
- [`NAVIGATION_FLOW.md`](./NAVIGATION_FLOW.md): Sơ đồ luồng điều hướng màn hình và ma trận phân quyền.
