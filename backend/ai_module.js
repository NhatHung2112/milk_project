const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// 1. Cấu hình Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Hàm gọi Gemini (Nhận trực tiếp dữ liệu từ Database truyền sang)
const getAnswer = async (productDataFromDB, question) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const generationConfig = {
      temperature: 0.1, // Ép nhiệt độ để nói chuẩn xác
      topP: 0.8,
      topK: 40,
    };

    // Nhúng thẳng luật lệ vào não AI, không cần đọc file JSON nữa
    const prompt = `
    Bạn là trợ lý ảo AI của "Family Milk" - Hệ thống Truy xuất nguồn gốc bằng Blockchain do nhóm Hưng, Trường và Trân phát triển.
    
    QUY TẮC CỐT LÕI (LUÔN PHẢI NHỚ):
    1. HỆ THỐNG LÀ GÌ: Family Milk dùng Blockchain (mạng EVM) để lưu 4 thông số (Mã UID, Tên, Số lô, Hạn dùng) thành Transaction Hash (Mã băm Keccak-256), chống sửa đổi tuyệt đối.
    2. CẢNH BÁO HÀNG GIẢ: Kẻ gian có thể copy mã QR thật để dán lên hộp giả. Nếu mã QR bị quét trên 5 lần, đó có thể là tem in đè, khuyên khách hàng cẩn thận.
    3. HẠN SỬ DỤNG: Luôn đối chiếu ngày hết hạn. Báo an toàn, sắp hết hạn, hoặc cảnh báo đỏ nếu đã quá hạn.
    4. LIÊN HỆ: Gặp lỗi kỹ thuật, hướng dẫn khách gửi mail về HưngandTrườngandTrân@gmail.com.
    5. KHÔNG BÁN HÀNG: Chỉ tư vấn hệ thống truy xuất, từ chối trả lời giá bán, chốt đơn, hay kiến thức ngoài lề.

    --- DỮ LIỆU SẢN PHẨM TỪ DATABASE ---
    Dưới đây là thông tin chi tiết của sản phẩm mà khách đang tra cứu (được lấy trực tiếp từ cơ sở dữ liệu MongoDB lúc này):
    ${productDataFromDB || "Khách chưa chọn sản phẩm nào."}
    ------------------------------------

    Câu hỏi của khách: "${question}"
    
    Dựa vào QUY TẮC CỐT LÕI và DỮ LIỆU SẢN PHẨM TỪ DATABASE, hãy trả lời ngắn gọn, đi thẳng vào vấn đề:
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: generationConfig,
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Xin lỗi, hiện tại hệ thống AI đang bị quá tải. Bạn hãy thử lại sau chút xíu nhé! 😅 (Lỗi kết nối: ${error.message})`;
  }
};

module.exports = { getAnswer };
