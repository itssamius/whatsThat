import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PlantIdentification {
  id: string;
  imageUri: string;
  plantName: string;
  confidence: number;
  date: string;
  results: any;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<PlantIdentification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadHistory = async () => {
    try {
      console.log("Loading history...");
      const historyData = await AsyncStorage.getItem("plantHistory");

      if (historyData) {
        console.log("Raw history data:", historyData);
        const parsedHistory = JSON.parse(historyData);
        console.log("Parsed history:", parsedHistory);

        const validHistory = parsedHistory.filter(
          (item: PlantIdentification) => item.imageUri
        );

        validHistory.sort(
          (a: PlantIdentification, b: PlantIdentification) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setHistory(validHistory);
      } else {
        console.log("No history data found");
        setHistory([]);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      Alert.alert("Error", "Failed to load history");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const renderItem = ({ item }: { item: PlantIdentification }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() =>
        router.push({
          pathname: "/result",
          params: {
            uri: item.imageUri,
            results: JSON.stringify(item.results),
          },
        })
      }
    >
      <Image
        source={{ uri: item.imageUri }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.plantName}>{item.plantName}</Text>
        <Text style={styles.confidence}>
          Confidence: {(item.confidence * 100).toFixed(1)}%
        </Text>
        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No plant identifications yet</Text>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => router.push("/camera")}
          >
            <Text style={styles.cameraButtonText}>Take a Picture</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  list: {
    padding: 16,
  },
  historyItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  itemInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  plantName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  confidence: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  cameraButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cameraButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
