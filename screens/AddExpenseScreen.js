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
import { addExpense } from "../slices/expensesSlice";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

const categories = [
  "Ăn uống",
  "Mua sắm",
  "Di chuyển",
  "Giải trí",
  "Hóa đơn",
  "Y tế",
  "Khác",
];

export default function AddExpenseScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Ngày hiện tại

  const handleAdd = async () => {
    if (!title.trim()) {
      return Alert.alert("Lỗi", "Vui lòng nhập tiêu đề chi tiêu");
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
    }

    try {
      await dispatch(
        addExpense({
          title: title.trim(),
          amount: Number(amount),
          category,
          date: new Date().toISOString(), // Thêm ngày hiện tại
        })
      ).unwrap();

      Alert.alert("Thành công", "Đã thêm chi tiêu mới", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể thêm chi tiêu. Vui lòng thử lại.");
    }
  };

  const formatCurrency = (text) => {
    // Xóa tất cả ký tự không phải số
    const cleaned = text.replace(/[^\d]/g, "");
    // Định dạng thành số có dấu phân cách
    return cleaned ? parseInt(cleaned, 10).toLocaleString("vi-VN") : "";
  };

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^\d]/g, "");
    setAmount(cleaned);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header với nút back */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm chi tiêu</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Thông tin chi tiêu</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập mô tả chi tiêu..."
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
              <Text style={styles.charCount}>{title.length}/50</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số tiền (VND) *</Text>
              <View style={styles.amountContainer}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={amount ? parseInt(amount).toLocaleString("vi-VN") : ""}
                  onChangeText={handleAmountChange}
                />
                <Text style={styles.currencyText}>VND</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Danh mục</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#6b7280"
                >
                  {categories.map((cat, index) => (
                    <Picker.Item key={index} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ngày</Text>
              <TextInput
                style={styles.input}
                value={new Date().toLocaleDateString("vi-VN")}
                editable={false}
              />
              <Text style={styles.dateNote}>Tự động lấy ngày hiện tại</Text>
            </View>
          </View>

          {/* Summary Preview */}
          {(title || amount) && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Xem trước</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewItem} numberOfLines={1}>
                  <Text style={styles.previewLabel}>Tiêu đề: </Text>
                  {title || "Chưa có"}
                </Text>
                <Text style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Số tiền: </Text>
                  {amount
                    ? `${parseInt(amount).toLocaleString("vi-VN")} VND`
                    : "0 VND"}
                </Text>
                <Text style={styles.previewItem}>
                  <Text style={styles.previewLabel}>Danh mục: </Text>
                  {category}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.addButton,
                (!title || !amount) && styles.disabledButton,
              ]}
              onPress={handleAdd}
              disabled={!title || !amount}
            >
              <Text style={styles.addButtonText}>💾 Lưu chi tiêu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: "#374151",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountInput: {
    flex: 1,
    marginRight: 12,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    minWidth: 50,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  dateNote: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  previewSection: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  previewItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  previewLabel: {
    fontWeight: "600",
    color: "#6b7280",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  addButton: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
