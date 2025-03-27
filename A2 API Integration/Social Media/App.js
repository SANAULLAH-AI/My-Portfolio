import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userData, setUserData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostVideo, setNewPostVideo] = useState(null);
  const [profile, setProfile] = useState({
    bio: 'Welcome to my profile!',
    posts: [],
    followers: 0,
    following: 0,
    isFollowing: false,
    profilePicture: null,
  });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isCreatePostModalVisible, setIsCreatePostModalVisible] = useState(false);
  const [activeScreen, setActiveScreen] = useState('Feed');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [updatedBio, setUpdatedBio] = useState('');

  // Fetch Posts from API
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('https://jsonplaceholder.typicode.com/users');
      const formattedPosts = response.data.map((user) => ({
        id: user.id,
        user: user.name,
        username: user.username,
        content: `Hi, I'm ${user.name}! This is my post.`,
        type: 'text',
        likes: Math.floor(Math.random() * 100),
        comments: [],
        profilePicture: `https://i.pravatar.cc/150?u=${user.id}`,
      }));
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to fetch posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch User Data from API
  const fetchUserData = async (username) => {
    try {
      setIsLoading(true);
      const response = await axios.get('https://jsonplaceholder.typicode.com/users');
      const user = response.data.find((u) => u.username === username);
      if (user) {
        setUserData(user);
        setProfile((prevProfile) => ({
          ...prevProfile,
          bio: `Hi, I'm ${user.name}!`,
        }));
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to fetch user data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login and Signup
  const handleLogin = async () => {
    if (username && password) {
      await fetchUserData(username);
      setIsLoggedIn(true);
      setProfile((prevProfile) => ({
        ...prevProfile,
        username: username, // Set username as profile name
      }));
      setNotifications([{ id: 1, content: 'Welcome back!' }]);
    } else {
      Alert.alert('Error', 'Please enter username and password');
    }
  };

  const handleSignup = () => {
    if (username && password) {
      setIsLoggedIn(true);
      setProfile((prevProfile) => ({
        ...prevProfile,
        username: username, // Set username as profile name
        bio: `Hi, I'm ${username}!`,
      }));
      setNotifications([{ id: 1, content: 'Welcome to the app!' }]);
    } else {
      Alert.alert('Error', 'Please enter username and password');
    }
  };

  // Pick Image/Video for Post
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        if (result.assets[0].type === 'image') {
          setNewPostImage(result.assets[0].uri);
          setNewPostVideo(null);
        } else if (result.assets[0].type === 'video') {
          setNewPostVideo(result.assets[0].uri);
          setNewPostImage(null);
        }
      }
    } catch (error) {
      console.error('Error picking image/video:', error);
      Alert.alert('Error', 'Failed to pick image/video. Please try again.');
    }
  };

  // Pick Profile Photo
  const pickProfilePhoto = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfile((prevProfile) => ({
          ...prevProfile,
          profilePicture: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Error picking profile photo:', error);
      Alert.alert('Error', 'Failed to pick profile photo. Please try again.');
    }
  };

  // Create Post
  const handleCreatePost = () => {
    if (newPost || newPostImage || newPostVideo) {
      const post = {
        id: posts.length + 1,
        user: username,
        content: newPostImage || newPostVideo || newPost,
        type: newPostImage ? 'image' : newPostVideo ? 'video' : 'text',
        likes: 0,
        comments: [],
      };
      setPosts([post, ...posts]);
      setProfile((prevProfile) => ({
        ...prevProfile,
        posts: [post, ...prevProfile.posts],
      }));
      setNewPost('');
      setNewPostImage(null);
      setNewPostVideo(null);
      setIsCreatePostModalVisible(false);
    } else {
      Alert.alert('Error', 'Please enter some content for your post.');
    }
  };

  // Like Post
  const handleLikePost = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  // Send Message
  const handleSendMessage = () => {
    if (newMessage) {
      setMessages([...messages, { id: messages.length + 1, content: newMessage, user: 'You' }]);
      setNewMessage('');
    } else {
      Alert.alert('Error', 'Please enter a message.');
    }
  };

  // Follow/Unfollow User
  const handleFollow = () => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      followers: prevProfile.isFollowing ? prevProfile.followers - 1 : prevProfile.followers + 1,
      isFollowing: !prevProfile.isFollowing,
    }));
    setNotifications([
      ...notifications,
      {
        id: notifications.length + 1,
        content: profile.isFollowing ? 'You unfollowed the user.' : 'You followed the user!',
      },
    ]);
  };

  // Edit Profile
  const handleEditProfile = () => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      bio: updatedBio,
    }));
    setIsEditProfileModalVisible(false);
  };

  // Fetch Posts on Initial Load
  useEffect(() => {
    if (isLoggedIn) {
      fetchPosts();
    }
  }, [isLoggedIn]);

  // Render Login/Signup Screen
  if (!isLoggedIn) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Social Media App</Text>
        <TextInput
          style={styles.authInput}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.authInput}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.authButton} onPress={handleLogin}>
          <Text style={styles.authButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.authButton} onPress={handleSignup}>
          <Text style={styles.authButtonText}>Signup</Text>
        </TouchableOpacity>
      </View>
    );
  }

 // Inside the main App component's return statement
return (
  <View style={styles.container}>
    <StatusBar backgroundColor="#007BFF" barStyle="light-content" />
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Social Media App</Text>
    </View>
    <View style={styles.topNavBar}>
      {['Feed', 'Profile', 'Chat', 'Notifications'].map((screen) => (
        <TouchableOpacity
          key={screen}
          style={[styles.navItem, activeScreen === screen && styles.navItemActive]}
          onPress={() => setActiveScreen(screen)}
        >
          <Ionicons
            name={
              screen === 'Feed'
                ? 'home'
                : screen === 'Profile'
                ? 'person'
                : screen === 'Chat'
                ? 'chatbubbles'
                : 'notifications'
            }
            size={24}
            color={activeScreen === screen ? '#007BFF' : '#888'}
          />
          <Text style={[styles.navText, activeScreen === screen && styles.navTextActive]}>
            {screen}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    {isLoading && (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    )}
    {activeScreen === 'Feed' && (
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostItem
            item={item}
            onPress={() => setSelectedUser(item.userId)}
            onLike={handleLikePost}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPosts} />
        }
      />
    )}
    {activeScreen === 'Profile' && (
      <ProfileScreen
        profile={profile}
        handleFollow={handleFollow}
        setIsCreatePostModalVisible={setIsCreatePostModalVisible}
        setIsEditProfileModalVisible={setIsEditProfileModalVisible}
        pickProfilePhoto={pickProfilePhoto}
      />
    )}
    {activeScreen === 'Chat' && (
      <ChatScreen
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
      />
    )}
    {activeScreen === 'Notifications' && (
      <NotificationsScreen notifications={notifications} />
    )}
    <CreatePostModal
      isVisible={isCreatePostModalVisible}
      newPost={newPost}
      setNewPost={setNewPost}
      newPostImage={newPostImage}
      newPostVideo={newPostVideo}
      pickImage={pickImage}
      handleCreatePost={handleCreatePost}
      setIsCreatePostModalVisible={setIsCreatePostModalVisible}
    />
    <EditProfileModal
      isVisible={isEditProfileModalVisible}
      updatedBio={updatedBio}
      setUpdatedBio={setUpdatedBio}
      handleEditProfile={handleEditProfile}
      setIsEditProfileModalVisible={setIsEditProfileModalVisible}
    />

    {/* Conditionally render the Create Post button */}
    {(activeScreen === 'Feed' || activeScreen === 'Profile') && (
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={() => setIsCreatePostModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
        <Text style={styles.createPostButtonText}>Create Post</Text>
      </TouchableOpacity>
    )}
  </View>
);
};

// PostItem Component
const PostItem = React.memo(({ item, onPress, onLike }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.post}>
        <View style={styles.postHeader}>
          <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
          <View>
            <Text style={styles.postUser}>{item.user}</Text>
            <Text style={styles.postUsername}>@{item.username}</Text>
          </View>
        </View>
        {item.type === 'image' && <Image source={{ uri: item.content }} style={styles.postImage} />}
        {item.type === 'video' && (
          <Video source={{ uri: item.content }} style={styles.postVideo} useNativeControls resizeMode="cover" isLooping />
        )}
        {item.type === 'text' && <Text style={styles.postContent}>{item.content}</Text>}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.postAction} onPress={() => onLike(item.id)}>
            <Ionicons name="heart-outline" size={24} color="#FF4444" />
            <Text style={styles.postActionText}>{item.likes} Likes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postAction}>
            <Ionicons name="chatbubble-outline" size={24} color="#888" />
            <Text style={styles.postActionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postAction}>
            <Ionicons name="share-outline" size={24} color="#888" />
            <Text style={styles.postActionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ProfileScreen Component
const ProfileScreen = ({
  profile,
  handleFollow,
  setIsCreatePostModalVisible,
  setIsEditProfileModalVisible,
  pickProfilePhoto,
}) => {
  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickProfilePhoto}>
            {profile.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.profilePictureLarge} />
            ) : (
              <Ionicons name="person-circle" size={80} color="#007BFF" />
            )}
          </TouchableOpacity>
          <Text style={styles.profileUsername}>{profile.username}</Text>
          <Text style={styles.profileBio}>{profile.bio}</Text>
          <View style={styles.profileStats}>
            <Text style={styles.profileStat}>Followers: {profile.followers}</Text>
            <Text style={styles.profileStat}>Following: {profile.following}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.followButton,
              profile.isFollowing && styles.followButtonActive,
            ]}
            onPress={handleFollow}
          >
            <Text style={styles.followButtonText}>
              {profile.isFollowing ? 'Unfollow' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setIsEditProfileModalVisible(true)}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      }
      data={profile.posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <PostItem item={item} />}
    />
  );
};

// ChatScreen Component
const ChatScreen = ({ messages, newMessage, setNewMessage, handleSendMessage }) => {
  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.user === 'You' ? styles.messageRight : styles.messageLeft,
            ]}
          >
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
      />
      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.chatSendButton} onPress={handleSendMessage}>
          <Ionicons name="send" size={24} color="#007BFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// NotificationsScreen Component
const NotificationsScreen = ({ notifications }) => {
  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>{item.content}</Text>
        </View>
      )}
    />
  );
};

// CreatePostModal Component
const CreatePostModal = ({
  isVisible,
  newPost,
  setNewPost,
  newPostImage,
  newPostVideo,
  pickImage,
  handleCreatePost,
  setIsCreatePostModalVisible,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => setIsCreatePostModalVisible(false)}
    >
      <View style={styles.modalContainer}>
               <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create Post</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="What's on your mind?"
            value={newPost}
            onChangeText={setNewPost}
            multiline
          />
          <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
            <Text style={styles.modalButtonText}>Upload Image/Video</Text>
          </TouchableOpacity>
          {newPostImage && <Image source={{ uri: newPostImage }} style={styles.previewImage} />}
          {newPostVideo && (
            <Video
              source={{ uri: newPostVideo }}
              style={styles.previewVideo}
              useNativeControls
              resizeMode="cover"
              isLooping
            />
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalActionButtonCancel]}
              onPress={() => setIsCreatePostModalVisible(false)}
            >
              <Text style={styles.modalActionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalActionButtonPost]}
              onPress={handleCreatePost}
            >
              <Text style={styles.modalActionButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// EditProfileModal Component
const EditProfileModal = ({
  isVisible,
  updatedBio,
  setUpdatedBio,
  handleEditProfile,
  setIsEditProfileModalVisible,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => setIsEditProfileModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Update your bio..."
            value={updatedBio}
            onChangeText={setUpdatedBio}
            multiline
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalActionButtonCancel]}
              onPress={() => setIsEditProfileModalVisible(false)}
            >
              <Text style={styles.modalActionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalActionButtonPost]}
              onPress={handleEditProfile}
            >
              <Text style={styles.modalActionButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative', // Ensure the sticky button is positioned correctly
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  authInput: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  authButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    width: '100%',
    height: 60,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007BFF',
  },
  navText: {
    fontSize: 12,
    color: '#888',
  },
  navTextActive: {
    color: '#007BFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  post: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profilePictureLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  postUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postUsername: {
    fontSize: 14,
    color: '#888',
  },
  postContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postVideo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActionText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#888',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileUsername: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileBio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  profileStat: {
    fontSize: 16,
    color: '#333',
  },
  followButton: {
    width: '80%',
    height: 40,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  followButtonActive: {
    backgroundColor: '#ccc',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editProfileButton: {
    width: '80%',
    height: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#007BFF',
    marginTop: 10,
  },
  editProfileButtonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createPostButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  createPostButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  screenContainer: {
    flex: 1,
    padding: 15,
  },
  message: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  messageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
  },
  messageRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#007BFF',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    padding: 10,
  },
  chatInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  chatSendButton: {
    marginLeft: 10,
  },
  notification: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  previewVideo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActionButton: {
    width: '48%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  modalActionButtonCancel: {
    backgroundColor: '#ccc',
  },
  modalActionButtonPost: {
    backgroundColor: '#007BFF',
  },
  modalActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
