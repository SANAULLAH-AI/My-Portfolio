import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Theme Context
const ThemeContext = createContext();

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
const useTheme = () => useContext(ThemeContext);

// Categories
const categories = ['All', 'Electronics', 'Jewelery', "Men's Clothing", "Women's Clothing"];

// Home Screen
const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { theme } = useTheme();

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://fakestoreapi.com/products');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === 'All' || product.category === selectedCategory.toLowerCase())
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.productCard, themeStyles[theme].productCard]}
      onPress={() => navigation.navigate('ProductDetails', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text style={[styles.productName, themeStyles[theme].text]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.productPrice, themeStyles[theme].text]}>${item.price.toFixed(2)}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text style={[styles.ratingText, themeStyles[theme].text]}>{item.rating.rate}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      <View style={[styles.searchBar, themeStyles[theme].searchBar]}>
        <TextInput
          style={[styles.searchInput, themeStyles[theme].text]}
          placeholder="Search products..."
          placeholderTextColor={theme === 'dark' ? '#888' : '#000'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search" size={24} color={theme === 'dark' ? '#888' : '#000'} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
  {categories.map((category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive, // Apply active style if selected
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category && styles.categoryTextActive, // Apply active text style if selected
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>

      <Text style={[styles.sectionTitle, themeStyles[theme].text]}>Featured Products</Text>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#ffffff' : '#FF0000'} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredProducts}
      renderItem={renderProductItem}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      contentContainerStyle={styles.productList}
      ListHeaderComponent={renderHeader}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
};

// Product Details Screen
const ProductDetailsScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const { theme } = useTheme();
  const { cartItems, setCartItems } = useContext(CartContext);

  const addToCart = () => {
    const existingItem = cartItems.find((item) => item.id === product.id);
    if (existingItem) {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems((prevItems) => [...prevItems, { ...product, quantity: 1 }]);
    }
    Alert.alert('Added to Cart', `${product.title} has been added to your cart.`);
  };

  return (
    <ScrollView style={[styles.container, themeStyles[theme].container]}>
      <Image source={{ uri: product.image }} style={styles.productDetailsImage} />
      <Text style={[styles.productDetailsName, themeStyles[theme].text]}>{product.title}</Text>
      <Text style={[styles.productDetailsPrice, themeStyles[theme].text]}>${product.price.toFixed(2)}</Text>
      <Text style={[styles.productDetailsDescription, themeStyles[theme].text]}>{product.description}</Text>
      <TouchableOpacity style={styles.addToCartButton} onPress={addToCart}>
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Cart Context
const CartContext = createContext();

// Cart Screen
const CartScreen = ({ navigation }) => {
  const { cartItems, setCartItems } = useContext(CartContext);
  const { theme } = useTheme();

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = () => {
    const order = {
      id: new Date().getTime(),
      items: cartItems,
      total: totalPrice,
      date: new Date().toLocaleDateString(),
      status: 'Pending',
    };

    // Clear cart after checkout
    setCartItems([]);
    Alert.alert('Order Confirmed', 'Your order has been placed successfully!');
    navigation.navigate('Orders');
  };

  return (
    <View style={[styles.container, themeStyles[theme].container]}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, themeStyles[theme].cartItem]}>
            <Text style={[styles.cartItemName, themeStyles[theme].text]}>{item.title}</Text>
            <Text style={[styles.cartItemPrice, themeStyles[theme].text]}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
            <Text style={[styles.cartItemQuantity, themeStyles[theme].text]}>Qty: {item.quantity}</Text>
          </View>
        )}
      />
      <View style={[styles.cartTotal, themeStyles[theme].cartTotal]}>
        <Text style={[styles.cartTotalText, themeStyles[theme].text]}>Total: ${totalPrice.toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Orders Screen
const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    // Fetch orders from backend or storage
    const dummyOrders = [
      { id: 1, date: '2025-03-06', total: 100.5, status: 'Pending' },
      { id: 2, date: '2025-03-05', total: 150.75, status: 'Completed' },
    ];
    setOrders(dummyOrders);
  }, []);

  return (
    <View style={[styles.container, themeStyles[theme].container]}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.orderItem, themeStyles[theme].orderItem]}>
            <Text style={[styles.orderDate, themeStyles[theme].text]}>{item.date}</Text>
            <Text style={[styles.orderTotal, themeStyles[theme].text]}>${item.total.toFixed(2)}</Text>
            <Text style={[styles.orderStatus, themeStyles[theme].text]}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
};

// Profile Screen
const ProfileScreen = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, themeStyles[theme].container]}>
      <Text style={[styles.screenTitle, themeStyles[theme].text]}>Profile & Settings</Text>
      <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
        <Text style={styles.themeButtonText}>
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Stack Navigator for Home and Product Details
const HomeStack = createStackNavigator();

const HomeStackScreen = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
  </HomeStack.Navigator>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const App = () => {
  const [cartItems, setCartItems] = useState([]);

  return (
    <CartContext.Provider value={{ cartItems, setCartItems }}>
      <ThemeProvider>
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
              tabBarActiveTintColor: '#FF0000', // Red accent
              tabBarInactiveTintColor: '#888',
            })}
          >
            <Tab.Screen name="Home" component={HomeStackScreen} />
            <Tab.Screen name="Cart" component={CartScreen} />
            <Tab.Screen name="Orders" component={OrdersScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </CartContext.Provider>
  );
};

// Theme Styles
const themeStyles = {
  light: {
    container: { backgroundColor: '#FFFFFF' },
    text: { color: '#000000' },
    searchBar: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0', borderWidth: 1, borderRadius: 10 },
    productCard: { backgroundColor: '#FFFFFF', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    categories: {
      marginBottom: 25, // Space below the categories
      paddingHorizontal: 16, // Add horizontal padding to avoid edge clipping
    },
    categoryButton: {
      marginRight: 15, // Space between category buttons
      paddingVertical: 12, // Increased vertical padding for a better tap area
      paddingHorizontal: 20, // Increased horizontal padding for more balance
      borderRadius: 12, // Slightly larger radius for modern rounded corners
      backgroundColor: '#E0E0E0', // Lighter background for unselected categories
      elevation: 4, // Shadow to create a floating effect on Android
      alignItems: 'center', // Centering text horizontally in buttons
      justifyContent: 'center', // Centering text vertically
      transform: [{ scale: 1 }], // Reset scale effect for smoother interaction
      transition: 'transform 0.2s ease-in-out', // Smooth transition for hover/focus
    },
    categoryButtonActive: {
      backgroundColor: 'linear-gradient(45deg, #FF6F61, #FF2A68)', // Gradient background for selected category
      elevation: 6, // Slightly more elevation for active button
      transform: [{ scale: 1.1 }], // Slightly scale up when active for effect
    },
    categoryText: {
      fontSize: 18, // Slightly larger text size for better readability
      fontWeight: '700', // Bold text for more prominence
      color: '#333333', // Slightly darker text color for unselected categories
      textAlign: 'center', // Center the text inside the button
    },
    categoryTextActive: {
      color: '#FFFFFF', // White text color for the selected category
    },
    categoryButtonContainer: {
      flexWrap: 'wrap', // Allow the buttons to wrap on small screens
      flexDirection: 'row', // Horizontal alignment
      justifyContent: 'flex-start', // Align buttons to the left (you can change this depending on design needs)
    },
    categoryButtonHover: {
      opacity: 0.8, // Slight opacity change when the button is hovered or focused
    },
  
     cartItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderColor: '#F7F7F7',
        borderWidth: 1,
      },
      cartTotal: {
        backgroundColor: '#F7F7F7',
        borderRadius: 12,
        padding: 15,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderColor: '#F7F7F7',
        borderWidth: 1,
      },
      orderItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderColor: '#F7F7F7',
        borderWidth: 1,
      },
      buttonPrimary: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      buttonSecondary: {
        backgroundColor: '#333333',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      textButton: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
      },
      screenTitle: {
        color: '#333333',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
      },
      errorText: {
        color: '#FF0000',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
      },
      retryButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
      },
    },
    
  dark: {
    container: { backgroundColor: '#1A1A1A' },
    text: { color: '#FFFFFF' },
    searchBar: { backgroundColor: '#333333', borderColor: '#444444', borderWidth: 1, borderRadius: 10 },
    productCard: { backgroundColor: '#333333', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    categoryButton: { backgroundColor: '#444444', borderRadius: 5 }, // Rounded corners
    categoryButtonActive: { backgroundColor: '#FF0000', borderRadius: 5 }, // Red accent with rounded corners
    categoryText: { color: '#FFFFFF' },
    categoryTextActive: { color: '#FFFFFF' },
    cartItem: { backgroundColor: '#333333', borderRadius: 12, padding: 15, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    cartTotal: { backgroundColor: '#444444', borderRadius: 12, padding: 15 },
    orderItem: { backgroundColor: '#333333', borderRadius: 12, padding: 15, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
    buttonPrimary: { backgroundColor: '#FF0000', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 }, // Red accent
    buttonSecondary: { backgroundColor: '#000000', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
    textButton: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
    screenTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
    errorText: { color: '#FF0000', fontSize: 16, fontWeight: 'bold' },
    retryButton: { backgroundColor: '#FF0000', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 }, // Red accent
    retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  },
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#FF0000', fontSize: 16, fontWeight: 'bold' },
  retryButton: { backgroundColor: '#FF0000', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 20, borderRadius: 10 },
  searchInput: { flex: 1, padding: 12, fontSize: 16, color: '#000000' },
  categories: { marginBottom: 25 },
  categoryButton: { marginRight: 15, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  categoryButtonActive: { backgroundColor: '#FF0000' }, // Red accent
  categoryText: { fontSize: 16, fontWeight: 'bold' },
  categoryTextActive: { color: '#FFFFFF' },
  productCard: { flex: 1, padding: 15, borderRadius: 12, marginBottom: 15, marginRight: 15 },
  productImage: { width: '100%', height: 150, borderRadius: 12 },
  productName: { marginTop: 10, fontWeight: 'bold', fontSize: 16 },
  productPrice: { marginTop: 5, color: '#FF0000', fontSize: 16 }, // Red accent
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  ratingText: { marginLeft: 5, fontSize: 14 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
  productDetailsImage: { width: '100%', height: 300, borderRadius: 12 },
  productDetailsName: { fontSize: 26, fontWeight: 'bold', marginVertical: 15 },
  productDetailsPrice: { fontSize: 22, color: '#FF0000' }, // Red accent
  productDetailsDescription: { fontSize: 18, marginVertical: 15, color: '#666666' },
  addToCartButton: { backgroundColor: '#FF0000', paddingVertical: 12, borderRadius: 8, marginTop: 25 }, // Red accent
  addToCartButtonText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  cartItem: { padding: 15, borderRadius: 12, marginVertical: 8 },
  cartTotal: { padding: 20, borderRadius: 12, marginTop: 20 },
  cartTotalText: { fontSize: 20, fontWeight: 'bold' },
  checkoutButton: { backgroundColor: '#000000', paddingVertical: 12, borderRadius: 8, marginTop: 20 }, // Black accent
  checkoutButtonText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  orderItem: { padding: 15, borderRadius: 12, marginVertical: 8 },
  orderDate: { fontSize: 16, color: '#FF0000' }, // Red accent
  orderTotal: { fontSize: 16, color: '#000000' },
  orderStatus: { fontSize: 14, color: '#FF0000' }, // Red accent
  themeButton: { backgroundColor: '#FF0000', paddingVertical: 12, borderRadius: 8, marginTop: 25 }, // Red accent
  themeButtonText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  screenTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
});

export default App;
