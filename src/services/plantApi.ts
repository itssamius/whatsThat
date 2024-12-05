import { PLANT_ID_API_KEY } from "../../config/keys";

const API_URL = "https://plant.id/api/v3/identification";

export async function identifyPlant(imageUri: string): Promise<any> {
  try {
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Remove data:image/jpeg;base64, prefix
    const base64Data = (base64 as string).split(",")[1];

    const data = {
      images: [base64Data],
      classification_level: "species",
      similar_images: true,
    };

    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_API_KEY,
      },
      body: JSON.stringify(data),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`API Error: ${apiResponse.status} - ${errorText}`);
    }

    const result = await apiResponse.json();
    console.log("Raw API response:", JSON.stringify(result, null, 2));

    // Extract the first suggestion from the classification results
    const firstSuggestion = result.result.classification.suggestions[0];

    return {
      name: firstSuggestion.name,
      scientific_name: firstSuggestion.name,
      confidence: firstSuggestion.probability,
      description: `${firstSuggestion.name} (Scientific name: ${firstSuggestion.name})`,
      similar_images: firstSuggestion.similar_images || [],
      details: {
        common_names: [],
        url: firstSuggestion.similar_images?.[0]?.url || "",
        description: firstSuggestion.name,
      },
    };
  } catch (error) {
    console.error("Error identifying plant:", error);
    throw error;
  }
}
