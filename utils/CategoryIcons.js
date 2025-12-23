// Category icon mapping and utilities
const CATEGORY_COLORS = {
  "Ăn uống": "#ef4444",
  "Mua sắm": "#3b82f6",
  "Di chuyển": "#f59e0b",
  "Giải trí": "#8b5cf6",
  "Hóa đơn": "#10b981",
  "Y tế": "#ec4899",
  "Tiết kiệm": "#06b6d4",
  "Lương chính": "#22c55e",
  "Thưởng": "#f59e0b",
  "Thu nhập thêm": "#a855f7",
  "Khác": "#6b7280",
};

const CATEGORY_ICONS = {
  "Ăn uống": "restaurant",
  "Mua sắm": "bag-handle",
  "Di chuyển": "car",
  "Giải trí": "game-controller",
  "Hóa đơn": "document-text",
  "Y tế": "medical",
  "Tiết kiệm": "wallet",
  "Lương chính": "briefcase",
  "Thưởng": "gift",
  "Thu nhập thêm": "trending-up",
  "Khác": "ellipsis-horizontal-circle",
};

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || "#6b7280";
};

export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || "document-outline";
};

export const COLORS = CATEGORY_COLORS;
export const ICONS = CATEGORY_ICONS;
