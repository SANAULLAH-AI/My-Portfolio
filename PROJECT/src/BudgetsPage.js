import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BudgetList from '../components/budgets/BudgetList';

const BudgetsPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Budgets</Text>
      <BudgetList />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff', // Adjust based on your theme
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // Equivalent to Tailwind's text-gray-900
    marginBottom: 24,
  },
});

export default BudgetsPage;
