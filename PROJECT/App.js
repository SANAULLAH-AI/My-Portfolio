import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

import { ThemeProvider } from './src/context/ThemeContext';
import { ExpenseProvider } from './src/context/ExpenseContext';

// Screens
import Dashboard from './src/screens/Dashboard';
import Transactions from './src/screens/Transactions';
import Categories from './src/screens/Categories';
import Budgets from './src/screens/Budgets';
import Settings from './src/screens/Settings';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <ThemeProvider>
      <ExpenseProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                let iconName;

                switch (route.name) {
                  case 'Dashboard':
                    iconName = 'home';
                    break;
                  case 'Transactions':
                    iconName = 'bar-chart-2';
                    break;
                  case 'Categories':
                    iconName = 'pie-chart';
                    break;
                  case 'Budgets':
                    iconName = 'calendar';
                    break;
                  case 'Settings':
                    iconName = 'settings';
                    break;
                  default:
                    iconName = 'circle';
                }

                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#3B82F6',
              tabBarInactiveTintColor: 'gray',
              headerShown: false,
            })}
          >
            <Tab.Screen name="Dashboard" component={Dashboard} />
            <Tab.Screen name="Transactions" component={Transactions} />
            <Tab.Screen name="Categories" component={Categories} />
            <Tab.Screen name="Budgets" component={Budgets} />
            <Tab.Screen name="Settings" component={Settings} />
          </Tab.Navigator>
        </NavigationContainer>
      </ExpenseProvider>
    </ThemeProvider>
  );
};

export default App;
