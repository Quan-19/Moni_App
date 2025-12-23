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

  // Format tiền tệ
  const formatCurrency = (amount) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B ₫`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ₫`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K ₫`;
    }
    return `${amount} ₫`;
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
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.headerTitle}>Thống kê tháng</Text>
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
          <Ionicons name="refresh" size={22} color="#3b82f6" />
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
        <View style={[styles.summaryCard, { borderLeftColor: "#22c55e" }]}>
          <Ionicons name="trending-up" size={24} color="#22c55e" />
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Thu nhập</Text>
            <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
              {formatCurrency(yearTotalIncome)}
            </Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { borderLeftColor: "#ef4444" }]}>
          <Ionicons name="trending-down" size={24} color="#ef4444" />
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
            { borderLeftColor: yearBalance >= 0 ? "#3b82f6" : "#f59e0b" },
          ]}
        >
          <Ionicons
            name={yearBalance >= 0 ? "wallet" : "alert-circle"}
            size={24}
            color={yearBalance >= 0 ? "#3b82f6" : "#f59e0b"}
          />
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
          <Text style={styles.chartTitle}>So sánh thu nhập & chi tiêu</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={comparisonChartData}
              width={Math.max(screenWidth - 40, monthlyData.length * 60)}
              height={220}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForBackgroundLines: {
                  strokeDasharray: "",
                  stroke: "#e5e7eb",
                },
              }}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars={false}
            />
          </ScrollView>
        </View>
      )}

      {/* Biểu đồ chi tiêu */}
      {monthlyData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Xu hướng chi tiêu</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={expenseChartData}
              width={Math.max(screenWidth - 40, monthlyData.length * 60)}
              height={220}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#ef4444",
                },
                propsForBackgroundLines: {
                  strokeDasharray: "",
                  stroke: "#e5e7eb",
                },
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        </View>
      )}

      {/* Bảng chi tiết - có thể click */}
      <View style={styles.tableSection}>
        <Text style={styles.tableTitle}>Chi tiết theo tháng (Nhấn để xem)</Text>
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
                  <Text style={styles.modalTitle}>
                    Chi tiết Tháng {selectedMonth.month}/{selectedYear}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSummary}>
                  <View style={styles.modalSummaryItem}>
                    <Ionicons name="trending-up" size={20} color="#22c55e" />
                    <Text style={styles.modalSummaryLabel}>Thu nhập</Text>
                    <Text style={[styles.modalSummaryValue, { color: "#22c55e" }]}>
                      {formatCurrency(selectedMonth.totalIncome)}
                    </Text>
                  </View>

                  <View style={styles.modalSummaryItem}>
                    <Ionicons name="trending-down" size={20} color="#ef4444" />
                    <Text style={styles.modalSummaryLabel}>Chi tiêu</Text>
                    <Text style={[styles.modalSummaryValue, { color: "#ef4444" }]}>
                      {formatCurrency(selectedMonth.totalExpense)}
                    </Text>
                  </View>

                  <View style={styles.modalSummaryItem}>
                    <Ionicons
                      name={selectedMonth.balance >= 0 ? "wallet" : "alert-circle"}
                      size={20}
                      color={selectedMonth.balance >= 0 ? "#3b82f6" : "#f59e0b"}
                    />
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
                        <Ionicons
                          name={modalViewType === "expense" ? "remove-circle" : "add-circle"}
                          size={24}
                          color={modalViewType === "expense" ? "#ef4444" : "#22c55e"}
                        />
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
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
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
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
  tableSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  modalSummary: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  modalSummaryItem: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  modalSummaryLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
  },
  modalSummaryValue: {
    fontSize: 15,
    fontWeight: "bold",
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
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  modalTabActive: {
    backgroundColor: "#3b82f6",
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
