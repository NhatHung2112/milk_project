const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  getProducts: async () => {
    const res = await fetch(`${API_URL}/products`);
    return res.json();
  },

  createProduct: async (productData) => {
    const res = await fetch(`${API_URL}/create_product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    return res.json();
  },

  createProductsBulk: async (products) => {
    try {
      const res = await fetch(`${API_URL}/create_products_bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      return await res.json();
    } catch (e) {
      console.error("Lỗi Bulk Import:", e);
      return { status: "error", message: e.message };
    }
  },

  verifyProduct: async (uid) => {
    const res = await fetch(`${API_URL}/verify/${uid}`);
    return res.json();
  },

  recordScan: async (
    uid,
    location,
    status = "valid",
    action_type = "view",
    username = "Khách",
  ) => {
    await fetch(`${API_URL}/record_scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, location, status, action_type, username }),
    });
  },

  getHistory: async () => {
    const res = await fetch(`${API_URL}/scan_history`);
    return res.json();
  },

  getUserHistory: async (username) => {
    const res = await fetch(`${API_URL}/user_history/${username}`);
    return res.json();
  },

  askAI: async (productName, question) => {
    const res = await fetch(`${API_URL}/ask_ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_name: productName, question }),
    });
    return res.json();
  },

  register: async (userData) => {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return res.json();
  },

  login: async (credentials) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  // [MỚI] Hàm cập nhật thông tin
  updateProfile: async (userData) => {
    const res = await fetch(`${API_URL}/update_profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`);
    return res.json();
  },
};
