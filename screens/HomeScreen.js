import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(list);
        setFiltered(list);
      } catch (error) {
        console.error("❌ Lỗi khi lấy sản phẩm:", error);
      }
    };

    fetchProducts();
  }, []);

  // 🔍 Lọc sản phẩm theo tên
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") setFiltered(products);
    else {
      const lower = text.toLowerCase();
      const result = products.filter((p) =>
        p.name.toLowerCase().includes(lower)
      );
      setFiltered(result);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetailScreen", { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>{item.price.toLocaleString()} đ</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ====== Thanh navbar ====== */}
      <View style={styles.navbar}>
        <Text style={styles.logo}>📱 SmartShop</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Cart")}>
          <Ionicons name="cart-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ====== Thanh tìm kiếm ====== */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#555" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchInput}
          placeholderTextColor="#777"
        />
      </View>

      {/* ====== Danh sách sản phẩm ====== */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0077b6",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    margin: 6,
    padding: 10,
    alignItems: "center",
    shadowColor: "#0077b6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderColor: "#0077b6",
    borderWidth: 1,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  infoContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    color: "#0077b6",
  },
  price: {
    color: "#0096c7",
    fontWeight: "bold",
    marginTop: 4,
    fontSize: 14,
  },
});
