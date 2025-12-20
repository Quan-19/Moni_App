import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { ProgressBar } from "react-native-paper";
import { useSelector } from "react-redux";
import monthlyManager from "../utils/monthlyManager";

const FinancialOverview = ({ navigation, setActiveTab }) => {
  const expenses = useSelector((state) => state.expenses?.items || []);
  const incomes = useSelector((state) => state.incomes?.items || []);

  // Hàm định dạng số tiền - THÊM HÀM NÀY
  const formatCurrency = (amount, showFull = false) => {
    // Nếu showFull = true, hiển thị đầy đủ với VND
    if (showFull) {
      return amount.toLocaleString("vi-VN") + " VND";
    }

    // Định dạng cho số lớn
    if (amount >= 1000000000) {
      // Tỷ
      return (amount / 1000000000).toFixed(1).replace(".", ",") + " tỷ";
    } else if (amount >= 1000000) {
      // Triệu
      return (amount / 1000000).toFixed(1).replace(".", ",") + " tr";
    } else if (amount >= 1000) {
      // Nghìn
      return (amount / 1000).toFixed(1).replace(".", ",") + "k";
    }

    // Dưới 1000 thì hiển thị đầy đủ
    return amount.toLocaleString("vi-VN");
  };

  // Lấy tháng hiện tại
  const currentMonth = monthlyManager.getCurrentMonthInfo();
  const currentMonthId = currentMonth?.id || "";

  // Tính toán dữ liệu
  const calculateFinancialData = () => {
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const safeIncomes = Array.isArray(incomes) ? incomes : [];

    // Chi tiêu tháng hiện tại
    const monthExpenses = safeExpenses.filter(
      (e) => e.monthId === currentMonthId
    );
    const totalExpenses = monthExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    // Thu nhập tháng hiện tại
    const monthIncomes = safeIncomes.filter(
      (i) => i.monthId === currentMonthId
    );
    const totalIncomes = monthIncomes.reduce(
      (sum, i) => sum + (i.amount || 0),
      0
    );

    // Số dư
    const balance = totalIncomes - totalExpenses;

    // % đã tiêu so với thu nhập
    const spendingPercentage =
      totalIncomes > 0 ? (totalExpenses / totalIncomes) * 100 : 0;

    // Số ngày đã qua trong tháng
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysPassed =
      Math.floor((now - startOfMonth) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const dayPercentage = (daysPassed / totalDays) * 100;

    // Dự đoán chi tiêu cuối tháng
    const projectedExpense =
      daysPassed > 0 ? (totalExpenses / daysPassed) * totalDays : 0;
    const projectedBalance = totalIncomes - projectedExpense;

    return {
      totalIncomes,
      totalExpenses,
      balance,
      spendingPercentage,
      dayPercentage,
      projectedExpense,
      projectedBalance,
      daysPassed,
      totalDays,
      monthExpensesCount: monthExpenses.length,
      monthIncomesCount: monthIncomes.length,
    };
  };

  const data = calculateFinancialData();

  // Xác định trạng thái cảnh báo
  const getAlertStatus = () => {
    if (data.spendingPercentage >= 90) {
      return { type: "danger", message: "⚠️ Bạn đã tiêu gần hết thu nhập!" };
    }
    if (data.spendingPercentage >= 70 && data.dayPercentage < 70) {
      return {
        type: "warning",
        message: "⚡ Bạn đang tiêu nhanh hơn thời gian!",
      };
    }
    if (data.balance < 0) {
      return { type: "danger", message: "🔴 Bạn đang chi vượt thu nhập!" };
    }
    if (data.projectedBalance < 0) {
      return {
        type: "warning",
        message: `⚠️ Nếu tiếp tục, cuối tháng sẽ âm ${formatCurrency(
          Math.abs(data.projectedBalance)
        )}`,
      };
    }
    return { type: "success", message: "✅ Bạn đang kiểm soát tài chính tốt!" };
  };

  // Hàm xử lý khi nhấn "Xem tất cả chi tiêu"
  const handleViewAllExpenses = () => {
    if (setActiveTab) {
      setActiveTab("list");
    } else {
      Alert.alert(
        "Thông báo",
        "Không thể chuyển tab: setActiveTab prop bị thiếu"
      );
    }
  };

  // Hàm xử lý khi nhấn "Xem tất cả thu nhập"
  const handleViewAllIncomes = () => {
    Alert.alert(
      "Xem tất cả thu nhập",
      "Chức năng xem tất cả thu nhập đang được phát triển",
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Thêm thu nhập",
          onPress: () => navigation.navigate("AddIncome"),
        },
      ]
    );
  };

  const alert = getAlertStatus();

  return (
    <View style={styles.container}>
      {/* Header tổng quan */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tổng quan tài chính</Text>
        <Text style={styles.headerSubtitle}>
          {currentMonth?.name || "Tháng hiện tại"}
        </Text>
      </View>

      {/* Cảnh báo */}
      <View
        style={[
          styles.alertBox,
          alert.type === "danger"
            ? styles.alertDanger
            : alert.type === "warning"
            ? styles.alertWarning
            : styles.alertSuccess,
        ]}
      >
        <Text style={styles.alertText}>{alert.message}</Text>
      </View>

      {/* Số liệu chính */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Thu nhập</Text>
            <Text style={styles.statValueIncome}>
              {formatCurrency(data.totalIncomes, true)}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("AddIncome")}
            >
              <Text style={styles.addButtonText}>+ Thêm thu nhập</Text>
            </TouchableOpacity>
            {/* Nút xem tất cả thu nhập */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAllIncomes}
            >
              <Text style={styles.viewAllButtonText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Chi tiêu</Text>
            <Text style={styles.statValueExpense}>
              {formatCurrency(data.totalExpenses, true)}
            </Text>
            <Text style={styles.statSubtext}>
              {data.monthExpensesCount} giao dịch
            </Text>
            {/* Nút xem tất cả chi tiêu */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAllExpenses}
            >
              <Text style={styles.viewAllButtonText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text
            style={[
              styles.balanceValue,
              data.balance >= 0
                ? styles.balancePositive
                : styles.balanceNegative,
            ]}
          >
            {formatCurrency(data.balance, true)}
          </Text>
          <Text style={styles.balanceSubtext}>
            {data.balance >= 0
              ? "Bạn đang có lãi"
              : "Cần điều chỉnh chi tiêu"}
          </Text>
        </View>
      </View>

      {/* Thanh tiến độ */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Tiến độ chi tiêu trong tháng</Text>
          <Text style={styles.progressPercentage}>
            {data.spendingPercentage.toFixed(1)}%
          </Text>
        </View>

        <ProgressBar
          progress={data.spendingPercentage / 100}
          color={
            data.spendingPercentage > 100
              ? "#ef4444"
              : data.spendingPercentage > 80
              ? "#f59e0b"
              : "#10b981"
          }
          style={styles.progressBar}
        />

        <View style={styles.progressFooter}>
          <Text style={styles.progressText}>
            Đã qua {data.daysPassed}/{data.totalDays} ngày (
            {data.dayPercentage.toFixed(0)}%)
          </Text>
          <Text style={styles.progressText}>
            {data.totalIncomes > 0
              ? `${((data.totalExpenses / data.totalIncomes) * 100).toFixed(
                  1
                )}% thu nhập đã chi`
              : "Chưa có thu nhập"}
          </Text>
        </View>
      </View>

      {/* Dự báo */}
      <View style={styles.forecastContainer}>
        <Text style={styles.forecastTitle}>Dự báo cuối tháng</Text>
        <View style={styles.forecastRow}>
          <View style={styles.forecastItem}>
            <Text style={styles.forecastLabel}>Chi tiêu dự kiến</Text>
            <Text style={styles.forecastValue}>
              {formatCurrency(data.projectedExpense)}
            </Text>
          </View>
          <View style={styles.forecastItem}>
            <Text style={styles.forecastLabel}>Số dư dự kiến</Text>
            <Text
              style={[
                styles.forecastValue,
                data.projectedBalance >= 0
                  ? styles.forecastPositive
                  : styles.forecastNegative,
              ]}
            >
              {formatCurrency(data.projectedBalance)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tỷ lệ tiết kiệm */}
      {data.totalIncomes > 0 && (
        <View style={styles.savingsContainer}>
          <Text style={styles.savingsTitle}>Tỷ lệ tiết kiệm</Text>
          <View style={styles.savingsContent}>
            <Text style={styles.savingsPercentage}>
              {formatCurrency(Math.max(0, data.balance), true)} (
              {((Math.max(0, data.balance) / data.totalIncomes) * 100).toFixed(
                1
              )}
              %)
            </Text>
            <Text style={styles.savingsText}>
              {data.balance > 0
                ? `Bạn đang tiết kiệm được ${(
                    (data.balance / data.totalIncomes) *
                    100
                  ).toFixed(1)}% thu nhập`
                : "Bạn chưa có tiền tiết kiệm trong tháng này"}
            </Text>
          </View>
        </View>
      )}

      {/* Nhanh chóng thêm */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate("AddIncome")}
        >
          <Text style={styles.quickButtonText}>Thêm thu nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickButton, styles.quickButtonSecondary]}
          onPress={() => navigation.navigate("AddExpense")}
        >
          <Text style={styles.quickButtonTextSecondary}>Thêm chi tiêu</Text>
        </TouchableOpacity>
      </View>

      {/* Nút xem tất cả chi tiêu lớn */}
      <TouchableOpacity
        style={styles.fullViewAllButton}
        onPress={handleViewAllExpenses}
      >
        <Text style={styles.fullViewAllText}>Xem tất cả chi tiêu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  alertBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  alertDanger: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  alertWarning: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  alertSuccess: {
    backgroundColor: "#d1fae5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  alertText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  statsContainer: {
    marginBottom: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValueIncome: {
    fontSize: 22,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 8,
  },
  statValueExpense: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 8,
  },
  statSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  viewAllButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllButtonText: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "500",
  },
  balanceContainer: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  balancePositive: {
    color: "#10b981",
  },
  balanceNegative: {
    color: "#ef4444",
  },
  balanceSubtext: {
    fontSize: 14,
    color: "#6b7280",
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 12,
    color: "#6b7280",
  },
  forecastContainer: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0369a1",
    marginBottom: 12,
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forecastItem: {
    flex: 1,
    alignItems: "center",
  },
  forecastLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  forecastPositive: {
    color: "#10b981",
  },
  forecastNegative: {
    color: "#ef4444",
  },
  savingsContainer: {
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 8,
  },
  savingsContent: {
    alignItems: "center",
  },
  savingsPercentage: {
    fontSize: 20,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 14,
    color: "#92400e",
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  quickButtonSecondary: {
    backgroundColor: "#3b82f6",
  },
  quickButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  quickButtonTextSecondary: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  fullViewAllButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  fullViewAllText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FinancialOverview;
