import { useCallback } from 'react';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';
import type { CreativeFormat } from '@/store/creativeStore';
import { toast } from 'sonner';

type ObjectRole = 'background' | 'logo' | 'cta' | 'product' | 'headline' | 'text' | 'shape';
type AnchorPoint = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'bottom-center' | 'top-center';

interface ObjectMetadata {
  role: ObjectRole;
  anchor: AnchorPoint;
  relativePosition: { x: number; y: number };
  relativeSize: { width: number; height: number };
}

// Detect object role based on properties and position
const detectObjectRole = (
  obj: FabricObject,
  canvasWidth: number,
  canvasHeight: number
): ObjectRole => {
  const objLeft = obj.left || 0;
  const objTop = obj.top || 0;
  const objWidth = (obj.width || 0) * (obj.scaleX || 1);
  const objHeight = (obj.height || 0) * (obj.scaleY || 1);

  // Background: covers most of canvas
  if (objWidth >= canvasWidth * 0.9 && objHeight >= canvasHeight * 0.9) {
    return 'background';
  }

  // Logo: small, in corners
  if (objWidth < canvasWidth * 0.2 && objHeight < canvasHeight * 0.15) {
    if (objTop < canvasHeight * 0.15 || objTop > canvasHeight * 0.85) {
      return 'logo';
    }
  }

  // CTA: bottom of canvas, button-like dimensions
  if (objTop > canvasHeight * 0.7 && objHeight < canvasHeight * 0.15) {
    return 'cta';
  }

  // Text objects
  if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
    const fontSize = (obj as any).fontSize || 16;
    if (fontSize > 24) return 'headline';
    return 'text';
  }

  // Image in center area = product
  if (obj.type === 'image') {
    const centerX = objLeft + objWidth / 2;
    const centerY = objTop + objHeight / 2;
    if (
      centerX > canvasWidth * 0.25 &&
      centerX < canvasWidth * 0.75 &&
      centerY > canvasHeight * 0.2 &&
      centerY < canvasHeight * 0.8
    ) {
      return 'product';
    }
  }

  return 'shape';
};

// Determine anchor point based on position
const detectAnchorPoint = (
  obj: FabricObject,
  canvasWidth: number,
  canvasHeight: number
): AnchorPoint => {
  const objLeft = obj.left || 0;
  const objTop = obj.top || 0;
  const objWidth = (obj.width || 0) * (obj.scaleX || 1);
  const objHeight = (obj.height || 0) * (obj.scaleY || 1);
  
  const centerX = objLeft + objWidth / 2;
  const centerY = objTop + objHeight / 2;

  // Determine horizontal position
  const isLeft = centerX < canvasWidth * 0.33;
  const isRight = centerX > canvasWidth * 0.67;
  const isCenterH = !isLeft && !isRight;

  // Determine vertical position
  const isTop = centerY < canvasHeight * 0.33;
  const isBottom = centerY > canvasHeight * 0.67;

  if (isTop && isLeft) return 'top-left';
  if (isTop && isRight) return 'top-right';
  if (isTop && isCenterH) return 'top-center';
  if (isBottom && isLeft) return 'bottom-left';
  if (isBottom && isRight) return 'bottom-right';
  if (isBottom && isCenterH) return 'bottom-center';
  
  return 'center';
};

// Calculate new position based on anchor and format change
const calculateNewPosition = (
  metadata: ObjectMetadata,
  obj: FabricObject,
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number
): { left: number; top: number; scaleX: number; scaleY: number } => {
  const scaleFactorX = newWidth / oldWidth;
  const scaleFactorY = newHeight / oldHeight;
  
  const objWidth = (obj.width || 0) * (obj.scaleX || 1);
  const objHeight = (obj.height || 0) * (obj.scaleY || 1);

  let newLeft = 0;
  let newTop = 0;
  let newScaleX = obj.scaleX || 1;
  let newScaleY = obj.scaleY || 1;

  switch (metadata.role) {
    case 'background':
      // Scale to fill new canvas
      const bgScaleX = newWidth / (obj.width || 1);
      const bgScaleY = newHeight / (obj.height || 1);
      const bgScale = Math.max(bgScaleX, bgScaleY);
      newScaleX = bgScale;
      newScaleY = bgScale;
      newLeft = 0;
      newTop = 0;
      break;

    case 'logo':
      // Maintain absolute position from anchor corner
      const margin = 20;
      if (metadata.anchor === 'top-left') {
        newLeft = margin;
        newTop = margin;
      } else if (metadata.anchor === 'top-right') {
        newLeft = newWidth - objWidth - margin;
        newTop = margin;
      } else if (metadata.anchor === 'bottom-left') {
        newLeft = margin;
        newTop = newHeight - objHeight - margin;
      } else {
        newLeft = newWidth - objWidth - margin;
        newTop = newHeight - objHeight - margin;
      }
      break;

    case 'cta':
      // Anchor to bottom center, maintain size
      newLeft = (newWidth - objWidth) / 2;
      newTop = newHeight - objHeight - 30;
      break;

    case 'product':
      // Scale proportionally and center
      const productScale = Math.min(scaleFactorX, scaleFactorY);
      newScaleX = (obj.scaleX || 1) * productScale;
      newScaleY = (obj.scaleY || 1) * productScale;
      const newProductWidth = (obj.width || 0) * newScaleX;
      const newProductHeight = (obj.height || 0) * newScaleY;
      newLeft = (newWidth - newProductWidth) / 2;
      newTop = (newHeight - newProductHeight) / 2;
      break;

    case 'headline':
    case 'text':
      // Scale font and reposition proportionally
      const textScale = Math.min(scaleFactorX, scaleFactorY);
      const textObj = obj as any;
      if (textObj.fontSize) {
        textObj.set('fontSize', textObj.fontSize * textScale);
      }
      newLeft = (obj.left || 0) * scaleFactorX;
      newTop = (obj.top || 0) * scaleFactorY;
      break;

    default:
      // Proportional scaling for shapes
      newLeft = (obj.left || 0) * scaleFactorX;
      newTop = (obj.top || 0) * scaleFactorY;
      newScaleX = (obj.scaleX || 1) * scaleFactorX;
      newScaleY = (obj.scaleY || 1) * scaleFactorY;
      break;
  }

  return { left: newLeft, top: newTop, scaleX: newScaleX, scaleY: newScaleY };
};

// Validate and nudge objects out of safe zones
const validateSafeZones = (
  obj: FabricObject,
  metadata: ObjectMetadata,
  canvasHeight: number,
  topSafeZone: number = 200,
  bottomSafeZone: number = 250
): { left: number; top: number } => {
  const objTop = obj.top || 0;
  const objHeight = (obj.height || 0) * (obj.scaleY || 1);
  const objBottom = objTop + objHeight;

  let newTop = objTop;

  // Don't move background, CTA, or logo
  if (metadata.role === 'background') {
    return { left: obj.left || 0, top: objTop };
  }

  // Nudge out of top safe zone
  if (objTop < topSafeZone && metadata.role !== 'logo') {
    newTop = topSafeZone + 10;
  }

  // Nudge out of bottom safe zone
  const bottomSafeStart = canvasHeight - bottomSafeZone;
  if (objBottom > bottomSafeStart && metadata.role !== 'cta') {
    newTop = bottomSafeStart - objHeight - 10;
  }

  return { left: obj.left || 0, top: newTop };
};

export const useFormatResize = (fabricCanvas: FabricCanvas | null) => {
  const resizeToFormat = useCallback((
    oldFormat: CreativeFormat,
    newFormat: CreativeFormat
  ): boolean => {
    if (!fabricCanvas) return false;

    const objects = fabricCanvas.getObjects();
    if (objects.length === 0) return true;

    const oldWidth = fabricCanvas.getWidth();
    const oldHeight = fabricCanvas.getHeight();
    
    // Calculate new canvas dimensions (maintaining aspect ratio within container)
    const containerWidth = 800;
    const containerHeight = 600;
    const newFormatRatio = newFormat.width / newFormat.height;
    const containerRatio = containerWidth / containerHeight;

    let newCanvasWidth, newCanvasHeight;
    if (newFormatRatio > containerRatio) {
      newCanvasWidth = Math.min(containerWidth, 800);
      newCanvasHeight = newCanvasWidth / newFormatRatio;
    } else {
      newCanvasHeight = Math.min(containerHeight, 600);
      newCanvasWidth = newCanvasHeight * newFormatRatio;
    }

    try {
      // Analyze all objects
      const objectsData: { obj: FabricObject; metadata: ObjectMetadata }[] = [];
      
      for (const obj of objects) {
        const role = detectObjectRole(obj, oldWidth, oldHeight);
        const anchor = detectAnchorPoint(obj, oldWidth, oldHeight);
        
        const metadata: ObjectMetadata = {
          role,
          anchor,
          relativePosition: {
            x: (obj.left || 0) / oldWidth,
            y: (obj.top || 0) / oldHeight,
          },
          relativeSize: {
            width: ((obj.width || 0) * (obj.scaleX || 1)) / oldWidth,
            height: ((obj.height || 0) * (obj.scaleY || 1)) / oldHeight,
          },
        };
        
        objectsData.push({ obj, metadata });
      }

      // Resize canvas
      fabricCanvas.setDimensions({
        width: newCanvasWidth,
        height: newCanvasHeight,
      });

      // Reposition all objects
      for (const { obj, metadata } of objectsData) {
        const newPos = calculateNewPosition(
          metadata,
          obj,
          oldWidth,
          oldHeight,
          newCanvasWidth,
          newCanvasHeight
        );

        obj.set({
          left: newPos.left,
          top: newPos.top,
          scaleX: newPos.scaleX,
          scaleY: newPos.scaleY,
        });

        // Validate safe zones
        const safePos = validateSafeZones(obj, metadata, newCanvasHeight);
        obj.set({ top: safePos.top });

        obj.setCoords();
      }

      fabricCanvas.renderAll();
      toast.success(`Resized to ${newFormat.name}`);
      return true;
    } catch (error) {
      console.error('Failed to resize format:', error);
      toast.error('Failed to resize format');
      return false;
    }
  }, [fabricCanvas]);

  return { resizeToFormat };
};
