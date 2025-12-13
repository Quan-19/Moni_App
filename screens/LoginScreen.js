import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Email admin cố định (ví dụ)
  const adminEmail = "admin@gmail.com";

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ✅ KHÔNG navigation ở đây
      // RootNavigator sẽ tự chuyển sang AppStack
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar style="light" />
      <Image
        style={{ position: "absolute", height: "100%", width: "100%" }}
        source={require("../assets/background.png")}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          width: "100%",
          position: "absolute",
        }}
      >
        <Animated.Image
          entering={FadeInUp.delay(200).duration(1000).springify()}
          style={{ height: 225, width: 90 }}
          source={require("../assets/light.png")}
        />
        <Animated.Image
          entering={FadeInUp.delay(400).duration(1000).springify()}
          style={{ height: 160, width: 65 }}
          source={require("../assets/light.png")}
        />
      </View>

      {/* Title */}
      <View style={{ alignItems: "center", marginTop: 300 }}>
        <Animated.Text
          entering={FadeInUp.duration(1000).springify()}
          style={{ fontSize: 50, fontWeight: "bold", color: "white" }}
        >
          Welcome to Moni
        </Animated.Text>
      </View>

      {/* Form */}
      <View style={{ marginTop: 150, paddingHorizontal: 20 }}>
        {/* Email */}
        <Animated.View
          entering={FadeInDown.duration(1000).springify()}
          style={{
            backgroundColor: "rgba(0,0,0,0.05)",
            padding: 15,
            borderRadius: 15,
            marginBottom: 15,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="mail"
            size={20}
            color="gray"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="gray"
            style={{ flex: 1 }}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </Animated.View>

        {/* Password */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(1000).springify()}
          style={{
            backgroundColor: "rgba(0,0,0,0.05)",
            padding: 15,
            borderRadius: 15,
            marginBottom: 15,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="lock-closed"
            size={20}
            color="gray"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="gray"
            secureTextEntry
            style={{ flex: 1 }}
            value={password}
            onChangeText={setPassword}
          />
        </Animated.View>

        <TouchableOpacity
          style={{
            backgroundColor: "#38bdf8",
            padding: 15,
            borderRadius: 15,
            marginTop: 10,
          }}
          onPress={handleLogin}
        >
          <Text
            style={{
              textAlign: "center",
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            Login
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <Text>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={{ color: "#0284c7" }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
