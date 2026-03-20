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
  const [direction, setDirection] = useState(1); // 1: Trượt sang trái, -1: Trượt sang phải

  const slides = [
    {
      id: 1,
      title: "Dữ Liệu Không Thể Giả Mạo",
      desc: "Mọi thông tin sản xuất đều được mã hóa và lưu trữ vĩnh viễn trên Blockchain.",
      icon: <Lock size={40} className="mb-2 text-warning" />,
      img: "https://placehold.co/1200x400/2c3e50/ffffff?text=.",
    },
    {
      id: 2,
      title: "Hàng Triệu Người Tin Dùng",
      desc: "Được các bà mẹ và chuyên gia dinh dưỡng khuyên dùng để bảo vệ sức khỏe gia đình.",
      icon: <Users size={40} className="mb-2 text-white" />,
      img: "https://placehold.co/1200x400/198754/ffffff?text=.",
    },
    {
      id: 3,
      title: "Truy Xuất Nguồn Gốc 24/7",
      desc: "Hệ thống hoạt động liên tục, giúp bạn kiểm tra sản phẩm mọi lúc, mọi nơi.",
      icon: <Database size={40} className="mb-2 text-info" />,
      img: "https://placehold.co/1200x400/0d6efd/ffffff?text=.",
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

  // Hàm cuộn xuống
  const scrollToContent = () => {
    const element = document.getElementById("info-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Cấu hình hiệu ứng trượt
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%", // Vào từ phải (nếu next) hoặc trái (nếu prev)
      opacity: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%", // Ra về bên trái (nếu next) hoặc phải (nếu prev)
      opacity: 1,
    }),
  };

  const newsList = [
    {
      id: 1,
      title: "Cảnh báo sữa giả tràn lan thị trường",
      desc: "Cơ quan chức năng phát hiện nhiều cơ sở làm giả sữa bột. Hãy dùng Family Milk để kiểm tra nguồn gốc ngay.",
      img: "https://placehold.co/600x400/dc3545/white?text=Cảnh+Báo+Sữa+Giả",
      date: "12/01/2026",
    },
    {
      id: 2,
      title: "Công nghệ Blockchain: Kỷ nguyên mới",
      desc: "Dữ liệu sản phẩm một khi đã ghi lên Blockchain sẽ không thể bị sửa đổi, đảm bảo tính trung thực tuyệt đối.",
      img: "https://placehold.co/600x400/0d6efd/white?text=Blockchain+Technology",
      date: "10/01/2026",
    },
    {
      id: 3,
      title: "Family Milk đạt chuẩn ISO 22000",
      desc: "Hệ thống quản lý của chúng tôi vừa được cấp chứng nhận quốc tế về an toàn thực phẩm.",
      img: "https://placehold.co/600x400/198754/white?text=Chứng+Nhận+ISO",
      date: "08/01/2026",
    },
  ];

  return (
    <div className="bg-white">
      {/* HERO SECTION */}
      <div className="container flex-grow-1 d-flex align-items-center justify-content-center text-center py-5 min-vh-100">
        <div>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="badge bg-white text-primary px-4 py-2 rounded-pill mb-4 fw-bold shadow-sm d-inline-flex align-items-center gap-2"
          >
            <span
              className="status-dot bg-success rounded-circle"
              style={{ width: 8, height: 8 }}
            ></span>
            Mạng Lưới Blockchain 4.0
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="display-2 fw-bold mb-4 text-dark lh-tight"
            style={{ letterSpacing: "-2px" }}
          >
            Minh Bạch Nguồn Gốc
            <br />
            <span className="text-gradient">An Tâm Cho Mọi Nhà</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted fs-5 mb-5 mx-auto"
            style={{ maxWidth: "650px", lineHeight: "1.8" }}
          >
            Ứng dụng công nghệ Blockchain giúp bạn kiểm tra chính xác nguồn gốc,
            thời hạn và chất lượng của từng hộp sữa chỉ trong 1 giây.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="d-flex gap-3 justify-content-center flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary-gradient btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg d-flex align-items-center"
              onClick={onStart}
            >
              Tra Cứu Ngay <ArrowRight size={20} className="ms-2" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-white btn-lg rounded-pill px-5 py-3 fw-bold shadow-sm text-primary"
              onClick={scrollToContent}
            >
              Tìm Hiểu Thêm
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* [ĐÃ SỬA] CAROUSEL TRƯỢT (SLIDE EFFECT) */}
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
            {/* Slide Images */}
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

            {/* Controls */}
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

            {/* Indicators */}
            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2 z-1">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 1 : -1);
                    setCurrentSlide(index);
                  }}
                  className={`btn p-0 rounded-circle transition-all ${
                    index === currentSlide
                      ? "bg-white"
                      : "bg-white bg-opacity-50"
                  }`}
                  style={{ width: "12px", height: "12px", border: "none" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NEWS SECTION */}
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
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="p-4 rounded-4 bg-white shadow-sm h-100">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <ShieldCheck size={32} className="text-primary" />
                </div>
                <h5 className="fw-bold">Bảo Mật Cao</h5>
                <p className="text-muted small">
                  Thông tin được mã hóa SHA-256, ngăn chặn mọi hành vi gian lận.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 rounded-4 bg-white shadow-sm h-100">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <Truck size={32} className="text-success" />
                </div>
                <h5 className="fw-bold">Minh Bạch Vận Chuyển</h5>
                <p className="text-muted small">
                  Theo dõi lộ trình từ nhà máy, kho vận đến cửa hàng bán lẻ.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-4 rounded-4 bg-white shadow-sm h-100">
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                  <Award size={32} className="text-warning" />
                </div>
                <h5 className="fw-bold">Chuẩn Quốc Tế</h5>
                <p className="text-muted small">
                  Tuân thủ nghiêm ngặt các tiêu chuẩn ISO và HACCP về an toàn
                  sữa.
                </p>
              </div>
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
