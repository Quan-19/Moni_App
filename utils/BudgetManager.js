import AsyncStorage from '@react-native-async-storage/async-storage';

class BudgetManager {
  constructor() {
    this.budgetsKey = 'user_budgets';
    this.budgets = {};
    this.defaultCategories = [
      { id: 'eating', name: 'Ăn uống', color: '#ef4444', icon: '🍔' },
      { id: 'shopping', name: 'Mua sắm', color: '#3b82f6', icon: '🛍️' },
      { id: 'transport', name: 'Di chuyển', color: '#f59e0b', icon: '🚗' },
      { id: 'entertainment', name: 'Giải trí', color: '#8b5cf6', icon: '🎮' },
      { id: 'bills', name: 'Hóa đơn', color: '#10b981', icon: '📱' },
      { id: 'health', name: 'Y tế', color: '#ec4899', icon: '🏥' },
      { id: 'education', name: 'Học tập', color: '#6366f1', icon: '📚' },
      { id: 'other', name: 'Khác', color: '#6b7280', icon: '📦' },
    ];
  }

  async initialize() {
    await this.loadBudgets();
    
    // Khởi tạo ngân sách mặc định nếu chưa có
    if (Object.keys(this.budgets).length === 0) {
      await this.setupDefaultBudgets();
    }
  }

  async loadBudgets() {
    try {
      const budgetsData = await AsyncStorage.getItem(this.budgetsKey);
      this.budgets = budgetsData ? JSON.parse(budgetsData) : {};
      console.log('📊 Loaded budgets:', Object.keys(this.budgets).length);
    } catch (error) {
      console.error('❌ Error loading budgets:', error);
    }
  }

  async setupDefaultBudgets() {
    this.defaultCategories.forEach(category => {
      this.budgets[category.id] = {
        ...category,
        monthlyBudget: 0,
        spent: 0,
        notifications: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    
    await this.saveBudgets();
    console.log('✅ Default budgets set up');
  }

  async saveBudgets() {
    try {
      await AsyncStorage.setItem(this.budgetsKey, JSON.stringify(this.budgets));
      console.log('💾 Budgets saved');
    } catch (error) {
      console.error('❌ Error saving budgets:', error);
    }
  }

  async updateBudget(categoryId, monthlyBudget) {
    if (this.budgets[categoryId]) {
      this.budgets[categoryId].monthlyBudget = monthlyBudget;
      this.budgets[categoryId].updatedAt = new Date().toISOString();
      await this.saveBudgets();
      console.log(`💰 Updated budget for ${categoryId}: ${monthlyBudget}`);
      return true;
    }
    return false;
  }

  async addExpenseToCategory(categoryName, amount) {
    const category = this.defaultCategories.find(c => c.name === categoryName);
    if (category && this.budgets[category.id]) {
      this.budgets[category.id].spent += amount;
      this.budgets[category.id].updatedAt = new Date().toISOString();
      await this.saveBudgets();
      
      // Kiểm tra cảnh báo
      const warning = this.checkBudgetWarning(category.id);
      return { success: true, warning };
    }
    return { success: false };
  }

  checkBudgetWarning(categoryId) {
    const budget = this.budgets[categoryId];
    if (!budget || budget.monthlyBudget === 0) return null;
    
    const percentage = (budget.spent / budget.monthlyBudget) * 100;
    
    if (percentage >= 100) {
      return {
        type: 'danger',
        message: `🚨 ${budget.name}: Đã vượt ngân sách ${budget.monthlyBudget.toLocaleString()} VND!`,
        percentage: 100,
      };
    } else if (percentage >= 90) {
      return {
        type: 'warning',
        message: `⚠️ ${budget.name}: Đã tiêu ${percentage.toFixed(1)}% ngân sách`,
        percentage: percentage,
      };
    } else if (percentage >= 80) {
      return {
        type: 'info',
        message: `ℹ️ ${budget.name}: Đã tiêu ${percentage.toFixed(1)}% ngân sách`,
        percentage: percentage,
      };
    }
    
    return null;
  }

  getCategoryBudgets() {
    return this.defaultCategories.map(category => {
      const budget = this.budgets[category.id] || {
        ...category,
        monthlyBudget: 0,
        spent: 0,
      };
      
      const percentage = budget.monthlyBudget > 0 ? 
        Math.min((budget.spent / budget.monthlyBudget) * 100, 100) : 0;
      
      return {
        ...budget,
        percentage,
        remaining: Math.max(budget.monthlyBudget - budget.spent, 0),
        isOverBudget: budget.spent > budget.monthlyBudget,
      };
    });
  }

  getTotalBudget() {
    const categories = this.getCategoryBudgets();
    return {
      totalBudget: categories.reduce((sum, cat) => sum + cat.monthlyBudget, 0),
      totalSpent: categories.reduce((sum, cat) => sum + cat.spent, 0),
      remaining: categories.reduce((sum, cat) => sum + Math.max(cat.monthlyBudget - cat.spent, 0), 0),
    };
  }

  resetMonthlySpending() {
    Object.keys(this.budgets).forEach(categoryId => {
      this.budgets[categoryId].spent = 0;
    });
    this.saveBudgets();
    console.log('🔄 Monthly spending reset');
  }

  getBudgetRecommendations(totalIncome) {
    if (totalIncome <= 0) return [];
    
    const recommendations = [
      { category: 'Ăn uống', recommended: totalIncome * 0.15, min: 1000000, max: totalIncome * 0.25 },
      { category: 'Hóa đơn', recommended: totalIncome * 0.20, min: 500000, max: totalIncome * 0.30 },
      { category: 'Tiết kiệm', recommended: totalIncome * 0.20, min: totalIncome * 0.10, max: totalIncome * 0.30 },
      { category: 'Giải trí', recommended: totalIncome * 0.10, min: 200000, max: totalIncome * 0.15 },
      { category: 'Mua sắm', recommended: totalIncome * 0.10, min: 0, max: totalIncome * 0.15 },
      { category: 'Di chuyển', recommended: totalIncome * 0.10, min: 300000, max: totalIncome * 0.15 },
      { category: 'Khác', recommended: totalIncome * 0.15, min: 0, max: totalIncome * 0.20 },
    ];
    
    return recommendations;
  }

  async applyRecommendations(totalIncome) {
    const recommendations = this.getBudgetRecommendations(totalIncome);
    
    recommendations.forEach(rec => {
      const category = this.defaultCategories.find(c => c.name === rec.category);
      if (category && this.budgets[category.id]) {
        this.budgets[category.id].monthlyBudget = Math.round(rec.recommended);
      }
    });
    
    await this.saveBudgets();
    console.log('📈 Applied budget recommendations');
  }
}

export default new BudgetManager();