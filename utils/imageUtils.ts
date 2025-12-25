
/**
 * Fetches an image from a URL (including blob URLs) and converts it to a base64 string.
 * @param imageUrl The URL of the image to convert.
 * @returns A promise that resolves to an object containing the base64 string and its MIME type.
 */
export const imageToBase64 = async (imageUrl: string): Promise<{ base64: string; mimeType: string }> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const mimeType = blob.type;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            const dataUrl = reader.result as string;
            // The result is in the format "data:[<mediatype>];base64,<data>"
            // We need to extract just the base64 part.
            const base64 = dataUrl.split(',')[1];
            if (!base64) {
                 reject(new Error("Could not extract base64 string from data URL."));
                 return;
            }
            resolve({ base64, mimeType });
        };
        reader.readAsDataURL(blob);
    });
};

/**
 * Converts a File object to a Base64 data URL string.
 * @param file The file to convert.
 * @returns A promise that resolves with the Base64 data URL.
 */
export const base64FromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};
