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
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm chi tiêu..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={handleSearchChange}
          />
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterToggleText}>
              {showFilters ? "Ẩn" : "Lọc"}
            </Text>
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
                <Text style={styles.resetFilterText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Danh sách */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            Danh sách chi tiêu ({expenses.length})
          </Text>
        </View>

        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
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
                <View style={styles.expenseContent}>
                  <View style={styles.expenseMain}>
                    <Text style={styles.expenseTitle}>{item.title}</Text>
                    <Text style={styles.expenseAmount}>
                      {item.amount.toLocaleString()} VND
                    </Text>
                  </View>
                  <View style={styles.expenseDetails}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: getCategoryColor(item.category) },
                      ]}
                    >
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                    <Text style={styles.expenseDate}>
                      {item.date
                        ? new Date(item.date).toLocaleDateString("vi-VN")
                        : ""}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.deleteText}>✕</Text>
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginRight: 12,
  },
  filterToggleButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  simpleFilterOptions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    marginBottom: 12,
  },
  picker: {
    height: 50,
  },
  resetFilterButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetFilterText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  expenseContent: {
    flex: 1,
  },
  expenseMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expenseTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#059669',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  expenseDate: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  noDataSubText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default ListTab;