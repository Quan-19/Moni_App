import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  getDocs,
  getDoc, // ĐÃ THÊM
  query,
  where,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// Lấy mục tiêu của user hiện tại
export const fetchGoals = createAsyncThunk(
  "goals/fetchGoals",
  async (_, { rejectWithValue }) => {
    try {
      // KIỂM TRA NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP
      if (!auth.currentUser) {
        console.error("❌ Không có người dùng đăng nhập");
        return rejectWithValue("Người dùng chưa đăng nhập");
      }

      const q = query(
        collection(db, "goals"),
        where("userId", "==", auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);
      console.log(
        "📥 Firestore goals query result:",
        snapshot.size,
        "documents"
      );

      const goals = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("📄 Goal document data:", data);

        // Xử lý Timestamp an toàn hơn
        let deadline = null;
        if (data.deadline) {
          if (typeof data.deadline.toMillis === "function") {
            deadline = data.deadline.toMillis();
          } else if (data.deadline.seconds) {
            deadline = data.deadline.seconds * 1000;
          }
        }

        let createdAt = Date.now();
        if (data.createdAt) {
          if (typeof data.createdAt.toMillis === "function") {
            createdAt = data.createdAt.toMillis();
          } else if (data.createdAt.seconds) {
            createdAt = data.createdAt.seconds * 1000;
          }
        }
        if (deadline && deadline < 0) {
          console.warn(
            "⚠️ Invalid negative deadline detected, setting to null"
          );
          deadline = null;
        }

        return {
          id: doc.id,
          title: data.title || "",
          targetAmount: Number(data.targetAmount) || 0,
          currentAmount: Number(data.currentAmount) || 0,
          deadline: deadline,
          priority: data.priority || "medium",
          category: data.category || "general",
          isActive: data.isActive !== false,
          createdAt: createdAt,
          userId: data.userId,
        };
      });

      console.log("✅ Fetched goals from Firestore:", goals.length);
      return goals;
    } catch (error) {
      console.error("❌ Lỗi khi fetch goals:", error);
      return rejectWithValue(error.message || "Không thể tải mục tiêu");
    }
  }
);

// Thêm mục tiêu mới
export const addGoal = createAsyncThunk(
  "goals/addGoal",
  async (goalData, { rejectWithValue }) => {
    try {
      console.log("📤 Adding goal to Firestore:", goalData);

      // KIỂM TRA NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP
      if (!auth.currentUser) {
        console.error("❌ Không có người dùng đăng nhập");
        return rejectWithValue("Người dùng chưa đăng nhập");
      }

      // KIỂM TRA DỮ LIỆU ĐẦU VÀO
      if (!goalData.title || !goalData.targetAmount) {
        return rejectWithValue("Thiếu thông tin mục tiêu");
      }

      // CHUẨN BỊ DỮ LIỆU CHO FIRESTORE
      const firestoreData = {
        title: goalData.title.trim(),
        targetAmount: Number(goalData.targetAmount),
        currentAmount: Number(goalData.currentAmount || 0),
        priority: goalData.priority || "medium",
        category: goalData.category || "general",
        isActive: goalData.isActive !== false,
        createdAt: Timestamp.now(),
        userId: auth.currentUser.uid,
      };

      // XỬ LÝ DEADLINE
      if (goalData.deadline) {
        const deadlineDate = new Date(goalData.deadline);
        console.log(
          "🟡 Parsing deadline:",
          goalData.deadline,
          "->",
          deadlineDate
        );

        if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() > 0) {
          firestoreData.deadline = Timestamp.fromDate(deadlineDate);
          console.log("✅ Valid deadline set:", firestoreData.deadline);
        } else {
          console.warn("⚠️ Invalid deadline date, setting to null");
          firestoreData.deadline = null;
        }
      } else {
        firestoreData.deadline = null;
      }

      console.log("📤 Firestore data:", firestoreData);

      // THÊM VÀO FIRESTORE
      const docRef = await addDoc(collection(db, "goals"), firestoreData);
      console.log("✅ Goal added to Firestore with ID:", docRef.id);

      // TẠO DỮ LIỆU CHO REDUX
      const reduxGoal = {
        id: docRef.id,
        title: firestoreData.title,
        targetAmount: firestoreData.targetAmount,
        currentAmount: firestoreData.currentAmount,
        deadline: firestoreData.deadline
          ? firestoreData.deadline.toMillis()
          : null,
        priority: firestoreData.priority,
        category: firestoreData.category,
        isActive: true,
        createdAt: Date.now(),
        userId: auth.currentUser.uid,
      };

      console.log("✅ Goal created for Redux:", reduxGoal);
      return reduxGoal;
    } catch (error) {
      console.error("❌ Lỗi khi thêm goal vào Firestore:", error);
      return rejectWithValue(error.message || "Không thể thêm mục tiêu");
    }
  }
);

// Cập nhật tiến độ mục tiêu (ĐÃ SỬA - SỬ DỤNG getDoc)
export const updateGoalProgress = createAsyncThunk(
  "goals/updateGoalProgress",
  async ({ goalId, amount, operation = "add" }, { rejectWithValue }) => {
    try {
      console.log("🔄 updateGoalProgress called:", {
        goalId,
        amount,
        operation,
      });

      // KIỂM TRA NGƯỜI DÙNG
      if (!auth.currentUser) {
        console.error("❌ No user logged in");
        return rejectWithValue("Người dùng chưa đăng nhập");
      }

      console.log("🟡 Current user:", auth.currentUser.uid);

      if (!goalId || amount === undefined || amount === null) {
        console.error("❌ Missing data");
        return rejectWithValue("Thiếu thông tin cập nhật");
      }

      if (isNaN(amount) || Number(amount) < 0) {
        console.error("❌ Invalid amount:", amount);
        return rejectWithValue("Số tiền không hợp lệ");
      }

      console.log("🟡 GoalRef:", goalId);
      const goalRef = doc(db, "goals", goalId);

      // TRỰC TIẾP LẤY DỮ LIỆU TỪ DOCUMENT REF
      const goalDoc = await getDoc(goalRef);

      if (goalDoc.exists()) {
        const currentData = goalDoc.data();
        console.log("🟡 Current goal data:", currentData);

        // KIỂM TRA QUYỀN SỞ HỮU
        if (currentData.userId !== auth.currentUser.uid) {
          return rejectWithValue("Bạn không có quyền cập nhật mục tiêu này");
        }

        const currentAmount = currentData.currentAmount || 0;
        const targetAmount = currentData.targetAmount || 0;

        console.log(
          "🟡 Current amount:",
          currentAmount,
          "Target:",
          targetAmount
        );

        let newAmount;

        if (operation === "add") {
          newAmount = currentAmount + Number(amount);
          console.log(`💰 Adding ${amount}. New amount: ${newAmount}`);
        } else if (operation === "subtract") {
          newAmount = currentAmount - Number(amount);
          if (newAmount < 0) newAmount = 0;
          console.log(`➖ Subtracting ${amount}. New amount: ${newAmount}`);
        } else if (operation === "set") {
          newAmount = Number(amount);
          console.log(`🔧 Setting to ${newAmount}`);
        } else {
          return rejectWithValue("Hành động không hợp lệ");
        }

        console.log("🟡 Final new amount:", newAmount);

        // CẬP NHẬT FIRESTORE
        const updateData = {
          currentAmount: newAmount,
          updatedAt: Timestamp.now(),
        };

        // TỰ ĐỘNG ĐÁNH DẤU HOÀN THÀNH
        if (newAmount >= targetAmount && targetAmount > 0) {
          updateData.isActive = false;
          console.log("🏆 Goal marked as completed!");
        }

        console.log("🟡 Updating Firestore with:", updateData);
        await updateDoc(goalRef, updateData);
        console.log("✅ Firestore updated successfully");

        return {
          goalId,
          currentAmount: newAmount,
          isCompleted: newAmount >= targetAmount && targetAmount > 0,
        };
      }

      console.error("❌ Goal not found in Firestore");
      return rejectWithValue("Không tìm thấy mục tiêu");
    } catch (error) {
      console.error("❌ Error in updateGoalProgress:", error);
      console.error("❌ Error details:", error.code, error.message);
      return rejectWithValue(error.message || "Không thể cập nhật mục tiêu");
    }
  }
);

// Xoá mục tiêu
export const deleteGoal = createAsyncThunk(
  "goals/deleteGoal",
  async (goalId, { rejectWithValue }) => {
    try {
      console.log("🗑️ Deleting goal:", goalId);

      if (!goalId) {
        return rejectWithValue("Không có ID mục tiêu");
      }

      // KIỂM TRA NGƯỜI DÙNG
      if (!auth.currentUser) {
        return rejectWithValue("Người dùng chưa đăng nhập");
      }

      const goalRef = doc(db, "goals", goalId);
      const goalDoc = await getDoc(goalRef);

      // KIỂM TRA QUYỀN SỞ HỮU
      if (!goalDoc.exists()) {
        return rejectWithValue("Mục tiêu không tồn tại");
      }

      if (goalDoc.data().userId !== auth.currentUser.uid) {
        return rejectWithValue("Bạn không có quyền xóa mục tiêu này");
      }

      await deleteDoc(goalRef);
      console.log("✅ Goal deleted from Firestore");

      return goalId;
    } catch (error) {
      console.error("❌ Lỗi khi xóa goal:", error);
      return rejectWithValue(error.message || "Không thể xóa mục tiêu");
    }
  }
);

// Cập nhật mục tiêu
export const updateGoal = createAsyncThunk(
  "goals/updateGoal",
  async ({ goalId, updates }, { rejectWithValue }) => {
    try {
      console.log("✏️ Updating goal:", { goalId, updates });

      if (!goalId) {
        return rejectWithValue("Không có ID mục tiêu");
      }

      // KIỂM TRA NGƯỜI DÙNG
      if (!auth.currentUser) {
        return rejectWithValue("Người dùng chưa đăng nhập");
      }

      const goalRef = doc(db, "goals", goalId);
      const goalDoc = await getDoc(goalRef);

      // KIỂM TRA QUYỀN SỞ HỮU
      if (!goalDoc.exists()) {
        return rejectWithValue("Mục tiêu không tồn tại");
      }

      if (goalDoc.data().userId !== auth.currentUser.uid) {
        return rejectWithValue("Bạn không có quyền cập nhật mục tiêu này");
      }

      const updateData = {};

      // CHUẨN HÓA DỮ LIỆU CẬP NHẬT
      if (updates.title !== undefined) updateData.title = updates.title.trim();
      if (updates.targetAmount !== undefined)
        updateData.targetAmount = Number(updates.targetAmount);
      if (updates.currentAmount !== undefined)
        updateData.currentAmount = Number(updates.currentAmount);
      if (updates.priority !== undefined)
        updateData.priority = updates.priority;
      if (updates.category !== undefined)
        updateData.category = updates.category;
      if (updates.isActive !== undefined)
        updateData.isActive = updates.isActive;

      // XỬ LÝ DEADLINE
      if (updates.deadline !== undefined) {
        if (updates.deadline) {
          const deadlineDate = new Date(updates.deadline);
          if (!isNaN(deadlineDate.getTime())) {
            updateData.deadline = Timestamp.fromDate(deadlineDate);
          } else {
            updateData.deadline = null;
          }
        } else {
          updateData.deadline = null;
        }
      }

      updateData.updatedAt = Timestamp.now();

      await updateDoc(goalRef, updateData);
      console.log("✅ Goal updated in Firestore");

      // CHUẨN HÓA DỮ LIỆU TRẢ VỀ CHO REDUX
      const normalizedUpdates = { ...updates };
      if (updates.deadline !== undefined) {
        normalizedUpdates.deadline = updates.deadline
          ? new Date(updates.deadline).getTime()
          : null;
      }

      return { goalId, updates: normalizedUpdates };
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật goal:", error);
      return rejectWithValue(error.message || "Không thể cập nhật mục tiêu");
    }
  }
);

const goalsSlice = createSlice({
  name: "goals",
  initialState: {
    items: [],
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    lastUpdated: null,
  },
  reducers: {
    markGoalAsCompleted: (state, action) => {
      const goal = state.items.find((item) => item.id === action.payload);
      if (goal) {
        goal.isActive = false;
      }
    },
    clearGoalsError: (state) => {
      state.error = null;
    },
    resetGoalsState: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH GOALS
      .addCase(fetchGoals.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("🔄 Fetching goals...");
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.lastUpdated = Date.now();
        console.log(
          "✅ Goals fetched successfully:",
          action.payload.length,
          "goals"
        );
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        console.error("❌ Failed to fetch goals:", state.error);
      })

      // ADD GOAL
      .addCase(addGoal.pending, (state) => {
        state.status = "loading";
        state.error = null;
        console.log("🔄 Adding goal...");
      })
      .addCase(addGoal.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items.push(action.payload);
        state.lastUpdated = Date.now();
        console.log("✅ Goal added to state:", action.payload.title);
      })
      .addCase(addGoal.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        console.error("❌ Failed to add goal:", state.error);
      })

      // UPDATE GOAL PROGRESS
      .addCase(updateGoalProgress.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateGoalProgress.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { goalId, currentAmount, isCompleted } = action.payload;
        const goalIndex = state.items.findIndex((item) => item.id === goalId);

        if (goalIndex !== -1) {
          state.items[goalIndex].currentAmount = currentAmount;
          if (isCompleted) {
            state.items[goalIndex].isActive = false;
          }
          state.lastUpdated = Date.now();
          console.log(
            "✅ Goal progress updated:",
            goalId,
            currentAmount,
            "Completed:",
            isCompleted
          );
        }
      })
      .addCase(updateGoalProgress.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        console.error("❌ Failed to update goal progress:", state.error);
      })

      // DELETE GOAL
      .addCase(deleteGoal.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.lastUpdated = Date.now();
        console.log("✅ Goal deleted from state:", action.payload);
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        console.error("❌ Failed to delete goal:", state.error);
      })

      // UPDATE GOAL
      .addCase(updateGoal.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.status = "succeeded";
        const { goalId, updates } = action.payload;
        const goalIndex = state.items.findIndex((item) => item.id === goalId);

        if (goalIndex !== -1) {
          // Cập nhật từng field riêng biệt để tránh mất dữ liệu
          Object.keys(updates).forEach((key) => {
            state.items[goalIndex][key] = updates[key];
          });
          state.lastUpdated = Date.now();
          console.log("✅ Goal updated in state:", goalId);
        }
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        console.error("❌ Failed to update goal:", state.error);
      });
  },
});

export const { markGoalAsCompleted, clearGoalsError, resetGoalsState } =
  goalsSlice.actions;

export default goalsSlice.reducer;
