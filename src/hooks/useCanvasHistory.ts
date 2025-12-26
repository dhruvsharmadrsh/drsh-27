import { useState, useCallback, useRef, useEffect } from "react";
import type { Canvas as FabricCanvas } from "fabric";

interface HistoryState {
  json: string;
  timestamp: number;
}

export function useCanvasHistory(canvas: FabricCanvas | null, maxHistory: number = 50) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);
  const isApplyingRef = useRef(false);

  // Save current state to history
  const saveState = useCallback(() => {
    if (!canvas || isApplyingRef.current) return;

    const json = JSON.stringify(canvas.toJSON());
    const state: HistoryState = { json, timestamp: Date.now() };

    // Remove any redo states
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push(state);
    currentIndexRef.current = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > maxHistory) {
      historyRef.current.shift();
      currentIndexRef.current--;
    }

    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(false);
  }, [canvas, maxHistory]);

  // Undo to previous state
  const undo = useCallback(async () => {
    if (!canvas || currentIndexRef.current <= 0) return;

    isApplyingRef.current = true;
    currentIndexRef.current--;
    
    const state = historyRef.current[currentIndexRef.current];
    if (state) {
      await canvas.loadFromJSON(JSON.parse(state.json));
      canvas.renderAll();
    }

    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    
    setTimeout(() => {
      isApplyingRef.current = false;
    }, 100);
  }, [canvas]);

  // Redo to next state
  const redo = useCallback(async () => {
    if (!canvas || currentIndexRef.current >= historyRef.current.length - 1) return;

    isApplyingRef.current = true;
    currentIndexRef.current++;
    
    const state = historyRef.current[currentIndexRef.current];
    if (state) {
      await canvas.loadFromJSON(JSON.parse(state.json));
      canvas.renderAll();
    }

    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    
    setTimeout(() => {
      isApplyingRef.current = false;
    }, 100);
  }, [canvas]);

  // Clear history
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  // Setup canvas event listeners
  useEffect(() => {
    if (!canvas) return;

    // Save initial state
    const initialSave = setTimeout(() => saveState(), 200);

    // Save on modifications
    const handleModification = () => saveState();
    
    canvas.on("object:modified", handleModification);
    canvas.on("object:added", handleModification);
    canvas.on("object:removed", handleModification);

    return () => {
      clearTimeout(initialSave);
      canvas.off("object:modified", handleModification);
      canvas.off("object:added", handleModification);
      canvas.off("object:removed", handleModification);
    };
  }, [canvas, saveState]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    saveState,
    clearHistory,
  };
}
