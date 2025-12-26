import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { removeBackground, loadImage } from "@/utils/backgroundRemoval";

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string, fileName: string) => void;
  type?: "product" | "logo";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const ImageUploader = ({ isOpen, onClose, onImageUploaded, type = "product" }: ImageUploaderProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeBgEnabled, setRemoveBgEnabled] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a valid image file (JPEG, PNG, WebP, or GIF)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 10MB";
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast.error("Please select a file and ensure you're logged in");
      return;
    }

    setIsUploading(true);

    try {
      let fileToUpload: File | Blob = selectedFile;
      let fileName = selectedFile.name;

      // Remove background if enabled
      if (removeBgEnabled) {
        setIsRemovingBg(true);
        toast.info("Removing background... This may take 10-30 seconds");
        
        try {
          const img = await loadImage(selectedFile);
          const processedBlob = await removeBackground(img);
          fileToUpload = processedBlob;
          fileName = selectedFile.name.replace(/\.[^/.]+$/, '') + '_nobg.png';
          toast.success("Background removed!");
        } catch (bgError) {
          console.error("Background removal failed:", bgError);
          toast.error("Background removal failed, uploading original image");
        } finally {
          setIsRemovingBg(false);
        }
      }

      const fileExt = fileName.split(".").pop() || 'png';
      const uploadPath = `${user.id}/${type}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(uploadPath, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("assets")
        .getPublicUrl(uploadPath);

      toast.success("Image uploaded successfully!");
      onImageUploaded(publicUrl, fileName);
      handleReset();
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setSelectedFile(null);
    setRemoveBgEnabled(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassPanel padding="none" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="font-display text-xl text-foreground">
                  Upload {type === "logo" ? "Logo" : "Product Image"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                  ${isDragging 
                    ? "border-accent bg-accent/10" 
                    : "border-border hover:border-accent/50 hover:bg-muted/30"
                  }
                  ${preview ? "border-accent" : ""}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {preview ? (
                  <div className="space-y-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <p className="text-sm text-foreground font-medium">{selectedFile?.name}</p>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleReset(); }}>
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        Drop your {type === "logo" ? "logo" : "product image"} here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, JPG, WebP or GIF up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Background Removal Toggle */}
              {selectedFile && type === "product" && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <Label htmlFor="remove-bg" className="text-sm font-medium text-foreground cursor-pointer">
                        Remove Background
                      </Label>
                      <p className="text-xs text-muted-foreground">AI-powered background removal</p>
                    </div>
                  </div>
                  <Switch
                    id="remove-bg"
                    checked={removeBgEnabled}
                    onCheckedChange={setRemoveBgEnabled}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="ai"
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || isRemovingBg}
                >
                  {isRemovingBg ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Removing BG...
                    </>
                  ) : isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Image className="w-4 h-4 mr-2" />
                      {removeBgEnabled ? "Process & Add" : "Add to Canvas"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
