import { useCallback } from "react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CanvasCommand {
  action: string;
  parameters?: Record<string, unknown>;
}

interface AIResponse {
  message: string;
  commands: CanvasCommand[];
  error?: string;
}

export function useAICanvasControl(canvas: FabricCanvas | null) {
  // Get simplified canvas state for AI context
  const getCanvasState = useCallback(() => {
    if (!canvas) return { objects: [], width: 0, height: 0 };

    const objects = canvas.getObjects().map((obj) => ({
      type: obj.type,
      left: Math.round(obj.left || 0),
      top: Math.round(obj.top || 0),
      width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
      height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
      fill: obj.fill,
      stroke: obj.stroke,
      opacity: obj.opacity,
    }));

    return {
      objects,
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      backgroundColor: canvas.backgroundColor,
    };
  }, [canvas]);

  // Execute a single command on the canvas
  const executeCommand = useCallback((command: CanvasCommand) => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const params = command.parameters || {};
    const targets = (params.targets as string) || "all";

    // Filter objects based on target
    const getTargetObjects = (): FabricObject[] => {
      if (targets === "selected") {
        const active = canvas.getActiveObjects();
        return active.length > 0 ? active : objects;
      }
      if (targets === "text") {
        return objects.filter((o) => o.type === "i-text" || o.type === "text" || o.type === "textbox");
      }
      if (targets === "shapes") {
        return objects.filter((o) => o.type === "rect" || o.type === "circle" || o.type === "polygon");
      }
      if (targets === "products" || targets === "images") {
        return objects.filter((o) => o.type === "image");
      }
      return objects;
    };

    const targetObjects = getTargetObjects();

    switch (command.action) {
      case "scale": {
        const factor = (params.factor as number) || 1.1;
        targetObjects.forEach((obj) => {
          obj.scale((obj.scaleX || 1) * factor);
        });
        break;
      }

      case "recolor": {
        const fill = params.fill as string | undefined;
        const stroke = params.stroke as string | undefined;
        targetObjects.forEach((obj) => {
          if (fill) obj.set("fill", fill);
          if (stroke) obj.set("stroke", stroke);
        });
        break;
      }

      case "addShadow": {
        const blur = (params.blur as number) || 15;
        const offsetX = (params.offsetX as number) || 5;
        const offsetY = (params.offsetY as number) || 5;
        const color = (params.color as string) || "rgba(0,0,0,0.3)";
        targetObjects.forEach((obj) => {
          obj.set("shadow", { color, blur, offsetX, offsetY });
        });
        break;
      }

      case "removeShadow": {
        targetObjects.forEach((obj) => {
          obj.set("shadow", null);
        });
        break;
      }

      case "changeFontStyle": {
        const fontFamily = params.fontFamily as string | undefined;
        const fontSize = params.fontSize as number | undefined;
        const fontWeight = params.fontWeight as string | undefined;
        targetObjects
          .filter((o) => o.type === "i-text" || o.type === "text")
          .forEach((obj) => {
            if (fontFamily) obj.set("fontFamily", fontFamily);
            if (fontSize) obj.set("fontSize", fontSize);
            if (fontWeight) obj.set("fontWeight", fontWeight);
          });
        break;
      }

      case "adjustOpacity": {
        const opacity = (params.opacity as number) ?? 1;
        targetObjects.forEach((obj) => {
          obj.set("opacity", opacity);
        });
        break;
      }

      case "addBorder": {
        const width = (params.width as number) || 2;
        const color = (params.color as string) || "#000000";
        targetObjects.forEach((obj) => {
          obj.set("stroke", color);
          obj.set("strokeWidth", width);
        });
        break;
      }

      case "roundCorners": {
        const radius = (params.radius as number) || 8;
        targetObjects
          .filter((o) => o.type === "rect")
          .forEach((obj) => {
            obj.set("rx", radius);
            obj.set("ry", radius);
          });
        break;
      }

      case "repositionToCenter": {
        const centerX = canvas.getWidth() / 2;
        const centerY = canvas.getHeight() / 2;
        targetObjects.forEach((obj) => {
          obj.set({
            left: centerX,
            top: centerY,
            originX: "center",
            originY: "center",
          });
        });
        break;
      }

      case "applyPremiumStyle": {
        // Add elegant shadows
        targetObjects.forEach((obj) => {
          obj.set("shadow", {
            color: "rgba(0,0,0,0.25)",
            blur: 20,
            offsetX: 0,
            offsetY: 10,
          });
        });
        // Enhance colors with subtle gold/warm tones
        objects
          .filter((o) => o.type === "i-text" || o.type === "text")
          .forEach((obj) => {
            const currentFill = obj.fill as string;
            if (currentFill === "#020617" || currentFill === "#000000") {
              obj.set("fill", "#1a1a2e");
            }
          });
        // Refine rectangles
        objects
          .filter((o) => o.type === "rect")
          .forEach((obj) => {
            obj.set("rx", 12);
            obj.set("ry", 12);
          });
        break;
      }

      case "applyMinimalStyle": {
        targetObjects.forEach((obj) => {
          obj.set("shadow", null);
          obj.set("strokeWidth", 0);
        });
        objects
          .filter((o) => o.type === "rect")
          .forEach((obj) => {
            obj.set("rx", 4);
            obj.set("ry", 4);
          });
        break;
      }

      case "increaseContrast": {
        // Make dark elements darker, light elements lighter
        targetObjects.forEach((obj) => {
          const fill = obj.fill as string;
          if (fill && fill.includes("rgba")) {
            // Increase opacity in rgba colors
            const newFill = fill.replace(/[\d.]+\)$/, "1)");
            obj.set("fill", newFill);
          }
        });
        break;
      }

      case "addFestiveElements": {
        // Warm up colors for festive feel
        objects
          .filter((o) => o.type === "rect")
          .forEach((obj) => {
            const fill = obj.fill as string;
            if (fill === "#22C55E") {
              obj.set("fill", "#dc2626"); // Red
            }
          });
        // Add warm shadows
        targetObjects.forEach((obj) => {
          obj.set("shadow", {
            color: "rgba(220,38,38,0.2)",
            blur: 25,
            offsetX: 0,
            offsetY: 8,
          });
        });
        break;
      }

      case "makeModern": {
        // Clean geometric look
        objects
          .filter((o) => o.type === "rect")
          .forEach((obj) => {
            obj.set("rx", 8);
            obj.set("ry", 8);
            obj.set("strokeWidth", 1);
            obj.set("stroke", "rgba(255,255,255,0.1)");
          });
        // Modern typography
        objects
          .filter((o) => o.type === "i-text" || o.type === "text")
          .forEach((obj) => {
            obj.set("fontFamily", "Inter");
            obj.set("fontWeight", "600");
          });
        break;
      }

      case "addDepth": {
        // Layer shadows for depth
        targetObjects.forEach((obj, index) => {
          obj.set("shadow", {
            color: `rgba(0,0,0,${0.1 + index * 0.05})`,
            blur: 15 + index * 5,
            offsetX: 0,
            offsetY: 5 + index * 2,
          });
        });
        break;
      }

      default:
        console.warn("Unknown canvas command:", command.action);
    }

    canvas.renderAll();
  }, [canvas]);

  // Send prompt to AI and execute returned commands
  const processAICommand = useCallback(async (prompt: string): Promise<AIResponse> => {
    if (!canvas) {
      return { message: "Canvas not ready", commands: [], error: "No canvas" };
    }

    try {
      const canvasState = getCanvasState();

      const { data, error } = await supabase.functions.invoke("ai-canvas-control", {
        body: { prompt, canvasState },
      });

      if (error) {
        console.error("AI function error:", error);
        throw new Error(error.message || "AI processing failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const response = data as AIResponse;

      // Execute all commands
      if (response.commands && response.commands.length > 0) {
        response.commands.forEach((cmd) => {
          executeCommand(cmd);
        });
        toast.success("Design updated!");
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "AI processing failed";
      toast.error(errorMessage);
      return {
        message: "Sorry, I couldn't process that request. Please try again.",
        commands: [],
        error: errorMessage,
      };
    }
  }, [canvas, getCanvasState, executeCommand]);

  return {
    processAICommand,
    executeCommand,
    getCanvasState,
  };
}
