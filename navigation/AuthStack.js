import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";

// Screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignUpScreen";
import LogoutScreen from "../screens/LogoutScreen";
import HomeScreen from "../screens/HomeScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import AddIncomeScreen from "../screens/AddIncomeScreen";
import EditExpenseScreen from "../screens/EditExpenseScreen";
import BudgetScreen from "../screens/BudgetScreen";
import GoalsScreen from "../screens/GoalsScreen";

// NAVIGATORS
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const BudgetStack = createNativeStackNavigator();
const GoalsStack = createNativeStackNavigator();

// HOME STACK — KHÔNG CÓ Logout!!!
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="AddExpense" component={AddExpenseScreen} />
      <HomeStack.Screen name="AddIncome" component={AddIncomeScreen} />
      <HomeStack.Screen name="EditExpense" component={EditExpenseScreen} />
      <HomeStack.Screen name="Goals" component={GoalsScreen} />
    </HomeStack.Navigator>
  );
}

// BUDGET STACK
function BudgetStackScreen() {
  return (
    <BudgetStack.Navigator screenOptions={{ headerShown: false }}>
      <BudgetStack.Screen name="BudgetMain" component={BudgetScreen} />
    </BudgetStack.Navigator>
  );
}

// GOALS STACK
function GoalsStackScreen() {
  return (
    <GoalsStack.Navigator screenOptions={{ headerShown: false }}>
      <GoalsStack.Screen name="GoalsMain" component={GoalsScreen} />
    </GoalsStack.Navigator>
  );
}

// BOTTOM TABS
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "";

          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Budget") iconName = focused ? "wallet" : "wallet-outline";
          else if (route.name === "Goals") iconName = focused ? "trophy" : "trophy-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="Budget" component={BudgetStackScreen} />
      <Tab.Screen name="Goals" component={GoalsStackScreen} />
    </Tab.Navigator>
  );
}

// ROOT STACK — Chia auth / app đúng
export default function AppNavigator({ user }) {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="SignUp" component={SignupScreen} />
        </>
      ) : (
        <>
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
          <RootStack.Screen name="Logout" component={LogoutScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}
