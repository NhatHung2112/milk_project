// Gộp chung server nên API sẽ gọi thẳng vào chính domain hiện tại
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Cấu hình Header mặc định để vượt rào cảnh báo của Ngrok
const defaultHeaders = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

export const api = {
  getProducts: async () => {
    const res = await fetch(`${API_URL}/products`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    return res.json();
  },

  createProduct: async (productData) => {
    const res = await fetch(`${API_URL}/create_product`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify(productData),
    });
    return res.json();
  },

  createProductsBulk: async (products) => {
    try {
      const res = await fetch(`${API_URL}/create_products_bulk`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({ products }),
      });
      return await res.json();
    } catch (e) {
      console.error("Lỗi Bulk Import:", e);
      return { status: "error", message: e.message };
    }
  },

  verifyProduct: async (uid) => {
    const res = await fetch(`${API_URL}/verify/${uid}`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
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
      headers: defaultHeaders,
      body: JSON.stringify({ uid, location, status, action_type, username }),
    });
  },

  getHistory: async () => {
    const res = await fetch(`${API_URL}/scan_history`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    return res.json();
  },

  getUserHistory: async (username) => {
    const res = await fetch(`${API_URL}/user_history/${username}`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    return res.json();
  },

  askAI: async (productName, question) => {
    const res = await fetch(`${API_URL}/ask_ai`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({ product_name: productName, question }),
    });
    return res.json();
  },

  register: async (userData) => {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify(userData),
    });
    return res.json();
  },

  login: async (credentials) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  updateProfile: async (userData) => {
    const res = await fetch(`${API_URL}/update_profile`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify(userData),
    });
    return res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${API_URL}/users`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    return res.json();
  },

  updateProduct: async (uid, productData) => {
    const res = await fetch(`${API_URL}/update_product/${uid}`, {
      method: "PUT",
      headers: defaultHeaders,
      body: JSON.stringify(productData),
    });
    return res.json();
  },

  deleteProduct: async (uid) => {
    const res = await fetch(`${API_URL}/delete_product/${uid}`, {
      method: "DELETE",
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    return res.json();
  },

  deleteProductsBulk: async (uids) => {
    const res = await fetch(`${API_URL}/delete_products_bulk`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({ uids }),
    });
    return res.json();
  },
};
