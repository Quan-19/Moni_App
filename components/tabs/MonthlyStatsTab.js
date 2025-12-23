import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useSelector } from "react-redux";
import { BarChart, LineChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getCategoryColor, getCategoryIcon } from "../../utils/CategoryIcons";

const screenWidth = Dimensions.get("window").width;

const MonthlyStatsTab = () => {
  const allExpenses = useSelector((state) => state.expenses.items);
  const allIncomes = useSelector((state) => state.incomes.items);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalViewType, setModalViewType] = useState("expense"); // 'expense', 'income'
  const [incomeTooltip, setIncomeTooltip] = useState({ visible: false, x: 0, y: 0, value: 0, label: "" });
  const [expenseTooltip, setExpenseTooltip] = useState({ visible: false, x: 0, y: 0, value: 0, label: "" });

  useEffect(() => {
    calculateMonthlyStats();
  }, [allExpenses, allIncomes, selectedYear]);

  // Tính toán thống kê theo tháng
  const calculateMonthlyStats = () => {
    try {
      setLoading(true);

      // Tạo dữ liệu cho 12 tháng
      const months = [];
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(selectedYear, i, 1);
        const monthEnd = new Date(selectedYear, i + 1, 0);

        // Lọc chi tiêu trong tháng
        const monthExpenses = allExpenses.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        });

        // Lọc thu nhập trong tháng
        const monthIncomes = allIncomes.filter((income) => {
          const incomeDate = new Date(income.date);
          return incomeDate >= monthStart && incomeDate <= monthEnd;
        });

        const totalExpense = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalIncome = monthIncomes.reduce((sum, e) => sum + (e.amount || 0), 0);

        months.push({
          month: i + 1,
          monthName: `T${i + 1}`,
          totalExpense,
          totalIncome,
          balance: totalIncome - totalExpense,
          expenseCount: monthExpenses.length,
          incomeCount: monthIncomes.length,
          expenses: monthExpenses,
          incomes: monthIncomes,
        });
      }

      setMonthlyData(months);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi tính toán thống kê:", error);
      setLoading(false);
    }
  };

  // Xem chi tiết tháng
  const viewMonthDetail = (monthData) => {
    setSelectedMonth(monthData);
    setModalVisible(true);
  };

  // Chuyển năm
  const changeYear = (direction) => {
    setSelectedYear((prev) => prev + direction);
  };

  // Lấy tháng hiện tại
  const getCurrentMonth = () => {
    const now = new Date();
    return now.getFullYear() === selectedYear ? now.getMonth() + 1 : null;
  };

  // Lấy danh sách năm có dữ liệu
  const getAvailableYears = () => {
    const years = new Set();
    [...allExpenses, ...allIncomes].forEach((item) => {
      const year = new Date(item.date).getFullYear();
      years.add(year);
    });
    const yearArray = Array.from(years).sort((a, b) => b - a);
    if (yearArray.length === 0) yearArray.push(new Date().getFullYear());
    return yearArray;
  };

  // Format tiền tệ: hiển thị đầy đủ theo VND, không viết tắt
  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return `${value.toLocaleString("vi-VN")} VND`;
  };

  // Tổng chi tiêu trong năm
  const yearTotalExpense = monthlyData.reduce((sum, m) => sum + m.totalExpense, 0);
  const yearTotalIncome = monthlyData.reduce((sum, m) => sum + m.totalIncome, 0);
  const yearBalance = yearTotalIncome - yearTotalExpense;

  // Dữ liệu cho biểu đồ chi tiêu
  const expenseChartData = {
    labels: monthlyData.map((m) => m.monthName),
    datasets: [
      {
        data: monthlyData.map((m) => m.totalExpense || 0),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
      },
    ],
  };

  // Dữ liệu cho biểu đồ thu nhập
  const incomeChartData = {
    labels: monthlyData.map((m) => m.monthName),
    datasets: [
      {
        data: monthlyData.map((m) => m.totalIncome || 0),
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
      },
    ],
  };

  // Dữ liệu cho biểu đồ so sánh
  const comparisonChartData = {
    labels: monthlyData.map((m) => m.monthName),
    datasets: [
      {
        data: monthlyData.map((m) => m.totalIncome || 0),
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
      },
      {
        data: monthlyData.map((m) => m.totalExpense || 0),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
      },
    ],
    legend: ["Thu nhập", "Chi tiêu"],
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header với điều hướng năm */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconBg}>
            <Ionicons name="calendar" size={24} color="#3b82f6" />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Thống kê năm</Text>
            <Text style={styles.headerSubtitle}>
              {yearTotalExpense > 0
                ? `Chi ${formatCurrency(yearTotalExpense)} trong năm`
                : "Chưa có dữ liệu"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={calculateMonthlyStats}
        >
          <Ionicons name="refresh" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Year Selector với nút prev/next */}
      <View style={styles.yearSelectorContainer}>
        <TouchableOpacity
          style={styles.yearNavButton}
          onPress={() => changeYear(-1)}
        >
          <Ionicons name="chevron-back" size={20} color="#3b82f6" />
        </TouchableOpacity>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.yearSelector}
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

        <TouchableOpacity
          style={styles.yearNavButton}
          onPress={() => changeYear(1)}
        >
          <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.summaryCardIncome]}>
          <View style={styles.summaryIconBg}>
            <Ionicons name="trending-up" size={22} color="#22c55e" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Thu nhập</Text>
            <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
              {formatCurrency(yearTotalIncome)}
            </Text>
          </View>
        </View>

        <View style={[styles.summaryCard, styles.summaryCardExpense]}>
          <View style={styles.summaryIconBg}>
            <Ionicons name="trending-down" size={22} color="#ef4444" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Chi tiêu</Text>
            <Text style={[styles.summaryValue, { color: "#ef4444" }]}>
              {formatCurrency(yearTotalExpense)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.summaryCard,
            yearBalance >= 0 ? styles.summaryCardBalance : styles.summaryCardWarning,
          ]}
        >
          <View style={styles.summaryIconBg}>
            <Ionicons
              name={yearBalance >= 0 ? "wallet" : "alert-circle"}
              size={22}
              color={yearBalance >= 0 ? "#3b82f6" : "#f59e0b"}
            />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Còn lại</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: yearBalance >= 0 ? "#3b82f6" : "#f59e0b" },
              ]}
            >
              {formatCurrency(Math.abs(yearBalance))}
            </Text>
          </View>
        </View>
      </View>

      {/* Biểu đồ so sánh */}
      {monthlyData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Thu nhập qua từng tháng</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartWrapper}>
              <BarChart
                data={incomeChartData}
                width={Math.max(screenWidth - 40, monthlyData.length * 60)}
                height={220}
                fromZero
                barRadius={8}
                showValuesOnTopOfBars={false}
                segments={4}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  fillShadowGradientFrom: "#22c55e",
                  fillShadowGradientFromOpacity: 0.7,
                  fillShadowGradientTo: "#22c55e",
                  fillShadowGradientToOpacity: 0.2,
                  propsForBackgroundLines: {
                    strokeDasharray: "4 6",
                    stroke: "#e5e7eb",
                  },
                }}
                style={styles.chart}
                onDataPointClick={({ index, value, x, y }) => {
                  const label = monthlyData[index]?.monthName || "";
                  setIncomeTooltip((prev) => {
                    if (prev.visible && prev.x === x && prev.y === y) {
                      return { ...prev, visible: false };
                    }
                    return { visible: true, x, y, value, label };
                  });
                }}
              />
              {incomeTooltip.visible && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.tooltip,
                    { left: incomeTooltip.x - 36, top: incomeTooltip.y - 48 },
                  ]}
                >
                  <Text style={styles.tooltipLabel}>{incomeTooltip.label}</Text>
                  <Text style={[styles.tooltipValue, { color: "#22c55e" }]}>
                    {formatCurrency(incomeTooltip.value)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Biểu đồ chi tiêu */}
      {monthlyData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Chi tiêu qua từng tháng</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chartWrapper}>
              <LineChart
                data={expenseChartData}
                width={Math.max(screenWidth - 40, monthlyData.length * 60)}
                height={220}
                bezier
                withShadow
                segments={4}
                yLabelsOffset={6}
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  fillShadowGradientFrom: "#ef4444",
                  fillShadowGradientFromOpacity: 0.3,
                  fillShadowGradientTo: "#ef4444",
                  fillShadowGradientToOpacity: 0.05,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#ef4444",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "4 6",
                    stroke: "#e5e7eb",
                  },
                }}
                style={styles.chart}
                onDataPointClick={({ index, value, x, y }) => {
                  const label = monthlyData[index]?.monthName || "";
                  setExpenseTooltip((prev) => {
                    if (prev.visible && prev.x === x && prev.y === y) {
                      return { ...prev, visible: false };
                    }
                    return { visible: true, x, y, value, label };
                  });
                }}
                formatYLabel={(y) => {
                  const num = Number(y);
                  return isNaN(num) ? y : num.toLocaleString("vi-VN");
                }}
              />
              {expenseTooltip.visible && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.tooltip,
                    { left: expenseTooltip.x - 36, top: expenseTooltip.y - 48 },
                  ]}
                >
                  <Text style={styles.tooltipLabel}>{expenseTooltip.label}</Text>
                  <Text style={[styles.tooltipValue, { color: "#ef4444" }]}>
                    {formatCurrency(expenseTooltip.value)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Bảng chi tiết - có thể click */}
      <View style={styles.tableSection}>
        <View style={styles.tableTitleRow}>
          <Ionicons name="layers" size={20} color="#3b82f6" />
          <Text style={styles.tableTitle}>Chi tiết theo tháng</Text>
        </View>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Tháng</Text>
            <Text style={[styles.tableHeaderText, { flex: 2, textAlign: "right" }]}>
              Thu nhập
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2, textAlign: "right" }]}>
              Chi tiêu
            </Text>
            <Text style={[styles.tableHeaderText, { flex: 2, textAlign: "right" }]}>
              Còn lại
            </Text>
          </View>

          {/* Rows */}
          {monthlyData.map((month) => {
            const isCurrentMonth = month.month === getCurrentMonth();
            return (
              <TouchableOpacity
                key={month.month}
                style={[
                  styles.tableRow,
                  isCurrentMonth && styles.currentMonthRow,
                ]}
                onPress={() => viewMonthDetail(month)}
              >
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 1 },
                    isCurrentMonth && styles.currentMonthText,
                  ]}
                >
                  Tháng {month.month}
                  {isCurrentMonth && " 🔵"}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 2, textAlign: "right", color: "#22c55e", fontWeight: "600" },
                  ]}
                >
                  {formatCurrency(month.totalIncome)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 2, textAlign: "right", color: "#ef4444", fontWeight: "600" },
                  ]}
                >
                  {formatCurrency(month.totalExpense)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    {
                      flex: 2,
                      textAlign: "right",
                      color: month.balance >= 0 ? "#3b82f6" : "#f59e0b",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {formatCurrency(Math.abs(month.balance))}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Modal chi tiết tháng */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMonth && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={styles.modalHeaderIconBg}>
                      <Ionicons name="calendar" size={20} color="#3b82f6" />
                    </View>
                    <Text style={styles.modalTitle}>
                      Tháng {selectedMonth.month}/{selectedYear}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSummary}>
                  <View style={[styles.modalSummaryItem, styles.modalSummaryItemIncome]}>
                    <View style={styles.modalSummaryIconBg}>
                      <Ionicons name="trending-up" size={18} color="#22c55e" />
                    </View>
                    <Text style={styles.modalSummaryLabel}>Thu nhập</Text>
                    <Text style={[styles.modalSummaryValue, { color: "#22c55e" }]}>
                      {formatCurrency(selectedMonth.totalIncome)}
                    </Text>
                  </View>

                  <View style={[styles.modalSummaryItem, styles.modalSummaryItemExpense]}>
                    <View style={styles.modalSummaryIconBg}>
                      <Ionicons name="trending-down" size={18} color="#ef4444" />
                    </View>
                    <Text style={styles.modalSummaryLabel}>Chi tiêu</Text>
                    <Text style={[styles.modalSummaryValue, { color: "#ef4444" }]}>
                      {formatCurrency(selectedMonth.totalExpense)}
                    </Text>
                  </View>

                  <View style={[styles.modalSummaryItem, selectedMonth.balance >= 0 ? styles.modalSummaryItemBalance : styles.modalSummaryItemWarning]}>
                    <View style={styles.modalSummaryIconBg}>
                      <Ionicons
                        name={selectedMonth.balance >= 0 ? "wallet" : "alert-circle"}
                        size={18}
                        color={selectedMonth.balance >= 0 ? "#3b82f6" : "#f59e0b"}
                      />
                    </View>
                    <Text style={styles.modalSummaryLabel}>Còn lại</Text>
                    <Text
                      style={[
                        styles.modalSummaryValue,
                        {
                          color: selectedMonth.balance >= 0 ? "#3b82f6" : "#f59e0b",
                        },
                      ]}
                    >
                      {formatCurrency(Math.abs(selectedMonth.balance))}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalTabs}>
                  <TouchableOpacity
                    style={[
                      styles.modalTab,
                      modalViewType === "expense" && styles.modalTabActive,
                    ]}
                    onPress={() => setModalViewType("expense")}
                  >
                    <Text
                      style={[
                        styles.modalTabText,
                        modalViewType === "expense" && styles.modalTabTextActive,
                      ]}
                    >
                      Chi tiêu ({selectedMonth.expenseCount})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalTab,
                      modalViewType === "income" && styles.modalTabActive,
                    ]}
                    onPress={() => setModalViewType("income")}
                  >
                    <Text
                      style={[
                        styles.modalTabText,
                        modalViewType === "income" && styles.modalTabTextActive,
                      ]}
                    >
                      Thu nhập ({selectedMonth.incomeCount})
                    </Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={
                    modalViewType === "expense"
                      ? selectedMonth.expenses
                      : selectedMonth.incomes
                  }
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.modalList}
                  renderItem={({ item }) => (
                    <View style={styles.modalListItem}>
                      <View style={styles.modalItemLeft}>
                        {item.category ? (
                          <View style={[styles.categoryIconBox, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
                            <Ionicons
                              name={getCategoryIcon(item.category)}
                              size={20}
                              color={getCategoryColor(item.category)}
                            />
                          </View>
                        ) : (
                          <Ionicons
                            name={modalViewType === "expense" ? "remove-circle" : "add-circle"}
                            size={24}
                            color={modalViewType === "expense" ? "#ef4444" : "#22c55e"}
                          />
                        )}
                        <View style={styles.modalItemInfo}>
                          <Text style={styles.modalItemTitle}>{item.title}</Text>
                          <Text style={styles.modalItemDate}>
                            {new Date(item.date).toLocaleDateString("vi-VN")}
                          </Text>
                          {item.category && (
                            <Text style={styles.modalItemCategory}>{item.category}</Text>
                          )}
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.modalItemAmount,
                          {
                            color: modalViewType === "expense" ? "#ef4444" : "#22c55e",
                          },
                        ]}
                      >
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      Không có {modalViewType === "expense" ? "chi tiêu" : "thu nhập"} nào
                    </Text>
                  }
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "500",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#e0f2fe",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  yearSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  yearNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  yearSelector: {
    flex: 1,
    marginHorizontal: 8,
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  yearButtonActive: {
    backgroundColor: "#3b82f6",
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  yearButtonTextActive: {
    color: "#fff",
  },
  summaryContainer: {
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    gap: 12,
  },
  summaryCardIncome: {
    borderColor: "#dcfce7",
  },
  summaryCardExpense: {
    borderColor: "#fee2e2",
  },
  summaryCardBalance: {
    borderColor: "#e0f2fe",
  },
  summaryCardWarning: {
    borderColor: "#fef3c7",
  },
  summaryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    backgroundColor: "#f9fafb",
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  chartSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
  chartWrapper: {
    position: "relative",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    minWidth: 90,
  },
  tooltipLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 2,
    fontWeight: "600",
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  tableSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  tableTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  currentMonthRow: {
    backgroundColor: "#eff6ff",
  },
  tableCell: {
    fontSize: 13,
    color: "#6b7280",
  },
  currentMonthText: {
    fontWeight: "700",
    color: "#3b82f6",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  modalHeaderIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  modalSummary: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  modalSummaryItem: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  modalSummaryItemIncome: {
    backgroundColor: "#f0fdf4",
    borderColor: "#dcfce7",
  },
  modalSummaryItemExpense: {
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
  },
  modalSummaryItemBalance: {
    backgroundColor: "#f0f9ff",
    borderColor: "#e0f2fe",
  },
  modalSummaryItemWarning: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
  modalSummaryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSummaryLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  modalSummaryValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  modalTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalTabActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalTabTextActive: {
    color: "#fff",
  },
  modalList: {
    paddingHorizontal: 16,
  },
  modalListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  categoryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  modalItemDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  modalItemCategory: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  modalItemAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    padding: 40,
    fontSize: 14,
    color: "#9ca3af",
  },
});

export default MonthlyStatsTab;
