const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs"); // [MỚI] Import bcryptjs
const QRCode = require("qrcode"); // Thư viện tạo mã QR
const connectDB = require("./database");
const { Product, History, User } = require("./models");
const {
  initBlockchain,
  createOnChain,
  verifyOnChain,
} = require("./blockchain");
const { getAnswer } = require("./ai_module");

const app = express();
const PORT = 8000;

// --- MIDDLEWARE ---
app.use(cors()); // Cho phép Frontend (React) gọi API
app.use(express.json()); // Cho phép đọc dữ liệu JSON từ body request

// --- KHỞI ĐỘNG DỊCH VỤ ---
connectDB(); // Kết nối MongoDB
initBlockchain(); // Kết nối Ganache

// --- CÁC API ENDPOINTS ---

// 1. Lấy danh sách sản phẩm (Cho cả Admin và User)
app.get("/products", async (req, res) => {
  try {
    // Lấy tất cả, sắp xếp mới nhất lên đầu (-1)
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. Tạo sản phẩm mới (Dành cho Admin)
app.post("/create_product", async (req, res) => {
  try {
    const p = req.body;

    // Kiểm tra trùng mã ID
    if (await Product.findOne({ uid: p.uid })) {
      return res.json({ status: "error", message: "Mã ID này đã tồn tại!" });
    }

    // A. Ghi lên Blockchain (Lấy Hash giao dịch)
    const txHash = await createOnChain(
      p.uid,
      p.name,
      p.batch_number,
      p.expiry_date_unix,
    );

    // B. Tạo mã QR (Dạng Base64 ảnh)
    // Link này trỏ về Frontend để khi quét sẽ mở trang web lên
    const clientURL = p.qr_url || `http://localhost:5173?uid=${p.uid}`;
    const qrBase64 = await QRCode.toDataURL(clientURL);

    // C. Lưu vào MongoDB (Lưu chi tiết)
    const newProduct = new Product({
      uid: p.uid,
      name: p.name,
      category: p.category || "Sữa Tươi", // [MỚI] Lưu loại sản phẩm
      batch_number: p.batch_number,
      expiry_date: new Date(p.expiry_date_unix * 1000).toLocaleDateString(
        "vi-VN",
      ),
      expiry_unix: p.expiry_date_unix,
      created_at: new Date().toLocaleDateString("vi-VN"),

      tx_hash: txHash,
      qr_image: qrBase64,

      // Dùng ảnh mặc định nếu không nhập
      product_image:
        p.product_image ||
        "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg",
      description:
        p.description ||
        "Sản phẩm sữa tươi tiệt trùng, giàu dinh dưỡng, tốt cho sức khỏe.",
    });

    await newProduct.save();
    res.json({ status: "success", tx_hash: txHash });
  } catch (e) {
    console.error("Create Error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
});

// [MỚI] API Nhập hàng loạt từ CSV
app.post("/create_products_bulk", async (req, res) => {
  try {
    const products = req.body.products;
    console.log(`📦 Đang xử lý nhập hàng loạt: ${products.length} sản phẩm...`);
    const results = [];

    for (const p of products) {
      try {
        if (await Product.findOne({ uid: p.uid })) {
          results.push({ uid: p.uid, status: "skip", message: "Đã tồn tại" });
          continue;
        }

        // Ghi Blockchain
        const txHash = await createOnChain(
          p.uid,
          p.name,
          p.batch_number,
          p.expiry_date_unix,
        );

        // Tạo QR
        const clientURL = `http://localhost:5173?uid=${p.uid}`;
        const qrBase64 = await QRCode.toDataURL(clientURL);

        // Lưu DB
        const newProduct = new Product({
          uid: p.uid,
          name: p.name,
          category: p.category || "Sữa Tươi", // Nhận category từ file CSV
          batch_number: p.batch_number,
          expiry_date:
            p.expiry_date ||
            new Date(p.expiry_date_unix * 1000).toLocaleDateString("vi-VN"),
          expiry_unix: p.expiry_date_unix,
          created_at: new Date().toLocaleDateString("vi-VN"),
          tx_hash: txHash,
          qr_image: qrBase64,
          product_image: p.product_image,
          description: p.description,
        });

        await newProduct.save();
        results.push({ uid: p.uid, status: "success" });
        console.log(`✅ Đã nhập: ${p.uid}`);
      } catch (err) {
        console.error(`❌ Lỗi ${p.uid}:`, err.message);
      }
    }
    res.json({ status: "success", results: results });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

// 3. Xác thực sản phẩm (Dành cho User khi quét mã hoặc nhập tên)
app.get("/verify/:uid", async (req, res) => {
  try {
    const query = req.params.uid; // Người dùng có thể gửi mã UID hoặc Tên sản phẩm

    // Bước 1: Tìm trong Database
    // Logic: Tìm UID chính xác HOẶC Tên sản phẩm có chứa từ khóa (không phân biệt hoa thường)
    const p = await Product.findOne({
      $or: [{ uid: query }, { name: { $regex: query, $options: "i" } }],
    });

    if (p) {
      return res.json({
        is_valid: true,
        uid: p.uid,
        name: p.name,
        category: p.category,
        batch_number: p.batch_number,
        expiry_date: p.expiry_date,
        product_image: p.product_image,
        description: p.description,
        tx_hash: p.tx_hash,
        source: "Database",
      });
    }

    // Bước 2: Nếu không thấy trong DB, thử tìm trên Blockchain (chỉ hỗ trợ UID)
    const bcData = await verifyOnChain(query);
    if (bcData) {
      return res.json({
        is_valid: true,
        uid: query,
        name: bcData.name,
        batch_number: bcData.batch_number,
        expiry_date: new Date(bcData.expiry_unix * 1000).toLocaleDateString(
          "vi-VN",
        ),
        product_image: "https://via.placeholder.com/300?text=No+Image",
        description: "Dữ liệu được khôi phục từ Blockchain.",
        source: "Blockchain",
      });
    }

    // Không tìm thấy
    res.json({ is_valid: false });
  } catch (e) {
    res.status(500).json({ is_valid: false });
  }
});

// 4. Ghi nhận lượt quét (Thống kê)
app.post("/record_scan", async (req, res) => {
  try {
    // [MỚI] Lấy thêm action_type và username từ req.body
    const { uid, location, status, action_type, username } = req.body;

    if (status !== "invalid") {
      await Product.updateOne({ uid: uid }, { $inc: { scan_count: 1 } });
    }
    const now = new Date();

    await History.create({
      uid: uid,
      username: username || "Khách", // [MỚI] Lưu tên user quét mã
      location: location || "Không xác định",
      time: now.toLocaleString("vi-VN"),
      status: status || "valid",
      action_type: action_type || "view", // [MỚI] Lưu loại hành động
    });
    res.json({ status: "success" });
  } catch (e) {
    res.json({ status: "error" });
  }
});

// 5. Lấy lịch sử quét (Cho Admin xem)
app.get("/scan_history", async (req, res) => {
  try {
    const data = await History.find().sort({ timestamp: -1 }).limit(50);
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

// [MỚI] 5b. Thêm API lấy lịch sử cá nhân cho User
app.get("/user_history/:username", async (req, res) => {
  try {
    // Tìm lịch sử khớp với username, sắp xếp mới nhất lên đầu
    const data = await History.find({ username: req.params.username }).sort({
      timestamp: -1,
    });
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

// 6. Hỏi đáp AI
app.post("/ask_ai", async (req, res) => {
  const { product_name, question } = req.body;
  const ans = await getAnswer(product_name, question);
  res.json({ answer: ans });
});

// 7. Đăng ký tài khoản
app.post("/register", async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body;

    // Check trùng
    const exists = await User.findOne({ username });
    if (exists)
      return res.json({
        status: "error",
        message: "Tên đăng nhập đã tồn tại!",
      });

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
      role: "user",
    });
    await newUser.save();

    res.json({ status: "success", message: "Đăng ký thành công!" });
  } catch (e) {
    res.json({ status: "error", message: e.message });
  }
});

// 8. Đăng nhập
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        status: "success",
        user: {
          id: user._id,
          username: user.username,
          fullname: user.fullname,
          role: user.role,
        },
      });
    } else {
      res.json({ status: "error", message: "Sai tài khoản hoặc mật khẩu!" });
    }
  } catch (e) {
    res.json({ status: "error", message: "Lỗi Server" });
  }
});

// 9. Lấy danh sách người dùng (Cho Admin)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    res.json(users);
  } catch (e) {
    res.json([]);
  }
});

// [THÊM API NÀY] Dùng để Reset dữ liệu khi cần
app.get("/clear_database", async (req, res) => {
  try {
    // Xóa sạch Sản phẩm và Lịch sử quét
    await Product.deleteMany({});
    await History.deleteMany({});

    console.log("⚠️ Đã xóa sạch dữ liệu trong Database!");
    res.send(
      "<h1>✅ Đã xóa sạch Database! Giờ bạn có thể Import lại từ đầu.</h1>",
    );
  } catch (e) {
    res.status(500).send("Lỗi: " + e.message);
  }
});

// Chạy Server
app.listen(PORT, () => {
  console.log(`🚀 Server Node.js đang chạy tại: http://localhost:${PORT}`);
});
