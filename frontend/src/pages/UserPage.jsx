import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  ArrowLeft,
  Search,
  QrCode,
  CheckCircle,
  Package,
  MessageCircle,
  Send,
  Bot,
  User,
} from "lucide-react";

// --- API MOCK (Để chạy độc lập) ---
const API_URL = "http://127.0.0.1:8000";
const api = {
  getProducts: async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      return await res.json();
    } catch (e) {
      return [];
    }
  },
  verifyProduct: async (uid) => {
    try {
      const res = await fetch(`${API_URL}/verify/${uid}`);
      return await res.json();
    } catch (e) {
      return { is_valid: false };
    }
  },
  recordScan: async (uid, location) => {
    try {
      await fetch(`${API_URL}/record_scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, location }),
      });
    } catch (e) {}
  },
  askAI: async (productName, question) => {
    try {
      const res = await fetch(`${API_URL}/ask_ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: productName, question }),
      });
      return await res.json();
    } catch (e) {
      return { answer: "Lỗi kết nối AI" };
    }
  },
};

// --- COMPONENTS CON ---

const ProductCard = ({ product, onClick }) => (
  <div className="col-6 col-md-4 col-lg-3 mb-4">
    <div
      className="card h-100 border-0 shadow-sm text-center p-3"
      onClick={onClick}
      style={{
        cursor: "pointer",
        transition: "all 0.3s ease",
        border: "1px solid #f0f0f0",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.borderColor = "#00bfff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#f0f0f0";
      }}
    >
      <div
        className="d-flex align-items-center justify-content-center mb-3"
        style={{ height: "140px", overflow: "hidden" }}
      >
        <img
          src={product.product_image || "https://placehold.co/400"}
          alt={product.name}
          className="img-fluid"
          style={{ maxHeight: "100%", objectFit: "contain" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg";
          }}
        />
      </div>
      <div className="card-body p-0 d-flex flex-column">
        <h6
          className="card-title fw-bold text-dark text-truncate mb-2"
          title={product.name}
          style={{ fontSize: "0.95rem" }}
        >
          {product.name}
        </h6>
        <div className="mt-auto">
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 mb-2">
            {product.uid}
          </span>
          <small className="d-block text-muted" style={{ fontSize: "0.8rem" }}>
            Lô: {product.batch_number}
          </small>
        </div>
      </div>
    </div>
  </div>
);

// --- [FIXED] QRScanner Component ---
const QRScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Khởi tạo scanner
    // Chú ý: Dùng setTimeout nhỏ để đảm bảo DOM đã render xong div#reader
    const timer = setTimeout(() => {
      if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner("reader", {
          fps: 10,
          qrbox: 250,
          verbose: false,
        });
        scannerRef.current = scanner;

        scanner.render(
          (txt) => {
            // Khi quét thành công, dọn dẹp scanner ngay lập tức để giải phóng camera
            scanner
              .clear()
              .then(() => {
                const uid = txt.includes("uid=") ? txt.split("uid=")[1] : txt;
                onScan(uid);
              })
              .catch((err) => {
                console.error("Lỗi khi tắt camera:", err);
                // Vẫn trả kết quả kể cả khi lỗi clear
                const uid = txt.includes("uid=") ? txt.split("uid=")[1] : txt;
                onScan(uid);
              });
          },
          (err) => {
            // Bỏ qua lỗi quét liên tục
          },
        );
      }
    }, 100);

    // Cleanup function: Chạy khi component bị đóng
    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => {
          console.error("Failed to clear scanner on unmount", err);
        });
        scannerRef.current = null;
      }
    };
  }, []); // <--- Quan trọng: Để mảng rỗng [] để chỉ khởi tạo 1 lần duy nhất

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center"
      style={{ zIndex: 2000 }}
    >
      <div
        className="bg-white p-4 rounded-4"
        style={{ maxWidth: "500px", width: "90%" }}
      >
        <div className="d-flex justify-content-between mb-2">
          <h5>Quét Mã QR</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div id="reader"></div>
      </div>
    </div>
  );
};

const Chatbot = ({ productName }) => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: `Xin chào! Tôi là trợ lý AI. Bạn muốn biết gì về sản phẩm "${productName}"?`,
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    try {
      const data = await api.askAI(productName, userMsg);
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Lỗi kết nối AI." },
      ]);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="card border-0 shadow-sm mt-4 overflow-hidden">
      <div className="card-header bg-primary bg-opacity-10 border-0 py-3">
        <div className="d-flex align-items-center gap-2 text-primary">
          <MessageCircle size={20} />{" "}
          <span className="fw-bold">Trợ Lý Ảo MilkFamily</span>
        </div>
      </div>
      <div
        className="card-body bg-light"
        style={{ height: "300px", overflowY: "auto" }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`d-flex mb-3 ${
              msg.role === "user"
                ? "justify-content-end"
                : "justify-content-start"
            }`}
          >
            <div
              className={`d-flex gap-2 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
              style={{ maxWidth: "80%" }}
            >
              <div
                className={`rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-white text-primary border"
                }`}
                style={{ width: 32, height: 32 }}
              >
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`p-3 rounded-4 shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-0"
                    : "bg-white text-dark border rounded-tl-0"
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="card-footer bg-white p-3 border-0">
        <div className="input-group">
          <input
            type="text"
            className="form-control border-end-0 bg-light"
            placeholder="Đặt câu hỏi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="btn btn-light border border-start-0 text-primary"
            onClick={handleSend}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function UserPage({ onBack }) {
  const [view, setView] = useState("list"); // 'list' or 'detail'
  const [products, setProducts] = useState([]);
  const [detailData, setDetailData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [checkUid, setCheckUid] = useState("");

  const hiddenList = JSON.parse(
    localStorage.getItem("hidden_products") || "[]",
  );

  useEffect(() => {
    api.getProducts().then((data) => {
      setProducts(data.filter((p) => !hiddenList.includes(p.uid)));
    });
  }, []);

  // Sửa hàm handleVerify để nhận thêm tham số 'sourceType'
  const handleVerify = async (uid, sourceType = "view") => {
    const target = uid || checkUid;
    if (!target) return alert("Vui lòng nhập mã sản phẩm!");
    if (hiddenList.includes(target)) return alert("Sản phẩm này đang bị khóa!");

    try {
      const data = await api.verifyProduct(target);
      if (data.is_valid) {
        setDetailData({ ...data, uid: target });
        setView("detail");

        // [QUAN TRỌNG] Gửi loại hành động lên server
        // sourceType sẽ là 'scan' hoặc 'view'
        api.recordScan(target, "Web Client", "valid", sourceType);
      } else {
        alert("⚠️ Không tìm thấy sản phẩm! Vui lòng kiểm tra lại mã.");
        // Ghi nhận lỗi cũng phân loại luôn
        api.recordScan(target, "Web Client", "invalid", sourceType);
      }
    } catch (e) {
      alert("Lỗi kết nối Server!");
    }
  };

  // --- VIEW: DETAIL ---
  if (view === "detail" && detailData) {
    return (
      <div className="container py-4">
        <button
          className="btn btn-light rounded-pill border mb-4 fw-bold px-3"
          onClick={() => setView("list")}
        >
          <ArrowLeft size={18} className="me-2" /> Quay lại tìm kiếm
        </button>

        <div
          className="card border-0 shadow-lg rounded-4 overflow-hidden mx-auto"
          style={{ maxWidth: "1000px" }}
        >
          <div className="row g-0">
            <div className="col-md-5 bg-white p-5 text-center d-flex flex-column align-items-center justify-content-center border-end">
              <img
                src={detailData.product_image || "https://placehold.co/400"}
                className="img-fluid mb-4"
                style={{ maxHeight: "350px", objectFit: "contain" }}
                alt={detailData.name}
                onError={(e) => {
                  e.target.src =
                    "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg";
                }}
              />
              <div className="bg-white p-2 rounded border shadow-sm d-inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${window.location.origin}/?uid=${detailData.uid}`}
                  width="100"
                  alt="QR"
                />
              </div>
              <small className="text-muted mt-2">Mã xác thực sản phẩm</small>
            </div>

            <div className="col-md-7 p-4 p-lg-5 bg-white">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-success bg-opacity-10 text-success fw-bold mb-3 border border-success">
                <CheckCircle size={18} /> SẢN PHẨM CHÍNH HÃNG
              </div>
              <h2 className="fw-bold text-dark mb-2">{detailData.name}</h2>
              <div className="mb-4 text-muted">
                Mã định danh:{" "}
                <span className="fw-bold text-primary">{detailData.uid}</span>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <small
                      className="text-muted fw-bold d-block text-uppercase"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Số Lô Sản Xuất
                    </small>
                    <span className="fs-5 fw-bold text-dark">
                      {detailData.batch_number}
                    </span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <small
                      className="text-muted fw-bold d-block text-uppercase"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Hạn Sử Dụng
                    </small>
                    <span className="fs-5 fw-bold text-danger">
                      {detailData.expiry_date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2">
                  <Package size={18} className="me-2" />
                  Thông tin chi tiết:
                </h6>
                <p className="text-muted small" style={{ lineHeight: "1.6" }}>
                  {detailData.description || "Chưa có thông tin mô tả."}
                </p>
              </div>
              <hr className="my-4" />
              <Chatbot productName={detailData.name} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: LIST ---
  return (
    <div className="container py-4">
      <button
        className="btn btn-light rounded-pill border mb-4 fw-bold px-3"
        onClick={onBack}
      >
        <ArrowLeft size={18} className="me-2" /> Trang Chủ
      </button>

      <div
        className="card border-0 shadow-sm p-4 mx-auto text-center mb-5 rounded-4"
        style={{
          maxWidth: "650px",
          background: "linear-gradient(to bottom right, #ffffff, #f8f9fa)",
        }}
      >
        <h3 className="fw-bold text-primary mb-4">Tra Cứu Nguồn Gốc Sữa</h3>
        <div className="d-flex gap-2 justify-content-center mb-3">
          <div
            className="position-relative flex-grow-1"
            style={{ maxWidth: "350px" }}
          >
            <Search
              className="position-absolute text-muted"
              size={18}
              style={{ left: 15, top: 12 }}
            />
            <input
              className="form-control rounded-pill ps-5 py-2"
              placeholder="Nhập mã sản phẩm (VD: MF_001)..."
              value={checkUid}
              onChange={(e) => setCheckUid(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary rounded-pill px-4 fw-bold"
            style={{ backgroundColor: "#00bfff", border: "none" }}
            onClick={() => handleVerify(checkUid, "view")} // <-- Truyền "view"
          >
            KIỂM TRA
          </button>
        </div>
        <div>
          <span className="text-muted small me-2">Hoặc</span>
          <button
            className="btn btn-dark rounded-pill px-4 py-2 fw-bold"
            onClick={() => setShowScanner(true)}
          >
            <QrCode size={18} className="me-2" /> QUÉT MÃ QR
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="fw-bold text-secondary text-center mb-4 position-relative">
          <span className="bg-light px-3 position-relative z-1">
            Sản Phẩm Hiện Có
          </span>
          <span className="position-absolute top-50 start-0 w-100 border-bottom z-0"></span>
        </h4>
        <div className="row g-4">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product.uid}
                product={product}
                onClick={() => handleVerify(product.uid, "view")} // <-- Truyền "view"
              />
            ))
          ) : (
            <div className="text-center text-muted py-5">
              Đang cập nhật dữ liệu...
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <QRScanner
          onScan={(uid) => {
            setShowScanner(false);
            handleVerify(uid, "scan"); // <-- Truyền "scan" (QUAN TRỌNG)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
