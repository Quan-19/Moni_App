import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import SmartAlert from '../SmartAlert';
import CategoryChart from '../../screens/CategoryChart';

const OverviewTab = ({ expenses = [], navigation }) => {
  
  const getCategoryColor = (category) => {
    const colors = {
      "Ăn uống": "#ef4444",
      "Mua sắm": "#3b82f6",
      "Di chuyển": "#f59e0b",
      "Giải trí": "#8b5cf6",
      "Hóa đơn": "#10b981",
      "Y tế": "#ec4899",
      Khác: "#6b7280",
    };
    return colors[category] || "#6b7280";
  };

  // Quick Stats
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const avgExpense = expenses.length > 0 ? Math.round(totalExpenses / expenses.length) : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Cảnh báo thông minh */}
      <SmartAlert expenses={expenses} />

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{expenses.length}</Text>
          <Text style={styles.statLabel}>khoản chi</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {totalExpenses.toLocaleString()} VND
          </Text>
          <Text style={styles.statLabel}>tổng chi</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {avgExpense.toLocaleString()} VND
          </Text>
          <Text style={styles.statLabel}>trung bình</Text>
        </View>
      </View>

      {/* Biểu đồ danh mục */}
      <View style={styles.chartSummary}>
        <Text style={styles.sectionTitle}>Phân bổ chi tiêu</Text>
        <CategoryChart expenses={expenses} />
      </View>

      {/* Chi tiêu gần đây */}
      {/* <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chi tiêu gần đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ListTab')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        {expenses.slice(0, 5).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.recentItem}
            onPress={() => navigation.navigate("EditExpense", { expense: item })}
          >
            <View style={styles.recentLeft}>
              <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(item.category) }]} />
              <View>
                <Text style={styles.recentTitle}>{item.title}</Text>
                <Text style={styles.recentCategory}>{item.category}</Text>
              </View>
            </View>
            <View style={styles.recentRight}>
              <Text style={styles.recentAmount}>{item.amount.toLocaleString()} VND</Text>
              <Text style={styles.recentDate}>
                {item.date ? new Date(item.date).toLocaleDateString("vi-VN") : ""}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {expenses.length === 0 && (
          <View style={styles.emptyRecent}>
            <Text style={styles.emptyText}>Chưa có chi tiêu nào</Text>
          </View>
        )}
      </View> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recentSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  recentCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyRecent: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
});

export default OverviewTab;