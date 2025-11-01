import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser; 

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login"); 
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        👤 Profile Screen
      </Text>

      {user && (
        <Text style={{ fontSize: 16, color: "gray", marginBottom: 30 }}>
          Hello: {user.email}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: "#f87171",
          paddingVertical: 12,
          paddingHorizontal: 30,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}
