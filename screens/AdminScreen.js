import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function AdminScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await signOut(auth);
    navigation.replace("Login");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>👑 Admin Dashboard</Text>
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: "#f87171",
          padding: 10,
          borderRadius: 10,
          marginTop: 20,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
