import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// Lấy expenses của user hiện tại
export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async () => {
    const q = query(
      collection(db, "expenses"),
      where("userId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);

    // Convert Firestore Timestamp -> milliseconds
    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        amount: data.amount,
        date: data.date ? data.date.toMillis() : Date.now(),
        category: data.category || 'Khác',
        monthId: data.monthId || null, // Thêm monthId
        userId: data.userId,
      };
    });

    console.log('📥 Fetched expenses from Firestore:', expenses.length);
    return expenses;
  }
);

// Thêm chi tiêu mới
export const addExpense = createAsyncThunk(
  "expenses/addExpense",
  async (expenseData) => {
    console.log('📤 Adding expense to Firestore:', expenseData);
    
    // Chuẩn bị dữ liệu cho Firestore
    const firestoreData = {
      title: expenseData.title,
      amount: expenseData.amount,
      category: expenseData.category,
      monthId: expenseData.monthId || null, // Lưu monthId vào Firestore
      userId: auth.currentUser.uid,
      date: expenseData.firestoreDate 
        ? Timestamp.fromDate(new Date(expenseData.firestoreDate))
        : Timestamp.now(),
    };

    // Lưu vào Firestore
    const docRef = await addDoc(collection(db, "expenses"), firestoreData);

    // Trả về payload cho Redux
    const reduxExpense = {
      id: docRef.id,
      title: expenseData.title,
      amount: expenseData.amount,
      category: expenseData.category,
      date: expenseData.date || Date.now(), // milliseconds
      monthId: expenseData.monthId || null, // Giữ lại monthId
      userId: auth.currentUser.uid,
    };

    console.log('✅ Expense added to Firestore:', reduxExpense);
    return reduxExpense;
  }
);

// Xoá chi tiêu
export const deleteExpense = createAsyncThunk(
  "expenses/deleteExpense",
  async (expenseId) => {
    console.log('🗑️ Deleting expense:', expenseId);
    await deleteDoc(doc(db, "expenses", expenseId));
    return expenseId;
  }
);

// Cập nhật chi tiêu
export const updateExpense = createAsyncThunk(
  "expenses/updateExpense",
  async ({ id, ...expenseData }) => {
    const updateData = {
      ...expenseData,
      date: Timestamp.fromMillis(expenseData.date),
    };
    
    await updateDoc(doc(db, "expenses", id), updateData);
    return { id, ...expenseData };
  }
);

const expensesSlice = createSlice({
  name: "expenses",
  initialState: {
    items: [],
    status: "idle",
    error: null
  },
  reducers: {
    // Thêm reducer để cập nhật monthId cho expense cũ
    updateExpenseMonthId: (state, action) => {
      const { expenseId, monthId } = action.payload;
      const expense = state.items.find(item => item.id === expenseId);
      if (expense) {
        expense.monthId = monthId;
      }
    },
    
    // Thêm reducer để đồng bộ với monthlyManager
    syncWithMonthlyManager: (state, action) => {
      const { monthId, expenses } = action.payload;
      // Cập nhật monthId cho các expense thuộc tháng hiện tại
      state.items.forEach(expense => {
        if (!expense.monthId) {
          // Kiểm tra xem expense có thuộc tháng này không
          const expenseDate = new Date(expense.date);
          const currentDate = new Date();
          if (expenseDate.getMonth() === currentDate.getMonth() && 
              expenseDate.getFullYear() === currentDate.getFullYear()) {
            expense.monthId = monthId;
          }
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        console.log('🔄 Redux state updated with', action.payload.length, 'expenses');
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.items.push(action.payload);
        console.log('➕ Expense added to Redux state');
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { updateExpenseMonthId, syncWithMonthlyManager } = expensesSlice.actions;
export default expensesSlice.reducer;