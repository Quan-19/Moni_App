import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons";
import monthlyManager from "../../utils/monthlyManager";
import { 
  FONT_SIZES, 
  SPACING, 
  BORDER_RADIUS, 
  ICON_SIZES,
  GAPS,
  getResponsiveHeight
} from "../../utils/ResponsiveUtils";

const screenWidth = Dimensions.get("window").width;

const MonthlyStatsTab = () => {
  const allExpenses = useSelector((state) => state.expenses.items);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [allMonthsData, setAllMonthsData] = useState([]);
  const [chartType, setChartType] = useState("combined"); // 'amount', 'count', 'combined'
  const [viewMode, setViewMode] = useState("chart"); // 'chart', 'table'

  // Format số tiền thông minh
  const formatSmartCurrency = (amount) => {
    if (amount === 0) return "0 ₫";

    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} tỷ`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} tr`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toLocaleString("vi-VN") + " ₫";
  };

  // Format số đầy đủ khi cần
  const formatFullCurrency = (amount) => {
    return amount.toLocaleString("vi-VN") + " ₫";
  };

  // Lấy tất cả các năm có trong dữ liệu
  const getAvailableYears = () => {
    const years = new Set();
    allMonthsData.forEach((month) => {
      const year = new Date(month.startDate).getFullYear();
      years.add(year);
    });

    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }

    return Array.from(years).sort((a, b) => b - a);
  };

  // Tính toán dữ liệu thống kê
  const calculateStats = async () => {
    try {
      setLoading(true);

      // Lấy tất cả tháng từ monthly manager
      const currentMonth = monthlyManager.getCurrentMonthInfo();
      const archivedMonths = monthlyManager.getArchivedMonths();

      const allMonths = [...archivedMonths];
      if (currentMonth) {
        allMonths.push(currentMonth);
      }

      allMonths.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setAllMonthsData(allMonths);

      // Lọc dữ liệu theo năm được chọn
      const filteredMonths = allMonths.filter((month) => {
        const year = new Date(month.startDate).getFullYear();
        return year === selectedYear;
      });

      // Tạo dữ liệu cho 12 tháng của năm
      const months = [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
      ];

      const monthlyDataTemp = months.map((monthName, index) => {
        const monthData = filteredMonths.find((month) => {
          const date = new Date(month.startDate);
          return (
            date.getMonth() === index && date.getFullYear() === selectedYear
          );
        });

        // Tính trung bình mỗi giao dịch
        let avgPerTransaction = 0;
        if (monthData && monthData.expenses.length > 0) {
          avgPerTransaction = monthData.total / monthData.expenses.length;
        }

        return {
          month: monthName,
          fullMonth: `Tháng ${index + 1}`,
          amount: monthData ? monthData.total : 0,
          count: monthData ? monthData.expenses.length : 0,
          monthNumber: index + 1,
          monthId: monthData ? monthData.id : null,
          avgPerTransaction,
          hasData: !!monthData && monthData.expenses.length > 0,
        };
      });

      setMonthlyData(monthlyDataTemp);
    } catch (error) {
      console.error("Error calculating stats:", error);
      Alert.alert("Lỗi", "Không thể tính toán thống kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [allExpenses, selectedYear]);

  // Tính tổng chi tiêu của năm
  const getYearTotal = () => {
    return monthlyData.reduce((sum, month) => sum + month.amount, 0);
  };

  // Tính trung bình chi tiêu mỗi tháng
  const getMonthlyAverage = () => {
    const monthsWithData = monthlyData.filter((month) => month.amount > 0);
    if (monthsWithData.length === 0) return 0;
    return getYearTotal() / monthsWithData.length;
  };

  // Tính tổng số giao dịch
  const getYearTransactionCount = () => {
    return monthlyData.reduce((sum, month) => sum + month.count, 0);
  };

  // Tính trung bình giá trị mỗi giao dịch
  const getAverageTransactionValue = () => {
    const totalAmount = getYearTotal();
    const totalTransactions = getYearTransactionCount();
    return totalTransactions > 0 ? totalAmount / totalTransactions : 0;
  };

  // Chuẩn bị dữ liệu cho biểu đồ
  const prepareChartData = () => {
    const labels = monthlyData.map((item) => item.month);

    if (chartType === "amount") {
      return {
        labels,
        datasets: [
          {
            data: monthlyData.map((item) => item.amount),
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Xanh dương cho số tiền
            strokeWidth: 2,
            label: "Số tiền",
            withDots: true,
          },
        ],
      };
    } else if (chartType === "count") {
      return {
        labels,
        datasets: [
          {
            data: monthlyData.map((item) => item.count),
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Xanh lá cho số giao dịch
            strokeWidth: 2,
            label: "Số giao dịch",
            withDots: true,
          },
        ],
      };
    } else if (chartType === "combined") {
      // Tạo biểu đồ kết hợp với 2 trục Y
      // Normalize dữ liệu số tiền để phù hợp với scale của số giao dịch
      const maxAmount = Math.max(...monthlyData.map((item) => item.amount), 1);
      const maxCount = Math.max(...monthlyData.map((item) => item.count), 1);
      const scale = maxCount / maxAmount;

      return {
        labels,
        datasets: [
          {
            data: monthlyData.map((item) => item.amount * scale),
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Xanh dương
            strokeWidth: 2.5,
            label: "Số tiền (₫)",
            withDots: true,
            dotColor: "#3b82f6",
            dotSize: 6,
          },
          {
            data: monthlyData.map((item) => item.count),
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Xanh lá
            strokeWidth: 2.5,
            label: "Số giao dịch",
            withDots: true,
            dotColor: "#10b981",
            dotSize: 6,
          },
        ],
      };
    }
  };

  // Cấu hình biểu đồ
  const getChartConfig = () => {
    const baseConfig = {
      backgroundColor: "#ffffff",
      backgroundGradientFrom: "#ffffff",
      backgroundGradientTo: "#ffffff",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForLabels: {
        fontSize: 10,
        fontWeight: "500",
      },
      propsForBackgroundLines: {
        strokeWidth: 1,
        stroke: "#e5e7eb",
      },
      propsForDots: {
        r: "4",
        strokeWidth: "2",
      },
    };

    if (chartType === "combined") {
      return {
        ...baseConfig,
        formatYLabel: (value) => {
          // Hiển thị giá trị đã normalize
          return Math.round(value).toString();
        },
      };
    } else if (chartType === "amount") {
      return {
        ...baseConfig,
        formatYLabel: (value) => formatSmartCurrency(value),
      };
    } else {
      return {
        ...baseConfig,
        formatYLabel: (value) => Math.round(value).toString(),
      };
    }
  };

  // Tìm tháng có chi tiêu cao nhất
  const getMaxSpendingMonth = () => {
    const monthsWithData = monthlyData.filter((month) => month.hasData);
    if (monthsWithData.length === 0) return null;

    return monthsWithData.reduce((prev, current) =>
      prev.amount > current.amount ? prev : current
    );
  };

  // Tìm tháng có chi tiêu thấp nhất
  const getMinSpendingMonth = () => {
    const monthsWithData = monthlyData.filter((month) => month.hasData);
    if (monthsWithData.length === 0) return null;

    return monthsWithData.reduce((prev, current) =>
      prev.amount < current.amount ? prev : current
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tải thống kê...</Text>
      </View>
    );
  }

  const yearTotal = getYearTotal();
  const monthlyAverage = getMonthlyAverage();
  const transactionCount = getYearTransactionCount();
  const avgTransactionValue = getAverageTransactionValue();
  const hasData = monthlyData.some((month) => month.hasData);
  const maxMonth = getMaxSpendingMonth();
  const minMonth = getMinSpendingMonth();
  const chartData = prepareChartData();
  const chartConfig = getChartConfig();

  // Tính chiều rộng biểu đồ
  const chartWidth = Math.max(screenWidth * 1.2, screenWidth);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Thống Kê {selectedYear}</Text>
        <Text style={styles.headerSubtitle}>
          {hasData
            ? `Đã chi ${formatSmartCurrency(yearTotal)} trong năm`
            : "Chưa có chi tiêu"}
        </Text>
      </View>

      {/* Year Selector */}
      <View style={styles.selectorRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.yearScroll}
        >
          {getAvailableYears().map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.yearButtonActive,
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text
                style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.yearButtonTextActive,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewModeSelector}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "chart" && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode("chart")}
        >
          <Ionicons
            name="bar-chart-outline"
            size={20}
            color={viewMode === "chart" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === "chart" && styles.viewModeTextActive,
            ]}
          >
            Biểu đồ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === "table" && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode("table")}
        >
          <Ionicons
            name="grid-outline"
            size={20}
            color={viewMode === "table" ? "#fff" : "#6b7280"}
          />
          <Text
            style={[
              styles.viewModeText,
              viewMode === "table" && styles.viewModeTextActive,
            ]}
          >
            Bảng số liệu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart Type Selector */}
      {viewMode === "chart" && (
        <View style={styles.chartTypeSelector}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "amount" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("amount")}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={chartType === "amount" ? "#fff" : "#6b7280"}
            />
            <Text
              style={[
                styles.chartTypeText,
                chartType === "amount" && styles.chartTypeTextActive,
              ]}
            >
              Số tiền
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "count" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("count")}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={chartType === "count" ? "#fff" : "#6b7280"}
            />
            <Text
              style={[
                styles.chartTypeText,
                chartType === "count" && styles.chartTypeTextActive,
              ]}
            >
              Số giao dịch
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === "combined" && styles.chartTypeButtonActive,
            ]}
            onPress={() => setChartType("combined")}
          >
            <Ionicons
              name="layers-outline"
              size={16}
              color={chartType === "combined" ? "#fff" : "#6b7280"}
            />
            <Text
              style={[
                styles.chartTypeText,
                chartType === "combined" && styles.chartTypeTextActive,
              ]}
            >
              Kết hợp
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "#dbeafe" }]}>
            <Ionicons name="cash-outline" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.summaryValue}>
            {formatSmartCurrency(yearTotal)}
          </Text>
          <Text style={styles.summaryLabel}>Tổng chi</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "#dcfce7" }]}>
            <Ionicons name="calendar-outline" size={20} color="#16a34a" />
          </View>
          <Text style={styles.summaryValue}>
            {formatSmartCurrency(monthlyAverage)}
          </Text>
          <Text style={styles.summaryLabel}>TB/tháng</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "#fef3c7" }]}>
            <Ionicons name="receipt-outline" size={20} color="#d97706" />
          </View>
          <Text style={styles.summaryValue}>{transactionCount}</Text>
          <Text style={styles.summaryLabel}>Giao dịch</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "#f3e8ff" }]}>
            <Ionicons name="trending-up-outline" size={20} color="#7c3aed" />
          </View>
          <Text style={styles.summaryValue}>
            {formatSmartCurrency(avgTransactionValue)}
          </Text>
          <Text style={styles.summaryLabel}>TB/giao dịch</Text>
        </View>
      </View>

      {/* Chart View */}
      {viewMode === "chart" && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {chartType === "amount"
              ? "Số tiền chi tiêu"
              : chartType === "count"
              ? "Số giao dịch"
              : "So sánh chi tiêu & số giao dịch"}
          </Text>

          {hasData ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.chartScrollContent}
            >
              <View style={styles.chartWrapper}>
                {chartType === "count" ? (
                  <BarChart
                    data={chartData}
                    width={chartWidth}
                    height={280}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars={false}
                    yAxisLabel=""
                    yAxisSuffix=""
                    verticalLabelRotation={0}
                    segments={4}
                    withInnerLines={true}
                    withHorizontalLabels={true}
                    withVerticalLabels={true}
                    yLabelsOffset={10}
                    xLabelsOffset={-5}
                    barPercentage={0.7}
                    showBarTops={false}
                  />
                ) : (
                  <LineChart
                    data={chartData}
                    width={chartWidth}
                    height={280}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    fromZero
                    bezier
                    yAxisLabel=""
                    yAxisSuffix=""
                    verticalLabelRotation={0}
                    segments={4}
                    withInnerLines={true}
                    withHorizontalLabels={true}
                    withVerticalLabels={true}
                    withDots={true}
                    yLabelsOffset={10}
                    xLabelsOffset={-5}
                  />
                )}

                {/* Legend */}
                <View style={styles.legendContainer}>
                  {chartType === "combined" ? (
                    <>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: "#3b82f6" },
                          ]}
                        />
                        <Text style={styles.legendText}>Số tiền (₫)</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: "#10b981" },
                          ]}
                        />
                        <Text style={styles.legendText}>Số giao dịch</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendColor,
                          {
                            backgroundColor:
                              chartType === "amount" ? "#3b82f6" : "#10b981",
                          },
                        ]}
                      />
                      <Text style={styles.legendText}>
                        {chartType === "amount"
                          ? "Số tiền (₫)"
                          : "Số giao dịch"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="stats-chart-outline" size={60} color="#d1d5db" />
              <Text style={styles.noDataText}>
                Chưa có dữ liệu cho {selectedYear}
              </Text>
              <Text style={styles.noDataSubtext}>
                Thêm chi tiêu để xem biểu đồ
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Bảng số liệu chi tiết</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.tableCellMonth]}>
              Tháng
            </Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellAmount]}>
              Số tiền
            </Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellCount]}>
              Số GD
            </Text>
            <Text style={[styles.tableHeaderCell, styles.tableCellAvg]}>
              TB/GD
            </Text>
          </View>

          <ScrollView style={styles.tableBody}>
            {monthlyData.map((month, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  month.hasData && styles.tableRowHasData,
                  index % 2 === 0 && styles.tableRowEven,
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCellMonth]}>
                  {month.month}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellAmount,
                    !month.hasData && styles.tableCellEmpty,
                  ]}
                >
                  {month.hasData ? formatSmartCurrency(month.amount) : "--"}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellCount,
                    !month.hasData && styles.tableCellEmpty,
                  ]}
                >
                  {month.hasData ? month.count : "--"}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellAvg,
                    !month.hasData && styles.tableCellEmpty,
                  ]}
                >
                  {month.hasData
                    ? formatSmartCurrency(month.avgPerTransaction)
                    : "--"}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Summary Row */}
          <View style={styles.tableSummary}>
            <Text
              style={[
                styles.tableCell,
                styles.tableCellMonth,
                styles.tableSummaryText,
              ]}
            >
              Tổng
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.tableCellAmount,
                styles.tableSummaryText,
              ]}
            >
              {formatSmartCurrency(yearTotal)}
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.tableCellCount,
                styles.tableSummaryText,
              ]}
            >
              {transactionCount}
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.tableCellAvg,
                styles.tableSummaryText,
              ]}
            >
              {formatSmartCurrency(avgTransactionValue)}
            </Text>
          </View>
        </View>
      )}

      {/* Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>📈 Phân tích nổi bật</Text>

        <View style={styles.insightItem}>
          <Ionicons name="trophy-outline" size={20} color="#f59e0b" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Tháng chi nhiều nhất</Text>
            <Text style={styles.insightValue}>
              {maxMonth
                ? `${maxMonth.fullMonth}: ${formatSmartCurrency(
                    maxMonth.amount
                  )}`
                : "--"}
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <Ionicons name="leaf-outline" size={20} color="#10b981" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Tháng tiết kiệm nhất</Text>
            <Text style={styles.insightValue}>
              {minMonth
                ? `${minMonth.fullMonth}: ${formatSmartCurrency(
                    minMonth.amount
                  )}`
                : "--"}
            </Text>
          </View>
        </View>

        <View style={styles.insightItem}>
          <Ionicons name="calculator-outline" size={20} color="#8b5cf6" />
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Trung bình tháng</Text>
            <Text style={styles.insightValue}>
              {monthlyAverage > 0
                ? `${formatSmartCurrency(monthlyAverage)} (${
                    monthlyData.filter((m) => m.hasData).length
                  }/12 tháng có chi)`
                : "--"}
            </Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Mẹo quản lý chi tiêu</Text>

        <View style={styles.tipItem}>
          <View style={styles.tipBullet}>
            <Text style={styles.tipBulletText}>•</Text>
          </View>
          <Text style={styles.tipText}>
            Giữ mức chi tháng dưới {formatSmartCurrency(monthlyAverage * 1.1)}{" "}
            (tăng 10% so với TB)
          </Text>
        </View>

        <View style={styles.tipItem}>
          <View style={styles.tipBullet}>
            <Text style={styles.tipBulletText}>•</Text>
          </View>
          <Text style={styles.tipText}>
            Hạn chế giao dịch nhỏ lẻ dưới{" "}
            {formatSmartCurrency(avgTransactionValue * 0.3)}
          </Text>
        </View>

        <View style={styles.tipItem}>
          <View style={styles.tipBullet}>
            <Text style={styles.tipBulletText}>•</Text>
          </View>
          <Text style={styles.tipText}>
            Tháng sau, cố gắng chi ít hơn{" "}
            {maxMonth ? formatSmartCurrency(maxMonth.amount) : "tháng cao nhất"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  selectorRow: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  yearScroll: {
    maxHeight: 40,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    marginRight: 8,
  },
  yearButtonActive: {
    backgroundColor: "#3b82f6",
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  yearButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  viewModeSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 8,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    gap: 8,
  },
  viewModeButtonActive: {
    backgroundColor: "#3b82f6",
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  viewModeTextActive: {
    color: "#fff",
  },
  chartTypeSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 6,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    gap: 6,
  },
  chartTypeButtonActive: {
    backgroundColor: "#3b82f6",
  },
  chartTypeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  chartTypeTextActive: {
    color: "#fff",
  },
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    backgroundColor: "#fff",
    flexWrap: "wrap",
  },
  summaryCard: {
    flex: 1,
    minWidth: (screenWidth - 48) / 2,
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "#fff",
    marginTop: 1,
    padding: 20,
    minHeight: 350,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  chartScrollContent: {
    paddingRight: 20,
  },
  chartWrapper: {
    alignItems: "center",
  },
  chart: {
    borderRadius: 12,
    paddingRight: 20,
    marginTop: 10,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 16,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: "#6b7280",
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    minHeight: 200,
  },
  noDataText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  tableContainer: {
    backgroundColor: "#fff",
    marginTop: 1,
    padding: 20,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderCell: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 13,
  },
  tableCellMonth: {
    flex: 1,
  },
  tableCellAmount: {
    flex: 1.5,
    textAlign: "right",
  },
  tableCellCount: {
    flex: 1,
    textAlign: "center",
  },
  tableCellAvg: {
    flex: 1.5,
    textAlign: "right",
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableRowEven: {
    backgroundColor: "#fafafa",
  },
  tableRowHasData: {
    backgroundColor: "#fff",
  },
  tableCell: {
    fontSize: 13,
    color: "#4b5563",
  },
  tableCellEmpty: {
    color: "#9ca3af",
  },
  tableSummary: {
    flexDirection: "row",
    backgroundColor: "#e0f2fe",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 1,
  },
  tableSummaryText: {
    fontWeight: "600",
    color: "#0369a1",
  },
  insightsContainer: {
    backgroundColor: "#fff",
    marginTop: 1,
    padding: 20,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  tipsContainer: {
    backgroundColor: "#fff",
    marginTop: 1,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  tipBullet: {
    width: 20,
    alignItems: "center",
  },
  tipBulletText: {
    fontSize: 16,
    color: "#f59e0b",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
});

export default MonthlyStatsTab;
