import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';

// Constants
const API_KEY = '0f012c42b77a742b6b060aa933188a9c'; // TMDB API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const DISNEY_API_URL = 'https://api.disneyapi.dev';
const SERVER_URL = 'http://192.168.100.147:4000/api';
const STORAGE_KEY = '@disney_movies';
const USER_KEY = '@disney_user';
const FAV_KEY = '@disney_favorites';
const HIST_KEY = '@disney_history';
const DOWN_KEY = '@disney_downloads';

// Screen dimensions for responsiveness
const { width, height } = Dimensions.get('window');

const App = () => {
  // State Management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchProgress, setWatchProgress] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [parentalControl, setParentalControl] = useState(false);
  const [language, setLanguage] = useState('English');
  const [downloads, setDownloads] = useState([]);
  const [userRating, setUserRating] = useState({});
  const [feedback, setFeedback] = useState('');
  const [currentProfile, setCurrentProfile] = useState('User 1');
  const [activeTab, setActiveTab] = useState('Home');
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Theme Colors
  const lightTheme = {
    background: '#F5F6FA',
    text: '#1A1A1A',
    primary: '#0078D7',
    secondary: '#FFFFFF',
    accent: '#FF5252',
    cardBackground: '#FFFFFF',
    shadow: '#00000020',
  };

  const darkTheme = {
    background: '#121212',
    text: '#E0E0E0',
    primary: '#B22222',
    secondary: '#1E1E1E',
    accent: '#FF5252',
    cardBackground: '#252525',
    shadow: '#FFFFFF20',
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Authentication
  const handleSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const response = await axios.post(`${SERVER_URL}/signup`, { email, password });
      Alert.alert('Success', response.data.message);
      setIsLoggedIn(true);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify({ email }));
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsSignup(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
      console.error('Signup Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }

      const response = await axios.post(`${SERVER_URL}/login`, { email, password });
      Alert.alert('Success', response.data.message);
      setIsLoggedIn(true);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify({ email, token: response.data.token }));
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!email) {
        setError('Please enter your email');
        return;
      }

      const response = await axios.post(`${SERVER_URL}/forgot-password`, { email });
      Alert.alert('Success', response.data.message);
      setForgotPassword(true); // Keep forgotPassword true to allow token input
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again.');
      console.error('Forgot Password Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!resetToken || !newPassword) {
        setError('Please enter the reset token and new password');
        return;
      }

      const response = await axios.post(`${SERVER_URL}/reset-password`, { token: resetToken, newPassword });
      Alert.alert('Success', response.data.message);
      setForgotPassword(false);
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      console.error('Reset Password Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([USER_KEY, FAV_KEY, HIST_KEY, DOWN_KEY]);
      setIsLoggedIn(false);
      setFavorites([]);
      setWatchHistory([]);
      setDownloads([]);
      setUserRating({});
    } catch (err) {
      console.error('Logout Error:', err);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  // Data Fetching
  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=2`
      );
      const movieData = response.data.results.map(movie => ({
        ...movie,
        category: getCategory(movie),
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(movieData));
      setMovies(movieData);
      fetchRecommendations(movieData);
    } catch (err) {
      setError('Failed to fetch movies. Using cached data if available.');
      console.error('Fetch Movies Error:', err);
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) setMovies(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${DISNEY_API_URL}/character`);
      setCharacters(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch characters.');
      console.error('Fetch Characters Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (movie) => {
    if (movie.popularity > 50) return 'Featured';
    if (movie.vote_average > 7) return 'Popular';
    return 'Classics';
  };

  // Feature Implementations
  const fetchRecommendations = (movieList) => {
    const recs = movieList.filter(m => m.vote_average > 8).slice(0, 5);
    setRecommendations(recs);
  };

  const toggleFavorite = async (movie) => {
    try {
      const updatedFavorites = favorites.some(f => f.id === movie.id)
        ? favorites.filter(f => f.id !== movie.id)
        : [...favorites, movie];
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updatedFavorites));
    } catch (err) {
      console.error('Toggle Favorite Error:', err);
      Alert.alert('Error', 'Failed to update favorites.');
    }
  };

  const addToHistory = async (movie) => {
    try {
      const updatedHistory = [movie, ...watchHistory.filter(m => m.id !== movie.id)].slice(0, 10);
      setWatchHistory(updatedHistory);
      await AsyncStorage.setItem(HIST_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('Add to History Error:', err);
    }
  };

  const downloadMovie = async (movie) => {
    try {
      if (!downloads.some(d => d.id === movie.id)) {
        const updatedDownloads = [...downloads, movie];
        setDownloads(updatedDownloads);
        await AsyncStorage.setItem(DOWN_KEY, JSON.stringify(updatedDownloads));
        Alert.alert('Download Started', `${movie.title} has been added to downloads.`);
      }
    } catch (err) {
      console.error('Download Movie Error:', err);
      Alert.alert('Error', 'Failed to download movie.');
    }
  };

  const rateMovie = (movieId, rating) => {
    setUserRating(prev => ({ ...prev, [movieId]: rating }));
  };

  const submitFeedback = () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter some feedback.');
      return;
    }
    Alert.alert('Feedback Submitted', 'Thank you for your feedback!');
    setFeedback('');
  };

  const startPlayback = (movie) => {
    if (parentalControl && movie.vote_average < 7) {
      Alert.alert('Restricted', 'This content is restricted by parental controls.');
      return;
    }
    setSelectedMovie(movie);
    setIsPlaying(true);
    addToHistory(movie);
    const interval = setInterval(() => {
      setWatchProgress(prev => ({
        ...prev,
        [movie.id]: Math.min((prev[movie.id] || 0) + 10, 100),
      }));
    }, 1000);
    return () => clearInterval(interval);
  };

  const viewCharacterDetails = (character) => {
    setSelectedCharacter(character);
  };

  // Initial Load
  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await AsyncStorage.getItem(USER_KEY);
        const favs = await AsyncStorage.getItem(FAV_KEY);
        const hist = await AsyncStorage.getItem(HIST_KEY);
        const downs = await AsyncStorage.getItem(DOWN_KEY);
        if (user) setIsLoggedIn(true);
        if (favs) setFavorites(JSON.parse(favs));
        if (hist) setWatchHistory(JSON.parse(hist));
        if (downs) setDownloads(JSON.parse(downs));
        fetchMovies();
        fetchCharacters();
      } catch (err) {
        console.error('Initialization Error:', err);
        setError('Failed to initialize app.');
      }
    };
    initialize();
  }, []);

  // Components
  const MovieItem = ({ item }) => (
    <TouchableOpacity style={[styles.movieItem, { backgroundColor: theme.cardBackground }]} onPress={() => setSelectedMovie(item)}>
      <Image
        source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
        style={styles.movieImage}
        resizeMode="cover"
      />
      <Text style={[styles.movieTitle, { color: theme.text }]} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const CharacterItem = ({ item }) => (
    <TouchableOpacity style={[styles.characterItem, { backgroundColor: theme.cardBackground }]} onPress={() => viewCharacterDetails(item)}>
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
        style={styles.characterImage}
        resizeMode="cover"
      />
      <Text style={[styles.characterName, { color: theme.text }]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
  );

  const TaskBar = () => (
    <View style={[styles.taskBar, { backgroundColor: theme.secondary }]}>
      {['Home', 'Favorites', 'History', 'Downloads', 'Settings', 'Characters'].map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.taskBarItem, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Icon
            name={
              tab === 'Home' ? 'home' :
              tab === 'Favorites' ? 'heart' :
              tab === 'History' ? 'history' :
              tab === 'Downloads' ? 'download' :
              tab === 'Settings' ? 'cog' :
              'users'
            }
            size={24}
            color={activeTab === tab ? theme.primary : theme.text}
          />
          <Text style={[styles.taskBarText, { color: activeTab === tab ? theme.primary : theme.text }]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const CharacterDetails = () => {
    if (!selectedCharacter) return null;
    return (
      <ScrollView style={[styles.characterDetailsContainer, { backgroundColor: theme.background }]}>
        <Image
          source={{ uri: selectedCharacter.imageUrl || 'https://via.placeholder.com/250' }}
          style={styles.characterDetailsImage}
          resizeMode="cover"
        />
        <View style={styles.characterDetailsContent}>
          <Text style={[styles.characterDetailsName, { color: theme.text }]}>
            {selectedCharacter.name}
          </Text>
          <Text style={[styles.characterDetailsText, { color: theme.text }]}>
            Films: {selectedCharacter.films?.length ? selectedCharacter.films.join(', ') : 'N/A'}
          </Text>
          <Text style={[styles.characterDetailsText, { color: theme.text }]}>
            Short Films: {selectedCharacter.shortFilms?.length ? selectedCharacter.shortFilms.join(', ') : 'N/A'}
          </Text>
          <Text style={[styles.characterDetailsText, { color: theme.text }]}>
            TV Shows: {selectedCharacter.tvShows?.length ? selectedCharacter.tvShows.join(', ') : 'N/A'}
          </Text>
          <Text style={[styles.characterDetailsText, { color: theme.text }]}>
            Video Games: {selectedCharacter.videoGames?.length ? selectedCharacter.videoGames.join(', ') : 'N/A'}
          </Text>
          <Text style={[styles.characterDetailsText, { color: theme.text }]}>
            Park Attractions: {selectedCharacter.parkAttractions?.length ? selectedCharacter.parkAttractions.join(', ') : 'N/A'}
          </Text>
          <Text style={[styles.characterDetailsText, { color: theme.text }]}>
            Allies: {selectedCharacter.allies?.length ? selectedCharacter.allies.join(', ') : 'N/A'}
          </Text>
          <Text style={[styles.characterDetailsText, { color: theme.text }]}>
            Enemies: {selectedCharacter.enemies?.length ? selectedCharacter.enemies.join(', ') : 'N/A'}
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { borderColor: theme.text }]}
            onPress={() => setSelectedCharacter(null)}
          >
            <Text style={[styles.closeButtonText, { color: theme.text }]}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // Main Render
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.authContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.secondary} />
        <View style={styles.authHeader}>
          <Image
            source={{ uri: 'https://via.placeholder.com/100' }} // Replace with Disney+ logo URL
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.authTitle, { color: theme.text }]}>Disney+</Text>
          <Text style={[styles.authSubtitle, { color: theme.text + '80' }]}>
            {forgotPassword ? 'Reset Your Password' : isSignup ? 'Create Your Account' : 'Welcome Back'}
          </Text>
        </View>
        <View style={[styles.authCard, { backgroundColor: theme.cardBackground }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.shadow }]}
            placeholder="Email"
            placeholderTextColor={theme.text + '80'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {!forgotPassword && (
            <TextInput
              style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.shadow }]}
              placeholder="Password"
              placeholderTextColor={theme.text + '80'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          )}
          {isSignup && !forgotPassword && (
            <TextInput
              style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.shadow }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.text + '80'}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}
          {forgotPassword && (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.shadow }]}
                placeholder="Reset Token (from email)"
                placeholderTextColor={theme.text + '80'}
                value={resetToken}
                onChangeText={setResetToken}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.shadow }]}
                placeholder="New Password"
                placeholderTextColor={theme.text + '80'}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </>
          )}
          {error && <Text style={[styles.errorText, { color: theme.accent }]}>{error}</Text>}
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: theme.primary }]}
            onPress={forgotPassword ? (resetToken ? handleResetPassword : handleForgotPassword) : isSignup ? handleSignup : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.authButtonText}>
                {forgotPassword ? (resetToken ? 'Reset Password' : 'Send Reset Link') : isSignup ? 'Sign Up' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>
          {!forgotPassword && (
            <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
              <Text style={[styles.switchText, { color: theme.primary }]}>
                {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>
          )}
          {!isSignup && !forgotPassword && (
            <TouchableOpacity onPress={() => setForgotPassword(true)}>
              <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
          {forgotPassword && !resetToken && (
            <TouchableOpacity onPress={() => setForgotPassword(false)}>
              <Text style={[styles.switchText, { color: theme.primary }]}>Back to Login</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.themeToggle} onPress={() => setIsDarkMode(!isDarkMode)}>
          <Icon name={isDarkMode ? 'sun-o' : 'moon-o'} size={28} color={theme.text} />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categorizedMovies = {
    Featured: filteredMovies.filter(m => m.category === 'Featured'),
    Popular: filteredMovies.filter(m => m.category === 'Popular'),
    Classics: filteredMovies.filter(m => m.category === 'Classics'),
  };

  const homeSections = [
    { title: 'Featured', data: categorizedMovies.Featured, type: 'movies' },
    { title: 'Popular', data: categorizedMovies.Popular, type: 'movies' },
    { title: 'Classics', data: categorizedMovies.Classics, type: 'movies' },
    { title: 'Recommended', data: recommendations, type: 'movies' },
    { title: 'Characters', data: characters.slice(0, 6), type: 'characters' },
  ].filter(section => section.data.length > 0);

  const renderHomeItem = ({ item }) => {
    if (item.type === 'movies') {
      return (
        <View style={styles.sectionContainer}>
          <SectionHeader title={item.title} />
          <FlatList
            data={item.data}
            renderItem={MovieItem}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            key={`movie-${item.title}-horizontal`}
          />
        </View>
      );
    } else if (item.type === 'characters') {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.charactersHeader}>
            <SectionHeader title={item.title} />
            <TouchableOpacity style={styles.viewAllButton} onPress={() => setActiveTab('Characters')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={item.data}
            renderItem={CharacterItem}
            keyExtractor={item => item._id.toString()}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            key={`character-${item.title}-3`}
          />
        </View>
      );
    }
    return null;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return (
          <FlatList
            data={homeSections}
            renderItem={renderHomeItem}
            keyExtractor={item => `${item.title}-${item.type}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.homeFlatListContent}
            key="home-1"
          />
        );
      case 'Favorites':
        return (
          <FlatList
            data={favorites}
            renderItem={MovieItem}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text }]}>No favorites yet.</Text>}
            key="favorites-2"
          />
        );
      case 'History':
        return (
          <FlatList
            data={watchHistory}
            renderItem={MovieItem}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text }]}>No history yet.</Text>}
            key="history-2"
          />
        );
      case 'Downloads':
        return (
          <FlatList
            data={downloads}
            renderItem={MovieItem}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text }]}>No downloads yet.</Text>}
            key="downloads-2"
          />
        );
      case 'Settings':
        return (
          <ScrollView style={styles.settingsContainer}>
            <Text style={[styles.settingsTitle, { color: theme.text }]}>Settings</Text>
            <View style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
                trackColor={{ false: '#767577', true: theme.primary }}
              />
            </View>
            <View style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.settingText, { color: theme.text }]}>Parental Control</Text>
              <Switch
                value={parentalControl}
                onValueChange={setParentalControl}
                thumbColor={parentalControl ? theme.primary : '#f4f3f4'}
                trackColor={{ false: '#767577', true: theme.primary }}
              />
            </View>
            <View style={[styles.settingItem, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.settingText, { color: theme.text }]}>Language</Text>
              <TouchableOpacity onPress={() => setLanguage(language === 'English' ? 'Spanish' : 'English')}>
                <Text style={[styles.settingText, { color: theme.primary }]}>{language}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.settingsTitle, { color: theme.text }]}>Feedback</Text>
            <TextInput
              style={[styles.feedbackInput, { backgroundColor: theme.secondary, color: theme.text }]}
              placeholder="Enter your feedback..."
              placeholderTextColor={theme.text}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.primary }]} onPress={submitFeedback}>
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
          </ScrollView>
        );
      case 'Characters':
        return (
          <FlatList
            data={characters}
            renderItem={CharacterItem}
            keyExtractor={item => item._id.toString()}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text }]}>No characters available.</Text>}
            key="characters-3"
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.secondary} />
      <View style={[styles.header, { backgroundColor: theme.secondary }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Disney+ | {currentProfile}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: theme.accent }]}>Logout</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.searchInput, { backgroundColor: theme.secondary, color: theme.text }]}
        placeholder="Search movies..."
        placeholderTextColor={theme.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {loading && !movies.length ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loading} />
      ) : error ? (
        <Text style={[styles.errorText, { color: theme.accent, textAlign: 'center', marginTop: 20 }]}>{error}</Text>
      ) : (
        renderContent()
      )}
      <TaskBar />
      <Modal visible={!!selectedMovie} animationType="slide" onRequestClose={() => setSelectedMovie(null)}>
        {selectedMovie && (
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${selectedMovie.backdrop_path}` }}
              style={styles.detailImage}
              resizeMode="cover"
            />
            <ScrollView style={styles.detailContent}>
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedMovie.title}</Text>
              <Text style={[styles.detailText, { color: theme.text }]}>
                Rating: {selectedMovie.vote_average}/10{' '}
                {userRating[selectedMovie.id] ? `(You: ${userRating[selectedMovie.id]}/10)` : ''}
              </Text>
              <Text style={[styles.overview, { color: theme.text }]}>{selectedMovie.overview}</Text>
              {isPlaying && (
                <View style={styles.progressBar}>
                  <View
                    style={{
                      width: `${watchProgress[selectedMovie.id] || 0}%`,
                      height: 5,
                      backgroundColor: theme.primary,
                    }}
                  />
                </View>
              )}
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.primary }]}
                onPress={() => startPlayback(selectedMovie)}
              >
                <Text style={styles.playButtonText}>{isPlaying ? 'Playing...' : 'Play Now'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: favorites.some(f => f.id === selectedMovie.id) ? theme.accent : theme.primary }]}
                onPress={() => toggleFavorite(selectedMovie)}
              >
                <Text style={styles.playButtonText}>
                  {favorites.some(f => f.id === selectedMovie.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: theme.primary }]}
                onPress={() => downloadMovie(selectedMovie)}
              >
                <Text style={styles.playButtonText}>Download</Text>
              </TouchableOpacity>
              <View style={styles.ratingContainer}>
                <Text style={[styles.detailText, { color: theme.text }]}>Rate this movie:</Text>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => rateMovie(selectedMovie.id, star * 2)}>
                    <Icon
                      name="star"
                      size={24}
                      color={userRating[selectedMovie.id] >= star * 2 ? '#FFD700' : '#666'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { borderColor: theme.text }]}
                onPress={() => {
                  setSelectedMovie(null);
                  setIsPlaying(false);
                }}
              >
                <Text style={[styles.closeButtonText, { color: theme.text }]}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
      <Modal
        visible={!!selectedCharacter}
        animationType="slide"
        onRequestClose={() => setSelectedCharacter(null)}
      >
        {selectedCharacter && <CharacterDetails />}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
    marginBottom: height * 0.02,
  },
  authTitle: {
    fontSize: width * 0.12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  authSubtitle: {
    fontSize: width * 0.045,
    fontWeight: '300',
    marginTop: height * 0.01,
  },
  authCard: {
    width: '90%',
    padding: width * 0.06,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  input: {
    width: '100%',
    padding: height * 0.02,
    marginBottom: height * 0.025,
    borderRadius: 12,
    fontSize: width * 0.04,
    borderWidth: 1,
    elevation: 2,
  },
  authButton: {
    padding: height * 0.02,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: height * 0.015,
    elevation: 3,
  },
  authButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  errorText: {
    marginBottom: height * 0.02,
    fontSize: width * 0.035,
    textAlign: 'center',
  },
  switchText: {
    fontSize: width * 0.035,
    textAlign: 'center',
    marginTop: height * 0.015,
  },
  forgotText: {
    fontSize: width * 0.035,
    textAlign: 'center',
    marginTop: height * 0.015,
  },
  themeToggle: {
    marginTop: height * 0.04,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: width * 0.04,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: '700',
  },
  logoutText: {
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  searchInput: {
    margin: width * 0.03,
    padding: height * 0.015,
    borderRadius: 25,
    fontSize: width * 0.04,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  homeFlatListContent: {
    paddingBottom: height * 0.15,
  },
  sectionContainer: {
    marginVertical: height * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: '700',
    marginLeft: width * 0.03,
    marginBottom: height * 0.015,
  },
  flatListContent: {
    paddingHorizontal: width * 0.03,
  },
  movieItem: {
    marginHorizontal: width * 0.015,
    width: width * 0.4,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  movieImage: {
    width: '100%',
    height: height * 0.25,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  movieTitle: {
    textAlign: 'center',
    marginVertical: height * 0.01,
    fontSize: width * 0.035,
    fontWeight: '500',
    paddingHorizontal: width * 0.01,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  taskBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.02,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  taskBarItem: {
    alignItems: 'center',
    flex: 1,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#0078D7',
  },
  taskBarText: {
    fontSize: width * 0.03,
    marginTop: height * 0.005,
    fontWeight: '500',
  },
  settingsContainer: {
    padding: width * 0.05,
  },
  settingsTitle: {
    fontSize: width * 0.05,
    fontWeight: '700',
    marginBottom: height * 0.02,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
    padding: width * 0.03,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingText: {
    fontSize: width * 0.04,
    fontWeight: '500',
  },
  feedbackInput: {
    padding: width * 0.03,
    borderRadius: 10,
    height: height * 0.15,
    textAlignVertical: 'top',
    marginBottom: height * 0.02,
    fontSize: width * 0.04,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButton: {
    padding: height * 0.02,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  detailImage: {
    width: '100%',
    height: height * 0.35,
  },
  detailContent: {
    padding: width * 0.05,
  },
  detailTitle: {
    fontSize: width * 0.06,
    fontWeight: '700',
    marginBottom: height * 0.015,
  },
  detailText: {
    fontSize: width * 0.04,
    marginBottom: height * 0.015,
    fontWeight: '400',
  },
  overview: {
    fontSize: width * 0.035,
    marginBottom: height * 0.03,
    lineHeight: width * 0.05,
  },
  progressBar: {
    height: 5,
    backgroundColor: '#666',
    marginBottom: height * 0.03,
    borderRadius: 2,
  },
  playButton: {
    padding: height * 0.02,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: height * 0.015,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  playButtonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  closeButton: {
    padding: height * 0.02,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: height * 0.02,
  },
  closeButtonText: {
    fontSize: width * 0.04,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.03,
  },
  characterItem: {
    margin: width * 0.015,
    width: width * 0.28,
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  characterImage: {
    width: '100%',
    height: height * 0.2,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  characterName: {
    textAlign: 'center',
    marginVertical: height * 0.01,
    fontSize: width * 0.035,
    fontWeight: '500',
  },
  charactersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: width * 0.03,
    marginBottom: height * 0.015,
  },
  viewAllButton: {
    padding: height * 0.015,
    borderRadius: 8,
    backgroundColor: '#0078D7',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewAllText: {
    color: '#fff',
    fontSize: width * 0.035,
    fontWeight: '500',
  },
  characterDetailsContainer: {
    flex: 1,
  },
  characterDetailsImage: {
    width: '100%',
    height: height * 0.35,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  characterDetailsContent: {
    padding: width * 0.05,
  },
  characterDetailsName: {
    fontSize: width * 0.06,
    fontWeight: '700',
    marginBottom: height * 0.015,
  },
  characterDetailsText: {
    fontSize: width * 0.04,
    marginBottom: height * 0.015,
    fontWeight: '400',
    lineHeight: width * 0.05,
  },
  emptyText: {
    fontSize: width * 0.04,
    textAlign: 'center',
    marginTop: height * 0.05,
    fontWeight: '400',
  },
});

export default App;