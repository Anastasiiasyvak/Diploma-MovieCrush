import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/Welcome/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import CheckEmailScreen from '../screens/Auth/CheckEmailScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import RecommendationsScreen from '../screens/Recommendations/RecommendationsScreen';
import ChallengesScreen from '../screens/Challenges/ChallengesScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        {/* Auth flow */}
        <Stack.Screen name="Welcome"        component={WelcomeScreen} />
        <Stack.Screen name="Register"       component={RegisterScreen} />
        <Stack.Screen name="Login"          component={LoginScreen} />
        <Stack.Screen name="CheckEmail"     component={CheckEmailScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Main screens */}
        <Stack.Screen name="Home"           component={HomeScreen} />
        <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
        <Stack.Screen name="Challenges"     component={ChallengesScreen} />
        <Stack.Screen name="Profile"        component={ProfileScreen} />
        <Stack.Screen name="Settings"       component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}