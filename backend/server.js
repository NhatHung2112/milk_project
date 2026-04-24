const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const path = require("path");
const connectDB = require("./database");
// [CẬP NHẬT] Thêm Batch và Item vào để dùng cấu trúc 3 bảng
const { Product, Batch, Item, History, User } = require("./models");
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
// Cấu hình limit 10mb để cho phép nhận ảnh Base64
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Phục vụ file giao diện Frontend (Thư mục dist)
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// --- KHỞI ĐỘNG DỊCH VỤ ---
connectDB();
initBlockchain();

// --- CÁC API ENDPOINTS ---

app.get("/products", async (req, res) => {
  try {
    // [CẬP NHẬT] Đọc từ bảng Item, sau đó móc nối (populate) ra Batch và Product
    const items = await Item.find()
      .populate({
        path: "batchId",
        populate: { path: "productId" },
      })
      .sort({ _id: -1 });

    // Format lại dữ liệu cho giống hệt cấu trúc cũ để Frontend không bị lỗi
    const formattedProducts = items
      .map((item) => {
        // Đảm bảo không bị crash nếu dữ liệu bị thiếu
        if (!item.batchId || !item.batchId.productId) return null;
        return {
          uid: item.uid,
          name: item.batchId.productId.name,
          category: item.batchId.productId.category,
          batch_number: item.batchId.batch_number,
          expiry_date: item.batchId.expiry_date,
          expiry_unix: item.batchId.expiry_unix,
          tx_hash: item.tx_hash,
          qr_image: item.qr_image,
          product_image: item.batchId.productId.product_image,
          description: item.batchId.productId.description,
          scan_count: item.scan_count,
        };
      })
      .filter((p) => p !== null);

    res.json(formattedProducts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/create_product", async (req, res) => {
  try {
    const p = req.body;

    if (await Item.findOne({ uid: p.uid })) {
      return res.json({ status: "error", message: "Mã ID này đã tồn tại!" });
    }

    // [CẬP NHẬT] Tách làm 3 bước chuẩn hóa CSDL
    // Bước 1: Tìm hoặc tạo Product (Sản phẩm gốc)
    let product = await Product.findOne({ name: p.name });
    if (!product) {
      product = new Product({
        sku: `SKU-${Date.now()}`, // Tạo mã SKU tạm
        name: p.name,
        category: p.category || "Sữa Tươi",
        product_image:
          p.product_image ||
          "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg",
        description:
          p.description ||
          "Sản phẩm sữa tươi tiệt trùng, giàu dinh dưỡng, tốt cho sức khỏe.",
      });
      await product.save();
    }

    // Bước 2: Tìm hoặc tạo Batch (Lô hàng)
    let batch = await Batch.findOne({
      productId: product._id,
      batch_number: p.batch_number,
    });
    if (!batch) {
      batch = new Batch({
        productId: product._id,
        batch_number: p.batch_number,
        expiry_date: new Date(p.expiry_date_unix * 1000).toLocaleDateString(
          "vi-VN",
        ),
        expiry_unix: p.expiry_date_unix,
        price: p.price || 0,
      });
      await batch.save();
    }

    // Bước 3: Đẩy lên Blockchain và tạo Item (Từng hộp sữa)
    const txHash = await createOnChain(
      p.uid,
      p.name,
      p.batch_number,
      p.expiry_date_unix,
    );

    const host = req.get("host");
    const protocol =
      req.protocol === "https" || req.headers["x-forwarded-proto"] === "https"
        ? "https"
        : "http";
    const clientURL = p.qr_url || `${protocol}://${host}/?uid=${p.uid}`;
    const qrBase64 = await QRCode.toDataURL(clientURL);

    const newItem = new Item({
      batchId: batch._id,
      uid: p.uid,
      tx_hash: txHash,
      qr_image: qrBase64,
      scan_count: 0,
    });
    await newItem.save();

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

    const host = req.get("host");
    const protocol =
      req.protocol === "https" || req.headers["x-forwarded-proto"] === "https"
        ? "https"
        : "http";

    for (const p of products) {
      try {
        if (await Item.findOne({ uid: p.uid })) {
          results.push({ uid: p.uid, status: "skip", message: "Đã tồn tại" });
          continue;
        }

        // Bước 1: Product
        let product = await Product.findOne({ name: p.name });
        if (!product) {
          product = new Product({
            sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: p.name,
            category: p.category || "Sữa Tươi",
            product_image: p.product_image,
            description: p.description,
          });
          await product.save();
        }

        // Bước 2: Batch
        let batch = await Batch.findOne({
          productId: product._id,
          batch_number: p.batch_number,
        });
        if (!batch) {
          batch = new Batch({
            productId: product._id,
            batch_number: p.batch_number,
            expiry_date:
              p.expiry_date ||
              new Date(p.expiry_date_unix * 1000).toLocaleDateString("vi-VN"),
            expiry_unix: p.expiry_date_unix,
            price: 0,
          });
          await batch.save();
        }

        // Bước 3: Blockchain & Item
        const txHash = await createOnChain(
          p.uid,
          p.name,
          p.batch_number,
          p.expiry_date_unix,
        );
        const clientURL = `${protocol}://${host}/?uid=${p.uid}`;
        const qrBase64 = await QRCode.toDataURL(clientURL);

        const newItem = new Item({
          batchId: batch._id,
          uid: p.uid,
          tx_hash: txHash,
          qr_image: qrBase64,
        });
        await newItem.save();

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

app.put("/update_product/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;

    // Tìm Item trước
    const item = await Item.findOne({ uid: uid }).populate({
      path: "batchId",
      populate: { path: "productId" },
    });

    if (!item) {
      return res.json({ status: "error", message: "Không tìm thấy sản phẩm!" });
    }

    // Cập nhật Product gốc nếu có thông tin mới
    if (
      updateData.name ||
      updateData.category ||
      updateData.product_image ||
      updateData.description
    ) {
      const product = item.batchId.productId;
      if (updateData.name) product.name = updateData.name;
      if (updateData.category) product.category = updateData.category;
      if (updateData.product_image)
        product.product_image = updateData.product_image;
      if (updateData.description) product.description = updateData.description;
      await product.save();
    }

    // Cập nhật Batch nếu có thông tin mới
    if (
      updateData.batch_number ||
      updateData.expiry_date ||
      updateData.p_date
    ) {
      const batch = item.batchId;
      if (updateData.batch_number) batch.batch_number = updateData.batch_number;
      if (updateData.p_date) {
        // p_date lấy từ form Frontend
        batch.expiry_unix = Math.floor(
          new Date(updateData.p_date).getTime() / 1000,
        );
        batch.expiry_date = new Date(updateData.p_date).toLocaleDateString(
          "vi-VN",
        );
      }
      await batch.save();
    }

    res.json({ status: "success", message: "Cập nhật thành công!" });
  } catch (e) {
    console.error("Update Error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.delete("/delete_product/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const deletedItem = await Item.findOneAndDelete({ uid: uid });
    if (!deletedItem) {
      return res.json({ status: "error", message: "Không tìm thấy sản phẩm!" });
    }
    res.json({ status: "success", message: "Xóa sản phẩm thành công!" });
  } catch (e) {
    console.error("Delete Error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.post("/delete_products_bulk", async (req, res) => {
  try {
    const { uids } = req.body;
    if (!uids || !Array.isArray(uids)) {
      return res.json({ status: "error", message: "Danh sách không hợp lệ!" });
    }
    await Item.deleteMany({ uid: { $in: uids } });
    res.json({ status: "success", message: "Xóa nhiều sản phẩm thành công!" });
  } catch (e) {
    console.error("Delete Bulk Error:", e);
    res.status(500).json({ status: "error", message: e.message });
  }
});

app.get("/verify/:uid", async (req, res) => {
  try {
    const query = req.params.uid;
    // Tìm trong Item thay vì Product
    const item = await Item.findOne({ uid: query }).populate({
      path: "batchId",
      populate: { path: "productId" },
    });

    if (item) {
      return res.json({
        is_valid: true,
        uid: item.uid,
        name: item.batchId.productId.name,
        category: item.batchId.productId.category,
        batch_number: item.batchId.batch_number,
        expiry_date: item.batchId.expiry_date,
        product_image: item.batchId.productId.product_image,
        description: item.batchId.productId.description,
        tx_hash: item.tx_hash,
        scan_count: item.scan_count,
        source: "Database",
      });
    }

    // Nếu không có trong DB thì quét trên Blockchain
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
      await Item.updateOne({ uid: uid }, { $inc: { scan_count: 1 } });
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
  try {
    const { product_id, question } = req.body;

    let dbContext = "";

    if (product_id) {
      // Đọc toàn bộ dữ liệu 3 bảng thông qua populate
      const itemFromDB = await Item.findOne({ uid: product_id }).populate({
        path: "batchId",
        populate: { path: "productId" },
      });

      if (itemFromDB) {
        const cleanData = {
          "Mã hộp sữa (UID)": itemFromDB.uid,
          "Tên sản phẩm": itemFromDB.batchId.productId.name,
          "Thuộc lô số": itemFromDB.batchId.batch_number,
          "Hạn sử dụng": itemFromDB.batchId.expiry_date,
          "Số lần quét QR (Scan count)": itemFromDB.scan_count || 0,
          "Tình trạng Blockchain": itemFromDB.tx_hash
            ? "Đã lưu tx_hash"
            : "Chưa lưu",
        };
        dbContext = `Khách đang tra cứu chi tiết sản phẩm này: ${JSON.stringify(cleanData, null, 2)}`;
      } else {
        dbContext =
          "Khách đang tra cứu một mã sản phẩm không tồn tại trong hệ thống MongoDB.";
      }
    } else {
      // Đọc danh sách mới nhất
      const allItems = await Item.find()
        .populate({
          path: "batchId",
          populate: { path: "productId" },
        })
        .sort({ _id: -1 })
        .limit(10);

      const briefList = allItems.map((item) => ({
        name: item.batchId.productId.name,
        batch: item.batchId.batch_number,
        uid: item.uid,
      }));

      dbContext = `Khách đang hỏi chung chung. Đây là danh sách 10 mã hộp sữa mới nhất: ${JSON.stringify(briefList)}`;
    }

    const ans = await getAnswer(dbContext, question);
    res.json({ answer: ans });
  } catch (error) {
    console.error("Lỗi khi đọc MongoDB cho AI:", error);
    res.status(500).json({
      answer:
        "Xin lỗi, hệ thống AI đang gặp sự cố khi kết nối với Cơ sở dữ liệu. Vui lòng thử lại sau!",
    });
  }
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
    // Dùng lệnh drop() để đập bỏ hoàn toàn cái bảng và xóa luôn "luật Index cũ"
    await Product.collection.drop().catch(() => {});
    await Batch.collection.drop().catch(() => {});
    await Item.collection.drop().catch(() => {});
    await History.collection.drop().catch(() => {});

    res.send(
      "<h1>✅ Đã đập bỏ hoàn toàn Database và các luật lệ cũ! Hệ thống đã sạch sẽ 100%!</h1>",
    );
  } catch (e) {
    res.status(500).send("Lỗi: " + e.message);
  }
});
// [MỚI BỔ SUNG] Đặt ở CÙNG, bắt mọi request (không phải API) để trả về React App
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server Node.js đang chạy tại: http://localhost:${PORT}`);
});
