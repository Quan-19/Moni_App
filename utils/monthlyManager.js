import AsyncStorage from '@react-native-async-storage/async-storage';

class MonthlyManager {
  constructor() {
    this.currentMonthKey = 'current_month';
    this.archiveKey = 'archived_months';
    this.expensesKey = 'local_expenses'; // Thêm key để lưu expenses local
    this.currentMonth = null;
    this.archivedMonths = [];
    this.localExpenses = [];
    this.isInitialized = false;
  }

  // Helper functions
  formatDate(date, formatStr) {
    const d = new Date(date);
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    if (formatStr === 'MMMM yyyy') {
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    
    if (formatStr === 'yyyy-MM') {
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${year}-${month}`;
    }
    
    return d.toISOString();
  }

  startOfMonth(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  endOfMonth(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  isSameMonth(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth();
  }

  // Khởi tạo với dữ liệu từ Redux
  async initialize(allExpenses = []) {
    if (this.isInitialized) {
      console.log('🔄 MonthlyManager already initialized');
      return;
    }
    
    await this.loadData();
    
    // Kiểm tra chuyển tháng
    const now = new Date();
    const currentMonthStart = this.startOfMonth(now);
    
    if (!this.currentMonth || !this.isSameMonth(new Date(this.currentMonth.startDate), now)) {
      // Lưu tháng cũ vào archive nếu tồn tại
      if (this.currentMonth) {
        await this.archiveCurrentMonth();
      }
      
      // Tạo tháng mới
      await this.createNewMonth(currentMonthStart);
    }
    
    // Đồng bộ dữ liệu từ Redux
    await this.syncWithRedux(allExpenses);
    
    this.isInitialized = true;
    console.log('✅ MonthlyManager initialized for month:', this.currentMonth.name);
  }

  async loadData() {
    try {
      // Lấy tháng hiện tại
      const currentMonthData = await AsyncStorage.getItem(this.currentMonthKey);
      this.currentMonth = currentMonthData ? JSON.parse(currentMonthData) : null;
      
      // Lấy danh sách tháng đã lưu
      const archivedData = await AsyncStorage.getItem(this.archiveKey);
      this.archivedMonths = archivedData ? JSON.parse(archivedData) : [];
      
      // Lấy expenses local
      const expensesData = await AsyncStorage.getItem(this.expensesKey);
      this.localExpenses = expensesData ? JSON.parse(expensesData) : [];
      
      console.log('📂 Loaded from AsyncStorage:', {
        currentMonth: this.currentMonth?.name || 'none',
        archivedMonths: this.archivedMonths.length,
        localExpenses: this.localExpenses.length
      });
    } catch (error) {
      console.error('❌ Lỗi tải dữ liệu từ AsyncStorage:', error);
    }
  }

  // Đồng bộ dữ liệu từ Redux
  async syncWithRedux(allExpenses = []) {
    if (!this.currentMonth) {
      console.warn('⚠️ No current month to sync with');
      return;
    }
    
    const currentMonthId = this.currentMonth.id;
    console.log('🔄 Syncing with Redux for month:', currentMonthId);
    
    // Lọc expense thuộc tháng hiện tại
    const monthExpenses = allExpenses.filter(expense => {
      // Nếu expense đã có monthId
      if (expense.monthId) {
        return expense.monthId === currentMonthId;
      }
      
      // Nếu chưa có monthId, kiểm tra theo ngày
      if (expense.date) {
        try {
          const expenseDate = new Date(expense.date);
          const currentDate = new Date(this.currentMonth.startDate);
          return this.isSameMonth(expenseDate, currentDate);
        } catch (error) {
          console.warn('⚠️ Invalid date format:', expense.date);
          return false;
        }
      }
      
      return false;
    });
    
    console.log(`📊 Found ${monthExpenses.length} expenses for current month`);
    
    // Cập nhật expenses cho tháng hiện tại
    this.currentMonth.expenses = monthExpenses;
    this.currentMonth.total = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Lưu vào AsyncStorage
    await this.saveCurrentMonth();
    
    // Lưu toàn bộ expenses vào local storage để backup
    this.localExpenses = allExpenses;
    await AsyncStorage.setItem(this.expensesKey, JSON.stringify(this.localExpenses));
    
    return monthExpenses;
  }

  async saveCurrentMonth() {
    if (!this.currentMonth) return;
    
    try {
      await AsyncStorage.setItem(this.currentMonthKey, JSON.stringify(this.currentMonth));
      console.log('💾 Saved current month to AsyncStorage');
    } catch (error) {
      console.error('❌ Error saving current month:', error);
    }
  }

  // Tạo tháng mới
  async createNewMonth(monthStart) {
    const newMonth = {
      id: this.formatDate(monthStart, 'yyyy-MM'),
      name: this.formatDate(monthStart, 'MMMM yyyy'),
      startDate: monthStart.toISOString(),
      endDate: this.endOfMonth(monthStart).toISOString(),
      expenses: [],
      total: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    
    this.currentMonth = newMonth;
    await this.saveCurrentMonth();
    
    console.log(`📅 Created new month: ${newMonth.name}`);
    return newMonth;
  }

  // Lưu tháng hiện tại vào archive
  async archiveCurrentMonth() {
    if (!this.currentMonth) return;
    
    // Đánh dấu tháng cũ không còn active
    this.currentMonth.isActive = false;
    this.currentMonth.archivedAt = new Date().toISOString();
    
    // Thêm vào danh sách archive
    this.archivedMonths.unshift(this.currentMonth);
    
    // Giới hạn chỉ lưu 12 tháng gần nhất
    if (this.archivedMonths.length > 12) {
      this.archivedMonths = this.archivedMonths.slice(0, 12);
    }
    
    await AsyncStorage.setItem(this.archiveKey, JSON.stringify(this.archivedMonths));
    console.log(`📁 Archived month: ${this.currentMonth.name}`);
  }

  // Thêm chi tiêu vào tháng hiện tại
  async addExpense(expense) {
    if (!this.currentMonth) {
      await this.initialize();
    }
    
    // Đảm bảo expense có monthId
    const expenseWithMonthId = {
      ...expense,
      monthId: expense.monthId || this.currentMonth.id
    };
    
    console.log('➕ Adding expense to monthly manager:', {
      title: expenseWithMonthId.title,
      monthId: expenseWithMonthId.monthId,
      currentMonth: this.currentMonth.id
    });
    
    // Kiểm tra xem expense đã tồn tại chưa
    const existingIndex = this.currentMonth.expenses.findIndex(
      e => e.id === expenseWithMonthId.id
    );
    
    if (existingIndex === -1) {
      // Thêm expense mới
      this.currentMonth.expenses.push(expenseWithMonthId);
    } else {
      // Cập nhật expense đã tồn tại
      this.currentMonth.expenses[existingIndex] = expenseWithMonthId;
    }
    
    // Tính lại tổng
    this.currentMonth.total = this.currentMonth.expenses.reduce(
      (sum, e) => sum + (e.amount || 0), 0
    );
    
    // Lưu vào AsyncStorage
    await this.saveCurrentMonth();
    
    console.log(`✅ Expense added to month ${this.currentMonth.name}, total: ${this.currentMonth.expenses.length}`);
    return expenseWithMonthId;
  }

  // Lấy tất cả chi tiêu hiện tại
  getCurrentMonthExpenses() {
    return this.currentMonth ? this.currentMonth.expenses : [];
  }

  // Lấy thông tin tháng hiện tại
  getCurrentMonthInfo() {
    if (this.currentMonth) {
      return this.currentMonth;
    }
    
    // Fallback nếu chưa có tháng
    const now = new Date();
    return {
      id: this.formatDate(now, 'yyyy-MM'),
      name: this.formatDate(now, 'MMMM yyyy'),
      expenses: [],
      total: 0,
      startDate: this.startOfMonth(now).toISOString(),
    };
  }

  // Lấy danh sách tháng đã lưu
  getArchivedMonths() {
    return this.archivedMonths;
  }

  // Chuyển sang xem tháng khác
  async switchToMonth(monthId) {
    const month = this.archivedMonths.find(m => m.id === monthId);
    return month || null;
  }

  // Xóa tháng khỏi archive
  async deleteMonthFromArchive(monthId) {
    this.archivedMonths = this.archivedMonths.filter(m => m.id !== monthId);
    await AsyncStorage.setItem(this.archiveKey, JSON.stringify(this.archivedMonths));
  }

  // Số ngày còn lại trong tháng
  getRemainingDaysInMonth() {
    const now = new Date();
    const end = this.endOfMonth(now);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Kiểm tra nếu đang ở cuối tháng (3 ngày cuối)
  isEndOfMonth() {
    const remainingDays = this.getRemainingDaysInMonth();
    return remainingDays <= 3;
  }

  // Get current month name in Vietnamese
  getCurrentMonthName() {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }

  // Reset manager (for testing)
  async reset() {
    this.currentMonth = null;
    this.archivedMonths = [];
    this.localExpenses = [];
    this.isInitialized = false;
    await AsyncStorage.removeItem(this.currentMonthKey);
    await AsyncStorage.removeItem(this.archiveKey);
    await AsyncStorage.removeItem(this.expensesKey);
    console.log('♻️ MonthlyManager reset');
  }

  // Debug info
  async getDebugInfo() {
    return {
      currentMonth: this.currentMonth ? {
        name: this.currentMonth.name,
        expensesCount: this.currentMonth.expenses.length,
        total: this.currentMonth.total
      } : null,
      archivedMonths: this.archivedMonths.length,
      localExpenses: this.localExpenses.length,
      isInitialized: this.isInitialized
    };
  }
}

export default new MonthlyManager();