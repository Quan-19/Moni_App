
import React, { useState, useEffect, useCallback, useRef } from "react"; // Thêm useRef
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  PanResponder, // Thêm PanResponder
  Animated,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { fetchExpenses } from "../slices/expensesSlice";
import { fetchIncomes } from "../slices/incomeSlice";
import { fetchGoals } from "../slices/goalsSlice";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../firebaseConfig";
import MonthlyStatsTab from "../components/tabs/MonthlyStatsTab";

// Import các component đã tạo
import FloatingActionButton from "../components/FloatingActionButton";
import OverviewTab from "../components/tabs/OverviewTab";
import ListTab from "../components/tabs/ListTab";
// import StatsTab from "../components/tabs/StatsTab";
import DailyTracker from "../components/DailyTracker";
import BudgetScreen from "../screens/BudgetScreen";
import GoalsScreen from "../screens/GoalsScreen";
import FinancialOverview from "../components/FinancialOverview";

// Import monthly manager
import monthlyManager from "../utils/monthlyManager";

// Import icons
import Ionicons from "react-native-vector-icons/Ionicons";

const categories = [
  "Ăn uống",
  "Mua sắm",
  "Di chuyển",
  "Giải trí",
  "Hóa đơn",
  "Y tế",
  "Tiết kiệm",
  "Khác",
];

// Định nghĩa các tab mới (ĐÃ SỬA: bỏ tab budget ở đây)
const tabs = [
  { id: "overview", label: "📊 Tổng quan", /*icon: "stats-chart" */ },
  { id: "daily", label: "📅 Hàng ngày", /*icon: "calendar"*/ },
  { id: "goals", label: "🎯 Mục tiêu", /*icon: "trophy"*/ },
  // { id: "budget", label: "💰 Ngân sách", icon: "wallet" }, // CHỈ HIỆN Ở TAB BUDGET
  { id: "list", label: "📝 Danh sách", /*icon: "list"*/ },
  // { id: "stats", label: "📈 Thống kê", icon: "analytics" },
  { id: "monthly-stats", label: "📊 Tháng", /*icon: "bar-chart" */ },
];

export default function HomeScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const allExpenses = useSelector((state) => state.expenses.items);
  const allIncomes = useSelector((state) => state.incomes.items);
  const allGoals = useSelector((state) => state.goals.items);
  const expensesStatus = useSelector((state) => state.expenses.status);
  const incomesStatus = useSelector((state) => state.incomes.status);
  const goalsStatus = useSelector((state) => state.goals.status);

  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
  });
  const [currentMonth, setCurrentMonth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false); // Danh sách ID tháng đang được mở rộng
  
  // Biến để xác định xem có đang vuốt không
  const [isSwiping, setIsSwiping] = useState(false);
  // Vị trí bắt đầu vuốt
  const panResponderRef = useRef(null);
  // Animated translateX cho hiệu ứng chuyển tab
  const translateX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  
  // Khởi tạo PanResponder với hiệu ứng Animated - Tối ưu hóa
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Chỉ bắt khi di chuyển ngang đủ mạnh (dx > |dy| * 2)
        // Tránh conflict với vertical scroll
        const isHorizontalMove = Math.abs(gestureState.dx) > 10 && 
                                 Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
        return isHorizontalMove;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        setIsSwiping(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Giới hạn di chuyển để tránh bị kéo quá xa
        const maxTranslate = screenWidth * 0.4;
        const clampedDx = Math.max(-maxTranslate, Math.min(gestureState.dx, maxTranslate));
        translateX.setValue(clampedDx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentIndex = tabs.findIndex((t) => t.id === activeTab);
        const hasNext = currentIndex < tabs.length - 1;
        const hasPrev = currentIndex > 0;

        // Ngưỡng và vận tốc
        const threshold = 50;
        const velocity = gestureState.vx;
        const swipeLeftFast = gestureState.dx < -threshold || (velocity < -0.5 && gestureState.dx < 0);
        const swipeRightFast = gestureState.dx > threshold || (velocity > 0.5 && gestureState.dx > 0);

        if (swipeLeftFast && hasNext) {
          // Vuốt sang trái: chuyển sang tab tiếp theo
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            const nextTab = tabs[currentIndex + 1].id;
            setActiveTab(nextTab);
            translateX.setValue(screenWidth);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(() => setIsSwiping(false));
          });
        } else if (swipeRightFast && hasPrev) {
          // Vuốt sang phải: chuyển sang tab trước
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            const prevTab = tabs[currentIndex - 1].id;
            setActiveTab(prevTab);
            translateX.setValue(-screenWidth);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(() => setIsSwiping(false));
          });
        } else {
          // Không đủ ngưỡng: trả về vị trí cũ với spring animation
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start(() => setIsSwiping(false));
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start(() => setIsSwiping(false));
      },
      onShouldBlockNativeResponder: () => {
        // Không block native responder để cho phép scroll hoạt động
        return false;
      },
    });
  }, [activeTab, translateX, screenWidth]);

  // Hàm xử lý vuốt từ trái sang phải (về tab trước)
  const handleSwipeRight = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      const prevTab = tabs[currentIndex - 1];
      setActiveTab(prevTab.id);
    }
  };

  // Hàm xử lý vuốt từ phải sang trái (đến tab sau)
  const handleSwipeLeft = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1];
      setActiveTab(nextTab.id);
    }
  };

  // Hàm để khởi tạo và đồng bộ dữ liệu
  const initializeData = useCallback(async () => {
    try {
      console.log("🔄 Bắt đầu khởi tạo dữ liệu...");
      console.log("📊 Số chi tiêu từ Redux:", allExpenses.length);

      // Khởi tạo monthly manager với dữ liệu từ Redux
      await monthlyManager.initialize(allExpenses);

      // Lấy thông tin tháng hiện tại
      const monthInfo = monthlyManager.getCurrentMonthInfo();

      setCurrentMonth(monthInfo);
      setIsDataInitialized(true);

      console.log("✅ Khởi tạo thành công:", {
        currentMonth: monthInfo?.name,
        currentMonthExpenses: monthInfo?.expenses?.length,
      });

      return monthInfo;
    } catch (error) {
      console.error("❌ Lỗi khởi tạo dữ liệu:", error);
      return null;
    }
  }, [allExpenses]);

  // Effect để fetch dữ liệu từ Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log("🔄 Bắt đầu fetch dữ liệu từ Firestore...");

        // Fetch tất cả dữ liệu từ Firestore
        await Promise.all([
          dispatch(fetchExpenses()),
          dispatch(fetchIncomes()),
          dispatch(fetchGoals()),
        ]);

        console.log("✅ Fetch dữ liệu hoàn tất");
      } catch (error) {
        console.error("❌ Lỗi fetch dữ liệu:", error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu từ máy chủ");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  // Effect để khởi tạo monthly manager KHI dữ liệu đã được fetch
  useEffect(() => {
    const initManager = async () => {
      // Chỉ khởi tạo khi dữ liệu đã sẵn sàng và chưa được khởi tạo
      if (
        expensesStatus === "succeeded" &&
        incomesStatus === "succeeded" &&
        goalsStatus === "succeeded" &&
        !isDataInitialized &&
        allExpenses.length >= 0
      ) {
        console.log("📥 Trạng thái dữ liệu:", {
          expenses: expensesStatus,
          incomes: incomesStatus,
          goals: goalsStatus,
          expenseCount: allExpenses.length,
          incomeCount: allIncomes.length,
          goalCount: allGoals.length,
        });

        await initializeData();
      }
    };

    initManager();
  }, [
    expensesStatus,
    incomesStatus,
    goalsStatus,
    allExpenses,
    allIncomes,
    allGoals,
    isDataInitialized,
    initializeData,
  ]);

  // Effect để cập nhật dữ liệu khi allExpenses thay đổi (thêm/sửa/xóa)
  useEffect(() => {
    const updateData = async () => {
      if (isDataInitialized && monthlyManager && allExpenses.length > 0) {
        try {
          console.log("🔄 Cập nhật dữ liệu với monthly manager...");
          console.log("📝 Số chi tiêu mới:", allExpenses.length);

          // Sử dụng syncWithRedux thay vì updateExpenses
          const updatedExpenses = await monthlyManager.syncWithRedux(
            allExpenses
          );

          // Lấy lại thông tin tháng hiện tại
          const monthInfo = monthlyManager.getCurrentMonthInfo();

          setCurrentMonth(monthInfo);

          console.log("✅ Cập nhật thành công:", {
            currentMonth: monthInfo?.name,
            expensesInMonth: updatedExpenses?.length || 0,
            totalInMonth: monthInfo?.total || 0,
          });
        } catch (error) {
          console.error("❌ Lỗi cập nhật monthly manager:", error);
        }
      }
    };

    updateData();
  }, [allExpenses, isDataInitialized]);

  // Hàm để làm mới dữ liệu
  const refreshData = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Làm mới dữ liệu...");

      // Fetch lại dữ liệu từ Firestore
      await Promise.all([
        dispatch(fetchExpenses()),
        dispatch(fetchIncomes()),
        dispatch(fetchGoals()),
      ]);

      // Khởi tạo lại monthly manager
      await initializeData();

      console.log("✅ Làm mới dữ liệu thành công");
    } catch (error) {
      console.error("❌ Lỗi làm mới dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm logout
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await auth.signOut();
            console.log("✅ Đã đăng xuất");
            // Navigation sẽ tự động chuyển đến Auth screen nhờ RootNavigation
          } catch (error) {
            console.error("❌ Lỗi đăng xuất:", error);
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  // Hàm mở profile với refresh
  const handleProfile = () => {
    Alert.alert(
      "Thông tin tài khoản",
      `👤 Tài khoản:\n${
        auth.currentUser?.email || "Không có email"
      }\n\n📊 Dữ liệu:\n• Chi tiêu: ${allExpenses.length}\n• Thu nhập: ${
        allIncomes.length
      }\n• Mục tiêu: ${allGoals.length}`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Làm mới dữ liệu",
          onPress: refreshData,
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: handleLogout,
        },
      ]
    );
  };

  // Filter logic - chỉ lọc chi tiêu của tháng hiện tại
  const getCurrentMonthExpenses = () => {
    if (!currentMonth || !currentMonth.expenses) return [];
    return currentMonth.expenses || [];
  };

  const filteredExpenses = getCurrentMonthExpenses().filter((item) => {
    if (
      filters.search &&
      !item.title.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.category !== "All" && item.category !== filters.category) {
      return false;
    }
    return true;
  });



  // Render header với thông tin tháng
  const renderMonthHeader = () => {
    if (isLoading || !isDataInitialized) {
      return (
        <View style={styles.monthHeader}>
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      );
    }

    return (
      <View style={styles.monthHeader}>
        <View style={styles.monthInfo}>
          <Text style={styles.monthTitle}>
            📅 {currentMonth?.name || "Tháng hiện tại"}
          </Text>
          <Text style={styles.monthSubtitle}>
            {getCurrentMonthExpenses().length} chi •{" "}
            {getCurrentMonthExpenses()
              .reduce((sum, e) => sum + (e?.amount || 0), 0)
              .toLocaleString("vi-VN")} ₫
          </Text>
        </View>
      </View>
    );
  };

  // Render cảnh báo cuối tháng
  const renderEndOfMonthAlert = () => {
    if (monthlyManager.isEndOfMonth()) {
      const remainingDays = monthlyManager.getRemainingDaysInMonth();
      return (
        <View style={styles.endOfMonthAlert}>
          <Text style={styles.alertTitle}>⚠️ Cuối tháng!</Text>
          <Text style={styles.alertText}>
            Còn {remainingDays} ngày nữa là sang tháng mới
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderTabContent = () => {
    if (isLoading || !isDataInitialized) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const commonProps = {
      expenses: filteredExpenses,
      allExpenses: getCurrentMonthExpenses(),
      categories,
      filters,
      onFilterChange: setFilters,
      navigation,
      currentMonth: currentMonth?.name || "",
    };

    switch (activeTab) {
      case "overview":
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Truyền setActiveTab xuống FinancialOverview */}
            <FinancialOverview
              navigation={navigation}
              setActiveTab={setActiveTab}
            />
            <OverviewTab {...commonProps} />
          </ScrollView>
        );
      case "daily":
        return <DailyTracker />;
      case "monthly-stats":
        return <MonthlyStatsTab />;
      case "budget":
        return <BudgetScreen />;
      case "goals":
        return <GoalsScreen />;
      case "list":
        return <ListTab {...commonProps} />;
      // case "stats":
      //   return <StatsTab filters={filters} />;
      default:
        return null;
    }
  };

  // Custom Tab Navigation Component
  const renderTabNavigation = () => {
    if (isLoading || !isDataInitialized) return null;

    return (
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              {tab.icon ? (
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.id ? "#3b82f6" : "#6b7280"}
                  style={styles.tabIcon}
                />
              ) : null}
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Nút Floating Action Button đa chức năng
  const renderFloatingButton = () => {
    if (isLoading || !isDataInitialized) return null;

    const getFloatingButtonAction = () => {
      switch (activeTab) {
        case "overview":
        case "daily":
        case "list":
        case "stats":
          return () => navigation.navigate("AddExpense");
        case "goals":
          return () => {
            // Trong GoalsScreen đã có modal thêm mục tiêu
            // Nên không cần navigation
            return;
          };
        case "budget":
          return () => navigation.navigate("AddExpense");
        default:
          return () => navigation.navigate("AddExpense");
      }
    };

    const getFloatingButtonLabel = () => {
      switch (activeTab) {
        case "overview":
        case "daily":
        case "list":
        case "stats":
        case "budget":
          return "+";
        case "goals":
          return "🎯";
        default:
          return "+";
      }
    };

    // Chỉ hiện nút FAB khi ở các tab cần thiết
    const shouldShowFAB = [
      "overview",
      "daily",
      "list",
      // "stats",
      "budget",
    ].includes(activeTab);

    if (!shouldShowFAB) return null;

    return (
      <View style={styles.floatingButtonsContainer}>
        {/* Nút thêm thu nhập - CHỈ HIỆN KHI Ở TAB OVERVIEW */}
        {activeTab === "overview" && (
          <TouchableOpacity
            style={[styles.floatingButton, styles.floatingButtonSecondary]}
            onPress={() => {
              console.log("Navigating to AddIncome");
              navigation.navigate("AddIncome");
            }}
          >
            <Text style={styles.floatingButtonText}>💰</Text>
          </TouchableOpacity>
        )}

        {/* Nút chính */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={getFloatingButtonAction()}
        >
          <Text style={styles.floatingButtonText}>
            {getFloatingButtonLabel()}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header với nút profile */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>Moni</Text>
          <Text style={styles.appSubtitle}>
            {isDataInitialized ? currentMonth?.name : "Đang tải..."}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
          <Ionicons name="person-circle-outline" size={30} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Header tháng */}
      {renderMonthHeader()}

      {/* Tab Navigation */}
      {renderTabNavigation()}

      {/* Main Content với gesture handler + Animated */}
      <View style={styles.content} {...panResponderRef.current?.panHandlers}>
        <Animated.View style={{ flex: 1, transform: [{ translateX }] }}>
          {renderTabContent()}
        </Animated.View>
      </View>

      {/* Floating Action Buttons */}
      {renderFloatingButton()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  appSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  profileButton: {
    padding: 5,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthInfo: {
    flex: 1,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  monthSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    flex: 1,
  },
  endOfMonthAlert: {
    backgroundColor: "#fef3c7",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 2,
    textAlign: "center",
  },
  alertText: {
    fontSize: 13,
    color: "#92400e",
    textAlign: "center",
  },
  tabContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f3f4f6",
  },
  activeTab: {
    backgroundColor: "#3b82f6",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  floatingButtonsContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
    alignItems: "flex-end",
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
  },
  floatingButtonSecondary: {
    backgroundColor: "#10b981",
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
