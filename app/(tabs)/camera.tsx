import { FontAwesome } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PLANT_ID_API_KEY } from "../../config/keys";
import { addToHistory } from "../../src/utils/historyManager";

export default function CameraScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const identifyPlant = async (imageUri: string, base64Data: string) => {
    // TODO: include user location to improve accuracy of plant identification
    try {
      const data = {
        images: [base64Data],
        classification_level: "species",
        similar_images: true,
      };

      const response = await fetch(
        "https://plant.id/api/v3/identification?details=common_names,url,description",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Key": PLANT_ID_API_KEY,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const responseData = await response.json();
      console.log("API Response:", JSON.stringify(responseData, null, 2));

      const firstSuggestion = responseData.result.classification.suggestions[0];
      const result = {
        suggestions: [
          {
            plant_name: firstSuggestion.name,
            probability: firstSuggestion.probability,
            plant_details: {
              description:
                firstSuggestion.details?.description?.value ||
                firstSuggestion.details?.description ||
                "No description available",
              scientific_name: firstSuggestion.name,
              common_names: firstSuggestion.details?.common_names || [],
              url: firstSuggestion.details?.url || "",
            },
          },
        ],
      };

      return result;
    } catch (error) {
      console.error("Plant identification error:", error);
      throw error;
    }
  };

  const saveToHistory = async (imageUri: string, results: any) => {
    try {
      if (!results?.suggestions?.[0]) {
        console.error("Invalid results structure:", results);
        return false;
      }

      const success = await addToHistory({
        imageUri,
        plantName: results.suggestions[0].plant_name,
        confidence: results.suggestions[0].probability,
        date: new Date().toISOString(),
        results,
      });

      return success;
    } catch (error) {
      console.error("Error saving to history:", error);
      return false;
    }
  };

  const takePicture = async () => {
    try {
      const photo = await cameraView.current?.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (!photo) {
        console.error("Failed to take photo");
        return;
      }

      setCapturedImage(photo.uri);
      setIsProcessing(true);

      if (!photo.base64) {
        throw new Error("No base64 data in photo");
      }

      const results = await identifyPlant(photo.uri, photo.base64);
      console.log("Processed results:", JSON.stringify(results, null, 2));

      await saveToHistory(photo.uri, results);

      router.push({
        pathname: "/result",
        params: {
          uri: photo.uri,
          results: JSON.stringify(results),
        },
      });
    } catch (error) {
      console.error("Error in takePicture:", error);
      Alert.alert(
        "Error",
        "Failed to process image. Please check your API key and try again."
      );
    } finally {
      setIsProcessing(false);
      setCapturedImage(null);
    }
  };

  const cameraView = useRef(null);

  return (
    <View style={styles.container}>
      {isFocused && (
        <>
          {!capturedImage ? (
            <CameraView ref={cameraView} style={styles.camera} facing="back">
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                  disabled={isProcessing}
                >
                  <FontAwesome name="camera" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </CameraView>
          ) : (
            <View style={styles.camera}>
              <Image
                source={{ uri: capturedImage }}
                style={StyleSheet.absoluteFill}
              />
              {isProcessing && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Processing Image...</Text>
                    <Text style={styles.loadingSubText}>
                      Analyzing plant characteristics{"\n"}
                      This may take a minute
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  loadingSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});
