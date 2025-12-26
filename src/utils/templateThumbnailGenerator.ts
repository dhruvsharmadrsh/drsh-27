import { Canvas as FabricCanvas } from "fabric";

interface CanvasData {
  objects?: unknown[];
  backgroundColor?: string;
}

// Cache for generated thumbnails
const thumbnailCache = new Map<string, string>();

export const generateTemplateThumbnail = async (
  canvasData: unknown,
  width: number = 200,
  height: number = 200,
  templateId?: string
): Promise<string | null> => {
  // Check cache first
  if (templateId && thumbnailCache.has(templateId)) {
    return thumbnailCache.get(templateId) || null;
  }

  try {
    // Create an offscreen canvas element
    const canvasEl = document.createElement("canvas");
    canvasEl.width = width;
    canvasEl.height = height;
    
    // Create Fabric canvas
    const fabricCanvas = new FabricCanvas(canvasEl, {
      width,
      height,
      backgroundColor: "#ffffff",
      renderOnAddRemove: false,
    });

    const data = canvasData as CanvasData;
    
    // Set background color
    if (data?.backgroundColor) {
      fabricCanvas.backgroundColor = data.backgroundColor;
    }

    // Load objects if they exist
    if (data && typeof data === "object" && Array.isArray(data.objects)) {
      // Convert text types to i-text for fabric.js compatibility
      const convertedObjects = data.objects.map((obj: any) => ({
        ...obj,
        type: obj.type === "text" ? "i-text" : obj.type,
      }));

      const convertedData = {
        ...data,
        objects: convertedObjects,
      };

      await fabricCanvas.loadFromJSON(convertedData);

      // Scale to fit thumbnail
      const originalWidth = 1080; // Default template width
      const originalHeight = 1080; // Default template height
      const scaleX = width / originalWidth;
      const scaleY = height / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      fabricCanvas.getObjects().forEach((obj) => {
        obj.set({
          left: (obj.left || 0) * scale,
          top: (obj.top || 0) * scale,
          scaleX: (obj.scaleX || 1) * scale,
          scaleY: (obj.scaleY || 1) * scale,
        });
        obj.setCoords();
      });
    }

    fabricCanvas.renderAll();

    // Convert to data URL
    const dataUrl = canvasEl.toDataURL("image/png", 0.8);

    // Cache the result
    if (templateId) {
      thumbnailCache.set(templateId, dataUrl);
    }

    // Clean up
    fabricCanvas.dispose();

    return dataUrl;
  } catch (error) {
    console.error("Failed to generate thumbnail:", error);
    return null;
  }
};

export const clearThumbnailCache = () => {
  thumbnailCache.clear();
};

export const getCachedThumbnail = (templateId: string): string | null => {
  return thumbnailCache.get(templateId) || null;
};
