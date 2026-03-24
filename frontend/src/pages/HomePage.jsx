import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Newspaper,
  ShieldCheck,
  Truck,
  Award,
  Users,
  Lock,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HomePage = ({ onStart }) => {
  // --- STATE QUẢN LÝ SLIDE ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  // DANH SÁCH SLIDE
  const slides = [
    {
      id: 1,
      title: "Dữ Liệu Không Thể Giả Mạo",
      desc: "Mọi thông tin sản xuất đều được mã hóa và lưu trữ vĩnh viễn trên Blockchain.",
      icon: <Lock size={40} className="mb-2 text-warning" />,
      img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Hàng Triệu Người Tin Dùng",
      desc: "Được các bà mẹ và chuyên gia dinh dưỡng khuyên dùng để bảo vệ sức khỏe gia đình.",
      icon: <Users size={40} className="mb-2 text-white" />,
      img: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "Truy Xuất Nguồn Gốc 24/7",
      desc: "Hệ thống hoạt động liên tục, giúp bạn kiểm tra sản phẩm mọi lúc, mọi nơi.",
      icon: <Database size={40} className="mb-2 text-info" />,
      img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  // Tự động chuyển slide mỗi 5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const scrollToContent = () => {
    const element = document.getElementById("info-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 1,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 1,
    }),
  };

  // [ĐÃ CẬP NHẬT] DANH SÁCH TIN TỨC CÓ HÌNH ẢNH THẬT
  const newsList = [
    {
      id: 1,
      title: "Cảnh báo sữa giả tràn lan thị trường",
      desc: "Cơ quan chức năng phát hiện nhiều cơ sở làm giả sữa bột. Hãy dùng Family Milk để kiểm tra nguồn gốc ngay.",
      img: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?q=80&w=600&auto=format&fit=crop", // Ảnh phòng thí nghiệm kiểm tra chất lượng
      date: "12/01/2026",
    },
    {
      id: 2,
      title: "Công nghệ Blockchain: Kỷ nguyên mới",
      desc: "Dữ liệu sản phẩm một khi đã ghi lên Blockchain sẽ không thể bị sửa đổi, đảm bảo tính trung thực tuyệt đối.",
      img: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?q=80&w=600&auto=format&fit=crop", // Ảnh công nghệ số/Node mạng
      date: "10/01/2026",
    },
    {
      id: 3,
      title: "Family Milk đạt chuẩn ISO 22000",
      desc: "Hệ thống quản lý của chúng tôi vừa được cấp chứng nhận quốc tế về an toàn thực phẩm.",
      img: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop", // Ảnh chứng nhận/tiêu chuẩn
      date: "08/01/2026",
    },
  ];

  return (
    <div className="bg-white">
      {/* HERO SECTION */}
      <div
        className="position-relative min-vh-100 d-flex align-items-center justify-content-center py-5 overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=2074&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100 bg-dark"
          style={{ opacity: 0.35 }}
        ></div>
        <div className="container position-relative z-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto p-5 rounded-5 text-center shadow-lg"
            style={{
              maxWidth: "800px",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="badge bg-white text-success px-4 py-2 rounded-pill mb-4 fw-bold shadow-sm d-inline-flex align-items-center gap-2"
            >
              <span
                className="status-dot bg-success rounded-circle"
                style={{ width: 8, height: 8 }}
              ></span>
              100% Nguồn Gốc Thiên Nhiên
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="display-3 fw-bold mb-4 text-white lh-tight"
              style={{
                letterSpacing: "-1px",
                textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              }}
            >
              Minh Bạch Nguồn Gốc
              <br />
              <span className="text-warning">An Tâm Cho Mọi Nhà</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-white fs-5 mb-5 mx-auto opacity-100 fw-medium"
              style={{
                lineHeight: "1.8",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              Ứng dụng công nghệ Blockchain giúp bạn kiểm tra chính xác hành
              trình của từng giọt sữa từ đồng cỏ xanh đến tận tay gia đình bạn.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="d-flex gap-3 justify-content-center flex-wrap"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-success btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg d-flex align-items-center border-0"
                onClick={onStart}
              >
                Tra Cứu Ngay <ArrowRight size={20} className="ms-2" />
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-outline-light btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm"
                style={{ borderWidth: "2px" }}
                onClick={scrollToContent}
              >
                Tìm Hiểu Thêm
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* CAROUSEL TRƯỢT */}
      <div id="info-section" className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-info text-dark px-3 py-2 rounded-pill mb-2 fw-bold bg-opacity-25 border border-info">
              CÔNG NGHỆ TIÊN PHONG
            </span>
            <h3 className="fw-bold display-6">Tại Sao Chọn Family Milk?</h3>
          </div>

          <div
            className="position-relative rounded-4 overflow-hidden shadow-lg bg-dark"
            style={{ height: "400px" }}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="position-absolute w-100 h-100"
              >
                <img
                  src={slides[currentSlide].img}
                  className="w-100 h-100"
                  style={{ objectFit: "cover", opacity: 0.6 }}
                  alt="Slide"
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                  <div
                    className="text-center text-white p-4"
                    style={{ maxWidth: "800px" }}
                  >
                    {slides[currentSlide].icon}
                    <h2 className="fw-bold mb-3 display-5 text-shadow">
                      {slides[currentSlide].title}
                    </h2>
                    <p className="fs-4 opacity-100 text-shadow">
                      {slides[currentSlide].desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <button
              className="btn position-absolute top-50 start-0 translate-middle-y ms-3 bg-white bg-opacity-25 text-white rounded-circle p-2 border-0 hover-scale z-1"
              onClick={prevSlide}
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="btn position-absolute top-50 end-0 translate-middle-y me-3 bg-white bg-opacity-25 text-white rounded-circle p-2 border-0 hover-scale z-1"
              onClick={nextSlide}
            >
              <ChevronRight size={32} />
            </button>

            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2 z-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 1 : -1);
                    setCurrentSlide(index);
                  }}
                  className={`btn p-0 rounded-circle transition-all ${index === currentSlide ? "bg-white" : "bg-white bg-opacity-50"}`}
                  style={{ width: "12px", height: "12px", border: "none" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NEWS SECTION (Đã sửa hình ảnh) */}
      <div className="py-5 bg-white">
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h2 className="fw-bold text-primary mb-1 d-flex align-items-center">
                <Newspaper className="me-2" />
                Tin Tức & Sự Kiện
              </h2>
              <p className="text-muted m-0">
                Cập nhật thông tin về an toàn thực phẩm
              </p>
            </div>
            <button className="btn btn-link text-decoration-none fw-bold">
              Xem tất cả &rarr;
            </button>
          </div>
          <div className="row g-4">
            {newsList.map((news) => (
              <div key={news.id} className="col-md-4">
                <motion.div
                  whileHover={{ y: -5 }}
                  className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden"
                >
                  <div className="position-relative">
                    <img
                      src={news.img}
                      className="card-img-top"
                      alt={news.title}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="position-absolute top-0 start-0 bg-primary text-white px-3 py-1 rounded-end mt-3 fw-bold small shadow">
                      {news.date}
                    </div>
                  </div>
                  <div className="card-body p-4">
                    <h5 className="card-title fw-bold mb-2 text-dark">
                      {news.title}
                    </h5>
                    <p className="card-text text-muted small line-clamp-2">
                      {news.desc}
                    </p>
                    <button className="btn btn-sm btn-outline-primary rounded-pill mt-2 fw-bold px-3">
                      Đọc tiếp
                    </button>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-primary text-white px-3 py-2 rounded-pill mb-2 fw-bold bg-opacity-75">
              GIÁ TRỊ CỐT LÕI
            </span>
            <h2 className="fw-bold display-6">Cam Kết Từ Family Milk</h2>
          </div>

          <div className="row g-4 text-center">
            {/* Card 1: Bảo Mật */}
            <div className="col-md-4">
              <motion.div
                whileHover={{ y: -10 }}
                className="card border-0 shadow-sm rounded-4 overflow-hidden h-100"
              >
                <img
                  src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop"
                  alt="Bảo Mật Blockchain"
                  className="card-img-top"
                  style={{ height: "220px", objectFit: "cover" }}
                />
                <div className="card-body p-4 bg-white position-relative">
                  <div
                    className="bg-white p-3 rounded-circle shadow d-inline-block position-absolute start-50 translate-middle-x"
                    style={{ top: "-25px" }}
                  >
                    <ShieldCheck size={32} className="text-primary" />
                  </div>
                  <h5 className="fw-bold mt-4 mb-3">Bảo Mật Tuyệt Đối</h5>
                  <p className="text-muted small mb-0">
                    Thông tin được mã hóa bằng thuật toán SHA-256 trên nền tảng
                    Blockchain, ngăn chặn mọi hành vi làm giả và sao chép.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Card 2: Vận chuyển */}
            <div className="col-md-4">
              <motion.div
                whileHover={{ y: -10 }}
                className="card border-0 shadow-sm rounded-4 overflow-hidden h-100"
              >
                <img
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop"
                  alt="Vận Chuyển"
                  className="card-img-top"
                  style={{ height: "220px", objectFit: "cover" }}
                />
                <div className="card-body p-4 bg-white position-relative">
                  <div
                    className="bg-white p-3 rounded-circle shadow d-inline-block position-absolute start-50 translate-middle-x"
                    style={{ top: "-25px" }}
                  >
                    <Truck size={32} className="text-success" />
                  </div>
                  <h5 className="fw-bold mt-4 mb-3">Minh Bạch Vận Chuyển</h5>
                  <p className="text-muted small mb-0">
                    Theo dõi trực tiếp lộ trình của từng hộp sữa từ nhà máy sản
                    xuất, kho vận lưu trữ đến tận tay người tiêu dùng.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Card 3: Chất lượng */}
            <div className="col-md-4">
              <motion.div
                whileHover={{ y: -10 }}
                className="card border-0 shadow-sm rounded-4 overflow-hidden h-100"
              >
                <img
                  src="https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=800&auto=format&fit=crop"
                  alt="Chuẩn Quốc Tế"
                  className="card-img-top"
                  style={{ height: "220px", objectFit: "cover" }}
                />
                <div className="card-body p-4 bg-white position-relative">
                  <div
                    className="bg-white p-3 rounded-circle shadow d-inline-block position-absolute start-50 translate-middle-x"
                    style={{ top: "-25px" }}
                  >
                    <Award size={32} className="text-warning" />
                  </div>
                  <h5 className="fw-bold mt-4 mb-3">Chuẩn Quốc Tế</h5>
                  <p className="text-muted small mb-0">
                    Mọi sản phẩm đều được kiểm định nghiêm ngặt, tuân thủ các
                    tiêu chuẩn ISO 22000 và HACCP về an toàn thực phẩm.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-dark text-white py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4 text-start">
              <h5 className="fw-bold text-primary mb-3">Family Milk</h5>
              <p className="small opacity-75">
                Hệ thống truy xuất nguồn gốc sữa hàng đầu Việt Nam, ứng dụng
                công nghệ Blockchain để bảo vệ sức khỏe người tiêu dùng.
              </p>
            </div>
            <div className="col-md-4 text-start">
              <h5 className="fw-bold text-white mb-3">Liên Hệ</h5>
              <p className="small opacity-75 mb-1">
                📍 Địa chỉ: Học Viện Hàng Không Việt Nam, TP. Hồ Chí Minh
              </p>
              <p className="small opacity-75 mb-1">📞 Hotline: 1900 1234</p>
              <p className="small opacity-75">
                📧 Email: HưngandTrường@gmail.com
              </p>
            </div>
            <div className="col-md-4 text-start">
              <h5 className="fw-bold text-white mb-3">Về Chúng Tôi</h5>
              <ul className="list-unstyled small opacity-75">
                <li className="mb-1">
                  <a href="#" className="text-white text-decoration-none">
                    Giới thiệu
                  </a>
                </li>
                <li className="mb-1">
                  <a href="#" className="text-white text-decoration-none">
                    Chính sách bảo mật
                  </a>
                </li>
                <li className="mb-1">
                  <a href="#" className="text-white text-decoration-none">
                    Điều khoản sử dụng
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <hr className="opacity-25 my-4" />
          <div className="text-center opacity-50 small">
            &copy; 2026 Family Milk Blockchain Project. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
