// components/MonthlyChallenge.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, isSameDay } from 'date-fns';

const MonthlyChallenge = ({ currentMonthExpenses = [] }) => {
  const [challenges, setChallenges] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    // Kiểm tra trước khi sử dụng
    const safeExpenses = Array.isArray(currentMonthExpenses) ? currentMonthExpenses : [];
    
    loadChallenges();
    loadUserProgress();
    calculateStreak();
  }, [currentMonthExpenses]);

  // Tải thử thách mặc định
  const loadChallenges = () => {
    const defaultChallenges = [
      {
        id: 'no_coffee',
        title: 'Không cà phê ngoài',
        description: 'Không mua cà phê ngoài tiệm trong 7 ngày',
        icon: '☕',
        type: 'abstinence',
        duration: 7,
        reward: 100, // điểm
        difficulty: 'easy',
      },
      {
        id: 'cook_at_home',
        title: 'Nấu ăn tại nhà',
        description: 'Tự nấu ăn ít nhất 5 bữa trong tuần',
        icon: '🍳',
        type: 'habit',
        duration: 7,
        target: 5,
        reward: 150,
        difficulty: 'medium',
      },
      {
        id: 'save_50k',
        title: 'Tiết kiệm 50k/ngày',
        description: 'Để dành 50k mỗi ngày vào lợn',
        icon: '💰',
        type: 'saving',
        duration: 7,
        dailyTarget: 50000,
        reward: 200,
        difficulty: 'medium',
      },
      {
        id: 'no_shopping',
        title: 'Cấm shopping',
        description: 'Không mua sắm không cần thiết trong 3 ngày',
        icon: '🛍️',
        type: 'abstinence',
        duration: 3,
        reward: 80,
        difficulty: 'easy',
      },
    ];
    
    setChallenges(defaultChallenges);
  };

  // Tải tiến độ của người dùng
  const loadUserProgress = async () => {
    try {
      const progress = await AsyncStorage.getItem('challenge_progress');
      if (progress) {
        setUserProgress(JSON.parse(progress));
      }
    } catch (error) {
      console.error('Lỗi tải tiến độ:', error);
    }
  };

  // Tính streak hiện tại
  const calculateStreak = async () => {
    try {
      const streakData = await AsyncStorage.getItem('challenge_streak');
      if (streakData) {
        const { lastCompleted, streak } = JSON.parse(streakData);
        const today = format(new Date(), 'yyyy-MM-dd');
        
        if (lastCompleted === today) {
          setCurrentStreak(streak);
        } else if (isSameDay(addDays(new Date(lastCompleted), 1), new Date())) {
          // Ngày hôm sau vẫn giữ streak
          setCurrentStreak(streak + 1);
          await AsyncStorage.setItem('challenge_streak', JSON.stringify({
            lastCompleted: today,
            streak: streak + 1,
          }));
        } else {
          // Mất streak
          setCurrentStreak(0);
          await AsyncStorage.setItem('challenge_streak', JSON.stringify({
            lastCompleted: today,
            streak: 0,
          }));
        }
      }
    } catch (error) {
      console.error('Lỗi tính streak:', error);
    }
  };

  // Kiểm tra tiến độ thử thách
  const checkChallengeProgress = (challenge) => {
    const progress = userProgress[challenge.id] || { 
      current: 0, 
      completed: false, 
      startDate: null,
      history: []
    };
    
    let currentProgress = progress.current;
    let isCompleted = progress.completed;
    
    // Tính toán dựa trên loại thử thách
    switch (challenge.type) {
      case 'abstinence':
        // Kiểm tra chi tiêu có vi phạm không
        const hasViolation = currentMonthExpenses.some(expense => {
          if (challenge.id === 'no_coffee' && expense.category === 'Ăn uống') {
            return expense.title.toLowerCase().includes('cà phê') || 
                   expense.title.toLowerCase().includes('coffee');
          }
          if (challenge.id === 'no_shopping' && expense.category === 'Mua sắm') {
            return expense.amount > 100000; // Mua sắm > 100k
          }
          return false;
        });
        
        if (!hasViolation && progress.startDate) {
          const startDate = new Date(progress.startDate);
          const daysPassed = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
          currentProgress = Math.min(daysPassed + 1, challenge.duration);
          isCompleted = currentProgress >= challenge.duration;
        }
        break;
        
      case 'saving':
        // Tính tổng tiết kiệm trong ngày
        const today = format(new Date(), 'yyyy-MM-dd');
        const todaySavings = currentMonthExpenses
          .filter(e => e.category === 'Tiết kiệm' && e.date.startsWith(today))
          .reduce((sum, e) => sum + e.amount, 0);
        
        if (todaySavings >= challenge.dailyTarget) {
          currentProgress = (progress.current || 0) + 1;
          isCompleted = currentProgress >= challenge.duration;
        }
        break;
    }
    
    return { currentProgress, isCompleted };
  };

  // Bắt đầu thử thách
  const startChallenge = async (challengeId) => {
    const newProgress = {
      ...userProgress,
      [challengeId]: {
        current: 0,
        completed: false,
        startDate: new Date().toISOString(),
        history: [],
      }
    };
    
    setUserProgress(newProgress);
    await AsyncStorage.setItem('challenge_progress', JSON.stringify(newProgress));
  };

  // Hoàn thành thử thách
  const completeChallenge = async (challengeId) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;
    
    const newProgress = {
      ...userProgress,
      [challengeId]: {
        ...userProgress[challengeId],
        completed: true,
        completedAt: new Date().toISOString(),
      }
    };
    
    // Cập nhật streak
    const streakData = await AsyncStorage.getItem('challenge_streak');
    const streak = streakData ? JSON.parse(streakData).streak : 0;
    await AsyncStorage.setItem('challenge_streak', JSON.stringify({
      lastCompleted: format(new Date(), 'yyyy-MM-dd'),
      streak: streak + 1,
    }));
    
    setUserProgress(newProgress);
    await AsyncStorage.setItem('challenge_progress', JSON.stringify(newProgress));
    
    // Hiển thị thông báo phần thưởng
    alert(`🎉 Chúc mừng! Bạn nhận được ${challenge.reward} điểm!`);
    
    calculateStreak();
  };

  // Tính phần trăm hoàn thành
  const calculatePercentage = (challenge) => {
    const { currentProgress } = checkChallengeProgress(challenge);
    return (currentProgress / challenge.duration) * 100;
  };

  // Màu sắc theo độ khó
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header với streak */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Thử thách tháng này</Text>
        <View style={styles.streakContainer}>
          <Text style={styles.streakText}>🔥 {currentStreak} ngày liên tiếp</Text>
        </View>
      </View>
      
      {/* Danh sách thử thách */}
      <ScrollView style={styles.challengesList}>
        {challenges.map(challenge => {
          const { currentProgress, isCompleted } = checkChallengeProgress(challenge);
          const percentage = calculatePercentage(challenge);
          const hasStarted = userProgress[challenge.id]?.startDate;
          
          return (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeIconTitle}>
                  <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                  <View>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDescription}>
                      {challenge.description}
                    </Text>
                  </View>
                </View>
                
                <View style={[
                  styles.difficultyBadge, 
                  { backgroundColor: getDifficultyColor(challenge.difficulty) }
                ]}>
                  <Text style={styles.difficultyText}>
                    {challenge.difficulty === 'easy' ? 'Dễ' : 
                     challenge.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                  </Text>
                </View>
              </View>
              
              {/* Tiến độ */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressText}>
                    {currentProgress}/{challenge.duration} ngày
                  </Text>
                  <Text style={styles.rewardText}>
                    🎁 {challenge.reward} điểm
                  </Text>
                </View>
                
                <ProgressBar
                  progress={percentage / 100}
                  color={percentage >= 100 ? '#10b981' : '#3b82f6'}
                  style={styles.progressBar}
                />
              </View>
              
              {/* Nút hành động */}
              <View style={styles.actionContainer}>
                {isCompleted ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✅ Đã hoàn thành</Text>
                  </View>
                ) : hasStarted ? (
                  <TouchableOpacity 
                    style={styles.continueButton}
                    onPress={() => {
                      if (percentage >= 100) {
                        completeChallenge(challenge.id);
                      }
                    }}
                    disabled={percentage < 100}
                  >
                    <Text style={styles.continueButtonText}>
                      {percentage >= 100 ? '🎉 Nhận thưởng' : 'Đang thực hiện...'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => startChallenge(challenge.id)}
                  >
                    <Text style={styles.startButtonText}>▶️ Bắt đầu</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
      
      {/* Thống kê nhanh */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {challenges.filter(c => userProgress[c.id]?.completed).length}
          </Text>
          <Text style={styles.statLabel}>Đã hoàn thành</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {challenges.filter(c => userProgress[c.id]?.startDate && !userProgress[c.id]?.completed).length}
          </Text>
          <Text style={styles.statLabel}>Đang thực hiện</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {challenges.reduce((sum, c) => sum + (userProgress[c.id]?.completed ? c.reward : 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Tổng điểm</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  streakContainer: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
  },
  challengesList: {
    padding: 16,
  },
  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  challengeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  difficultyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  progressSection: {
    marginVertical: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  rewardText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  actionContainer: {
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  completedText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});

export default MonthlyChallenge;