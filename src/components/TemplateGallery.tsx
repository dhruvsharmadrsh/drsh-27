import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Sparkles, Grid, Palette, Loader2, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TemplateSkeleton } from "@/components/TemplateSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { generateTemplateThumbnail, getCachedThumbnail } from "@/utils/templateThumbnailGenerator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  canvas_data: unknown;
  format_width: number;
  format_height: number;
}

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: Template) => void;
}

const categoryOptions = [
  { value: "all", label: "All Templates" },
  { value: "promotional", label: "Promotional" },
  { value: "seasonal", label: "Seasonal" },
  { value: "product-launch", label: "Product Launch" },
];

// Template colors based on their style
const getTemplateGradient = (template: Template): string => {
  const data = template.canvas_data as { backgroundColor?: string; style?: string } | null;
  const style = data?.style || template.name.toLowerCase();
  
  if (style.includes('minimal') || style.includes('premium')) return "from-slate-600 to-slate-800";
  if (style.includes('festive') || style.includes('sale')) return "from-red-500 to-orange-400";
  if (style.includes('product') || style.includes('focus')) return "from-emerald-500 to-teal-600";
  if (style.includes('bold') || style.includes('typography')) return "from-violet-600 to-purple-700";
  if (style.includes('summer') || style.includes('vibes')) return "from-yellow-400 to-orange-500";
  if (style.includes('black') || style.includes('friday')) return "from-gray-900 to-black";
  if (style.includes('arrival') || style.includes('new')) return "from-blue-500 to-cyan-400";
  if (style.includes('holiday') || style.includes('special')) return "from-red-600 to-green-600";
  
  return "from-accent to-highlight";
};

// Get preview text from template
const getTemplatePreviewText = (template: Template): string | null => {
  const data = template.canvas_data as { objects?: Array<{ type: string; text?: string; fontSize?: number }> } | null;
  if (!data?.objects) return null;
  
  const textObj = data.objects.find(obj => 
    (obj.type === 'text' || obj.type === 'i-text') && obj.text && (obj.fontSize || 0) >= 40
  );
  
  return textObj?.text || null;
};

// Template thumbnail component with lazy loading
const TemplateThumbnail = ({ 
  template, 
  gradient 
}: { 
  template: Template; 
  gradient: string;
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const previewText = getTemplatePreviewText(template);

  useEffect(() => {
    // Check cache first
    const cached = getCachedThumbnail(template.id);
    if (cached) {
      setThumbnail(cached);
      return;
    }

    // Generate thumbnail
    const generate = async () => {
      setIsGenerating(true);
      try {
        const dataUrl = await generateTemplateThumbnail(
          template.canvas_data,
          200,
          200,
          template.id
        );
        setThumbnail(dataUrl);
      } catch (error) {
        console.error("Failed to generate thumbnail:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [template.id, template.canvas_data]);

  if (thumbnail) {
    return (
      <motion.img 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        src={thumbnail} 
        alt={template.name}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4`}>
      {isGenerating ? (
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      ) : (
        <>
          <Sparkles className="w-8 h-8 text-white/40 mb-2" />
          {previewText && (
            <p className="text-white/80 text-xs font-medium text-center line-clamp-2">
              {previewText}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export const TemplateGallery = ({ isOpen, onClose, onSelectTemplate }: TemplateGalleryProps) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (user) fetchFavorites();
    }
  }, [isOpen, user]);

  const filterTemplates = useCallback(() => {
    let filtered = [...templates];

    if (showFavoritesOnly) {
      filtered = filtered.filter((t) => favorites.has(t.id));
    }

    if (activeCategory !== "all") {
      filtered = filtered.filter((t) => t.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, activeCategory, showFavoritesOnly, favorites]);

  useEffect(() => {
    filterTemplates();
  }, [filterTemplates]);

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("template_favorites")
      .select("template_id")
      .eq("user_id", user.id);
    
    if (data) {
      setFavorites(new Set(data.map(f => f.template_id)));
    }
  };

  const toggleFavorite = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    const isFavorite = favorites.has(templateId);
    const newFavorites = new Set(favorites);

    if (isFavorite) {
      newFavorites.delete(templateId);
      setFavorites(newFavorites);
      const { error } = await supabase
        .from("template_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("template_id", templateId);
      if (error) {
        newFavorites.add(templateId);
        setFavorites(newFavorites);
        toast.error("Failed to remove favorite");
      } else {
        toast.success("Removed from favorites");
      }
    } else {
      newFavorites.add(templateId);
      setFavorites(newFavorites);
      const { error } = await supabase
        .from("template_favorites")
        .insert({ user_id: user.id, template_id: templateId });
      if (error) {
        newFavorites.delete(templateId);
        setFavorites(newFavorites);
        toast.error("Failed to add favorite");
      } else {
        toast.success("Added to favorites");
      }
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("is_public", true)
      .order("name");

    if (error) {
      console.error("Error fetching templates:", error);
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="overflow-hidden shadow-2xl">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between p-6 border-b border-border/50"
            >
              <div>
                <h2 className="font-display text-xl text-foreground flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Palette className="w-5 h-5 text-accent" />
                  </motion.div>
                  Template Gallery
                </h2>
                <p className="text-sm text-muted-foreground">Choose a template to start your creative</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                <X className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Filters */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4"
            >
              {/* Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                {/* Favorites Filter */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                    showFavoritesOnly
                      ? "bg-rose-500 text-white shadow-md"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
                  Favorites
                </motion.button>
                
                {categoryOptions.map((cat, index) => (
                  <motion.button
                    key={cat.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    onClick={() => setActiveCategory(cat.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      activeCategory === cat.value
                        ? "bg-accent text-accent-foreground shadow-md"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Template Grid */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <TemplateSkeleton count={8} />
              ) : filteredTemplates.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Grid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  </motion.div>
                  <p className="text-muted-foreground">No templates found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or category filters</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredTemplates.map((template, index) => {
                    const gradient = getTemplateGradient(template);
                    
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="group cursor-pointer"
                        onClick={() => onSelectTemplate?.(template)}
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-border/50 group-hover:border-accent/70 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:shadow-accent/10">
                          {/* Template Preview with real thumbnail */}
                          <TemplateThumbnail template={template} gradient={gradient} />
                          
                          {/* Favorite Button */}
                          <motion.button
                            onClick={(e) => toggleFavorite(template.id, e)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors z-10 ${
                              favorites.has(template.id)
                                ? "bg-rose-500 text-white"
                                : "bg-background/80 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${favorites.has(template.id) ? "fill-current" : ""}`} />
                          </motion.button>
                          
                          {/* Hover Overlay */}
                          <motion.div 
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent flex items-end p-3"
                          >
                            <Button variant="ai" size="sm" className="w-full shadow-lg">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Use Template
                            </Button>
                          </motion.div>
                          
                          {/* Format Badge */}
                          <motion.div 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 + 0.1 }}
                            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground"
                          >
                            {template.format_width}×{template.format_height}
                          </motion.div>
                        </div>

                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.15 }}
                          className="mt-2"
                        >
                          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">{template.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground capitalize">{template.category.replace("-", " ")}</span>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TemplateGallery;