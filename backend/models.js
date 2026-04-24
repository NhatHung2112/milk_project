const mongoose = require("mongoose");

// ==========================================
// 1. BẢNG SẢN PHẨM GỐC (Products)
// Lưu thông tin cố định, không bao giờ thay đổi dù nhập bao nhiêu lô
// ==========================================
const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true }, // Mã quản lý nội bộ (VD: SUA-TH-1L)
  name: { type: String, required: true }, // Tên sản phẩm (VD: Sữa tươi TH True Milk)
  unit: { type: String, default: "Hộp" }, // Đơn vị tính
  category: {
    type: String,
    default: "Sữa Tươi",
    enum: [
      "Sữa Bột Cho Bé",
      "Sữa Người Lớn",
      "Sữa Tươi",
      "Sữa Hạt",
      "Sữa Chua",
    ],
  },
  product_image: String, // Link ảnh sản phẩm online
  description: String, // Mô tả chi tiết sản phẩm
});

// ==========================================
// 2. BẢNG LÔ HÀNG (Batches)
// Lưu thông tin theo từng đợt nhập hàng, móc nối với bảng Products
// ==========================================
const batchSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  }, // Khóa ngoại liên kết bảng Product
  batch_number: { type: String, required: true }, // Số lô sản xuất (VD: LOT2024_001)
  expiry_date: String, // Hạn sử dụng (hiển thị)
  expiry_unix: Number, // Hạn sử dụng (số giây, dùng để so sánh logic)
  price: Number, // Giá bán theo lô (như thầy gợi ý)
  created_at: { type: Date, default: Date.now }, // Ngày tạo lô
});

// ==========================================
// 3. BẢNG TỪNG HỘP SỮA (Items)
// Lưu từng mã QR, mã Blockchain cụ thể, móc nối với bảng Batches
// ==========================================
const itemSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true,
  }, // Khóa ngoại liên kết bảng Batch
  uid: { type: String, required: true, unique: true }, // Mã định danh duy nhất của 1 hộp (VD: MF_001)
  tx_hash: String, // Mã giao dịch (Transaction Hash) lưu trên Blockchain
  qr_image: String, // Ảnh QR Code (dạng chuỗi Base64)
  scan_count: { type: Number, default: 0 }, // Đếm số lượt quét của hộp này
});

// ==========================================
// 4. BẢNG LỊCH SỬ QUÉT (Giữ nguyên)
// ==========================================
const historySchema = new mongoose.Schema({
  uid: String,
  username: String,
  location: String,
  time: String,
  status: { type: String, enum: ["valid", "invalid"], default: "valid" },
  action_type: { type: String, enum: ["scan", "view"], default: "view" },
  timestamp: { type: Date, default: Date.now },
});

// ==========================================
// 5. BẢNG NGƯỜI DÙNG (Giữ nguyên)
// ==========================================
const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: String,
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  created_at: { type: Date, default: Date.now },
});

module.exports = {
  Product: mongoose.model("Product", productSchema),
  Batch: mongoose.model("Batch", batchSchema),
  Item: mongoose.model("Item", itemSchema),
  History: mongoose.model("ScanHistory", historySchema),
  User: mongoose.model("User", userSchema),
};
