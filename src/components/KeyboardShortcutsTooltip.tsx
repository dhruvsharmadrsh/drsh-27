import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X, Command, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ShortcutItem {
  keys: string[];
  description: string;
  category: "general" | "editing" | "canvas" | "layers";
}

const shortcuts: ShortcutItem[] = [
  // General
  { keys: ["Ctrl", "S"], description: "Save project", category: "general" },
  { keys: ["Ctrl", "E"], description: "Export", category: "general" },
  { keys: ["Esc"], description: "Deselect all", category: "general" },
  
  // Editing
  { keys: ["Ctrl", "Z"], description: "Undo", category: "editing" },
  { keys: ["Ctrl", "Shift", "Z"], description: "Redo", category: "editing" },
  { keys: ["Ctrl", "C"], description: "Copy", category: "editing" },
  { keys: ["Ctrl", "V"], description: "Paste", category: "editing" },
  { keys: ["Ctrl", "X"], description: "Cut", category: "editing" },
  { keys: ["Ctrl", "D"], description: "Duplicate", category: "editing" },
  
  // Canvas
  { keys: ["Delete"], description: "Delete selected", category: "canvas" },
  { keys: ["Ctrl", "A"], description: "Select all", category: "canvas" },
  
  // Layers
  { keys: ["Ctrl", "]"], description: "Bring forward", category: "layers" },
  { keys: ["Ctrl", "["], description: "Send backward", category: "layers" },
];

const categoryLabels: Record<string, string> = {
  general: "General",
  editing: "Editing",
  canvas: "Canvas",
  layers: "Layers",
};

const KeyBadge = ({ keyName }: { keyName: string }) => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  // Replace Ctrl with Cmd on Mac
  const displayKey = isMac && keyName === "Ctrl" ? "⌘" : keyName;
  const isModifier = ["Ctrl", "Shift", "Alt"].includes(keyName);
  
  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center justify-center min-w-[28px] h-7 px-2 
        text-xs font-semibold rounded-md
        bg-secondary/80 border border-border/60
        text-foreground/90 shadow-sm
        ${isModifier ? 'bg-accent/20 border-accent/30 text-accent' : ''}
      `}
    >
      {displayKey === "⌘" && <Command className="w-3 h-3" />}
      {displayKey === "Shift" && <ArrowUp className="w-3 h-3" />}
      {displayKey !== "⌘" && displayKey !== "Shift" && displayKey}
    </motion.span>
  );
};

export const KeyboardShortcutsTooltip = () => {
  const [open, setOpen] = useState(false);
  
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon-sm"
          className="hover:bg-muted/50 relative group"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4 transition-transform group-hover:scale-110" />
          <motion.span 
            initial={false}
            animate={{ scale: open ? 0 : 1 }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl"
        align="end"
        sideOffset={8}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-highlight/20 flex items-center justify-center">
                  <Keyboard className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Keyboard Shortcuts</h3>
                  <p className="text-xs text-muted-foreground">Speed up your workflow</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={() => setOpen(false)}
                className="h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Shortcuts list */}
            <div className="p-3 max-h-[400px] overflow-y-auto space-y-4">
              {Object.entries(groupedShortcuts).map(([category, items], categoryIndex) => (
                <motion.div 
                  key={category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    {categoryLabels[category]}
                  </h4>
                  <div className="space-y-1">
                    {items.map((shortcut, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                      >
                        <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <KeyBadge key={keyIndex} keyName={key} />
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer tip */}
            <div className="p-3 border-t border-border/50 bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">
                Press <KeyBadge keyName="Ctrl" /> + key on Windows, <KeyBadge keyName="⌘" /> + key on Mac
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
};

export default KeyboardShortcutsTooltip;
