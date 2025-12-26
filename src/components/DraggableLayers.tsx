import { useState, useCallback } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { 
  Square, Circle, Type, Image, GripVertical, 
  Eye, EyeOff, Lock, Unlock, Trash2, Copy 
} from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LayerItem {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
  object: any;
}

interface DraggableLayersProps {
  canvas: FabricCanvas | null;
  onUpdate: () => void;
}

const getLayerIcon = (type: string) => {
  switch (type) {
    case "rect":
      return <Square className="w-4 h-4" />;
    case "circle":
      return <Circle className="w-4 h-4" />;
    case "i-text":
    case "text":
    case "textbox":
      return <Type className="w-4 h-4" />;
    case "image":
      return <Image className="w-4 h-4" />;
    default:
      return <Square className="w-4 h-4" />;
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case "rect":
      return "text-indigo-400";
    case "circle":
      return "text-pink-400";
    case "i-text":
    case "text":
    case "textbox":
      return "text-emerald-400";
    case "image":
      return "text-amber-400";
    default:
      return "text-muted-foreground";
  }
};

const getLayerName = (obj: any, index: number) => {
  if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
    const text = obj.text?.substring(0, 20) || "Text";
    return text.length >= 20 ? text + "..." : text;
  }
  return `${obj.type?.charAt(0).toUpperCase() || ""}${obj.type?.slice(1) || "Object"} ${index + 1}`;
};

export const DraggableLayers = ({ canvas, onUpdate }: DraggableLayersProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getLayers = useCallback((): LayerItem[] => {
    if (!canvas) return [];
    return canvas.getObjects().map((obj, index) => ({
      id: `layer-${index}`,
      type: obj.type || "object",
      name: getLayerName(obj, index),
      visible: obj.visible !== false,
      locked: obj.selectable === false,
      object: obj,
    }));
  }, [canvas]);

  const [layers, setLayers] = useState<LayerItem[]>(getLayers());

  // Update layers when canvas changes
  const refreshLayers = useCallback(() => {
    setLayers(getLayers());
  }, [getLayers]);

  // Handle reorder
  const handleReorder = (newLayers: LayerItem[]) => {
    if (!canvas) return;
    
    setLayers(newLayers);
    
    // Reorder objects in fabric canvas by removing and re-adding in new order
    const objects = [...canvas.getObjects()];
    
    // Clear and re-add in new order
    objects.forEach(obj => canvas.remove(obj));
    newLayers.forEach(layer => {
      canvas.add(layer.object);
    });
    
    canvas.renderAll();
    onUpdate();
    toast.success("Layer order updated");
  };

  // Toggle visibility
  const toggleVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;
    
    layer.object.set("visible", !layer.visible);
    canvas.renderAll();
    refreshLayers();
    onUpdate();
  };

  // Toggle lock
  const toggleLock = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;
    
    layer.object.set({
      selectable: layer.locked,
      evented: layer.locked,
    });
    canvas.renderAll();
    refreshLayers();
    onUpdate();
  };

  // Delete layer
  const deleteLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;
    
    canvas.remove(layer.object);
    canvas.renderAll();
    refreshLayers();
    onUpdate();
    toast.success("Layer deleted");
  };

  // Duplicate layer
  const duplicateLayer = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return;
    
    try {
      const cloned = await layer.object.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      refreshLayers();
      onUpdate();
      toast.success("Layer duplicated");
    } catch (error) {
      console.error("Error duplicating layer:", error);
    }
  };

  // Select layer
  const selectLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas || layer.locked) return;
    
    canvas.setActiveObject(layer.object);
    canvas.renderAll();
  };

  const isActive = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !canvas) return false;
    return canvas.getActiveObject() === layer.object;
  };

  if (layers.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-4">
          <Square className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No layers yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Add shapes or text to get started</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title">Canvas Layers</h3>
        <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
          {layers.length} items
        </span>
      </div>
      
      <Reorder.Group 
        axis="y" 
        values={layers} 
        onReorder={handleReorder}
        className="space-y-2"
      >
        <AnimatePresence mode="popLayout">
          {layers.map((layer) => (
            <Reorder.Item
              key={layer.id}
              value={layer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileDrag={{ 
                scale: 1.02, 
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                zIndex: 50,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25 
              }}
              onMouseEnter={() => setHoveredId(layer.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => selectLayer(layer.id)}
              className={cn(
                "layer-item group cursor-grab active:cursor-grabbing",
                isActive(layer.id) && "active",
                layer.locked && "opacity-60",
                !layer.visible && "opacity-40"
              )}
            >
              {/* Drag Handle */}
              <motion.div 
                className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                <GripVertical className="w-4 h-4" />
              </motion.div>
              
              {/* Icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30 transition-all duration-300",
                getIconColor(layer.type),
                isActive(layer.id) && "bg-accent/20 scale-110"
              )}>
                {getLayerIcon(layer.type)}
              </div>
              
              {/* Name */}
              <span className={cn(
                "flex-1 text-sm font-medium truncate transition-colors",
                isActive(layer.id) ? "text-accent" : "text-foreground"
              )}>
                {layer.name}
              </span>
              
              {/* Actions */}
              <AnimatePresence>
                {(hoveredId === layer.id || isActive(layer.id)) && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-1"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 hover:bg-muted/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(layer.id);
                      }}
                    >
                      {layer.visible ? (
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 hover:bg-muted/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLock(layer.id);
                      }}
                    >
                      {layer.locked ? (
                        <Lock className="w-3.5 h-3.5 text-warning" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 hover:bg-accent/10 hover:text-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateLayer(layer.id);
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[10px] text-muted-foreground/60 text-center mt-4 pt-4 border-t border-border/30"
      >
        Drag layers to reorder • Click to select
      </motion.p>
    </div>
  );
};
