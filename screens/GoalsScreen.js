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
import { useNavigation } from "@react-navigation/native";
import { auth } from "../firebaseConfig";

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
        const deadlineDate = new Date(newGoal.deadline);
        if (isNaN(deadlineDate.getTime())) {
          Alert.alert(
            "Lỗi",
            "Ngày hết hạn không hợp lệ. Vui lòng nhập đúng định dạng YYYY-MM-DD"
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Mục tiêu tài chính</Text>
        <Text style={styles.subtitle}>Đặt mục tiêu và theo dõi tiến độ</Text>
      </View>

      {/* Thống kê */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeGoals.length}</Text>
          <Text style={styles.statLabel}>Mục tiêu đang thực hiện</Text>
        </View>
        <View style={styles.statItem}>
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
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{completedGoals.length}</Text>
          <Text style={styles.statLabel}>Đã hoàn thành</Text>
        </View>
      </View>

      {/* Nút thêm mục tiêu */}
      <TouchableOpacity
        style={styles.addGoalButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addGoalButtonText}>+ Đặt mục tiêu mới</Text>
      </TouchableOpacity>

      {/* Danh sách mục tiêu đang thực hiện */}
      {activeGoals.length > 0 ? (
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>🎯 Đang thực hiện</Text>
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
                        <Text style={styles.deadlineText}>
                          ⏱️ Còn {progress.daysLeft} ngày
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGoal(goal.id, goal.title)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
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
                {/* Nút hành động */}
                <View style={styles.goalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.addButton]}
                    onPress={() => handleAddToGoal(goal.id)} // Sửa thành handleAddToGoal
                  >
                    <Text style={styles.actionButtonText}>💰 Thêm tiền</Text>
                  </TouchableOpacity>

                  {goal.currentAmount > 0 && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.useButton]}
                      onPress={() =>
                        handleUseFromGoal(goal.id, goal.currentAmount)
                      }
                    >
                      <Text style={styles.actionButtonText}>
                        💳 Sử dụng tiền
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Chưa có mục tiêu nào</Text>
          <Text style={styles.emptySubtext}>
            Đặt mục tiêu để bắt đầu tiết kiệm!
          </Text>
        </View>
      )}

      {/* Mục tiêu đã hoàn thành */}
      {completedGoals.length > 0 && (
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>✅ Đã hoàn thành</Text>
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
              💰 Thêm tiền vào mục tiêu
            </Text>

            <TextInput
              style={styles.addMoneyInput}
              placeholder="Nhập số tiền (VND)"
              keyboardType="numeric"
              value={addAmount}
              onChangeText={setAddAmount}
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
            <Text style={styles.modalTitle}>🎯 Đặt mục tiêu mới</Text>

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
              value={newGoal.targetAmount}
              onChangeText={(text) =>
                setNewGoal({
                  ...newGoal,
                  targetAmount: text.replace(/[^\d]/g, ""),
                })
              }
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Hạn chót (YYYY-MM-DD) - Tùy chọn"
              value={newGoal.deadline}
              onChangeText={(text) =>
                setNewGoal({ ...newGoal, deadline: text })
              }
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
            />

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
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  addGoalButton: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  addGoalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  goalsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "600",
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  deadlineText: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "600",
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  goalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  goalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#10b981",
  },
  useButton: {
    backgroundColor: "#3b82f6",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  completedCard: {
    backgroundColor: "#d1fae5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 4,
  },
  completedText: {
    fontSize: 14,
    color: "#065f46",
    marginBottom: 2,
  },
  completedSubtext: {
    fontSize: 13,
    color: "#047857",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  saveButton: {
    backgroundColor: "#10b981",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  // Thêm vào styles của GoalsScreen.js
  addMoneyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  addMoneyModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  addMoneyModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  addMoneyInput: {
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#f8fafc",
  },
  addMoneyButtons: {
    flexDirection: "row",
    gap: 10,
  },
  addMoneyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  confirmButton: {
    backgroundColor: "#10b981",
  },
  addMoneyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
export default GoalsScreen;
