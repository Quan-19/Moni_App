import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // ✅ Tạo user trên Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // ✅ Cập nhật profile Firebase Auth
      await updateProfile(user, { displayName: username });

      // ✅ Lưu thông tin user vào Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        email,
        role: "user",
        createdAt: serverTimestamp(),
      });

      
      navigation.navigate("MainTabs");
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar style="light" />

      {/* Background */}
      <Image
        style={{ position: "absolute", height: "100%", width: "100%" }}
        source={require("../assets/background.png")}
      />

      {/* Ánh sáng nền */}
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
          Sign Up
        </Animated.Text>
      </View>

      {/* Form */}
      <View style={{ marginTop: 130, paddingHorizontal: 20 }}>
        {/* Username */}
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
            name="person"
            size={20}
            color="gray"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Username"
            placeholderTextColor="gray"
            value={username}
            onChangeText={setUsername}
            style={{ flex: 1 }}
          />
        </Animated.View>

        {/* Email */}
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
            name="mail"
            size={20}
            color="gray"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="gray"
            value={email}
            onChangeText={setEmail}
            style={{ flex: 1 }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Animated.View>

        {/* Password */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(1000).springify()}
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
            value={password}
            onChangeText={setPassword}
            style={{ flex: 1 }}
          />
        </Animated.View>

        {/* Button */}
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          style={{
            backgroundColor: "#38bdf8",
            padding: 15,
            borderRadius: 15,
            marginTop: 10,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={{
                textAlign: "center",
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              Sign Up
            </Text>
          )}
        </TouchableOpacity>

        {/* Login link */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <Text>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={{ color: "#0284c7" }}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
