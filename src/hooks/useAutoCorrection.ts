import { useCallback } from "react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import { toast } from "sonner";

interface SafeZone {
  id: string;
  name: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Color utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const parseColor = (color: string): [number, number, number] => {
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
    if (color.startsWith("rgb")) {
      const match = color.match(/\d+/g);
      if (match) return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
    }
    return [0, 0, 0];
  };

  const [r1, g1, b1] = parseColor(color1);
  const [r2, g2, b2] = parseColor(color2);

  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function adjustColorForContrast(textColor: string, bgColor: string, minContrast: number): string {
  const textRgb = hexToRgb(textColor);
  const bgRgb = hexToRgb(bgColor);
  
  if (!textRgb || !bgRgb) return textColor;

  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const isLightBg = bgLuminance > 0.5;

  // For light backgrounds, darken the text; for dark backgrounds, lighten it
  let r = textRgb.r, g = textRgb.g, b = textRgb.b;
  let iterations = 0;
  const maxIterations = 50;
  
  while (getContrastRatio(rgbToHex(r, g, b), bgColor) < minContrast && iterations < maxIterations) {
    if (isLightBg) {
      // Darken
      r = Math.max(0, r - 10);
      g = Math.max(0, g - 10);
      b = Math.max(0, b - 10);
    } else {
      // Lighten
      r = Math.min(255, r + 10);
      g = Math.min(255, g + 10);
      b = Math.min(255, b + 10);
    }
    iterations++;
  }

  return rgbToHex(r, g, b);
}

export function useAutoCorrection(canvas: FabricCanvas | null, safeZones: SafeZone[]) {
  // Fix safe zone violations by nudging elements
  const fixSafeZoneViolations = useCallback(() => {
    if (!canvas) return 0;

    const canvasHeight = canvas.getHeight();
    const canvasWidth = canvas.getWidth();
    const objects = canvas.getObjects();
    let fixedCount = 0;

    objects.forEach((obj: FabricObject) => {
      const bounds = obj.getBoundingRect();
      const objType = obj.type || "";
      
      // Skip backgrounds
      if (
        objType === "image" && 
        bounds.width >= canvasWidth * 0.9 && 
        bounds.height >= canvasHeight * 0.9
      ) {
        return;
      }

      safeZones.forEach((zone) => {
        // Top safe zone
        if (zone.bottom > 0 && bounds.top < zone.bottom) {
          const newTop = zone.bottom + 10;
          obj.set({ top: newTop });
          fixedCount++;
        }

        // Bottom safe zone (zone.right represents bottom height in the current schema)
        if (zone.right > 0) {
          const bottomZoneTop = canvasHeight - zone.right;
          if (bounds.top + bounds.height > bottomZoneTop) {
            const newTop = bottomZoneTop - bounds.height - 10;
            obj.set({ top: Math.max(0, newTop) });
            fixedCount++;
          }
        }
      });
    });

    if (fixedCount > 0) {
      canvas.renderAll();
    }
    
    return fixedCount;
  }, [canvas, safeZones]);

  // Fix color contrast issues
  const fixContrastIssues = useCallback(() => {
    if (!canvas) return 0;

    const backgroundColor = (canvas.backgroundColor as string) || "#ffffff";
    const objects = canvas.getObjects();
    let fixedCount = 0;

    objects.forEach((obj: FabricObject) => {
      const objType = obj.type || "";
      
      if (objType === "i-text" || objType === "text" || objType === "textbox") {
        const textObj = obj as any;
        const textColor = (textObj.fill as string) || "#000000";
        const fontSize = textObj.fontSize || 16;
        const minContrast = fontSize >= 18 ? 3 : 4.5;

        const currentContrast = getContrastRatio(textColor, backgroundColor);
        
        if (currentContrast < minContrast) {
          const newColor = adjustColorForContrast(textColor, backgroundColor, minContrast);
          textObj.set("fill", newColor);
          fixedCount++;
        }
      }
    });

    if (fixedCount > 0) {
      canvas.renderAll();
    }

    return fixedCount;
  }, [canvas]);

  // Fix all compliance issues
  const autoFixAll = useCallback(() => {
    const zonesFixed = fixSafeZoneViolations();
    const contrastFixed = fixContrastIssues();
    const totalFixed = zonesFixed + contrastFixed;

    if (totalFixed > 0) {
      toast.success(`Auto-fixed ${totalFixed} issue${totalFixed > 1 ? 's' : ''}`);
    } else {
      toast.info("No issues to fix");
    }

    return totalFixed;
  }, [fixSafeZoneViolations, fixContrastIssues]);

  return {
    fixSafeZoneViolations,
    fixContrastIssues,
    autoFixAll,
  };
}
