import UpdateExcel from "../components/UpdateExcel";
import React, { useState, useEffect, useRef } from "react";
import {
  Package,
  Plus,
  List,
  LogOut,
  History,
  RefreshCcw,
  Eye,
  EyeOff,
  Users,
  Search,
  X,
  BarChart as BarIcon,
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
  FileText,
  MessageSquare,
  MessageCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { api } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("statistics");
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");

  const [hiddenList, setHiddenList] = useState(
    JSON.parse(localStorage.getItem("hidden_products") || "[]"),
  );

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // --- CẬP NHẬT STATE CHO LOGIC SẢN PHẨM -> LÔ ---
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [expandedBatchDetail, setExpandedBatchDetail] = useState(null);

  const loadData = async () => {
    const data = await api.getProducts();
    setProducts(data);
    const usersData = await api.getUsers();
    setUsers(usersData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.expiry_date_unix = Math.floor(new Date(data.p_date).getTime() / 1000);

    const res = await api.createProduct(data);
    if (res.status === "success") {
      alert("✅ Thành công!");
      loadData();
      e.target.reset();
    } else alert("❌ Lỗi: " + res.message);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (data.p_date) {
      data.expiry_date_unix = Math.floor(
        new Date(data.p_date).getTime() / 1000,
      );
      data.expiry_date = new Date(data.p_date).toLocaleDateString("vi-VN");
    }

    const res = await api.updateProduct(editingProduct.uid, data);
    if (res.status === "success") {
      alert("✅ Cập nhật thành công!");
      setEditingProduct(null);
      loadData();
    } else {
      alert("❌ Lỗi: " + res.message);
    }
  };

  const handleDelete = async (uid) => {
    if (
      window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm mã ${uid}?`)
    ) {
      const res = await api.deleteProduct(uid);
      if (res.status === "success") {
        alert("✅ Đã xóa thành công!");
        loadData();
      } else {
        alert("❌ Lỗi: " + res.message);
      }
    }
  };

  const handleSelectAll = (e, currentFilteredList) => {
    if (e.target.checked) {
      const allUids = currentFilteredList.map((p) => p.uid);
      setSelectedProducts(allUids);
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (uid) => {
    if (selectedProducts.includes(uid)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== uid));
    } else {
      setSelectedProducts([...selectedProducts, uid]);
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm đã chọn?`,
      )
    ) {
      const res = await api.deleteProductsBulk(selectedProducts);
      if (res.status === "success") {
        alert("✅ Đã xóa thành công danh sách đã chọn!");
        setSelectedProducts([]);
        loadData();
      } else {
        alert("❌ Lỗi: " + res.message);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.trim().split("\n").slice(1);

      const formattedProducts = rows
        .map((row) => {
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (cols.length < 5) return null;

          const clean = (str) => (str ? str.replace(/^"|"$/g, "").trim() : "");

          const expStr = clean(cols[4]);
          let expUnix = 0;

          if (expStr && expStr.includes("/")) {
            const parts = expStr.split("/");
            if (parts.length === 3) {
              expUnix = Math.floor(
                new Date(parts[2], parts[1] - 1, parts[0]).getTime() / 1000,
              );
            }
          } else {
            expUnix = Math.floor(new Date(expStr).getTime() / 1000);
          }

          return {
            uid: clean(cols[0]),
            name: clean(cols[1]),
            category: clean(cols[2]),
            batch_number: clean(cols[3]),
            expiry_date: expStr,
            expiry_date_unix: expUnix,
            product_image: clean(cols[5]) || "https://placehold.co/400",
            description: cols.slice(6).join(",").replace(/^"|"$/g, ""),
          };
        })
        .filter((p) => p !== null);

      if (formattedProducts.length > 0) {
        if (
          window.confirm(
            `Tìm thấy ${formattedProducts.length} sản phẩm. Bạn có muốn nhập không?`,
          )
        ) {
          const res = await api.createProductsBulk(formattedProducts);
          if (res.status === "success") {
            alert("✅ Nhập hàng thành công!");
            loadData();
          } else {
            alert("⚠️ Có lỗi xảy ra: " + (res.message || "Kiểm tra lại file"));
          }
        }
      } else {
        alert("❌ File không hợp lệ hoặc không có dữ liệu!");
      }
      setIsImporting(false);
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const getDaysRemaining = (p) => {
    if (p.expiry_unix) {
      const expiry = p.expiry_unix * 1000;
      const now = Date.now();
      return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    }

    if (!p.expiry_date) return 0;

    try {
      if (p.expiry_date.includes("/")) {
        const parts = p.expiry_date.split("/");
        if (parts.length === 3) {
          const expiry = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
          const now = Date.now();
          return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        }
      }
      const expiry = new Date(p.expiry_date).getTime();
      if (isNaN(expiry)) return 0;

      const now = Date.now();
      return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const getExpiryStatus = (p) => {
    const days = getDaysRemaining(p);
    if (days < 0) return { label: "Đã hết hạn", color: "danger", bg: "danger" };
    if (days <= 30)
      return { label: "Sắp hết hạn", color: "warning", bg: "warning" };
    return { label: "An toàn", color: "success", bg: "success" };
  };

  const filteredProducts = products.filter(
    (p) =>
      p.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getFilteredBatches = () => {
    let result = [...products];
    if (batchFilter === "expired") {
      result = result.filter((p) => getDaysRemaining(p) < 0);
    } else if (batchFilter === "warning") {
      result = result.filter((p) => {
        const days = getDaysRemaining(p);
        return days >= 0 && days <= 30;
      });
    } else if (batchFilter === "safe") {
      result = result.filter((p) => getDaysRemaining(p) > 30);
    }
    return result;
  };

  // --- CẬP NHẬT LOGIC: NHÓM THEO "SẢN PHẨM" TRƯỚC, RỒI TỚI "LÔ" ---
  const getGroupedProducts = () => {
    const rawList = getFilteredBatches();
    const grouped = {};

    rawList.forEach((p) => {
      // 1. Tạo nhóm Sản phẩm (Product) nếu chưa có
      if (!grouped[p.name]) {
        grouped[p.name] = {
          name: p.name,
          category: p.category,
          total_items: 0,
          batches: {}, // Chứa các lô của sản phẩm này
        };
      }
      grouped[p.name].total_items += 1;

      // 2. Phân loại sản phẩm vào Lô tương ứng
      if (!grouped[p.name].batches[p.batch_number]) {
        grouped[p.name].batches[p.batch_number] = {
          batch_number: p.batch_number,
          expiry_date: p.expiry_date,
          expiry_unix: p.expiry_unix,
          items: [],
        };
      }
      grouped[p.name].batches[p.batch_number].items.push(p);
    });

    // Trả về mảng các sản phẩm, xếp theo tên Alpha B
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  };

  const groupedProductList = getGroupedProducts();

  const toggleHide = (uid) => {
    const newList = hiddenList.includes(uid)
      ? hiddenList.filter((id) => id !== uid)
      : [...hiddenList, uid];
    setHiddenList(newList);
    localStorage.setItem("hidden_products", JSON.stringify(newList));
  };

  const loadHistory = async () => {
    const data = await api.getHistory();
    setHistory(data);
    setShowHistory(true);
  };

  const topProducts = [...products]
    .sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0))
    .slice(0, 5)
    .map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
      scans: p.scan_count || 0,
    }));

  const validCount = history.filter(
    (h) => !h.status || h.status === "valid",
  ).length;
  const invalidCount = history.filter((h) => h.status === "invalid").length;

  useEffect(() => {
    if (activeTab === "statistics" && history.length === 0) {
      api.getHistory().then(setHistory);
    }
  }, [activeTab]);

  const piData = [
    { name: "Hợp lệ", value: validCount, color: "#00C49F" },
    { name: "Cảnh báo (Giả)", value: invalidCount, color: "#FF8042" },
  ];

  return (
    <div className="container py-4 animate-in">
      <div className="glass-panel rounded-4 p-4 mb-4 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
            <Package size={24} />
          </div>
          <div>
            <h4 className="fw-bold mb-0">Quản Trị Hệ Thống</h4>
            <p className="text-muted m-0 small">
              Xin chào, {user?.fullname || "Admin"}
            </p>
          </div>
        </div>
        <button
          className="btn btn-outline-danger rounded-pill px-4 fw-bold"
          onClick={onLogout}
        >
          <LogOut size={18} className="me-2" /> Đăng Xuất
        </button>
      </div>

      <div className="row g-4">
        {/* Sidebar / Menu */}
        <div className="col-lg-3">
          <div className="glass-panel p-3 rounded-4 h-100">
            <div className="d-grid gap-2">
              <button
                className={`btn text-start p-3 rounded-3 fw-bold ${
                  activeTab === "statistics"
                    ? "btn-primary text-white shadow"
                    : "btn-light text-muted"
                }`}
                onClick={() => setActiveTab("statistics")}
              >
                <BarIcon size={20} className="me-2" /> Thống Kê Tổng Quan
              </button>
              <button
                className={`btn text-start p-3 rounded-3 fw-bold ${
                  activeTab === "products"
                    ? "btn-primary text-white shadow"
                    : "btn-light text-muted"
                }`}
                onClick={() => setActiveTab("products")}
              >
                <Package size={20} className="me-2" /> Quản Lý Sản Phẩm
              </button>
              <button
                className={`btn text-start p-3 rounded-3 fw-bold ${
                  activeTab === "batches"
                    ? "btn-primary text-white shadow"
                    : "btn-light text-muted"
                }`}
                onClick={() => setActiveTab("batches")}
              >
                <AlertTriangle size={20} className="me-2" /> Quản Lý Lô Hàng
              </button>
              <button
                className={`btn text-start p-3 rounded-3 fw-bold ${
                  activeTab === "users"
                    ? "btn-primary text-white shadow"
                    : "btn-light text-muted"
                }`}
                onClick={() => setActiveTab("users")}
              >
                <Users size={20} className="me-2" /> Quản Lý Người Dùng
              </button>

              <button
                className="btn btn-light text-start p-3 rounded-3 fw-bold text-muted"
                onClick={loadHistory}
              >
                <History size={20} className="me-2" /> Lịch Sử Tra Cứu
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-lg-9">
          {activeTab === "statistics" && (
            <div className="glass-panel p-4 rounded-4 animate-in">
              <h4 className="fw-bold mb-4 text-primary">
                📊 Thống Kê Hệ Thống
              </h4>

              <div className="row g-4 mb-4">
                <div className="col-md-7">
                  <div className="bg-white p-3 rounded-3 shadow-sm border h-100">
                    <h6 className="fw-bold text-center mb-3">
                      Top 5 Sản Phẩm Được Quét
                    </h6>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={topProducts}
                          layout="vertical"
                          margin={{ left: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            fontSize={10}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="scans"
                            fill="#8884d8"
                            name="Lượt quét"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="bg-white p-3 rounded-3 shadow-sm border h-100">
                    <h6 className="fw-bold text-center mb-3">
                      Tỷ Lệ Thật / Giả
                    </h6>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={piData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {piData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-muted small">
                * Dữ liệu được cập nhật theo thời gian thực từ hoạt động quét QR
                của người dùng.
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="glass-panel p-4 rounded-4 animate-in">
              <UpdateExcel onSuccess={loadData} />

              <div className="row g-4 mb-4 mt-2">
                <div className="col-md-5 border-end">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-primary m-0">
                      <Plus size={20} className="me-1" /> Thêm Sản Phẩm Mới
                    </h5>

                    <div>
                      <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileUpload}
                      />
                      <button
                        className="btn btn-success btn-sm rounded-pill fw-bold shadow-sm d-flex align-items-center gap-1 px-3"
                        onClick={() => fileInputRef.current.click()}
                        disabled={isImporting}
                        title="Nhập danh sách từ file CSV"
                      >
                        {isImporting ? (
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        ) : (
                          <FileText size={16} />
                        )}
                        <span className="d-none d-sm-inline">
                          {isImporting ? "Đang xử lý..." : "Nhập Excel"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <form onSubmit={handleCreate}>
                    <div className="mb-2">
                      <label className="small fw-bold text-muted">Mã ID</label>
                      <input
                        name="uid"
                        className="form-control rounded-3"
                        placeholder="VD: MF_001"
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="small fw-bold text-muted">
                        Tên Sản Phẩm
                      </label>
                      <input
                        name="name"
                        className="form-control rounded-3"
                        required
                      />
                    </div>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="small fw-bold text-muted">
                          Số Lô
                        </label>
                        <input
                          name="batch_number"
                          className="form-control rounded-3"
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="small fw-bold text-muted">
                          Hạn Dùng
                        </label>
                        <input
                          name="p_date"
                          type="date"
                          className="form-control rounded-3"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="small fw-bold text-muted">
                        Hình Ảnh (URL)
                      </label>
                      <input
                        name="product_image"
                        className="form-control rounded-3"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="small fw-bold text-muted">Mô Tả</label>
                      <textarea
                        name="description"
                        className="form-control rounded-3"
                        rows="2"
                      ></textarea>
                    </div>
                    <button className="btn btn-primary w-100 rounded-pill fw-bold">
                      LƯU DATABASE
                    </button>
                  </form>
                </div>
                <div className="col-md-7">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold m-0">
                      <List size={20} className="me-1" /> Danh Sách
                    </h5>

                    <div className="d-flex gap-2">
                      {selectedProducts.length > 0 && (
                        <button
                          className="btn btn-sm btn-danger rounded-pill shadow-sm d-flex align-items-center"
                          onClick={handleBulkDelete}
                        >
                          <Trash2 size={16} className="me-1" /> Xóa (
                          {selectedProducts.length})
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-light rounded-pill border"
                        onClick={loadData}
                      >
                        <RefreshCcw size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="input-group mb-3 shadow-sm">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <Search size={18} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Tìm kiếm theo Mã ID hoặc Tên sản phẩm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-white border border-start-0"
                        onClick={() => setSearchTerm("")}
                      >
                        <X size={18} className="text-muted" />
                      </button>
                    )}
                  </div>

                  <div
                    className="table-responsive"
                    style={{ maxHeight: "500px" }}
                  >
                    <table className="table fs-6">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th
                            className="rounded-start text-center"
                            style={{ width: "40px" }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input"
                              onChange={(e) =>
                                handleSelectAll(e, filteredProducts)
                              }
                              checked={
                                filteredProducts.length > 0 &&
                                selectedProducts.length ===
                                  filteredProducts.length
                              }
                            />
                          </th>
                          <th>ID</th>
                          <th>Tên</th>
                          <th className="text-center">Quét</th>
                          <th className="text-center rounded-end">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((p) => (
                            <tr
                              key={p.uid}
                              style={{
                                opacity: hiddenList.includes(p.uid) ? 0.5 : 1,
                              }}
                            >
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={selectedProducts.includes(p.uid)}
                                  onChange={() => handleSelectOne(p.uid)}
                                />
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  {p.uid}
                                </span>
                              </td>
                              <td className="fw-bold small">{p.name}</td>
                              <td className="text-center small">
                                {p.scan_count || 0}
                              </td>

                              <td className="text-center">
                                <div className="d-flex justify-content-center align-items-center gap-2">
                                  <button
                                    className="btn btn-sm border-0 text-primary p-0"
                                    onClick={() => setEditingProduct(p)}
                                    title="Sửa"
                                  >
                                    <Edit size={16} />
                                  </button>

                                  <button
                                    className="btn btn-sm border-0 text-danger p-0"
                                    onClick={() => handleDelete(p.uid)}
                                    title="Xóa"
                                  >
                                    <Trash2 size={16} />
                                  </button>

                                  <button
                                    className={`btn btn-sm border-0 p-0 ${
                                      hiddenList.includes(p.uid)
                                        ? "text-muted"
                                        : "text-secondary"
                                    }`}
                                    onClick={() => toggleHide(p.uid)}
                                    title={
                                      hiddenList.includes(p.uid) ? "Hiện" : "Ẩn"
                                    }
                                  >
                                    {hiddenList.includes(p.uid) ? (
                                      <EyeOff size={16} />
                                    ) : (
                                      <Eye size={16} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="text-center text-muted py-3"
                            >
                              Không tìm thấy sản phẩm nào.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="glass-panel p-4 rounded-4 animate-in">
              <h5 className="fw-bold mb-4 text-primary">
                <Users size={20} className="me-1" /> Quản Lý Người Dùng
              </h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="rounded-start ps-3">ID</th>
                      <th>Họ Tên</th>
                      <th>Đăng Nhập</th>
                      <th>Email</th>
                      <th className="rounded-end">Vai Trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="ps-3 text-muted">#{u._id}</td>
                        <td className="fw-bold">{u.fullname}</td>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className="badge bg-success bg-opacity-10 text-success">
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "batches" && (
            <div className="glass-panel p-4 rounded-4 animate-in">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold text-primary m-0">
                  <AlertTriangle size={20} className="me-1" /> Quản Lý Sản Phẩm
                  & Lô Hàng
                </h4>
              </div>

              <div className="d-flex flex-wrap gap-2 mb-4">
                <button
                  className={`btn rounded-pill px-3 d-flex align-items-center gap-2 ${
                    batchFilter === "all"
                      ? "btn-primary"
                      : "btn-light border text-muted"
                  }`}
                  onClick={() => setBatchFilter("all")}
                >
                  <Layers size={16} /> Tất cả Sản Phẩm
                </button>
                <button
                  className={`btn rounded-pill px-3 d-flex align-items-center gap-2 ${
                    batchFilter === "safe"
                      ? "btn-success text-white"
                      : "btn-light border text-muted"
                  }`}
                  onClick={() => setBatchFilter("safe")}
                >
                  <CheckCircle size={16} /> Lô Còn Hạn
                </button>
                <button
                  className={`btn rounded-pill px-3 d-flex align-items-center gap-2 ${
                    batchFilter === "warning"
                      ? "btn-warning text-dark"
                      : "btn-light border text-muted"
                  }`}
                  onClick={() => setBatchFilter("warning")}
                >
                  <AlertTriangle size={16} /> Lô Sắp Hết Hạn
                </button>
                <button
                  className={`btn rounded-pill px-3 d-flex align-items-center gap-2 ${
                    batchFilter === "expired"
                      ? "btn-danger text-white"
                      : "btn-light border text-muted"
                  }`}
                  onClick={() => setBatchFilter("expired")}
                >
                  <XCircle size={16} /> Lô Hết Hạn
                </button>
              </div>

              {batchFilter === "all" && (
                <div className="alert alert-info border-0 bg-info bg-opacity-10 text-info-emphasis d-flex align-items-center mb-3">
                  <Package className="me-2" />
                  <div>
                    <strong>Cấu trúc chuẩn:</strong> 1 Sản Phẩm gồm nhiều Lô - 1
                    Lô gồm nhiều Hộp (Mã UID).
                  </div>
                </div>
              )}

              <div
                className="table-responsive"
                style={{ maxHeight: "600px", borderRadius: "10px" }}
              >
                <table className="table fs-6 align-middle mb-0">
                  <thead className="table-light sticky-top shadow-sm">
                    <tr>
                      <th className="rounded-start ps-3 py-3">
                        Sản Phẩm Cốt Lõi
                      </th>
                      <th className="py-3">Phân Loại</th>
                      <th className="text-center py-3">Số Lô Hiện Có</th>
                      <th className="text-center py-3">Tổng Hộp Tồn Kho</th>
                      <th className="rounded-end text-center py-3">
                        Quản Lý Lô
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedProductList.length > 0 ? (
                      groupedProductList.map((prod) => (
                        <React.Fragment key={prod.name}>
                          {/* MỨC 1: SẢN PHẨM GỐC */}
                          <tr className="bg-white border-bottom hover-bg-light transition-all">
                            <td className="fw-bold text-primary fs-6 ps-3 py-3">
                              {prod.name}
                            </td>
                            <td className="py-3">
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border">
                                {prod.category}
                              </span>
                            </td>
                            <td className="text-center py-3">
                              <span className="badge bg-info text-dark fw-bold px-3 py-2 rounded-pill">
                                {Object.keys(prod.batches).length} Lô
                              </span>
                            </td>
                            <td className="text-center py-3">
                              <span className="badge bg-success bg-opacity-10 text-success fw-bold border border-success px-3 py-2 rounded-pill">
                                {prod.total_items} hộp
                              </span>
                            </td>
                            <td className="text-center py-3">
                              <button
                                className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${
                                  expandedProduct === prod.name
                                    ? "btn-primary shadow"
                                    : "btn-outline-primary"
                                }`}
                                onClick={() =>
                                  setExpandedProduct(
                                    expandedProduct === prod.name
                                      ? null
                                      : prod.name,
                                  )
                                }
                              >
                                {expandedProduct === prod.name
                                  ? "Thu Gọn"
                                  : "Xem Các Lô"}
                              </button>
                            </td>
                          </tr>

                          {/* MỨC 2: DANH SÁCH LÔ CỦA SẢN PHẨM ĐÓ */}
                          {expandedProduct === prod.name && (
                            <tr>
                              <td colSpan="5" className="p-0 border-0 bg-light">
                                <div className="p-3 ps-4 border-start border-primary border-4 m-2 bg-white rounded shadow-sm">
                                  <h6 className="fw-bold text-muted mb-3 d-flex align-items-center">
                                    <Layers
                                      size={18}
                                      className="me-2 text-primary"
                                    />
                                    Danh sách Lô thuộc "{prod.name}"
                                  </h6>
                                  <table className="table table-sm table-hover mb-0 border rounded overflow-hidden">
                                    <thead className="table-secondary text-muted">
                                      <tr>
                                        <th className="ps-3 py-2">
                                          Mã Lô Hàng
                                        </th>
                                        <th className="text-center py-2">
                                          Số Lượng Hộp
                                        </th>
                                        <th className="py-2">Hạn Sử Dụng</th>
                                        <th className="py-2">Tình Trạng</th>
                                        <th className="text-center py-2">
                                          Truy Xuất Hộp
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.values(prod.batches)
                                        .sort(
                                          (a, b) =>
                                            a.expiry_unix - b.expiry_unix,
                                        )
                                        .map((batch) => {
                                          const status = getExpiryStatus(batch);
                                          const days = getDaysRemaining(batch);
                                          const batchKey = `${prod.name}-${batch.batch_number}`;
                                          const isBatchExpanded =
                                            expandedBatchDetail === batchKey;

                                          return (
                                            <React.Fragment
                                              key={batch.batch_number}
                                            >
                                              <tr
                                                className={
                                                  days <= 30 && days >= 0
                                                    ? "bg-warning bg-opacity-10"
                                                    : days < 0
                                                      ? "bg-danger bg-opacity-10"
                                                      : ""
                                                }
                                              >
                                                <td className="fw-bold font-monospace text-dark ps-3 align-middle">
                                                  {batch.batch_number}
                                                </td>
                                                <td className="text-center align-middle">
                                                  <span className="badge bg-dark rounded-pill px-3">
                                                    {batch.items.length} hộp
                                                  </span>
                                                </td>
                                                <td className="align-middle">
                                                  {batch.expiry_date}{" "}
                                                  <small
                                                    className={`fw-bold ms-1 ${
                                                      days < 0
                                                        ? "text-danger"
                                                        : "text-success"
                                                    }`}
                                                  >
                                                    (
                                                    {days < 0
                                                      ? `Quá hạn ${Math.abs(days)} ngày`
                                                      : `Còn ${days} ngày`}
                                                    )
                                                  </small>
                                                </td>
                                                <td className="align-middle">
                                                  <span
                                                    className={`badge bg-${status.bg} text-white px-2 py-1 rounded-pill`}
                                                  >
                                                    {status.label}
                                                  </span>
                                                </td>
                                                <td className="text-center align-middle">
                                                  <button
                                                    className="btn btn-sm btn-link text-decoration-none fw-bold"
                                                    onClick={() =>
                                                      setExpandedBatchDetail(
                                                        isBatchExpanded
                                                          ? null
                                                          : batchKey,
                                                      )
                                                    }
                                                  >
                                                    {isBatchExpanded
                                                      ? "Ẩn Mã ID"
                                                      : "Mở Mã ID"}
                                                  </button>
                                                </td>
                                              </tr>

                                              {/* MỨC 3: CHI TIẾT TỪNG HỘP TRONG LÔ */}
                                              {isBatchExpanded && (
                                                <tr>
                                                  <td
                                                    colSpan="5"
                                                    className="p-3 bg-light border-bottom"
                                                  >
                                                    <div className="text-muted small fw-bold mb-2">
                                                      Danh sách{" "}
                                                      {batch.items.length} mã ID
                                                      hộp sữa trong lô này:
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                      {batch.items.map(
                                                        (item) => (
                                                          <span
                                                            key={item.uid}
                                                            className="badge bg-white text-primary border border-primary border-opacity-25 font-monospace p-2 shadow-sm"
                                                            title="Mã quét QR"
                                                          >
                                                            {item.uid}
                                                          </span>
                                                        ),
                                                      )}
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-5">
                          Không có sản phẩm hoặc lô hàng nào trong mục này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL LỊCH SỬ GỘP CHUNG --- */}
      {showHistory && (
        <div
          className="modal d-block"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(5px)",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="glass-panel modal-content border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-gradient">
                  Lịch Sử Truy Xuất
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowHistory(false)}
                ></button>
              </div>
              <div className="modal-body pt-3">
                <div className="table-responsive" style={{ maxHeight: "60vh" }}>
                  <table className="table table-striped mb-0 align-middle">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th className="ps-4">Thời Gian</th>
                        <th>Mã SP</th>
                        <th>Người Tra Cứu</th>
                        <th>Phương Thức</th>
                        <th>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length > 0 ? (
                        history.map((h, i) => (
                          <tr key={i}>
                            <td className="ps-4 small text-muted">{h.time}</td>
                            <td>
                              <span className="badge bg-primary">{h.uid}</span>
                            </td>
                            <td className="small fw-bold text-dark">
                              {h.username || "Khách"}
                            </td>
                            <td className="small text-muted">{h.location}</td>
                            <td>
                              {h.status === "valid" ? (
                                <span className="badge bg-success">Hợp lệ</span>
                              ) : (
                                <span className="badge bg-danger">
                                  Cảnh báo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center text-muted py-4"
                          >
                            Chưa có dữ liệu tra cứu.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL SỬA SẢN PHẨM --- */}
      {editingProduct && (
        <div
          className="modal d-block"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(5px)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="glass-panel modal-content border-0 rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-primary">
                  Sửa Thông Tin Sản Phẩm
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setEditingProduct(null)}
                ></button>
              </div>
              <div className="modal-body pt-3">
                <form onSubmit={handleUpdate}>
                  <div className="mb-2">
                    <label className="small fw-bold text-muted">
                      Tên Sản Phẩm
                    </label>
                    <input
                      name="name"
                      defaultValue={editingProduct.name}
                      className="form-control rounded-3"
                      required
                    />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <label className="small fw-bold text-muted">Số Lô</label>
                      <input
                        name="batch_number"
                        defaultValue={editingProduct.batch_number}
                        className="form-control rounded-3"
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="small fw-bold text-muted">
                        Hạn Dùng (Chọn lại nếu đổi)
                      </label>
                      <input
                        name="p_date"
                        type="date"
                        className="form-control rounded-3"
                      />
                      <small className="text-muted d-block mt-1">
                        Cũ: {editingProduct.expiry_date}
                      </small>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="small fw-bold text-muted">Danh mục</label>
                    <select
                      name="category"
                      defaultValue={editingProduct.category}
                      className="form-select rounded-3"
                    >
                      <option value="Sữa Tươi">Sữa Tươi</option>
                      <option value="Sữa Bột Cho Bé">Sữa Bột Cho Bé</option>
                      <option value="Sữa Người Lớn">Sữa Người Lớn</option>
                      <option value="Sữa Hạt">Sữa Hạt</option>
                      <option value="Sữa Chua">Sữa Chua</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="small fw-bold text-muted">
                      Hình Ảnh (URL)
                    </label>
                    <input
                      name="product_image"
                      defaultValue={editingProduct.product_image}
                      className="form-control rounded-3"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="small fw-bold text-muted">Mô Tả</label>
                    <textarea
                      name="description"
                      defaultValue={editingProduct.description}
                      className="form-control rounded-3"
                      rows="2"
                    ></textarea>
                  </div>
                  <button className="btn btn-primary w-100 rounded-pill fw-bold">
                    CẬP NHẬT LÊN DATABASE
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
