// Theme configuration cho toàn bộ ứng dụng
import { FONT_SIZES, SPACING, BORDER_RADIUS, GAPS } from "./ResponsiveUtils";

export const APP_THEME = {
  colors: {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
    
    // Gray scale
    gray50: "#f9fafb",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",
    gray700: "#374151",
    gray800: "#1f2937",
    gray900: "#111827",
    
    // Semantic colors
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceHover: "#f3f4f6",
    border: "#e5e7eb",
    text: "#1f2937",
    textSecondary: "#6b7280",
    textTertiary: "#9ca3af",
  },
  
  spacing: SPACING,
  gaps: GAPS,
  borderRadius: BORDER_RADIUS,
  fontSizes: FONT_SIZES,
  
  shadow: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
  },
  
  radius: {
    xs: BORDER_RADIUS.sm,
    sm: BORDER_RADIUS.md,
    md: BORDER_RADIUS.lg,
    lg: BORDER_RADIUS.xl,
  },
};

// Common component styles
export const COMMON_STYLES = {
  // Card styles
  card: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.radius.md,
    padding: APP_THEME.spacing.lg,
    ...APP_THEME.shadow.md,
  },
  
  // Button styles
  button: {
    paddingVertical: APP_THEME.spacing.md,
    paddingHorizontal: APP_THEME.spacing.lg,
    borderRadius: APP_THEME.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  
  buttonSmall: {
    paddingVertical: APP_THEME.spacing.sm,
    paddingHorizontal: APP_THEME.spacing.md,
    borderRadius: APP_THEME.radius.sm,
  },
  
  buttonLarge: {
    paddingVertical: APP_THEME.spacing.lg,
    paddingHorizontal: APP_THEME.spacing.xl,
    borderRadius: APP_THEME.radius.lg,
  },
  
  // Input styles
  input: {
    paddingVertical: APP_THEME.spacing.md,
    paddingHorizontal: APP_THEME.spacing.md,
    borderRadius: APP_THEME.radius.md,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
    fontSize: APP_THEME.fontSizes.base,
    color: APP_THEME.colors.text,
  },
  
  // Text styles
  h1: {
    fontSize: APP_THEME.fontSizes["3xl"],
    fontWeight: "700",
    color: APP_THEME.colors.text,
    lineHeight: 32,
  },
  
  h2: {
    fontSize: APP_THEME.fontSizes["2xl"],
    fontWeight: "700",
    color: APP_THEME.colors.text,
    lineHeight: 28,
  },
  
  h3: {
    fontSize: APP_THEME.fontSizes.xl,
    fontWeight: "700",
    color: APP_THEME.colors.text,
    lineHeight: 24,
  },
  
  body: {
    fontSize: APP_THEME.fontSizes.base,
    fontWeight: "400",
    color: APP_THEME.colors.text,
    lineHeight: 20,
  },
  
  caption: {
    fontSize: APP_THEME.fontSizes.sm,
    fontWeight: "400",
    color: APP_THEME.colors.textSecondary,
    lineHeight: 16,
  },
  
  // Flex layout
  flexCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  
  flexBetween: {
    justifyContent: "space-between",
    alignItems: "center",
  },
};

export default APP_THEME;
