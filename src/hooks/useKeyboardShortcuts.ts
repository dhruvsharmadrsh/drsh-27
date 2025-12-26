import { useEffect, useCallback } from "react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import { toast } from "sonner";

interface KeyboardShortcutsOptions {
  canvas: FabricCanvas | null;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport?: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useKeyboardShortcuts({
  canvas,
  onUndo,
  onRedo,
  onSave,
  onExport,
  canUndo,
  canRedo,
}: KeyboardShortcutsOptions) {
  const clipboardRef = { current: null as FabricObject | null };

  const handleCopy = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone().then((cloned: FabricObject) => {
        clipboardRef.current = cloned;
        toast.success("Copied to clipboard");
      });
    }
  }, [canvas]);

  const handlePaste = useCallback(() => {
    if (!canvas || !clipboardRef.current) return;
    
    clipboardRef.current.clone().then((cloned: FabricObject) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      toast.success("Pasted");
    });
  }, [canvas]);

  const handleDelete = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      toast.success(`Deleted ${activeObjects.length} object${activeObjects.length > 1 ? 's' : ''}`);
    }
  }, [canvas]);

  const handleDuplicate = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.clone().then((cloned: FabricObject) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        toast.success("Duplicated");
      });
    }
  }, [canvas]);

  const handleSelectAll = useCallback(() => {
    if (!canvas) return;
    canvas.discardActiveObject();
    const allObjects = canvas.getObjects();
    if (allObjects.length > 0) {
      const selection = new (window as any).fabric.ActiveSelection(allObjects, { canvas });
      canvas.setActiveObject(selection);
      canvas.renderAll();
    }
  }, [canvas]);

  const handleBringForward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.bringObjectForward(activeObject);
      canvas.renderAll();
    }
  }, [canvas]);

  const handleSendBackward = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.sendObjectBackwards(activeObject);
      canvas.renderAll();
    }
  }, [canvas]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((modKey && e.shiftKey && e.key === 'z') || (modKey && e.key === 'y')) {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (modKey && e.key === 'c') {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (modKey && e.key === 'v') {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Cut: Ctrl/Cmd + X
      if (modKey && e.key === 'x') {
        e.preventDefault();
        handleCopy();
        handleDelete();
        return;
      }

      // Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (modKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // Select All: Ctrl/Cmd + A
      if (modKey && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      // Save: Ctrl/Cmd + S
      if (modKey && e.key === 's') {
        e.preventDefault();
        onSave();
        return;
      }

      // Export: Ctrl/Cmd + E
      if (modKey && e.key === 'e' && onExport) {
        e.preventDefault();
        onExport();
        return;
      }

      // Bring Forward: Ctrl/Cmd + ]
      if (modKey && e.key === ']') {
        e.preventDefault();
        handleBringForward();
        return;
      }

      // Send Backward: Ctrl/Cmd + [
      if (modKey && e.key === '[') {
        e.preventDefault();
        handleSendBackward();
        return;
      }

      // Escape: Deselect
      if (e.key === 'Escape') {
        canvas?.discardActiveObject();
        canvas?.renderAll();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canvas, canUndo, canRedo, onUndo, onRedo, onSave, onExport,
    handleCopy, handlePaste, handleDelete, handleDuplicate, handleSelectAll,
    handleBringForward, handleSendBackward
  ]);

  return {
    copy: handleCopy,
    paste: handlePaste,
    delete: handleDelete,
    duplicate: handleDuplicate,
    selectAll: handleSelectAll,
  };
}
