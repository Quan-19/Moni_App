import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  addGoal,
  updateGoalProgress,
  deleteGoal,
  fetchGoals,
} from "../slices/goalsSlice";
import { ProgressBar } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../firebaseConfig";
import Ionicons from "react-native-vector-icons/Ionicons";

const GoalsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const goals = useSelector((state) => state.goals.items);
  const goalsStatus = useSelector((state) => state.goals.status);
  const goalsError = useSelector((state) => state.goals.error);

  const [modalVisible, setModalVisible] = useState(false);
  const [addMoneyModalVisible, setAddMoneyModalVisible] = useState(false); // THÊM
  const [selectedGoalId, setSelectedGoalId] = useState(null); // THÊM
  const [addAmount, setAddAmount] = useState(""); // THÊM
  const [newGoal, setNewGoal] = useState({
    title: "",
    targetAmount: "",
    deadline: "",
    priority: "medium",
    category: "general",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    console.log("🎯 GoalsScreen mounted");
    console.log("Current goals:", goals.length);
    console.log("Goals status:", goalsStatus);
    console.log("Auth current user:", auth.currentUser);

    if (goalsStatus === "idle") {
      dispatch(fetchGoals());
    }
  }, [dispatch, goalsStatus]);

  useEffect(() => {
    if (goalsError) {
      console.error("❌ Goals error:", goalsError);
    }
  }, [goalsError]);

  const activeGoals = goals.filter((goal) => goal.isActive);
  const completedGoals = goals.filter((goal) => !goal.isActive);

  const calculateGoalProgress = (goal) => {
    if (!goal.targetAmount || goal.targetAmount === 0) {
      return {
        percentage: 0,
        remaining: goal.targetAmount || 0,
        daysLeft: goal.deadline
          ? Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
      };
    }

    const percentage = (goal.currentAmount / goal.targetAmount) * 100;
    return {
      percentage: Math.min(percentage, 100),
      remaining: goal.targetAmount - goal.currentAmount,
      daysLeft: goal.deadline
        ? Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const handleAddGoal = async () => {
    console.log("📝 Adding new goal:", newGoal);

    if (!newGoal.title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên mục tiêu");
      return;
    }

    if (
      !newGoal.targetAmount ||
      isNaN(newGoal.targetAmount) ||
      Number(newGoal.targetAmount) <= 0
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền mục tiêu hợp lệ");
      return;
    }

    // KIỂM TRA NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP
    if (!auth.currentUser) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập để thêm mục tiêu");
      return;
    }

    try {
      // XỬ LÝ DEADLINE
      let deadlineTimestamp = null;
      if (newGoal.deadline && newGoal.deadline.trim()) {
        const deadlineDate = parseDateInput(newGoal.deadline);
        if (!deadlineDate) {
          Alert.alert(
            "Lỗi",
            "Ngày hết hạn không hợp lệ. Vui lòng nhập đúng định dạng DD-MM-YYYY"
          );
          return;
        }
        deadlineTimestamp = deadlineDate.getTime();
      }

      const goalData = {
        title: newGoal.title.trim(),
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: 0,
        deadline: deadlineTimestamp,
        priority: newGoal.priority,
        category: newGoal.category,
        isActive: true,
      };

      console.log("📤 Dispatching addGoal with data:", goalData);

      const resultAction = await dispatch(addGoal(goalData));

      // KIỂM TRA KẾT QUẢ
      if (addGoal.fulfilled.match(resultAction)) {
        console.log("✅ Goal added successfully:", resultAction.payload);

        setNewGoal({
          title: "",
          targetAmount: "",
          deadline: "",
          priority: "medium",
          category: "general",
        });
        setModalVisible(false);

        Alert.alert("Thành công", "🎉 Đã thêm mục tiêu mới!");
      } else {
        console.error("❌ Failed to add goal:", resultAction.error);
        Alert.alert("Lỗi", "Không thể thêm mục tiêu. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("❌ Error in handleAddGoal:", error);
      Alert.alert(
        "Lỗi",
        `Không thể thêm mục tiêu: ${error.message || "Lỗi không xác định"}`
      );
    }
  };

  const handleAddToGoal = (goalId) => {
    console.log("🟡 Opening add money modal for goal:", goalId);
    setSelectedGoalId(goalId);
    setAddAmount("");
    setAddMoneyModalVisible(true);
  };

  const handleSubmitAddMoney = async () => {
    if (!selectedGoalId) return;

    console.log("🟡 Submitting add money:", addAmount);

    if (!addAmount || addAmount.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền");
      return;
    }

    const cleanedAmount = addAmount.replace(/[^\d]/g, "");
    console.log("🟡 Cleaned amount:", cleanedAmount);

    if (!cleanedAmount || isNaN(cleanedAmount) || Number(cleanedAmount) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
      return;
    }

    const amountNum = Number(cleanedAmount);
    console.log(
      `💰 Dispatching updateGoalProgress for goal ${selectedGoalId} with amount ${amountNum}`
    );

    try {
      const resultAction = await dispatch(
        updateGoalProgress({
          goalId: selectedGoalId,
          amount: amountNum,
          operation: "add",
        })
      );

      console.log("🟡 Result action:", resultAction);

      if (updateGoalProgress.fulfilled.match(resultAction)) {
        const { currentAmount, isCompleted } = resultAction.payload;
        console.log("✅ Goal updated successfully:", {
          currentAmount,
          isCompleted,
        });

        setAddMoneyModalVisible(false);
        setSelectedGoalId(null);
        setAddAmount("");

        if (isCompleted) {
          Alert.alert(
            "🎉 Chúc mừng!",
            `Bạn đã hoàn thành mục tiêu! Đã tiết kiệm được ${currentAmount.toLocaleString(
              "vi-VN"
            )} VND`,
            [
              {
                text: "Tuyệt vời!",
                onPress: () => {
                  dispatch(fetchGoals());
                },
              },
            ]
          );
        } else {
          Alert.alert(
            "Thành công",
            `Đã thêm ${amountNum.toLocaleString("vi-VN")} VND vào mục tiêu.`,
            [
              {
                text: "Tiếp tục",
                onPress: () => {
                  dispatch(fetchGoals());
                },
              },
            ]
          );
        }
      } else {
        console.error("❌ updateGoalProgress rejected:", resultAction.error);
        Alert.alert(
          "Lỗi",
          resultAction.error?.message || "Không thể thêm tiền vào mục tiêu"
        );
      }
    } catch (error) {
      console.error("❌ Error in handleSubmitAddMoney:", error);
      Alert.alert(
        "Lỗi",
        `Không thể thêm tiền: ${error.message || "Lỗi không xác định"}`
      );
    }
  };

  const handleUseFromGoal = (goalId, currentAmount) => {
    Alert.prompt(
      "Sử dụng tiền từ mục tiêu",
      `Số tiền hiện có: ${currentAmount.toLocaleString(
        "vi-VN"
      )} VND\nNhập số tiền muốn sử dụng:`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Sử dụng",
          onPress: async (amount) => {
            if (!amount || amount.trim() === "") {
              Alert.alert("Lỗi", "Vui lòng nhập số tiền");
              return;
            }

            const cleanedAmount = amount.replace(/[^\d]/g, "");
            const amountNum = Number(cleanedAmount);

            if (!cleanedAmount || isNaN(amountNum) || amountNum <= 0) {
              Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
              return;
            }

            if (amountNum > currentAmount) {
              Alert.alert("Lỗi", "Không đủ tiền trong mục tiêu");
              return;
            }

            try {
              const resultAction = await dispatch(
                updateGoalProgress({
                  goalId,
                  amount: amountNum,
                  operation: "subtract",
                })
              );

              if (updateGoalProgress.fulfilled.match(resultAction)) {
                Alert.alert(
                  "Thành công",
                  `Đã sử dụng ${amountNum.toLocaleString(
                    "vi-VN"
                  )} VND từ mục tiêu`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        dispatch(fetchGoals());
                      },
                    },
                  ]
                );
              } else {
                Alert.alert("Lỗi", "Không thể sử dụng tiền từ mục tiêu");
              }
            } catch (error) {
              Alert.alert("Lỗi", "Không thể sử dụng tiền từ mục tiêu");
            }
          },
        },
      ],
      "plain-text",
      "",
      "numeric"
    );
  };

  const handleDeleteGoal = (goalId, goalTitle) => {
    Alert.alert(
      "Xóa mục tiêu",
      `Bạn có chắc chắn muốn xóa mục tiêu "${goalTitle}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deleteGoal(goalId)).unwrap();
              Alert.alert("Thành công", "Đã xóa mục tiêu");
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa mục tiêu");
            }
          },
        },
      ]
    );
  };

  const calculateMonthlySaving = (goal) => {
    if (!goal.deadline || goal.deadline <= Date.now()) return null;

    const daysLeft = Math.ceil(
      (goal.deadline - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const remainingAmount = goal.targetAmount - goal.currentAmount;

    if (daysLeft <= 0) return remainingAmount;

    const monthsLeft = daysLeft / 30;
    return Math.ceil(remainingAmount / monthsLeft);
  };

  const formatDateInput = (value) => {
    const digits = (value || "").replace(/[^\d]/g, "").slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    return [day, month, year].filter(Boolean).join("-");
  };

  const parseDateInput = (value) => {
    const digits = (value || "").replace(/[^\d]/g, "");
    if (digits.length !== 8) return null;
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
      return null;
    }
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  };

  const formatDateFromDate = (date) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const formatted = formatDateFromDate(selectedDate);
      setNewGoal((prev) => ({ ...prev, deadline: formatted }));
    }
  };

  const formatNumberWithCommas = (value) => {
    if (!value) return "";
    const cleaned = value.replace(/[^\d]/g, "");
    if (!cleaned) return "";
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString("vi-VN");
  };

  // Loading state
  if (goalsStatus === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải mục tiêu...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header với icon */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="trophy-outline" size={28} color="#3B82F6" />
          <Text style={styles.title}>Mục tiêu tài chính</Text>
        </View>
        <Text style={styles.subtitle}>Đặt mục tiêu và theo dõi tiến độ</Text>
      </View>

      {/* Thống kê */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={styles.statIconBg}>
            <Ionicons name="bullseye" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.statNumber}>{activeGoals.length}</Text>
          <Text style={styles.statLabel}>Đang thực hiện</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconBg}>
            <Ionicons name="wallet" size={24} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>
            {formatCurrency(
              activeGoals.reduce(
                (sum, goal) => sum + (goal.currentAmount || 0),
                0
              )
            )}
          </Text>
          <Text style={styles.statLabel}>Đã tiết kiệm</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconBg}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
          </View>
          <Text style={styles.statNumber}>{completedGoals.length}</Text>
          <Text style={styles.statLabel}>Hoàn thành</Text>
        </View>
      </View>

      {/* Nút thêm mục tiêu */}
      <TouchableOpacity
        style={styles.addGoalButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle" size={20} color="#fff" style={styles.addButtonIcon} />
        <Text style={styles.addGoalButtonText}>Đặt mục tiêu mới</Text>
      </TouchableOpacity>

      {/* Danh sách mục tiêu đang thực hiện */}
      {activeGoals.length > 0 ? (
        <View style={styles.goalsSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flame" size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Đang thực hiện</Text>
          </View>
          {activeGoals.map((goal) => {
            const progress = calculateGoalProgress(goal);
            const monthlySaving = calculateMonthlySaving(goal);

            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <View style={styles.goalMeta}>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(goal.priority) },
                        ]}
                      >
                        <Text style={styles.priorityText}>
                          {goal.priority === "high"
                            ? "Cao"
                            : goal.priority === "medium"
                            ? "Trung bình"
                            : "Thấp"}
                        </Text>
                      </View>
                      {goal.deadline && progress.daysLeft > 0 && (
                        <View style={styles.deadlineTag}>
                          <Ionicons name="hourglass" size={12} color="#F59E0B" />
                          <Text style={styles.deadlineText}>
                            Còn {progress.daysLeft} ngày
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGoal(goal.id, goal.title)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Tiến độ */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>
                      {formatCurrency(goal.currentAmount)}/
                      {formatCurrency(goal.targetAmount)} VND
                    </Text>
                    <Text style={styles.progressPercentage}>
                      {progress.percentage.toFixed(1)}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={progress.percentage / 100}
                    color={getPriorityColor(goal.priority)}
                    style={styles.progressBar}
                  />
                </View>

                {/* Thông tin bổ sung */}
                <View style={styles.goalInfo}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Còn lại</Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency(progress.remaining)} VND
                    </Text>
                  </View>
                  {monthlySaving && monthlySaving > 0 && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Cần tiết kiệm/tháng</Text>
                      <Text style={styles.infoValue}>
                        {formatCurrency(monthlySaving)} VND
                      </Text>
                    </View>
                  )}
                </View>

                {/* Nút hành động */}
                <View style={styles.goalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addButton]}
                    onPress={() => handleAddToGoal(goal.id)}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Thêm tiền</Text>
                  </TouchableOpacity>

                  {goal.currentAmount > 0 && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.useButton]}
                      onPress={() =>
                        handleUseFromGoal(goal.id, goal.currentAmount)
                      }
                    >
                      <Ionicons name="card-outline" size={18} color="#fff" />
                      <Text style={styles.actionButtonText}>Sử dụng</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="target-outline" size={64} color="#D1D5DB" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Chưa có mục tiêu nào</Text>
          <Text style={styles.emptySubtext}>
            Đặt mục tiêu để bắt đầu tiết kiệm!
          </Text>
        </View>
      )}

      {/* Mục tiêu đã hoàn thành */}
      {completedGoals.length > 0 && (
        <View style={styles.goalsSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="checkmark-done-circle" size={20} color="#22C55E" />
            <Text style={styles.sectionTitle}>Đã hoàn thành</Text>
          </View>
          {completedGoals.map((goal) => (
            <View key={goal.id} style={[styles.goalCard, styles.completedCard]}>
              <Text style={styles.completedTitle}>🎉 {goal.title}</Text>
              <Text style={styles.completedText}>
                Đã đạt mục tiêu {formatCurrency(goal.targetAmount)} VND
              </Text>
              <Text style={styles.completedSubtext}>
                Đã tiết kiệm: {formatCurrency(goal.currentAmount)} VND
              </Text>
            </View>
          ))}
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addMoneyModalVisible}
        onRequestClose={() => {
          setAddMoneyModalVisible(false);
          setSelectedGoalId(null);
          setAddAmount("");
        }}
      >
        <View style={styles.addMoneyModalOverlay}>
          <View style={styles.addMoneyModalContent}>
            <Text style={styles.addMoneyModalTitle}>
              Thêm tiền vào mục tiêu
            </Text>

            <TextInput
              style={styles.addMoneyInput}
              placeholder="Nhập số tiền (VND)"
              keyboardType="numeric"
              value={formatNumberWithCommas(addAmount)}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^\d]/g, "");
                setAddAmount(cleaned);
              }}
              autoFocus
            />

            <View style={styles.addMoneyButtons}>
              <TouchableOpacity
                style={[styles.addMoneyButton, styles.cancelButton]}
                onPress={() => {
                  setAddMoneyModalVisible(false);
                  setSelectedGoalId(null);
                  setAddAmount("");
                }}
              >
                <Text style={styles.addMoneyButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addMoneyButton, styles.confirmButton]}
                onPress={handleSubmitAddMoney}
              >
                <Text style={styles.addMoneyButtonText}>Thêm tiền</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal thêm mục tiêu */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đặt mục tiêu mới</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Tên mục tiêu (VD: Mua điện thoại mới)"
              value={newGoal.title}
              onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
              maxLength={50}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Số tiền mục tiêu (VND)"
              keyboardType="numeric"
              value={formatNumberWithCommas(newGoal.targetAmount)}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^\d]/g, "");
                setNewGoal({ ...newGoal, targetAmount: cleaned });
              }}
            />

            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerButtonLabel}>Hạn chót</Text>
              <Text style={styles.datePickerButtonValue}>
                {newGoal.deadline || "Chọn ngày"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={parseDateInput(newGoal.deadline) || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
              />
            )}

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newGoal.priority}
                onValueChange={(value) =>
                  setNewGoal({ ...newGoal, priority: value })
                }
              >
                <Picker.Item label="Ưu tiên cao" value="high" />
                <Picker.Item label="Ưu tiên trung bình" value="medium" />
                <Picker.Item label="Ưu tiên thấp" value="low" />
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddGoal}
              >
                <Text style={styles.saveButtonText}>Lưu mục tiêu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    marginLeft: 40,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
  addGoalButton: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonIcon: {
    marginRight: 4,
  },
  addGoalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  goalsSection: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  goalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  goalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  deadlineTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  deadlineText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
  deleteButton: {
    padding: 8,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2937",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  goalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  goalActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  addButton: {
    backgroundColor: "#10B981",
  },
  useButton: {
    backgroundColor: "#3B82F6",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 48,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  completedCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 4,
  },
  completedText: {
    fontSize: 14,
    color: "#047857",
    marginBottom: 2,
  },
  completedSubtext: {
    fontSize: 13,
    color: "#10B981",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 24,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    fontSize: 16,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  datePickerButtonLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  datePickerButtonValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "700",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "700",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  addMoneyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  addMoneyModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  addMoneyModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 24,
    textAlign: "center",
  },
  addMoneyInput: {
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 24,
    backgroundColor: "#F8FAFC",
  },
  addMoneyButtons: {
    flexDirection: "row",
    gap: 12,
  },
  addMoneyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#10B981",
  },
  addMoneyButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
export default GoalsScreen;
