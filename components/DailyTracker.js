import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { LineChart } from 'react-native-chart-kit';
import monthlyManager from '../utils/monthlyManager';

const DailyTracker = () => {
  const expenses = useSelector((state) => state.expenses.items);
  const incomes = useSelector((state) => state.incomes.items);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'

  // Lấy dữ liệu chi tiêu tháng hiện tại
  const currentMonth = monthlyManager.getCurrentMonthInfo();
  const monthExpenses = expenses.filter(e => e.monthId === currentMonth.id);
  const monthIncomes = incomes.filter(i => i.monthId === currentMonth.id);

  // Phân tích chi tiêu theo ngày
  const getDailyData = () => {
    const dailyData = {};
    
    monthExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          expenses: [],
          totalExpense: 0,
          incomes: [],
          totalIncome: 0,
        };
      }
      
      dailyData[dateStr].expenses.push(expense);
      dailyData[dateStr].totalExpense += expense.amount;
    });
    
    monthIncomes.forEach(income => {
      const date = new Date(income.date);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          expenses: [],
          totalExpense: 0,
          incomes: [],
          totalIncome: 0,
        };
      }
      
      dailyData[dateStr].incomes.push(income);
      dailyData[dateStr].totalIncome += income.amount;
    });
    
    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const dailyData = getDailyData();
  
  // Lấy dữ liệu cho 7 ngày gần nhất
  const getLast7Days = () => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = dailyData.find(d => d.date === dateStr) || {
        date: dateStr,
        expenses: [],
        totalExpense: 0,
        incomes: [],
        totalIncome: 0,
      };
      
      result.push(dayData);
    }
    return result;
  };

  const last7Days = getLast7Days();

  // Tìm ngày chi mạnh nhất
  const findMaxSpendingDay = () => {
    if (dailyData.length === 0) return null;
    
    return dailyData.reduce((max, day) => 
      day.totalExpense > max.totalExpense ? day : max
    , dailyData[0]);
  };

  const maxSpendingDay = findMaxSpendingDay();

  // Tổng hợp theo tuần
  const getWeeklySummary = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekExpenses = monthExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= weekAgo;
    });
    
    const weekIncomes = monthIncomes.filter(i => {
      const incomeDate = new Date(i.date);
      return incomeDate >= weekAgo;
    });
    
    const totalExpense = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = weekIncomes.reduce((sum, i) => sum + i.amount, 0);
    const avgDailyExpense = totalExpense / 7;
    
    return {
      totalExpense,
      totalIncome,
      avgDailyExpense,
      expenseCount: weekExpenses.length,
      incomeCount: weekIncomes.length,
    };
  };

  const weeklySummary = getWeeklySummary();

  // Chuẩn bị dữ liệu cho biểu đồ
  const prepareChartData = () => {
    const labels = last7Days.map(day => {
      const date = new Date(day.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    
    const expenseData = last7Days.map(day => day.totalExpense / 1000); // Chia 1000 để giảm scale
    const incomeData = last7Days.map(day => day.totalIncome / 1000);
    
    return {
      labels,
      datasets: [
        {
          data: expenseData,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: incomeData,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartData = prepareChartData();

  // Định dạng ngày
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', { 
        weekday: 'short',
        day: 'numeric',
        month: 'numeric'
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Lịch sử theo ngày</Text>
        <Text style={styles.subtitle}>Theo dõi chi tiêu hàng ngày</Text>
      </View>

      {/* Toggle view mode */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'week' && styles.toggleActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>
            Tuần này
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'month' && styles.toggleActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>
            Tháng này
          </Text>
        </TouchableOpacity>
      </View>

      {/* Biểu đồ chi tiêu hàng ngày */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Chi tiêu & thu nhập 7 ngày qua</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 48}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          formatYLabel={(value) => `${Math.round(value * 1000).toLocaleString()}`}
        />
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Chi tiêu</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Thu nhập</Text>
          </View>
        </View>
      </View>

      {/* Tổng quan tuần */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📊 Tổng quan tuần này</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{weeklySummary.expenseCount}</Text>
            <Text style={styles.summaryLabel}>Giao dịch chi</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {weeklySummary.totalExpense.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Tổng chi</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {Math.round(weeklySummary.avgDailyExpense).toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Trung bình/ngày</Text>
          </View>
        </View>
      </View>

      {/* Ngày chi mạnh nhất */}
      {maxSpendingDay && maxSpendingDay.totalExpense > 0 && (
        <View style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>🔥 Ngày chi mạnh nhất</Text>
          <View style={styles.highlightContent}>
            <Text style={styles.highlightDate}>
              {formatDate(maxSpendingDay.date)}
            </Text>
            <Text style={styles.highlightAmount}>
              {maxSpendingDay.totalExpense.toLocaleString()} VND
            </Text>
            <Text style={styles.highlightSubtext}>
              {maxSpendingDay.expenses.length} giao dịch
            </Text>
          </View>
        </View>
      )}

      {/* Chi tiết từng ngày */}
      <View style={styles.dailyList}>
        <Text style={styles.dailyListTitle}>Chi tiết từng ngày</Text>
        
        {last7Days.map((day, index) => (
          <View key={index} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
              <Text style={styles.dayTotal}>
                {day.totalExpense.toLocaleString()} VND
              </Text>
            </View>
            
            {day.expenses.length > 0 ? (
              <View style={styles.dayDetails}>
                {day.expenses.slice(0, 3).map((expense, idx) => (
                  <View key={idx} style={styles.expenseItem}>
                    <Text style={styles.expenseTitle} numberOfLines={1}>
                      {expense.title}
                    </Text>
                    <Text style={styles.expenseAmount}>
                      {expense.amount.toLocaleString()} VND
                    </Text>
                  </View>
                ))}
                
                {day.expenses.length > 3 && (
                  <Text style={styles.moreText}>
                    + {day.expenses.length - 3} giao dịch khác
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.noExpenseText}>Không có chi tiêu</Text>
            )}
            
            {day.totalIncome > 0 && (
              <View style={styles.incomeBadge}>
                <Text style={styles.incomeText}>
                  💰 Thu nhập: {day.totalIncome.toLocaleString()} VND
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  highlightCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
    textAlign: 'center',
  },
  highlightContent: {
    alignItems: 'center',
  },
  highlightDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  highlightAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ef4444',
    marginBottom: 4,
  },
  highlightSubtext: {
    fontSize: 14,
    color: '#92400e',
  },
  dailyList: {
    marginBottom: 20,
  },
  dailyListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dayTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  dayDetails: {
    marginBottom: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  expenseTitle: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  moreText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  noExpenseText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  incomeBadge: {
    backgroundColor: '#d1fae5',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  incomeText: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
});

export default DailyTracker;