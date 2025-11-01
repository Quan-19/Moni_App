import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import MainTabs from "./navigation/MainTabs";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import AdminScreen from "./screens/AdminScreen"; 

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="AdminScreen" component={AdminScreen} />
        <Stack.Screen name="ProductDetailScreen" component={ProductDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
