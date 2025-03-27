import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { NavigationContainer } from '@react-navigation/native'; // For navigation
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // For bottom tabs

const { width, height } = Dimensions.get('window');

// Dummy Data
const products = [
  {
    id: 1,
    name: 'Smartphone X',
    price: 599.99,
    image: 'https://picsum.photos/200',
    description: 'A high-end smartphone with advanced features.',
    rating: 4.7,
    category: 'Electronics',
  },
  {
    id: 2,
    name: 'Laptop Pro',
    price: 1299.99,
    image: 'https://picsum.photos/201',
    description: 'A powerful laptop for professionals.',
    rating: 4.5,
    category: 'Electronics',
  },
  {
    id: 3,
    name: 'Wireless Headphones',
    price: 199.99,
    image: 'https://picsum.photos/202',
    description: 'Noise-canceling wireless headphones.',
    rating: 4.3,
    category: 'Electronics',
  },
  {
    id: 4,
    name: 'Smart Watch',
    price: 249.99,
    image: 'https://picsum.photos/203',
    description: 'A smartwatch with health tracking features.',
    rating: 4.6,
    category: 'Electronics',
  },
  {
    id: 5,
    name: 'Men\'s T-Shirt',
    price: 29.99,
    image: 'https://picsum.photos/204',
    description: 'Comfortable and stylish t-shirt for men.',
    rating: 4.2,
    category: 'Clothing',
  },
  {
    id: 6,
    name: 'Women\'s Dress',
    price: 59.99,
    image: 'https://picsum.photos/205',
    description: 'Elegant dress for women.',
    rating: 4.4,
    category: 'Clothing',
  },
  {
    id: 7,
    name: 'Home Decor Set',
    price: 99.99,
    image: 'https://picsum.photos/206',
    description: 'A set of beautiful home decor items.',
    rating: 4.5,
    category: 'Home',
  },
  {
    id: 8,
    name: 'Skin Care Kit',
    price: 79.99,
    image: 'https://picsum.photos/207',
    description: 'A complete skin care kit for glowing skin.',
    rating: 4.6,
    category: 'Beauty',
  },
];

const categories = ['All', 'Electronics', 'Clothing', 'Home', 'Beauty'];

const orders = [
  {
    id: 1,
    date: '2023-10-01',
    total: 599.99,
    status: 'Delivered',
  },
  {
    id: 2,
    date: '2023-10-05',
    total: 1299.99,
    status: 'Shipped',
  },
  {
    id: 3,
    date: '2023-10-10',
    total: 199.99,
    status: 'Processing',
  },
];

// Home Screen
const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'All' || product.category === selectedCategory)
  );

  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={24} color="#888" />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Products */}
      <Text style={styles.sectionTitle}>Featured Products</Text>
      <FlatList
        data={filteredProducts.slice(0, 4)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      {/* Recently Viewed */}
      <Text style={styles.sectionTitle}>Recently Viewed</Text>
      <FlatList
        data={filteredProducts.slice(4, 8)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      {/* Special Offers */}
      <Text style={styles.sectionTitle}>Special Offers</Text>
      <FlatList
        data={filteredProducts.slice(8, 12)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </ScrollView>
  );
};

// Product Details Screen
const ProductDetailsScreen = ({ route }) => {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);

  const addToCart = () => {
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image source={{ uri: product.image }} style={styles.productDetailsImage} />
        <Text style={styles.productDetailsName}>{product.name}</Text>
        <Text style={styles.productDetailsPrice}>${product.price.toFixed(2)}</Text>
        <Text style={styles.productDetailsDescription}>{product.description}</Text>
        <TouchableOpacity style={styles.addToCartButton} onPress={addToCart}>
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Cart Screen
const CartScreen = () => {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Smartphone X', price: 599.99, quantity: 1 },
    { id: 2, name: 'Laptop Pro', price: 1299.99, quantity: 1 },
  ]);

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Text style={styles.cartItemName}>{item.name}</Text>
            <Text style={styles.cartItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
            <Text style={styles.cartItemQuantity}>Qty: {item.quantity}</Text>
          </View>
        )}
      />
      <View style={styles.cartTotal}>
        <Text style={styles.cartTotalText}>Total: ${totalPrice.toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Orders Screen
const OrdersScreen = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.orderItem}>
            <Text style={styles.orderDate}>{item.date}</Text>
            <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
            <Text style={styles.orderStatus}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
};

// Profile Screen
const ProfileScreen = () => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Profile & Settings</Text>
      <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
        <Text style={styles.themeButtonText}>
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Cart') {
              iconName = focused ? 'cart' : 'cart-outline';
            } else if (route.name === 'Orders') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007BFF',
          tabBarInactiveTintColor: '#888',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Cart" component={CartScreen} />
        <Tab.Screen name="Orders" component={OrdersScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
  },
  categories: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#007BFF',
  },
  categoryText: {
    color: '#333',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productCard: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#007BFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 4,
  },
  productDetailsImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 16,
  },
  productDetailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productDetailsPrice: {
    fontSize: 20,
    color: '#007BFF',
    marginBottom: 16,
  },
  productDetailsDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addToCartButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItemPrice: {
    fontSize: 16,
    color: '#007BFF',
  },
  cartItemQuantity: {
    fontSize: 16,
    color: '#666',
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cartTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 10,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  orderDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderTotal: {
    fontSize: 16,
    color: '#007BFF',
  },
  orderStatus: {
    fontSize: 16,
    color: '#666',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  themeButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  themeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;