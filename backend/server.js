const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
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
app.use(cors());
app.use(express.json());

// --- KHỞI ĐỘNG DỊCH VỤ ---
connectDB();
initBlockchain();

// --- CÁC API ENDPOINTS ---

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/create_product", async (req, res) => {
  try {
    const p = req.body;

    if (await Product.findOne({ uid: p.uid })) {
      return res.json({ status: "error", message: "Mã ID này đã tồn tại!" });
    }

    const txHash = await createOnChain(
      p.uid,
      p.name,
      p.batch_number,
      p.expiry_date_unix,
    );
    const clientURL = p.qr_url || `http://localhost:5173?uid=${p.uid}`;
    const qrBase64 = await QRCode.toDataURL(clientURL);

    const newProduct = new Product({
      uid: p.uid,
      name: p.name,
      category: p.category || "Sữa Tươi",
      batch_number: p.batch_number,
      expiry_date: new Date(p.expiry_date_unix * 1000).toLocaleDateString(
        "vi-VN",
      ),
      expiry_unix: p.expiry_date_unix,
      created_at: new Date().toLocaleDateString("vi-VN"),
      tx_hash: txHash,
      qr_image: qrBase64,
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

app.post("/create_products_bulk", async (req, res) => {
  try {
    const products = req.body.products;
    const results = [];

    for (const p of products) {
      try {
        if (await Product.findOne({ uid: p.uid })) {
          results.push({ uid: p.uid, status: "skip", message: "Đã tồn tại" });
          continue;
        }

        const txHash = await createOnChain(
          p.uid,
          p.name,
          p.batch_number,
          p.expiry_date_unix,
        );
        const clientURL = `http://localhost:5173?uid=${p.uid}`;
        const qrBase64 = await QRCode.toDataURL(clientURL);

        const newProduct = new Product({
          uid: p.uid,
          name: p.name,
          category: p.category || "Sữa Tươi",
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
      } catch (err) {
        console.error(`❌ Lỗi ${p.uid}:`, err.message);
      }
    }
    res.json({ status: "success", results: results });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.get("/verify/:uid", async (req, res) => {
  try {
    const query = req.params.uid;
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
        scan_count: p.scan_count, // [MỚI] Trả về số lần quét
        source: "Database",
      });
    }

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

    res.json({ is_valid: false });
  } catch (e) {
    res.status(500).json({ is_valid: false });
  }
});

app.post("/record_scan", async (req, res) => {
  try {
    const { uid, location, status, action_type, username } = req.body;

    if (status !== "invalid") {
      await Product.updateOne({ uid: uid }, { $inc: { scan_count: 1 } });
    }
    const now = new Date();

    await History.create({
      uid: uid,
      username: username || "Khách",
      location: location || "Không xác định",
      time: now.toLocaleString("vi-VN"),
      status: status || "valid",
      action_type: action_type || "view",
    });
    res.json({ status: "success" });
  } catch (e) {
    res.json({ status: "error" });
  }
});

app.get("/scan_history", async (req, res) => {
  try {
    const data = await History.find().sort({ timestamp: -1 }).limit(50);
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

app.get("/user_history/:username", async (req, res) => {
  try {
    const data = await History.find({ username: req.params.username }).sort({
      timestamp: -1,
    });
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

app.post("/ask_ai", async (req, res) => {
  const { product_name, question } = req.body;
  const ans = await getAnswer(product_name, question);
  res.json({ answer: ans });
});

app.post("/register", async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body;
    const exists = await User.findOne({ username });
    if (exists)
      return res.json({
        status: "error",
        message: "Tên đăng nhập đã tồn tại!",
      });

    const hashedPassword = await bcrypt.hash(password, 10);
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
          email: user.email,
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

app.post("/update_profile", async (req, res) => {
  try {
    const { username, fullname, email, newPassword } = req.body;
    const user = await User.findOne({ username });

    if (!user)
      return res.json({
        status: "error",
        message: "Không tìm thấy người dùng!",
      });

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (newPassword && newPassword.trim() !== "") {
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({
      status: "success",
      message: "Cập nhật thành công!",
      user: {
        id: user._id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    res.json({ status: "error", message: e.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    res.json(users);
  } catch (e) {
    res.json([]);
  }
});

app.get("/clear_database", async (req, res) => {
  try {
    await Product.deleteMany({});
    await History.deleteMany({});
    res.send(
      "<h1>✅ Đã xóa sạch Database! Giờ bạn có thể Import lại từ đầu.</h1>",
    );
  } catch (e) {
    res.status(500).send("Lỗi: " + e.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server Node.js đang chạy tại: http://localhost:${PORT}`);
});
