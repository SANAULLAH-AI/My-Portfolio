import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const WeatherApp = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('London');
  const [searchInput, setSearchInput] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.98));
  const [headerAnim] = useState(new Animated.Value(0));

  const API_KEY = '48c210d00d6b27b4fc091bbb8f3aff29';
  const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
  const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

  useEffect(() => {
    fetchWeatherData(city);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(headerAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
    ]).start();
  }, [city]);

  const fetchWeatherData = async (cityName) => {
    try {
      setLoading(true);
      const [weatherResponse, forecastResponse] = await Promise.all([
        axios.get(`${WEATHER_URL}?q=${cityName}&appid=${API_KEY}&units=metric`),
        axios.get(`${FORECAST_URL}?q=${cityName}&appid=${API_KEY}&units=metric`)
      ]);
      setWeatherData(weatherResponse.data);
      setForecastData(forecastResponse.data);
      setError(null);
    } catch (err) {
      setError('Weather data unavailable. Please try again.');
      setWeatherData(null);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchInput.trim().length >= 2) {
      setCity(searchInput.trim());
      setSearchInput('');
      scaleAnim.setValue(0.98);
      headerAnim.setValue(0);
    }
  };

  const getBackgroundGradient = () => {
    if (!weatherData) return ['#1E3A8A', '#3B82F6'];
    const condition = weatherData.weather[0].main.toLowerCase();
    const timeOfDay = new Date(weatherData.dt * 1000).getHours() < 18 ? 'day' : 'night';
    switch (condition) {
      case 'clear': return timeOfDay === 'day' ? ['#F59E0B', '#FCD34D'] : ['#1E3A8A', '#60A5FA'];
      case 'clouds': return timeOfDay === 'day' ? ['#9CA3AF', '#D1D5DB'] : ['#374151', '#6B7280'];
      case 'rain': return ['#1E40AF', '#3B82F6'];
      case 'snow': return ['#BFDBFE', '#EFF6FF'];
      case 'thunderstorm': return ['#4B5563', '#1F2937'];
      default: return ['#1E3A8A', '#3B82F6'];
    }
  };

  const getAirQuality = () => {
    // Simulated AQI with weather-based variation
    const baseAQI = Math.floor(Math.random() * 100);
    return weatherData.weather[0].main === 'Rain' ? baseAQI + 20 : baseAQI;
  };

  if (loading && !weatherData) {
    return (
      <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading Your Weather...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={getBackgroundGradient()} style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerContainer, { opacity: headerAnim }]}>
          <Text style={styles.appTitle}>Weather</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Icon name="magnify" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {error ? (
          <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
            <Icon name="cloud-alert" size={80} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchWeatherData(city)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : weatherData && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <View style={styles.currentWeather}>
              <Text style={styles.cityName}>{weatherData.name}, {weatherData.sys.country}</Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <LinearGradient 
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)']} 
                style={styles.weatherCard}
              >
                <Image
                  style={styles.weatherIcon}
                  source={{ uri: `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png` }}
                />
                <Text style={styles.temperature}>{Math.round(weatherData.main.temp)}°</Text>
                <Text style={styles.weatherDescription}>{weatherData.weather[0].description}</Text>
                <View style={styles.tempRange}>
                  <Text style={styles.tempRangeText}>High: {Math.round(weatherData.main.temp_max)}°</Text>
                  <Text style={styles.tempRangeText}>Low: {Math.round(weatherData.main.temp_min)}°</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Hourly Forecast */}
            {forecastData && (
              <LinearGradient 
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} 
                style={styles.hourlyCard}
              >
                <Text style={styles.sectionTitle}>Hourly Forecast</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {forecastData.list.slice(0, 10).map((item, index) => (
                    <View key={index} style={styles.hourlyItem}>
                      <Text style={styles.hourlyTime}>
                        {new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })}
                      </Text>
                      <Image
                        style={styles.hourlyIcon}
                        source={{ uri: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png` }}
                      />
                      <Text style={styles.hourlyTemp}>{Math.round(item.main.temp)}°</Text>
                    </View>
                  ))}
                </ScrollView>
              </LinearGradient>
            )}

            {/* Weather Details */}
            <LinearGradient 
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} 
              style={styles.detailsCard}
            >
              <Text style={styles.sectionTitle}>Weather Details</Text>
              <View style={styles.detailsGrid}>
                {[
                  { icon: 'thermometer', value: `${Math.round(weatherData.main.feels_like)}°`, label: 'Feels Like' },
                  { icon: 'water-percent', value: `${weatherData.main.humidity}%`, label: 'Humidity' },
                  { icon: 'weather-windy', value: `${weatherData.wind.speed} m/s`, label: 'Wind Speed' },
                  { icon: 'gauge', value: `${weatherData.main.pressure} hPa`, label: 'Pressure' },
                  { icon: 'eye', value: `${weatherData.visibility / 1000} km`, label: 'Visibility' },
                  { icon: 'cloud', value: `${weatherData.clouds.all}%`, label: 'Cloud Cover' },
                ].map((item, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Icon name={item.icon} size={24} color="#fff" />
                    <Text style={styles.detailValue}>{item.value}</Text>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Sunrise/Sunset */}
            <LinearGradient 
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} 
              style={styles.sunCard}
            >
              <Text style={styles.sectionTitle}>Sun Times</Text>
              <View style={styles.sunContainer}>
                <View style={styles.sunItem}>
                  <Icon name="weather-sunset-up" size={32} color="#FCD34D" />
                  <Text style={styles.sunLabel}>Sunrise</Text>
                  <Text style={styles.sunValue}>
                    {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.sunItem}>
                  <Icon name="weather-sunset-down" size={32} color="#F97316" />
                  <Text style={styles.sunLabel}>Sunset</Text>
                  <Text style={styles.sunValue}>
                    {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Air Quality */}
            <LinearGradient 
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']} 
              style={styles.airQualityCard}
            >
              <Text style={styles.sectionTitle}>Air Quality Index</Text>
              <View style={styles.airQualityContent}>
                <Icon name="air-filter" size={32} color="#fff" />
                <View style={styles.airQualityDetails}>
                  <Text style={styles.airQualityValue}>{getAirQuality()}</Text>
                  <Text style={styles.airQualityLabel}>AQI (Simulated)</Text>
                  <Text style={styles.airQualityStatus}>
                    {getAirQuality() < 50 ? 'Good' : getAirQuality() < 100 ? 'Moderate' : 'Unhealthy'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingHorizontal: 20,
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
    fontWeight: '600',
    marginTop: 15,
    letterSpacing: 0.5,
  },
  headerContainer: {
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    paddingHorizontal: 15,
    paddingVertical: 5,
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
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  searchButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cityName: {
    fontSize: 38,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '500',
    marginTop: 5,
    letterSpacing: 0.5,
  },
  weatherCard: {
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 30,
    padding: 25,
    width: width * 0.9,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  weatherIcon: {
    width: 180,
    height: 180,
  },
  temperature: {
    fontSize: 80,
    fontWeight: '200',
    color: '#fff',
    marginVertical: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  weatherDescription: {
    fontSize: 24,
    color: '#fff',
    textTransform: 'capitalize',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 15,
  },
  tempRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
  },
  tempRangeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    opacity: 0.9,
  },
  hourlyCard: {
    borderRadius: 30,
    padding: 20,
    marginBottom: 40,
    width: width * 0.9,
    alignSelf: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  hourlyTime: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  hourlyIcon: {
    width: 50,
    height: 50,
    marginVertical: 8,
  },
  hourlyTemp: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  detailsCard: {
    borderRadius: 30,
    padding: 25,
    marginBottom: 40,
    width: width * 0.9,
    alignSelf: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
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
  },
  detailValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginTop: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
  },
  sunCard: {
    borderRadius: 30,
    padding: 25,
    marginBottom: 40,
    width: width * 0.9,
    alignSelf: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  sunContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sunItem: {
    alignItems: 'center',
    width: '48%',
  },
  sunLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginVertical: 10,
  },
  sunValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  airQualityCard: {
    borderRadius: 30,
    padding: 25,
    width: width * 0.9,
    alignSelf: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  airQualityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  airQualityDetails: {
    marginLeft: 20,
  },
  airQualityValue: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
  },
  airQualityLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  airQualityStatus: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginTop: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  retryButton: {
    marginTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  retryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default WeatherApp;