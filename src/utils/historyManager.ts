import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PlantIdentification {
  id: string;
  imageUri: string;
  plantName: string;
  confidence: number;
  date: string;
  results: any;
}

export const HISTORY_STORAGE_KEY = "plantHistory";

export const addToHistory = async (
  identification: Omit<PlantIdentification, "id">
) => {
  try {
    const historyData = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    const history: PlantIdentification[] = historyData
      ? JSON.parse(historyData)
      : [];

    const newIdentification: PlantIdentification = {
      ...identification,
      id: Date.now().toString(),
    };

    history.unshift(newIdentification);
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error("Error adding to history:", error);
    return false;
  }
};

export const getHistory = async (): Promise<PlantIdentification[]> => {
  try {
    const historyData = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    return historyData ? JSON.parse(historyData) : [];
  } catch (error) {
    console.error("Error getting history:", error);
    return [];
  }
};

export const clearHistory = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing history:", error);
    return false;
  }
};
