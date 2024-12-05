import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ResultScreen() {
  const { uri, results } = useLocalSearchParams();
  const plantResults = results ? JSON.parse(results as string) : null;
  console.log("Plant Results:", plantResults);

  const suggestion = plantResults?.suggestions?.[0];
  const details = suggestion?.plant_details;

  // Helper function to handle description which might be an object
  const getDescription = (desc: any) => {
    if (!desc) return "No description available";
    if (typeof desc === "string") return desc;
    if (desc.value) return desc.value;
    if (desc.language && desc.entity_id)
      return "Description not available in English";
    return "No description available";
  };

  return (
    <ScrollView style={styles.container}>
      {uri && (
        <Image
          source={{ uri: uri as string }}
          style={styles.image}
          contentFit="cover"
        />
      )}

      {suggestion && (
        <View style={styles.content}>
          <Text style={styles.plantName}>{suggestion.plant_name}</Text>

          <Text style={styles.confidence}>
            Confidence: {(suggestion.probability * 100).toFixed(1)}%
          </Text>

          {details?.scientific_name && (
            <Text style={styles.scientificName}>
              Scientific Name: {details.scientific_name}
            </Text>
          )}

          {Array.isArray(details?.common_names) &&
            details.common_names.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Common Names:</Text>
                <Text style={styles.text}>
                  {details.common_names.join(", ")}
                </Text>
              </View>
            )}

          {details?.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description:</Text>
              <Text style={styles.text}>
                {getDescription(details.description)}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 300,
  },
  content: {
    padding: 20,
  },
  plantName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#666",
    marginBottom: 16,
  },
  confidence: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
});
