import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Facebook, Instagram, Linkedin, Youtube, Twitter, Phone, Mail, MapPin, Globe, ShoppingCart, Heart, Star, Share2, MessageCircle, Camera, Play, Music, Bookmark, Download, ExternalLink, Send, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useUnifiedAIState } from "@/hooks/useUnifiedAIState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DraggableIconLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onDropIcon: (iconName: string, color: string, x: number, y: number) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

const socialIcons = [
  { name: 'Facebook', icon: Facebook, defaultColor: '#1877F2' },
  { name: 'Instagram', icon: Instagram, defaultColor: '#E4405F' },
  { name: 'LinkedIn', icon: Linkedin, defaultColor: '#0A66C2' },
  { name: 'YouTube', icon: Youtube, defaultColor: '#FF0000' },
  { name: 'Twitter', icon: Twitter, defaultColor: '#1DA1F2' },
  { name: 'WhatsApp', icon: Phone, defaultColor: '#25D366' },
];

const commonIcons = [
  { name: 'Email', icon: Mail, category: 'contact', defaultColor: '#64748B' },
  { name: 'Location', icon: MapPin, category: 'contact', defaultColor: '#64748B' },
  { name: 'Website', icon: Globe, category: 'contact', defaultColor: '#64748B' },
  { name: 'Shopping Cart', icon: ShoppingCart, category: 'action', defaultColor: '#64748B' },
  { name: 'Heart', icon: Heart, category: 'action', defaultColor: '#EF4444' },
  { name: 'Star', icon: Star, category: 'action', defaultColor: '#F59E0B' },
  { name: 'Share', icon: Share2, category: 'action', defaultColor: '#64748B' },
  { name: 'Comment', icon: MessageCircle, category: 'action', defaultColor: '#64748B' },
  { name: 'Camera', icon: Camera, category: 'media', defaultColor: '#64748B' },
  { name: 'Play', icon: Play, category: 'media', defaultColor: '#64748B' },
  { name: 'Music', icon: Music, category: 'media', defaultColor: '#64748B' },
  { name: 'Bookmark', icon: Bookmark, category: 'action', defaultColor: '#64748B' },
  { name: 'Download', icon: Download, category: 'action', defaultColor: '#64748B' },
  { name: 'External Link', icon: ExternalLink, category: 'action', defaultColor: '#64748B' },
  { name: 'Send', icon: Send, category: 'action', defaultColor: '#64748B' },
];

export function DraggableIconLibrary({ isOpen, onClose, onDropIcon, canvasRef }: DraggableIconLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<'brand' | 'original'>('brand');
  const [draggingIcon, setDraggingIcon] = useState<{ name: string; color: string } | null>(null);
  const { brand } = useUnifiedAIState();
  
  const filteredSocialIcons = socialIcons.filter(icon =>
    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredCommonIcons = commonIcons.filter(icon =>
    icon.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, iconName: string, defaultColor: string) => {
    const color = selectedColor === 'brand' ? brand.primaryColor : defaultColor;
    setDraggingIcon({ name: iconName, color });
    e.dataTransfer.setData('application/json', JSON.stringify({ iconName, color }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggingIcon(null);
  };

  const handleIconClick = (iconName: string, defaultColor: string) => {
    const color = selectedColor === 'brand' ? brand.primaryColor : defaultColor;
    // Drop at center of canvas if clicked
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      onDropIcon(iconName, color, centerX, centerY);
    } else {
      onDropIcon(iconName, color, 200, 200);
    }
    toast.success(`Added ${iconName} icon`);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="flex flex-col h-[70vh]">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-border/50">
              <div>
                <h2 className="font-display text-lg sm:text-xl text-foreground">Drag & Drop Icons</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Drag icons directly onto the canvas</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Search & Color Toggle */}
            <div className="flex-shrink-0 p-4 border-b border-border/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search icons..."
                  className="pl-10 bg-muted/30"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={selectedColor === 'brand' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedColor('brand')}
                  className="flex-1"
                >
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: brand.primaryColor }} />
                  Brand Colors
                </Button>
                <Button
                  variant={selectedColor === 'original' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedColor('original')}
                  className="flex-1"
                >
                  Original Colors
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                <GripVertical className="w-3 h-3 inline mr-1" />
                Drag icons to canvas or click to add at center
              </p>
            </div>
            
            {/* Icons Grid */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-6">
                {/* Social Icons */}
                {filteredSocialIcons.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Social Media</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                      {filteredSocialIcons.map((icon) => {
                        const IconComponent = icon.icon;
                        const displayColor = selectedColor === 'brand' ? brand.primaryColor : icon.defaultColor;
                        
                        return (
                          <motion.button
                            key={icon.name}
                            draggable
                            onDragStart={(e) => handleDragStart(e as any, icon.name, icon.defaultColor)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleIconClick(icon.name, icon.defaultColor)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
                              "bg-muted/20 hover:bg-muted/40 border-border/50 hover:border-accent/50",
                              draggingIcon?.name === icon.name && "ring-2 ring-accent"
                            )}
                          >
                            <IconComponent 
                              className="w-6 h-6 sm:w-8 sm:h-8"
                              style={{ color: displayColor }}
                            />
                            <span className="text-[10px] sm:text-xs font-medium">{icon.name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Common Icons */}
                {filteredCommonIcons.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Common Icons</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
                      {filteredCommonIcons.map((icon) => {
                        const IconComponent = icon.icon;
                        const displayColor = selectedColor === 'brand' ? brand.primaryColor : icon.defaultColor;
                        
                        return (
                          <motion.button
                            key={icon.name}
                            draggable
                            onDragStart={(e) => handleDragStart(e as any, icon.name, icon.defaultColor)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleIconClick(icon.name, icon.defaultColor)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
                              "bg-muted/20 hover:bg-muted/40 border-border/50 hover:border-accent/50",
                              draggingIcon?.name === icon.name && "ring-2 ring-accent"
                            )}
                          >
                            <IconComponent 
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              style={{ color: displayColor }}
                            />
                            <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight">{icon.name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
