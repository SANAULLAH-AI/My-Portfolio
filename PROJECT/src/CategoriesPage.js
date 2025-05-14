import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CategoryList from '../components/categories/CategoryList';

const CategoriesPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Categories</Text>
      <CategoryList />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff', // Optional: adjust for dark mode
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // Tailwind's text-gray-900
    marginBottom: 24,
  },
});

export default CategoriesPage;
