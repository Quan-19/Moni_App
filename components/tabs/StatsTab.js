import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ExpenseChart from '../ExpenseChart';
import CategoryChart from '../../screens/CategoryChart';

const StatsTab = ({ expenses }) => {
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsHeader}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{expenses.length}</Text>
          <Text style={styles.statCardLabel}>Số giao dịch</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{totalExpenses.toLocaleString()}</Text>
          <Text style={styles.statCardLabel}>Tổng chi tiêu</Text>
        </View>
      </View>

      <View style={styles.chartsSection}>
        <Text style={styles.sectionTitle}>Chi tiêu theo tháng</Text>
        <ExpenseChart expenses={expenses} />
      </View>

      <View style={styles.chartsSection}>
        <Text style={styles.sectionTitle}>Phân bổ theo danh mục</Text>
        <CategoryChart expenses={expenses} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartsSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
});

export default StatsTab;