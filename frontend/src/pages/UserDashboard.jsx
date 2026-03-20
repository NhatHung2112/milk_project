import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  ArrowRight,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  History as HistoryIcon,
  User as UserIcon,
  AlertTriangle, // [MỚI] Thêm icon cảnh báo
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRScanner from "../components/QRScanner";
import Chatbot from "../components/Chatbot";
import { api } from "../services/api";

const UserDashboard = ({ onBack }) => {
  const [view, setView] = useState("list");
  const [products, setProducts] = useState([]);
  const [detail, setDetail] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [checkInput, setCheckInput] = useState("");
  const [historyList, setHistoryList] = useState([]);
  const [profileData, setProfileData] = useState({
    fullname: "",
    email: "",
    newPassword: "",
  });

  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [listSearchTerm, setListSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const CATEGORIES = [
    "Tất cả",
    "Sữa Tươi",
    "Sữa Bột Cho Bé",
    "Sữa Người Lớn",
    "Sữa Hạt",
    "Sữa Chua",
  ];
  const hiddenList = JSON.parse(
    localStorage.getItem("hidden_products") || "[]",
  );

  useEffect(() => {
    api
      .getProducts()
      .then((data) =>
        setProducts(data.filter((p) => !hiddenList.includes(p.uid))),
      );
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, listSearchTerm]);

  const verify = async (input, scanMethod = "Tra cứu Web") => {
    const target = input || checkInput;
    if (!target) return alert("Vui lòng nhập mã hoặc tên sản phẩm!");
    if (hiddenList.includes(target)) return alert("Sản phẩm bị ẩn!");

    const currentUser = JSON.parse(localStorage.getItem("user"));
    const username = currentUser ? currentUser.username : "Khách";

    try {
      const data = await api.verifyProduct(target);
      if (data.is_valid) {
        setDetail({ ...data, uid: data.uid });
        setView("detail");
        api.recordScan(data.uid, scanMethod, "valid", "scan", username);
      } else {
        alert("Không tìm thấy sản phẩm nào khớp với thông tin này!");
        api.recordScan(target, scanMethod, "invalid", "scan", username);
      }
    } catch (e) {
      alert("Lỗi kết nối");
    }
  };

  const viewHistory = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        alert("Vui lòng đăng nhập để xem lịch sử quét!");
        return;
      }
      const currentUser = JSON.parse(userStr);
      const data = await api.getUserHistory(currentUser.username);
      if (Array.isArray(data)) {
        setHistoryList(data);
        setView("history");
      } else {
        alert("Dữ liệu lỗi! Vui lòng chắc chắn bạn đã khởi động lại Backend.");
      }
    } catch (error) {
      alert("Không thể tải lịch sử. Vui lòng kiểm tra lại kết nối Backend!");
    }
  };

  const openProfile = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return alert("Vui lòng đăng nhập để xem thông tin cá nhân!");

    const currentUser = JSON.parse(userStr);
    setProfileData({
      fullname: currentUser.fullname || "",
      email: currentUser.email || "",
      newPassword: "",
    });
    setView("profile");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem("user"));

    const res = await api.updateProfile({
      username: currentUser.username,
      ...profileData,
    });

    if (res.status === "success") {
      alert("✅ " + res.message);
      localStorage.setItem("user", JSON.stringify(res.user));
      window.location.reload();
    } else {
      alert("❌ Lỗi: " + res.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory =
      selectedCategory === "Tất cả" || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(listSearchTerm.toLowerCase()) ||
      p.uid.toLowerCase().includes(listSearchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  if (view === "detail" && detail) {
    return (
      <div className="container py-5 animate-in">
        <button
          className="btn btn-light rounded-pill border mb-4 fw-bold px-3 shadow-sm"
          onClick={() => setView("list")}
        >
          <ArrowLeft size={18} className="me-2" /> Quay lại
        </button>

        <div
          className="glass-panel border-0 rounded-5 overflow-hidden mx-auto"
          style={{ maxWidth: "1000px" }}
        >
          <div className="row g-0">
            <div className="col-md-5 bg-white p-5 text-center border-end d-flex flex-column align-items-center justify-content-center">
              <img
                src={detail.product_image || "https://placehold.co/400"}
                className="img-fluid mb-4 rounded-3"
                style={{ maxHeight: "300px", objectFit: "contain" }}
                alt={detail.name}
                onError={(e) => {
                  e.target.src =
                    "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg";
                }}
              />
              <div className="bg-white p-2 rounded-3 border shadow-sm d-inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${window.location.origin}/?uid=${detail.uid}`}
                  width="100"
                  alt="QR"
                />
              </div>
            </div>
            <div className="col-md-7 p-5">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-success bg-opacity-10 text-success fw-bold mb-3 border border-success border-opacity-25">
                <CheckCircle size={18} /> SẢN PHẨM CHÍNH HÃNG
              </div>

              {/* [MỚI] Hiển thị cảnh báo nếu quét quá nhiều lần */}
              {detail.scan_count > 5 && (
                <div
                  className="alert alert-warning d-flex align-items-start mb-3 border-warning shadow-sm rounded-4"
                  role="alert"
                >
                  <AlertTriangle
                    className="me-3 text-warning flex-shrink-0 mt-1"
                    size={24}
                  />
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">
                      ⚠️ Cảnh báo an toàn!
                    </h6>
                    <small className="text-dark">
                      Sản phẩm này đã được quét{" "}
                      <strong>{detail.scan_count} lần</strong>. Lượt quét cao
                      bất thường cho thấy mã QR này có thể đã bị làm giả (sao
                      chép dán lên nhiều hộp khác nhau). Hãy kiểm tra kỹ tem
                      niêm phong vật lý!
                    </small>
                  </div>
                </div>
              )}

              <h2 className="fw-bold text-dark mb-2 display-6">
                {detail.name}
              </h2>
              <p className="text-muted mb-4 d-flex align-items-center">
                Mã định danh:{" "}
                <span className="fw-bold text-primary ms-2 bg-primary bg-opacity-10 px-2 py-1 rounded">
                  {detail.uid}
                </span>
              </p>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-4 border">
                    <small className="text-muted fw-bold d-block mb-1">
                      SỐ LÔ SẢN XUẤT
                    </small>
                    <span className="fs-5 fw-bold text-dark">
                      {detail.batch_number}
                    </span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-4 border">
                    <small className="text-muted fw-bold d-block mb-1">
                      HẠN SỬ DỤNG
                    </small>
                    <span className="fs-5 fw-bold text-danger">
                      {detail.expiry_date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center">
                  <Package size={18} className="me-2 text-primary" /> Thông tin
                  chi tiết:
                </h6>
                <p className="text-muted lh-base">
                  {detail.description ||
                    "Chưa có mô tả chi tiết cho sản phẩm này."}
                </p>
              </div>

              {detail.tx_hash ? (
                <div className="p-3 bg-light border border-secondary border-opacity-25 rounded-3 mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <div className="bg-dark text-white p-2 rounded-circle me-3">
                      <i className="fas fa-link"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold text-dark">
                        Xác thực bởi Blockchain
                      </h6>
                      <small className="text-muted">
                        Dữ liệu được bảo đảm toàn vẹn
                      </small>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-2 text-break font-monospace text-muted small border">
                    <strong className="d-block text-dark">
                      Transaction Hash:
                    </strong>
                    {detail.tx_hash}{" "}
                    {detail.tx_hash === "N/A" && (
                      <span className="text-danger ms-2">(Chưa ghi Block)</span>
                    )}
                  </div>
                  <div className="mt-2 text-end">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                      ✅ Smart Contract Verified
                    </span>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning small">
                  ⚠️ Sản phẩm này chưa có thông tin trên Blockchain.
                </div>
              )}

              <hr className="my-4 border-light" />
              <Chatbot productName={detail.name} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "profile") {
    return (
      <div className="container py-5 animate-in">
        <button
          className="btn btn-light rounded-pill border mb-4 fw-bold px-3 shadow-sm"
          onClick={() => setView("list")}
        >
          <ArrowLeft size={18} className="me-2" /> Quay lại
        </button>
        <div
          className="glass-panel p-4 p-md-5 mx-auto rounded-5 shadow-sm"
          style={{ maxWidth: "600px" }}
        >
          <h3 className="fw-bold mb-4 d-flex align-items-center text-dark">
            <UserIcon className="me-2 text-primary" size={28} /> Thông Tin Cá
            Nhân
          </h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-3">
              <label className="form-label fw-bold text-muted">Họ và Tên</label>
              <input
                type="text"
                className="form-control rounded-3 p-3 bg-light border-0"
                value={profileData.fullname}
                onChange={(e) =>
                  setProfileData({ ...profileData, fullname: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold text-muted">Email</label>
              <input
                type="email"
                className="form-control rounded-3 p-3 bg-light border-0"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                placeholder="Ví dụ: email@gmail.com"
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold text-muted">
                Đổi Mật Khẩu Mới
              </label>
              <input
                type="password"
                className="form-control rounded-3 p-3 bg-light border-0"
                placeholder="Bỏ trống nếu không muốn thay đổi..."
                value={profileData.newPassword}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    newPassword: e.target.value,
                  })
                }
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary-gradient w-100 rounded-pill py-3 fw-bold shadow-md fs-6"
            >
              LƯU THAY ĐỔI
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="container py-5 animate-in">
        <button
          className="btn btn-light rounded-pill border mb-4 fw-bold px-3 shadow-sm"
          onClick={() => setView("list")}
        >
          <ArrowLeft size={18} className="me-2" /> Quay lại
        </button>
        <div
          className="glass-panel p-4 mx-auto rounded-5 shadow-sm"
          style={{ maxWidth: "800px" }}
        >
          <h3 className="fw-bold mb-4 d-flex align-items-center text-dark">
            <HistoryIcon className="me-2 text-primary" size={28} /> Lịch sử tra
            cứu của bạn
          </h3>
          {historyList.length === 0 ? (
            <p className="text-muted text-center py-5">
              Bạn chưa quét sản phẩm nào.
            </p>
          ) : (
            <div className="list-group">
              {historyList.map((item, index) => (
                <div
                  key={index}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 mb-3 rounded border shadow-sm"
                >
                  <div>
                    <h5 className="mb-1 fw-bold text-primary">{item.uid}</h5>
                    <small className="text-muted d-block">
                      ⏳ Thời gian: {item.time}
                    </small>
                    <small className="text-muted d-block">
                      🔍 Phương thức:{" "}
                      <span className="fw-bold">{item.location}</span>
                    </small>
                    <small className="text-muted">
                      ✅ Trạng thái:{" "}
                      <span
                        className={`ms-1 fw-bold ${item.status === "valid" ? "text-success" : "text-danger"}`}
                      >
                        {item.status === "valid"
                          ? "Hợp lệ (Chính hãng)"
                          : "Không hợp lệ (Cảnh báo giả)"}
                      </span>
                    </small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                    onClick={() => {
                      setCheckInput(item.uid);
                      verify(item.uid, "Xem lại từ lịch sử");
                    }}
                  >
                    Xem lại
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 animate-in">
      <div className="text-center mb-5">
        <h2 className="fw-bold text-gradient mb-3 display-5">
          Tra Cứu Nguồn Gốc
        </h2>
        <p className="text-muted fs-5">
          Truy xuất thông tin sản phẩm minh bạch trên Blockchain
        </p>
      </div>

      <div
        className="glass-panel p-4 mx-auto text-center mb-5 rounded-pill shadow-lg"
        style={{ maxWidth: "700px" }}
      >
        <div className="d-flex gap-2 justify-content-center p-1">
          <input
            className="form-control rounded-pill border-0 ps-4 py-3 bg-light fs-5"
            placeholder="Nhập mã sản phẩm"
            value={checkInput}
            onChange={(e) => setCheckInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && verify(checkInput, "Tra cứu Web")
            }
          />
          <button
            className="btn btn-primary-gradient rounded-pill px-5 fw-bold"
            onClick={() => verify(checkInput, "Tra cứu Web")}
          >
            Check
          </button>
          <button
            className="btn btn-dark rounded-pill px-4"
            onClick={() => setShowScanner(true)}
            title="Quét mã QR"
          >
            <QrCode size={20} />
          </button>
          <button
            className="btn btn-outline-secondary rounded-pill px-4 bg-white"
            onClick={viewHistory}
            title="Lịch sử của tôi"
          >
            <HistoryIcon size={20} className="text-dark" />
          </button>
          <button
            className="btn btn-outline-primary rounded-pill px-4 bg-white"
            onClick={openProfile}
            title="Tài khoản"
          >
            <UserIcon size={20} className="text-dark" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 px-2 gap-3">
          <div>
            <h4 className="fw-bold text-dark m-0">Sản Phẩm Nổi Bật</h4>
            <span className="text-muted small heading-font">
              Danh sách sản phẩm hiện có
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="position-relative me-2">
              <input
                type="text"
                className="form-control rounded-pill ps-5 pe-4 bg-white border shadow-sm"
                placeholder="Tìm nhanh"
                value={listSearchTerm}
                onChange={(e) => setListSearchTerm(e.target.value)}
                style={{ width: "200px" }}
              />
              <Search
                size={18}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
              />
              {listSearchTerm && (
                <button
                  className="btn btn-link p-0 position-absolute top-50 end-0 translate-middle-y me-3 text-muted"
                  onClick={() => setListSearchTerm("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm rounded-pill px-3 fw-bold ${selectedCategory === cat ? "btn-primary" : "btn-light text-muted"}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="row g-4">
          <AnimatePresence mode="wait">
            {currentProducts.length > 0 ? (
              currentProducts.map((p) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="col-6 col-md-4 col-lg-3"
                  key={p.uid}
                >
                  <motion.div
                    whileHover={{ y: -10, transition: { duration: 0.2 } }}
                    className="glass-panel h-100 border-0 p-3 rounded-4 position-relative card-hover-effect"
                    onClick={() => verify(p.uid, "Tra cứu từ Danh Sách")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="position-absolute top-0 end-0 m-3 bg-white rounded-circle p-2 shadow-sm z-1">
                      <ArrowRight size={16} className="text-primary" />
                    </div>
                    <div
                      className="bg-white rounded-3 p-3 mb-3 d-flex align-items-center justify-content-center"
                      style={{ height: "180px" }}
                    >
                      <img
                        src={p.product_image}
                        className="img-fluid"
                        style={{ maxHeight: "100%", objectFit: "contain" }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://vinamilk.com.vn/static/uploads/2021/05/Sua-tuoi-tiet-trung-Vinamilk-100-tach-beo-khong-duong-1.jpg";
                        }}
                      />
                    </div>
                    <h6 className="fw-bold text-dark text-truncate mb-1 px-1">
                      {p.name}
                    </h6>
                    <div className="d-flex justify-content-between px-1">
                      <small className="text-muted">Lô: {p.batch_number}</small>
                      <small className="text-primary fw-bold">{p.uid}</small>
                    </div>
                  </motion.div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-12 text-center text-muted py-5"
              >
                <Package size={48} className="mb-3 opacity-50" />
                <p>Không tìm thấy sản phẩm nào.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-5 gap-3">
            <button
              className="btn btn-white border shadow-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="fw-bold text-muted">
              Trang <span className="text-primary">{currentPage}</span> /{" "}
              {totalPages}
            </span>
            <button
              className="btn btn-white border shadow-sm rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {showScanner && (
        <QRScanner
          onScan={(uid) => {
            setShowScanner(false);
            verify(uid, "Quét Camera");
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
      <Chatbot />
    </div>
  );
};

export default UserDashboard;
