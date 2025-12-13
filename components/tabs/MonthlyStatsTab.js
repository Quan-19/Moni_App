import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import monthlyManager from '../../utils/monthlyManager';

const screenWidth = Dimensions.get('window').width;

const MonthlyStatsTab = () => {
  const allExpenses = useSelector((state) => state.expenses.items);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [allMonthsData, setAllMonthsData] = useState([]);
  const [chartType, setChartType] = useState('bar'); // 'bar' hoặc 'line'

  // Lấy tất cả các năm có trong dữ liệu
  const getAvailableYears = () => {
    const years = new Set();
    allMonthsData.forEach(month => {
      const year = new Date(month.startDate).getFullYear();
      years.add(year);
    });
    
    // Nếu không có dữ liệu, thêm năm hiện tại
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
      
      // Kết hợp tất cả tháng
      const allMonths = [...archivedMonths];
      if (currentMonth) {
        allMonths.push(currentMonth);
      }

      // Sắp xếp theo thời gian (cũ nhất -> mới nhất)
      allMonths.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      setAllMonthsData(allMonths);

      // Lọc dữ liệu theo năm được chọn
      const filteredMonths = allMonths.filter(month => {
        const year = new Date(month.startDate).getFullYear();
        return year === selectedYear;
      });

      // Tạo dữ liệu cho 12 tháng của năm
      const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];

      const monthlyDataTemp = months.map((monthName, index) => {
        const monthData = filteredMonths.find(month => {
          const date = new Date(month.startDate);
          return date.getMonth() === index && date.getFullYear() === selectedYear;
        });

        return {
          month: monthName,
          amount: monthData ? monthData.total : 0,
          monthNumber: index + 1,
          expensesCount: monthData ? monthData.expenses.length : 0,
          monthId: monthData ? monthData.id : null,
        };
      });

      setMonthlyData(monthlyDataTemp);
    } catch (error) {
      console.error('Error calculating stats:', error);
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
    const monthsWithData = monthlyData.filter(month => month.amount > 0);
    if (monthsWithData.length === 0) return 0;
    return getYearTotal() / monthsWithData.length;
  };

  // Format số tiền
  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  // Tìm giá trị lớn nhất để điều chỉnh tỷ lệ biểu đồ
  const getMaxAmount = () => {
    const max = Math.max(...monthlyData.map(item => item.amount));
    return max === 0 ? 1000 : max; // Tránh chia cho 0
  };

  // Chuẩn bị dữ liệu cho biểu đồ
  const prepareChartData = () => {
    const labels = monthlyData.map(item => {
      const monthNum = item.monthNumber.toString().padStart(2, '0');
      return `T${monthNum}`;
    });
    
    const data = monthlyData.map(item => item.amount);
    
    return {
      labels,
      datasets: [{
        data,
      }],
    };
  };

  // Cấu hình biểu đồ BAR
  const barChartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: '500',
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#e5e7eb',
      strokeDasharray: "0",
    },
    fillShadowGradient: '#3b82f6',
    fillShadowGradientOpacity: 0.15,
    barPercentage: 0.6,
    formatYLabel: (value) => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(0)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
      }
      return value.toString();
    },
    propsForVerticalLabels: {
      fontSize: 10,
      rotation: 0,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
    },
  };

  // Cấu hình biểu đồ LINE
  const lineChartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: '500',
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#e5e7eb',
      strokeDasharray: "0",
    },
    fillShadowGradient: '#3b82f6',
    fillShadowGradientOpacity: 0.1,
    formatYLabel: (value) => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(0)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
      }
      return value.toString();
    },
    propsForVerticalLabels: {
      fontSize: 10,
      rotation: 0,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
    },
    strokeWidth: 3,
  };

  // Tính chiều rộng cho biểu đồ
  const calculateChartWidth = () => {
    const barWidth = 35;
    const spacing = 5;
    const totalWidth = (barWidth + spacing) * 12;
    return Math.max(totalWidth, screenWidth - 40);
  };

  // Hàm xác định màu cho cột biểu đồ
  const getBarColor = (value, index) => {
    if (value === 0) return '#d1d5db';
    
    const maxAmount = getMaxAmount();
    const ratio = value / maxAmount;
    
    if (ratio > 0.7) return '#ef4444';
    if (ratio > 0.4) return '#f59e0b';
    return '#10b981';
  };

  // Hàm xác định màu cho điểm trên biểu đồ đường
  const getDotColor = (value, index) => {
    if (value === 0) return '#d1d5db';
    
    const maxAmount = getMaxAmount();
    const ratio = value / maxAmount;
    
    if (ratio > 0.7) return '#ef4444';
    if (ratio > 0.4) return '#f59e0b';
    return '#10b981';
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
  const hasData = monthlyData.some(month => month.amount > 0);
  const chartWidth = calculateChartWidth();
  const chartData = prepareChartData();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Thống Kê Chi Tiêu</Text>
        <Text style={styles.headerSubtitle}>
          Biểu đồ chi tiêu theo tháng {selectedYear}
        </Text>
      </View>

      {/* Year Selector */}
      <View style={styles.yearSelector}>
        <Text style={styles.yearLabel}>Năm:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.yearScroll}
        >
          {getAvailableYears().map(year => (
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

      {/* Chart Type Selector */}
      <View style={styles.chartTypeSelector}>
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            chartType === 'bar' && styles.chartTypeButtonActive,
          ]}
          onPress={() => setChartType('bar')}
        >
          <Ionicons 
            name="bar-chart" 
            size={20} 
            color={chartType === 'bar' ? '#fff' : '#6b7280'} 
          />
          <Text style={[
            styles.chartTypeText,
            chartType === 'bar' && styles.chartTypeTextActive,
          ]}>
            Biểu đồ cột
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.chartTypeButton,
            chartType === 'line' && styles.chartTypeButtonActive,
          ]}
          onPress={() => setChartType('line')}
        >
          <Ionicons 
            name="trending-up" 
            size={20} 
            color={chartType === 'line' ? '#fff' : '#6b7280'} 
          />
          <Text style={[
            styles.chartTypeText,
            chartType === 'line' && styles.chartTypeTextActive,
          ]}>
            Biểu đồ đường
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="wallet-outline" size={24} color="#059669" />
          </View>
          <Text style={styles.summaryLabel}>Tổng chi năm</Text>
          <Text style={styles.summaryValue}>{formatCurrency(yearTotal)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.summaryLabel}>Trung bình/tháng</Text>
          <Text style={styles.summaryValue}>{formatCurrency(monthlyAverage)}</Text>
        </View>
      </View>

      {/* Chart Container */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Chi tiêu hàng tháng (₫)</Text>
        
        {hasData ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.chartScrollView}
          >
            <View style={[styles.chartWrapper, { width: chartWidth }]}>
              {chartType === 'bar' ? (
                <BarChart
                  data={chartData}
                  width={chartWidth}
                  height={250}
                  chartConfig={barChartConfig}
                  style={styles.chart}
                  fromZero
                  showValuesOnTopOfBars={false}
                  yAxisLabel=""
                  yAxisSuffix=""
                  verticalLabelRotation={0}
                  segments={5}
                  withInnerLines={true}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  yLabelsOffset={10}
                  xLabelsOffset={-5}
                  // Sử dụng hàm để xác định màu cho từng cột
                  getBarColor={(data, index) => getBarColor(data, index)}
                />
              ) : (
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  height={250}
                  chartConfig={lineChartConfig}
                  style={styles.chart}
                  bezier
                  fromZero
                  segments={5}
                  withInnerLines={true}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  withShadow={false}
                  yLabelsOffset={10}
                  xLabelsOffset={-5}
                  // Màu cho đường chính
                  color={(opacity = 1) => `rgba(59, 130, 246, ${opacity})`}
                  // Màu cho các điểm
                  getDotColor={(data, index) => getDotColor(data, index)}
                />
              )}
              
              {/* Chú thích màu */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.legendText}>Chi tiêu thấp</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.legendText}>Chi tiêu trung bình</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>Chi tiêu cao</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#d1d5db' }]} />
                  <Text style={styles.legendText}>Không có chi tiêu</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={60} color="#d1d5db" />
            <Text style={styles.noDataText}>
              Chưa có dữ liệu chi tiêu cho năm {selectedYear}
            </Text>
            <Text style={styles.noDataSubtext}>
              Hãy thêm chi tiêu để xem thống kê
            </Text>
          </View>
        )}
      </View>

      {/* Monthly Breakdown */}
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Chi tiết theo tháng</Text>
        <View style={styles.monthGrid}>
          {monthlyData.map((month, index) => (
            <View 
              key={index} 
              style={[
                styles.monthCard,
                month.amount === 0 && styles.monthCardEmpty
              ]}
            >
              <Text style={styles.monthName}>{month.month}</Text>
              <Text style={[
                styles.monthAmount,
                month.amount === 0 && styles.monthAmountEmpty
              ]}>
                {formatCurrency(month.amount)}
              </Text>
              <Text style={styles.monthCount}>
                {month.expensesCount} khoản chi
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Statistics Summary */}
      <View style={styles.statisticsContainer}>
        <Text style={styles.statisticsTitle}>📈 Phân tích</Text>
        
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={20} color="#3b82f6" />
            <Text style={styles.statLabel}>Tháng có chi tiêu</Text>
            <Text style={styles.statValue}>
              {monthlyData.filter(m => m.amount > 0).length}/12 tháng
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={20} color="#ef4444" />
            <Text style={styles.statLabel}>Tháng chi cao nhất</Text>
            <Text style={styles.statValue}>
              {(() => {
                const maxMonth = monthlyData.reduce((prev, current) => 
                  (prev.amount > current.amount) ? prev : current
                );
                return maxMonth.amount > 0 ? `T${maxMonth.monthNumber.toString().padStart(2, '0')}` : '---';
              })()}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="trending-down" size={20} color="#10b981" />
            <Text style={styles.statLabel}>Tháng chi thấp nhất</Text>
            <Text style={styles.statValue}>
              {(() => {
                const monthsWithData = monthlyData.filter(m => m.amount > 0);
                if (monthsWithData.length === 0) return '---';
                const minMonth = monthsWithData.reduce((prev, current) => 
                  (prev.amount < current.amount) ? prev : current
                );
                return `T${minMonth.monthNumber.toString().padStart(2, '0')}`;
              })()}
            </Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Mẹo phân tích chi tiêu</Text>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
          <Text style={styles.tipText}>
            So sánh chi tiêu từng tháng để tìm ra mẫu chi tiêu
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
          <Text style={styles.tipText}>
            Đặt mục tiêu giảm 5-10% chi tiêu cho tháng sau
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
          <Text style={styles.tipText}>
            Dành 20% thu nhập cho tiết kiệm và đầu tư
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  yearSelector: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  yearScroll: {
    maxHeight: 40,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
  },
  yearButtonActive: {
    backgroundColor: '#3b82f6',
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  yearButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    gap: 6,
  },
  chartTypeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  chartTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  chartTypeTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#fff',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginTop: 1,
    padding: 20,
    minHeight: 320,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chartScrollView: {
    flexGrow: 0,
  },
  chartWrapper: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  chart: {
    borderRadius: 12,
    paddingRight: 10,
    marginTop: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  breakdownContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 1,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  monthCard: {
    width: (screenWidth - 50) / 3,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthCardEmpty: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  monthAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
    textAlign: 'center',
  },
  monthAmountEmpty: {
    color: '#9ca3af',
  },
  monthCount: {
    fontSize: 11,
    color: '#6b7280',
  },
  statisticsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 1,
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#fff',
    marginTop: 1,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});

export default MonthlyStatsTab;