# HƯỚNG DẪN CẤU HÌNH CƠ SỞ DỮ LIỆU FIREBASE TOÀN DIỆN CHO REMARKET

Tài liệu này hướng dẫn chi tiết từng bước từ A đến Z cách thiết lập **Firebase Authentication**, **Cloud Firestore Database**, **Firebase Cloud Storage**, **Security Rules**, và **Nạp dữ liệu hạt giống (Seeding Database)** cho ứng dụng **ReMarket**.

---

## 1. TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU REMARKET

ReMarket sử dụng hệ sinh thái Firebase gồm 3 dịch vụ cốt lõi:

| Dịch vụ Firebase | Mục đích sử dụng trong ReMarket |
| :--- | :--- |
| **Firebase Authentication** | Quản lý đăng ký, đăng nhập tài khoản an toàn qua Email & Password, cấp Token xác thực (`request.auth.uid`). |
| **Cloud Firestore** | Cơ sở dữ liệu NoSQL lưu trữ thời gian thực (Real-time DB) cho 11 collections: `users`, `categories`, `products`, `orders`, `carts`, `reviews`, `reports`, `return_requests`, `conversations`, `offers`, `wallets`. |
| **Firebase Cloud Storage** | Lưu trữ tệp hình ảnh thực tế: ảnh thật sản phẩm qua sử dụng (`/products`), ảnh đại diện người dùng (`/avatars`), và ảnh bằng chứng khiếu nại (`/disputes`). |

---

## 2. QUY TRÌNH 7 BƯỚC CẤU HÌNH TRÊN FIREBASE CONSOLE

### BƯỚC 1: TẠO DỰ ÁN MỚI (FIREBASE PROJECT)
1. Truy cập [Firebase Console](https://console.firebase.google.com/) bằng tài khoản Google.
2. Bấm **Add project** (Thêm dự án).
3. Đặt tên dự án: ví dụ `remarket-c2c` (hoặc tên tùy ý của bạn).
4. Ở bước *Google Analytics*: Bạn có thể bật hoặc tắt (khuyến nghị tắt để tạo nhanh).
5. Bấm **Create project** và đợi 10 giây để Firebase khởi tạo xong.

---

### BƯỚC 2: KÍCH HOẠT FIREBASE AUTHENTICATION
1. Tại menu bên trái, chọn **Build** > **Authentication**.
2. Bấm nút **Get started**.
3. Tại tab **Sign-in method**, chọn nhà cung cấp **Email/Password**.
4. Gạt công tắc **Enable** ở mục đầu tiên (*Email/Password*), sau đó bấm **Save**.
   *(Mục Email link không cần bật)*.

---

### BƯỚC 3: TẠO CLOUD FIRESTORE DATABASE
1. Tại menu bên trái, chọn **Build** > **Firestore Database**.
2. Bấm nút **Create database**.
3. **Database location**: Chọn vùng gần Việt Nam nhất:
   - `asia-southeast1` (Singapore) hoặc `asia-east1` (Tokyo/Taiwan) để tốc độ tải nhanh nhất.
4. **Security rules**: Chọn **Start in test mode** hoặc **production mode** (chúng ta sẽ ghi đè bộ luật chuẩn ở Bước 4).
5. Bấm **Create** và chờ Firestore tạo cơ sở dữ liệu.

---

### BƯỚC 4: THIẾT LẬP FIRESTORE SECURITY RULES (QUAN TRỌNG)
Bộ luật bảo mật được viết chuẩn theo quy tắc 3 vai trò (Guest, User, Admin), bảo vệ kho hàng nguyên tử và chỉ cho phép người mua đánh giá sản phẩm.

1. Trong **Firestore Database**, bấm sang tab **Rules**.
2. Xóa toàn bộ nội dung cũ trong khung soạn thảo.
3. Mở file [`firestore.rules`](./firestore.rules) đã tạo sẵn trong mã nguồn của bạn, copy toàn bộ nội dung và dán vào tab Rules của Firebase Console.
4. Bấm **Publish** để áp dụng.

> [!NOTE]
> File `firestore.rules` kiểm soát chặt chẽ:
> - Quyền admin lấy từ trường `role` trong `users/{uid}` (người dùng không tự đặt được `role`/`status`).
> - Hồ sơ người dùng (SĐT, sổ địa chỉ) chỉ chính chủ và admin đọc được.
> - Người bán không tự gỡ được lệnh ẩn/từ chối tin của admin; người mua chỉ được cập nhật các trường tồn kho khi đặt/hủy đơn.
> - Đơn hàng, hội thoại, khiếu nại chỉ các bên liên quan và admin đọc được; mỗi đơn chỉ có 1 đánh giá.

### BƯỚC 4b: TẠO TÀI KHOẢN QUẢN TRỊ VIÊN THẬT (BẮT BUỘC)

Ở chế độ Firebase thật, các tài khoản demo (`admin@remarket.vn`, ...) **bị vô hiệu hóa** để không ai đăng nhập được bằng mật khẩu bất kỳ. Tạo admin như sau:

1. Mở app, **Đăng ký** một tài khoản bình thường (ví dụ email quản trị của nhóm).
2. Vào Firebase Console > **Firestore Database** > collection `users` > mở document có email đó.
3. Sửa trường `role` từ `buyer_seller` thành `admin` > **Update** (Console không bị security rules chặn).
4. Đăng xuất rồi đăng nhập lại trong app: mục **Bảng điều khiển Quản trị** sẽ xuất hiện ở tab Tài khoản.

---

### BƯỚC 5: FIREBASE CLOUD STORAGE (TÙY CHỌN - CÓ THỂ BỎ QUA HOÀN TOÀN)

> [!TIP]
> **BẠN CÓ THỂ BỎ QUA BƯỚC NÀY NẾU KHÔNG CÓ THẺ VISA/MASTERCARD!**
> - Google Firebase gần đây yêu cầu nâng cấp gói Blaze (cần thẻ tín dụng) khi tạo mới Storage Bucket.
> - **Ứng dụng ReMarket HOÀN TOÀN KHÔNG BẮT BUỘC Cloud Storage.** Nếu không có Storage, ảnh sản phẩm/ảnh đại diện được tự động thu nhỏ (~640px, ~40-80 KB/ảnh) và lưu kèm trong Firestore để mọi thiết bị đều xem được. Có Storage thì ảnh được tải lên Storage với chất lượng gốc.
> - **Firebase Authentication** và **Cloud Firestore Database** (Bước 2, 3, 4) là **hoàn toàn MIỄN PHÍ 100% (Spark Plan)** và KHÔNG bao giờ yêu cầu thẻ tín dụng!
> 👉 **Hãy bấm nút `X` để đóng popup đòi tài khoản Billing lại và chuyển ngay sang BƯỚC 6.**

*(Nếu bạn đã có sẵn thẻ tín dụng hoặc tài khoản Google Cloud Billing, bạn có thể bấm Create a Cloud Billing account để kích hoạt Storage theo các bước dưới; nếu không, hãy bỏ qua và sang thẳng Bước 6)*.
1. Tại menu bên trái, chọn **Build** > **Storage** > Bấm **Get started**.
2. Chọn vị trí lưu trữ (Storage location): giữ nguyên cùng vùng với Firestore (`asia-southeast1`).
3. Bấm **Done**.
4. Chuyển sang tab **Rules** của Storage:
   - Mở file [`storage.rules`](./storage.rules) trong mã nguồn dự án.
   - Copy toàn bộ nội dung dán vào tab Rules của Storage.
   - Bấm **Publish**.

---

### BƯỚC 6: LẤY THÔNG SỐ CẤU HÌNH WEB APP & TẠO FILE `.env`

1. Tại Firebase Console, bấm vào biểu tượng ⚙️ (Cài đặt) góc trên bên trái > Chọn **Project settings**.
2. Cuộn xuống phần **Your apps** > Bấm vào biểu tượng Web `</>`.
3. Nhập App nickname: `ReMarket Web App` > Bấm **Register app**.
4. Firebase sẽ hiển thị đoạn mã `firebaseConfig` dạng:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyB...",
     authDomain: "remarket-c2c.firebaseapp.com",
     projectId: "remarket-c2c",
     storageBucket: "remarket-c2c.appspot.com",
     messagingSenderId: "123456789...",
     appId: "1:123456789:web:abcdef..."
   };
   ```
5. Quay trở lại thư mục mã nguồn ứng dụng:
   - Tạo một file mới tên là `.env` (ngang hàng với `package.json`).
   - Copy nội dung từ file mẫu [`.env.example`](./.env.example) sang `.env`.
   - Điền các giá trị bạn vừa lấy ở trên vào:

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=remarket-c2c.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=remarket-c2c
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=remarket-c2c.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...

   # Chỉ dùng cho lệnh npm run db:seed (không được nhúng vào app)
   SEED_ADMIN_EMAIL=email-admin-cua-ban@example.com
   SEED_ADMIN_PASSWORD=mat-khau-admin
   ```

> [!WARNING]
> Mọi biến `EXPO_PUBLIC_*` được **nhúng vào file APK** và có thể bị trích xuất. Hãy giới hạn Gemini API key trong Google Cloud Console > APIs & Services > Credentials: chọn key > *Application restrictions* = **Android apps**, thêm package `vn.remarket.app` + SHA-1 chứng chỉ ký (xem bằng `npx eas-cli credentials`), và *API restrictions* = chỉ **Generative Language API**.

---

### BƯỚC 7: NẠP DỮ LIỆU MẪU LÊN CLOUD FIRESTORE (SEEDING)

Cần làm xong **Bước 4b** (có tài khoản admin thật) và điền `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` vào `.env`. Mở Terminal tại thư mục dự án và chạy:
```bash
npm run db:seed                              # chỉ nạp danh mục
npm run db:seed -- --with-sample-products    # thêm sản phẩm trưng bày
```

**Kịch bản sẽ tự động:**
1. Đọc file `.env`, đăng nhập bằng tài khoản admin và kết nối đến Firestore của bạn.
2. Nạp **4 Danh mục sản phẩm** kèm Schema tiêu chuẩn kiểm định tình trạng từng ngành (`categories`).
3. (Tùy chọn) Nạp **sản phẩm đồ cũ mẫu** vào `products`. Lưu ý: người bán của các sản phẩm này là tài khoản demo không đăng nhập được, nên đơn đặt vào chúng sẽ không ai xác nhận - chỉ nên dùng để trưng bày.

Khi chạy xong, bạn quay lại tab **Firestore Database** trên Firebase Console và F5 tải lại trang: **toàn bộ dữ liệu sẽ xuất hiện trực quan trên đám mây!**

---

## 3. CƠ CHẾ KẾT NỐI KÉP THÔNG MINH (DUAL-MODE RESILIENT ARCHITECTURE)

Trong mã nguồn [`src/config/firebase.js`](./src/config/firebase.js):
- **Khi đã cấu hình `.env`:** Ứng dụng tự động bật cờ `isLiveFirebase = true`, kết nối trực tiếp tới cơ sở dữ liệu đám mây của bạn (người dùng đăng ký mới sẽ được lưu trực tiếp vào Firebase Auth và Firestore).
- **Khi chưa cấu hình `.env` hoặc chạy test:** Ứng dụng chạy chế độ demo ngoại tuyến (Memory Store + `AsyncStorage`) với 3 tài khoản demo và trả lời chat mô phỏng (có gắn nhãn). Ở chế độ Firebase thật, tài khoản demo và chat mô phỏng đều bị tắt.

---

## 4. BUILD FILE APK (EAS BUILD)

1. Đăng nhập Expo: `npx eas-cli@latest login`.
2. Lần đầu: `npx eas-cli@latest init` để gắn dự án với tài khoản Expo (thêm `extra.eas.projectId` vào `app.json`).
3. Build APK: `npx eas-cli@latest build -p android --profile preview` (hoặc `--profile production`). Cả hai profile trong [`eas.json`](./eas.json) đều xuất **APK**.
4. File [`.easignore`](./.easignore) cho phép EAS đọc `.env` khi build (nếu thiếu, APK sẽ âm thầm chạy chế độ demo). Thay vì vậy bạn có thể khai báo biến bằng `npx eas-cli env:create` rồi xóa dòng `.env` khỏi cách làm này.
5. Mỗi lần phát hành bản mới: tăng `expo.version` và `android.versionCode` trong `app.json`.

---

## 5. BẢNG TỔNG HỢP CÁC LỆNH HỖ TRỢ DATABASE

| Lệnh Terminal | Tác dụng |
| :--- | :--- |
| `npm run db:seed` | Nạp danh mục (và sản phẩm mẫu nếu thêm `-- --with-sample-products`) lên Cloud Firestore bằng tài khoản admin. |
| `npm test` | Chạy toàn bộ bộ kiểm thử tự động (trừ kho, máy trạng thái đơn hàng, thanh toán, ví, đánh giá, khiếu nại, chat, AI). |
| `npx expo start -c` | Khởi động ứng dụng di động ReMarket (xóa cache để nạp biến môi trường `.env` mới nhất). |
