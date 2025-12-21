import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Định nghĩa các breakpoint
const BREAKPOINTS = {
  small: 0,      // < 480px
  medium: 480,   // 480-768px
  large: 768,    // 768-1024px
  xlarge: 1024,  // >= 1024px
};

// Xác định kích thước hiện tại
export const getDeviceSize = () => {
  if (width >= BREAKPOINTS.xlarge) return "xlarge";
  if (width >= BREAKPOINTS.large) return "large";
  if (width >= BREAKPOINTS.medium) return "medium";
  return "small";
};

// Hàm tính toán kích thước responsive
export const getResponsiveValue = (small, medium, large, xlarge) => {
  const size = getDeviceSize();
  switch (size) {
    case "xlarge":
      return xlarge || large || medium || small;
    case "large":
      return large || medium || small;
    case "medium":
      return medium || small;
    default:
      return small;
  }
};

// Responsive font sizes
export const FONT_SIZES = {
  xs: getResponsiveValue(10, 11, 12, 13),
  sm: getResponsiveValue(12, 13, 14, 15),
  base: getResponsiveValue(14, 15, 16, 17),
  lg: getResponsiveValue(16, 18, 20, 22),
  xl: getResponsiveValue(18, 20, 22, 24),
  "2xl": getResponsiveValue(20, 22, 24, 26),
  "3xl": getResponsiveValue(24, 26, 28, 32),
};

// Responsive padding/margin
export const SPACING = {
  xs: getResponsiveValue(4, 4, 4, 4),
  sm: getResponsiveValue(8, 8, 8, 8),
  md: getResponsiveValue(12, 12, 16, 16),
  lg: getResponsiveValue(16, 16, 20, 20),
  xl: getResponsiveValue(20, 20, 24, 24),
  "2xl": getResponsiveValue(24, 28, 32, 32),
};

// Responsive border radius
export const BORDER_RADIUS = {
  sm: getResponsiveValue(6, 8, 8, 10),
  md: getResponsiveValue(8, 10, 12, 12),
  lg: getResponsiveValue(12, 14, 16, 16),
  xl: getResponsiveValue(16, 18, 20, 20),
};

// Responsive icon sizes
export const ICON_SIZES = {
  xs: getResponsiveValue(16, 18, 20, 22),
  sm: getResponsiveValue(20, 22, 24, 26),
  md: getResponsiveValue(24, 28, 32, 36),
  lg: getResponsiveValue(32, 36, 40, 44),
  xl: getResponsiveValue(40, 48, 56, 64),
};

// Width responsive
export const getResponsiveWidth = (percentage) => {
  return (width * percentage) / 100;
};

// Height responsive
export const getResponsiveHeight = (percentage) => {
  return (height * percentage) / 100;
};

// Min width untuk cards
export const getCardMinWidth = () => {
  return getResponsiveValue(
    (width - 40) / 2,  // small: 2 cards
    (width - 48) / 2,  // medium: 2 cards
    (width - 56) / 3,  // large: 3 cards
    (width - 64) / 4   // xlarge: 4 cards
  );
};

// Flex gap responsive
export const GAPS = {
  xs: getResponsiveValue(4, 4, 4, 4),
  sm: getResponsiveValue(6, 8, 8, 8),
  md: getResponsiveValue(8, 10, 12, 12),
  lg: getResponsiveValue(12, 14, 16, 16),
  xl: getResponsiveValue(16, 18, 20, 20),
};

// Line height responsive
export const LINE_HEIGHTS = {
  tight: getResponsiveValue(1.2, 1.2, 1.3, 1.3),
  normal: getResponsiveValue(1.4, 1.5, 1.5, 1.6),
  relaxed: getResponsiveValue(1.6, 1.6, 1.7, 1.8),
};

export default {
  getDeviceSize,
  getResponsiveValue,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  ICON_SIZES,
  getResponsiveWidth,
  getResponsiveHeight,
  getCardMinWidth,
  GAPS,
  LINE_HEIGHTS,
};
