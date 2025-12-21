import React, { useMemo } from "react";
import { View, Dimensions, StyleSheet, ScrollView, Text as RNText } from "react-native";
import { Text } from "react-native-paper";
import { PieChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons";
import { 
  FONT_SIZES, 
  SPACING, 
  BORDER_RADIUS, 
  ICON_SIZES,
  GAPS,
  getResponsiveHeight,
  getResponsiveWidth
} from "../utils/ResponsiveUtils";

// Bảng màu hiện đại cho các danh mục
const CATEGORY_COLORS = {
  "Ăn uống": "#FF6B6B",
  "Mua sắm": "#4ECDC4", 
  "Di chuyển": "#FFD166",
  "Giải trí": "#A78BFA",
  "Hóa đơn": "#34D399",
  "Y tế": "#60A5FA",
  "Tiết kiệm": "#8B5CF6",
  "Khác": "#F59E0B"
};

// Map icon cho từng danh mục
const CATEGORY_ICONS = {
  "Ăn uống": "fast-food-outline",
  "Mua sắm": "bag-outline",
  "Di chuyển": "car-outline",
  "Giải trí": "play-circle-outline",
  "Hóa đơn": "document-outline",
  "Y tế": "medical-outline",
  "Tiết kiệm": "wallet-outline",
  "Khác": "ellipsis-horizontal-outline"
};

// Format tiền tệ thông minh
const formatCurrency = (amount) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return Math.round(amount).toString();
};

// Format tiền đầy đủ
const formatFullCurrency = (amount) => {
  return amount.toLocaleString("vi-VN");
};

export default function CategoryChart({ expenses }) {
  // Memoize dữ liệu để tránh tính toán lại không cần thiết
  const { chartData, totalAmount } = useMemo(() => {
    const tempCategoryTotals = {};
    let tempTotalAmount = 0;
    
    // Tính tổng chi tiêu theo danh mục
    expenses.forEach(exp => {
      if (exp.category && exp.amount) {
        tempCategoryTotals[exp.category] = (tempCategoryTotals[exp.category] || 0) + exp.amount;
        tempTotalAmount += exp.amount;
      }
    });

    // Chuyển đổi dữ liệu cho biểu đồ và sắp xếp theo số tiền giảm dần
    const tempChartData = Object.keys(tempCategoryTotals)
      .map((category) => {
        const amount = tempCategoryTotals[category];
        const percentage = tempTotalAmount > 0 ? ((amount / tempTotalAmount) * 100).toFixed(1) : 0;
        
        return {
          name: category,
          population: amount,
          color: CATEGORY_COLORS[category] || "#E5E7EB",
          legendFontColor: "#374151",
          legendFontSize: 12,
          percentage: percentage,
          icon: CATEGORY_ICONS[category] || "ellipsis-horizontal-outline"
        };
      })
      .sort((a, b) => b.population - a.population);

    return {
      chartData: tempChartData,
      totalAmount: tempTotalAmount
    };
  }, [expenses]);

  const screenWidth = Dimensions.get("window").width - 60;
  
  const chartCenterX = screenWidth / 4;

  // Nếu không có dữ liệu
  if (expenses.length === 0 || totalAmount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Chưa có chi tiêu</Text>
          <Text style={styles.emptySubtitle}>Thêm chi tiêu để xem phân bố</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="pie-chart" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Phân bố chi tiêu</Text>
        </View>
        <Text style={styles.totalText}>
          Tổng: <Text style={styles.totalAmount}>{formatFullCurrency(totalAmount)} ₫</Text>
        </Text>
      </View>

      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      >
        {/* Biểu đồ */}
        <View style={styles.chartSection}>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={screenWidth}
              height={280}
              chartConfig={{
                color: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
                strokeWidth: 2,
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#f8fafc",
                style: {
                  borderRadius: 20,
                },
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              center={[chartCenterX, 0]}
              hasLegend={false}
              absolute={false}
            />
          </View>
        </View>

        {/* Chi tiết danh mục */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Chi tiết</Text>
            <Text style={styles.itemCount}>{chartData.length} danh mục</Text>
          </View>

          <View style={styles.categoriesList}>
            {chartData.map((item, index) => (
              <View key={index} style={[styles.categoryCard, index !== chartData.length - 1 && styles.categoryCardBorder]}>
                {/* Icon và thông tin bên trái */}
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryIconBg, { backgroundColor: item.color + "20" }]}>
                    <Ionicons 
                      name={item.icon} 
                      size={20} 
                      color={item.color} 
                    />
                  </View>
                  
                  <View style={styles.categoryTextInfo}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <View style={styles.percentageBar}>
                      <View 
                        style={[
                          styles.percentageBarFill, 
                          { 
                            backgroundColor: item.color,
                            width: `${Math.min(item.percentage, 100)}%`
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>

                {/* Số tiền và phần trăm bên phải */}
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>
                    {formatFullCurrency(item.population)} ₫
                  </Text>
                  <Text style={styles.categoryPercentage}>
                    {item.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Tổng cộng */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIconBg}>
                <Ionicons name="calculator" size={20} color="#fff" />
              </View>
              <Text style={styles.summaryLabel}>Tổng cộng</Text>
            </View>
            <Text style={styles.summaryAmount}>
              {formatFullCurrency(totalAmount)} ₫
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 0,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: GAPS.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES["2xl"],
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -0.5,
  },
  totalText: {
    fontSize: FONT_SIZES.sm,
    color: "#6b7280",
    fontWeight: "500",
  },
  totalAmount: {
    color: "#059669",
    fontWeight: "700",
    fontSize: FONT_SIZES.base,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  chartSection: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.xl,
    padding: 0,
    marginBottom: SPACING.xl,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    width: "100%",
    backgroundColor: "#f8fafc",
  },
  detailsSection: {
    marginBottom: SPACING.xl,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  detailsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: "#1f2937",
  },
  itemCount: {
    fontSize: FONT_SIZES.xs,
    color: "#9ca3af",
    fontWeight: "500",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  categoriesList: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: "#fff",
  },
  categoryCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  categoryLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: GAPS.md,
  },
  categoryIconBg: {
    width: ICON_SIZES.md,
    height: ICON_SIZES.md,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryTextInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZES.base,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: SPACING.xs,
  },
  percentageBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  percentageBarFill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryRight: {
    alignItems: "flex-end",
    marginLeft: SPACING.md,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.base,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: SPACING.xs,
  },
  categoryPercentage: {
    fontSize: FONT_SIZES.xs,
    color: "#9ca3af",
    fontWeight: "500",
  },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAPS.md,
  },
  summaryIconBg: {
    width: ICON_SIZES.md,
    height: ICON_SIZES.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: "600",
    color: "#fff",
  },
  summaryAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: "#fff",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: getResponsiveHeight(15),
    backgroundColor: "#fff",
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.base,
    color: "#9ca3af",
    marginTop: SPACING.sm,
  },
});