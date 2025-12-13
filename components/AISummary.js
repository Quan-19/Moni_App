// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { getGeminiAnalysis } from '../services/geminiService'; // Đổi thành Gemini

// const AISummary = ({ expenses }) => {
//   const [aiAnalysis, setAiAnalysis] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showAnalysis, setShowAnalysis] = useState(false);
//   const [metrics, setMetrics] = useState({
//     totalMonth: 0,
//     topCategory: { name: 'Chưa có', percent: 0 },
//     compare: '0'
//   });

//   // Helper function to parse date from various formats
//   const parseExpenseDate = (exp) => {
//     if (!exp.date) return null;
    
//     try {
//       // Firestore timestamp format
//       if (exp.date && typeof exp.date === 'object' && exp.date.seconds) {
//         return new Date(exp.date.seconds * 1000);
//       }
//       // String date or ISO string
//       else if (typeof exp.date === 'string') {
//         return new Date(exp.date);
//       }
//       // Already a Date object
//       else if (exp.date instanceof Date) {
//         return exp.date;
//       }
//       // Timestamp number
//       else if (typeof exp.date === 'number') {
//         return new Date(exp.date);
//       }
//     } catch (error) {
//       console.error('Error parsing date:', error);
//     }
    
//     return null;
//   };

//   // Tính toán số liệu từ expenses - IMPROVED VERSION
//   const calculateMetrics = () => {
//     console.log('=== CALCULATING METRICS ===');
//     console.log('Total expenses received:', expenses?.length || 0);
    
//     if (!expenses || expenses.length === 0) {
//       console.log('No expenses found');
//       return {
//         totalMonth: 0,
//         topCategory: { name: 'Chưa có', percent: 0 },
//         compare: '0'
//       };
//     }

//     // Log first few expenses to debug
//     expenses.slice(0, 3).forEach((exp, index) => {
//       console.log(`Expense ${index + 1}:`, {
//         title: exp.title,
//         amount: exp.amount,
//         category: exp.category,
//         date: exp.date,
//         parsedDate: parseExpenseDate(exp)
//       });
//     });

//     const now = new Date();
//     const currentMonth = now.getMonth();
//     const currentYear = now.getFullYear();
    
//     console.log('Current month/year:', currentMonth + 1, currentYear);

//     // Tháng hiện tại
//     const currentMonthExpenses = expenses.filter(exp => {
//       const expDate = parseExpenseDate(exp);
//       if (!expDate || isNaN(expDate.getTime())) {
//         return false;
//       }
      
//       const sameMonth = expDate.getMonth() === currentMonth;
//       const sameYear = expDate.getFullYear() === currentYear;
      
//       return sameMonth && sameYear;
//     });

//     console.log('Current month expenses count:', currentMonthExpenses.length);
//     console.log('Current month expenses:', currentMonthExpenses);

//     // Tháng trước
//     const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
//     const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
//     const lastMonthExpenses = expenses.filter(exp => {
//       const expDate = parseExpenseDate(exp);
//       if (!expDate || isNaN(expDate.getTime())) {
//         return false;
//       }
      
//       const sameMonth = expDate.getMonth() === lastMonth;
//       const sameYear = expDate.getFullYear() === lastMonthYear;
      
//       return sameMonth && sameYear;
//     });

//     console.log('Last month expenses count:', lastMonthExpenses.length);

//     // Tổng chi tháng này
//     const totalMonth = currentMonthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

//     // Tính theo danh mục
//     const categoryTotals = {};
//     currentMonthExpenses.forEach(exp => {
//       if (exp.category && exp.amount) {
//         const category = exp.category;
//         const amount = Number(exp.amount) || 0;
//         categoryTotals[category] = (categoryTotals[category] || 0) + amount;
//       }
//     });

//     console.log('Category totals:', categoryTotals);

//     // Tìm danh mục chi nhiều nhất
//     let topCategory = { name: 'Chưa có', percent: 0 };
//     const categoryKeys = Object.keys(categoryTotals);
    
//     if (categoryKeys.length > 0 && totalMonth > 0) {
//       const topCategoryName = categoryKeys.reduce((a, b) => 
//         categoryTotals[a] > categoryTotals[b] ? a : b
//       );
//       const percent = ((categoryTotals[topCategoryName] / totalMonth) * 100).toFixed(1);
//       topCategory = { 
//         name: topCategoryName, 
//         percent,
//         amount: categoryTotals[topCategoryName]
//       };
//     }

//     // So sánh với tháng trước
//     const totalLastMonth = lastMonthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
//     let compare = '0';
    
//     if (totalLastMonth > 0 && totalMonth > 0) {
//       const difference = ((totalMonth - totalLastMonth) / totalLastMonth) * 100;
//       compare = difference > 0 ? `+${difference.toFixed(1)}` : difference.toFixed(1);
//     } else if (totalMonth > 0 && totalLastMonth === 0) {
//       // Nếu tháng trước không có chi tiêu nhưng tháng này có
//       compare = '+100';
//     } else if (totalMonth === 0 && totalLastMonth > 0) {
//       // Nếu tháng này không có chi tiêu nhưng tháng trước có
//       compare = '-100';
//     }

//     console.log('Final metrics:', { 
//       totalMonth, 
//       topCategory, 
//       compare,
//       totalLastMonth 
//     });

//     return {
//       totalMonth,
//       topCategory,
//       compare,
//       currentMonthExpensesCount: currentMonthExpenses.length,
//       lastMonthExpensesCount: lastMonthExpenses.length
//     };
//   };

//   // Cập nhật metrics khi expenses thay đổi
//   useEffect(() => {
//     const newMetrics = calculateMetrics();
//     setMetrics(newMetrics);
//   }, [expenses]);

//    const handleAIAnalysis = async () => {
//     if (!expenses || expenses.length === 0) {
//       Alert.alert('Thông báo', 'Chưa có dữ liệu chi tiêu để phân tích');
//       return;
//     }

//     if (metrics.totalMonth === 0) {
//       Alert.alert('Thông báo', 'Chưa có chi tiêu trong tháng này để phân tích');
//       return;
//     }

//     setLoading(true);
//     try {
//       const analysis = await getGeminiAnalysis(metrics); // Đổi thành Gemini
//       setAiAnalysis(analysis);
//       setShowAnalysis(true);
//     } catch (error) {
//       console.error('AI Analysis error:', error);
//       Alert.alert(
//         'Thông báo', 
//         'Tính năng AI đang tạm thời bảo trì. Bạn vẫn có thể xem các thống kê cơ bản bên dưới.',
//         [{ text: 'OK' }]
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Debug info
//   const debugInfo = `Expenses: ${expenses?.length || 0} | Current Month: ${metrics.currentMonthExpensesCount} | Last Month: ${metrics.lastMonthExpensesCount}`;

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>📊 Phân tích thông minh</Text>
//         <TouchableOpacity 
//           style={[styles.aiButton, (metrics.totalMonth === 0 || loading) && styles.disabledButton]}
//           onPress={handleAIAnalysis}
//           disabled={loading || metrics.totalMonth === 0}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.aiButtonText}>🤖 Phân tích AI</Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* Debug Info - có thể ẩn đi sau khi fix xong */}
//       <Text style={styles.debugText}>{debugInfo}</Text>

//       {/* Basic Stats */}
//       <View style={styles.statsGrid}>
//         <View style={styles.statItem}>
//           <Text style={styles.statValue}>
//             {metrics.totalMonth > 0 ? metrics.totalMonth.toLocaleString() : '0'} VND
//           </Text>
//           <Text style={styles.statLabel}>Chi tháng này</Text>
//         </View>
//         <View style={styles.statItem}>
//           <Text style={styles.statValue}>
//             {metrics.topCategory.percent}%
//           </Text>
//           <Text style={styles.statLabel}>{metrics.topCategory.name}</Text>
//         </View>
//         <View style={styles.statItem}>
//           <Text style={[
//             styles.statValue, 
//             metrics.compare.includes('+') ? styles.positive : 
//             metrics.compare.includes('-') ? styles.negative : styles.neutral
//           ]}>
//             {metrics.compare}%
//           </Text>
//           <Text style={styles.statLabel}>So tháng trước</Text>
//         </View>
//       </View>

//       {/* AI Analysis */}
//       {showAnalysis && aiAnalysis && (
//         <View style={styles.analysisContainer}>
//           <Text style={styles.analysisTitle}>💡 Phân tích AI</Text>
//           <Text style={styles.analysisText}>{aiAnalysis}</Text>
//           <TouchableOpacity 
//             style={styles.hideButton}
//             onPress={() => setShowAnalysis(false)}
//           >
//             <Text style={styles.hideButtonText}>Ẩn phân tích</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {!showAnalysis && expenses && expenses.length > 0 && metrics.totalMonth > 0 && (
//         <View style={styles.tipContainer}>
//           <Text style={styles.tipText}>
//             💡 Nhấn "Phân tích AI" để nhận insights thông minh về chi tiêu của bạn!
//           </Text>
//         </View>
//       )}

//       {metrics.totalMonth === 0 && expenses && expenses.length > 0 && (
//         <View style={styles.tipContainer}>
//           <Text style={styles.tipText}>
//             📅 Chưa có chi tiêu nào trong tháng {new Date().getMonth() + 1}. 
//             Hãy thêm chi tiêu để nhận phân tích AI!
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 20,
//     marginVertical: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 5,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1f2937',
//   },
//   aiButton: {
//     backgroundColor: '#8b5cf6',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   disabledButton: {
//     backgroundColor: '#9ca3af',
//   },
//   aiButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   statItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   statValue: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1f2937',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#6b7280',
//     textAlign: 'center',
//   },
//   positive: {
//     color: '#10b981',
//   },
//   negative: {
//     color: '#ef4444',
//   },
//   neutral: {
//     color: '#6b7280',
//   },
//   analysisContainer: {
//     backgroundColor: '#f8fafc',
//     padding: 16,
//     borderRadius: 12,
//     borderLeftWidth: 4,
//     borderLeftColor: '#8b5cf6',
//   },
//   analysisTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 8,
//   },
//   analysisText: {
//     fontSize: 14,
//     color: '#4b5563',
//     lineHeight: 20,
//     marginBottom: 12,
//   },
//   hideButton: {
//     alignSelf: 'flex-end',
//   },
//   hideButtonText: {
//     color: '#6b7280',
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   tipContainer: {
//     backgroundColor: '#f0f9ff',
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#bae6fd',
//   },
//   tipText: {
//     fontSize: 12,
//     color: '#0369a1',
//     textAlign: 'center',
//   },
//   debugText: {
//     fontSize: 10,
//     color: '#9ca3af',
//     textAlign: 'center',
//     marginBottom: 8,
//     fontStyle: 'italic',
//   },
// });

// export default AISummary;