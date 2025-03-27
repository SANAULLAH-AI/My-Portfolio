import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions, Alert, Modal } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import * as Animatable from 'react-native-animatable'; // For animations

// API Configuration
const API_KEY = '0f012c42b77a742b6b060aa933188a9c'; // Your API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

// Screen Dimensions
const { width, height } = Dimensions.get('window');

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

// Stack Navigator for Booking Details and Payment
const Stack = createStackNavigator();

// Main App Component
export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Search') {
              iconName = 'search';
            } else if (route.name === 'Bookings') {
              iconName = 'book';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#E50914', // Netflix red color for active tab
          tabBarInactiveTintColor: '#888', // Gray color for inactive tab
          tabBarStyle: {
            backgroundColor: '#141414', // Dark background for the tab bar
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 10,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Bookings" component={MyBookingsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Home Stack Navigator (for Booking Details and Payment)
const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{ title: 'Booking Details' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Payment' }}
      />
    </Stack.Navigator>
  );
};

// Home Screen
const HomeScreen = ({ navigation }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/movie/popular`, {
          params: {
            api_key: API_KEY,
          },
        });
        setMovies(response.data.results);
      } catch (error) {
        console.error('Error fetching movies:', error);
        Alert.alert('Error', 'Failed to fetch movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const addToFavorites = (item) => {
    if (!favorites.some((fav) => fav.id === item.id)) {
      setFavorites([...favorites, item]);
      Alert.alert('Added to Favorites', `${item.title} has been added to your favorites.`);
    } else {
      Alert.alert('Already in Favorites', `${item.title} is already in your favorites.`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Popular Movies</Text>
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Animatable.View animation="fadeInUp" duration={1000}>
            <TouchableOpacity
              style={styles.movieCard}
              onPress={() => navigation.navigate('BookingDetails', { item })}
            >
              <Image source={{ uri: `${IMAGE_URL}${item.poster_path}` }} style={styles.movieImage} />
              <Text style={styles.movieTitle}>{item.title}</Text>
              <TouchableOpacity style={styles.favoriteButton} onPress={() => addToFavorites(item)}>
                <Icon name="favorite" size={24} color="#E50914" />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animatable.View>
        )}
      />

      <Text style={styles.title}>Favorites</Text>
      {favorites.length === 0 ? (
        <Text style={styles.subtitle}>No favorites yet.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Animatable.View animation="fadeInUp" duration={1000}>
              <TouchableOpacity
                style={styles.movieCard}
                onPress={() => navigation.navigate('BookingDetails', { item })}
              >
                <Image source={{ uri: `${IMAGE_URL}${item.poster_path}` }} style={styles.movieImage} />
                <Text style={styles.movieTitle}>{item.title}</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}
        />
      )}
    </ScrollView>
  );
};

// Search Screen
const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/search/movie`, {
        params: {
          api_key: API_KEY,
          query: searchQuery,
        },
      });
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Error searching movies:', error);
      Alert.alert('Error', 'Failed to search movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search for movies..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#E50914" />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.searchResultCard}
              onPress={() => navigation.navigate('BookingDetails', { item })}
            >
              <Image source={{ uri: `${IMAGE_URL}${item.poster_path}` }} style={styles.searchResultImage} />
              <View style={styles.searchResultTextContainer}>
                <Text style={styles.searchResultTitle}>{item.title}</Text>
                <Text style={styles.searchResultOverview} numberOfLines={2}>
                  {item.overview}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

// Booking Details Screen
const BookingDetailsScreen = ({ route, navigation }) => {
  const { item } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: `${IMAGE_URL}${item.poster_path}` }} style={styles.detailsImage} />
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>{item.title}</Text>
        <Text style={styles.detailsOverview}>{item.overview}</Text>
        <View style={styles.detailsInfoContainer}>
          <Text style={styles.detailsInfoLabel}>Release Date:</Text>
          <Text style={styles.detailsInfoText}>{item.release_date}</Text>
        </View>
        <View style={styles.detailsInfoContainer}>
          <Text style={styles.detailsInfoLabel}>Rating:</Text>
          <Text style={styles.detailsInfoText}>{item.vote_average}/10</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('Payment', { item })}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Payment Screen
const PaymentScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCVV] = useState('');

  const handlePayment = () => {
    if (paymentMethod === 'paypal' && !email) {
      Alert.alert('Error', 'Please enter your PayPal email.');
      return;
    }
    if (paymentMethod === 'creditCard' && (!cardNumber || !expirationDate || !cvv)) {
      Alert.alert('Error', 'Please enter all credit card details.');
      return;
    }
    Alert.alert('Payment Successful', `You have successfully booked ${item.title}`, [
      {
        text: 'OK',
        onPress: () => navigation.navigate('Bookings', { item }),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.paymentText}>Choose Payment Method:</Text>
      <TouchableOpacity
        style={styles.paymentOption}
        onPress={() => setPaymentMethod('creditCard')}
      >
        <Icon name="credit-card" size={24} color={paymentMethod === 'creditCard' ? '#E50914' : '#888'} />
        <Text style={[styles.paymentOptionText, { color: paymentMethod === 'creditCard' ? '#E50914' : '#888' }]}>
          Credit Card
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.paymentOption}
        onPress={() => setPaymentMethod('paypal')}
      >
        <Icon name="paypal" size={24} color={paymentMethod === 'paypal' ? '#E50914' : '#888'} />
        <Text style={[styles.paymentOptionText, { color: paymentMethod === 'paypal' ? '#E50914' : '#888' }]}>
          PayPal
        </Text>
      </TouchableOpacity>

      {paymentMethod === 'paypal' ? (
        <View style={styles.paymentDetailsContainer}>
          <Text style={styles.paymentDetailsLabel}>PayPal Email:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your PayPal email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>
      ) : (
        <View style={styles.paymentDetailsContainer}>
          <Text style={styles.paymentDetailsLabel}>Card Number:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your card number"
            placeholderTextColor="#888"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="numeric"
          />
          <Text style={styles.paymentDetailsLabel}>Expiration Date:</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/YY"
            placeholderTextColor="#888"
            value={expirationDate}
            onChangeText={setExpirationDate}
          />
          <Text style={styles.paymentDetailsLabel}>CVV:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter CVV"
            placeholderTextColor="#888"
            value={cvv}
            onChangeText={setCVV}
            keyboardType="numeric"
            secureTextEntry
          />
        </View>
      )}

      <TouchableOpacity style={styles.confirmButton} onPress={handlePayment}>
        <Text style={styles.confirmButtonText}>Confirm Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// My Bookings Screen
const MyBookingsScreen = ({ route }) => {
  const [bookings, setBookings] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (route.params?.item) {
      setBookings([...bookings, route.params.item]);
      setShowConfirmation(true);
    }
  }, [route.params?.item]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      {bookings.length === 0 ? (
        <Text style={styles.subtitle}>No bookings yet.</Text>
      ) : (
        bookings.map((item, index) => (
          <Animatable.View key={index} animation="fadeInUp" duration={1000}>
            <View style={styles.bookingCard}>
              <Image source={{ uri: `${IMAGE_URL}${item.poster_path}` }} style={styles.bookingImage} />
              <View style={styles.bookingDetails}>
                <Text style={styles.bookingTitle}>{item.title}</Text>
                <Text style={styles.bookingDate}>Booked on: {new Date().toLocaleDateString()}</Text>
              </View>
            </View>
          </Animatable.View>
        ))
      )}
      <Modal visible={showConfirmation} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Booking Confirmed!</Text>
            <Text style={styles.modalText}>Your booking for {route.params?.item.title} has been confirmed.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowConfirmation(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Profile Screen
const ProfileScreen = () => {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    Alert.alert('Profile Updated', 'Your profile has been updated successfully.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.profileCard}>
        <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.profileImage} />
        {editing ? (
          <>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#141414',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#E50914',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  movieCard: {
    width: width * 0.4,
    marginRight: 16,
  },
  movieImage: {
    width: '100%',
    height: height * 0.3,
    borderRadius: 10,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#2E2E2E',
    borderRadius: 10,
    padding: 10,
  },
  bookingImage: {
    width: 50,
    height: 75,
    borderRadius: 10,
    marginRight: 16,
  },
  bookingDetails: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  bookingDate: {
    fontSize: 14,
    color: '#888',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#2E2E2E',
    borderRadius: 10,
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    color: '#FFF',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#E50914',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#E50914',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#2E2E2E',
    padding: 20,
    borderRadius: 10,
    width: width * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#E50914',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E2E',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: '#FFF',
  },
  searchButton: {
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchResultImage: {
    width: 50,
    height: 75,
    borderRadius: 10,
    marginRight: 16,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    color: '#FFF',
  },
  searchResultOverview: {
    fontSize: 14,
    color: '#888',
  },
  detailsImage: {
    width: '100%',
    height: height * 0.5,
    borderRadius: 10,
    marginBottom: 16,
  },
  detailsContainer: {
    padding: 16,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  detailsOverview: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  detailsInfoContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailsInfoLabel: {
    fontSize: 16,
    color: '#E50914',
    fontWeight: 'bold',
    marginRight: 8,
  },
  detailsInfoText: {
    fontSize: 16,
    color: '#FFF',
  },
  bookButton: {
    backgroundColor: '#E50914',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  paymentContainer: {
    padding: 16,
  },
  paymentText: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E2E2E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 16,
  },
  paymentOptionText: {
    color: '#FFF',
    marginLeft: 10,
  },
  paymentDetailsContainer: {
    marginBottom: 16,
  },
  paymentDetailsLabel: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: '#E50914',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
  },
});
