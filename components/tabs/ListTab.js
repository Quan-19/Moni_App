import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { deleteExpense } from '../../slices/expensesSlice';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ListTab = ({ expenses, categories, filters, onFilterChange, navigation }) => {
  const dispatch = useDispatch();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(filters.search || '');

  const handleDelete = (id) => {
    Alert.alert(
      "Xóa chi tiêu",
      "Bạn có chắc chắn muốn xóa khoản chi tiêu này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", onPress: () => dispatch(deleteExpense(id)) },
      ]
    );
  };

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

  const handleSearchChange = (text) => {
    setSearch(text);
    onFilterChange({ ...filters, search: text });
  };

  return (
    <View style={styles.container}>
      {/* Bộ lọc */}
      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm chi tiêu..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={handleSearchChange}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons 
              name={showFilters ? "funnel" : "funnel-outline"} 
              size={18} 
              color={showFilters ? "#3B82F6" : "#6B7280"}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.simpleFilterOptions}>
            <Text style={styles.filterLabel}>Danh mục</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={filters.category}
                style={styles.picker}
                onValueChange={(value) => onFilterChange({ ...filters, category: value })}
                dropdownIconColor="#6b7280"
              >
                <Picker.Item label="Tất cả danh mục" value="All" />
                {categories.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>

            {(search || filters.category !== "All") && (
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={() => {
                  setSearch('');
                  onFilterChange({ ...filters, search: '', category: 'All' });
                }}
              >
                <Ionicons name="close-circle" size={16} color="#fff" style={styles.resetIcon} />
                <Text style={styles.resetFilterText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Danh sách */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="receipt" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Chi tiêu ({expenses.length})</Text>
          </View>
        </View>

        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color="#D1D5DB" style={styles.emptyIcon} />
            <Text style={styles.noDataText}>Không tìm thấy chi tiêu nào</Text>
            <Text style={styles.noDataSubText}>
              {search || filters.category !== "All"
                ? "Hãy thử thay đổi bộ lọc"
                : "Thêm chi tiêu mới để bắt đầu"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.expenseItem}
                onPress={() => navigation.navigate("EditExpense", { expense: item })}
              >
                <View style={[styles.categoryIconBg, { backgroundColor: getCategoryColor(item.category) + "20" }]}>
                  <Ionicons 
                    name="document-outline" 
                    size={20} 
                    color={getCategoryColor(item.category)} 
                  />
                </View>
                <View style={styles.expenseContent}>
                  <View style={styles.expenseMain}>
                    <View style={styles.expenseTitleSection}>
                      <Text style={styles.expenseTitle}>{item.title}</Text>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: getCategoryColor(item.category) },
                        ]}
                      >
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.expenseAmount}>
                      {item.amount.toLocaleString()} ₫
                    </Text>
                  </View>
                  <Text style={styles.expenseDate}>
                    {item.date
                      ? new Date(item.date).toLocaleDateString("vi-VN")
                      : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
  },
  filterToggleButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterToggleButtonActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#3B82F6',
  },
  simpleFilterOptions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    marginBottom: 14,
  },
  picker: {
    height: 50,
  },
  resetFilterButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  resetIcon: {
    marginRight: 2,
  },
  resetFilterText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    marginBottom: 16,
    marginTop: 16,
    marginHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseContent: {
    flex: 1,
  },
  expenseMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  expenseTitleSection: {
    flex: 1,
    gap: 6,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  expenseDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.4,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  noDataSubText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 13,
  },
});

export default ListTab;