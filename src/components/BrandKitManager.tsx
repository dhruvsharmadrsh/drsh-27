import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Palette, Type, FileText, Save, Plus, Trash2, Dna, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandKit {
  id?: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  guidelines?: string;
}

interface BrandKitManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBrandKit?: (brandKit: BrandKit) => void;
}

const defaultBrandKit: BrandKit = {
  name: "",
  primary_color: "#22C55E",
  secondary_color: "#38BDF8",
  accent_color: "#F59E0B",
  font_heading: "Inter",
  font_body: "Inter",
  guidelines: "",
};

const fontOptions = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", 
  "Playfair Display", "Poppins", "Raleway", "Source Sans Pro"
];

export const BrandKitManager = ({ isOpen, onClose, onSelectBrandKit }: BrandKitManagerProps) => {
  const { user } = useAuth();
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [currentKit, setCurrentKit] = useState<BrandKit>(defaultBrandKit);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "edit" | "dna">("list");
  
  // Brand DNA state
  const [dnaImagePreview, setDnaImagePreview] = useState<string | null>(null);
  const [dnaAnalyzing, setDnaAnalyzing] = useState(false);
  const [dnaBrandName, setDnaBrandName] = useState("");
  const [extractedKit, setExtractedKit] = useState<BrandKit | null>(null);

  const fetchBrandKits = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("brand_kits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching brand kits:", error);
    } else {
      setBrandKits(data || []);
    }
  }, [user]);

  // Fetch brand kits on mount and when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchBrandKits();
    }
  }, [isOpen, user, fetchBrandKits]);

  const handleLogoUpload = async (file: File) => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("assets")
      .upload(fileName, file);

    if (error) {
      console.error("Error uploading logo:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("assets")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!user || !currentKit.name.trim()) {
      toast.error("Please enter a brand kit name");
      return;
    }

    setIsLoading(true);

    try {
      let logoUrl = currentKit.logo_url;
      
      if (logoFile) {
        logoUrl = await handleLogoUpload(logoFile);
      }

      const brandKitData = {
        ...currentKit,
        logo_url: logoUrl,
        user_id: user.id,
      };

      if (currentKit.id) {
        // Update existing
        const { error } = await supabase
          .from("brand_kits")
          .update(brandKitData)
          .eq("id", currentKit.id);

        if (error) throw error;
        toast.success("Brand kit updated!");
      } else {
        // Create new
        const { error } = await supabase
          .from("brand_kits")
          .insert(brandKitData);

        if (error) throw error;
        toast.success("Brand kit created!");
      }

      fetchBrandKits();
      setActiveTab("list");
      setCurrentKit(defaultBrandKit);
      setLogoFile(null);
    } catch (error) {
      console.error("Error saving brand kit:", error);
      toast.error("Failed to save brand kit");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("brand_kits")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete brand kit");
    } else {
      toast.success("Brand kit deleted");
      fetchBrandKits();
    }
  };

  const handleEdit = (kit: BrandKit) => {
    setCurrentKit(kit);
    setActiveTab("edit");
  };

  // Brand DNA extraction
  const handleDnaImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDnaImagePreview(event.target?.result as string);
        setExtractedKit(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const analyzeBrandDNA = async () => {
    if (!dnaImagePreview) {
      toast.error("Please upload an image first");
      return;
    }

    setDnaAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-brand-dna', {
        body: {
          imageBase64: dnaImagePreview,
          brandName: dnaBrandName
        }
      });

      if (error) throw error;

      const kit: BrandKit = {
        name: dnaBrandName || "Extracted Brand Kit",
        primary_color: data.brandKit?.primary_color || "#22C55E",
        secondary_color: data.brandKit?.secondary_color || "#38BDF8",
        accent_color: data.brandKit?.accent_color || "#F59E0B",
        font_heading: data.brandKit?.font_heading || "Inter",
        font_body: data.brandKit?.font_body || "Inter",
        guidelines: data.brandKit?.guidelines || "",
      };
      
      setExtractedKit(kit);
      toast.success("Brand DNA extracted successfully!");
    } catch (error) {
      console.error("Error analyzing brand:", error);
      toast.error("Failed to analyze brand DNA");
    } finally {
      setDnaAnalyzing(false);
    }
  };

  const applyExtractedKit = () => {
    if (extractedKit && onSelectBrandKit) {
      onSelectBrandKit(extractedKit);
      onClose();
      toast.success("Brand kit applied to canvas!");
    }
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="font-display text-xl text-foreground">Brand Kit Manager</h2>
                <p className="text-sm text-muted-foreground">Manage your brand assets and guidelines</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs - Now includes Brand DNA */}
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setActiveTab("list")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "list"
                    ? "text-accent border-b-2 border-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Kits
              </button>
              <button
                onClick={() => {
                  setActiveTab("edit");
                  if (!currentKit.id) setCurrentKit(defaultBrandKit);
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === "edit"
                    ? "text-accent border-b-2 border-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {currentKit.id ? "Edit" : "Create"}
              </button>
              <button
                onClick={() => setActiveTab("dna")}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === "dna"
                    ? "text-accent border-b-2 border-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Dna className="w-4 h-4" />
                Brand DNA
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === "list" && (
                <div className="space-y-4">
                  {brandKits.length === 0 ? (
                    <div className="text-center py-12">
                      <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No brand kits yet</p>
                      <Button variant="ai" onClick={() => setActiveTab("edit")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Kit
                      </Button>
                    </div>
                  ) : (
                    brandKits.map((kit) => (
                      <div
                        key={kit.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        {kit.logo_url ? (
                          <img src={kit.logo_url} alt={kit.name} className="w-12 h-12 rounded-lg object-contain bg-background" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Palette className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{kit.name}</h3>
                          <div className="flex gap-2 mt-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: kit.primary_color }} />
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: kit.secondary_color }} />
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: kit.accent_color }} />
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(kit)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(kit.id!)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          {onSelectBrandKit && (
                            <Button variant="ai" size="sm" onClick={() => onSelectBrandKit(kit)}>
                              Use
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {activeTab === "edit" && (
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Brand Kit Name</label>
                    <input
                      type="text"
                      value={currentKit.name}
                      onChange={(e) => setCurrentKit({ ...currentKit, name: e.target.value })}
                      placeholder="e.g., My Brand"
                      className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Logo</label>
                    <div className="flex items-center gap-4">
                      {(logoFile || currentKit.logo_url) && (
                        <img
                          src={logoFile ? URL.createObjectURL(logoFile) : currentKit.logo_url}
                          alt="Logo preview"
                          className="w-16 h-16 rounded-lg object-contain bg-muted"
                        />
                      )}
                      <label className="flex-1">
                        <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Upload Logo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Brand Colors</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { key: "primary_color", label: "Primary" },
                        { key: "secondary_color", label: "Secondary" },
                        { key: "accent_color", label: "Accent" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={currentKit[key as keyof BrandKit] as string}
                              onChange={(e) => setCurrentKit({ ...currentKit, [key]: e.target.value })}
                              className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={currentKit[key as keyof BrandKit] as string}
                              onChange={(e) => setCurrentKit({ ...currentKit, [key]: e.target.value })}
                              className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fonts */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Typography</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "font_heading", label: "Heading Font" },
                        { key: "font_body", label: "Body Font" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                          <select
                            value={currentKit[key as keyof BrandKit] as string}
                            onChange={(e) => setCurrentKit({ ...currentKit, [key]: e.target.value })}
                            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                          >
                            {fontOptions.map((font) => (
                              <option key={font} value={font}>{font}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guidelines */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Brand Guidelines</label>
                    <textarea
                      value={currentKit.guidelines || ""}
                      onChange={(e) => setCurrentKit({ ...currentKit, guidelines: e.target.value })}
                      placeholder="Add any specific brand guidelines, tone of voice, or restrictions..."
                      rows={4}
                      className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                    />
                  </div>

                  {/* Save Button */}
                  <Button variant="ai" size="lg" className="w-full" onClick={handleSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Saving..." : currentKit.id ? "Update Brand Kit" : "Create Brand Kit"}
                  </Button>
                </div>
              )}
              {activeTab === "dna" && (
                <div className="space-y-6">
                  {/* Brand DNA Extractor Tab */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Brand Name (optional)
                    </label>
                    <input
                      type="text"
                      value={dnaBrandName}
                      onChange={(e) => setDnaBrandName(e.target.value)}
                      placeholder="e.g., Apple, Nike, Your Brand..."
                      className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Upload Product/Brand Image
                    </label>
                    <div className={`relative border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden ${
                      dnaImagePreview ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                    }`}>
                      {dnaImagePreview ? (
                        <div className="relative aspect-video">
                          <img src={dnaImagePreview} alt="Preview" className="w-full h-full object-contain bg-muted/20" />
                          <button
                            onClick={() => { setDnaImagePreview(null); setExtractedKit(null); }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-destructive/90 flex items-center justify-center text-destructive-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                          <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                          <span className="text-sm text-muted-foreground">Drop an image or click to upload</span>
                          <input type="file" accept="image/*" onChange={handleDnaImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {!extractedKit ? (
                    <Button variant="ai" size="lg" className="w-full" onClick={analyzeBrandDNA} disabled={!dnaImagePreview || dnaAnalyzing}>
                      {dnaAnalyzing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Dna className="w-4 h-4 mr-2" /> Extract Brand DNA</>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-highlight/10 border border-accent/30">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Extracted Brand Kit</h4>
                        <div className="flex gap-2 mb-3">
                          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: extractedKit.primary_color }} />
                          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: extractedKit.secondary_color }} />
                          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: extractedKit.accent_color }} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{extractedKit.font_heading} / {extractedKit.font_body}</p>
                      </div>
                      <Button variant="ai" className="w-full" onClick={applyExtractedKit}>
                        Apply Brand Kit to Canvas
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BrandKitManager;
