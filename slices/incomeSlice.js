import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// Lấy thu nhập của user hiện tại
export const fetchIncomes = createAsyncThunk(
  "incomes/fetchIncomes",
  async () => {
    const q = query(
      collection(db, "incomes"),
      where("userId", "==", auth.currentUser.uid)
    );

    const snapshot = await getDocs(q);

    const incomes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        amount: data.amount,
        date: data.date ? data.date.toMillis() : Date.now(),
        type: data.type || 'salary',
        category: data.category || 'Lương chính',
        monthId: data.monthId || null,
        userId: data.userId,
      };
    });

    console.log('📥 Fetched incomes from Firestore:', incomes.length);
    return incomes;
  }
);

// Thêm thu nhập mới
export const addIncome = createAsyncThunk(
  "incomes/addIncome",
  async (incomeData) => {
    console.log('📤 Adding income to Firestore:', incomeData);
    
    const firestoreData = {
      title: incomeData.title,
      amount: incomeData.amount,
      type: incomeData.type || 'salary',
      category: incomeData.category || 'Lương chính',
      monthId: incomeData.monthId || null,
      userId: auth.currentUser.uid,
      date: incomeData.firestoreDate 
        ? Timestamp.fromDate(new Date(incomeData.firestoreDate))
        : Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, "incomes"), firestoreData);

    const reduxIncome = {
      id: docRef.id,
      title: incomeData.title,
      amount: incomeData.amount,
      type: incomeData.type || 'salary',
      category: incomeData.category || 'Lương chính',
      date: incomeData.date || Date.now(),
      monthId: incomeData.monthId || null,
      userId: auth.currentUser.uid,
    };

    console.log('✅ Income added to Firestore:', reduxIncome);
    return reduxIncome;
  }
);

// Xoá thu nhập
export const deleteIncome = createAsyncThunk(
  "incomes/deleteIncome",
  async (incomeId) => {
    console.log('🗑️ Deleting income:', incomeId);
    await deleteDoc(doc(db, "incomes", incomeId));
    return incomeId;
  }
);

const incomeSlice = createSlice({
  name: "incomes",
  initialState: {
    items: [],
    status: "idle",
    error: null
  },
  reducers: {
    // Thêm reducer để cập nhật monthId
    updateIncomeMonthId: (state, action) => {
      const { incomeId, monthId } = action.payload;
      const income = state.items.find(item => item.id === incomeId);
      if (income) {
        income.monthId = monthId;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncomes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchIncomes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        console.log('🔄 Income state updated with', action.payload.length, 'incomes');
      })
      .addCase(fetchIncomes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addIncome.fulfilled, (state, action) => {
        state.items.push(action.payload);
        console.log('➕ Income added to Redux state');
      })
      .addCase(deleteIncome.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  },
});

export const { updateIncomeMonthId } = incomeSlice.actions;
export default incomeSlice.reducer;