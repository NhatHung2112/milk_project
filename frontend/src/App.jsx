import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion"; // [MỚI] Import framer-motion
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import { User, Package } from "lucide-react";
import { api } from "./services/api";

export default function App() {
  const [page, setPage] = useState("home");
  const [userRole, setUserRole] = useState(null); // 'admin' or 'user' (logged in user)

  const handleLogin = async (role, data) => {
    if (role === "admin") {
      // Admin login hardcoded for demo or separate DB logic?
      // For now let's assume admin is also in DB or keep hardcoded fallback
      if (data.username === "admin" && data.password === "123") {
        // [MỚI] Lưu thông tin admin vào localStorage
        localStorage.setItem(
          "user",
          JSON.stringify({ username: "admin", role: "admin" }),
        );
        setUserRole("admin");
        setPage("admin-dashboard");
        return;
      }
      // Or try DB login if you want Admin to be in DB
      const res = await api.login(data);
      if (res.status === "success" && res.user.role === "admin") {
        // [MỚI] Lưu thông tin admin từ DB vào localStorage
        localStorage.setItem("user", JSON.stringify(res.user));
        setUserRole("admin");
        setPage("admin-dashboard");
      } else {
        alert("Sai thông tin đăng nhập hoặc không phải Admin!");
      }
    } else {
      // User login
      const res = await api.login(data);
      if (res.status === "success") {
        // [MỚI] Lưu thông tin user vào localStorage để Dashboard có thể đọc được
        localStorage.setItem("user", JSON.stringify(res.user));
        setUserRole("user");
        setPage("user-dashboard");
      } else {
        alert(res.message);
      }
    }
  };

  const handleRegister = async (data) => {
    const res = await api.register(data);
    if (res.status === "success") {
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      setPage("login");
    } else {
      alert("Lỗi: " + res.message);
    }
  };

  const handleLogout = () => {
    // [MỚI] Xóa thông tin user khi đăng xuất
    localStorage.removeItem("user");
    setUserRole(null);
    setPage("home");
  };

  return (
    <div className="min-vh-100 d-flex flex-column font-sans position-relative overflow-hidden">
      {/* Navbar only shows on certain pages */}
      {(page === "home" || page === "user-dashboard") && (
        <nav
          className="navbar navbar-expand sticky-top px-4 mt-3 rounded-pill mx-4 glass-panel"
          style={{ zIndex: 100 }}
        >
          <div className="container-fluid">
            <span
              className="navbar-brand h4 mb-0 fw-bold cursor-pointer d-flex align-items-center gap-2"
              onClick={() => setPage("home")}
              style={{ cursor: "pointer", color: "#333" }}
            >
              <div className="bg-primary-gradient p-2 rounded-3 text-white shadow-sm">
                <i className="fas fa-mug-hot"></i>
              </div>
              <span style={{ fontSize: "1.2rem" }}>
                Milk<span className="text-primary">Family</span>
              </span>
            </span>
            <div className="d-flex gap-2">
              {!userRole ? (
                <>
                  <button
                    className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2 btn-light text-primary"
                    onClick={() => setPage("login")}
                  >
                    <User size={18} /> Đăng Nhập
                  </button>
                  <button
                    className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2 btn-primary-gradient shadow-sm"
                    onClick={() => setPage("user-dashboard")}
                  >
                    <Package size={18} /> Tra Cứu
                  </button>
                </>
              ) : (
                <button
                  className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2 btn-light text-danger"
                  onClick={handleLogout}
                >
                  <User size={18} /> Đăng Xuất
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content with Animation */}
      <div className="flex-grow-1 d-flex flex-column position-relative">
        <AnimatePresence mode="wait">
          {page === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-grow-1 d-flex flex-column"
            >
              <HomePage onStart={() => setPage("user-dashboard")} />
            </motion.div>
          )}

          {page === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-grow-1 d-flex flex-column justify-content-center"
            >
              <LoginPage
                onLogin={handleLogin}
                onSwitchToRegister={() => setPage("register")}
                onBack={() => setPage("home")}
              />
            </motion.div>
          )}

          {page === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-grow-1 d-flex flex-column justify-content-center"
            >
              <RegisterPage
                onRegister={handleRegister}
                onSwitchToLogin={() => setPage("login")}
              />
            </motion.div>
          )}

          {page === "admin-dashboard" && userRole === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow-1"
            >
              <AdminDashboard onLogout={handleLogout} />
            </motion.div>
          )}

          {page === "user-dashboard" && (
            <motion.div
              key="user"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow-1"
            >
              <UserDashboard onBack={() => setPage("home")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
