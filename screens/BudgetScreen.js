import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { ProgressBar } from 'react-native-paper';
import BudgetManager from '../utils/BudgetManager';
import monthlyManager from '../utils/monthlyManager';

const BudgetScreen = () => {
  const expenses = useSelector((state) => state.expenses.items);
  const incomes = useSelector((state) => state.incomes.items);
  
  const [budgets, setBudgets] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [totalStats, setTotalStats] = useState({});

  useEffect(() => {
    initializeBudgets();
  }, [expenses]);

  const initializeBudgets = async () => {
    await BudgetManager.initialize();
    
    // Cập nhật chi tiêu thực tế vào ngân sách
    const currentMonth = monthlyManager.getCurrentMonthInfo();
    const monthExpenses = expenses.filter(e => e.monthId === currentMonth.id);
    
    monthExpenses.forEach(expense => {
      BudgetManager.addExpenseToCategory(expense.category, expense.amount);
    });
    
    // Lấy ngân sách hiện tại
    const categoryBudgets = BudgetManager.getCategoryBudgets();
    const stats = BudgetManager.getTotalBudget();
    
    setBudgets(categoryBudgets);
    setTotalStats(stats);
  };

  const handleEditBudget = (categoryId) => {
    const category = budgets.find(b => b.id === categoryId);
    if (category) {
      setEditingCategory(categoryId);
      setEditValue(category.monthlyBudget.toString());
    }
  };

  const handleSaveBudget = async (categoryId) => {
    if (editValue === '' || isNaN(editValue)) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    const success = await BudgetManager.updateBudget(categoryId, Number(editValue));
    if (success) {
      const updatedBudgets = BudgetManager.getCategoryBudgets();
      const stats = BudgetManager.getTotalBudget();
      
      setBudgets(updatedBudgets);
      setTotalStats(stats);
      setEditingCategory(null);
      setEditValue('');
      
      Alert.alert('Thành công', 'Đã cập nhật ngân sách');
    }
  };

  const handleApplyRecommendations = async () => {
    const currentMonth = monthlyManager.getCurrentMonthInfo();
    const monthIncomes = incomes.filter(i => i.monthId === currentMonth.id);
    const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
    
    if (totalIncome <= 0) {
      Alert.alert('Thông báo', 'Vui lòng thêm thu nhập trước khi áp dụng gợi ý ngân sách');
      return;
    }

    Alert.alert(
      'Áp dụng gợi ý ngân sách',
      `Dựa trên tổng thu nhập ${(totalIncome || 0).toLocaleString('vi-VN')} VND, hệ thống sẽ đề xuất ngân sách phù hợp. Tiếp tục?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Áp dụng',
          onPress: async () => {
            await BudgetManager.applyRecommendations(totalIncome);
            const updatedBudgets = BudgetManager.getCategoryBudgets();
            const stats = BudgetManager.getTotalBudget();
            
            setBudgets(updatedBudgets);
            setTotalStats(stats);
            
            Alert.alert('Thành công', 'Đã áp dụng gợi ý ngân sách');
          },
        },
      ]
    );
  };

  const handleResetSpending = () => {
    Alert.alert(
      'Đặt lại chi tiêu',
      'Bạn có chắc muốn đặt lại chi tiêu của tất cả danh mục về 0? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt lại',
          style: 'destructive',
          onPress: async () => {
            BudgetManager.resetMonthlySpending();
            const updatedBudgets = BudgetManager.getCategoryBudgets();
            const stats = BudgetManager.getTotalBudget();
            
            setBudgets(updatedBudgets);
            setTotalStats(stats);
            
            Alert.alert('Thành công', 'Đã đặt lại chi tiêu');
          },
        },
      ]
    );
  };

  const getProgressColor = (percentage, isOverBudget) => {
    if (isOverBudget) return '#ef4444';
    if (percentage >= 90) return '#f59e0b';
    if (percentage >= 70) return '#3b82f6';
    return '#10b981';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💰 Ngân sách theo danh mục</Text>
        <Text style={styles.subtitle}>Kiểm soát chi tiêu từng nhóm</Text>
      </View>

      {/* Tổng quan ngân sách */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tổng quan tháng</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng ngân sách</Text>
            <Text style={styles.summaryValue}>{(totalStats?.totalBudget || 0).toLocaleString('vi-VN')} VND</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Đã chi tiêu</Text>
            <Text style={styles.summaryValue}>{(totalStats?.totalSpent || 0).toLocaleString('vi-VN')} VND</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Còn lại</Text>
            <Text style={[styles.summaryValue, styles.remainingValue]}>
              {(totalStats?.remaining || 0).toLocaleString('vi-VN')} VND
            </Text>
          </View>
        </View>
        
        <ProgressBar
          progress={totalStats?.totalBudget > 0 ? (totalStats?.totalSpent || 0) / (totalStats?.totalBudget || 1) : 0}
          color={(totalStats?.totalSpent || 0) > (totalStats?.totalBudget || 0) ? '#ef4444' : '#10b981'}
          style={styles.summaryProgress}
        />
      </View>

      {/* Nút hành động */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.recommendButton]}
          onPress={handleApplyRecommendations}
        >
          <Text style={styles.actionButtonText}>📊 Gợi ý ngân sách</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={handleResetSpending}
        >
          <Text style={styles.actionButtonText}>🔄 Đặt lại chi tiêu</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách ngân sách theo danh mục */}
      <View style={styles.budgetsList}>
        <Text style={styles.sectionTitle}>Ngân sách từng danh mục</Text>
        
        {budgets.map(category => (
          <View key={category.id} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <View style={styles.categoryMeta}>
                    <Text style={styles.categorySpent}>
                      Đã chi: {(category?.spent || 0).toLocaleString('vi-VN')} VND
                    </Text>
                    {category.isOverBudget && (
                      <Text style={styles.overBudgetText}>⚠️ Vượt ngân sách</Text>
                    )}
                  </View>
                </View>
              </View>
              
              <View style={styles.budgetAmount}>
                {editingCategory === category.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="numeric"
                      placeholder="Ngân sách"
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => handleSaveBudget(category.id)}
                    >
                      <Text style={styles.saveButtonText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleEditBudget(category.id)}>
                    <Text style={styles.budgetValue}>
                      {(category?.monthlyBudget || 0).toLocaleString('vi-VN')} VND
                    </Text>
                    <Text style={styles.editHint}>Chạm để sửa</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Thanh tiến độ */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>
                  {(category?.percentage || 0).toFixed(1)}%
                </Text>
                <Text style={styles.remainingText}>
                  Còn: {(category?.remaining || 0).toLocaleString('vi-VN')} VND
                </Text>
              </View>
              <ProgressBar
                progress={(category?.percentage || 0) / 100}
                color={getProgressColor(category?.percentage || 0, category?.isOverBudget || false)}
                style={styles.progressBar}
              />
            </View>

            {/* Cảnh báo nếu có */}
            {category?.percentage >= 80 && (
              <View style={[
                styles.warningBox,
                category?.percentage >= 100 ? styles.warningDanger : 
                category?.percentage >= 90 ? styles.warningWarning : styles.warningInfo
              ]}>
                <Text style={styles.warningText}>
                  {category?.percentage >= 100 
                    ? `🚨 Đã vượt ${Math.abs(category?.remaining || 0).toLocaleString('vi-VN')} VND so với ngân sách!`
                    : `⚠️ Đã sử dụng ${(category?.percentage || 0).toFixed(1)}% ngân sách`}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Hướng dẫn */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Mẹo quản lý ngân sách</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>• Đặt ngân sách thực tế cho từng danh mục</Text>
          <Text style={styles.tipItem}>• Kiểm tra thường xuyên để điều chỉnh kịp thời</Text>
          <Text style={styles.tipItem}>• Sử dụng gợi ý ngân sách dựa trên thu nhập</Text>
          <Text style={styles.tipItem}>• Ưu tiên ngân sách cho nhu cầu thiết yếu trước</Text>
        </View>
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
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  remainingValue: {
    color: '#10b981',
  },
  summaryProgress: {
    height: 8,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  recommendButton: {
    backgroundColor: '#3b82f6',
  },
  resetButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  budgetsList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  budgetCard: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categorySpent: {
    fontSize: 12,
    color: '#6b7280',
  },
  overBudgetText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '500',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  budgetAmount: {
    alignItems: 'flex-end',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  editHint: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'right',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 6,
    width: 100,
    backgroundColor: '#f9fafb',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  remainingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  warningBox: {
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningDanger: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  warningWarning: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  warningInfo: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  tipsList: {
    paddingLeft: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 4,
  },
});

export default BudgetScreen;