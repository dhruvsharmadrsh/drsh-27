import { useCallback, useMemo } from "react";
import type { Canvas as FabricCanvas } from "fabric";

export interface ComplianceCheck {
  id: string;
  label: string;
  status: "pass" | "warning" | "fail";
  message: string;
  severity: number; // 1-10, higher = more severe
}

export interface SafeZone {
  id: string;
  name: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Prohibited copy patterns (case insensitive)
const PROHIBITED_PATTERNS = [
  { pattern: /\b(\d{1,2}|one|two|three|four|five)\s*%\s*off\b/i, reason: "Discount percentage claims require approval" },
  { pattern: /\blimited\s*(time\s*)?(offer|deal|sale)\b/i, reason: "Limited time claims may be misleading" },
  { pattern: /\bfree\s+(gift|shipping|delivery)\b/i, reason: "'Free' claims require disclosure" },
  { pattern: /\b(best|cheapest|lowest)\s*(price|deal|offer)\b/i, reason: "Superlative claims require substantiation" },
  { pattern: /\bguarantee[d]?\b/i, reason: "Guarantee claims need terms" },
  { pattern: /\bsave\s+\$?\d+/i, reason: "Savings claims require verification" },
  { pattern: /\bact\s+now\b/i, reason: "Urgency tactics may be restricted" },
  { pattern: /\bwhile\s+(supplies|stocks?)\s+(last|available)\b/i, reason: "Scarcity claims need verification" },
  { pattern: /\bno\s+(purchase|obligation)\s*(necessary|required)?\b/i, reason: "Contest terms need disclosure" },
];

// Logo placement rules per platform/retailer
const LOGO_RULES: Record<string, { zones: string[]; maxSize: number; minSize: number }> = {
  "instagram-feed": { zones: ["top-right", "bottom-right"], maxSize: 0.15, minSize: 0.05 },
  "instagram-story": { zones: ["top-right"], maxSize: 0.12, minSize: 0.04 },
  "facebook-feed": { zones: ["top-right", "top-left"], maxSize: 0.18, minSize: 0.06 },
  "in-store": { zones: ["top-right", "top-left", "bottom-right"], maxSize: 0.20, minSize: 0.08 },
};

// WCAG contrast requirements
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
      if (match) {
        return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
      }
    }
    // Default to black if can't parse
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

export interface CanvasAnalysis {
  textElements: Array<{ text: string; fill: string; fontSize: number; left: number; top: number }>;
  logoElements: Array<{ left: number; top: number; width: number; height: number }>;
  allElements: Array<{ type: string; left: number; top: number; width?: number; height?: number }>;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
}

export function useComplianceEngine(formatId: string = "instagram-feed") {
  const safeZones = useMemo<SafeZone[]>(() => {
    // Safe zones vary by format (in pixels, relative to canvas)
    const zones: Record<string, SafeZone[]> = {
      "instagram-feed": [
        { id: "top", name: "Top Safe Zone", top: 0, bottom: 50, left: 0, right: 0 },
        { id: "bottom", name: "Bottom Safe Zone", top: 0, bottom: 0, left: 0, right: 0 },
      ],
      "instagram-story": [
        { id: "top", name: "Top Safe Zone (UI overlap)", top: 0, bottom: 200, left: 0, right: 0 },
        { id: "bottom", name: "Bottom Safe Zone (swipe up)", top: 0, bottom: 0, left: 0, right: 250 },
      ],
      "facebook-feed": [
        { id: "top", name: "Top Safe Zone", top: 0, bottom: 30, left: 0, right: 0 },
      ],
      "in-store": [
        { id: "top", name: "Top Visible Zone", top: 0, bottom: 200, left: 0, right: 0 },
        { id: "bottom", name: "Bottom Visible Zone", top: 0, bottom: 0, left: 0, right: 250 },
      ],
    };
    return zones[formatId] || zones["instagram-feed"];
  }, [formatId]);

  const analyzeCanvas = useCallback((canvas: FabricCanvas | null): CanvasAnalysis | null => {
    if (!canvas) return null;

    const objects = canvas.getObjects();
    const analysis: CanvasAnalysis = {
      textElements: [],
      logoElements: [],
      allElements: [],
      canvasWidth: canvas.getWidth(),
      canvasHeight: canvas.getHeight(),
      backgroundColor: (canvas.backgroundColor as string) || "#ffffff",
    };

    objects.forEach((obj) => {
      const bounds = obj.getBoundingRect();
      
      analysis.allElements.push({
        type: obj.type || "unknown",
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      });

      // Check if it's a text element
      if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
        const textObj = obj as { text?: string; fill?: string; fontSize?: number };
        analysis.textElements.push({
          text: textObj.text || "",
          fill: (textObj.fill as string) || "#000000",
          fontSize: textObj.fontSize || 16,
          left: bounds.left,
          top: bounds.top,
        });
      }

      // Simple heuristic for logo detection (small images in corners)
      if (obj.type === "image") {
        const isInCorner = 
          (bounds.left < analysis.canvasWidth * 0.3 || bounds.left > analysis.canvasWidth * 0.7) &&
          (bounds.top < analysis.canvasHeight * 0.3 || bounds.top > analysis.canvasHeight * 0.7);
        
        if (isInCorner && bounds.width < analysis.canvasWidth * 0.25) {
          analysis.logoElements.push({
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
          });
        }
      }
    });

    return analysis;
  }, []);

  const runComplianceChecks = useCallback((canvas: FabricCanvas | null): ComplianceCheck[] => {
    const checks: ComplianceCheck[] = [];
    const analysis = analyzeCanvas(canvas);

    if (!analysis) {
      return [{ id: "error", label: "Canvas Error", status: "fail", message: "Cannot analyze canvas", severity: 10 }];
    }

    // 1. Prohibited Copy Detection
    let prohibitedFound: string[] = [];
    analysis.textElements.forEach((textEl) => {
      PROHIBITED_PATTERNS.forEach(({ pattern, reason }) => {
        if (pattern.test(textEl.text)) {
          prohibitedFound.push(`"${textEl.text.slice(0, 30)}..." - ${reason}`);
        }
      });
    });

    checks.push({
      id: "prohibited-copy",
      label: "Prohibited copy",
      status: prohibitedFound.length > 0 ? "warning" : "pass",
      message: prohibitedFound.length > 0 
        ? `Found ${prohibitedFound.length} potential issues: ${prohibitedFound[0]}`
        : "No prohibited terms detected",
      severity: prohibitedFound.length > 0 ? 6 : 0,
    });

    // 2. Safe Zones Check
    let safeZoneViolations = 0;
    safeZones.forEach((zone) => {
      const zoneTop = zone.bottom > 0 ? 0 : analysis.canvasHeight - (zone.top || 0);
      const zoneBottom = zone.bottom > 0 ? zone.bottom : analysis.canvasHeight;

      analysis.allElements.forEach((el) => {
        if (el.top >= zoneTop && el.top <= zoneBottom) {
          // Element is in safe zone - check if it's important content
          if (el.type === "i-text" || el.type === "image") {
            safeZoneViolations++;
          }
        }
      });
    });

    checks.push({
      id: "safe-zones",
      label: "Safe zones",
      status: safeZoneViolations > 0 ? "warning" : "pass",
      message: safeZoneViolations > 0
        ? `${safeZoneViolations} element(s) in platform safe zones may be obscured`
        : "All elements clear of platform UI zones",
      severity: safeZoneViolations > 0 ? 4 : 0,
    });

    // 3. Logo Placement Rules
    const logoRules = LOGO_RULES[formatId] || LOGO_RULES["instagram-feed"];
    let logoStatus: "pass" | "warning" | "fail" = "pass";
    let logoMessage = "Logo placement meets guidelines";

    if (analysis.logoElements.length === 0) {
      logoStatus = "warning";
      logoMessage = "No logo detected - consider adding brand identity";
    } else {
      const logo = analysis.logoElements[0];
      const logoSizeRatio = (logo.width * logo.height) / (analysis.canvasWidth * analysis.canvasHeight);
      
      if (logoSizeRatio > logoRules.maxSize) {
        logoStatus = "warning";
        logoMessage = `Logo is too large (${Math.round(logoSizeRatio * 100)}% of canvas, max ${Math.round(logoRules.maxSize * 100)}%)`;
      } else if (logoSizeRatio < logoRules.minSize) {
        logoStatus = "warning";
        logoMessage = `Logo may be too small for visibility (${Math.round(logoSizeRatio * 100)}% of canvas)`;
      }

      // Check position
      const isTopRight = logo.left > analysis.canvasWidth * 0.7 && logo.top < analysis.canvasHeight * 0.3;
      const isTopLeft = logo.left < analysis.canvasWidth * 0.3 && logo.top < analysis.canvasHeight * 0.3;
      const isBottomRight = logo.left > analysis.canvasWidth * 0.7 && logo.top > analysis.canvasHeight * 0.7;
      
      const validPosition = 
        (logoRules.zones.includes("top-right") && isTopRight) ||
        (logoRules.zones.includes("top-left") && isTopLeft) ||
        (logoRules.zones.includes("bottom-right") && isBottomRight);

      if (!validPosition && analysis.logoElements.length > 0) {
        logoStatus = "warning";
        logoMessage = `Logo position should be: ${logoRules.zones.join(" or ")}`;
      }
    }

    checks.push({
      id: "logo-placement",
      label: "Logo placement",
      status: logoStatus,
      message: logoMessage,
      severity: logoStatus === "warning" ? 3 : 0,
    });

    // 4. Color Contrast (WCAG AA = 4.5:1 for normal text, 3:1 for large)
    let contrastIssues = 0;
    analysis.textElements.forEach((textEl) => {
      const contrast = getContrastRatio(textEl.fill, analysis.backgroundColor);
      const minContrast = textEl.fontSize >= 18 ? 3 : 4.5;
      
      if (contrast < minContrast) {
        contrastIssues++;
      }
    });

    checks.push({
      id: "color-contrast",
      label: "Color contrast",
      status: contrastIssues > 0 ? "warning" : "pass",
      message: contrastIssues > 0
        ? `${contrastIssues} text element(s) may have insufficient contrast (WCAG AA)`
        : "All text meets WCAG AA contrast requirements",
      severity: contrastIssues > 0 ? 5 : 0,
    });

    // 5. Text Limits (character count for ads)
    const totalChars = analysis.textElements.reduce((sum, t) => sum + t.text.length, 0);
    const charLimit = formatId.includes("instagram") ? 125 : 280;
    
    checks.push({
      id: "text-limits",
      label: "Text limits",
      status: totalChars > charLimit ? "warning" : "pass",
      message: totalChars > charLimit
        ? `Text exceeds recommended limit (${totalChars}/${charLimit} chars)`
        : `Text within limits (${totalChars}/${charLimit} chars)`,
      severity: totalChars > charLimit ? 3 : 0,
    });

    return checks;
  }, [analyzeCanvas, formatId, safeZones]);

  const calculateScore = useCallback((checks: ComplianceCheck[]): number => {
    if (checks.length === 0) return 100;
    
    const totalSeverity = checks.reduce((sum, c) => sum + c.severity, 0);
    const maxPossibleSeverity = checks.length * 10;
    
    // Score = 100 - (severity percentage)
    const score = Math.round(100 - (totalSeverity / maxPossibleSeverity) * 100);
    return Math.max(0, Math.min(100, score));
  }, []);

  return {
    safeZones,
    runComplianceChecks,
    calculateScore,
    analyzeCanvas,
  };
}
