const mongoose = require("mongoose");

// 1. Schema Sản Phẩm (Lưu thông tin chi tiết)
const productSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Mã định danh duy nhất (VD: MF_001)
  name: String, // Tên sản phẩm
  batch_number: String, // Số lô sản xuất
  expiry_date: String, // Hạn sử dụng (hiển thị)
  expiry_unix: Number, // Hạn sử dụng (số giây, dùng để so sánh logic)
  created_at: String, // Ngày tạo

  // [MỚI] Thêm phân loại
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

  // Dữ liệu Blockchain & Xác thực
  tx_hash: String, // Mã giao dịch (Transaction Hash) lưu trên Blockchain

  // Dữ liệu hiển thị (Lưu ở DB cho nhẹ, không lưu lên Blockchain)
  qr_image: String, // Ảnh QR Code (dạng chuỗi Base64)
  product_image: String, // Link ảnh sản phẩm online
  description: String, // Mô tả chi tiết sản phẩm

  scan_count: { type: Number, default: 0 }, // Đếm số lượt quét
});

// 2. Schema Lịch Sử Quét (Lưu vết người dùng)
const historySchema = new mongoose.Schema({
  uid: String,
  location: String,
  time: String,
  status: { type: String, enum: ["valid", "invalid"], default: "valid" },
  // [MỚI] Thêm trường này để phân loại
  action_type: { type: String, enum: ["scan", "view"], default: "view" },
  timestamp: { type: Date, default: Date.now },
});

// 3. Schema Người dùng (Khách hàng & Admin)
const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: String,
  password: { type: String, required: true }, // Trong thực tế nên mã hóa (bcrypt), ở đây làm demo lưu plain text
  role: { type: String, default: "user" }, // 'user' hoặc 'admin'
  created_at: { type: Date, default: Date.now },
});

module.exports = {
  Product: mongoose.model("Product", productSchema),
  History: mongoose.model("ScanHistory", historySchema),
  User: mongoose.model("User", userSchema),
};
