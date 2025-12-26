import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, RefreshCw, Copy, Check, Sparkles, 
  Lock, Unlock, Shuffle, Download, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ColorPaletteGeneratorProps {
  onColorSelect?: (color: string) => void;
  baseColor?: string;
}

type HarmonyType = "complementary" | "analogous" | "triadic" | "split-complementary" | "tetradic" | "monochromatic";

interface ColorInfo {
  hex: string;
  name: string;
  locked: boolean;
}

// Color utility functions
const hexToHsl = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getColorName = (hex: string): string => {
  const [h, s, l] = hexToHsl(hex);
  
  if (s < 10) {
    if (l < 20) return "Black";
    if (l > 80) return "White";
    return "Gray";
  }
  
  const hueNames: Record<string, [number, number]> = {
    "Red": [0, 15],
    "Orange": [15, 45],
    "Yellow": [45, 70],
    "Lime": [70, 90],
    "Green": [90, 150],
    "Teal": [150, 180],
    "Cyan": [180, 200],
    "Blue": [200, 250],
    "Indigo": [250, 270],
    "Purple": [270, 290],
    "Magenta": [290, 330],
    "Pink": [330, 360],
  };
  
  for (const [name, [min, max]] of Object.entries(hueNames)) {
    if (h >= min && h < max) {
      if (l < 30) return `Dark ${name}`;
      if (l > 70) return `Light ${name}`;
      return name;
    }
  }
  
  return "Color";
};

const generateHarmony = (baseHex: string, type: HarmonyType): string[] => {
  const [h, s, l] = hexToHsl(baseHex);
  const colors: string[] = [];
  
  switch (type) {
    case "complementary":
      colors.push(baseHex);
      colors.push(hslToHex((h + 180) % 360, s, l));
      colors.push(hslToHex(h, Math.max(s - 20, 0), Math.min(l + 20, 100)));
      colors.push(hslToHex((h + 180) % 360, Math.max(s - 20, 0), Math.max(l - 20, 0)));
      colors.push(hslToHex(h, s, 95));
      break;
      
    case "analogous":
      colors.push(hslToHex((h - 30 + 360) % 360, s, l));
      colors.push(baseHex);
      colors.push(hslToHex((h + 30) % 360, s, l));
      colors.push(hslToHex(h, Math.max(s - 30, 0), Math.min(l + 30, 100)));
      colors.push(hslToHex(h, s, 15));
      break;
      
    case "triadic":
      colors.push(baseHex);
      colors.push(hslToHex((h + 120) % 360, s, l));
      colors.push(hslToHex((h + 240) % 360, s, l));
      colors.push(hslToHex(h, Math.max(s - 40, 0), Math.min(l + 35, 100)));
      colors.push(hslToHex((h + 120) % 360, Math.max(s - 40, 0), Math.max(l - 35, 0)));
      break;
      
    case "split-complementary":
      colors.push(baseHex);
      colors.push(hslToHex((h + 150) % 360, s, l));
      colors.push(hslToHex((h + 210) % 360, s, l));
      colors.push(hslToHex(h, Math.max(s - 25, 0), Math.min(l + 25, 100)));
      colors.push(hslToHex((h + 180) % 360, s, Math.max(l - 40, 0)));
      break;
      
    case "tetradic":
      colors.push(baseHex);
      colors.push(hslToHex((h + 90) % 360, s, l));
      colors.push(hslToHex((h + 180) % 360, s, l));
      colors.push(hslToHex((h + 270) % 360, s, l));
      colors.push(hslToHex(h, 10, 95));
      break;
      
    case "monochromatic":
      colors.push(hslToHex(h, s, Math.max(l - 30, 10)));
      colors.push(hslToHex(h, s, Math.max(l - 15, 20)));
      colors.push(baseHex);
      colors.push(hslToHex(h, Math.max(s - 20, 0), Math.min(l + 15, 90)));
      colors.push(hslToHex(h, Math.max(s - 40, 0), Math.min(l + 30, 95)));
      break;
  }
  
  return colors;
};

const generateRandomColor = (): string => {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 40) + 50; // 50-90%
  const l = Math.floor(Math.random() * 40) + 30; // 30-70%
  return hslToHex(h, s, l);
};

export const ColorPaletteGenerator = ({ onColorSelect, baseColor = "#6366F1" }: ColorPaletteGeneratorProps) => {
  const [inputColor, setInputColor] = useState(baseColor);
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("complementary");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lockedColors, setLockedColors] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  const palette = useMemo(() => {
    const colors = generateHarmony(inputColor, harmonyType);
    return colors.map((hex, index) => ({
      hex,
      name: getColorName(hex),
      locked: lockedColors.has(index),
    }));
  }, [inputColor, harmonyType, lockedColors]);

  const handleCopyColor = async (color: string, index: number) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedIndex(index);
      toast.success("Color copied!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy color");
    }
  };

  const toggleLock = (index: number) => {
    setLockedColors(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const shufflePalette = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      if (!lockedColors.has(0)) {
        setInputColor(generateRandomColor());
      }
      setIsGenerating(false);
    }, 300);
  }, [lockedColors]);

  const handleSelectColor = (color: string) => {
    onColorSelect?.(color);
    toast.success(`Selected ${color}`);
  };

  const exportPalette = () => {
    const text = palette.map(c => `${c.name}: ${c.hex}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Palette exported to clipboard!");
  };

  const harmonyDescriptions: Record<HarmonyType, string> = {
    "complementary": "Colors opposite on the wheel for high contrast",
    "analogous": "Adjacent colors for a harmonious feel",
    "triadic": "Three evenly spaced colors for balance",
    "split-complementary": "Base color + two adjacent to complement",
    "tetradic": "Four colors forming a rectangle",
    "monochromatic": "Variations of a single hue",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-highlight/20 flex items-center justify-center">
            <Palette className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Color Palette</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={shufflePalette}
            title="Shuffle palette"
          >
            <motion.div
              animate={isGenerating ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </motion.div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={exportPalette}
            title="Export palette"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Base Color Input */}
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer overflow-hidden"
          style={{ backgroundColor: inputColor }}
        >
          <input
            type="color"
            value={inputColor}
            onChange={(e) => setInputColor(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={inputColor}
          onChange={(e) => setInputColor(e.target.value)}
          className="flex-1 h-10 bg-muted/30 border-border/50 text-xs font-mono uppercase"
          placeholder="#000000"
        />
      </div>

      {/* Harmony Type Selector */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Harmony Type</label>
        <Select value={harmonyType} onValueChange={(v) => setHarmonyType(v as HarmonyType)}>
          <SelectTrigger className="w-full bg-muted/30 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="complementary">Complementary</SelectItem>
            <SelectItem value="analogous">Analogous</SelectItem>
            <SelectItem value="triadic">Triadic</SelectItem>
            <SelectItem value="split-complementary">Split Complementary</SelectItem>
            <SelectItem value="tetradic">Tetradic</SelectItem>
            <SelectItem value="monochromatic">Monochromatic</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground/70">{harmonyDescriptions[harmonyType]}</p>
      </div>

      {/* Color Palette Display */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${inputColor}-${harmonyType}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="grid gap-2"
          >
            {palette.map((color, index) => (
              <motion.div
                key={`${color.hex}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group flex items-center gap-3 p-2 rounded-xl transition-all duration-300",
                  "bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-accent/30"
                )}
              >
                {/* Color Swatch */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectColor(color.hex)}
                  className="w-12 h-12 rounded-lg border border-border/30 shadow-sm relative overflow-hidden"
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </motion.button>
                
                {/* Color Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{color.name}</p>
                  <p className="text-xs font-mono text-muted-foreground uppercase">{color.hex}</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => toggleLock(index)}
                  >
                    {color.locked ? (
                      <Lock className="w-3.5 h-3.5 text-warning" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => handleCopyColor(color.hex, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Generate */}
      <Button
        variant="ai-outline"
        size="sm"
        className="w-full"
        onClick={shufflePalette}
        disabled={isGenerating}
      >
        <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
        Generate New Palette
      </Button>
    </motion.div>
  );
};
