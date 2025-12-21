import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

const SmartAlert = ({ expenses }) => {
  const [metrics, setMetrics] = useState({
    totalMonth: 0,
    topCategory: { name: 'Chưa có', percent: 0 },
    compare: '0'
  });
  const [alerts, setAlerts] = useState([]);

  // Helper function to parse date from various formats
  const parseExpenseDate = (exp) => {
    if (!exp.date) return null;
    
    try {
      if (exp.date && typeof exp.date === 'object' && exp.date.seconds) {
        return new Date(exp.date.seconds * 1000);
      } else if (typeof exp.date === 'string') {
        return new Date(exp.date);
      } else if (exp.date instanceof Date) {
        return exp.date;
      } else if (typeof exp.date === 'number') {
        return new Date(exp.date);
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }
    
    return null;
  };

  // Tính toán số liệu từ expenses
  const calculateMetrics = () => {
    if (!expenses || expenses.length === 0) {
      return {
        totalMonth: 0,
        topCategory: { name: 'Chưa có', percent: 0 },
        compare: '0'
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Tháng hiện tại
    const currentMonthExpenses = expenses.filter(exp => {
      const expDate = parseExpenseDate(exp);
      if (!expDate || isNaN(expDate.getTime())) return false;
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });

    // Tháng trước
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthExpenses = expenses.filter(exp => {
      const expDate = parseExpenseDate(exp);
      if (!expDate || isNaN(expDate.getTime())) return false;
      return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
    });

    // Tổng chi tháng này
    const totalMonth = currentMonthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    // Tính theo danh mục
    const categoryTotals = {};
    currentMonthExpenses.forEach(exp => {
      if (exp.category && exp.amount) {
        const category = exp.category;
        const amount = Number(exp.amount) || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      }
    });

    // Tìm danh mục chi nhiều nhất
    let topCategory = { name: 'Chưa có', percent: 0 };
    const categoryKeys = Object.keys(categoryTotals);
    
    if (categoryKeys.length > 0 && totalMonth > 0) {
      const topCategoryName = categoryKeys.reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b
      );
      const percent = ((categoryTotals[topCategoryName] / totalMonth) * 100).toFixed(1);
      topCategory = { 
        name: topCategoryName, 
        percent,
        amount: categoryTotals[topCategoryName]
      };
    }

    // So sánh với tháng trước
    const totalLastMonth = lastMonthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    let compare = '0';
    
    if (totalLastMonth > 0 && totalMonth > 0) {
      const difference = ((totalMonth - totalLastMonth) / totalLastMonth) * 100;
      compare = difference > 0 ? `+${difference.toFixed(1)}` : difference.toFixed(1);
    } else if (totalMonth > 0 && totalLastMonth === 0) {
      compare = '+100';
    } else if (totalMonth === 0 && totalLastMonth > 0) {
      compare = '-100';
    }

    return {
      totalMonth,
      topCategory,
      compare,
      currentMonthExpensesCount: currentMonthExpenses.length,
      lastMonthExpensesCount: lastMonthExpenses.length
    };
  };

  // Tạo cảnh báo thông minh dựa trên số liệu
  const generateAlerts = (metrics) => {
    const newAlerts = [];
    const { totalMonth, topCategory, compare } = metrics;

    // Rule 1: Chi tiêu tăng đột biến so với tháng trước
    if (compare.includes('+')) {
      const increasePercent = parseFloat(compare);
      if (increasePercent > 50) {
        newAlerts.push({
          type: 'warning',
          icon: '📈',
          title: 'Chi tiêu tăng mạnh',
          message: `Tháng này chi tăng ${compare} so với tháng trước. Hãy kiểm tra lại các khoản chi!`,
          priority: 1
        });
      } else if (increasePercent > 20) {
        newAlerts.push({
          type: 'info',
          icon: '💹',
          title: 'Chi tiêu tăng',
          message: `Chi tiêu tăng ${compare}. Cân nhắc kiểm soát tốt hơn.`,
          priority: 2
        });
      }
    }

    // Rule 2: Một danh mục chiếm quá nhiều
    if (topCategory.percent > 60) {
      newAlerts.push({
        type: 'warning',
        icon: '🎯',
        title: 'Tập trung chi tiêu',
        message: `${topCategory.name} chiếm tới ${topCategory.percent}% tổng chi. Cân đối lại các danh mục!`,
        priority: 1
      });
    } else if (topCategory.percent > 40) {
      newAlerts.push({
        type: 'info',
        icon: '⚖️',
        title: 'Cân đối chi tiêu',
        message: `${topCategory.name} đang chiếm ${topCategory.percent}% ngân sách.`,
        priority: 2
      });
    }

    // Rule 3: Tổng chi quá cao (giả sử ngưỡng là 10 triệu)
    const spendingThreshold = 10000000;
    if (totalMonth > spendingThreshold) {
      newAlerts.push({
        type: 'warning',
        icon: '💰',
        title: 'Chi tiêu cao',
        message: `Tổng chi ${totalMonth.toLocaleString()} VND vượt ngưỡng an toàn.`,
        priority: 1
      });
    }

    // Rule 4: Chi tiêu thấp bất thường (nếu có dữ liệu tháng trước)
    if (compare.includes('-')) {
      const decreasePercent = Math.abs(parseFloat(compare));
      if (decreasePercent > 70 && totalMonth > 0) {
        newAlerts.push({
          type: 'success',
          icon: '👍',
          title: 'Tiết kiệm tốt',
          message: `Chi tiêu giảm ${Math.abs(parseFloat(compare))}%. Tiếp tục phát huy!`,
          priority: 3
        });
      }
    }

    // Rule 5: Cảnh báo nếu có quá ít chi tiêu
    if (metrics.currentMonthExpensesCount === 0 && expenses.length > 0) {
      newAlerts.push({
        type: 'info',
        icon: '📅',
        title: 'Bắt đầu tháng mới',
        message: 'Chưa có chi tiêu nào trong tháng này. Hãy thêm chi tiêu để theo dõi!',
        priority: 3
      });
    }

    // Sắp xếp cảnh báo theo độ ưu tiên
    return newAlerts.sort((a, b) => a.priority - b.priority);
  };

  // Cập nhật metrics và alerts khi expenses thay đổi
  useEffect(() => {
    const newMetrics = calculateMetrics();
    setMetrics(newMetrics);
    const newAlerts = generateAlerts(newMetrics);
    setAlerts(newAlerts);
  }, [expenses]);

  // Hàm xử lý khi nhấn vào cảnh báo
  const handleAlertPress = (alert) => {
    Alert.alert(
      `${alert.icon} ${alert.title}`,
      alert.message,
      [{ text: 'Đã hiểu', style: 'default' }]
    );
  };

  // Lấy màu sắc cho từng loại cảnh báo
  const getAlertStyle = (type) => {
    switch (type) {
      case 'warning':
        return { backgroundColor: '#fef3f2', borderColor: '#fecaca' };
      case 'info':
        return { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' };
      case 'success':
        return { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' };
      default:
        return { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' };
    }
  };

  // Lấy icon cho từng loại cảnh báo
  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return '💡';
      case 'success':
        return '✅';
      default:
        return '📌';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚨 Cảnh báo thông minh</Text>
        <View style={styles.alertCount}>
          <Text style={styles.alertCountText}>{alerts.length}</Text>
        </View>
      </View>

      {/* Basic Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {metrics.totalMonth > 0 ? metrics.totalMonth.toLocaleString() : '0'} VND
          </Text>
          <Text style={styles.statLabel}>Chi tháng này</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {metrics.topCategory.percent}%
          </Text>
          <Text style={styles.statLabel}>{metrics.topCategory.name}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue, 
            metrics.compare.includes('+') ? styles.positive : 
            metrics.compare.includes('-') ? styles.negative : styles.neutral
          ]}>
            {metrics.compare}%
          </Text>
          <Text style={styles.statLabel}>So tháng trước</Text>
        </View>
      </View>

      {/* Hiển thị cảnh báo */}
      {alerts.length > 0 ? (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>📋 Cảnh báo tự động ({alerts.length})</Text>
          {alerts.map((alert, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.alertItem, getAlertStyle(alert.type)]}
              onPress={() => handleAlertPress(alert)}
            >
              <Text style={styles.alertIcon}>{alert.icon}</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.noAlertsContainer}>
          <Text style={styles.noAlertsIcon}>🎉</Text>
          <Text style={styles.noAlertsTitle}>Chi tiêu ổn định</Text>
          <Text style={styles.noAlertsText}>
            {metrics.totalMonth > 0 
              ? 'Chi tiêu của bạn đang trong tầm kiểm soát. Tiếp tục phát huy!'
              : 'Thêm chi tiêu để nhận cảnh báo thông minh'
            }
          </Text>
        </View>
      )}

      {/* Mô tả hệ thống */}
      <View style={styles.systemInfo}>
        <Text style={styles.systemInfoTitle}>ℹ️ Hệ thống cảnh báo tự động</Text>
        <Text style={styles.systemInfoText}>
          • Cảnh báo khi chi tăng đột biến{'\n'}
          • Nhắc nhở cân đối danh mục{'\n'}
          • Theo dõi xu hướng chi tiêu
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 20,
    marginVertical: 10,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  alertCount: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertCountText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  positive: {
    color: '#ef4444',
  },
  negative: {
    color: '#10b981',
  },
  neutral: {
    color: '#6b7280',
  },
  alertsContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 14,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 0,
    width: 24,
    textAlign: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 3,
  },
  alertMessage: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    fontWeight: '400',
  },
  noAlertsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 16,
  },
  noAlertsIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noAlertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  noAlertsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  systemInfo: {
    backgroundColor: '#f0f9ff',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginHorizontal: 4,
  },
  systemInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  systemInfoText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 20,
    fontWeight: '400',
  },
});

export default SmartAlert;