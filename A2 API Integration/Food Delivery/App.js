import React, { createContext, useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import {
  View, FlatList, StyleSheet, TextInput, Image, Animated, Text, ActivityIndicator, TouchableOpacity, ScrollView,
  Dimensions, Platform, StatusBar, RefreshControl, Alert
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Card, Title, Paragraph, Button, useTheme, Provider as PaperProvider, configureFonts, Chip, Avatar,
  IconButton, Badge, ProgressBar, Switch
} from 'react-native-paper';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Spoonacular API Key
const API_KEY = '2686aacd0de44e2f8d8b6d41e3896b36';

// Responsive Dimensions
const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 635;

const scale = (size) => (width / guidelineBaseWidth) * size;
const verticalScale = (size) => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// ================== Custom Themes ==================
const fontConfig = {
  fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  fontWeight: 'normal',
};

const LightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF6B6B',
    secondary: '#FFD700',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    onSurface: '#757575',
    elevation: { level1: '#F8F8F8', level2: '#F0F0F0', level3: '#E0E0E0' },
  },
};

const DarkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF0000',
    secondary: '#FF4500',
    background: '#121212',
    surface: '#1C1C1C',
    text: '#FFFFFF',
    onSurface: '#B0B0B0',
    elevation: { level1: '#242424', level2: '#2C2C2C', level3: '#3C3C3C' },
  },
};

// ================== Contexts ==================
const RestaurantContext = createContext();
const CartContext = createContext();
const AuthContext = createContext();
const OrderContext = createContext();
const AppContext = createContext();

const RestaurantProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [cuisineTypes, setCuisineTypes] = useState(['All']);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=20&addRecipeInformation=true`
      );
      if (!response.ok) throw new Error('Failed to fetch restaurants. Please check your network.');
      const data = await response.json();
      if (!data.results) throw new Error('Invalid API response');
      const restaurantData = data.results.map((recipe) => ({
        id: recipe.id.toString(),
        name: recipe.title,
        cuisine: recipe.cuisines[0] || 'General',
        image: recipe.image || 'https://placehold.co/150x150',
        rating: (Math.random() * 2 + 3).toFixed(1),
        deliveryTime: `${Math.floor(Math.random() * 30 + 15)} min`,
        menu: Array(3).fill().map((_, idx) => ({
          id: `${recipe.id}-${idx}`,
          name: `${recipe.title} Item ${idx + 1}`,
          price: (Math.random() * 15 + 5).toFixed(2),
          image: recipe.image || 'https://placehold.co/100x100',
        })),
      }));
      setRestaurants(restaurantData);
      setFilteredRestaurants(restaurantData);
      setCuisineTypes(['All', ...new Set(restaurantData.map(r => r.cuisine).filter(Boolean))]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const filterByCuisine = useCallback((cuisine) => {
    setFilteredRestaurants(cuisine === 'All' ? restaurants : restaurants.filter(r => r.cuisine === cuisine));
  }, [restaurants]);

  const searchRestaurants = useCallback((query) => {
    if (!query) {
      setFilteredRestaurants(restaurants);
      return;
    }
    const filtered = restaurants.filter(r =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredRestaurants(filtered);
  }, [restaurants]);

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  const value = useMemo(() => ({
    restaurants: filteredRestaurants,
    cuisineTypes,
    filterByCuisine,
    searchRestaurants,
    favorites,
    toggleFavorite,
    loading,
    error,
    refresh: fetchRestaurants,
  }), [filteredRestaurants, cuisineTypes, filterByCuisine, searchRestaurants, favorites, toggleFavorite, loading, error, fetchRestaurants]);

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, cartId: `${item.id}-${Date.now()}`, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId, quantity) => {
    setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, quantity: Math.max(1, quantity) } : item));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
  }, [cart]);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    totalPrice,
    clearCart,
  }), [cart, addToCart, removeFromCart, updateQuantity, totalPrice, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const login = useCallback((email, password) => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return false;
    }
    if (email === credentials.email && password === credentials.password) {
      setUser({ email });
      return true;
    }
    Alert.alert('Error', 'Invalid email or password');
    return false;
  }, [credentials]);

  const signup = useCallback((email, password) => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return false;
    }
    setCredentials({ email, password });
    setUser({ email });
    return true;
  }, []);

  const guestLogin = useCallback(() => {
    setUser({ email: 'guest@example.com' });
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCredentials({ email: '', password: '' });
  }, []);

  const forgotPassword = useCallback((email) => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    Alert.alert('Success', `Reset link sent to ${email} (simulated)`);
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    signup,
    guestLogin,
    logout,
    forgotPassword,
  }), [user, login, signup, guestLogin, logout, forgotPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);

  const placeOrder = useCallback((cart, totalPrice) => {
    if (!cart.length) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    const newOrder = {
      id: Date.now().toString(),
      items: [...cart],
      total: totalPrice,
      status: 'Pending',
      timestamp: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
    setTimeout(() => updateOrderStatus(newOrder.id, 'Preparing'), 2000);
    setTimeout(() => updateOrderStatus(newOrder.id, 'Out for Delivery'), 4000);
    setTimeout(() => updateOrderStatus(newOrder.id, 'Delivered'), 6000);
  }, []);

  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));
  }, []);

  const value = useMemo(() => ({ orders, placeOrder }), [orders, placeOrder]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

// ================== Screens ==================
const SplashScreen = React.memo(({ navigation }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => navigation.replace('Login'));
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.primary }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Icon name="silverware" size={moderateScale(60)} color="#FFF" />
        <Text style={styles.splashText}>Foodie</Text>
      </Animated.View>
    </SafeAreaView>
  );
});

const HomeScreen = React.memo(({ navigation }) => {
  const { restaurants, cuisineTypes, filterByCuisine, searchRestaurants, favorites, toggleFavorite, loading, error, refresh } = useContext(RestaurantContext);
  const { cart } = useContext(CartContext);
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchRestaurants(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchRestaurants]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleCuisinePress = useCallback((cuisine) => {
    setSelectedCuisine(cuisine);
    filterByCuisine(cuisine);
  }, [filterByCuisine]);

  if (loading && !refreshing) return <LoadingScreen />;
  if (error && !refreshing) return <ErrorScreen message={error} onRetry={refresh} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerLeft}>
          <Icon name="silverware" size={moderateScale(28)} color="#FFF" />
          <Text style={styles.headerText}>Foodie</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main', { screen: 'Cart' })}
          style={styles.cartButton}
          accessibilityLabel="View cart"
        >
          <Icon name="cart" size={moderateScale(28)} color="#FFF" />
          {cart.length > 0 && <Badge size={moderateScale(16)} style={styles.cartBadge}>{cart.length}</Badge>}
        </TouchableOpacity>
      </View>
      <View style={styles.searchFilterContainer}>
        <TextInput
          style={[styles.searchBar, { backgroundColor: colors.elevation.level1, color: colors.text }]}
          placeholder="Search restaurants or cuisines..."
          placeholderTextColor={colors.onSurface}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search restaurants"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {cuisineTypes.map(cuisine => (
            <Chip
              key={cuisine}
              mode="outlined"
              selected={selectedCuisine === cuisine}
              onPress={() => handleCuisinePress(cuisine)}
              style={[
                styles.chip,
                { backgroundColor: selectedCuisine === cuisine ? colors.primary : colors.elevation.level2 },
              ]}
              textStyle={{ color: selectedCuisine === cuisine ? '#FFF' : colors.text, fontSize: scale(13) }}
              accessibilityLabel={`Filter by ${cuisine}`}
            >
              {cuisine}
            </Chip>
          ))}
        </ScrollView>
      </View>
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={restaurants}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <RestaurantCard
              item={item}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onPress={() => navigation.navigate('RestaurantDetails', { restaurant: item })}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.flatListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.onSurface }]}>No restaurants found</Text>}
        />
      </Animated.View>
    </SafeAreaView>
  );
});

const RestaurantCard = React.memo(({ item, favorites, toggleFavorite, onPress, colors }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Card
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={`View ${item.name}`}
      >
        <Card.Cover source={{ uri: item.image }} style={styles.cardImage} />
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Title style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Title>
            <IconButton
              icon={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
              color={colors.primary}
              size={moderateScale(24)}
              onPress={() => toggleFavorite(item.id)}
              accessibilityLabel={favorites.includes(item.id) ? 'Remove from favorites' : 'Add to favorites'}
            />
          </View>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={moderateScale(18)} color="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.onSurface }]}>{item.rating} ({item.deliveryTime})</Text>
          </View>
          <Paragraph style={[styles.cuisineText, { color: colors.onSurface }]}>{item.cuisine}</Paragraph>
        </Card.Content>
      </Card>
    </Animated.View>
  );
});

const RestaurantDetailsScreen = React.memo(({ route, navigation }) => {
  const { restaurant } = route.params;
  const { addToCart } = useContext(CartContext);
  const { colors } = useTheme();

  const handleAddToCart = useCallback((item) => {
    addToCart(item);
    Alert.alert('Added to Cart', `${item.name} has been added to your cart!`, [
      { text: 'Continue', style: 'cancel' },
      { text: 'Go to Cart', onPress: () => navigation.navigate('Main', { screen: 'Cart' }) },
    ]);
  }, [addToCart, navigation]);

  const renderHeader = () => (
    <>
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Cover source={{ uri: restaurant.image }} style={styles.detailImage} />
        <Card.Content>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={moderateScale(20)} color="#FFD700" />
            <Text style={[styles.ratingText, { color: colors.onSurface }]}>{restaurant.rating} ({restaurant.deliveryTime})</Text>
          </View>
          <Paragraph style={{ color: colors.onSurface }}>{restaurant.cuisine}</Paragraph>
        </Card.Content>
      </Card>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Menu</Text>
    </>
  );

  const renderMenuItem = ({ item }) => (
    <Card style={[styles.menuItem, { backgroundColor: colors.surface }]}>
      <Card.Content style={styles.menuContent}>
        <Image source={{ uri: item.image }} style={styles.menuImage} />
        <View style={styles.menuDetails}>
          <Title style={[styles.menuTitle, { color: colors.text }]}>{item.name}</Title>
          <Paragraph style={{ color: colors.onSurface }}>${item.price}</Paragraph>
          <Button
            mode="contained"
            onPress={() => handleAddToCart(item)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            labelStyle={{ color: '#FFF', fontSize: scale(14) }}
            icon={() => <Icon name="cart-plus" size={moderateScale(18)} color="#FFF" />}
            accessibilityLabel={`Add ${item.name} to cart`}
          >
            Add
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <IconButton
          icon="arrow-left"
          color="#FFF"
          size={moderateScale(28)}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerText} numberOfLines={1}>{restaurant.name}</Text>
        <View style={{ width: moderateScale(28) }} />
      </View>
      <FlatList
        data={restaurant.menu}
        keyExtractor={item => item.id}
        renderItem={renderMenuItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.contentContainer}
      />
    </SafeAreaView>
  );
});

const CartScreen = React.memo(({ navigation }) => {
  const { cart, totalPrice, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const { placeOrder } = useContext(OrderContext);
  const { colors } = useTheme();

  const handleCheckout = useCallback(() => {
    placeOrder(cart, totalPrice);
    clearCart();
    Alert.alert('Order Placed', 'Your order has been placed successfully!', [
      { text: 'View Orders', onPress: () => navigation.navigate('Main', { screen: 'Orders' }) },
    ]);
  }, [cart, totalPrice, placeOrder, clearCart, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Icon name="cart" size={moderateScale(28)} color="#FFF" />
        <Text style={styles.headerText}>Cart</Text>
        {cart.length > 0 && (
          <IconButton
            icon="delete"
            color="#FFF"
            size={moderateScale(28)}
            onPress={() => {
              Alert.alert('Clear Cart', 'Are you sure you want to clear your cart?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', onPress: clearCart },
              ]);
            }}
            accessibilityLabel="Clear cart"
          />
        )}
      </View>
      <View style={styles.contentContainer}>
        {cart.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.onSurface }]}>Your cart is empty</Text>
        ) : (
          <>
            <FlatList
              data={cart}
              keyExtractor={item => item.cartId}
              renderItem={({ item }) => (
                <Card style={[styles.cartItem, { backgroundColor: colors.surface }]}>
                  <Card.Content style={styles.cartContent}>
                    <View style={styles.cartItemDetails}>
                      <Title style={[styles.cartTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Title>
                      <Paragraph style={{ color: colors.onSurface }}>
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </Paragraph>
                    </View>
                    <View style={styles.quantityControls}>
                      <IconButton
                        icon="minus"
                        size={moderateScale(24)}
                        color={colors.primary}
                        onPress={() => updateQuantity(item.cartId, item.quantity - 1)}
                        accessibilityLabel="Decrease quantity"
                      />
                      <Text style={[styles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
                      <IconButton
                        icon="plus"
                        size={moderateScale(24)}
                        color={colors.primary}
                        onPress={() => updateQuantity(item.cartId, item.quantity + 1)}
                        accessibilityLabel="Increase quantity"
                      />
                      <IconButton
                        icon="delete"
                        size={moderateScale(24)}
                        color="#FF6B6B"
                        onPress={() => removeFromCart(item.cartId)}
                        accessibilityLabel="Remove item"
                      />
                    </View>
                  </Card.Content>
                </Card>
              )}
              contentContainerStyle={{ paddingBottom: verticalScale(100) }}
            />
            <Card style={[styles.totalCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Title style={[styles.totalText, { color: colors.text }]}>Total: ${totalPrice}</Title>
                <Button
                  mode="contained"
                  onPress={handleCheckout}
                  style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
                  labelStyle={{ color: '#FFF', fontSize: scale(16) }}
                  icon={() => <Icon name="credit-card" size={moderateScale(20)} color="#FFF" />}
                  accessibilityLabel="Checkout"
                >
                  Checkout
                </Button>
              </Card.Content>
            </Card>
          </>
        )}
      </View>
    </SafeAreaView>
  );
});

const OrdersScreen = React.memo(() => {
  const { orders } = useContext(OrderContext);
  const { colors } = useTheme();

  const getStatusProgress = useCallback((status) => {
    const statusMap = { 'Pending': 0.25, 'Preparing': 0.5, 'Out for Delivery': 0.75, 'Delivered': 1 };
    return statusMap[status] || 0;
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Icon name="receipt" size={moderateScale(28)} color="#FFF" />
        <Text style={styles.headerText}>Orders</Text>
      </View>
      <View style={styles.contentContainer}>
        {orders.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.onSurface }]}>No orders yet</Text>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Card style={[styles.orderCard, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <Title style={[styles.orderTitle, { color: colors.text }]}>Order #{item.id.slice(-6)}</Title>
                  <Paragraph style={{ color: colors.onSurface }}>Total: ${item.total}</Paragraph>
                  <View style={styles.ratingContainer}>
                    <Icon name="truck-delivery" size={moderateScale(20)} color={colors.primary} />
                    <Paragraph style={{ color: colors.onSurface, marginLeft: scale(8) }}>Status: {item.status}</Paragraph>
                  </View>
                  <ProgressBar progress={getStatusProgress(item.status)} color={colors.primary} style={styles.progressBar} />
                  <Paragraph style={[styles.timestamp, { color: colors.onSurface }]}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Paragraph>
                </Card.Content>
              </Card>
            )}
            contentContainerStyle={{ paddingBottom: verticalScale(20) }}
          />
        )}
      </View>
    </SafeAreaView>
  );
});

const ProfileScreen = React.memo(({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { setDarkMode } = useContext(AppContext);
  const { colors } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
    setDarkMode(prev => !prev);
  }, [setDarkMode]);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => { logout(); navigation.replace('Login'); } },
    ]);
  }, [logout, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Icon name="account" size={moderateScale(28)} color="#FFF" />
        <Text style={styles.headerText}>Profile</Text>
      </View>
      <View style={styles.contentContainer}>
        <Card style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={moderateScale(80)}
              label={user?.email?.charAt(0).toUpperCase() || 'G'}
              style={{ backgroundColor: colors.primary }}
            />
            <Title style={[styles.profileTitle, { color: colors.text }]}>{user?.email || 'Guest'}</Title>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Icon name="weather-night" size={moderateScale(24)} color={colors.text} />
                <Text style={[styles.switchLabel, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch value={isDarkMode} onValueChange={toggleDarkMode} color={colors.primary} />
            </View>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={[styles.logoutButton, { backgroundColor: colors.primary }]}
              labelStyle={{ color: '#FFF', fontSize: scale(16) }}
              icon={() => <Icon name="logout" size={moderateScale(20)} color="#FFF" />}
              accessibilityLabel="Logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
});

const LoginScreen = React.memo(({ navigation }) => {
  const { login, signup, guestLogin, forgotPassword } = useContext(AuthContext);
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const handleSubmit = useCallback(() => {
    if (isSignup) {
      if (signup(email, password)) navigation.replace('Main');
    } else if (login(email, password)) {
      navigation.replace('Main');
    }
  }, [email, password, isSignup, login, signup, navigation]);

  const handleGuestLogin = useCallback(() => {
    guestLogin();
    navigation.replace('Main');
  }, [guestLogin, navigation]);

  return (
    <SafeAreaView style={[styles.loginContainer, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.loginContent, { opacity: fadeAnim }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Icon name="silverware" size={moderateScale(32)} color="#FFF" />
          <Text style={styles.appName}>Foodie</Text>
        </View>
        <Card style={[styles.loginCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <TextInput
              style={[styles.input, { backgroundColor: colors.elevation.level1, color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.onSurface}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email input"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.elevation.level1, color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.onSurface}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Password input"
            />
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              labelStyle={{ color: '#FFF', fontSize: scale(16) }}
              icon={() => <Icon name={isSignup ? "account-plus" : "login"} size={moderateScale(20)} color="#FFF" />}
              accessibilityLabel={isSignup ? 'Sign Up' : 'Login'}
            >
              {isSignup ? 'Sign Up' : 'Login'}
            </Button>
            <Button
              mode="text"
              onPress={() => setIsSignup(prev => !prev)}
              style={styles.switchButton}
              labelStyle={{ color: colors.primary, fontSize: scale(14) }}
              accessibilityLabel={isSignup ? 'Switch to Login' : 'Switch to Sign Up'}
            >
              {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
            </Button>
            <Button
              mode="outlined"
              onPress={handleGuestLogin}
              style={styles.guestButton}
              labelStyle={{ color: colors.primary, fontSize: scale(14) }}
              icon={() => <Icon name="account-outline" size={moderateScale(18)} color={colors.primary} />}
              accessibilityLabel="Continue as Guest"
            >
              Continue as Guest
            </Button>
            {!isSignup && (
              <Button
                mode="text"
                onPress={() => forgotPassword(email)}
                style={styles.forgotButton}
                labelStyle={{ color: colors.primary, fontSize: scale(12) }}
                icon={() => <Icon name="lock-reset" size={moderateScale(16)} color={colors.primary} />}
                accessibilityLabel="Forgot Password"
              >
                Forgot Password?
              </Button>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    </SafeAreaView>
  );
});

// Utility Screens
const LoadingScreen = React.memo(() => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.onSurface }]}>Loading...</Text>
    </SafeAreaView>
  );
});

const ErrorScreen = React.memo(({ message, onRetry }) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
      <Icon name="alert-circle-outline" size={moderateScale(48)} color={colors.primary} />
      <Text style={[styles.errorText, { color: colors.text }]}>{message}</Text>
      <Button
        mode="contained"
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        labelStyle={{ color: '#FFF', fontSize: scale(16) }}
        icon={() => <Icon name="refresh" size={moderateScale(20)} color="#FFF" />}
        accessibilityLabel="Retry"
      >
        Retry
      </Button>
    </SafeAreaView>
  );
});

// ================== Navigation ==================
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { colors } = useTheme();
  const { cart } = useContext(CartContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            Cart: 'cart',
            Orders: 'receipt',
            Profile: 'account',
          };
          return <Icon name={icons[route.name]} size={moderateScale(size)} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurface,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          height: verticalScale(60),
          paddingBottom: Platform.OS === 'android' ? verticalScale(5) : verticalScale(10),
          borderTopLeftRadius: moderateScale(20),
          borderTopRightRadius: moderateScale(20),
        },
        tabBarLabelStyle: { fontSize: scale(12), marginBottom: verticalScale(5) },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          headerShown: false,
          tabBarBadge: cart.length > 0 ? cart.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#FFF', fontSize: scale(10) },
        }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <AppContext.Provider value={{ setDarkMode: setIsDarkMode }}>
      <PaperProvider theme={isDarkMode ? DarkTheme : LightTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <RestaurantProvider>
              <CartProvider>
                <OrderProvider>
                  <NavigationContainer theme={isDarkMode ? DarkTheme : LightTheme}>
                    <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#121212' : '#F5F5F5'} />
                    <Stack.Navigator initialRouteName="Splash" screenOptions={{ gestureEnabled: true }}>
                      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
                      <Stack.Screen name="RestaurantDetails" component={RestaurantDetailsScreen} options={{ headerShown: false }} />
                    </Stack.Navigator>
                  </NavigationContainer>
                </OrderProvider>
              </CartProvider>
            </RestaurantProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </PaperProvider>
    </AppContext.Provider>
  );
};

// ================== Styles ==================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { paddingHorizontal: scale(16), paddingBottom: verticalScale(20) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(3) },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(5),
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerText: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: scale(8),
    flex: 1,
  },
  cartButton: { position: 'relative', marginLeft: -scale(23) },
  cartBadge: { position: 'absolute', top: -scale(4), right: -scale(4), backgroundColor: '#FFF', color: '#FF6B6B' },
  searchFilterContainer: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(3),
  },
  searchBar: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(25),
    fontSize: scale(16),
    marginBottom: verticalScale(8),
  },
  filterContainer: { paddingRight: scale(8) },
  chip: {
    marginRight: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  listContainer: { flex: 1 },
  flatListContent: { paddingVertical: verticalScale(8), paddingHorizontal: scale(16) },
  card: { marginVertical: verticalScale(8), borderRadius: moderateScale(12), elevation: 3, overflow: 'hidden' },
  cardContent: { padding: scale(12) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardImage: { height: verticalScale(160), borderTopLeftRadius: moderateScale(12), borderTopRightRadius: moderateScale(12) },
  cardTitle: { fontSize: scale(16), fontWeight: '600', flex: 1 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: verticalScale(4) },
  ratingText: { marginLeft: scale(4), fontSize: scale(14) },
  cuisineText: { fontSize: scale(13) },
  detailImage: { height: verticalScale(200) },
  sectionTitle: { fontSize: scale(20), fontWeight: 'bold', marginVertical: verticalScale(12) },
  menuItem: { marginVertical: verticalScale(8), borderRadius: moderateScale(12), elevation: 3 },
  menuContent: { flexDirection: 'row', alignItems: 'center', padding: scale(8) },
  menuImage: { width: moderateScale(80), height: moderateScale(80), borderRadius: moderateScale(10), marginRight: scale(12) },
  menuDetails: { flex: 1 },
  menuTitle: { fontSize: scale(16), fontWeight: '500' },
  addButton: { marginTop: verticalScale(8), borderRadius: moderateScale(20), paddingVertical: verticalScale(2) },
  cartItem: { marginVertical: verticalScale(8), borderRadius: moderateScale(12), elevation: 3 },
  cartContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: verticalScale(8) },
  cartItemDetails: { flex: 1, marginRight: scale(8) },
  cartTitle: { fontSize: scale(16), fontWeight: '500' },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  quantityText: { fontSize: scale(16), marginHorizontal: scale(8) },
  totalCard: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: scale(16),
    right: scale(16),
    borderRadius: moderateScale(12),
    elevation: 5,
    padding: scale(12),
  },
  totalText: { fontSize: scale(18), fontWeight: 'bold' },
  checkoutButton: { marginTop: verticalScale(12), borderRadius: moderateScale(20), paddingVertical: verticalScale(4) },
  orderCard: { marginVertical: verticalScale(8), borderRadius: moderateScale(12), elevation: 3 },
  orderTitle: { fontSize: scale(18), fontWeight: '600' },
  progressBar: { marginVertical: verticalScale(8), height: verticalScale(6), borderRadius: moderateScale(3) },
  timestamp: { fontSize: scale(12), marginTop: verticalScale(4) },
  emptyText: { fontSize: scale(16), textAlign: 'center', marginTop: verticalScale(20) },
  profileCard: { marginVertical: verticalScale(16), borderRadius: moderateScale(12), elevation: 3, width: '90%' },
  profileContent: { alignItems: 'center', padding: scale(16) },
  profileTitle: { fontSize: scale(20), fontWeight: 'bold', marginVertical: verticalScale(12) },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '80%', marginVertical: verticalScale(16) },
  switchLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: scale(16), marginLeft: scale(8) },
  logoutButton: { marginTop: verticalScale(16), borderRadius: moderateScale(20), paddingVertical: verticalScale(4), width: '80%' },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContent: { width: '100%', alignItems: 'center', paddingHorizontal: scale(16) },
  appName: { fontSize: moderateScale(28), fontWeight: 'bold', color: '#FFF', marginLeft: scale(12) },
  loginCard: { width: '100%', borderRadius: moderateScale(12), elevation: 5, padding: scale(16) },
  input: { marginVertical: verticalScale(12), padding: scale(12), borderRadius: moderateScale(25), fontSize: scale(16) },
  loginButton: { marginVertical: verticalScale(12), borderRadius: moderateScale(20), paddingVertical: verticalScale(4) },
  switchButton: { marginVertical: verticalScale(8) },
  guestButton: { marginVertical: verticalScale(8), borderRadius: moderateScale(20) },
  forgotButton: { marginTop: verticalScale(8) },
  splashText: { fontSize: moderateScale(40), fontWeight: 'bold', color: '#FFF', marginTop: verticalScale(12) },
  loadingText: { marginTop: verticalScale(12), fontSize: scale(16) },
  errorText: { fontSize: scale(16), textAlign: 'center', marginVertical: verticalScale(16) },
  retryButton: { marginTop: verticalScale(12), borderRadius: moderateScale(20), paddingVertical: verticalScale(4) },
});

export default App;
