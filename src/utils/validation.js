import { z } from 'zod';
import { parseCurrencyInput } from './currency.js';

// Vietnamese mobile number: 0 / 84 / +84 then 3,5,7,8,9 and 8 digits (spaces, dots, dashes ignored)
const VN_PHONE_REGEX = /^(?:\+?84|0)[35789]\d{8}$/;
export const normalizePhone = (value) => String(value || '').replace(/[\s.-]/g, '');
export const isValidVietnamesePhone = (value) => VN_PHONE_REGEX.test(normalizePhone(value));

// Authentication Validation Schemas
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập email' })
    .trim()
    .email('Định dạng email không hợp lệ'),
  password: z
    .string({ required_error: 'Vui lòng nhập mật khẩu' })
    .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
});

export const registerSchema = z
  .object({
    displayName: z
      .string({ required_error: 'Vui lòng nhập họ và tên' })
      .trim()
      .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z
      .string({ required_error: 'Vui lòng nhập email' })
      .trim()
      .email('Định dạng email không hợp lệ'),
    phoneNumber: z
      .string({ required_error: 'Vui lòng nhập số điện thoại' })
      .refine(isValidVietnamesePhone, 'Số điện thoại không hợp lệ tại Việt Nam'),
    password: z
      .string({ required_error: 'Vui lòng nhập mật khẩu' })
      .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
    confirmPassword: z.string({ required_error: 'Vui lòng xác nhận mật khẩu' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

// Address Validation Schema
export const addressSchema = z.object({
  recipientName: z.string().min(2, 'Tên người nhận phải có ít nhất 2 ký tự').trim(),
  phoneNumber: z.string().refine(isValidVietnamesePhone, 'Số điện thoại không hợp lệ'),
  street: z.string().min(3, 'Vui lòng nhập số nhà, tên đường').trim(),
  ward: z.string().min(2, 'Vui lòng chọn hoặc nhập Phường/Xã').trim(),
  district: z.string().min(2, 'Vui lòng chọn hoặc nhập Quận/Huyện').trim(),
  city: z.string().min(2, 'Vui lòng chọn hoặc nhập Tỉnh/Thành phố').trim(),
  isDefault: z.boolean().default(false),
});

// Product Listing Validation Schema
export const productListingSchema = z.object({
  name: z.string().min(5, 'Tiêu đề sản phẩm phải có ít nhất 5 ký tự').max(120, 'Tiêu đề không được vượt quá 120 ký tự').trim(),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục phù hợp'),
  subCategoryId: z.string().optional().nullable(),
  description: z.string().min(20, 'Mô tả chi tiết phải có ít nhất 20 ký tự').max(3000, 'Mô tả không được vượt quá 3000 ký tự').trim(),
  price: z.number().positive('Giá bán phải lớn hơn 0 đồng').min(1000, 'Giá bán tối thiểu là 1.000 đ'),
  originalPrice: z.number().nonnegative().optional().nullable(),
  stockQuantity: z.number().int().min(1, 'Số lượng tối thiểu là 1').max(999, 'Số lượng tối đa là 999'),
  overallCondition: z.enum(['Like New', 'Very Good', 'Good', 'Acceptable', 'Needs Repair'], {
    errorMap: () => ({ message: 'Vui lòng đánh giá tình trạng tổng thể' }),
  }),
  knownDefects: z.array(z.string()).optional(),
  city: z.string().min(2, 'Vui lòng chọn địa điểm bán'),
});

// Review Validation Schema
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Vui lòng chọn ít nhất 1 sao').max(5),
  comment: z.string().min(10, 'Nhận xét phải có ít nhất 10 ký tự').max(500).trim(),
});

// Report / Dispute Validation Schema
export const disputeSchema = z.object({
  reason: z.string().min(3, 'Vui lòng chọn hoặc nhập lý do'),
  explanation: z.string().min(15, 'Vui lòng giải thích chi tiết ít nhất 15 ký tự').trim(),
});

// --- Rigorous Single-Field Validators for Real-time Feedback & Validation ---

export const validateProductName = (name) => {
  const text = String(name || '').trim();
  if (!text) return 'Vui lòng nhập tiêu đề sản phẩm.';
  if (text.length < 5) return `Tiêu đề quá ngắn (tối thiểu 5 ký tự, hiện có ${text.length}).`;
  if (text.length > 120) return `Tiêu đề quá dài (tối đa 120 ký tự, hiện có ${text.length}).`;
  if (/^[^a-zA-Z0-9\u00C0-\u1EF9]+$/.test(text)) {
    return 'Tiêu đề phải chứa các ký tự chữ hoặc số hợp lệ.';
  }
  return null;
};

export const validatePrice = (priceVal) => {
  if (priceVal === '' || priceVal === undefined || priceVal === null) {
    return 'Vui lòng nhập giá bán.';
  }
  const num = typeof priceVal === 'number' ? priceVal : parseCurrencyInput(priceVal);
  if (num === null || num === undefined || isNaN(num) || num <= 0) {
    return 'Vui lòng nhập giá bán hợp lệ (> 0 đồng).';
  }
  if (num < 1000) {
    return 'Giá bán tối thiểu là 1.000 đ.';
  }
  if (num > 10000000000) {
    return 'Giá bán vượt quá giới hạn tối đa cho phép (10 tỷ đ).';
  }
  return null;
};

export const validateOriginalPrice = (origVal, sellVal) => {
  if (!origVal) return null; // original price is optional
  const origNum = typeof origVal === 'number' ? origVal : parseCurrencyInput(origVal);
  if (origNum === null || origNum === undefined || isNaN(origNum)) {
    return 'Giá mua mới không đúng định dạng số.';
  }
  if (origNum < 0) {
    return 'Giá mua mới không được là số âm.';
  }
  const sellNum = typeof sellVal === 'number' ? sellVal : parseCurrencyInput(sellVal);
  if (sellNum && origNum > 0 && origNum < sellNum) {
    return 'Giá mua mới (lúc mua mới) phải lớn hơn hoặc bằng giá thanh lý đồ cũ.';
  }
  return null;
};

export const validateStockQuantity = (stockVal) => {
  if (stockVal === '' || stockVal === undefined || stockVal === null) {
    return 'Vui lòng nhập số lượng.';
  }
  const num = Number(stockVal);
  if (isNaN(num) || !Number.isInteger(num)) {
    return 'Số lượng phải là một số nguyên hợp lệ.';
  }
  if (num < 1) {
    return 'Số lượng tồn kho phải từ 1 trở lên.';
  }
  if (num > 999) {
    return 'Số lượng đăng bán tối đa là 999 sản phẩm.';
  }
  return null;
};

export const validateDescription = (desc) => {
  const text = String(desc || '').trim();
  if (!text) return 'Vui lòng nhập mô tả chi tiết sản phẩm.';
  if (text.length < 20) {
    return `Mô tả cần tối thiểu 20 ký tự để mô tả trung thực tình trạng (hiện có ${text.length}).`;
  }
  if (text.length > 3000) {
    return `Mô tả vượt quá giới hạn cho phép (tối đa 3000 ký tự, hiện có ${text.length}).`;
  }
  return null;
};

export const validateBatteryHealth = (val) => {
  if (val === undefined || val === null || val === '') return null; // optional
  const num = Number(val);
  if (isNaN(num)) return 'Dung lượng pin phải là số nguyên.';
  if (num < 1 || num > 100) return 'Dung lượng pin hợp lệ từ 1% đến 100%.';
  return null;
};

export const validateDefectItem = (text, existingDefects = []) => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 'Vui lòng nhập nội dung mô tả lỗi hoặc vết xước.';
  if (trimmed.length < 3) return 'Mô tả vết xước cần ít nhất 3 ký tự.';
  if (trimmed.length > 200) return 'Mô tả vết xước không được vượt quá 200 ký tự.';
  if (existingDefects.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
    return 'Lỗi này đã được thêm vào danh sách.';
  }
  return null;
};

export const validateAddressField = (fieldName, value) => {
  const text = String(value || '').trim();
  switch (fieldName) {
    case 'city':
      if (!text) return 'Vui lòng chọn hoặc nhập Tỉnh/Thành phố.';
      if (text.length < 2) return 'Tên Tỉnh/Thành phố quá ngắn.';
      break;
    case 'district':
      if (!text) return 'Vui lòng chọn hoặc nhập Quận/Huyện.';
      if (text.length < 2) return 'Tên Quận/Huyện quá ngắn.';
      break;
    case 'streetAddress':
      if (!text) return 'Vui lòng nhập số nhà, tên đường để người mua định vị.';
      if (text.length < 3) return 'Địa chỉ số nhà, tên đường cần ít nhất 3 ký tự.';
      break;
  }
  return null;
};

// Comprehensive Listing Form Validator
export const validateFullProductListing = ({
  form,
  images = [],
  selectedCategory,
  activeSchema = [],
  conditionData = {},
}) => {
  const errors = {};

  // 1. Images
  if (!images || images.length === 0) {
    errors.images = 'Vui lòng chụp hoặc chọn ít nhất 1 ảnh thực tế của món đồ.';
  } else if (images.length > 5) {
    errors.images = 'Tối đa chỉ được tải lên 5 ảnh sản phẩm.';
  }

  // 2. Title
  const nameError = validateProductName(form.name);
  if (nameError) errors.name = nameError;

  // 3. Category & SubCategory
  if (!form.categoryId || !selectedCategory) {
    errors.categoryId = 'Vui lòng chọn danh mục sản phẩm ở mục 2.';
  } else if (
    selectedCategory.subCategories &&
    selectedCategory.subCategories.length > 0 &&
    !form.subCategoryId
  ) {
    errors.subCategoryId = 'Vui lòng chọn món đồ của bạn thuộc loại nào (mục Khai báo tình trạng).';
  }

  // 4. Price & Original Price
  const priceError = validatePrice(form.price);
  if (priceError) errors.price = priceError;

  const origPriceError = validateOriginalPrice(form.originalPrice, form.price);
  if (origPriceError) errors.originalPrice = origPriceError;

  // 5. Stock Quantity
  const stockError = validateStockQuantity(form.stockQuantity);
  if (stockError) errors.stockQuantity = stockError;

  // 6. Description
  const descError = validateDescription(form.description);
  if (descError) errors.description = descError;

  // 7. Overall Condition
  if (!form.overallCondition) {
    errors.overallCondition = 'Vui lòng chọn đánh giá độ mới tổng thể.';
  }

  // 8. Dynamic Condition Fields
  if (Array.isArray(activeSchema)) {
    activeSchema.forEach((field) => {
      const v = conditionData[field.fieldKey];
      if (field.required) {
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
          errors[field.fieldKey] = `Vui lòng chọn "${field.label}".`;
        }
      }
      if (field.type === 'number' && v !== undefined && v !== null && v !== '') {
        const num = Number(v);
        if (!Number.isInteger(num)) {
          errors[field.fieldKey] = `"${field.label}" phải là số nguyên.`;
        } else if (field.min !== undefined && num < field.min) {
          errors[field.fieldKey] = `"${field.label}" tối thiểu là ${field.min}${field.unit ? ` ${field.unit}` : ''}.`;
        } else if (field.max !== undefined && num > field.max) {
          errors[field.fieldKey] = `"${field.label}" tối đa là ${field.max}${field.unit ? ` ${field.unit}` : ''}.`;
        }
        if (field.fieldKey === 'batteryHealth' && !errors[field.fieldKey]) {
          const battErr = validateBatteryHealth(v);
          if (battErr) errors[field.fieldKey] = battErr;
        }
      }
    });
  }

  // 9. Location
  const cityErr = validateAddressField('city', form.city);
  if (cityErr) errors.city = cityErr;

  const distErr = validateAddressField('district', form.district);
  if (distErr) errors.district = distErr;

  const streetErr = validateAddressField('streetAddress', form.streetAddress);
  if (streetErr) errors.streetAddress = streetErr;

  const errorKeys = Object.keys(errors);
  const isValid = errorKeys.length === 0;
  const firstError = isValid ? null : errors[errorKeys[0]];

  return { isValid, errors, firstError };
};
