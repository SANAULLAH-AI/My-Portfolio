import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Required for web authentication
WebBrowser.maybeCompleteAuthSession();

// Navigation Setup
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Theme Context
const ThemeContext = React.createContext();
const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false); // Light theme default
  const theme = isDark ? darkTheme : lightTheme;
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
};
const useTheme = () => React.useContext(ThemeContext);

// Storage Utilities
const storeData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error storing ${key}:`, e);
  }
};

const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error(`Error retrieving ${key}:`, e);
    return null;
  }
};

// API Service
const fetchJobs = async () => {
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
    const categories = ['Technology', 'Design', 'Marketing', 'Finance', 'Sales', 'Management', 'Executive'];
    return response.data.map(post => ({
      id: post.id.toString(),
      title: post.title,
      company: `Corp ${post.userId}`,
      description: post.body,
      location: ['New York', 'London', 'Remote', 'Tokyo', 'Chicago'][Math.floor(Math.random() * 5)],
      salary: Math.floor(Math.random() * 100 + 80), // 80k-180k
      category: categories[Math.floor(Math.random() * categories.length)],
      posted: new Date().toLocaleDateString(),
      requirements: ['5+ years experience', 'Relevant degree', 'Strong skills'],
      status: ['Open', 'Closed', 'Pending'][Math.floor(Math.random() * 3)],
    }));
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
};

// Welcome Screen
const WelcomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <View style={styles.welcomeContainer}>
        <Image source={{ uri: 'https://via.placeholder.com/120' }} style={styles.welcomeLogo} />
        <Text style={[styles.title, { color: theme.text }]}>JobSeeker Pro</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>Your Career Advancement Tool</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={() => navigation.navigate('Onboarding')}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Onboarding Screen
const OnboardingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const handleStart = async () => {
    await storeData('onboardingCompleted', true);
    navigation.replace('Login');
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.onboardingScroll}>
        <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.onboardingImage} />
        <Text style={[styles.title, { color: theme.text }]}>Welcome to JobSeeker Pro</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>Streamline Your Career Journey</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={handleStart}>
          <Text style={styles.buttonText}>Begin</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Login Screen with Google Login (Removed iOS Client ID)
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { theme } = useTheme();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '347554983791-p6up5l1q5n9va78mr8nimf70fop6grrn.apps.googleusercontent.com', // Android Client ID
    webClientId: '347554983791-f1rg4b0i0vhp3naaoelmlcps63vvp9jj.apps.googleusercontent.com', // Web Client ID
    redirectUri: Platform.select({
      web: 'https://auth.expo.io/@Sanaullah7964/jobseeker-pro', // Replace with your Expo username
      android: 'yourapp://auth', // Custom scheme for Android
      ios: undefined, // No iOS-specific redirect URI since no iOS Client ID
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication);
    }
  }, [response]);

  const handleGoogleLogin = async (authentication) => {
    const user = {
      email: 'google_user@example.com', // Simulate email; fetch real email with Google API if needed
      name: 'Google User',
      bio: '',
      profilePhoto: null,
      resume: null,
      skills: [],
      experience: '',
      portfolio: [],
      applications: 0,
    };
    await storeData('user', user);
    navigation.replace('Main');
  };

  const handleLogin = async () => {
    if (email && password) {
      const user = {
        email,
        name: email.split('@')[0],
        bio: '',
        profilePhoto: null,
        resume: null,
        skills: [],
        experience: '',
        portfolio: [],
        applications: 0,
      };
      await storeData('user', user);
      navigation.replace('Main');
    } else {
      Alert.alert('Error', 'Please enter email and password');
    }
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.loginScroll}>
        <View style={styles.loginContainer}>
          <Text style={[styles.loginTitle, { color: theme.text }]}>JobSeeker Pro Sign In</Text>
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter your email"
              placeholderTextColor={theme.placeholder}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={handleLogin}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <View style={styles.authLinks}>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={[styles.link, { color: theme.link }]}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.link, { color: theme.link }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.text }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>
            <TouchableOpacity
              style={[styles.googleButton, { borderColor: theme.border }]}
              onPress={() => promptAsync()}
              disabled={!request || Platform.OS === 'ios'} // Disable Google login on iOS
            >
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={[styles.googleButtonText, { color: theme.text }]}>Sign in with Google</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && (
              <Text style={{ color: theme.text, textAlign: 'center', marginTop: 10 }}>
                Google Sign-In is not available on iOS. Use email/password instead.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { theme } = useTheme();

  const handleSignup = async () => {
    if (email && password) {
      const user = {
        email,
        name: email.split('@')[0],
        bio: '',
        profilePhoto: null,
        resume: null,
        skills: [],
        experience: '',
        portfolio: [],
        applications: 0,
      };
      await storeData('user', user);
      navigation.replace('Main');
    } else {
      Alert.alert('Error', 'Please enter email and password');
    }
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.authScroll}>
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Email"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Password"
          placeholderTextColor={theme.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.link, { color: theme.link }]}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const { theme } = useTheme();

  const handleReset = () => {
    if (email) {
      Alert.alert('Success', 'Password reset link sent (simulated)');
      setEmail('');
    } else {
      Alert.alert('Error', 'Please enter your email');
    }
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.authScroll}>
        <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Enter your email"
          placeholderTextColor={theme.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={handleReset}>
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.link, { color: theme.link }]}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Main App Screens
const HomeScreen = () => {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const storedUser = await getData('user');
      const jobData = await fetchJobs();
      setUser(storedUser);
      setJobs(jobData);
    };
    loadData();
  }, []);

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.homeScroll}>
        <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>Welcome, {user?.name || 'Professional'}</Text>
        <View style={styles.dashboard}>
          <View style={[styles.dashboardCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="paper-plane" size={40} color={theme.button} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{user?.applications || 0}</Text>
            <Text style={{ color: theme.text }}>Applications Sent</Text>
          </View>
          <View style={[styles.dashboardCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="briefcase" size={40} color={theme.button} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{jobs.filter(job => job.status === 'Open').length}</Text>
            <Text style={{ color: theme.text }}>Open Jobs</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const JobScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');
  const [sort, setSort] = useState('Date');
  const [selectedJob, setSelectedJob] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    const loadData = async () => {
      const jobsData = await fetchJobs();
      const saved = await getData('savedJobs') || [];
      setJobs(jobsData);
      setFilteredJobs(jobsData);
      setSavedJobs(saved);
    };
    loadData();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    filterJobs(text, category, location, sort);
  };

  const handleCategory = (cat) => {
    setCategory(cat);
    filterJobs(search, cat, location, sort);
  };

  const handleLocation = (loc) => {
    setLocation(loc);
    filterJobs(search, category, loc, sort);
  };

  const handleSort = (type) => {
    setSort(type);
    filterJobs(search, category, location, type);
  };

  const filterJobs = (text, cat, loc, sortType) => {
    let filtered = jobs.filter(
      job => job.title.toLowerCase().includes(text.toLowerCase()) || job.company.toLowerCase().includes(text.toLowerCase())
    );
    if (cat !== 'All') filtered = filtered.filter(job => job.category === cat);
    if (loc !== 'All') filtered = filtered.filter(job => job.location === loc);
    if (sortType === 'Salary') filtered.sort((a, b) => b.salary - a.salary);
    else if (sortType === 'Date') filtered.sort((a, b) => new Date(b.posted) - new Date(a.posted));
    setFilteredJobs(filtered);
  };

  const handleApply = (job) => {
    navigation.navigate('JobApplication', { job });
  };

  const handleQuickApply = async (job) => {
    const user = await getData('user');
    if (user?.resume) {
      user.applications += 1;
      await storeData('user', user);
      Alert.alert('Success', 'Quick Application Submitted');
    } else {
      Alert.alert('Error', 'Please upload a resume in Profile first');
    }
  };

  const toggleSaveJob = async (job) => {
    const isSaved = savedJobs.some(saved => saved.id === job.id);
    const updatedSavedJobs = isSaved ? savedJobs.filter(saved => saved.id !== job.id) : [...savedJobs, job];
    setSavedJobs(updatedSavedJobs);
    await storeData('savedJobs', updatedSavedJobs);
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        placeholder="Search Jobs..."
        placeholderTextColor={theme.placeholder}
        value={search}
        onChangeText={handleSearch}
      />
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {['All', 'Technology', 'Design', 'Marketing', 'Finance', 'Sales', 'Management', 'Executive'].map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryButton, { backgroundColor: category === cat ? theme.button : theme.card, borderColor: theme.border }]}
              onPress={() => handleCategory(cat)}
            >
              <Text style={[styles.categoryText, { color: category === cat ? '#fff' : theme.text }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {['All', 'New York', 'London', 'Remote', 'Tokyo', 'Chicago'].map(loc => (
            <TouchableOpacity
              key={loc}
              style={[styles.categoryButton, { backgroundColor: location === loc ? theme.button : theme.card, borderColor: theme.border }]}
              onPress={() => handleLocation(loc)}
            >
              <Text style={[styles.categoryText, { color: location === loc ? '#fff' : theme.text }]}>{loc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.sortContainer}>
          <Text style={{ color: theme.text, marginRight: 10 }}>Sort by:</Text>
          <TouchableOpacity style={[styles.sortButton, { backgroundColor: sort === 'Date' ? theme.button : theme.card }]} onPress={() => handleSort('Date')}>
            <Text style={[styles.categoryText, { color: sort === 'Date' ? '#fff' : theme.text }]}>Date</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortButton, { backgroundColor: sort === 'Salary' ? theme.button : theme.card }]} onPress={() => handleSort('Salary')}>
            <Text style={[styles.categoryText, { color: sort === 'Salary' ? '#fff' : theme.text }]}>Salary</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filteredJobs}
        renderItem={({ item }) => {
          const isSaved = savedJobs.some(saved => saved.id === item.id);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setSelectedJob(item)}
            >
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={{ color: theme.text }}>{item.company} - {item.location}</Text>
              <Text style={{ color: theme.button }}>{item.salary}k | {item.category}</Text>
              <Text style={[styles.cardDescription, { color: theme.text }]}>{item.description.slice(0, 80)}...</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => toggleSaveJob(item)}>
                  <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color={theme.button} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickApplyButton} onPress={() => handleQuickApply(item)}>
                  <Text style={styles.quickApplyText}>Quick Apply</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 130 }}
      />
      <Modal visible={!!selectedJob} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedJob && (
              <>
                <Text style={[styles.title, { color: theme.text }]}>{selectedJob.title}</Text>
                <Text style={{ color: theme.text }}>{selectedJob.company} - {selectedJob.location}</Text>
                <Text style={{ color: theme.button, marginVertical: 10 }}>{selectedJob.salary}k | {selectedJob.category}</Text>
                <Text style={[styles.cardDescription, { color: theme.text }]}>{selectedJob.description}</Text>
                <Text style={{ color: theme.text, marginTop: 10 }}>Requirements:</Text>
                {selectedJob.requirements.map((req, idx) => (
                  <Text key={idx} style={{ color: theme.text, marginLeft: 15 }}>• {req}</Text>
                ))}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={() => handleApply(selectedJob)}>
                    <Text style={styles.buttonText}>Apply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: theme.placeholder }]} onPress={() => setSelectedJob(null)}>
                    <Text style={styles.buttonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const JobApplicationScreen = ({ route, navigation }) => {
  const { job } = route.params;
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const { theme } = useTheme();

  const handleResumePick = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permission to access media library is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All });
      if (!result.canceled && result.assets) {
        setResume(result.assets[0].uri);
      }
    } else {
      Alert.alert('Info', 'File upload not supported on web yet.');
    }
  };

  const handleSubmit = async () => {
    if (resume && coverLetter) {
      const user = await getData('user');
      if (user) {
        user.applications += 1;
        await storeData('user', user);
      }
      Alert.alert('Success', 'Application Submitted');
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Please upload a resume and write a cover letter');
    }
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.applicationScroll}>
        <Text style={[styles.title, { color: theme.text }]}>{job.title}</Text>
        <Text style={{ color: theme.text }}>{job.company} - {job.location}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={handleResumePick}>
          <Text style={styles.buttonText}>{resume ? 'Resume Uploaded' : 'Upload Resume'}</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text, height: 120 }]}
          placeholder="Cover Letter"
          placeholderTextColor={theme.placeholder}
          value={coverLetter}
          onChangeText={setCoverLetter}
          multiline
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Application</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const SavedJobsScreen = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    const loadSavedJobs = async () => {
      const saved = await getData('savedJobs') || [];
      setSavedJobs(saved);
    };
    loadSavedJobs();
  }, []);

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, marginTop: 20 }]}>Saved Jobs</Text>
      <FlatList
        data={savedJobs}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={{ color: theme.text }}>{item.company} - {item.location}</Text>
            <Text style={{ color: theme.button }}>{item.salary}k | {item.category}</Text>
            <Text style={[styles.cardDescription, { color: theme.text }]}>{item.description.slice(0, 80)}...</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
};

const FeedbackScreen = () => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const { theme } = useTheme();

  const handleSubmit = () => {
    if (feedback && rating > 0) {
      Alert.alert('Success', 'Feedback Submitted');
      setFeedback('');
      setRating(0);
    } else {
      Alert.alert('Error', 'Please provide feedback and a rating');
    }
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.feedbackScroll}>
        <Text style={[styles.title, { color: theme.text }]}>Feedback</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text, height: 100 }]}
          placeholder="Your Feedback"
          placeholderTextColor={theme.placeholder}
          value={feedback}
          onChangeText={setFeedback}
          multiline
        />
        <Text style={{ color: theme.text, marginVertical: 10 }}>Rating (1-5):</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map(num => ( // Fixed typo: "bosses" replaced with 3
            <TouchableOpacity key={num} onPress={() => setRating(num)}>
              <Ionicons name={rating >= num ? 'star' : 'star-outline'} size={30} color={theme.button} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolio, setPortfolio] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getData('user');
      if (storedUser) {
        setUser(storedUser);
        setBio(storedUser.bio || '');
        setProfilePhoto(storedUser.profilePhoto || null);
        setResume(storedUser.resume || null);
        setSkills(storedUser.skills || []);
        setExperience(storedUser.experience || '');
        setPortfolio(storedUser.portfolio || []);
      }
    };
    loadUser();
  }, []);

  const handleImagePick = async (type) => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permission to access media library is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'resume' || type === 'portfolio' ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: type === 'profile',
        aspect: type === 'profile' ? [1, 1] : undefined,
      });
      if (!result.canceled && result.assets) {
        const uri = result.assets[0].uri;
        if (type === 'profile') setProfilePhoto(uri);
        else if (type === 'resume') setResume(uri);
        else if (type === 'portfolio') setPortfolio([...portfolio, uri]);
      }
    } else {
      Alert.alert('Info', 'File upload not supported on web yet.');
    }
  };

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill('');
    }
  };

  const removePortfolioItem = (uri) => {
    setPortfolio(portfolio.filter(item => item !== uri));
  };

  const handleSave = async () => {
    const updatedUser = { ...user, bio, profilePhoto, resume, skills, experience, portfolio };
    await storeData('user', updatedUser);
    setUser(updatedUser);
    Alert.alert('Success', 'Profile Saved');
  };

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.profileScroll}>
        <Image source={{ uri: profilePhoto || 'https://via.placeholder.com/100' }} style={[styles.profilePhoto, { borderColor: theme.border }]} />
        <Text style={[styles.title, { color: theme.text }]}>{user?.name || 'Professional'}</Text>
        <Text style={{ color: theme.text }}>{user?.email || 'No email'}</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          placeholder="Professional Bio"
          placeholderTextColor={theme.placeholder}
          value={bio}
          onChangeText={setBio}
        />
        <TextInput
          style={[styles.input, { borderColor: theme.border, color: theme.text, height: 100 }]}
          placeholder="Work Experience"
          placeholderTextColor={theme.placeholder}
          value={experience}
          onChangeText={setExperience}
          multiline
        />
        <View style={styles.skillSection}>
          <Text style={{ color: theme.text, marginBottom: 10 }}>Skills</Text>
          <View style={styles.skillInputRow}>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, flex: 1 }]}
              placeholder="Add Skill"
              placeholderTextColor={theme.placeholder}
              value={newSkill}
              onChangeText={setNewSkill}
            />
            <TouchableOpacity style={[styles.smallButton, { backgroundColor: theme.button }]} onPress={addSkill}>
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillList}>
            {skills.map(skill => (
              <Text key={skill} style={[styles.skillTag, { backgroundColor: theme.card, color: theme.text }]}>{skill}</Text>
            ))}
          </View>
        </View>
        <View style={styles.portfolioSection}>
          <Text style={{ color: theme.text, marginBottom: 10 }}>Portfolio</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={() => handleImagePick('portfolio')}>
            <Text style={styles.buttonText}>Add Item</Text>
          </TouchableOpacity>
          <FlatList
            horizontal
            data={portfolio}
            renderItem={({ item }) => (
              <View style={styles.portfolioItem}>
                <Image source={{ uri: item }} style={styles.portfolioImage} />
                <TouchableOpacity style={styles.removePortfolio} onPress={() => removePortfolioItem(item)}>
                  <Ionicons name="trash" size={20} color={theme.button} />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
        <View style={styles.analyticsSection}>
          <Text style={{ color: theme.text, marginBottom: 10 }}>Analytics</Text>
          <View style={[styles.dashboardCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="paper-plane" size={40} color={theme.button} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{user?.applications || 0}</Text>
            <Text style={{ color: theme.text }}>Applications Sent</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={() => handleImagePick('profile')}>
          <Text style={styles.buttonText}>Update Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={() => handleImagePick('resume')}>
          <Text style={styles.buttonText}>{resume ? 'Resume Uploaded' : 'Upload Resume'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const SettingsScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [frequency, setFrequency] = useState('Daily');

  return (
    <View style={[styles.fullScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.settingsScroll}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={{ color: theme.text }}>Dark Mode</Text>
          <Switch value={theme === darkTheme} onValueChange={toggleTheme} trackColor={{ true: theme.button }} thumbColor="#fff" />
        </View>
        <View style={styles.settingRow}>
          <Text style={{ color: theme.text }}>Job Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: theme.button }} thumbColor="#fff" />
        </View>
        <Text style={{ color: theme.text, marginTop: 20 }}>Notification Frequency</Text>
        <View style={styles.sortContainer}>
          {['Daily', 'Weekly', 'Monthly'].map(freq => (
            <TouchableOpacity
              key={freq}
              style={[styles.sortButton, { backgroundColor: frequency === freq ? theme.button : theme.card }]}
              onPress={() => setFrequency(freq)}
            >
              <Text style={[styles.categoryText, { color: frequency === freq ? '#fff' : theme.text }]}>{freq}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Tab Navigator
const MainTabs = () => {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border, paddingVertical: 5 },
        tabBarLabelStyle: { color: theme.text, fontSize: 12 },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Jobs') iconName = 'briefcase';
          else if (route.name === 'Saved') iconName = 'bookmark';
          else if (route.name === 'Feedback') iconName = 'chatbox';
          else if (route.name === 'Profile') iconName = 'person';
          else if (route.name === 'Settings') iconName = 'settings';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.button,
        tabBarInactiveTintColor: theme.placeholder,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobScreen} />
      <Tab.Screen name="Saved" component={SavedJobsScreen} />
      <Tab.Screen name="Feedback" component={FeedbackScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Main App
export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const onboardingCompleted = await getData('onboardingCompleted');
      setInitialRoute(onboardingCompleted ? 'Login' : 'Welcome');
    };
    checkOnboarding();
  }, []);

  if (!initialRoute) return null;

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="JobApplication" component={JobApplicationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

// Themes
const lightTheme = {
  background: '#ffffff',
  text: '#333333',
  border: '#cccccc',
  card: '#f9f9f9',
  button: '#007bff',
  placeholder: '#888888',
  link: '#007bff',
};

const darkTheme = {
  background: '#1a1a1a',
  text: '#e0e0e0',
  border: '#444444',
  card: '#2a2a2a',
  button: '#007bff',
  placeholder: '#999999',
  link: '#66b3ff',
};

// Styles
const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  welcomeLogo: { width: 120, height: 120, marginBottom: 20 },
  onboardingScroll: { flexGrow: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  authScroll: { flexGrow: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  loginScroll: { flexGrow: 1, padding: 30 },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  homeScroll: { flexGrow: 1, padding: 20 },
  applicationScroll: { flexGrow: 1, padding: 20 },
  feedbackScroll: { flexGrow: 1, padding: 20, alignItems: 'center' },
  profileScroll: { flexGrow: 1, padding: 20 },
  settingsScroll: { flexGrow: 1, padding: 20 },
  onboardingImage: { width: 150, height: 150, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  loginTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  formContainer: { width: '100%', maxWidth: 400 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8, marginTop: 10 },
  input: {
    borderWidth: 1,
    padding: 14,
    marginVertical: 5,
    borderRadius: 8,
    fontSize: 16,
    width: '100%',
    backgroundColor: '#fff',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 10,
    width: '100%',
    backgroundColor: '#fff',
  },
  googleIcon: { width: 24, height: 24, marginRight: 10 },
  googleButtonText: { fontSize: 16, fontWeight: '600' },
  smallButton: { padding: 10, borderRadius: 8, alignItems: 'center', width: '20%' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  authLinks: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 15 },
  link: { fontSize: 14, color: '#007bff' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 10, fontSize: 14 },
  dashboard: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
  dashboardCard: { padding: 20, borderRadius: 8, alignItems: 'center', width: '45%', borderWidth: 1 },
  statNumber: { fontSize: 24, fontWeight: 'bold', marginVertical: 5 },
  filterContainer: { paddingVertical: 10 },
  categoryScroll: { marginVertical: 5, paddingHorizontal: 10 },
  categoryButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginHorizontal: 5, borderWidth: 1 },
  categoryText: { fontSize: 14, fontWeight: '600' },
  sortContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginTop: 5 },
  sortButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginHorizontal: 5, borderWidth: 1 },
  card: { padding: 15, marginVertical: 10, borderRadius: 8, borderWidth: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardDescription: { fontSize: 14, marginVertical: 5 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  quickApplyButton: { padding: 8, backgroundColor: '#e6f0ff', borderRadius: 5 },
  quickApplyText: { color: '#007bff', fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '90%', padding: 20, borderRadius: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  profilePhoto: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, alignSelf: 'center', marginBottom: 20 },
  skillSection: { width: '100%', marginVertical: 20 },
  portfolioSection: { width: '100%', marginVertical: 20 },
  analyticsSection: { width: '100%', marginVertical: 20 },
  skillInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  skillList: { flexDirection: 'row', flexWrap: 'wrap' },
  skillTag: { padding: 8, borderRadius: 20, margin: 5, borderWidth: 1 },
  portfolioItem: { position: 'relative', marginRight: 10 },
  portfolioImage: { width: 100, height: 100, borderRadius: 8, borderWidth: 1, borderColor: '#cccccc' },
  removePortfolio: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 10, padding: 5 },
  ratingRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20, width: '80%' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
});