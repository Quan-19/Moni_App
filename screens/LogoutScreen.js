import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { resetExpensesState } from '../slices/expensesSlice';
import { resetIncomesState } from '../slices/incomeSlice';
import { resetGoalsState } from '../slices/goalsSlice';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LogoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Lấy thông tin user hiện tại
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email || 'Không có email');
    } else {
      // Nếu không có user, tự động điều hướng về login
      navigation.replace('Login');
    }
  }, [navigation]);

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await performLogout();
          },
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setIsLoading(true);
      
      // 1. Đăng xuất khỏi Firebase
      await signOut(auth);
      console.log('✅ Đã đăng xuất khỏi Firebase');
      
      // 2. Xóa dữ liệu local storage
      await clearLocalData();
      
      // 3. Reset Redux state
      resetReduxState();
      
      // 4. Điều hướng về màn hình đăng nhập
      setTimeout(() => {
        navigation.replace('Login');
      }, 500);
      
    } catch (error) {
      console.error('❌ Lỗi đăng xuất:', error);
      Alert.alert(
        'Lỗi',
        'Không thể đăng xuất. Vui lòng thử lại.\n' + error.message,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocalData = async () => {
    try {
      // Xóa tất cả dữ liệu AsyncStorage liên quan đến user
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter(key => 
        key.includes('user_') || 
        key.includes('auth_') || 
        key.includes('expenses_') ||
        key.includes('incomes_') ||
        key.includes('goals_')
      );
      
      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
        console.log(`✅ Đã xóa ${userKeys.length} key từ AsyncStorage`);
      }
    } catch (error) {
      console.error('❌ Lỗi xóa local data:', error);
    }
  };

  const resetReduxState = () => {
    try {
      dispatch(resetExpensesState());
      dispatch(resetIncomesState());
      dispatch(resetGoalsState());
      console.log('✅ Đã reset Redux state');
    } catch (error) {
      console.error('❌ Lỗi reset Redux:', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang đăng xuất...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header đẹp */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👤 Tài khoản</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Thông tin user card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Người dùng</Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {userEmail}
              </Text>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                <Text style={styles.statusText}>Đang hoạt động</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Thông báo quan trọng */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Ionicons name="information-circle" size={24} color="#f59e0b" />
            <Text style={styles.noteTitle}>Thông tin quan trọng</Text>
          </View>
          <Text style={styles.noteText}>
            Khi đăng xuất, tất cả dữ liệu tạm thời trên thiết bị của bạn sẽ bị xóa. 
            Dữ liệu đã lưu trên đám mây vẫn được giữ nguyên và bạn có thể truy cập lại sau khi đăng nhập.
          </Text>
        </View>

        {/* Thống kê đơn giản */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Thống kê nhanh</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="cash-outline" size={24} color="#10b981" />
              <Text style={styles.statLabel}>Tài khoản</Text>
              <Text style={styles.statValue}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cloud-outline" size={24} color="#3b82f6" />
              <Text style={styles.statLabel}>Đồng bộ</Text>
              <Text style={styles.statValue}>Hoàn tất</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Nút hành động cố định dưới cùng */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
            <Text style={styles.cancelButtonText}>Quay lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.footerText}>
          Phiên bản 1.0.0 • Money Manager
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '500',
    marginLeft: 4,
  },
  noteCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default LogoutScreen;