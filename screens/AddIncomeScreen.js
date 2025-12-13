import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useDispatch } from "react-redux";
import { addIncome } from "../slices/incomeSlice";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import monthlyManager from '../utils/monthlyManager';

const incomeTypes = [
  { label: "💰 Lương chính", value: "salary", category: "Lương chính" },
  { label: "🎁 Thưởng", value: "bonus", category: "Thưởng" },
  { label: "💼 Freelance", value: "freelance", category: "Thu nhập thêm" },
  { label: "🛒 Bán hàng", value: "sales", category: "Thu nhập thêm" },
  { label: "📈 Đầu tư", value: "investment", category: "Thu nhập thêm" },
  { label: "🏠 Cho thuê", value: "rental", category: "Thu nhập thêm" },
  { label: "📋 Khác", value: "other", category: "Khác" },
];

export default function AddIncomeScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState(incomeTypes[0].value);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedIncome = incomeTypes.find(t => t.value === type);

  const handleAdd = async () => {
    if (isSubmitting) return;
    
    if (!title.trim()) {
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập mô tả thu nhập");
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return Alert.alert("Số tiền không hợp lệ", "Vui lòng nhập số tiền lớn hơn 0");
    }

    setIsSubmitting(true);

    try {
      const currentMonth = monthlyManager.getCurrentMonthInfo();
      const newIncome = {
        title: title.trim(),
        amount: Number(amount),
        type: type,
        category: selectedIncome.category,
        date: Date.now(),
        firestoreDate: new Date().toISOString(),
        monthId: currentMonth.id,
      };

      console.log('📝 Creating income:', newIncome);

      const resultAction = await dispatch(addIncome(newIncome));
      
      if (addIncome.fulfilled.match(resultAction)) {
        const addedIncome = resultAction.payload;
        console.log('✅ Income added to Redux:', addedIncome);

        Alert.alert("🎉 Thu nhập đã thêm", 
          `Đã thêm ${Number(amount).toLocaleString('vi-VN')} VND vào ${selectedIncome.category}`, [
          { 
            text: "Thêm tiếp", 
            style: "default", 
            onPress: () => {
              setTitle("");
              setAmount("");
              setType(incomeTypes[0].value);
              setIsSubmitting(false);
            }
          },
          { 
            text: "Xong", 
            style: "cancel", 
            onPress: () => {
              setIsSubmitting(false);
              navigation.goBack();
            }
          },
        ]);
      } else {
        throw new Error(resultAction.error?.message || 'Failed to add income');
      }
    } catch (error) {
      console.error("❌ Lỗi thêm thu nhập:", error);
      Alert.alert("Lỗi", "Không thể thêm thu nhập. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^\d]/g, '');
    setAmount(cleaned);
  };

  const formatAmount = (value) => {
    const num = parseInt(value);
    return !isNaN(num) && value !== '' ? num.toLocaleString('vi-VN') : '';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => !isSubmitting && navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.backButtonText}>×</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isSubmitting ? "Đang xử lý..." : "Thêm thu nhập"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {monthlyManager.getCurrentMonthInfo().name}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.successHint}>
          <Text style={styles.successHintText}>
            💰 Ghi lại thu nhập giúp bạn kiểm soát tài chính tốt hơn
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Số tiền thu nhập</Text>
            <View style={[
              styles.amountInputContainer,
              focusedInput === 'amount' && styles.inputFocused
            ]}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={formatAmount(amount)}
                onChangeText={handleAmountChange}
                onFocus={() => setFocusedInput('amount')}
                onBlur={() => setFocusedInput(null)}
                editable={!isSubmitting}
              />
              <Text style={styles.currencyText}>VND</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả</Text>
            <TextInput
              style={[
                styles.input,
                focusedInput === 'title' && styles.inputFocused
              ]}
              placeholder="VD: Lương tháng 12, Thưởng cuối năm..."
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
              onFocus={() => setFocusedInput('title')}
              onBlur={() => setFocusedInput(null)}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{title.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loại thu nhập</Text>
            <View style={[
              styles.pickerContainer,
              focusedInput === 'type' && styles.inputFocused
            ]}>
              <Picker
                selectedValue={type}
                onValueChange={setType}
                style={styles.picker}
                dropdownIconColor="#64748b"
                onFocus={() => setFocusedInput('type')}
                onBlur={() => setFocusedInput(null)}
                enabled={!isSubmitting}
              >
                {incomeTypes.map((item, index) => (
                  <Picker.Item 
                    key={index} 
                    label={item.label} 
                    value={item.value} 
                    color="#10b981"
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Tháng {monthlyManager.getCurrentMonthInfo().name}</Text>
            <Text style={styles.dateValue}>
              {new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.remainingDays}>
              Còn {monthlyManager.getRemainingDaysInMonth()} ngày trong tháng
            </Text>
          </View>

          <View style={styles.quickAmounts}>
            <Text style={styles.quickLabel}>Chọn nhanh</Text>
            <View style={styles.amountChips}>
              {[1000000, 3000000, 5000000, 10000000].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.amountChip,
                    amount === quickAmount.toString() && styles.amountChipActive,
                    isSubmitting && styles.amountChipDisabled
                  ]}
                  onPress={() => !isSubmitting && setAmount(quickAmount.toString())}
                  disabled={isSubmitting}
                >
                  <Text style={[
                    styles.amountChipText,
                    amount === quickAmount.toString() && styles.amountChipTextActive
                  ]}>
                    {quickAmount.toLocaleString('vi-VN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Mẹo quản lý thu nhập</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Ghi lại tất cả nguồn thu</Text>
              <Text style={styles.tipItem}>• Phân bổ ngân sách ngay khi nhận lương</Text>
              <Text style={styles.tipItem}>• Tự động hóa tiết kiệm</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <View style={styles.preview}>
          {title && (
            <Text style={styles.previewTitle} numberOfLines={1}>
              {title}
            </Text>
          )}
          {amount && (
            <Text style={styles.previewAmount}>
              {formatAmount(amount)} VND
            </Text>
          )}
          {selectedIncome && (
            <Text style={styles.previewCategory}>
              {selectedIncome.category}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.addButton,
            (!title || !amount || isSubmitting) && styles.addButtonDisabled
          ]}
          onPress={handleAdd}
          disabled={!title || !amount || isSubmitting}
        >
          <Text style={styles.addButtonText}>
            {isSubmitting ? "Đang xử lý..." : 
             !title || !amount ? "Thêm thu nhập" : `Thêm • ${formatAmount(amount)} VND`}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 20,
    color: "#64748b",
    fontWeight: "300",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  successHint: {
    backgroundColor: "#d1fae5",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  successHintText: {
    color: "#065f46",
    fontSize: 14,
    textAlign: "center",
  },
  formContainer: {
    padding: 20,
  },
  amountSection: {
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#10b981",
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "#a7f3d0",
    paddingVertical: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: "#10b981",
    paddingVertical: 8,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10b981",
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  inputFocused: {
    borderColor: "#10b981",
    backgroundColor: "#f8fafc",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 56,
  },
  dateInfo: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#059669",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#065f46",
  },
  remainingDays: {
    fontSize: 13,
    color: "#f59e0b",
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  quickAmounts: {
    marginBottom: 24,
  },
  quickLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 12,
  },
  amountChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#a7f3d0",
    borderRadius: 20,
  },
  amountChipActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  amountChipDisabled: {
    opacity: 0.5,
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  amountChipTextActive: {
    color: "#fff",
  },
  tipsContainer: {
    backgroundColor: "#d1fae5",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 8,
  },
  tipsList: {
    paddingLeft: 8,
  },
  tipItem: {
    fontSize: 14,
    color: "#065f46",
    marginBottom: 4,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  preview: {
    marginBottom: 12,
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  previewAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
  },
  previewCategory: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#10b981",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});