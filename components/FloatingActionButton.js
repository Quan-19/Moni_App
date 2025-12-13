import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const FloatingActionButton = ({ onPress, label = '+', type = 'primary' }) => {
  const getButtonStyle = () => {
    switch (type) {
      case 'income':
        return { backgroundColor: '#10b981' };
      case 'goal':
        return { backgroundColor: '#8b5cf6' };
      case 'expense':
      default:
        return { backgroundColor: '#3b82f6' };
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.fab, getButtonStyle()]} 
      onPress={onPress}
    >
      <Text style={styles.fabText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default FloatingActionButton;