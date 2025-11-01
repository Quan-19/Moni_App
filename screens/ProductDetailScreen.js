import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{product.price.toLocaleString()} đ</Text>
        <Text style={styles.brand}>Thương hiệu: {product.brand}</Text>
        <Text style={styles.category}>Danh mục: {product.category}</Text>
        <Text style={styles.desc}>{product.description}</Text>

        <TouchableOpacity style={styles.button}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Thêm vào giỏ hàng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fbff" },
  image: { width: "100%", height: 300, resizeMode: "contain" },
  content: { padding: 16 },
  name: { fontSize: 22, fontWeight: "bold", color: "#0077b6" },
  price: { fontSize: 20, color: "#0096c7", fontWeight: "bold", marginVertical: 6 },
  brand: { fontSize: 16, color: "#333" },
  category: { fontSize: 16, color: "#333", marginBottom: 10 },
  desc: { fontSize: 15, color: "#444", marginBottom: 20, lineHeight: 22 },
  button: {
    flexDirection: "row",
    backgroundColor: "#0077b6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
});
