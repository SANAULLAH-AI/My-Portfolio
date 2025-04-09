import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
  RefreshControl,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  AppState
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width, height } = Dimensions.get('window');

// Environment configuration (would be in a separate .env file in a real app)
const CONFIG = {
  API_KEY: '48c210d00d6b27b4fc091bbb8f3aff29',
  WEATHER_URL: 'https://api.openweathermap.org/data/2.5/weather',
  FORECAST_URL: 'https://api.openweathermap.org/data/2.5/forecast',
  AIR_QUALITY_URL: 'https://api.openweathermap.org/data/2.5/air_pollution',
  STORAGE_KEY: '@weather_app_data',
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
  DEFAULT_CITY: 'London'
};

// Reusable components
const WeatherCard = ({ children, style }) => (
  <LinearGradient 
    colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)']} 
    style={[styles.card, style]}
  >
    {children}
  </LinearGradient>
);

const ErrorView = ({ message, onRetry }) => (
  <Animated.View style={styles.errorContainer}>
    <Icon name="cloud-alert" size={80} color="#fff" />
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity style={styles.actionButton} onPress={onRetry}>
      <Text style={styles.actionButtonText}>Retry</Text>
    </TouchableOpacity>
  </Animated.View>
);

const LocationButton = ({ onPress, loading }) => (
  <TouchableOpacity style={styles.locationButton} onPress={onPress} disabled={loading}>
    {loading ? (
      <ActivityIndicator size="small" color="#fff" />
    ) : (
      <Icon name="crosshairs-gps" size={24} color="#fff" />
    )}
  </TouchableOpacity>
);

const WeatherApp = () => {
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
  });

  // State variables
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [city, setCity] = useState(CONFIG.DEFAULT_CITY);
  const [searchInput, setSearchInput] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unit, setUnit] = useState('metric'); // 'metric' or 'imperial'
  const [favorites, setFavorites] = useState([]);
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const refreshAnim = useRef(new Animated.Value(0)).current;
  const notificationAnim = useRef(new Animated.Value(0)).current;

  // Refs
  const scrollViewRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const searchInputRef = useRef(null);

  // Initialize the app
  useEffect(() => {
    const setupApp = async () => {
      // Check network status
      const netInfoState = await NetInfo.fetch();
      setIsConnected(netInfoState.isConnected);

      // Set up network status listener
      const unsubscribe = NetInfo.addEventListener((state) => {
        setIsConnected(state.isConnected);
      });

      // Load cached data while fetching new data
      try {
        const cachedData = await AsyncStorage.getItem(CONFIG.STORAGE_KEY);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          
          // Only use cache if it's recent enough
          const now = new Date().getTime();
          if (now - parsedData.timestamp < CONFIG.CACHE_DURATION) {
            setWeatherData(parsedData.weather);
            setForecastData(parsedData.forecast);
            setAirQualityData(parsedData.airQuality);
            setCity(parsedData.city);
            setLastUpdated(new Date(parsedData.timestamp));
            setUnit(parsedData.unit || 'metric');
            setFavorites(parsedData.favorites || []);
          }
        }
      } catch (err) {
        console.error('Error loading cached data:', err);
      }

      // Check location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      setIsLocationPermissionGranted(status === 'granted');
      
      if (status === 'granted') {
        try {
          setLocationLoading(true);
          const location = await Location.getCurrentPositionAsync({});
          await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude);
        } catch (err) {
          console.log('Error getting location:', err);
          fetchWeatherData(city);
        } finally {
          setLocationLoading(false);
        }
      } else {
        fetchWeatherData(city);
      }

      // Add app state change listener
      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        unsubscribe();
        subscription.remove();
      };
    };

    setupApp();
    animateContent();
  }, []);

  // App state change handler
  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground, refresh data if it's stale
      const now = new Date().getTime();
      if (lastUpdated && now - lastUpdated.getTime() > CONFIG.CACHE_DURATION) {
        refreshWeatherData();
      }
    }
    appStateRef.current = nextAppState;
  };

  // Animations
  const animateContent = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(headerAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
    ]).start();
  };

  const animateRefresh = () => {
    Animated.sequence([
      Animated.timing(refreshAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(refreshAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const animateNotification = () => {
    Animated.sequence([
      Animated.timing(notificationAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(notificationAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  // Data fetching functions
  const fetchWeatherData = useCallback(async (cityName) => {
    if (!isConnected) {
      setError('No internet connection available. Please check your network settings.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setRefreshing(true);
      
      const [weatherResponse, forecastResponse] = await Promise.all([
        axios.get(`${CONFIG.WEATHER_URL}?q=${cityName}&appid=${CONFIG.API_KEY}&units=${unit}`),
        axios.get(`${CONFIG.FORECAST_URL}?q=${cityName}&appid=${CONFIG.API_KEY}&units=${unit}`)
      ]);
      
      const weatherData = weatherResponse.data;
      
      // Fetch air quality using coordinates from weather data
      const airQualityResponse = await axios.get(
        `${CONFIG.AIR_QUALITY_URL}?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${CONFIG.API_KEY}`
      );
      
      setWeatherData(weatherData);
      setForecastData(forecastResponse.data);
      setAirQualityData(airQualityResponse.data);
      setError(null);
      setCity(cityName);
      
      const timestamp = new Date().getTime();
      setLastUpdated(new Date(timestamp));
      
      // Cache the data
      const cacheData = {
        weather: weatherData,
        forecast: forecastResponse.data,
        airQuality: airQualityResponse.data,
        city: cityName,
        timestamp,
        unit,
        favorites
      };
      
      await AsyncStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(cacheData));
      
      // Animate refresh indicator
      animateRefresh();
      
    } catch (err) {
      console.error('Error fetching weather data:', err);
      if (err.response && err.response.status === 404) {
        setError(`Location "${cityName}" not found. Please check the spelling and try again.`);
      } else {
        setError('Unable to fetch weather data. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isConnected, unit, favorites]);

  const fetchWeatherByCoords = async (lat, lon) => {
    if (!isConnected) {
      setError('No internet connection available. Please check your network settings.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [weatherResponse, forecastResponse, airQualityResponse] = await Promise.all([
        axios.get(`${CONFIG.WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${unit}`),
        axios.get(`${CONFIG.FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${unit}`),
        axios.get(`${CONFIG.AIR_QUALITY_URL}?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`)
      ]);
      
      setWeatherData(weatherResponse.data);
      setForecastData(forecastResponse.data);
      setAirQualityData(airQualityResponse.data);
      setError(null);
      setCity(weatherResponse.data.name);
      
      const timestamp = new Date().getTime();
      setLastUpdated(new Date(timestamp));
      
      // Cache the data
      const cacheData = {
        weather: weatherResponse.data,
        forecast: forecastResponse.data,
        airQuality: airQualityResponse.data,
        city: weatherResponse.data.name,
        timestamp,
        unit,
        favorites
      };
      
      await AsyncStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(cacheData));
      
    } catch (err) {
      console.error('Error fetching weather by coords:', err);
      setError('Unable to fetch weather data for your location. Please try again later.');
      
      // Fall back to default city
      fetchWeatherData(CONFIG.DEFAULT_CITY);
    } finally {
      setLoading(false);
    }
  };

  const refreshWeatherData = useCallback(() => {
    fetchWeatherData(city);
  }, [city, fetchWeatherData]);

  const handleSearch = () => {
    if (searchInput.trim().length >= 2) {
      fetchWeatherData(searchInput.trim());
      setSearchInput('');
      scaleAnim.setValue(0.98);
      headerAnim.setValue(0.8);
      animateContent();
      
      // Dismiss keyboard
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid city name (at least 2 characters).');
    }
  };

  const getCurrentLocation = async () => {
    if (!isLocationPermissionGranted) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setIsLocationPermissionGranted(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to get weather for your current location.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    try {
      setLocationLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      await fetchWeatherByCoords(location.coords.latitude, location.coords.longitude);
    } catch (err) {
      Alert.alert('Location Error', 'Unable to get your current location. Please try again later.');
    } finally {
      setLocationLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!weatherData) return;
    
    let updatedFavorites = [...favorites];
    const cityInfo = {
      name: weatherData.name,
      country: weatherData.sys.country,
      id: weatherData.id
    };
    
    const isFavorite = favorites.some(fav => fav.id === cityInfo.id);
    
    if (isFavorite) {
      updatedFavorites = favorites.filter(fav => fav.id !== cityInfo.id);
    } else {
      updatedFavorites.push(cityInfo);
    }
    
    setFavorites(updatedFavorites);
    
    // Update cached favorites
    try {
      const cachedData = await AsyncStorage.getItem(CONFIG.STORAGE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        await AsyncStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
          ...parsedData,
          favorites: updatedFavorites
        }));
      }
    } catch (err) {
      console.error('Error updating favorites in cache:', err);
    }
    
    // Notify user
    if (!isFavorite) {
      setNotificationCount(prev => prev + 1);
      animateNotification();
    }
  };

  const toggleUnits = async () => {
    const newUnit = unit === 'metric' ? 'imperial' : 'metric';
    setUnit(newUnit);
    
    // Refetch data with new unit
    fetchWeatherData(city);
    
    // Update unit preference in storage
    try {
      const cachedData = await AsyncStorage.getItem(CONFIG.STORAGE_KEY);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        await AsyncStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
          ...parsedData,
          unit: newUnit
        }));
      }
    } catch (err) {
      console.error('Error updating unit preference in cache:', err);
    }
  };

  // Helper functions
  const getBackgroundGradient = () => {
    if (!weatherData) return ['#1E3A8A', '#3B82F6'];
    
    const condition = weatherData.weather[0].main.toLowerCase();
    const timeOfDay = isDay() ? 'day' : 'night';
    
    switch (condition) {
      case 'clear': return timeOfDay === 'day' ? ['#F59E0B', '#FCD34D'] : ['#1E3A8A', '#60A5FA'];
      case 'clouds': return timeOfDay === 'day' ? ['#9CA3AF', '#D1D5DB'] : ['#374151', '#6B7280'];
      case 'rain': return ['#1E40AF', '#3B82F6'];
      case 'drizzle': return ['#60A5FA', '#93C5FD'];
      case 'snow': return ['#BFDBFE', '#EFF6FF'];
      case 'thunderstorm': return ['#4B5563', '#1F2937'];
      case 'mist':
      case 'fog':
      case 'haze': return ['#6B7280', '#9CA3AF'];
      default: return ['#1E3A8A', '#3B82F6'];
    }
  };

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  };

  const getTemperatureUnit = () => unit === 'metric' ? '°C' : '°F';
  
  const getSpeedUnit = () => unit === 'metric' ? 'm/s' : 'mph';
  
  const getAirQualityIndex = () => {
    if (!airQualityData) return { value: '--', label: 'Unknown' };
    
    const aqi = airQualityData.list[0].main.aqi;
    
    switch (aqi) {
      case 1: return { value: aqi, label: 'Good', color: '#10B981' };
      case 2: return { value: aqi, label: 'Fair', color: '#FBBF24' };
      case 3: return { value: aqi, label: 'Moderate', color: '#F59E0B' };
      case 4: return { value: aqi, label: 'Poor', color: '#EF4444' };
      case 5: return { value: aqi, label: 'Very Poor', color: '#B91C1C' };
      default: return { value: '--', label: 'Unknown', color: '#6B7280' };
    }
  };

  const isDay = () => {
    if (!weatherData) return true;
    
    const now = weatherData.dt * 1000;
    const sunrise = weatherData.sys.sunrise * 1000;
    const sunset = weatherData.sys.sunset * 1000;
    
    return now > sunrise && now < sunset;
  };

  const isFavorite = () => {
    if (!weatherData) return false;
    return favorites.some(fav => fav.id === weatherData.id);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const getWeatherAlerts = () => {
    if (!weatherData) return [];
    
    const alerts = [];
    
    // Extreme temperatures
    const temp = weatherData.main.temp;
    if ((unit === 'metric' && temp > 35) || (unit === 'imperial' && temp > 95)) {
      alerts.push({
        title: 'Extreme Heat Warning',
        message: 'High temperatures detected. Stay hydrated and avoid prolonged sun exposure.',
        icon: 'thermometer'
      });
    }
    
    if ((unit === 'metric' && temp < 0) || (unit === 'imperial' && temp < 32)) {
      alerts.push({
        title: 'Freezing Temperature Alert',
        message: 'Freezing conditions detected. Dress warmly and be cautious of ice.',
        icon: 'snowflake'
      });
    }
    
    // Strong winds
    const windSpeed = weatherData.wind.speed;
    if ((unit === 'metric' && windSpeed > 10) || (unit === 'imperial' && windSpeed > 22)) {
      alerts.push({
        title: 'Strong Wind Advisory',
        message: 'High winds detected. Secure loose items and exercise caution outdoors.',
        icon: 'weather-windy'
      });
    }
    
    // Poor air quality
    if (airQualityData && airQualityData.list[0].main.aqi >= 4) {
      alerts.push({
        title: 'Poor Air Quality Alert',
        message: 'Air quality is unhealthy. Consider limiting outdoor activities.',
        icon: 'air-filter'
      });
    }
    
    return alerts;
  };

  const getDailyForecast = () => {
    if (!forecastData) return [];
    
    const dailyData = {};
    
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date: item.dt,
          temp_min: item.main.temp_min,
          temp_max: item.main.temp_max,
          weather: item.weather[0]
        };
      } else {
        // Update min/max temperatures
        dailyData[date].temp_min = Math.min(dailyData[date].temp_min, item.main.temp_min);
        dailyData[date].temp_max = Math.max(dailyData[date].temp_max, item.main.temp_max);
        
        // Use daytime weather condition when available
        const itemHour = new Date(item.dt * 1000).getHours();
        if (itemHour >= 9 && itemHour <= 18) {
          dailyData[date].weather = item.weather[0];
        }
      }
    });
    
    return Object.values(dailyData).slice(0, 5);
  };

  // Loading state
  if (!fontsLoaded) {
    return (
      <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Weather Pro...</Text>
      </LinearGradient>
    );
  }

  // Main render
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          
          {/* Header */}
          <Animated.View style={[styles.headerContainer, { opacity: headerAnim }]}>
            <View style={styles.headerTop}>
              <Text style={styles.appTitle}>Weather Pro</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.unitToggle} onPress={toggleUnits}>
                  <Text style={styles.unitToggleText}>{unit === 'metric' ? '°C' : '°F'}</Text>
                </TouchableOpacity>
                
                <Animated.View style={[
                  styles.notificationBadge, 
                  { 
                    transform: [{ scale: notificationAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1]
                    }) }]
                  }
                ]}>
                  {notificationCount > 0 && (
                    <Text style={styles.notificationText}>{notificationCount}</Text>
                  )}
                </Animated.View>
              </View>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search location..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Icon name="magnify" size={26} color="#fff" />
              </TouchableOpacity>
              <LocationButton onPress={getCurrentLocation} loading={locationLoading} />
            </View>
            
            {lastUpdated && (
              <Animated.Text 
                style={[
                  styles.lastUpdated,
                  { opacity: refreshAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.6, 1, 0.6]
                  }) }
                ]}
              >
                Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Animated.Text>
            )}
          </Animated.View>
          
          {/* Main Content */}
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshWeatherData}
                tintColor="#fff"
                colors={['#fff']}
              />
            }
          >
            {error ? (
              <ErrorView message={error} onRetry={refreshWeatherData} />
            ) : weatherData && (
              <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                {/* Current Weather */}
                <View style={styles.currentWeather}>
                  <View style={styles.cityHeader}>
                    <Text style={styles.cityName}>
                      {weatherData.name}, {weatherData.sys.country}
                    </Text>
                    <TouchableOpacity onPress={toggleFavorite}>
                      <Icon 
                        name={isFavorite() ? 'heart' : 'heart-outline'} 
                        size={28} 
                        color={isFavorite() ? '#F87171' : '#fff'} 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.date}>{formatDate(weatherData.dt)}</Text>
                  
                  <WeatherCard style={styles.weatherCard}>
                    <Image
                      style={styles.weatherIcon}
                      source={{ uri: getWeatherIcon(weatherData.weather[0].icon) }}
                    />
                    <View style={styles.mainTemp}>
                      <Text style={styles.temperature}>
                        {Math.round(weatherData.main.temp)}
                        <Text style={styles.temperatureUnit}>{getTemperatureUnit()}</Text>
                      </Text>
                      <Text style={styles.weatherDescription}>
                        {weatherData.weather[0].description}
                      </Text>
                    </View>
                    <View style={styles.tempRange}>
                      <View style={styles.tempRangeItem}>
                        <Icon name="arrow-up" size={18} color="#fff" />
                        <Text style={styles.tempRangeText}>
                          {Math.round(weatherData.main.temp_max)}{getTemperatureUnit()}
                        </Text>
                      </View>
                      <View style={styles.tempRangeItem}>
                        <Icon name="arrow-down" size={18} color="#fff" />
                        <Text style={styles.tempRangeText}>
                          {Math.round(weatherData.main.temp_min)}{getTemperatureUnit()}
                        </Text>
                      </View>
                    </View>
                  </WeatherCard>
                </View>
                
                {/* Weather Alerts */}
                {getWeatherAlerts().length > 0 && (
                  <WeatherCard style={styles.alertsCard}>
                    <Text style={styles.sectionTitle}>Weather Alerts</Text>
                    {getWeatherAlerts().map((alert, index) => (
                      <View key={index} style={styles.alertItem}>
                        <Icon name={alert.icon} size={24} color="#F59E0B" />
                        <View style={styles.alertContent}>
                          <Text style={styles.alertTitle}>{alert.title}</Text>
                          <Text style={styles.alertMessage}>{alert.message}</Text>
                        </View>
                      </View>
                    ))}
                  </WeatherCard>
                )}
                
                {/* Hourly Forecast */}
                {forecastData && (
                  <WeatherCard style={styles.hourlyCard}>
                    <Text style={styles.sectionTitle}>Hourly Forecast</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {forecastData.list.slice(0, 12).map((item, index) => (
                        <View key={index} style={styles.hourlyItem}>
                          <Text style={styles.hourlyTime}>
                            {formatTime(item.dt).toLowerCase()}
                          </Text>
                          <Image
                            style={styles.hourlyIcon}
                            source={{ uri: getWeatherIcon(item.weather[0].icon) }}
                          />
                          <Text style={styles.hourlyTemp}>
                            {Math.round(item.main.temp)}{getTemperatureUnit()}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </WeatherCard>
                )}
                
                {/* Daily Forecast */}
                <WeatherCard style={styles.dailyCard}>
                  <Text style={styles.sectionTitle}>5-Day Forecast</Text>
                  {getDailyForecast().map((day, index) => (
                   <View key={index} style={styles.dailyItem}>
                      <Text style={styles.dailyDate}>
                        {new Date(day.date * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </Text>
                      <Image
                        style={styles.dailyIcon}
                        source={{ uri: getWeatherIcon(day.weather.icon) }}
                      />
                      <View style={styles.dailyTemps}>
                        <Text style={styles.dailyTempMax}>
                          {Math.round(day.temp_max)}{getTemperatureUnit()}
                        </Text>
                        <Text style={styles.dailyTempMin}>
                          {Math.round(day.temp_min)}{getTemperatureUnit()}
                        </Text>
                      </View>
                      <Text style={styles.dailyDescription}>
                        {day.weather.description}
                      </Text>
                    </View>
                  ))}
                </WeatherCard>
                
                {/* Weather Details */}
                <WeatherCard style={styles.detailsCard}>
                  <Text style={styles.sectionTitle}>Weather Details</Text>
                  <View style={styles.detailsGrid}>
                    {[
                      { 
                        icon: 'thermometer', 
                        value: `${Math.round(weatherData.main.feels_like)}${getTemperatureUnit()}`, 
                        label: 'Feels Like'
                      },
                      { 
                        icon: 'water-percent', 
                        value: `${weatherData.main.humidity}%`, 
                        label: 'Humidity'
                      },
                      { 
                        icon: 'weather-windy', 
                        value: `${weatherData.wind.speed} ${getSpeedUnit()}`, 
                        label: 'Wind Speed'
                      },
                      { 
                        icon: 'gauge', 
                        value: `${weatherData.main.pressure} hPa`, 
                        label: 'Pressure'
                      },
                      { 
                        icon: 'eye', 
                        value: `${(weatherData.visibility / 1000).toFixed(1)} km`, 
                        label: 'Visibility'
                      },
                      { 
                        icon: 'cloud', 
                        value: `${weatherData.clouds.all}%`, 
                        label: 'Cloud Cover'
                      },
                    ].map((item, index) => (
                      <View key={index} style={styles.detailItem}>
                        <Icon name={item.icon} size={24} color="#fff" />
                        <Text style={styles.detailValue}>{item.value}</Text>
                        <Text style={styles.detailLabel}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </WeatherCard>

                {/* Sunrise/Sunset */}
                <WeatherCard style={styles.sunCard}>
                  <Text style={styles.sectionTitle}>Sun & Moon</Text>
                  <View style={styles.sunContainer}>
                    <View style={styles.sunItem}>
                      <Icon name="weather-sunset-up" size={32} color="#FCD34D" />
                      <Text style={styles.sunLabel}>Sunrise</Text>
                      <Text style={styles.sunValue}>
                        {formatTime(weatherData.sys.sunrise)}
                      </Text>
                    </View>
                    <View style={styles.sunItem}>
                      <Icon name="weather-sunset-down" size={32} color="#F97316" />
                      <Text style={styles.sunLabel}>Sunset</Text>
                      <Text style={styles.sunValue}>
                        {formatTime(weatherData.sys.sunset)}
                      </Text>
                    </View>
                  </View>
                </WeatherCard>

                {/* Air Quality */}
                <WeatherCard style={styles.airQualityCard}>
                  <Text style={styles.sectionTitle}>Air Quality</Text>
                  <View style={styles.airQualityContent}>
                    <View style={[
                      styles.airQualityBadge,
                      { backgroundColor: getAirQualityIndex().color || 'rgba(255, 255, 255, 0.2)' }
                    ]}>
                      <Text style={styles.airQualityValue}>{getAirQualityIndex().value}</Text>
                    </View>
                    <View style={styles.airQualityDetails}>
                      <Text style={styles.airQualityStatus}>{getAirQualityIndex().label}</Text>
                      
                      {airQualityData && (
                        <View style={styles.pollutantContainer}>
                          {[
                            { name: 'PM2.5', value: airQualityData.list[0].components.pm2_5 },
                            { name: 'PM10', value: airQualityData.list[0].components.pm10 },
                            { name: 'NO₂', value: airQualityData.list[0].components.no2 },
                            { name: 'O₃', value: airQualityData.list[0].components.o3 }
                          ].map((pollutant, index) => (
                            <View key={index} style={styles.pollutantItem}>
                              <Text style={styles.pollutantName}>{pollutant.name}:</Text>
                              <Text style={styles.pollutantValue}>
                                {pollutant.value.toFixed(1)} μg/m³
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </WeatherCard>
                
                {/* Location Info */}
                <WeatherCard style={styles.locationCard}>
                  <Text style={styles.sectionTitle}>Location Info</Text>
                  <View style={styles.locationDetails}>
                    <View style={styles.locationDetail}>
                      <Icon name="map-marker" size={22} color="#fff" />
                      <Text style={styles.locationText}>
                        {weatherData.coord.lat.toFixed(2)}° N, {weatherData.coord.lon.toFixed(2)}° E
                      </Text>
                    </View>
                    <View style={styles.locationDetail}>
                      <Icon name="clock-time-eight-outline" size={22} color="#fff" />
                      <Text style={styles.locationText}>
                        Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.locationDetail}>
                      <Icon name="earth" size={22} color="#fff" />
                      <Text style={styles.locationText}>
                        Timezone: GMT {(weatherData.timezone / 3600) >= 0 ? '+' : ''}{weatherData.timezone / 3600}
                      </Text>
                    </View>
                  </View>
                </WeatherCard>

                {/* Saved Locations */}
                {favorites.length > 0 && (
                  <WeatherCard style={styles.favoritesCard}>
                    <Text style={styles.sectionTitle}>Saved Locations</Text>
                    {favorites.slice(0, 5).map((favorite, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.favoriteItem}
                        onPress={() => fetchWeatherData(favorite.name)}
                      >
                        <Text style={styles.favoriteName}>
                          {favorite.name}, {favorite.country}
                        </Text>
                        <Icon name="chevron-right" size={24} color="#fff" />
                      </TouchableOpacity>
                    ))}
                  </WeatherCard>
                )}
                
                {/* App Info */}
                <View style={styles.appInfo}>
                  <Text style={styles.appInfoText}>
                    Weather Pro v1.0.0
                  </Text>
                  <Text style={styles.appInfoText}>
                    Powered by OpenWeather API
                  </Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 15,
    letterSpacing: 0.5,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  unitToggleText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
    display: 'none', // Initially hidden
  },
  notificationText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    marginBottom: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Poppins_500Medium',
  },
  searchButton: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  locationButton: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginLeft: 8,
    marginRight: 4,
  },
  lastUpdated: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 10,
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 25,
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityName: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginRight: 10,
    textAlign: 'center',
  },
  date: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    fontFamily: 'Poppins_500Medium',
    marginTop: 3,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  card: {
    borderRadius: 25,
    padding: 20,
    marginBottom: 25,
    width: '100%',
    alignSelf: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  weatherCard: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 25,
  },
  weatherIcon: {
    width: 160,
    height: 160,
  },
  mainTemp: {
    alignItems: 'center',
  },
  temperature: {
    fontSize: 75,
    fontFamily: 'Poppins_200Regular',
    color: '#fff',
    marginVertical: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  temperatureUnit: {
    fontSize: 40,
    fontFamily: 'Poppins_200Regular',
  },
  weatherDescription: {
    fontSize: 22,
    color: '#fff',
    textTransform: 'capitalize',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: args = 15,
  },
  tempRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  tempRangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempRangeText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins_500Medium',
    marginLeft: 5,
  },
  alertsCard: {
    marginBottom: 25,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertContent: {
    marginLeft: 15,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    marginBottom: 5,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  hourlyCard: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 10,
    paddingVertical: 15,
    minWidth: 80,
  },
  hourlyTime: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Poppins_500Medium',
  },
  hourlyIcon: {
    width: 50,
    height: 50,
    marginVertical: 8,
  },
  hourlyTemp: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  dailyCard: {
    marginBottom: 25,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dailyDate: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#fff',
    width: '25%',
  },
  dailyIcon: {
    width: 40,
    height: 40,
  },
  dailyTemps: {
    flexDirection: 'row',
    width: '30%',
    justifyContent: 'flex-end',
  },
  dailyTempMax: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    marginRight: 8,
  },
  dailyTempMin: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  dailyDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    width: '30%',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  detailsCard: {
    marginBottom: 25,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  detailValue: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    marginTop: 5,
  },
  sunCard: {
    marginBottom: 25,
  },
  sunContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sunItem: {
    alignItems: 'center',
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  sunLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginVertical: 10,
  },
  sunValue: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  airQualityCard: {
    marginBottom: 25,
  },
  airQualityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  airQualityBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  airQualityValue: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  airQualityDetails: {
    marginLeft: 20,
    flex: 1,
  },
  airQualityStatus: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 5,
  },
  pollutantContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pollutantItem: {
    flexDirection: 'row',
    width: '50%',
    marginTop: 5,
  },
  pollutantName: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 5,
  },
  pollutantValue: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#fff',
  },
  locationCard: {
    marginBottom: 25,
  },
  locationDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
  },
  locationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#fff',
    marginLeft: 10,
  },
  favoritesCard: {
    marginBottom: 25,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  favoriteName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  errorText: {
    fontSize: 22,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  actionButton: {
    marginTop: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  }
});

export default WeatherApp;
